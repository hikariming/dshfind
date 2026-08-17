package httpapi

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dsh-external/dshfind/server/internal/audit"
	"github.com/dsh-external/dshfind/server/internal/config"
	"github.com/dsh-external/dshfind/server/internal/ratelimit"
	"github.com/dsh-external/dshfind/server/internal/store"
)

func TestPublicUsesHashedActorIPAndProcessGlobalBuckets(t *testing.T) {
	cfg := &config.Config{
		GlobalRatePerMin: 60, GlobalRateBurst: 1,
		IPRatePerMin: 60, IPRateBurst: 2,
		AnonRatePerMin: 60, AnonRateBurst: 2,
		SuggestRatePerMin: 60, SuggestRateBurst: 2,
		GraphQLRatePerMin: 60, GraphQLRateBurst: 2, GraphQLRateCost: 1,
		KeyRatePerMin: 60, KeyRateBurst: 2,
		RateLimitMaxBuckets: 100,
	}
	server := New(cfg, nil, nil, audit.New(nil), ratelimit.New(cfg.RateLimitMaxBuckets))
	handler := server.public("/v1/plugins", rateProfileStandard, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	first := httptest.NewRequest(http.MethodGet, "https://api.example.test/v1/plugins", nil)
	first.RemoteAddr = "203.0.113.8:1234"
	firstResponse := httptest.NewRecorder()
	handler.ServeHTTP(firstResponse, first)
	if firstResponse.Code != http.StatusNoContent {
		t.Fatalf("first status = %d, want 204", firstResponse.Code)
	}

	// A second IP still has its own actor/IP burst, so this 429 can only be
	// caused by the service-process global bucket.
	second := httptest.NewRequest(http.MethodGet, "https://api.example.test/v1/plugins", nil)
	second.RemoteAddr = "203.0.113.9:1234"
	secondResponse := httptest.NewRecorder()
	handler.ServeHTTP(secondResponse, second)
	if secondResponse.Code != http.StatusTooManyRequests {
		t.Fatalf("second status = %d, want global 429", secondResponse.Code)
	}

	hash := rateLimitIPKey("203.0.113.8")
	if hash == "203.0.113.8" || hash == "" {
		t.Errorf("IP hash = %q, want a non-empty non-raw key", hash)
	}
}

func TestGraphQLConsumesConfiguredGlobalCost(t *testing.T) {
	cfg := &config.Config{
		GlobalRatePerMin: 60, GlobalRateBurst: 5,
		IPRatePerMin: 60, IPRateBurst: 2,
		AnonRatePerMin: 60, AnonRateBurst: 2,
		SuggestRatePerMin: 60, SuggestRateBurst: 2,
		GraphQLRatePerMin: 60, GraphQLRateBurst: 2, GraphQLRateCost: 5,
		KeyRatePerMin: 60, KeyRateBurst: 2,
		RateLimitMaxBuckets: 100,
	}
	server := New(cfg, nil, nil, audit.New(nil), ratelimit.New(cfg.RateLimitMaxBuckets))
	graphql := server.public("/graphql", rateProfileGraphQL, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	standard := server.public("/v1/plugins", rateProfileStandard, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	request := httptest.NewRequest(http.MethodGet, "https://api.example.test/graphql", nil)
	request.RemoteAddr = "203.0.113.8:1234"
	response := httptest.NewRecorder()
	graphql.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent {
		t.Fatalf("GraphQL status = %d, want 204", response.Code)
	}

	request = httptest.NewRequest(http.MethodGet, "https://api.example.test/v1/plugins", nil)
	request.RemoteAddr = "203.0.113.9:1234"
	response = httptest.NewRecorder()
	standard.ServeHTTP(response, request)
	if response.Code != http.StatusTooManyRequests {
		t.Fatalf("standard status = %d, want global 429 after GraphQL cost", response.Code)
	}
}

func TestInvalidKeyIsRateLimitedBeforeUnauthorizedResponse(t *testing.T) {
	cfg := &config.Config{
		GlobalRatePerMin: 60, GlobalRateBurst: 1,
		IPRatePerMin: 60, IPRateBurst: 2,
		AnonRatePerMin: 60, AnonRateBurst: 2,
		SuggestRatePerMin: 60, SuggestRateBurst: 2,
		GraphQLRatePerMin: 60, GraphQLRateBurst: 2, GraphQLRateCost: 1,
		KeyRatePerMin: 60, KeyRateBurst: 2,
		RateLimitMaxBuckets: 100,
	}
	server := New(cfg, nil, nil, audit.New(nil), ratelimit.New(cfg.RateLimitMaxBuckets))
	handler := server.public("/v1/plugins", rateProfileStandard, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	request := httptest.NewRequest(http.MethodGet, "https://api.example.test/v1/plugins", nil)
	request.Header.Set("X-Api-Key", "invalid")
	request.RemoteAddr = "203.0.113.8:1234"
	first := httptest.NewRecorder()
	handler.ServeHTTP(first, request)
	if first.Code != http.StatusUnauthorized {
		t.Fatalf("first invalid-key status = %d, want 401", first.Code)
	}

	request = httptest.NewRequest(http.MethodGet, "https://api.example.test/v1/plugins", nil)
	request.Header.Set("X-Api-Key", "invalid")
	request.RemoteAddr = "203.0.113.9:1234"
	second := httptest.NewRecorder()
	handler.ServeHTTP(second, request)
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("second invalid-key status = %d, want global 429", second.Code)
	}
}

func TestValidKeyUsesDedicatedQuotaRatherThanSharedEgressIPQuota(t *testing.T) {
	cfg := &config.Config{
		GlobalRatePerMin: 60, GlobalRateBurst: 5,
		IPRatePerMin: 60, IPRateBurst: 1,
		AnonRatePerMin: 60, AnonRateBurst: 1,
		SuggestRatePerMin: 60, SuggestRateBurst: 1,
		GraphQLRatePerMin: 60, GraphQLRateBurst: 1, GraphQLRateCost: 1,
		KeyRatePerMin: 60, KeyRateBurst: 2,
		RateLimitMaxBuckets: 100,
	}
	server := New(cfg, nil, nil, audit.New(nil), ratelimit.New(cfg.RateLimitMaxBuckets))
	plaintext := "dshf_server_only"
	hash := sha256.Sum256([]byte(plaintext))
	keys := map[string]store.APIKey{hex.EncodeToString(hash[:]): {ID: 1, KeyPrefix: "dshf_server", RatePerMin: 60}}
	server.keys.Store(&keys)
	handler := server.public("/v1/plugins", rateProfileStandard, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	for attempt := 1; attempt <= 2; attempt++ {
		request := httptest.NewRequest(http.MethodGet, "https://api.example.test/v1/plugins", nil)
		request.Header.Set("X-Api-Key", plaintext)
		request.RemoteAddr = "203.0.113.8:1234"
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != http.StatusNoContent {
			t.Fatalf("keyed request %d status = %d, want 204", attempt, response.Code)
		}
	}
}

func TestLowCustomKeyQuotaCannotUseGenericBurst(t *testing.T) {
	cfg := &config.Config{
		GlobalRatePerMin: 60, GlobalRateBurst: 5,
		IPRatePerMin: 60, IPRateBurst: 5,
		AnonRatePerMin: 60, AnonRateBurst: 5,
		SuggestRatePerMin: 60, SuggestRateBurst: 5,
		GraphQLRatePerMin: 60, GraphQLRateBurst: 5, GraphQLRateCost: 1,
		KeyRatePerMin: 60, KeyRateBurst: 30,
		RateLimitMaxBuckets: 100,
	}
	server := New(cfg, nil, nil, audit.New(nil), ratelimit.New(cfg.RateLimitMaxBuckets))
	plaintext := "dshf_low_quota"
	hash := sha256.Sum256([]byte(plaintext))
	keys := map[string]store.APIKey{hex.EncodeToString(hash[:]): {ID: 1, KeyPrefix: "dshf_low_quota", RatePerMin: 1}}
	server.keys.Store(&keys)
	handler := server.public("/v1/plugins", rateProfileStandard, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	for attempt, want := range []int{http.StatusNoContent, http.StatusTooManyRequests} {
		request := httptest.NewRequest(http.MethodGet, "https://api.example.test/v1/plugins", nil)
		request.Header.Set("X-Api-Key", plaintext)
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != want {
			t.Fatalf("low-quota keyed request %d status = %d, want %d", attempt+1, response.Code, want)
		}
	}
}
