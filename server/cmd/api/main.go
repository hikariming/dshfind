// dshfind API 服务:首页搜索建议 + 对外插件数据 + 访问审计。部署于 Railway。
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dsh-external/dshfind/server/internal/audit"
	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/config"
	"github.com/dsh-external/dshfind/server/internal/httpapi"
	"github.com/dsh-external/dshfind/server/internal/ratelimit"
	"github.com/dsh-external/dshfind/server/internal/store"
)

const (
	startupMigrationTimeout = 10 * time.Second
	startupCacheTimeout     = 5 * time.Second
	startupRetryInterval    = 5 * time.Second
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, nil)))

	cfg, err := config.Load()
	if err != nil {
		slog.Error("配置加载失败", "err", err)
		os.Exit(1)
	}

	st, err := store.Open(cfg.TursoURL, cfg.TursoToken)
	if err != nil {
		slog.Error("Turso 连接初始化失败", "err", err)
		os.Exit(1)
	}
	defer st.Close()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	c := cache.New(st)
	if err := initializeStore(ctx, st, c); err != nil {
		// 服务仍启动；healthz 保持 503，后台以短周期重试。这样 Turso 的短暂网络
		// 抖动不会让 Railway 在 HTTP server 尚未监听前就耗尽健康检查时间。
		slog.Error("Turso 首次初始化失败,等待重试", "err", err)
		go initializeStoreLoop(ctx, st, c)
	} else {
		slog.Info("插件快照已加载", "count", len(c.Get().Plugins))
	}

	aud := audit.New(st)
	// Token balances are local, volatile hot-path state. Policy itself is loaded
	// from durable Railway variables and the API-key policy table.
	rl := ratelimit.New(cfg.RateLimitMaxBuckets)
	srv := httpapi.New(cfg, c, st, aud, rl)
	// 可选的分布式限流：配置齐全时启用，Redis 故障会在请求路径上 fail-open 回内存桶。
	if rb := ratelimit.NewRedisBackend(cfg.UpstashRedisRESTURL, cfg.UpstashRedisRESTToken); rb != nil {
		srv.SetRedisBackend(rb)
		slog.Info("限流后端: Upstash Redis（故障自动降级内存桶）")
	}
	if err := srv.ReloadKeys(ctx); err != nil {
		slog.Warn("API key 表加载失败,稍后随刷新周期重试", "err", err)
	}

	go c.Run(ctx, cfg.CacheRefreshInterval)
	go rl.Run(ctx.Done())
	go keyReloadLoop(ctx, srv, cfg.CacheRefreshInterval)
	go pruneLoop(ctx, st, cfg.LogRetentionDays)

	auditDone := make(chan struct{})
	go func() {
		aud.Run(ctx)
		close(auditDone)
	}()

	httpServer := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
	}
	go func() {
		<-ctx.Done()
		shCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = httpServer.Shutdown(shCtx)
	}()

	slog.Info("服务启动", "port", cfg.Port)
	if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("http server 退出", "err", err)
	}

	// 等审计队列清空落库,再退出——redeploy 不丢最后一批日志
	<-auditDone
	slog.Info("退出完成")
}

func keyReloadLoop(ctx context.Context, srv *httpapi.Server, every time.Duration) {
	ticker := time.NewTicker(every)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rctx, cancel := context.WithTimeout(ctx, 30*time.Second)
			if err := srv.ReloadKeys(rctx); err != nil {
				slog.Warn("API key 表重载失败", "err", err)
			}
			cancel()
		}
	}
}

func pruneLoop(ctx context.Context, st *store.Store, retentionDays int) {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
			if n, err := st.PruneRequests(rctx, retentionDays); err != nil {
				slog.Warn("审计明细清理失败", "err", err)
			} else if n > 0 {
				slog.Info("审计明细已清理", "deleted", n, "retention_days", retentionDays)
			}
			cancel()
		}
	}
}

// initializeStore 把一次远程 Turso 初始化限制在短窗口内。schema migration
// 允许 10 秒（首次建表需要多条 DDL），缓存加载只给 5 秒；任一超时都交给循环
// 重试，避免阻塞 Railway 的健康检查。
func initializeStore(ctx context.Context, st *store.Store, c *cache.Cache) error {
	migrateCtx, cancelMigration := context.WithTimeout(ctx, startupMigrationTimeout)
	err := st.Migrate(migrateCtx)
	cancelMigration()
	if err != nil {
		return err
	}
	cacheCtx, cancelCache := context.WithTimeout(ctx, startupCacheTimeout)
	defer cancelCache()
	return c.Refresh(cacheCtx)
}

func initializeStoreLoop(ctx context.Context, st *store.Store, c *cache.Cache) {
	ticker := time.NewTicker(startupRetryInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := initializeStore(ctx, st, c); err != nil {
				slog.Warn("Turso 初始化重试失败", "err", err)
				continue
			}
			slog.Info("Turso 初始化重试成功", "plugins", len(c.Get().Plugins))
			return
		}
	}
}
