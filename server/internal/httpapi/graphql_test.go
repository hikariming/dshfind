package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/store"
)

func TestGraphQLGETRequestParsesPublicQueryAndVariables(t *testing.T) {
	query := `query Plugin($name: ID!) { plugin(fullName: $name) { fullName } }`
	request := httptest.NewRequest(http.MethodGet, "/graphql?query="+url.QueryEscape(query)+"&operationName=Plugin&variables="+url.QueryEscape(`{"name":"owner/repo"}`), nil)
	got, err := graphRequestFromHTTP(httptest.NewRecorder(), request)
	if err != nil {
		t.Fatal(err)
	}
	if got.Query != query || got.OperationName != "Plugin" || got.Variables["name"] != "owner/repo" {
		t.Fatalf("GET GraphQL request = %#v", got)
	}
}

func TestGraphQLRejectsAliasedConnectionFanout(t *testing.T) {
	_, err := (graphExecutor{source: graphTestSource{}}).Execute(context.Background(), `
    { first: plugins { totalCount } second: plugins { totalCount } }
  `, "", nil)
	if err == nil || !strings.Contains(err.Error(), "at most 1 plugin data resolver") {
		t.Fatalf("fanout error = %v", err)
	}
}

func TestGraphQLRejectsMixedPluginDataResolvers(t *testing.T) {
	source := graphTestSource{plugins: []store.Plugin{{
		FullName: "owner/repo", Name: "repo", Owner: "owner", URL: "https://example.test/repo", Tags: []string{},
	}}}
	_, err := (graphExecutor{source: source}).Execute(context.Background(), `
    { plugins { totalCount } plugin(fullName: "owner/repo") { fullName } }
  `, "", nil)
	if err == nil || !strings.Contains(err.Error(), "at most 1 plugin data resolver") {
		t.Fatalf("mixed resolver error = %v", err)
	}
}

func TestGraphQLPluginMappingVariablesAndFragments(t *testing.T) {
	restoreNow := timeNowUTC
	timeNowUTC = func() time.Time { return time.Date(2026, 8, 17, 0, 0, 0, 0, time.UTC) }
	t.Cleanup(func() { timeNowUTC = restoreNow })

	contributors := 4
	score := 87
	grade := "S"
	cmd := "pnpm add dsh-memory"
	kind := "npm"
	scoredAt := "2026-08-16T00:00:00Z"
	scoreVersion := "2026-08-17.1"
	probedAt := "2026-08-15T00:00:00Z"
	source := graphTestSource{plugins: []store.Plugin{{
		FullName: "owner/memory", Name: "memory", Owner: "owner", URL: "https://legacy.example/memory", RepositoryURL: "https://github.com/owner/memory",
		Description: "memory plugin", Tags: []string{"memory"}, Language: "Go", Stars: 100,
		Contributors: &contributors, PushedAt: stringPtr("2026-08-17T00:00:00Z"), Category: "memory", Score: &score,
		Grade: &grade, ScoredAt: &scoredAt, ScoreVersion: &scoreVersion, IsFeatured: true,
		Install: store.Install{Cmd: &cmd, Kind: &kind, Source: "manual", ProbedAt: &probedAt},
	}}, i18n: map[string]map[string]store.I18nEntry{
		"owner/memory": {"en": {Highlights: []string{"Fast"}, UpdatedAt: "2026-08-17T00:00:00Z"}},
	}, snapshots: map[string][]store.SnapshotRow{
		"owner/memory": {
			{Date: "2026-08-10", Stars: 90},
			{Date: "2026-08-17", Stars: 95},
		},
	}}

	data, err := (graphExecutor{source: source}).Execute(context.Background(), `
    query PluginByName($name: ID!) {
      plugin(fullName: $name) {
        ...core
        ... on Plugin { language repositoryUrl rating { score grade calculatedAt version } }
        install { cmd kind source probedAt }
        i18n(locale: "en") { locale highlights updatedAt }
        snapshots(days: 7) { date stars }
        growth { windowDays stars contributors }
      }
    }
    fragment core on Plugin { id fullName stars contributors }
  `, "PluginByName", map[string]any{"name": "owner/memory"})
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}

	plugin := data["plugin"].(map[string]any)
	if got := plugin["fullName"]; got != "owner/memory" {
		t.Errorf("fullName = %v, want owner/memory", got)
	}
	if got := plugin["id"]; got != "owner/memory" {
		t.Errorf("id = %v, want owner/memory", got)
	}
	if got := plugin["contributors"]; got != 4 {
		t.Errorf("contributors = %v, want 4", got)
	}
	if got := plugin["language"]; got != "Go" {
		t.Errorf("language = %v, want Go", got)
	}
	if got := plugin["growth"].(map[string]any)["stars"]; got != 10 {
		t.Errorf("growth.stars = %v, want 10", got)
	}
	if got := plugin["install"].(map[string]any)["kind"]; got != "npm" {
		t.Errorf("install.kind = %v, want npm", got)
	}
	if got := plugin["repositoryUrl"]; got != "https://github.com/owner/memory" {
		t.Errorf("repositoryUrl = %v, want GitHub repository URL", got)
	}
	rating := plugin["rating"].(map[string]any)
	if got := rating["version"]; got != scoreVersion {
		t.Errorf("rating.version = %v, want %s", got, scoreVersion)
	}
	if got := rating["calculatedAt"]; got != scoredAt {
		t.Errorf("rating.calculatedAt = %v, want %s", got, scoredAt)
	}
	if got := plugin["install"].(map[string]any)["probedAt"]; got != probedAt {
		t.Errorf("install.probedAt = %v, want %s", got, probedAt)
	}
	i18n := plugin["i18n"].([]any)
	if len(i18n) != 1 || i18n[0].(map[string]any)["locale"] != "en" {
		t.Errorf("i18n = %#v, want one en entry", i18n)
	}
}

