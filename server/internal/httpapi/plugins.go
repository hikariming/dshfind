package httpapi

import (
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/dsh-external/dshfind/server/internal/store"
)

const (
	defaultPerPage = 20
	maxPerPage     = 100
)

type pluginListResponse struct {
	Data        []store.Plugin `json:"data"`
	Page        int            `json:"page"`
	PerPage     int            `json:"per_page"`
	Total       int            `json:"total"`
	TotalPages  int            `json:"total_pages"`
	GeneratedAt string         `json:"generated_at"`
}

// GET /v1/plugins —— 对外插件列表:内存快照上过滤、排序、分页。
func (s *Server) handlePluginList(w http.ResponseWriter, r *http.Request) {
	snap := s.cache.Get()
	if snap == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded yet", 0)
		return
	}
	q := r.URL.Query()

	category := q.Get("category")
	language := q.Get("language")
	grade := strings.ToUpper(q.Get("grade"))
	keyword := strings.ToLower(strings.TrimSpace(q.Get("q")))
	featured := parseBool(q.Get("featured"))
	official := parseBool(q.Get("official"))

	filtered := make([]store.Plugin, 0, len(snap.Plugins))
	for i := range snap.Plugins {
		p := &snap.Plugins[i]
		if category != "" && p.Category != category {
			continue
		}
		if language != "" && !strings.EqualFold(p.Language, language) {
			continue
		}
		if grade != "" && p.Grade != grade {
			continue
		}
		if featured != nil && p.IsFeatured != *featured {
			continue
		}
		if official != nil && p.IsOfficial != *official {
			continue
		}
		if keyword != "" && !strings.Contains(snap.ListHay[i], keyword) {
			continue
		}
		filtered = append(filtered, *p)
	}

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

	writeJSON(w, http.StatusOK, pluginListResponse{
		Data:        filtered[startIdx:endIdx],
		Page:        page,
		PerPage:     perPage,
		Total:       total,
		TotalPages:  totalPages,
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
	})
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
		less = func(a, b *store.Plugin) bool { return a.PushedAt < b.PushedAt }
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

type growthInfo struct {
	WindowDays   int  `json:"window_days"`
	Stars        int  `json:"stars"`
	Contributors *int `json:"contributors"`
}

type pluginDetailResponse struct {
	store.Plugin
	I18n      map[string]store.I18nEntry `json:"i18n"`
	Snapshots []store.SnapshotRow        `json:"snapshots"`
	Growth    growthInfo                 `json:"growth"`
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

	writeJSON(w, http.StatusOK, pluginDetailResponse{
		Plugin:    *p,
		I18n:      i18n,
		Snapshots: visible,
		Growth:    computeGrowth(p, allSnaps),
	})
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

func clampInt(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
