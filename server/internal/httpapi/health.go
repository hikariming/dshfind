package httpapi

import (
	"net/http"
	"time"
)

// GET /healthz —— Railway healthcheck 用。缓存从未加载成功 = 坏实例,给 503 拦下。
func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	snap := s.cache.Get()
	if snap == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded", 0)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"status":          "ok",
		"plugins_loaded":  len(snap.Plugins),
		"cache_loaded_at": snap.LoadedAt.Format(time.RFC3339),
		"audit_queue":     s.audit.QueueLen(),
		"audit_dropped":   s.audit.Dropped(),
	})
}
