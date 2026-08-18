// Package config 从环境变量装配服务配置,启动时校验必填项。
package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	// Railway 注入 PORT;本地默认 8080。
	Port       string
	TursoURL   string
	TursoToken string
	// Railway Git 自动部署时注入的 revision；公开 healthz 用它让发布 Gate 确认
	// 真正承载流量的实例，而非只相信控制面的部署记录。
	BuildCommit       string
	BuildDeploymentID string
	// admin 端点的 Bearer token;为空时 admin 端点整体返回 503。
	AdminToken string
	// 插件快照与 API key 表的内存刷新周期。数据每天才同步一次,10 分钟绰绰有余。
	CacheRefreshInterval time.Duration
	// api_requests 明细保留天数;api_usage_daily 聚合永久保留。
	LogRetentionDays int
	// 限流规则保存在 Railway 环境变量；API key 的定制额度保存在 Turso。
	// token 余额刻意只保留在内存，避免每个请求产生远程数据库写入。
	GlobalRatePerMin  int
	GlobalRateBurst   int
	IPRatePerMin      int
	IPRateBurst       int
	AnonRatePerMin    int
	AnonRateBurst     int
	SuggestRatePerMin int
	SuggestRateBurst  int
	GraphQLRatePerMin int
	GraphQLRateBurst  int
	// GraphQL 查询最多可触发两次 Turso 批量读取；因此每次在全局桶里
	// 消耗多个令牌。此参数也保存在 Railway 环境变量，便于容量调优。
	GraphQLRateCost int
	KeyRatePerMin   int
	KeyRateBurst    int
	// OAuth 回跳会触发 GitHub 网络调用，单独用更窄的本地/全局 bucket
	// 保护，避免它绕过公开数据 API 的额度。
	AuthRatePerMin       int
	AuthRateBurst        int
	AuthGlobalRatePerMin int
	AuthGlobalRateBurst  int
	// 为了让内存限流在分布式 IP 攻击下保持有界，限制活跃的非全局桶数。
	RateLimitMaxBuckets int
	// GitHub OAuth 只在 Go API 侧处理。WebURL 是成功/失败后的唯一回跳站点；
	// APIPublicURL 是登记给 GitHub 的 callback 所在的公开 API 域名。
	WebURL             string
	APIPublicURL       string
	AuthCookieDomain   string
	AuthSecret         string
	GitHubClientID     string
	GitHubClientSecret string
}

