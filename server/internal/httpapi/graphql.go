package httpapi

import (
	"context"
	"crypto/sha256"
	_ "embed"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/store"
)

//go:embed graphql_schema.graphql
var graphqlSchema string

const (
	maxGraphQLBody  = 16 << 10
	maxGraphQLQuery = 8 << 10
	maxGraphQLDepth = 8
	maxGraphQLFirst = 50
	// A single connection can batch nested records efficiently. Multiple
	// aliases, however, multiply Turso work in one HTTP request and would make
	// an otherwise cheap rate-limit token ineffective.
	maxGraphQLRootFields          = 8
	maxGraphQLPluginDataResolvers = 1
)

var timeNowUTC = func() time.Time { return time.Now().UTC() }

// graphRequest 遵循 GraphQL over HTTP 的标准 JSON 请求外形。当前只支持 query；
// schema 没有 Mutation/Subscription，解析器也会明确拒绝它们。
type graphRequest struct {
	Query         string         `json:"query"`
	OperationName string         `json:"operationName"`
	Variables     map[string]any `json:"variables"`
}

type graphResponse struct {
	Data   map[string]any `json:"data,omitempty"`
	Errors []graphError   `json:"errors,omitempty"`
}

type graphError struct {
	Message string `json:"message"`
}

func (s *Server) handleGraphQL(w http.ResponseWriter, r *http.Request) {
	if s.cache.Get() == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded yet", 0)
		return
	}

	req, err := graphRequestFromHTTP(w, r)
	if err != nil {
		w.Header().Set("Cache-Control", "no-store")
		writeGraphError(w, http.StatusBadRequest, "invalid GraphQL request: "+err.Error())
		return
	}
	if strings.TrimSpace(req.Query) == "" {
		writeGraphError(w, http.StatusBadRequest, "query is required")
		return
	}
	if len(req.Query) > maxGraphQLQuery {
		writeGraphError(w, http.StatusBadRequest, "query exceeds 8192 bytes")
		return
	}

	exec := graphExecutor{source: serverGraphSource{cache: s.cache, st: s.st}}
	data, err := exec.Execute(r.Context(), req.Query, req.OperationName, req.Variables)
	if err != nil {
		// GraphQL 的语法、校验与 resolver 错误放在 errors 数组，HTTP 仍为 200；
		// 传输层 JSON 错误才是 400。这让客户端能统一处理 GraphQL 响应。
		w.Header().Set("Cache-Control", "no-store")
		writeGraphError(w, http.StatusOK, err.Error())
		return
	}
	writeCacheableJSON(w, r, http.StatusOK, graphResponse{Data: data}, publicDataCacheControl)
}

func (s *Server) handleGraphQLSchema(w http.ResponseWriter, r *http.Request) {
	writeCacheableText(w, r, http.StatusOK, graphqlSchema, "application/graphql; charset=utf-8", publicSchemaCacheControl)
}

func graphRequestFromHTTP(w http.ResponseWriter, r *http.Request) (graphRequest, error) {
	if r.Method == http.MethodGet {
		q := r.URL.Query()
		req := graphRequest{Query: q.Get("query"), OperationName: q.Get("operationName")}
		if rawVariables := q.Get("variables"); rawVariables != "" {
			if err := json.Unmarshal([]byte(rawVariables), &req.Variables); err != nil {
				return graphRequest{}, fmt.Errorf("variables must be a JSON object: %w", err)
			}
			if req.Variables == nil {
				return graphRequest{}, fmt.Errorf("variables must be a JSON object")
			}
		}
		return req, nil
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxGraphQLBody)
	var req graphRequest
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(&req); err != nil {
		return graphRequest{}, err
	}
	if err := ensureSingleJSONValue(dec); err != nil {
		return graphRequest{}, err
	}
	return req, nil
}

func writeGraphError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, graphResponse{Errors: []graphError{{Message: message}}})
}

func ensureSingleJSONValue(dec *json.Decoder) error {
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		if err == nil {
			return fmt.Errorf("request body must contain one JSON object")
		}
		return err
	}
	return nil
}

// graphDataSource 把 GraphQL resolver 与实际存储解耦，既避免重复一套字段
// 映射，也让 schema 查询可以用内存快照做确定性的单元测试。
type graphDataSource interface {
	Snapshot() *cache.Snapshot
	PluginI18nBatch(context.Context, []string) (map[string]map[string]store.I18nEntry, error)
	PluginSnapshotsBatch(context.Context, []string) (map[string][]store.SnapshotRow, error)
}

