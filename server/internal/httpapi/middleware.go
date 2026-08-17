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

		ok, retry := s.rl.Allow(buckets...)
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
		ok, retry := s.rl.Allow(
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
