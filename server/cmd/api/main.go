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

	if err := st.Migrate(ctx); err != nil {
		slog.Error("审计表迁移失败", "err", err)
		os.Exit(1)
	}

	c := cache.New(st)
	if err := c.Refresh(ctx); err != nil {
		// 不退出:healthz 会报 503 挡住流量,刷新循环随后重试
		slog.Error("插件快照首次加载失败,等待定时重试", "err", err)
	} else {
		slog.Info("插件快照已加载", "count", len(c.Get().Plugins))
	}

	aud := audit.New(st)
	rl := ratelimit.New()
	srv := httpapi.New(cfg, c, st, aud, rl)
	if err := srv.ReloadKeys(ctx); err != nil {
		slog.Warn("API key 表加载失败,稍后随刷新周期重试", "err", err)
	}

	go c.Run(ctx, cfg.CacheRefreshInterval)
	go rl.Run(ctx)
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