type serverGraphSource struct {
	cache *cache.Cache
	st    *store.Store
}

func (s serverGraphSource) Snapshot() *cache.Snapshot { return s.cache.Get() }
func (s serverGraphSource) PluginI18nBatch(ctx context.Context, fullNames []string) (map[string]map[string]store.I18nEntry, error) {
	return s.st.PluginI18nBatch(ctx, fullNames)
}
func (s serverGraphSource) PluginSnapshotsBatch(ctx context.Context, fullNames []string) (map[string][]store.SnapshotRow, error) {
	return s.st.PluginSnapshotsBatch(ctx, fullNames)
}

type graphExecutor struct{ source graphDataSource }

func (e graphExecutor) Execute(ctx context.Context, query, operationName string, variables map[string]any) (map[string]any, error) {
	doc, err := parseGraphDocument(query)
	if err != nil {
		return nil, err
	}
	op, err := doc.operation(operationName)
	if err != nil {
		return nil, err
	}
	if op.kind != "query" {
		return nil, fmt.Errorf("only query operations are supported")
	}
	snap := e.source.Snapshot()
	if snap == nil {
		return nil, fmt.Errorf("plugin cache is not loaded")
	}
	fields, err := doc.expand(op.selection, nil)
	if err != nil {
		return nil, err
	}
	if err := validateGraphQLRootShape(fields); err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, field := range fields {
		key := field.responseKey()
		if _, exists := result[key]; exists {
			return nil, fmt.Errorf("response key %q is selected more than once", key)
		}
		var value any
		switch field.name {
		case "__typename":
			if err := graphRejectScalarSelection("Query", field); err != nil {
				return nil, err
			}
			value = "Query"
		case "dataset":
			value, err = selectGraphDataset(snap, field, doc)
		case "plugin":
			fullName, err := graphRequiredString(field, "fullName", variables)
			if err != nil {
				return nil, err
			}
			plugin, ok := snap.ByFullName[strings.ToLower(fullName)]
			if !ok {
				value = nil
				break
			}
			prefetch, prefetchErr := e.prefetchPluginFields(ctx, []store.Plugin{*plugin}, field.selection, doc)
			if prefetchErr != nil {
				return nil, prefetchErr
			}
			value, err = e.selectPlugin(*plugin, field.selection, doc, variables, prefetch)
			if err != nil {
				return nil, err
			}
		case "plugins":
			value, err = e.selectPluginConnection(ctx, snap, field, doc, variables)
		case "pluginFacets":
			value, err = selectGraphPluginFacets(snap, field, doc)
			if err != nil {
				return nil, err
			}
		default:
			return nil, fmt.Errorf("Query.%s does not exist", field.name)
		}
		if err != nil {
			return nil, err
		}
		result[key] = value
	}
	return result, nil
}

func validateGraphQLRootShape(fields []graphField) error {
	if len(fields) > maxGraphQLRootFields {
		return fmt.Errorf("query selects too many root fields (maximum %d)", maxGraphQLRootFields)
	}
	pluginDataResolvers := 0
	for _, field := range fields {
		switch field.name {
		case "plugins", "plugin":
			pluginDataResolvers++
		}
	}
	if pluginDataResolvers > maxGraphQLPluginDataResolvers {
		return fmt.Errorf("query may select at most %d plugin data resolver", maxGraphQLPluginDataResolvers)
	}
	return nil
}

func selectGraphDataset(snap *cache.Snapshot, field graphField, doc *graphDocument) (map[string]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("Dataset requires a selection set")
	}
	fields, err := doc.expand(field.selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, child := range fields {
		if err := graphRejectScalarSelection("Dataset", child); err != nil {
			return nil, err
		}
		switch child.name {
		case "__typename":
			result[child.responseKey()] = "Dataset"
		case "dataVersion":
			result[child.responseKey()] = snap.Version
		case "asOf":
			result[child.responseKey()] = snap.AsOf.Format(time.RFC3339)
		default:
			return nil, fmt.Errorf("Dataset.%s does not exist", child.name)
		}
	}
	return result, nil
}

type graphFacet struct {
	Value string
	Count int
}

