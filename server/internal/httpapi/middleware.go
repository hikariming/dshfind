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
	h := w.Header()
	setCORS(h)
	h.Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	h.Set("Access-Control-Allow-Headers", "Authorization, X-Api-Key, Content-Type")
	h.Set("Access-Control-Max-Age", "86400")
	w.WriteHeader(http.StatusNoContent)
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// public 包住公开端点的整条链:CORS → key 解析 → 限流 → handler,离场时写审计。
// endpoint 传路由模板(而非实际 path),供 usage 按端点聚合。
func (s *Server) public(endpoint string, isSuggest bool, h http.HandlerFunc) http.Handler {
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
		if present && !valid {
			// 无效 key 不静默降级为匿名:让集成方立刻发现配置错了
			writeError(rec, http.StatusUnauthorized, "unauthorized", "invalid or revoked API key", 0)
			return
		}

		var rlKey string
		var perMin, burst int
		switch {
		case present:
			keyID, keyPrefix = key.ID, key.KeyPrefix
			rlKey = fmt.Sprintf("k:%d", key.ID)
			perMin, burst = key.RatePerMin, 30
			if perMin <= 0 {
				perMin = s.cfg.KeyRatePerMin
			}
		case isSuggest:
			// 打字即发,突发要给足
			rlKey = "sug:" + ip
			perMin, burst = s.cfg.SuggestRatePerMin, 20
		default:
			rlKey = "ip:" + ip
			perMin, burst = s.cfg.AnonRatePerMin, 10
		}

		if ok, retry := s.rl.Allow(rlKey, perMin, burst); !ok {
			sec := int(retry.Seconds()) + 1
			writeError(rec, http.StatusTooManyRequests, "rate_limited", "too many requests", sec)
			return
		}

		h(rec, r)
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