func TestGraphQLConnectionBindsCursorToDatasetAndBatchesNestedFields(t *testing.T) {
	grade := "A"
	firstCalls := &graphBatchCalls{}
	source := graphTestSource{
		version: "dataset-v1",
		plugins: []store.Plugin{
			{FullName: "a/one", Name: "one", Owner: "a", URL: "https://github.com/a/one", Tags: []string{"go"}, Category: "tools", Language: "Go", Score: intPtr(80), Grade: &grade, Install: store.Install{Cmd: stringPtr("dsh add one")}},
			{FullName: "b/two", Name: "two", Owner: "b", URL: "https://github.com/b/two", Tags: []string{"go"}, Category: "tools", Language: "Go", Archived: true},
		},
		i18n: map[string]map[string]store.I18nEntry{
			"a/one": {"en": {UpdatedAt: "2026-08-17T00:00:00Z"}},
			"b/two": {"en": {UpdatedAt: "2026-08-17T00:00:00Z"}},
		},
		snapshots: map[string][]store.SnapshotRow{
			"a/one": {{Date: "2026-08-16", Stars: 1}},
			"b/two": {{Date: "2026-08-16", Stars: 2}},
		},
		calls: firstCalls,
	}
	exec := graphExecutor{source: source}
	data, err := exec.Execute(context.Background(), `
    {
      dataset { dataVersion asOf }
      pluginFacets { categories { value count } tags { value count } grades { value count } }
      all: plugins(first: 2) {
        dataVersion asOf totalCount
        nodes { fullName i18n { locale } snapshots(days: 7) { date } growth { stars } }
        pageInfo { hasNextPage endCursor }
      }
    }
  `, "", nil)
	if err != nil {
		t.Fatal(err)
	}
	if got := data["dataset"].(map[string]any)["dataVersion"]; got != "dataset-v1" {
		t.Errorf("dataset.dataVersion = %v, want dataset-v1", got)
	}
	connection := data["all"].(map[string]any)
	if got := connection["dataVersion"]; got != "dataset-v1" {
		t.Errorf("connection.dataVersion = %v, want dataset-v1", got)
	}
	filtered, err := exec.Execute(context.Background(), `{ plugins(first: 1, filter: { tag: "go", archived: false, minScore: 70, hasInstall: true }) { totalCount } }`, "", nil)
	if err != nil {
		t.Fatal(err)
	}
	if got := filtered["plugins"].(map[string]any)["totalCount"]; got != 1 {
		t.Errorf("filtered totalCount = %v, want 1", got)
	}
	if firstCalls.i18n != 1 || firstCalls.snapshots != 1 {
		t.Errorf("batched calls = i18n:%d snapshots:%d, want 1 each", firstCalls.i18n, firstCalls.snapshots)
	}
	grades := data["pluginFacets"].(map[string]any)["grades"].([]any)
	if len(grades) != 1 || grades[0].(map[string]any)["value"] != "A" {
		t.Errorf("facets.grades = %#v, want A", grades)
	}
	cursor := connection["pageInfo"].(map[string]any)["endCursor"].(string)
	staleExec := graphExecutor{source: graphTestSource{version: "dataset-v2", plugins: source.plugins}}
	if _, err := staleExec.Execute(context.Background(), `query($after: String!) {
      plugins(first: 1, after: $after) { nodes { fullName } }
    }`, "", map[string]any{"after": cursor}); err == nil || !strings.Contains(err.Error(), "different data version") {
		t.Errorf("stale cursor error = %v, want data-version restart error", err)
	}
	if _, err := exec.Execute(context.Background(), `query($after: String!) {
      plugins(first: 1, filter: { tag: "go" }, after: $after) { nodes { fullName } }
    }`, "", map[string]any{"after": cursor}); err == nil || !strings.Contains(err.Error(), "different filters") {
		t.Errorf("mismatched cursor error = %v, want filter restart error", err)
	}
}

