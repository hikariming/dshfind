package httpapi

import (
	"net/http"
	"time"

	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/store"
)

// catalogImmutableCacheControl 用于带匹配 ?data_version= 的整包响应:内容已被
// 版本寻址(版本变即 data_version 变),共享缓存可以长期持有而不必回源验证。
const catalogImmutableCacheControl = "public, max-age=60, s-maxage=86400, immutable"

type catalogResponse struct {
	Data        []store.Plugin `json:"data"`
	Total       int            `json:"total"`
	DataVersion string         `json:"data_version"`
	AsOf        string         `json:"as_of"`
	GeneratedAt string         `json:"generated_at"`
}

// GET /v1/catalog —— 一次性返回整份目录(当前约数千条、数 MB),供批量消费者
// (如下一代桌面端市场)单次下载,取代逐页翻 /v1/plugins。数据按 data_version
// 不可变:推荐客户端先取列表第 1 页拿 data_version,再带 ?data_version= 请求
// 本端点,命中不可变长缓存;不带版本时退回常规短缓存。
func (s *Server) handleCatalog(w http.ResponseWriter, r *http.Request) {
	snap := s.cache.Get()
	if snap == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded yet", 0)
		return
	}
	// 版本不匹配时不 409:整包端点不做分页一致性担保,直接按当前快照返回,
	// 调用方比对响应里的 data_version 自行判断。
	cacheControl := publicDataCacheControl
	if v := r.URL.Query().Get("data_version"); v != "" && v == snap.Version {
		cacheControl = catalogImmutableCacheControl
	}
	writeCatalog(w, r, snap, cacheControl)
}

func writeCatalog(w http.ResponseWriter, r *http.Request, snap *cache.Snapshot, cacheControl string) {
	writeCacheableJSON(w, r, http.StatusOK, catalogResponse{
		Data:        snap.Plugins,
		Total:       len(snap.Plugins),
		DataVersion: snap.Version,
		AsOf:        snap.AsOf.Format(time.RFC3339),
		GeneratedAt: snap.AsOf.Format(time.RFC3339),
	}, cacheControl)
}