func selectGraphPluginFacets(snap *cache.Snapshot, field graphField, doc *graphDocument) (map[string]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("PluginFacets requires a selection set")
	}
	fields, err := doc.expand(field.selection, nil)
	if err != nil {
		return nil, err
	}
	values := graphFacetValues(snap.Plugins)
	result := make(map[string]any, len(fields))
	for _, child := range fields {
		key := child.responseKey()
		if _, exists := result[key]; exists {
			return nil, fmt.Errorf("response key %q is selected more than once", key)
		}
		switch child.name {
		case "__typename":
			if err := graphRejectScalarSelection("PluginFacets", child); err != nil {
				return nil, err
			}
			result[key] = "PluginFacets"
		case "categories":
			result[key], err = selectGraphFacetValues(child, values.categories, doc)
		case "languages":
			result[key], err = selectGraphFacetValues(child, values.languages, doc)
		case "tags":
			result[key], err = selectGraphFacetValues(child, values.tags, doc)
		case "grades":
			result[key], err = selectGraphFacetValues(child, values.grades, doc)
		default:
			return nil, fmt.Errorf("PluginFacets.%s does not exist", child.name)
		}
		if err != nil {
			return nil, err
		}
	}
	return result, nil
}

func graphFacetValues(plugins []store.Plugin) struct {
	categories []graphFacet
	languages  []graphFacet
	tags       []graphFacet
	grades     []graphFacet
} {
	counts := map[string]map[string]int{
		"categories": {}, "languages": {}, "tags": {}, "grades": {},
	}
	for _, plugin := range plugins {
		if plugin.Category != "" {
			counts["categories"][plugin.Category]++
		}
		if plugin.Language != "" {
			counts["languages"][plugin.Language]++
		}
		for _, tag := range plugin.Tags {
			if tag != "" {
				counts["tags"][tag]++
			}
		}
		if plugin.Grade != nil {
			counts["grades"][*plugin.Grade]++
		}
	}
	toSortedFacets := func(source map[string]int) []graphFacet {
		out := make([]graphFacet, 0, len(source))
		for value, count := range source {
			out = append(out, graphFacet{Value: value, Count: count})
		}
		sort.Slice(out, func(i, j int) bool {
			if out[i].Count != out[j].Count {
				return out[i].Count > out[j].Count
			}
			return out[i].Value < out[j].Value
		})
		return out
	}
	return struct {
		categories []graphFacet
		languages  []graphFacet
		tags       []graphFacet
		grades     []graphFacet
	}{
		categories: toSortedFacets(counts["categories"]),
		languages:  toSortedFacets(counts["languages"]),
		tags:       toSortedFacets(counts["tags"]),
		grades:     toSortedFacets(counts["grades"]),
	}
}

func selectGraphFacetValues(field graphField, values []graphFacet, doc *graphDocument) ([]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("PluginFacets.%s requires a selection set", field.name)
	}
	fields, err := doc.expand(field.selection, nil)
	if err != nil {
		return nil, err
	}
	out := make([]any, 0, len(values))
	for _, value := range values {
		entry := make(map[string]any, len(fields))
		for _, child := range fields {
			if err := graphRejectScalarSelection("PluginFacet", child); err != nil {
				return nil, err
			}
			switch child.name {
			case "__typename":
				entry[child.responseKey()] = "PluginFacet"
			case "value":
				entry[child.responseKey()] = value.Value
			case "count":
				entry[child.responseKey()] = value.Count
			default:
				return nil, fmt.Errorf("PluginFacet.%s does not exist", child.name)
			}
		}
		out = append(out, entry)
	}
	return out, nil
}

