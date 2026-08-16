// Package config 从环境变量装配服务配置,启动时校验必填项。
package config

import (
	"fmt"
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
	// admin 端点的 Bearer token;为空时 admin 端点整体返回 503。
	AdminToken string
	// 插件快照与 API key 表的内存刷新周期。数据每天才同步一次,10 分钟绰绰有余。
	CacheRefreshInterval time.Duration
	// api_requests 明细保留天数;api_usage_daily 聚合永久保留。
	LogRetentionDays int
	// 限流:匿名按 IP / suggest 匿名单独放宽(打字即发)/ 带 key 的默认额度(可被 api_keys.rate_per_min 覆盖)。
	AnonRatePerMin    int
	SuggestRatePerMin int
	KeyRatePerMin     int
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:                 envOr("PORT", "8080"),
		TursoURL:             normalizeTursoURL(os.Getenv("TURSO_DATABASE_URL")),
		TursoToken:           os.Getenv("TURSO_AUTH_TOKEN"),
		AdminToken:           os.Getenv("ADMIN_TOKEN"),
		CacheRefreshInterval: time.Duration(envInt("CACHE_REFRESH_MINUTES", 10)) * time.Minute,
		LogRetentionDays:     envInt("LOG_RETENTION_DAYS", 30),
		AnonRatePerMin:       envInt("ANON_RATE_PER_MIN", 30),
		SuggestRatePerMin:    envInt("SUGGEST_RATE_PER_MIN", 60),
		KeyRatePerMin:        envInt("KEY_RATE_PER_MIN", 120),
	}
	if cfg.TursoURL == "" {
		return nil, fmt.Errorf("TURSO_DATABASE_URL 未设置")
	}
	if cfg.TursoToken == "" {
		return nil, fmt.Errorf("TURSO_AUTH_TOKEN 未设置")
	}
	return cfg, nil
}

// libsql:// 改写为 https://,与 Next 端 src/lib/db.ts 同一做法:走无状态 HTTP,不占 WebSocket 连接。
func normalizeTursoURL(u string) string {
	if rest, ok := strings.CutPrefix(u, "libsql://"); ok {
		return "https://" + rest
	}
	return u
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
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
