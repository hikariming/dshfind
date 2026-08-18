// Package cache 持有插件数据的内存快照:启动全量加载,后台定时刷新。
// 数据每天才同步一次,suggest / 列表全走内存,免去每次打字一趟 Turso HTTP 往返。
package cache

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"strings"
	"sync/atomic"
	"time"

	"github.com/dsh-external/dshfind/server/internal/store"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
)

// 遥测走全局 provider；未启用 OTel 时是 no-op，刷新热路径零额外分配。
var (
	tracer = otel.Tracer("github.com/dsh-external/dshfind/server/internal/cache")
	meter  = otel.Meter("github.com/dsh-external/dshfind/server/internal/cache")

	refreshCounter, _ = meter.Int64Counter("dshfind.cache.refresh",
		metric.WithDescription("插件快照刷新次数（按 result=ok/error 区分）"))
	refreshDuration, _ = meter.Float64Histogram("dshfind.cache.refresh.duration",
		metric.WithDescription("插件快照刷新耗时"), metric.WithUnit("s"))
)

// Suggestion 与 Next 端 src/lib/suggest.ts 的接口逐字段对齐(camelCase),
// 这是 /v1/suggest 兼容现有 /api/suggest 的契约,别动字段名。
type Suggestion struct {
	Type     string `json:"type"` // 恒为 "plugin"
	ID       string `json:"id"`
	Label    string `json:"label"`
	Sub      string `json:"sub"`
	Href     string `json:"href"`
	Stars    int    `json:"stars"`
	Featured bool   `json:"featured"`
}

type suggestEntry struct {
	sug Suggestion
	// 预拼好的小写检索串,口径同 /api/suggest:fullName + description + tags(不含 language)。
	hay string
}

type Snapshot struct {
	// 行序即 SQL 的 is_featured DESC, stars DESC, full_name,suggest 靠它做优先级。
	Plugins    []store.Plugin
	ByFullName map[string]*store.Plugin // key 为小写 full_name,详情查找大小写不敏感
	// ListHay[i] 是 Plugins[i] 的列表检索串:比 suggest 的 hay 多 language 一段,
	// 对齐 /search 页的既有口径(搜 "python" 能按语言命中)。
	ListHay    []string
	suggestIdx []suggestEntry
	// Version 只由公开的基础插件数据决定；同一数据重复刷新不会改变，供游标分页
	// 与外部同步检测使用。AsOf 则是该数据中最新的可追溯写入时间。
	Version  string
	AsOf     time.Time
	LoadedAt time.Time
}

// Suggest 复刻 /api/suggest 语义:顺序扫描,子串包含,命中 limit 条即停。
// q 需已 trim + 截断 + lower。
func (s *Snapshot) Suggest(q string, limit int) []Suggestion {
	out := make([]Suggestion, 0, limit)
	for i := range s.suggestIdx {
		if len(out) >= limit {
			break
		}
		if strings.Contains(s.suggestIdx[i].hay, q) {
			out = append(out, s.suggestIdx[i].sug)
		}
	}
	return out
}

type Cache struct {
	st   *store.Store
	snap atomic.Pointer[Snapshot]
}

func New(st *store.Store) *Cache {
	return &Cache{st: st}
}

// Get 返回当前快照;从未加载成功过时为 nil(healthz 据此报 503)。
func (c *Cache) Get() *Snapshot {
	return c.snap.Load()
}

// Seed 直接装入一份快照。仅供测试:生产路径一律经 Refresh 从 Turso 装载。
func (c *Cache) Seed(snap *Snapshot) {
	c.snap.Store(snap)
}

func (c *Cache) Refresh(ctx context.Context) error {
	start := time.Now()
	ctx, span := tracer.Start(ctx, "cache.Refresh")
	defer func() {
		refreshDuration.Record(ctx, time.Since(start).Seconds())
		span.End()
	}()
	plugins, err := c.st.LoadAllPlugins(ctx)
	if err != nil {
		refreshCounter.Add(ctx, 1, metric.WithAttributes(attribute.String("result", "error")))
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return err
	}
	refreshCounter.Add(ctx, 1, metric.WithAttributes(attribute.String("result", "ok")))
	span.SetAttributes(attribute.Int("plugins.count", len(plugins)))
	loadedAt := time.Now().UTC()
	version, asOf := datasetMetadata(plugins, loadedAt)
	snap := &Snapshot{
		Plugins:    plugins,
		ByFullName: make(map[string]*store.Plugin, len(plugins)),
		ListHay:    make([]string, len(plugins)),
		suggestIdx: make([]suggestEntry, len(plugins)),
		Version:    version,
		AsOf:       asOf,
		LoadedAt:   loadedAt,
	}
	for i := range plugins {
		p := &plugins[i]
		snap.ByFullName[strings.ToLower(p.FullName)] = p
		sub := p.Description
		if sub == "" {
			sub = "@" + p.Owner
		}
		hay := strings.ToLower(p.FullName + " " + p.Description + " " + strings.Join(p.Tags, " "))
		snap.ListHay[i] = hay + " " + strings.ToLower(p.Language)
		snap.suggestIdx[i] = suggestEntry{
			sug: Suggestion{
				Type:  "plugin",
				ID:    p.FullName,
				Label: p.Name,
				Sub:   sub,
				// 站内详情页相对路径,locale 前缀由前端 next-intl router 补;与现契约一致
				Href:     "/plugins/" + p.FullName,
				Stars:    p.Stars,
				Featured: p.IsFeatured,
			},
			hay: hay,
		}
	}
	c.snap.Store(snap)
	return nil
}

func datasetMetadata(plugins []store.Plugin, fallback time.Time) (string, time.Time) {
	// Plugin 没有 map 字段，encoding/json 的字段顺序稳定；因此 hash 是同一公开基础
	// 数据集的稳定版本，而非每 10 分钟刷新一次就变化的时间戳。
	encoded, err := json.Marshal(plugins)
	if err != nil {
		// 当前数据结构不会触发该分支；保留一个确定的版本，避免对外返回空值。
		encoded = []byte("[]")
	}
	sum := sha256.Sum256(encoded)
	version := "sha256:" + hex.EncodeToString(sum[:])

	asOf := time.Time{}
	for i := range plugins {
		for _, raw := range []string{
			valueOrEmpty(plugins[i].LastSyncedAt),
			valueOrEmpty(plugins[i].ScoredAt),
			valueOrEmpty(plugins[i].Install.ProbedAt),
		} {
			if parsed, err := time.Parse(time.RFC3339, raw); err == nil && parsed.After(asOf) {
				asOf = parsed.UTC()
			}
		}
	}
	if asOf.IsZero() {
		asOf = fallback
	}
	return version, asOf
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

// Run 定时刷新;失败只告警并沿用旧快照,服务不受影响。
func (c *Cache) Run(ctx context.Context, every time.Duration) {
	ticker := time.NewTicker(every)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rctx, cancel := context.WithTimeout(ctx, 60*time.Second)
			if err := c.Refresh(rctx); err != nil {
				slog.Warn("插件快照刷新失败,沿用旧数据", "err", err)
			}
			cancel()
		}
	}
}