func (e graphExecutor) selectPluginConnection(ctx context.Context, snap *cache.Snapshot, field graphField, doc *graphDocument, variables map[string]any) (map[string]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("PluginConnection requires a selection set")
	}
	filter, err := graphPluginFilter(field, variables)
	if err != nil {
		return nil, err
	}
	plugins := filterPlugins(snap, filter)
	sortBy, err := graphEnumArg(field, "sort", variables, "DEFAULT")
	if err != nil {
		return nil, err
	}
	order, err := graphEnumArg(field, "order", variables, "DESC")
	if err != nil {
		return nil, err
	}
	if sortBy != "DEFAULT" {
		mapped := map[string]string{"STARS": "stars", "UPDATED": "updated", "SCORE": "score", "NAME": "name"}[sortBy]
		if mapped == "" {
			return nil, fmt.Errorf("unsupported plugins.sort %q", sortBy)
		}
		mappedOrder := map[string]string{"ASC": "asc", "DESC": "desc"}[order]
		if mappedOrder == "" {
			return nil, fmt.Errorf("unsupported plugins.order %q", order)
		}
		sortPlugins(plugins, mapped, mappedOrder)
	} else if order != "ASC" && order != "DESC" {
		return nil, fmt.Errorf("unsupported plugins.order %q", order)
	}
	querySignature := graphConnectionSignature(filter, sortBy, order)

	first, err := graphIntArg(field, "first", variables, defaultPerPage, maxGraphQLFirst)
	if err != nil {
		return nil, err
	}
	after, err := graphOptionalString(field, "after", variables)
	if err != nil {
		return nil, err
	}
	start := 0
	if after != nil {
		start, err = decodeGraphCursor(*after, snap.Version, querySignature)
		if err != nil {
			return nil, err
		}
		if start > len(plugins) {
			return nil, fmt.Errorf("after cursor is outside this result set")
		}
	}
	end := min(start+first, len(plugins))

	fields, err := doc.expand(field.selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, child := range fields {
		key := child.responseKey()
		if _, exists := result[key]; exists {
			return nil, fmt.Errorf("response key %q is selected more than once", key)
		}
		switch child.name {
		case "__typename":
			if err := graphRejectScalarSelection("PluginConnection", child); err != nil {
				return nil, err
			}
			result[key] = "PluginConnection"
		case "totalCount":
			if err := graphRejectScalarSelection("PluginConnection", child); err != nil {
				return nil, err
			}
			result[key] = len(plugins)
		case "dataVersion":
			if err := graphRejectScalarSelection("PluginConnection", child); err != nil {
				return nil, err
			}
			result[key] = snap.Version
		case "asOf":
			if err := graphRejectScalarSelection("PluginConnection", child); err != nil {
				return nil, err
			}
			result[key] = snap.AsOf.Format(time.RFC3339)
		case "nodes":
			if len(child.selection) == 0 {
				return nil, fmt.Errorf("PluginConnection.nodes requires a selection set")
			}
			pagePlugins := plugins[start:end]
			prefetch, err := e.prefetchPluginFields(ctx, pagePlugins, child.selection, doc)
			if err != nil {
				return nil, err
			}
			nodes := make([]any, 0, end-start)
			for i := start; i < end; i++ {
				node, err := e.selectPlugin(plugins[i], child.selection, doc, variables, prefetch)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, node)
			}
			result[key] = nodes
		case "pageInfo":
			result[key], err = selectGraphPageInfo(child, end, len(plugins), snap.Version, querySignature, doc)
			if err != nil {
				return nil, err
			}
		default:
			return nil, fmt.Errorf("PluginConnection.%s does not exist", child.name)
		}
	}
	return result, nil
}

func graphConnectionSignature(filter pluginFilter, sortBy, order string) string {
	// 游标不仅要绑定数据版本，也必须绑定筛选与排序；否则同一数据集下换一个
	// filter 继续翻页仍会悄悄产生重复/遗漏。
	payload, _ := json.Marshal(struct {
		Category, Language, Grade, Keyword, Owner, Tag string
		MinScore                                       *int
		Featured, Official, Archived, Insider          *bool
		HasInstall, IsPlugin                           *bool
		Sort, Order                                    string
	}{
		Category: filter.Category, Language: filter.Language, Grade: filter.Grade,
		Keyword: filter.Keyword, Owner: filter.Owner, Tag: filter.Tag, MinScore: filter.MinScore,
		Featured: filter.Featured, Official: filter.Official, Archived: filter.Archived,
		Insider: filter.Insider, HasInstall: filter.HasInstall, IsPlugin: filter.IsPlugin,
		Sort: sortBy, Order: order,
	})
	sum := sha256.Sum256(payload)
	return hex.EncodeToString(sum[:])
}

