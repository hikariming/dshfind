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
		"status":         "ok",
		"plugins_loaded": len(snap.Plugins),
		// 非敏感的 Git revision 用于生产 Gate 端到端确认 Railway 已切到目标版本。
		"commit_sha": s.cfg.BuildCommit,
		// 必须与 Railway 控制面记录的 SUCCESS 部署一致，才能成为精确回滚锚点。
		"deployment_id":   s.cfg.BuildDeploymentID,
		"cache_loaded_at": snap.LoadedAt.Format(time.RFC3339),
		"audit_queue":     s.audit.QueueLen(),
		"audit_dropped":   s.audit.Dropped(),
		// 限流后端与降级次数:Redis 故障时 fail-open 回内存桶,这里能看到发生频率。
		"rate_limit_backend":         s.rateLimitBackend(),
		"rate_limit_redis_fallbacks": s.rlRedis.Fallbacks(),
	})
}

func (s *Server) rateLimitBackend() string {
	if s.rlRedis != nil {
		return "redis"
	}
	return "memory"
}
