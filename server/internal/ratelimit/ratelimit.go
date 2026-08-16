// Package ratelimit 提供进程内 token bucket 限流(按 API key 或 IP)。
// 单实例部署下内存实现足够;水平扩容时各实例独立计数,额度按实例数放大,届时再换集中式。
package ratelimit

import (
	"context"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type entry struct {
	lim      *rate.Limiter
	lastSeen time.Time
}

type Limiter struct {
	mu      sync.Mutex
	buckets map[string]*entry
}

func New() *Limiter {
	return &Limiter{buckets: map[string]*entry{}}
}

// Allow 判定一次请求;拒绝时返回建议的 Retry-After。
// 同一 key 首次出现时按传入参数建桶;之后参数变化(如运营调整额度)在桶过期重建后生效。
func (l *Limiter) Allow(key string, perMin, burst int) (bool, time.Duration) {
	l.mu.Lock()
	e, ok := l.buckets[key]
	if !ok {
		e = &entry{lim: rate.NewLimiter(rate.Limit(perMin)/60, burst)}
		l.buckets[key] = e
	}
	e.lastSeen = time.Now()
	l.mu.Unlock()

	r := e.lim.Reserve()
	if d := r.Delay(); d > 0 {
		r.Cancel()
		return false, d
	}
	return true, 0
}

// Run 定期清理 30 分钟没动静的桶,防止 map 无界增长。
func (l *Limiter) Run(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			cutoff := time.Now().Add(-30 * time.Minute)
			l.mu.Lock()
			for k, e := range l.buckets {
				if e.lastSeen.Before(cutoff) {
					delete(l.buckets, k)
				}
			}
			l.mu.Unlock()
		}
	}
}
