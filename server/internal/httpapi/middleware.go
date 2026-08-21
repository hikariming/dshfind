package httpapi

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/dsh-external/dshfind/server/internal/audit"
	"github.com/dsh-external/dshfind/server/internal/ratelimit"
	"github.com/dsh-external/dshfind/server/internal/store"
)

func withRecover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("handler panic", "err", rec, "path", r.URL.Path)
				writeError(w, http.StatusInternalServerError, "internal", "internal server error", 0)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// 公开只读数据、不带 cookie 凭据,Allow-Origin * 是正确选择,无 CSRF 面。
func setCORS(h http.Header) {
	h.Set("Access-Control-Allow-Origin", "*")
}

func handlePreflight(w http.ResponseWriter, r *http.Request) {
	handlePreflightMethods(w, "GET, OPTIONS")
}

func handleGraphQLPreflight(w http.ResponseWriter, r *http.Request) {
	handlePreflightMethods(w, "GET, POST, OPTIONS")
}

func handlePreflightMethods(w http.ResponseWriter, methods string) {
	h := w.Header()
	setCORS(h)
	h.Set("Access-Control-Allow-Methods", methods)
	h.Set("Access-Control-Allow-Headers", "Authorization, X-Api-Key, Content-Type")
	h.Set("Access-Control-Max-Age", "86400")
	w.WriteHeader(http.StatusNoContent)
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

type publicRateProfile uint8

const (
	rateProfileStandard publicRateProfile = iota
	rateProfileSuggest
	rateProfileGraphQL
)

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// public 包住公开端点的整条链:CORS → key 解析 → 限流 → handler,离场时写审计。
// endpoint 传路由模板(而非实际 path),供 usage 按端点聚合。
func (s *Server) public(endpoint string, profile publicRateProfile, h http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		setCORS(w.Header())
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		ip := clientIP(r)

		var keyID int64
		var keyPrefix string
		// 401 / 429 也要进审计——刷接口的和配错 key 的正是最该被看见的
		defer func() {
			s.audit.Log(audit.Event{
				TS:         start.UTC().Format(time.RFC3339),
				APIKeyID:   keyID,
				KeyPrefix:  keyPrefix,
				IP:         ip,
				UA:         r.UserAgent(),
				Origin:     r.Header.Get("Origin"),
				Referer:    r.Referer(),
				Path:       r.URL.Path,
				Query:      r.URL.RawQuery,
				Endpoint:   endpoint,
				Status:     rec.status,
				DurationMs: time.Since(start).Milliseconds(),
			})
		}()

		key, present, valid := s.lookupKey(r)
		validKey := present && valid

		// Anonymous traffic consumes an actor, source-IP and process-global
		// bucket. A valid key uses its persisted per-key policy instead of the
		// source-IP cap: trusted Vercel server traffic otherwise shares a small
		// egress-IP pool and would throttle unrelated visitors. Keyed GraphQL
		// still gets an extra IP guard due to its higher read cost. The IP identity
		// is hashed before it reaches the limiter; raw IP stays only in audit.
		ipBucket := rateLimitIPKey(ip)
		buckets := make([]ratelimit.Bucket, 0, 4)
		switch {
		case validKey:
			keyID, keyPrefix = key.ID, key.KeyPrefix
			perMin := key.RatePerMin
			if perMin <= 0 {
				perMin = s.cfg.KeyRatePerMin
			}
			// A deliberately low custom key quota must not start with the generic
			// 30-token burst; cap its burst at its own minute policy. High-volume
			// trusted service keys still use KEY_RATE_BURST as their short spike cap.
			keyBurst := min(s.cfg.KeyRateBurst, perMin)
			buckets = append(buckets, ratelimit.Bucket{Key: fmt.Sprintf("key:%d", key.ID), PerMinute: perMin, Burst: keyBurst})
		case profile == rateProfileSuggest:
			// 打字即发,突发要给足；仍会叠加所有请求共享的 IP 上限。
			buckets = append(buckets, ratelimit.Bucket{Key: "suggest:" + ipBucket, PerMinute: s.cfg.SuggestRatePerMin, Burst: s.cfg.SuggestRateBurst})
		case profile == rateProfileGraphQL:
			buckets = append(buckets, ratelimit.Bucket{Key: "graphql:" + ipBucket, PerMinute: s.cfg.GraphQLRatePerMin, Burst: s.cfg.GraphQLRateBurst})
		default:
			buckets = append(buckets, ratelimit.Bucket{Key: "anonymous:" + ipBucket, PerMinute: s.cfg.AnonRatePerMin, Burst: s.cfg.AnonRateBurst})
		}
		// API key 的业务桶独立于 IP；对 GraphQL 仍另加 IP 额度，防止一枚
		// 高额度 key 从同一个来源持续执行昂贵查询。
		if validKey && profile == rateProfileGraphQL {
			buckets = append(buckets, ratelimit.Bucket{Key: "graphql:" + ipBucket, PerMinute: s.cfg.GraphQLRatePerMin, Burst: s.cfg.GraphQLRateBurst})
		}
		globalCost := 1
		if profile == rateProfileGraphQL {
			// 一个深层 GraphQL connection 最多触发两次批量 Turso 查询，按多个
			// 普通请求计入全局预算，避免廉价 suggest 流量被其挤占。
			globalCost = s.cfg.GraphQLRateCost
		}
		if !validKey {
			buckets = append(buckets, ratelimit.Bucket{Key: "ip:" + ipBucket, PerMinute: s.cfg.IPRatePerMin, Burst: s.cfg.IPRateBurst})
		}
		buckets = append(buckets, ratelimit.Bucket{Key: "global:public", PerMinute: s.cfg.GlobalRatePerMin, Burst: s.cfg.GlobalRateBurst, Cost: globalCost, Pinned: true})

		ok, retry := s.allow(r.Context(), buckets...)
		if !ok {
			sec := int(retry.Seconds()) + 1
			writeError(rec, http.StatusTooManyRequests, "rate_limited", "too many requests", sec)
			return
		}
		if present && !valid {
			// 无效 key 不静默降级为匿名，但它已先消耗匿名/IP/全局额度，
			// 因而不能以伪造凭据绕过限流和冲垮审计队列。
			writeError(rec, http.StatusUnauthorized, "unauthorized", "invalid or revoked API key", 0)
			return
		}

		h(rec, r)
	})
}

