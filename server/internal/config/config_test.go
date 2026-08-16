package config

import (
	"strings"
	"testing"
)

func TestValidateOAuthRequiresASharedCookieDomainAcrossSubdomains(t *testing.T) {
	base := Config{
		WebURL:             "https://dshfind.com",
		APIPublicURL:       "https://api.dshfind.com",
		AuthSecret:         "0123456789abcdef0123456789abcdef",
		GitHubClientID:     "client",
		GitHubClientSecret: "secret",
	}
	if err := base.validateOAuth(); err == nil || !strings.Contains(err.Error(), "AUTH_COOKIE_DOMAIN") {
		t.Fatalf("missing shared domain error = %v", err)
	}

	base.AuthCookieDomain = "dshfind.com"
	if err := base.validateOAuth(); err != nil {
		t.Fatalf("valid shared domain error = %v", err)
	}

	base.AuthCookieDomain = "other.example"
	if err := base.validateOAuth(); err == nil || !strings.Contains(err.Error(), "必须覆盖") {
		t.Fatalf("unrelated domain error = %v", err)
	}
}

func TestValidateOAuthAllowsSameHostLocalDevelopmentWithoutDomain(t *testing.T) {
	cfg := Config{
		WebURL:             "http://localhost:3100",
		APIPublicURL:       "http://localhost:8080",
		AuthSecret:         "0123456789abcdef0123456789abcdef",
		GitHubClientID:     "client",
		GitHubClientSecret: "secret",
	}
	if err := cfg.validateOAuth(); err != nil {
		t.Fatalf("local OAuth config error = %v", err)
	}
}

func TestValidateRateLimitsRejectsDisabledSharedBucket(t *testing.T) {
	cfg := Config{
		GlobalRatePerMin: 1, GlobalRateBurst: 1, IPRatePerMin: 1, IPRateBurst: 1,
		AnonRatePerMin: 1, AnonRateBurst: 1, SuggestRatePerMin: 1, SuggestRateBurst: 1,
		GraphQLRatePerMin: 1, GraphQLRateBurst: 1, GraphQLRateCost: 1, KeyRatePerMin: 1, KeyRateBurst: 1,
		AuthRatePerMin: 1, AuthRateBurst: 1, AuthGlobalRatePerMin: 1, AuthGlobalRateBurst: 1,
		RateLimitMaxBuckets: 1,
	}
	if err := cfg.validateRateLimits(); err != nil {
		t.Fatalf("valid rate limits: %v", err)
	}
	cfg.GlobalRateBurst = 0
	if err := cfg.validateRateLimits(); err == nil || !strings.Contains(err.Error(), "GLOBAL_RATE_BURST") {
		t.Fatalf("disabled global burst error = %v", err)
	}
}

func TestRequiredPositiveEnvIntRejectsMalformedRateLimit(t *testing.T) {
	t.Setenv("GLOBAL_RATE_PER_MIN", "not-a-number")
	if _, err := loadRateLimitSettings(); err == nil || !strings.Contains(err.Error(), "GLOBAL_RATE_PER_MIN") {
		t.Fatalf("malformed rate setting error = %v", err)
	}
}