func TestGraphQLUnscoredPluginReturnsNullGrade(t *testing.T) {
	if !strings.Contains(graphqlSchema, "grade: PluginGrade\n") {
		t.Fatalf("served GraphQL schema must declare nullable Plugin.grade enum")
	}
	source := graphTestSource{plugins: []store.Plugin{{
		FullName: "owner/unscored", Name: "unscored", Owner: "owner", URL: "https://example.test/unscored", Tags: []string{},
	}}}
	data, err := (graphExecutor{source: source}).Execute(context.Background(), `
	    { plugin(fullName: "owner/unscored") { score grade rating { score } pushedAt firstSeenAt lastSyncedAt } }
  `, "", nil)
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}
	plugin := data["plugin"].(map[string]any)
	if got := plugin["score"]; got != nil {
		t.Errorf("score = %#v, want nil", got)
	}
	if got := plugin["grade"]; got != nil {
		t.Errorf("grade = %#v, want nil", got)
	}
	for _, field := range []string{"rating", "pushedAt", "firstSeenAt", "lastSyncedAt"} {
		if got := plugin[field]; got != nil {
			t.Errorf("%s = %#v, want nil", field, got)
		}
	}
}

func TestGraphQLPluginConnectionUsesOpaqueCursor(t *testing.T) {
	source := graphTestSource{plugins: []store.Plugin{
		{FullName: "a/one", Name: "one", Owner: "a", URL: "https://example.test/one", Tags: []string{}},
		{FullName: "b/two", Name: "two", Owner: "b", URL: "https://example.test/two", Tags: []string{}},
	}}
	exec := graphExecutor{source: source}
	first, err := exec.Execute(context.Background(), `{ plugins(first: 1) { nodes { fullName } pageInfo { hasNextPage endCursor } totalCount } }`, "", nil)
	if err != nil {
		t.Fatal(err)
	}
	connection := first["plugins"].(map[string]any)
	if got := connection["totalCount"]; got != 2 {
		t.Errorf("totalCount = %v, want 2", got)
	}
	pageInfo := connection["pageInfo"].(map[string]any)
	cursor, ok := pageInfo["endCursor"].(string)
	if !ok || cursor == "" {
		t.Fatalf("endCursor = %#v, want an opaque cursor", pageInfo["endCursor"])
	}

	second, err := exec.Execute(context.Background(), `query($after: String!) { plugins(first: 1, after: $after) { nodes { fullName } pageInfo { hasNextPage } } }`, "", map[string]any{"after": cursor})
	if err != nil {
		t.Fatal(err)
	}
	nodes := second["plugins"].(map[string]any)["nodes"].([]any)
	if got := nodes[0].(map[string]any)["fullName"]; got != "b/two" {
		t.Errorf("second page node = %v, want b/two", got)
	}
}

