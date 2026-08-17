// Package ratelimit provides process-local, atomic token buckets.
//
// Token balances are deliberately volatile: they are hot-path counters, not
// business data. Durable policy is supplied by Railway environment variables
// and the API-key policy table; a restart resets only transient burst state.
package ratelimit

import (
	"math"
	"sync"
	"time"
)

const (
	bucketIdleTTL      = 5 * time.Minute
	bucketCleanupEvery = time.Minute
)

// Bucket is one quota a request must consume. A request may need several
// buckets (for example actor, IP, and global) and is admitted only if each one
// has capacity.
type Bucket struct {
	Key       string
	PerMinute int
	Burst     int
	// Cost consumes more than one token for an expensive operation. Zero means
	// one token, so existing callers remain safe by default.
	Cost int
	// Pinned buckets (the service-process global bucket) survive capacity
	// pressure; attacker-created IP keys must never evict the global guard.
	Pinned bool
}

type bucketState struct {
	tokens    float64
	updatedAt time.Time
	lastSeen  time.Time
	perMinute int
	burst     int
	pinned    bool
}

type Limiter struct {
	mu               sync.Mutex
	buckets          map[string]*bucketState
	maxBuckets       int
	nonPinnedBuckets int
	now              func() time.Time
}

func New(maxBuckets int) *Limiter {
	if maxBuckets <= 0 {
		maxBuckets = 65_536
	}
	return &Limiter{
		buckets:    make(map[string]*bucketState),
		maxBuckets: maxBuckets,
		now:        time.Now,
	}
}

// Allow evaluates and consumes all requested buckets while holding one lock.
// This avoids the partial-consumption bug where an IP token is spent but the
// global bucket later rejects the same request. Bucket policies may change at
// runtime (after a Railway redeploy): accrued tokens are calculated with the
// old policy, then capped by the new policy.
func (l *Limiter) Allow(buckets ...Bucket) (bool, time.Duration) {
	if l == nil {
		return false, time.Second
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	states := make([]*bucketState, 0, len(buckets))
	seen := make(map[string]struct{}, len(buckets))
	var retryAfter time.Duration
	for _, bucket := range buckets {
		cost := bucket.Cost
		if cost == 0 {
			cost = 1
		}
		if bucket.Key == "" || bucket.PerMinute <= 0 || bucket.Burst <= 0 || cost < 0 {
			return false, time.Second
		}
		if _, duplicate := seen[bucket.Key]; duplicate {
			return false, time.Second
		}
		seen[bucket.Key] = struct{}{}

		state := l.buckets[bucket.Key]
		if state == nil {
			if !bucket.Pinned && l.nonPinnedBuckets >= l.maxBuckets {
				// Refuse new untrusted identities until the next idle sweep instead
				// of allowing a distributed-IP flood to turn the limiter into an
				// unbounded memory allocation path.
				return false, time.Minute
			}
			state = &bucketState{
				tokens:    float64(bucket.Burst),
				updatedAt: now,
				lastSeen:  now,
				perMinute: bucket.PerMinute,
				burst:     bucket.Burst,
				pinned:    bucket.Pinned,
			}
			l.buckets[bucket.Key] = state
			if !bucket.Pinned {
				l.nonPinnedBuckets++
			}
		} else {
			state.tokens = refill(state, now)
			state.updatedAt = now
			state.lastSeen = now
			state.perMinute = bucket.PerMinute
			state.burst = bucket.Burst
			state.tokens = math.Min(state.tokens, float64(bucket.Burst))
		}
		states = append(states, state)
		if state.tokens < float64(cost) {
			retryAfter = maxDuration(retryAfter, tokenWait(state.tokens, float64(cost), bucket.PerMinute))
		}
	}
	if retryAfter > 0 {
		return false, retryAfter
	}
	for i, state := range states {
		cost := buckets[i].Cost
		if cost == 0 {
			cost = 1
		}
		state.tokens -= float64(cost)
	}
	return true, 0
}

func refill(state *bucketState, now time.Time) float64 {
	elapsed := now.Sub(state.updatedAt)
	if elapsed <= 0 {
		return state.tokens
	}
	refilled := state.tokens + elapsed.Seconds()*float64(state.perMinute)/60
	return math.Min(refilled, float64(state.burst))
}

func tokenWait(tokens, needed float64, perMinute int) time.Duration {
	seconds := (needed - tokens) * 60 / float64(perMinute)
	if seconds <= 0 {
		return time.Millisecond
	}
	return time.Duration(math.Ceil(seconds*1000)) * time.Millisecond
}

func maxDuration(a, b time.Duration) time.Duration {
	if a > b {
		return a
	}
	return b
}

// Run bounds memory for untrusted IP-derived keys. It is intentionally local:
// counters disappear on restart and never create write pressure on Turso.
func (l *Limiter) Run(done <-chan struct{}) {
	if l == nil {
		return
	}
	ticker := time.NewTicker(bucketCleanupEvery)
	defer ticker.Stop()
	for {
		select {
		case <-done:
			return
		case now := <-ticker.C:
			cutoff := now.Add(-bucketIdleTTL)
			l.mu.Lock()
			for key, state := range l.buckets {
				if !state.pinned && state.lastSeen.Before(cutoff) {
					delete(l.buckets, key)
					l.nonPinnedBuckets--
				}
			}
			l.mu.Unlock()
		}
	}
}