func graphPluginFilter(field graphField, variables map[string]any) (pluginFilter, error) {
	value, found := field.args["filter"]
	if !found {
		return pluginFilter{}, nil
	}
	resolved, err := resolveGraphValue(value, variables)
	if err != nil {
		return pluginFilter{}, err
	}
	if resolved == nil {
		return pluginFilter{}, nil
	}
	object, ok := resolved.(map[string]any)
	if !ok {
		return pluginFilter{}, fmt.Errorf("plugins.filter must be an object")
	}
	filter := pluginFilter{}
	for name, target := range map[string]*string{
		"category": &filter.Category, "language": &filter.Language, "grade": &filter.Grade,
		"q": &filter.Keyword, "owner": &filter.Owner, "tag": &filter.Tag,
	} {
		if v, ok := object[name]; ok && v != nil {
			s, ok := v.(string)
			if !ok {
				return pluginFilter{}, fmt.Errorf("plugins.filter.%s must be a string", name)
			}
			*target = s
		}
	}
	filter.Grade = strings.ToUpper(filter.Grade)
	filter.Keyword = strings.ToLower(strings.TrimSpace(graphTruncateRunes(filter.Keyword, maxQueryLength)))
	for name, target := range map[string]**bool{
		"featured": &filter.Featured, "official": &filter.Official, "archived": &filter.Archived,
		"insider": &filter.Insider, "risky": &filter.Risky, "hasInstall": &filter.HasInstall,
		"isPlugin": &filter.IsPlugin,
	} {
		if v, ok := object[name]; ok && v != nil {
			b, ok := v.(bool)
			if !ok {
				return pluginFilter{}, fmt.Errorf("plugins.filter.%s must be a boolean", name)
			}
			*target = &b
		}
	}
	if value, ok := object["minScore"]; ok && value != nil {
		minScore, ok := graphInteger(value)
		if !ok || minScore < 0 || minScore > 100 {
			return pluginFilter{}, fmt.Errorf("plugins.filter.minScore must be an integer between 0 and 100")
		}
		filter.MinScore = &minScore
	}
	return filter, nil
}

type graphPluginPrefetch struct {
	i18n      map[string]map[string]store.I18nEntry
	snapshots map[string][]store.SnapshotRow
}

func (e graphExecutor) prefetchPluginFields(ctx context.Context, plugins []store.Plugin, selection []graphField, doc *graphDocument) (graphPluginPrefetch, error) {
	prefetch := graphPluginPrefetch{
		i18n:      map[string]map[string]store.I18nEntry{},
		snapshots: map[string][]store.SnapshotRow{},
	}
	fields, err := doc.expand(selection, nil)
	if err != nil {
		return prefetch, err
	}
	needI18n, needSnapshots := false, false
	for _, field := range fields {
		switch field.name {
		case "i18n":
			needI18n = true
		case "snapshots", "growth":
			needSnapshots = true
		}
	}
	if (!needI18n && !needSnapshots) || len(plugins) == 0 {
		return prefetch, nil
	}
	fullNames := make([]string, 0, len(plugins))
	seen := make(map[string]struct{}, len(plugins))
	for _, plugin := range plugins {
		if _, exists := seen[plugin.FullName]; exists {
			continue
		}
		seen[plugin.FullName] = struct{}{}
		fullNames = append(fullNames, plugin.FullName)
	}
	if needI18n {
		entries, err := e.source.PluginI18nBatch(ctx, fullNames)
		if err != nil {
			return prefetch, fmt.Errorf("load plugin i18n: %w", err)
		}
		prefetch.i18n = entries
	}
	if needSnapshots {
		entries, err := e.source.PluginSnapshotsBatch(ctx, fullNames)
		if err != nil {
			return prefetch, fmt.Errorf("load plugin snapshots: %w", err)
		}
		prefetch.snapshots = entries
	}
	return prefetch, nil
}

