// Package cache 持有插件数据的内存快照:启动全量加载,后台定时刷新。
// 数据每天才同步一次,suggest / 列表全走内存,免去每次打字一趟 Turso HTTP 往返。
package cache

import (
	"context"
	"log/slog"
	"strings"
	"sync/atomic"
	"time"

	"github.com/dsh-external/dshfind/server/internal/store"
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
	LoadedAt   time.Time
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

func (c *Cache) Refresh(ctx context.Context) error {
	plugins, err := c.st.LoadAllPlugins(ctx)
	if err != nil {
		return err
	}
	snap := &Snapshot{
		Plugins:    plugins,
		ByFullName: make(map[string]*store.Plugin, len(plugins)),
		ListHay:    make([]string, len(plugins)),
		suggestIdx: make([]suggestEntry, len(plugins)),
		LoadedAt:   time.Now().UTC(),
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
				Type:     "plugin",
				ID:       p.FullName,
				Label:    p.Name,
				Sub:      sub,
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
