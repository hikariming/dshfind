package ratelimit

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"
)

// 未启用 OTel 时全局 meter 是 no-op，该计数器的开销可忽略。
var redisFallbackCounter, _ = otel.Meter("github.com/dsh-external/dshfind/server/internal/ratelimit").Int64Counter(
	"dshfind.ratelimit.redis_fallback",
	metric.WithDescription("Redis 限流故障降级到进程内桶的次数"),
)

// RedisBackend 是可选的分布式限流后端（Upstash REST API），解决内存令牌桶在
// 重启清零、多副本/滚动部署期间各自为政的问题。它把每个令牌桶折算成一个等价的
// 固定窗口：窗口时长 = 60 × Burst / PerMinute 秒（即攒满一次突发所需的时间），
// 窗口配额 = Burst——稳态速率与突发容量都与进程内令牌桶一致。任何 Redis 故障都
// fail-open：调用方回退到进程内 Limiter，绝不让限流组件本身成为可用性瓶颈。
type RedisBackend struct {
	url    string
	token  string
	client *http.Client
	// fallbacks 记录降级到内存桶的次数，经 /healthz 暴露用于观测 Redis 健康。
	fallbacks atomic.Int64
	now       func() time.Time
}

// NewRedisBackend 在 url 或 token 为空时返回 nil，表示未启用。
func NewRedisBackend(url, token string) *RedisBackend {
	url = strings.TrimRight(strings.TrimSpace(url), "/")
	token = strings.TrimSpace(token)
	if url == "" || token == "" {
		return nil
	}
	return &RedisBackend{
		url:   url,
		token: token,
		// 限流在请求热路径上；超时必须远小于正常响应预算，超时就降级内存桶。
		client: &http.Client{Timeout: 300 * time.Millisecond},
		now:    time.Now,
	}
}

// Fallbacks 返回启用以来降级到进程内桶的次数。
func (b *RedisBackend) Fallbacks() int64 {
	if b == nil {
		return 0
	}
	return b.fallbacks.Load()
}

// Allow 用一次 pipeline 往返完成所有桶的 INCRBY + EXPIRE。ok=false 表示 Redis
// 不可用（网络/超时/非 200/响应畸形），调用方应回退到进程内 Limiter；
// ok=true 时 allowed/retryAfter 就是最终判定。
func (b *RedisBackend) Allow(ctx context.Context, buckets ...Bucket) (allowed bool, retryAfter time.Duration, ok bool) {
	if b == nil {
		return false, 0, false
	}
	now := b.now().Unix()
	commands := make([][]any, 0, len(buckets)*2)
	allowances := make([]int64, 0, len(buckets))
	var wait int64
	seen := make(map[string]struct{}, len(buckets))
	for _, bucket := range buckets {
		cost := bucket.Cost
		if cost == 0 {
			cost = 1
		}
		if bucket.Key == "" || bucket.PerMinute <= 0 || bucket.Burst <= 0 || cost < 0 || cost > bucket.Burst {
			return false, time.Second, true
		}
		if _, duplicate := seen[bucket.Key]; duplicate {
			return false, time.Second, true
		}
		seen[bucket.Key] = struct{}{}
		// 等价固定窗口：攒满 Burst 所需的秒数为一个窗口，窗口内配额即 Burst。
		windowSecs := int64(math.Ceil(60 * float64(bucket.Burst) / float64(bucket.PerMinute)))
		if windowSecs < 1 {
			windowSecs = 1
		}
		key := fmt.Sprintf("rl:%s:%d", bucket.Key, now/windowSecs)
		commands = append(commands,
			[]any{"INCRBY", key, cost},
			// TTL 多留一个窗口兜住时钟漂移；NX 避免把已有键的过期时间反复推后。
			[]any{"EXPIRE", key, windowSecs * 2, "NX"},
		)
		allowances = append(allowances, int64(bucket.Burst))
		if over := windowSecs - now%windowSecs; over > wait {
			wait = over
		}
	}

	counts, err := b.execPipeline(ctx, commands)
	if err != nil {
		b.fallbacks.Add(1)
		redisFallbackCounter.Add(ctx, 1)
		return false, 0, false
	}
	for i := range allowances {
		if counts[i*2] > allowances[i] {
			return false, time.Duration(wait) * time.Second, true
		}
	}
	return true, 0, true
}

// execPipeline 发送 Upstash pipeline 并提取每条命令的整数结果。
func (b *RedisBackend) execPipeline(ctx context.Context, commands [][]any) ([]int64, error) {
	body, err := json.Marshal(commands)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, b.url+"/pipeline", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+b.token)
	req.Header.Set("Content-Type", "application/json")

	res, err := b.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	payload, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("upstash pipeline 状态码 %d", res.StatusCode)
	}
	var results []struct {
		Result int64  `json:"result"`
		Error  string `json:"error"`
	}
	if err := json.Unmarshal(payload, &results); err != nil {
		return nil, err
	}
	if len(results) != len(commands) {
		return nil, fmt.Errorf("upstash pipeline 返回 %d 条结果,预期 %d", len(results), len(commands))
	}
	out := make([]int64, len(results))
	for i, r := range results {
		if r.Error != "" {
			return nil, fmt.Errorf("upstash 命令失败: %s", r.Error)
		}
		out[i] = r.Result
	}
	return out, nil
}
