package ratelimit

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

// fakeUpstash 用进程内 map 模拟 Upstash pipeline 的 INCRBY/EXPIRE 行为。
type fakeUpstash struct {
	mu     sync.Mutex
	counts map[string]int64
	// fail 为 true 时所有请求返回 500,用于验证 fail-open。
	fail bool
}

func newFakeUpstash(t *testing.T) (*fakeUpstash, *httptest.Server) {
	t.Helper()
	f := &fakeUpstash{counts: map[string]int64{}}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/pipeline" {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		if f.fail {
			http.Error(w, "boom", http.StatusInternalServerError)
			return
		}
		var commands [][]any
		if err := json.NewDecoder(r.Body).Decode(&commands); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		f.mu.Lock()
		defer f.mu.Unlock()
		results := make([]map[string]any, 0, len(commands))
		for _, cmd := range commands {
			switch strings.ToUpper(cmd[0].(string)) {
			case "INCRBY":
				key := cmd[1].(string)
				delta := int64(cmd[2].(float64))
				f.counts[key] += delta
				results = append(results, map[string]any{"result": f.counts[key]})
			case "EXPIRE":
				results = append(results, map[string]any{"result": 1})
			default:
				results = append(results, map[string]any{"error": "unknown command"})
			}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(results)
	}))
	t.Cleanup(srv.Close)
	return f, srv
}

func TestRedisBackendDisabledWithoutCredentials(t *testing.T) {
	if NewRedisBackend("", "token") != nil {
		t.Fatal("empty url should disable the backend")
	}
	if NewRedisBackend("https://example.upstash.io", "") != nil {
		t.Fatal("empty token should disable the backend")
	}
}

func TestRedisBackendAllowThenReject(t *testing.T) {
	_, srv := newFakeUpstash(t)
	b := NewRedisBackend(srv.URL, "test-token")
	b.now = func() time.Time { return time.Unix(1_800_000_000, 0) }

	bucket := Bucket{Key: "anonymous:test", PerMinute: 30, Burst: 4}
	ctx := context.Background()
	for i := 0; i < 4; i++ {
		allowed, _, ok := b.Allow(ctx, bucket)
		if !ok || !allowed {
			t.Fatalf("request %d: allowed=%v ok=%v, want true/true", i+1, allowed, ok)
		}
	}
	allowed, retry, ok := b.Allow(ctx, bucket)
	if !ok || allowed {
		t.Fatalf("5th request: allowed=%v ok=%v, want false/true", allowed, ok)
	}
	// 窗口 = 60*4/30 = 8 秒;retryAfter 应落在 (0, 8]。
	if retry <= 0 || retry > 8*time.Second {
		t.Fatalf("retryAfter = %v, want within (0, 8s]", retry)
	}
	if b.Fallbacks() != 0 {
		t.Fatalf("fallbacks = %d, want 0", b.Fallbacks())
	}
}

// 窗口配额是 Burst:Cost>1 的桶(GraphQL 全局桶)按成本扣减,超出 Burst 即拒。
func TestRedisBackendCostAccounting(t *testing.T) {
	_, srv := newFakeUpstash(t)
	b := NewRedisBackend(srv.URL, "test-token")
	b.now = func() time.Time { return time.Unix(1_800_000_000, 0) }

	bucket := Bucket{Key: "global:public", PerMinute: 6000, Burst: 20, Cost: 10, Pinned: true}
	ctx := context.Background()
	if allowed, _, ok := b.Allow(ctx, bucket); !ok || !allowed {
		t.Fatalf("first cost-10 request: allowed=%v ok=%v, want true/true", allowed, ok)
	}
	if allowed, _, ok := b.Allow(ctx, bucket); !ok || !allowed {
		t.Fatalf("second cost-10 request: allowed=%v ok=%v, want true/true", allowed, ok)
	}
	if allowed, _, ok := b.Allow(ctx, bucket); !ok || allowed {
		t.Fatalf("third cost-10 request: allowed=%v ok=%v, want false/true (burst 20 exhausted)", allowed, ok)
	}
}

// Redis 故障时 ok=false,调用方据此降级内存桶;降级计数可观测。
func TestRedisBackendFailOpen(t *testing.T) {
	f, srv := newFakeUpstash(t)
	f.fail = true
	b := NewRedisBackend(srv.URL, "test-token")

	allowed, _, ok := b.Allow(context.Background(), Bucket{Key: "anonymous:x", PerMinute: 30, Burst: 10})
	if ok || allowed {
		t.Fatalf("failing redis: allowed=%v ok=%v, want false/false", allowed, ok)
	}
	if b.Fallbacks() != 1 {
		t.Fatalf("fallbacks = %d, want 1", b.Fallbacks())
	}
}

// 请求必须带 Bearer token 与正确的 key 形态(rl:<bucket>:<window>)。
func TestRedisBackendRequestShape(t *testing.T) {
	var gotAuth, gotKey string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		var commands [][]any
		_ = json.NewDecoder(r.Body).Decode(&commands)
		gotKey = commands[0][1].(string)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[{"result":1},{"result":1}]`))
	}))
	defer srv.Close()

	b := NewRedisBackend(srv.URL, "secret-token")
	b.now = func() time.Time { return time.Unix(1_800_000_123, 0) }
	if _, _, ok := b.Allow(context.Background(), Bucket{Key: "ip:abc", PerMinute: 240, Burst: 60}); !ok {
		t.Fatal("request failed against shape-checking server")
	}
	if gotAuth != "Bearer secret-token" {
		t.Fatalf("Authorization = %q, want Bearer secret-token", gotAuth)
	}
	// 窗口 = 60*60/240 = 15 秒 ⇒ window = 1800000123/15 = 120000008
	wantKey := "rl:ip:abc:" + strconv.FormatInt(1_800_000_123/15, 10)
	if gotKey != wantKey {
		t.Fatalf("key = %q, want %q", gotKey, wantKey)
	}
}
