package httpapi

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/store"
)

const (
	defaultPerPage = 20
	maxPerPage     = 100
)

type pluginListResponse struct {
	Data       []store.Plugin `json:"data"`
	Page       int            `json:"page"`
	PerPage    int            `json:"per_page"`
	Total      int            `json:"total"`
	TotalPages int            `json:"total_pages"`
	// DataVersion 用于将多页同步绑定到同一份基础插件快照；客户端把首响应的
	// data_version 带回后续分页，若数据变更则收到 409 并从头同步。
	DataVersion string `json:"data_version"`
	AsOf        string `json:"as_of"`
	// GeneratedAt 为兼容旧 REST 客户端保留。它表示这份快照的生成时间（等同
	// AsOf），而非本次 HTTP 响应时间；否则每次请求都会改变表示并使 ETag 失效。
	GeneratedAt string `json:"generated_at"`
}

// GET /v1/plugins —— 对外插件列表:内存快照上过滤、排序、分页。
func (s *Server) handlePluginList(w http.ResponseWriter, r *http.Request) {
	snap := s.cache.Get()
	if snap == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded yet", 0)
		return
	}
	q := r.URL.Query()
	if version := q.Get("data_version"); version != "" && version != snap.Version {
		writeError(w, http.StatusConflict, "stale_data", "data version changed; restart pagination from page 1", 0)
		return
	}

	category := q.Get("category")
	language := q.Get("language")
	grade := strings.ToUpper(q.Get("grade"))
	keyword := strings.ToLower(strings.TrimSpace(q.Get("q")))
	featured := parseBool(q.Get("featured"))
	official := parseBool(q.Get("official"))
	archived := parseBool(q.Get("archived"))
	insider := parseBool(q.Get("insider"))
	hasInstall := parseBool(q.Get("has_install"))
	minScore, err := parseOptionalInt(q.Get("min_score"), 0, 100)
	if err != nil {
		writeError(w, http.StatusBadRequest, "bad_request", err.Error(), 0)
		return
	}

	filtered := filterPlugins(snap, pluginFilter{
		Category: category, Language: language, Grade: grade, Keyword: keyword,
		Owner: q.Get("owner"), Tag: q.Get("tag"), MinScore: minScore,
		Featured: featured, Official: official, Archived: archived, Insider: insider, HasInstall: hasInstall,
	})

	sortPlugins(filtered, q.Get("sort"), q.Get("order"))

	page := clampInt(parseIntOr(q.Get("page"), 1), 1, 1<<30)
	perPage := clampInt(parseIntOr(q.Get("per_page"), defaultPerPage), 1, maxPerPage)
	total := len(filtered)
	totalPages := (total + perPage - 1) / perPage

	startIdx := (page - 1) * perPage
	if startIdx > total {
		startIdx = total
	}
	endIdx := min(startIdx+perPage, total)

	writeCacheableJSON(w, r, http.StatusOK, pluginListResponse{
		Data:        filtered[startIdx:endIdx],
		Page:        page,
		PerPage:     perPage,
		Total:       total,
		TotalPages:  totalPages,
		DataVersion: snap.Version,
		AsOf:        snap.AsOf.Format(time.RFC3339),
		GeneratedAt: snap.AsOf.Format(time.RFC3339),
	}, publicDataCacheControl)
}

// pluginFilter 统一 REST 与 GraphQL 的筛选口径，避免两个 API 因字段新增而漂移。
type pluginFilter struct {
	Category   string
	Language   string
	Grade      string
	Keyword    string
	Owner      string
	Tag        string
	MinScore   *int
	Featured   *bool
	Official   *bool
	Archived   *bool
	Insider    *bool
	HasInstall *bool
}

func filterPlugins(snap *cache.Snapshot, f pluginFilter) []store.Plugin {
	filtered := make([]store.Plugin, 0, len(snap.Plugins))
	for i := range snap.Plugins {
		p := &snap.Plugins[i]
		if f.Category != "" && p.Category != f.Category {
			continue
		}
		if f.Language != "" && !strings.EqualFold(p.Language, f.Language) {
			continue
		}
		if f.Grade != "" && (p.Grade == nil || *p.Grade != f.Grade) {
			continue
		}
		if f.Featured != nil && p.IsFeatured != *f.Featured {
			continue
		}
		if f.Official != nil && p.IsOfficial != *f.Official {
			continue
		}
		if f.Keyword != "" && !strings.Contains(snap.ListHay[i], f.Keyword) {
			continue
		}
		if f.Owner != "" && !strings.EqualFold(p.Owner, f.Owner) {
			continue
		}
		if f.Tag != "" && !containsTag(p.Tags, f.Tag) {
			continue
		}
		if f.MinScore != nil && (p.Score == nil || *p.Score < *f.MinScore) {
			continue
		}
		if f.Archived != nil && p.Archived != *f.Archived {
			continue
		}
		if f.Insider != nil && p.IsInsider != *f.Insider {
			continue
		}
		if f.HasInstall != nil && (p.Install.Cmd != nil) != *f.HasInstall {
			continue
		}
		filtered = append(filtered, *p)
	}
	return filtered
}

