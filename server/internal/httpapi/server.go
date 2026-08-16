// Package httpapi 装配路由与 middleware 链,持有各组件的引用。
package httpapi

import (
	"context"
	"net/http"
	"sync/atomic"

	"github.com/dsh-external/dshfind/server/internal/audit"
	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/config"
	"github.com/dsh-external/dshfind/server/internal/ratelimit"
	"github.com/dsh-external/dshfind/server/internal/store"
)

type Server struct {
	cfg   *config.Config
	cache *cache.Cache
	st    *store.Store
	audit *audit.Logger
	rl    *ratelimit.Limiter
	// sha256(key 明文) hex → APIKey;随缓存周期重载,admin 增删 key 后立即重载
	keys atomic.Pointer[map[string]store.APIKey]
}

func New(cfg *config.Config, c *cache.Cache, st *store.Store, aud *audit.Logger, rl *ratelimit.Limiter) *Server {
	s := &Server{cfg: cfg, cache: c, st: st, audit: aud, rl: rl}
	empty := map[string]store.APIKey{}
	s.keys.Store(&empty)
	return s
}

func (s *Server) ReloadKeys(ctx context.Context) error {
	m, err := s.st.LoadActiveKeys(ctx)
	if err != nil {
		return err
	}
	s.keys.Store(&m)
	return nil
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", s.handleHealthz)

	// 公开端点:cors → key 解析 → 限流 → 审计 → handler
	mux.Handle("GET /v1/suggest", s.public("/v1/suggest", true, s.handleSuggest))
	mux.Handle("GET /v1/plugins", s.public("/v1/plugins", false, s.handlePluginList))
	mux.Handle("GET /v1/plugins/{owner}/{repo}", s.public("/v1/plugins/{owner}/{repo}", false, s.handlePluginDetail))

	// CORS 预检:直接 204,不进审计与限流
	mux.HandleFunc("OPTIONS /v1/suggest", handlePreflight)
	mux.HandleFunc("OPTIONS /v1/plugins", handlePreflight)
	mux.HandleFunc("OPTIONS /v1/plugins/{owner}/{repo}", handlePreflight)

	// admin:仅 Bearer ADMIN_TOKEN,不发 CORS 头,不进公开审计
	mux.Handle("GET /v1/admin/usage", s.adminOnly(s.handleAdminUsage))
	mux.Handle("GET /v1/admin/usage/recent", s.adminOnly(s.handleAdminRecent))
	mux.Handle("GET /v1/admin/keys", s.adminOnly(s.handleAdminKeysList))
	mux.Handle("POST /v1/admin/keys", s.adminOnly(s.handleAdminKeysCreate))
	mux.Handle("DELETE /v1/admin/keys/{id}", s.adminOnly(s.handleAdminKeysRevoke))

	return withRecover(mux)
}