func (e graphExecutor) selectPlugin(plugin store.Plugin, selection []graphField, doc *graphDocument, variables map[string]any, prefetch graphPluginPrefetch) (map[string]any, error) {
	if len(selection) == 0 {
		return nil, fmt.Errorf("Plugin requires a selection set")
	}
	fields, err := doc.expand(selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, field := range fields {
		key := field.responseKey()
		if _, exists := result[key]; exists {
			return nil, fmt.Errorf("response key %q is selected more than once", key)
		}
		switch field.name {
		case "__typename":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = "Plugin"
		case "id", "fullName":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.FullName
		case "name":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.Name
		case "owner":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.Owner
		case "url":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.URL
		case "repositoryUrl":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = pluginRepositoryURL(plugin)
		case "description":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.Description
		case "tags":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.Tags
		case "language":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.Language
		case "stars":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.Stars
		case "contributors":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = graphIntPointer(plugin.Contributors)
		case "pushedAt":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = graphStringPointer(plugin.PushedAt)
		case "archived":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.Archived
		case "category":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.Category
		case "score":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = graphIntPointer(plugin.Score)
		case "grade":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = graphStringPointer(plugin.Grade)
		case "rating":
			result[key], err = selectGraphRating(field, plugin, doc)
		case "isFeatured":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.IsFeatured
		case "isOfficial":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.IsOfficial
		case "isInsider":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.IsInsider
		case "isRisky":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = plugin.IsRisky
		case "riskNote":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = graphStringPointer(plugin.RiskNote)
		case "isPlugin":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = graphBoolPointer(plugin.IsPlugin)
		case "firstSeenAt":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = graphStringPointer(plugin.FirstSeenAt)
		case "lastSyncedAt":
			if err := graphRejectScalarSelection("Plugin", field); err != nil {
				return nil, err
			}
			result[key] = graphStringPointer(plugin.LastSyncedAt)
		case "install":
			result[key], err = selectGraphInstall(field, plugin.Install, doc)
		case "i18n":
			result[key], err = selectGraphI18n(field, prefetch.i18n[plugin.FullName], doc, variables)
		case "snapshots":
			result[key], err = selectGraphSnapshots(field, prefetch.snapshots[plugin.FullName], doc, variables)
		case "growth":
			result[key], err = selectGraphGrowth(&plugin, prefetch.snapshots[plugin.FullName], field, doc)
		default:
			return nil, fmt.Errorf("Plugin.%s does not exist", field.name)
		}
		if err != nil {
			return nil, err
		}
	}
	return result, nil
}

func pluginRepositoryURL(plugin store.Plugin) string {
	if plugin.RepositoryURL != "" {
		return plugin.RepositoryURL
	}
	// 测试夹具和升级前的内存对象可能只有旧 URL 字段；公开运行时 LoadAllPlugins
	// 已保证两者同时赋值。
	return plugin.URL
}

func selectGraphRating(field graphField, plugin store.Plugin, doc *graphDocument) (any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("PluginRating requires a selection set")
	}
	if plugin.Score == nil || plugin.Grade == nil {
		return nil, nil
	}
	fields, err := doc.expand(field.selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, child := range fields {
		if err := graphRejectScalarSelection("PluginRating", child); err != nil {
			return nil, err
		}
		switch child.name {
		case "__typename":
			result[child.responseKey()] = "PluginRating"
		case "score":
			result[child.responseKey()] = *plugin.Score
		case "grade":
			result[child.responseKey()] = *plugin.Grade
		case "calculatedAt":
			result[child.responseKey()] = graphStringPointer(plugin.ScoredAt)
		case "version":
			result[child.responseKey()] = graphStringPointer(plugin.ScoreVersion)
		default:
			return nil, fmt.Errorf("PluginRating.%s does not exist", child.name)
		}
	}
	return result, nil
}

func selectGraphInstall(field graphField, install store.Install, doc *graphDocument) (map[string]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("Install requires a selection set")
	}
	fields, err := doc.expand(field.selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, child := range fields {
		if err := graphRejectScalarSelection("Install", child); err != nil {
			return nil, err
		}
		key := child.responseKey()
		switch child.name {
		case "__typename":
			result[key] = "Install"
		case "cmd":
			result[key] = graphStringPointer(install.Cmd)
		case "source":
			result[key] = install.Source
		case "kind":
			result[key] = graphStringPointer(install.Kind)
		case "pkgName":
			result[key] = graphStringPointer(install.PkgName)
		case "npmPublished":
			result[key] = install.NpmPublished
		case "releaseTgzUrl":
			result[key] = graphEmptyStringAsNull(install.ReleaseTgzURL)
		case "releaseTag":
			result[key] = graphEmptyStringAsNull(install.ReleaseTag)
		case "probedAt":
			result[key] = graphStringPointer(install.ProbedAt)
		default:
			return nil, fmt.Errorf("Install.%s does not exist", child.name)
		}
	}
	return result, nil
}

func selectGraphI18n(field graphField, entries map[string]store.I18nEntry, doc *graphDocument, variables map[string]any) ([]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("PluginI18n requires a selection set")
	}
	onlyLocale, err := graphOptionalString(field, "locale", variables)
	if err != nil {
		return nil, err
	}
	locales := make([]string, 0, len(entries))
	for locale := range entries {
		if onlyLocale == nil || *onlyLocale == locale {
			locales = append(locales, locale)
		}
	}
	sort.Strings(locales)
	out := make([]any, 0, len(locales))
	for _, locale := range locales {
		selected, err := selectGraphI18nEntry(field.selection, locale, entries[locale], doc)
		if err != nil {
			return nil, err
		}
		out = append(out, selected)
	}
	return out, nil
}