func Load() (*Config, error) {
	rates, err := loadRateLimitSettings()
	if err != nil {
		return nil, err
	}
	cfg := &Config{
		Port:                 envOr("PORT", "8080"),
		TursoURL:             normalizeTursoURL(os.Getenv("TURSO_DATABASE_URL")),
		TursoToken:           os.Getenv("TURSO_AUTH_TOKEN"),
		BuildCommit:          envFirst("RAILWAY_GIT_COMMIT_SHA", "GIT_COMMIT_SHA"),
		BuildDeploymentID:    envFirst("RAILWAY_DEPLOYMENT_ID"),
		AdminToken:           os.Getenv("ADMIN_TOKEN"),
		CacheRefreshInterval: time.Duration(envInt("CACHE_REFRESH_MINUTES", 10)) * time.Minute,
		LogRetentionDays:     envInt("LOG_RETENTION_DAYS", 30),
		// 100 RPS sustained / 500 burst leaves headroom for ten-thousand-plus
		// daily PV peaks. Per-IP and actor buckets remain the abuse boundary.
		GlobalRatePerMin:     rates.globalPerMin,
		GlobalRateBurst:      rates.globalBurst,
		IPRatePerMin:         rates.ipPerMin,
		IPRateBurst:          rates.ipBurst,
		AnonRatePerMin:       rates.anonPerMin,
		AnonRateBurst:        rates.anonBurst,
		SuggestRatePerMin:    rates.suggestPerMin,
		SuggestRateBurst:     rates.suggestBurst,
		GraphQLRatePerMin:    rates.graphQLPerMin,
		GraphQLRateBurst:     rates.graphQLBurst,
		GraphQLRateCost:      rates.graphQLCost,
		KeyRatePerMin:        rates.keyPerMin,
		KeyRateBurst:         rates.keyBurst,
		AuthRatePerMin:       rates.authPerMin,
		AuthRateBurst:        rates.authBurst,
		AuthGlobalRatePerMin: rates.authGlobalPerMin,
		AuthGlobalRateBurst:  rates.authGlobalBurst,
		RateLimitMaxBuckets:  rates.maxBuckets,
		WebURL:               normalizePublicURL(envOr("WEB_URL", "http://localhost:3100")),
		APIPublicURL:         normalizePublicURL(envOr("API_PUBLIC_URL", "http://localhost:8080")),
		AuthCookieDomain:     strings.TrimPrefix(strings.TrimSpace(os.Getenv("AUTH_COOKIE_DOMAIN")), "."),
		AuthSecret:           os.Getenv("AUTH_SECRET"),
		GitHubClientID:       os.Getenv("GITHUB_CLIENT_ID"),
		GitHubClientSecret:   os.Getenv("GITHUB_CLIENT_SECRET"),
	}
	if cfg.TursoURL == "" {
		return nil, fmt.Errorf("TURSO_DATABASE_URL 未设置")
	}
	if cfg.TursoToken == "" {
		return nil, fmt.Errorf("TURSO_AUTH_TOKEN 未设置")
	}
	if err := cfg.validateRateLimits(); err != nil {
		return nil, err
	}
	if err := cfg.validateOAuth(); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (cfg *Config) validateRateLimits() error {
	values := map[string]int{
		"GLOBAL_RATE_PER_MIN":      cfg.GlobalRatePerMin,
		"GLOBAL_RATE_BURST":        cfg.GlobalRateBurst,
		"IP_RATE_PER_MIN":          cfg.IPRatePerMin,
		"IP_RATE_BURST":            cfg.IPRateBurst,
		"ANON_RATE_PER_MIN":        cfg.AnonRatePerMin,
		"ANON_RATE_BURST":          cfg.AnonRateBurst,
		"SUGGEST_RATE_PER_MIN":     cfg.SuggestRatePerMin,
		"SUGGEST_RATE_BURST":       cfg.SuggestRateBurst,
		"GRAPHQL_RATE_PER_MIN":     cfg.GraphQLRatePerMin,
		"GRAPHQL_RATE_BURST":       cfg.GraphQLRateBurst,
		"GRAPHQL_RATE_COST":        cfg.GraphQLRateCost,
		"KEY_RATE_PER_MIN":         cfg.KeyRatePerMin,
		"KEY_RATE_BURST":           cfg.KeyRateBurst,
		"AUTH_RATE_PER_MIN":        cfg.AuthRatePerMin,
		"AUTH_RATE_BURST":          cfg.AuthRateBurst,
		"AUTH_GLOBAL_RATE_PER_MIN": cfg.AuthGlobalRatePerMin,
		"AUTH_GLOBAL_RATE_BURST":   cfg.AuthGlobalRateBurst,
		"RATE_LIMIT_MAX_BUCKETS":   cfg.RateLimitMaxBuckets,
	}
	for name, value := range values {
		if value <= 0 {
			return fmt.Errorf("%s 必须为正整数", name)
		}
	}
	if cfg.GraphQLRateCost > cfg.GlobalRateBurst {
		return fmt.Errorf("GRAPHQL_RATE_COST 不可大于 GLOBAL_RATE_BURST")
	}
	return nil
}

type rateLimitSettings struct {
	globalPerMin, globalBurst   int
	ipPerMin, ipBurst           int
	anonPerMin, anonBurst       int
	suggestPerMin, suggestBurst int
	graphQLPerMin, graphQLBurst int
	graphQLCost                 int
	keyPerMin, keyBurst         int
	authPerMin, authBurst       int
	authGlobalPerMin            int
	authGlobalBurst             int
	maxBuckets                  int
}

// loadRateLimitSettings intentionally rejects malformed values rather than
// silently using defaults. A typo in a Railway variable must fail a deploy
// before it weakens the production protection policy.
func loadRateLimitSettings() (rateLimitSettings, error) {
	var err error
	settings := rateLimitSettings{}
	for _, item := range []struct {
		name string
		def  int
		out  *int
	}{
		{"GLOBAL_RATE_PER_MIN", 6000, &settings.globalPerMin},
		{"GLOBAL_RATE_BURST", 500, &settings.globalBurst},
		{"IP_RATE_PER_MIN", 240, &settings.ipPerMin},
		{"IP_RATE_BURST", 60, &settings.ipBurst},
		{"ANON_RATE_PER_MIN", 30, &settings.anonPerMin},
		{"ANON_RATE_BURST", 10, &settings.anonBurst},
		{"SUGGEST_RATE_PER_MIN", 60, &settings.suggestPerMin},
		{"SUGGEST_RATE_BURST", 20, &settings.suggestBurst},
		{"GRAPHQL_RATE_PER_MIN", 60, &settings.graphQLPerMin},
		{"GRAPHQL_RATE_BURST", 20, &settings.graphQLBurst},
		{"GRAPHQL_RATE_COST", 10, &settings.graphQLCost},
		{"KEY_RATE_PER_MIN", 120, &settings.keyPerMin},
		{"KEY_RATE_BURST", 30, &settings.keyBurst},
		{"AUTH_RATE_PER_MIN", 60, &settings.authPerMin},
		{"AUTH_RATE_BURST", 20, &settings.authBurst},
		{"AUTH_GLOBAL_RATE_PER_MIN", 1800, &settings.authGlobalPerMin},
		{"AUTH_GLOBAL_RATE_BURST", 100, &settings.authGlobalBurst},
		{"RATE_LIMIT_MAX_BUCKETS", 65_536, &settings.maxBuckets},
	} {
		*item.out, err = requiredPositiveEnvInt(item.name, item.def)
		if err != nil {
			return rateLimitSettings{}, err
		}
	}
	return settings, nil
}

func requiredPositiveEnvInt(key string, def int) (int, error) {
	raw, present := os.LookupEnv(key)
	if !present || strings.TrimSpace(raw) == "" {
		return def, nil
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return 0, fmt.Errorf("%s 必须为正整数", key)
	}
	return value, nil
}

// libsql:// 改写为 https://,与 Next 端 src/lib/db.ts 同一做法:走无状态 HTTP,不占 WebSocket 连接。
func normalizeTursoURL(u string) string {
	if rest, ok := strings.CutPrefix(u, "libsql://"); ok {
		return "https://" + rest
	}
	return u
}

func normalizePublicURL(raw string) string {
	return strings.TrimRight(strings.TrimSpace(raw), "/")
}

func (cfg *Config) validateOAuth() error {
	configured := cfg.GitHubClientID != "" || cfg.GitHubClientSecret != "" || cfg.AuthSecret != ""
	if !configured {
		return nil
	}
	if cfg.GitHubClientID == "" || cfg.GitHubClientSecret == "" || cfg.AuthSecret == "" {
		return fmt.Errorf("GitHub OAuth 需要同时设置 GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET 和 AUTH_SECRET")
	}
	if len(cfg.AuthSecret) < 32 {
		return fmt.Errorf("AUTH_SECRET 至少需要 32 个字符")
	}
	parsedURLs := make(map[string]*url.URL, 2)
	for key, raw := range map[string]string{"WEB_URL": cfg.WebURL, "API_PUBLIC_URL": cfg.APIPublicURL} {
		u, err := url.Parse(raw)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
			return fmt.Errorf("%s 必须是无路径、无查询参数的完整 URL", key)
		}
		if u.Path != "" && u.Path != "/" {
			return fmt.Errorf("%s 不可包含路径", key)
		}
		parsedURLs[key] = u
	}
	if strings.Contains(cfg.AuthCookieDomain, "/") || strings.Contains(cfg.AuthCookieDomain, ":") {
		return fmt.Errorf("AUTH_COOKIE_DOMAIN 必须是域名，不可包含协议、路径或端口")
	}
	webHost := strings.ToLower(parsedURLs["WEB_URL"].Hostname())
	apiHost := strings.ToLower(parsedURLs["API_PUBLIC_URL"].Hostname())
	if webHost != apiHost && cfg.AuthCookieDomain == "" {
		return fmt.Errorf("WEB_URL 与 API_PUBLIC_URL 跨主机时必须设置 AUTH_COOKIE_DOMAIN 共享会话")
	}
	if cfg.AuthCookieDomain != "" {
		domain := strings.ToLower(cfg.AuthCookieDomain)
		for key, host := range map[string]string{"WEB_URL": webHost, "API_PUBLIC_URL": apiHost} {
			if host != domain && !strings.HasSuffix(host, "."+domain) {
				return fmt.Errorf("AUTH_COOKIE_DOMAIN 必须覆盖 %s 的主机", key)
			}
		}
	}
	return nil
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envFirst(keys ...string) string {
	for _, key := range keys {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return value
		}
	}
	return ""
}

func envInt(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}
