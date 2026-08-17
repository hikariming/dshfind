package ratelimit

import (
	"sync"
	"testing"
	"time"
)

func TestAllowAtomicallyRejectsWithoutPartiallyConsuming(t *testing.T) {
	limiter := New(0)
	limiter.now = func() time.Time { return time.Unix(0, 0) }
	global := Bucket{Key: "global", PerMinute: 1, Burst: 1}
	firstIP := Bucket{Key: "ip:first", PerMinute: 1, Burst: 1}
	secondIP := Bucket{Key: "ip:second", PerMinute: 1, Burst: 1}

	if ok, _ := limiter.Allow(firstIP, global); !ok {
		t.Fatal("first request should consume both buckets")
	}
	if ok, retry := limiter.Allow(secondIP, global); ok || retry <= 0 {
		t.Fatalf("global exhaustion = (%v, %v), want false with retry", ok, retry)
	}
	// The failed request must not consume secondIP: it still has its entire
	// burst when checked alone.
	if ok, _ := limiter.Allow(secondIP); !ok {
		t.Fatal("denied multi-bucket request partially consumed IP token")
	}
	if ok, _ := limiter.Allow(secondIP); ok {
		t.Fatal("single-token IP bucket over-issued")
	}
}

func TestAllowDoesNotOverissueGlobalBucketUnderConcurrency(t *testing.T) {
	limiter := New(0)
	bucket := Bucket{Key: "global", PerMinute: 1, Burst: 5}
	const attempts = 50
	var wg sync.WaitGroup
	allowed := make(chan bool, attempts)
	for range attempts {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ok, _ := limiter.Allow(bucket)
			allowed <- ok
		}()
	}
	wg.Wait()
	close(allowed)
	count := 0
	for ok := range allowed {
		if ok {
			count++
		}
	}
	if count != bucket.Burst {
		t.Fatalf("allowed = %d, want exact burst %d", count, bucket.Burst)
	}
}

func TestPolicyChangeCapsExistingBurst(t *testing.T) {
	now := time.Unix(0, 0)
	limiter := New(0)
	limiter.now = func() time.Time { return now }
	bucket := Bucket{Key: "ip", PerMinute: 60, Burst: 3}
	if ok, _ := limiter.Allow(bucket); !ok {
		t.Fatal("initial request rejected")
	}
	// A policy redeploy reducing burst must not retain the old larger balance.
	bucket.Burst = 1
	if ok, _ := limiter.Allow(bucket); !ok {
		t.Fatal("one token after cap should be usable")
	}
	if ok, _ := limiter.Allow(bucket); ok {
		t.Fatal("old burst tokens survived policy cap")
	}
}

func TestBucketCapacityFailsClosedForNewUntrustedIdentities(t *testing.T) {
	limiter := New(2)
	limiter.now = func() time.Time { return time.Unix(0, 0) }
	global := Bucket{Key: "global", PerMinute: 60, Burst: 2, Pinned: true}
	first := Bucket{Key: "ip:first", PerMinute: 60, Burst: 1}
	second := Bucket{Key: "ip:second", PerMinute: 60, Burst: 1}
	third := Bucket{Key: "ip:third", PerMinute: 60, Burst: 1}

	if ok, _ := limiter.Allow(first, global); !ok {
		t.Fatal("first identity should be admitted")
	}
	if ok, _ := limiter.Allow(second, global); !ok {
		t.Fatal("second identity should fill the non-pinned capacity")
	}
	if ok, retry := limiter.Allow(third, global); ok || retry < time.Minute {
		t.Fatalf("new identity at capacity = (%v, %v), want false and one-minute retry", ok, retry)
	}
	if got := limiter.nonPinnedBuckets; got != 2 {
		t.Fatalf("non-pinned bucket count = %d, want capacity 2", got)
	}
	if got := len(limiter.buckets); got != 3 {
		t.Fatalf("total bucket count = %d, want two identities plus global", got)
	}
}