func selectGraphI18nEntry(selection []graphField, locale string, entry store.I18nEntry, doc *graphDocument) (map[string]any, error) {
	fields, err := doc.expand(selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, field := range fields {
		if err := graphRejectScalarSelection("PluginI18n", field); err != nil {
			return nil, err
		}
		switch field.name {
		case "__typename":
			result[field.responseKey()] = "PluginI18n"
		case "locale":
			result[field.responseKey()] = locale
		case "description":
			result[field.responseKey()] = graphStringPointer(entry.Description)
		case "intro":
			result[field.responseKey()] = graphStringPointer(entry.Intro)
		case "highlights":
			result[field.responseKey()] = entry.Highlights
		case "updatedAt":
			result[field.responseKey()] = graphEmptyStringAsNull(entry.UpdatedAt)
		default:
			return nil, fmt.Errorf("PluginI18n.%s does not exist", field.name)
		}
	}
	return result, nil
}

func selectGraphSnapshots(field graphField, all []store.SnapshotRow, doc *graphDocument, variables map[string]any) ([]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("PluginSnapshot requires a selection set")
	}
	days, err := graphIntArg(field, "days", variables, 30, 90)
	if err != nil {
		return nil, err
	}
	visible := graphVisibleSnapshots(all, days)
	out := make([]any, 0, len(visible))
	for _, snapshot := range visible {
		selected, err := selectGraphSnapshot(field.selection, snapshot, doc)
		if err != nil {
			return nil, err
		}
		out = append(out, selected)
	}
	return out, nil
}

func graphVisibleSnapshots(all []store.SnapshotRow, days int) []store.SnapshotRow {
	if len(all) == 0 {
		return []store.SnapshotRow{}
	}
	cutoff := timeNowUTC().AddDate(0, 0, -days).Format("2006-01-02")
	start := 0
	for start < len(all) && all[start].Date < cutoff {
		start++
	}
	return all[start:]
}