func TestGraphQLRejectsMutationAndDeepQueries(t *testing.T) {
	exec := graphExecutor{source: graphTestSource{plugins: []store.Plugin{{
		FullName: "a/b", Name: "b", Owner: "a", URL: "https://example.test/b", Tags: []string{},
	}}}}
	if _, err := exec.Execute(context.Background(), `mutation { plugin(fullName: "a/b") { id } }`, "", nil); err == nil || !strings.Contains(err.Error(), "only query") {
		t.Errorf("mutation error = %v, want only-query error", err)
	}
	deep := "{"
	for i := 0; i <= maxGraphQLDepth; i++ {
		deep += " field {"
	}
	deep += strings.Repeat("}", maxGraphQLDepth+2)
	if _, err := parseGraphDocument(deep); err == nil || !strings.Contains(err.Error(), "maximum depth") {
		t.Errorf("deep query error = %v, want maximum-depth error", err)
	}
	if _, err := exec.Execute(context.Background(), `{ plugin(fullName: "a/b") { stars { nope } } }`, "", nil); err == nil || !strings.Contains(err.Error(), "scalar") {
		t.Errorf("scalar selection error = %v, want scalar-selection error", err)
	}
}

type graphTestSource struct {
	version   string
	plugins   []store.Plugin
	i18n      map[string]map[string]store.I18nEntry
	snapshots map[string][]store.SnapshotRow
	calls     *graphBatchCalls
}

func intPtr(value int) *int          { return &value }
func stringPtr(value string) *string { return &value }

type graphBatchCalls struct {
	i18n      int
	snapshots int
}

func (s graphTestSource) Snapshot() *cache.Snapshot {
	plugins := append([]store.Plugin(nil), s.plugins...)
	version := s.version
	if version == "" {
		version = "test-v1"
	}
	snapshot := &cache.Snapshot{
		Plugins:    plugins,
		ByFullName: make(map[string]*store.Plugin, len(plugins)),
		ListHay:    make([]string, len(plugins)),
		Version:    version,
		AsOf:       time.Date(2026, 8, 17, 0, 0, 0, 0, time.UTC),
	}
	for i := range plugins {
		snapshot.ByFullName[strings.ToLower(plugins[i].FullName)] = &snapshot.Plugins[i]
		snapshot.ListHay[i] = strings.ToLower(plugins[i].FullName + " " + plugins[i].Description + " " + strings.Join(plugins[i].Tags, " ") + " " + plugins[i].Language)
	}
	return snapshot
}

func (s graphTestSource) PluginI18nBatch(_ context.Context, fullNames []string) (map[string]map[string]store.I18nEntry, error) {
	if s.calls != nil {
		s.calls.i18n++
	}
	out := make(map[string]map[string]store.I18nEntry, len(fullNames))
	for _, fullName := range fullNames {
		out[fullName] = s.i18n[fullName]
	}
	return out, nil
}

func (s graphTestSource) PluginSnapshotsBatch(_ context.Context, fullNames []string) (map[string][]store.SnapshotRow, error) {
	if s.calls != nil {
		s.calls.snapshots++
	}
	out := make(map[string][]store.SnapshotRow, len(fullNames))
	for _, fullName := range fullNames {
		out[fullName] = s.snapshots[fullName]
	}
	return out, nil
}
