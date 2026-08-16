package httpapi

import (
	"net/http"
	"strings"

	"github.com/dsh-external/dshfind/server/internal/cache"
)

// 常量与 Next 端 src/lib/suggest.ts 保持一致。
const (
	minQueryLength = 2
	maxSuggestions = 10
	maxQueryLength = 64
)

type suggestResponse struct {
	Items []cache.Suggestion `json:"items"`
}

// GET /v1/suggest?q= —— 与现有 /api/suggest 响应完全兼容。
// 归一化顺序同原实现:trim → 截 64 → lower;len<2 返回空且不缓存。
func (s *Server) handleSuggest(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if runes := []rune(q); len(runes) > maxQueryLength {
		q = string(runes[:maxQueryLength])
	}
	q = strings.ToLower(q)

	if len([]rune(q)) < minQueryLength {
		w.Header().Set("Cache-Control", "no-store")
		writeJSON(w, http.StatusOK, suggestResponse{Items: []cache.Suggestion{}})
		return
	}

	snap := s.cache.Get()
	if snap == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded yet", 0)
		return
	}

	// 数据每天同步一次,可以让 CDN 缓存一小时；ETag 则让浏览器和支持 POST/GET
	// 条件请求的客户端在过期后只取 304。
	writeCacheableJSON(w, r, http.StatusOK, suggestResponse{Items: snap.Suggest(q, maxSuggestions)}, publicSuggestCacheControl)
}
