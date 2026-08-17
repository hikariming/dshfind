// Package audit 异步记录 API 访问:请求路径上只做一次非阻塞入队,
// 后台批量落库(明细 api_requests + 聚合 api_usage_daily),绝不拖慢请求。
package audit

import (
	"context"
	"log/slog"
	"sync/atomic"
	"time"

	"github.com/dsh-external/dshfind/server/internal/store"
)

type Event = store.RequestLog

const (
	queueCap      = 4096
	flushInterval = 5 * time.Second
	flushBatchMax = 200
)

type Logger struct {
	ch      chan Event
	dropped atomic.Int64
	st      *store.Store
}

func New(st *store.Store) *Logger {
	return &Logger{ch: make(chan Event, queueCap), st: st}
}

// Log 非阻塞入队;队列满了就丢弃并计数——宁丢日志不堵请求。
func (l *Logger) Log(e Event) {
	select {
	case l.ch <- e:
	default:
		l.dropped.Add(1)
	}
}

func (l *Logger) QueueLen() int    { return len(l.ch) }
func (l *Logger) Dropped() int64   { return l.dropped.Load() }

// Run 阻塞运行:每 5s 或攒满 200 条 flush 一次;ctx 取消后清空残余再返回。
// 调用方应在 http server 关闭后等待 Run 返回,保证优雅退出不丢批。
func (l *Logger) Run(ctx context.Context) {
	ticker := time.NewTicker(flushInterval)
	defer ticker.Stop()
	batch := make([]Event, 0, flushBatchMax)

	flush := func() {
		if len(batch) == 0 {
			return
		}
		l.flush(batch)
		batch = batch[:0]
	}

	for {
		select {
		case e := <-l.ch:
			batch = append(batch, e)
			if len(batch) >= flushBatchMax {
				flush()
			}
		case <-ticker.C:
			flush()
		case <-ctx.Done():
			// 退出前把 channel 里剩下的也捞干净
			for {
				select {
				case e := <-l.ch:
					batch = append(batch, e)
					if len(batch) >= flushBatchMax {
						flush()
					}
				default:
					flush()
					return
				}
			}
		}
	}
}

func (l *Logger) flush(batch []Event) {
	// 用独立 context:优雅退出时主 ctx 已取消,最后一批仍要写完
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := l.st.InsertRequests(ctx, batch); err != nil {
		slog.Error("审计明细落库失败,本批丢弃", "err", err, "count", len(batch))
		return
	}
	if err := l.st.UpsertDailyUsage(ctx, batch); err != nil {
		slog.Error("审计日聚合更新失败", "err", err)
	}

	// 惰性更新 last_used_at:每批每 key 最多一次
	seen := map[int64]bool{}
	ids := []int64{}
	var lastTS string
	for _, e := range batch {
		if e.APIKeyID != 0 && !seen[e.APIKeyID] {
			seen[e.APIKeyID] = true
			ids = append(ids, e.APIKeyID)
		}
		if e.TS > lastTS {
			lastTS = e.TS
		}
	}
	if err := l.st.TouchKeysUsed(ctx, ids, lastTS); err != nil {
		slog.Warn("更新 key last_used_at 失败", "err", err)
	}
}