func selectGraphSnapshot(selection []graphField, snapshot store.SnapshotRow, doc *graphDocument) (map[string]any, error) {
	fields, err := doc.expand(selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, field := range fields {
		if err := graphRejectScalarSelection("PluginSnapshot", field); err != nil {
			return nil, err
		}
		switch field.name {
		case "__typename":
			result[field.responseKey()] = "PluginSnapshot"
		case "date":
			result[field.responseKey()] = snapshot.Date
		case "stars":
			result[field.responseKey()] = snapshot.Stars
		case "contributors":
			result[field.responseKey()] = graphIntPointer(snapshot.Contributors)
		case "pushedAt":
			result[field.responseKey()] = graphStringPointer(snapshot.PushedAt)
		default:
			return nil, fmt.Errorf("PluginSnapshot.%s does not exist", field.name)
		}
	}
	return result, nil
}

func selectGraphGrowth(plugin *store.Plugin, snapshots []store.SnapshotRow, field graphField, doc *graphDocument) (map[string]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("PluginGrowth requires a selection set")
	}
	growth := computeGrowth(plugin, snapshots)
	fields, err := doc.expand(field.selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, child := range fields {
		if err := graphRejectScalarSelection("PluginGrowth", child); err != nil {
			return nil, err
		}
		switch child.name {
		case "__typename":
			result[child.responseKey()] = "PluginGrowth"
		case "windowDays":
			result[child.responseKey()] = growth.WindowDays
		case "stars":
			result[child.responseKey()] = growth.Stars
		case "contributors":
			result[child.responseKey()] = graphIntPointer(growth.Contributors)
		default:
			return nil, fmt.Errorf("PluginGrowth.%s does not exist", child.name)
		}
	}
	return result, nil
}

func selectGraphPageInfo(field graphField, end, total int, dataVersion, querySignature string, doc *graphDocument) (map[string]any, error) {
	if len(field.selection) == 0 {
		return nil, fmt.Errorf("PageInfo requires a selection set")
	}
	fields, err := doc.expand(field.selection, nil)
	if err != nil {
		return nil, err
	}
	result := make(map[string]any, len(fields))
	for _, child := range fields {
		if err := graphRejectScalarSelection("PageInfo", child); err != nil {
			return nil, err
		}
		switch child.name {
		case "__typename":
			result[child.responseKey()] = "PageInfo"
		case "hasNextPage":
			result[child.responseKey()] = end < total
		case "endCursor":
			if end == 0 {
				result[child.responseKey()] = nil
			} else {
				result[child.responseKey()] = encodeGraphCursor(end, dataVersion, querySignature)
			}
		default:
			return nil, fmt.Errorf("PageInfo.%s does not exist", child.name)
		}
	}
	return result, nil
}

func graphRequiredString(field graphField, name string, variables map[string]any) (string, error) {
	value, err := graphArg(field, name, variables)
	if err != nil {
		return "", err
	}
	text, ok := value.(string)
	if !ok || text == "" {
		return "", fmt.Errorf("%s.%s must be a non-empty string", field.name, name)
	}
	return text, nil
}

func graphOptionalString(field graphField, name string, variables map[string]any) (*string, error) {
	value, found := field.args[name]
	if !found {
		return nil, nil
	}
	resolved, err := resolveGraphValue(value, variables)
	if err != nil {
		return nil, err
	}
	if resolved == nil {
		return nil, nil
	}
	text, ok := resolved.(string)
	if !ok {
		return nil, fmt.Errorf("%s.%s must be a string", field.name, name)
	}
	return &text, nil
}

func graphIntArg(field graphField, name string, variables map[string]any, def, max int) (int, error) {
	value, found := field.args[name]
	if !found {
		return def, nil
	}
	resolved, err := resolveGraphValue(value, variables)
	if err != nil {
		return 0, err
	}
	integer, ok := graphInteger(resolved)
	if !ok || integer < 1 || integer > max {
		return 0, fmt.Errorf("%s.%s must be an integer between 1 and %d", field.name, name, max)
	}
	return integer, nil
}

func graphEnumArg(field graphField, name string, variables map[string]any, def string) (string, error) {
	value, found := field.args[name]
	if !found {
		return def, nil
	}
	resolved, err := resolveGraphValue(value, variables)
	if err != nil {
		return "", err
	}
	text, ok := resolved.(string)
	if !ok {
		return "", fmt.Errorf("%s.%s must be an enum value", field.name, name)
	}
	return strings.ToUpper(text), nil
}

func graphArg(field graphField, name string, variables map[string]any) (any, error) {
	value, found := field.args[name]
	if !found {
		return nil, fmt.Errorf("%s.%s is required", field.name, name)
	}
	return resolveGraphValue(value, variables)
}

func graphInteger(value any) (int, bool) {
	switch v := value.(type) {
	case int:
		return v, true
	case int64:
		return int(v), true
	case float64:
		if v == float64(int(v)) {
			return int(v), true
		}
	}
	return 0, false
}

type graphCursor struct {
	Version string `json:"v"`
	Query   string `json:"q"`
	Offset  int    `json:"o"`
}

func encodeGraphCursor(offset int, dataVersion, querySignature string) string {
	payload, _ := json.Marshal(graphCursor{Version: dataVersion, Query: querySignature, Offset: offset})
	return base64.RawURLEncoding.EncodeToString(payload)
}

func decodeGraphCursor(cursor, expectedVersion, expectedQuerySignature string) (int, error) {
	raw, err := base64.RawURLEncoding.DecodeString(cursor)
	if err != nil {
		return 0, fmt.Errorf("after must be a valid cursor")
	}
	var decoded graphCursor
	if err := json.Unmarshal(raw, &decoded); err != nil || decoded.Version == "" || decoded.Query == "" || decoded.Offset < 0 {
		return 0, fmt.Errorf("after must be a valid cursor")
	}
	if decoded.Version != expectedVersion {
		return 0, fmt.Errorf("after cursor refers to a different data version; restart pagination")
	}
	if decoded.Query != expectedQuerySignature {
		return 0, fmt.Errorf("after cursor was issued for different filters or sorting; restart pagination")
	}
	return decoded.Offset, nil
}

func graphIntPointer(value *int) any {
	if value == nil {
		return nil
	}
	return *value
}

func graphStringPointer(value *string) any {
	if value == nil {
		return nil
	}
	return *value
}

func graphBoolPointer(value *bool) any {
	if value == nil {
		return nil
	}
	return *value
}

func graphEmptyStringAsNull(value string) any {
	if value == "" {
		return nil
	}
	return value
}

func graphRejectScalarSelection(typeName string, field graphField) error {
	if len(field.selection) != 0 {
		return fmt.Errorf("%s.%s is a scalar and must not have a selection set", typeName, field.name)
	}
	return nil
}

func graphTruncateRunes(value string, max int) string {
	if utf8.RuneCountInString(value) <= max {
		return value
	}
	return string([]rune(value)[:max])
}