func rateLimitIPKey(ip string) string {
	sum := sha256.Sum256([]byte(ip))
	return hex.EncodeToString(sum[:])
}

// authLimited protects the OAuth start/callback and session endpoints without
// putting their cookie-bearing traffic behind the public CORS/audit chain. The
// callback can make several GitHub requests, so it must not remain an
// unbounded bypass around the public API's global limiter.
func (s *Server) authLimited(h http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ipBucket := rateLimitIPKey(clientIP(r))
		ok, retry := s.allow(r.Context(),
			ratelimit.Bucket{Key: "auth:" + ipBucket, PerMinute: s.cfg.AuthRatePerMin, Burst: s.cfg.AuthRateBurst},
			ratelimit.Bucket{Key: "global:auth", PerMinute: s.cfg.AuthGlobalRatePerMin, Burst: s.cfg.AuthGlobalRateBurst, Pinned: true},
		)
		if !ok {
			sec := int(retry.Seconds()) + 1
			writeError(w, http.StatusTooManyRequests, "rate_limited", "too many requests", sec)
			return
		}
		h(w, r)
	})
}

// forumWriteProfile 是一类社区写操作的每用户额度。限流器按分钟补令牌，
// 这里把一次写入记作 60 个令牌，于是 PerHour 的数值就是"每小时允许几次"，
// BurstOps 是允许连着做几次（额度耗尽后按 60/PerHour 分钟恢复一次）。
type forumWriteProfile struct {
	name     string
	perHour  int
	burstOps int
}

const forumWriteCost = 60

func (s *Server) forumCommentProfile() forumWriteProfile {
	return forumWriteProfile{"forum-comment", s.cfg.ForumCommentRatePerHour, s.cfg.ForumCommentBurst}
}

func (s *Server) forumVoteProfile() forumWriteProfile {
	return forumWriteProfile{"forum-vote", s.cfg.ForumVoteRatePerHour, s.cfg.ForumVoteBurst}
}

func (s *Server) forumThreadProfile() forumWriteProfile {
	return forumWriteProfile{"forum-thread", s.cfg.ForumThreadRatePerHour, s.cfg.ForumThreadBurst}
}

