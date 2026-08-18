// Package httpapi 装配路由与 middleware 链,持有各组件的引用。
package httpapi

import (
	"context"
	"net/http"
	"sync/atomic"
	"time"

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
	// 社区读写走窄接口(实现就是 st),让 HTTP 层的鉴权与限流测试不必连 Turso。
	forum forumStore
	audit *audit.Logger
	rl    *ratelimit.Limiter
	// 可选的分布式限流后端；nil 时完全走进程内桶（见 ratelimit.RedisBackend）。
	rlRedis *ratelimit.RedisBackend
	// GitHub OAuth 只用这枚具备超时的客户端；测试可替换其 Transport，避免真实网络请求。
	githubHTTPClient *http.Client
	// sha256(key 明文) hex → APIKey;随缓存周期重载,admin 增删 key 后立即重载
	keys atomic.Pointer[map[string]store.APIKey]
}

func New(cfg *config.Config, c *cache.Cache, st *store.Store, aud *audit.Logger, rl *ratelimit.Limiter) *Server {
	s := &Server{
		cfg: cfg, cache: c, st: st, forum: st, audit: aud, rl: rl,
		githubHTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
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

// SetRedisBackend 挂载可选的分布式限流后端（main 在配置齐全时调用）。
func (s *Server) SetRedisBackend(b *ratelimit.RedisBackend) {
	s.rlRedis = b
}

// allow 是限流的统一入口：Redis 后端可用时以它为准（跨副本/重启一致），
// Redis 故障或未配置时回退到进程内令牌桶。
func (s *Server) allow(ctx context.Context, buckets ...ratelimit.Bucket) (bool, time.Duration) {
	if s.rlRedis != nil {
		if ok, retry, redisOK := s.rlRedis.Allow(ctx, buckets...); redisOK {
			return ok, retry
		}
	}
	return s.rl.Allow(buckets...)
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", s.handleHealthz)

	// 身份认证边界在 Go 服务：这里持有 GitHub OAuth secret、校验 state 并签发会话。
	// Next 仅用共享 AUTH_SECRET 校验 JWT，绝不参与 code 换 token。
	mux.Handle("GET /auth/github", s.authLimited(s.handleGitHubLogin))
	mux.Handle("GET /auth/github/callback", s.authLimited(s.handleGitHubCallback))
	mux.Handle("GET /auth/me", s.authLimited(s.handleAuthMe))
	mux.HandleFunc("OPTIONS /auth/me", s.handleAuthMePreflight)
	mux.Handle("POST /auth/logout", s.authLimited(s.handleLogout))

	// 公开端点:cors → key 解析 → 限流 → 审计 → handler
	mux.Handle("GET /v1/suggest", s.public("/v1/suggest", rateProfileSuggest, s.handleSuggest))
	mux.Handle("GET /v1/plugins", s.public("/v1/plugins", rateProfileStandard, s.handlePluginList))
	mux.Handle("GET /v1/catalog", s.public("/v1/catalog", rateProfileStandard, s.handleCatalog))
	mux.Handle("GET /v1/plugins/{owner}/{repo}", s.public("/v1/plugins/{owner}/{repo}", rateProfileStandard, s.handlePluginDetail))
	// GraphQL 是同一份公开只读数据的按需字段入口；复用 public 链的 key、限流与审计。
	mux.Handle("GET /graphql", s.public("/graphql", rateProfileGraphQL, s.handleGraphQL))
	mux.Handle("POST /graphql", s.public("/graphql", rateProfileGraphQL, s.handleGraphQL))
	mux.Handle("GET /v1/plugins/{owner}/{repo}/discussion", s.public("/v1/plugins/{owner}/{repo}/discussion", rateProfileStandard, s.handlePluginDiscussion))
	mux.Handle("GET /graphql/schema", s.public("/graphql/schema", rateProfileStandard, s.handleGraphQLSchema))

	// 社区写入:必须是本站 Origin + 有效会话,再按用户限额(docs/bbs-design.md)。
	// 读自己的投票同样要带 Cookie,因此走 Origin 白名单而非公开 CORS。
	mux.Handle("GET /v1/me/plugin-votes/{owner}/{repo}", s.authLimited(s.handleMyPluginVote))
	mux.Handle("POST /v1/plugins/{owner}/{repo}/comments", s.sessionWrite(s.forumCommentProfile(), s.handlePluginComment))
	mux.Handle("PUT /v1/plugins/{owner}/{repo}/vote", s.sessionWrite(s.forumVoteProfile(), s.handlePluginVote))
	mux.Handle("DELETE /v1/plugins/{owner}/{repo}/vote", s.sessionWrite(s.forumVoteProfile(), s.handlePluginUnvote))
	mux.Handle("DELETE /v1/forum/posts/{id}", s.sessionWrite(s.forumCommentProfile(), s.handleDeletePost))

	// CORS 预检:直接 204,不进审计与限流
	mux.HandleFunc("OPTIONS /v1/suggest", handlePreflight)
	mux.HandleFunc("OPTIONS /v1/plugins", handlePreflight)
	mux.HandleFunc("OPTIONS /v1/catalog", handlePreflight)
	mux.HandleFunc("OPTIONS /v1/plugins/{owner}/{repo}", handlePreflight)
	mux.HandleFunc("OPTIONS /v1/plugins/{owner}/{repo}/discussion", handlePreflight)
	mux.HandleFunc("OPTIONS /graphql", handleGraphQLPreflight)
	mux.HandleFunc("OPTIONS /graphql/schema", handlePreflight)
	// 带 Cookie 的端点必须回显具体 Origin,不能用公开预检的 *
	mux.HandleFunc("OPTIONS /v1/me/plugin-votes/{owner}/{repo}", s.credentialedPreflight("GET, OPTIONS"))
	mux.HandleFunc("OPTIONS /v1/plugins/{owner}/{repo}/comments", s.credentialedPreflight("POST, OPTIONS"))
	mux.HandleFunc("OPTIONS /v1/plugins/{owner}/{repo}/vote", s.credentialedPreflight("PUT, DELETE, OPTIONS"))
	mux.HandleFunc("OPTIONS /v1/forum/posts/{id}", s.credentialedPreflight("DELETE, OPTIONS"))

	// admin:仅 Bearer ADMIN_TOKEN,不发 CORS 头,不进公开审计
	mux.Handle("GET /v1/admin/usage", s.adminOnly(s.handleAdminUsage))
	mux.Handle("GET /v1/admin/usage/recent", s.adminOnly(s.handleAdminRecent))
	mux.Handle("GET /v1/admin/keys", s.adminOnly(s.handleAdminKeysList))
	mux.Handle("POST /v1/admin/keys", s.adminOnly(s.handleAdminKeysCreate))
	mux.Handle("DELETE /v1/admin/keys/{id}", s.adminOnly(s.handleAdminKeysRevoke))

	return withRecover(mux)
}