// sortPlugins:默认 stars 降序;name 默认升序,其余默认降序;
// 不传 sort 时保持快照原序(featured → stars → name)。
func sortPlugins(ps []store.Plugin, sortBy, order string) {
	if sortBy == "" {
		return
	}
	var less func(a, b *store.Plugin) bool
	switch sortBy {
	case "stars":
		less = func(a, b *store.Plugin) bool { return a.Stars < b.Stars }
	case "updated":
		// pushed_at 是 ISO8601,字典序即时间序
		less = func(a, b *store.Plugin) bool { return pluginString(a.PushedAt) < pluginString(b.PushedAt) }
	case "score":
		less = func(a, b *store.Plugin) bool { return scoreOr(a, -1) < scoreOr(b, -1) }
	case "name":
		less = func(a, b *store.Plugin) bool {
			an, bn := strings.ToLower(a.Name), strings.ToLower(b.Name)
			if an != bn {
				return an < bn
			}
			return a.FullName < b.FullName
		}
	default:
		return
	}
	desc := order != "asc"
	if order == "" && sortBy == "name" {
		desc = false
	}
	sort.SliceStable(ps, func(i, j int) bool {
		if desc {
			return less(&ps[j], &ps[i])
		}
		return less(&ps[i], &ps[j])
	})
}

func scoreOr(p *store.Plugin, def int) int {
	if p.Score == nil {
		return def
	}
	return *p.Score
}

func pluginString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

type growthInfo struct {
	WindowDays   int  `json:"window_days"`
	Stars        int  `json:"stars"`
	Contributors *int `json:"contributors"`
}

type pluginDetailResponse struct {
	store.Plugin
	I18n        map[string]store.I18nEntry `json:"i18n"`
	Snapshots   []store.SnapshotRow        `json:"snapshots"`
	Growth      growthInfo                 `json:"growth"`
	DataVersion string                     `json:"data_version"`
	AsOf        string                     `json:"as_of"`
}

// GET /v1/plugins/{owner}/{repo} —— 主体走内存,i18n / snapshots 实时查库。
func (s *Server) handlePluginDetail(w http.ResponseWriter, r *http.Request) {
	snap := s.cache.Get()
	if snap == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded yet", 0)
		return
	}
	fullName := r.PathValue("owner") + "/" + r.PathValue("repo")
	p, ok := snap.ByFullName[strings.ToLower(fullName)]
	if !ok {
		writeError(w, http.StatusNotFound, "not_found", "plugin not found", 0)
		return
	}

	days := clampInt(parseIntOr(r.URL.Query().Get("snapshot_days"), 30), 1, 90)

	i18n, err := s.st.PluginI18n(r.Context(), p.FullName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to load i18n", 0)
		return
	}
	// 全量取快照算 7 天增长基线,响应里再按 snapshot_days 截取
	allSnaps, err := s.st.PluginSnapshots(r.Context(), p.FullName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to load snapshots", 0)
		return
	}

	visible := allSnaps
	if len(allSnaps) > 0 {
		cutoff := time.Now().UTC().AddDate(0, 0, -days).Format("2006-01-02")
		start := 0
		for start < len(allSnaps) && allSnaps[start].Date < cutoff {
			start++
		}
		visible = allSnaps[start:]
	}
	if visible == nil {
		visible = []store.SnapshotRow{}
	}

	writeCacheableJSON(w, r, http.StatusOK, pluginDetailResponse{
		Plugin:      *p,
		I18n:        i18n,
		Snapshots:   visible,
		Growth:      computeGrowth(p, allSnaps),
		DataVersion: snap.Version,
		AsOf:        snap.AsOf.Format(time.RFC3339),
	}, publicDataCacheControl)
}

// computeGrowth 复刻 Next 端口径(src/lib/plugins-db.ts getPluginDetail):
// 基线取「最新快照日 - 7 天」当天或更早的最近一张,历史不足 7 天回退最早一张;
// 少于 2 张快照时增长记 0 / null。当前值用维度表的 stars,不用快照。
func computeGrowth(p *store.Plugin, snaps []store.SnapshotRow) growthInfo {
	g := growthInfo{WindowDays: 7}
	if len(snaps) < 2 {
		return g
	}
	latest := snaps[len(snaps)-1]
	latestDate, err := time.Parse("2006-01-02", latest.Date)
	if err != nil {
		return g
	}
	cutoff := latestDate.AddDate(0, 0, -7).Format("2006-01-02")
	base := snaps[0]
	for i := len(snaps) - 1; i >= 0; i-- {
		if snaps[i].Date <= cutoff {
			base = snaps[i]
			break
		}
	}
	g.Stars = p.Stars - base.Stars
	if p.Contributors != nil && base.Contributors != nil {
		d := *p.Contributors - *base.Contributors
		g.Contributors = &d
	}
	return g
}

func parseBool(v string) *bool {
	switch strings.ToLower(v) {
	case "true", "1":
		t := true
		return &t
	case "false", "0":
		f := false
		return &f
	}
	return nil
}

func parseIntOr(v string, def int) int {
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

func parseOptionalInt(v string, lo, hi int) (*int, error) {
	if v == "" {
		return nil, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < lo || n > hi {
		return nil, fmt.Errorf("min_score must be an integer between %d and %d", lo, hi)
	}
	return &n, nil
}

func containsTag(tags []string, target string) bool {
	for _, tag := range tags {
		if strings.EqualFold(tag, target) {
			return true
		}
	}
	return false
}

func clampInt(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