// sessionWrite 包住全部社区写接口：Origin 必须正好是本站（会话 cookie 是
// SameSite=Lax，跨站 form POST 照样会带上，所以这道校验才是 CSRF 的正门），
// 会话必须有效，再按用户 / IP / 全局三层限流。写入本身在 Turso 留下
// author_login 与 created_at，无需再进 api_requests 审计。
func (s *Server) sessionWrite(profile forumWriteProfile, h func(http.ResponseWriter, *http.Request, store.Author)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !s.setCredentialedCORS(w, r) {
			writeError(w, http.StatusForbidden, "forbidden", "origin is not allowed", 0)
			return
		}
		user, ok := s.verifySession(cookieValue(r, sessionCookieName))
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized", "sign in with GitHub first", 0)
			return
		}

		ipBucket := rateLimitIPKey(clientIP(r))
		allowed, retry := s.allow(r.Context(),
			ratelimit.Bucket{
				Key: profile.name + ":" + user.Login, PerMinute: profile.perHour,
				Burst: forumWriteCost * profile.burstOps, Cost: forumWriteCost,
			},
			// 一个人换十个 GitHub 小号仍然共用同一条出口 IP 的额度。
			ratelimit.Bucket{Key: "forum-ip:" + ipBucket, PerMinute: s.cfg.AnonRatePerMin, Burst: s.cfg.AnonRateBurst},
			ratelimit.Bucket{Key: "global:forum-write", PerMinute: s.cfg.AuthGlobalRatePerMin, Burst: s.cfg.AuthGlobalRateBurst, Pinned: true},
		)
		if !allowed {
			sec := int(retry.Seconds()) + 1
			writeError(w, http.StatusTooManyRequests, "rate_limited", "too many writes; slow down", sec)
			return
		}

		h(w, r, store.Author{Login: user.Login, Name: user.Name, Avatar: user.Avatar})
	})
}

// setCredentialedCORS 是带 Cookie 的端点专用：必须有 Origin 且正好等于站点，
// 与 /auth/me 的 setAuthCORS 不同——后者允许无 Origin 的非浏览器只读调用。
func (s *Server) setCredentialedCORS(w http.ResponseWriter, r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" || origin != s.cfg.WebURL {
		return false
	}
	h := w.Header()
	h.Set("Access-Control-Allow-Origin", origin)
	h.Set("Access-Control-Allow-Credentials", "true")
	h.Add("Vary", "Origin")
	return true
}

// credentialedPreflight 回应带 Cookie 端点的预检；非本站 Origin 直接 403。
func (s *Server) credentialedPreflight(methods string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.setCredentialedCORS(w, r) {
			writeError(w, http.StatusForbidden, "forbidden", "origin is not allowed", 0)
			return
		}
		h := w.Header()
		h.Set("Access-Control-Allow-Methods", methods)
		h.Set("Access-Control-Allow-Headers", "Content-Type")
		h.Set("Access-Control-Max-Age", "86400")
		w.WriteHeader(http.StatusNoContent)
	}
}

// lookupKey 解析请求携带的 API key。present=带了 key,valid=key 有效。
func (s *Server) lookupKey(r *http.Request) (store.APIKey, bool, bool) {
	tok := ""
	if ah := r.Header.Get("Authorization"); strings.HasPrefix(ah, "Bearer ") {
		tok = strings.TrimSpace(ah[len("Bearer "):])
	}
	if tok == "" {
		tok = strings.TrimSpace(r.Header.Get("X-Api-Key"))
	}
	if tok == "" {
		return store.APIKey{}, false, false
	}
	sum := sha256.Sum256([]byte(tok))
	k, ok := (*s.keys.Load())[hex.EncodeToString(sum[:])]
	return k, true, ok
}

func (s *Server) adminOnly(h http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.cfg.AdminToken == "" {
			writeError(w, http.StatusServiceUnavailable, "internal", "admin endpoints disabled: ADMIN_TOKEN not set", 0)
			return
		}
		got := r.Header.Get("Authorization")
		want := "Bearer " + s.cfg.AdminToken
		if subtle.ConstantTimeCompare([]byte(got), []byte(want)) != 1 {
			writeError(w, http.StatusUnauthorized, "unauthorized", "invalid admin token", 0)
			return
		}
		h(w, r)
	})
}

// clientIP 取真实客户端地址。Railway 边缘代理把真实来源追加在 X-Forwarded-For
// 末尾,更早的条目可能是客户端伪造的,所以从右往左取第一个合法 IP。
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		for i := len(parts) - 1; i >= 0; i-- {
			ip := strings.TrimSpace(parts[i])
			if net.ParseIP(ip) != nil {
				return ip
			}
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
