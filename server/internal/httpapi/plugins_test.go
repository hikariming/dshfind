package httpapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/store"
)

// seededPluginServer 装配一个只带内存快照的 Server,用于直接驱动 handlePluginList
// (绕过 public 中间件链),快照含 count 条按原序排列的插件。
func seededPluginServer(count int) *Server {
	plugins := make([]store.Plugin, count)
	byName := make(map[string]*store.Plugin, count)
	for i := range plugins {
		full := fmt.Sprintf("owner%03d/repo%03d", i, i)
		plugins[i] = store.Plugin{
			FullName:      full,
			Name:          fmt.Sprintf("repo%03d", i),
			Owner:         fmt.Sprintf("owner%03d", i),
			URL:           "https://github.com/" + full,
			RepositoryURL: "https://github.com/" + full,
			Tags:          []string{},
		}
		byName[strings.ToLower(full)] = &plugins[i]
	}
	c := cache.New(nil)
	c.Seed(&cache.Snapshot{
		Plugins:    plugins,
		ByFullName: byName,
		Version:    "sha256:" + strings.Repeat("ab", 32),
		AsOf:       time.Date(2026, 8, 18, 3, 30, 0, 0, time.UTC),
		LoadedAt:   time.Date(2026, 8, 18, 3, 30, 0, 0, time.UTC),
	})
	return New(nil, c, nil, nil, nil)
}

func pluginListAt(t *testing.T, s *Server, userAgent, target string) pluginListResponse {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	if userAgent != "" {
		req.Header.Set("User-Agent", userAgent)
	}
	rec := httptest.NewRecorder()
	s.handlePluginList(rec, req)
	res := rec.Result()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if vary := res.Header.Get("Vary"); !strings.Contains(vary, "User-Agent") {
		t.Fatalf("Vary = %q, want to contain User-Agent", vary)
	}
	var body pluginListResponse
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return body
}

// 桌面 adapter 会一路翻到 total_pages。截断后 total=200、per_page=100 ⇒ total_pages=2,
// 它翻完第 2 页即停(只等一次 2.1s),而不是 6662 条的 67 页 ~2.5 分钟。
func TestPluginListDesktopFirstWaveCapsCatalog(t *testing.T) {
	s := seededPluginServer(6662)

	page1 := pluginListAt(t, s, desktopMarketUserAgent, "/v1/plugins?page=1&per_page=100")
	if page1.Total != desktopFirstWaveMaxItems || page1.TotalPages != 2 {
		t.Fatalf("page1 total/total_pages = %d/%d, want %d/2", page1.Total, page1.TotalPages, desktopFirstWaveMaxItems)
	}
	if page1.PerPage != 100 || page1.Page != 1 || len(page1.Data) != 100 {
		t.Fatalf("page1 per_page/page/len = %d/%d/%d, want 100/1/100", page1.PerPage, page1.Page, len(page1.Data))
	}
	if page1.Data[0].FullName != "owner000/repo000" {
		t.Fatalf("page1 first = %q, want owner000/repo000 (snapshot order preserved)", page1.Data[0].FullName)
	}

	page2 := pluginListAt(t, s, desktopMarketUserAgent, "/v1/plugins?page=2&per_page=100&data_version=sha256:"+strings.Repeat("ab", 32))
	if page2.Total != desktopFirstWaveMaxItems || page2.TotalPages != 2 || page2.Page != 2 || len(page2.Data) != 100 {
		t.Fatalf("page2 total/total_pages/page/len = %d/%d/%d/%d", page2.Total, page2.TotalPages, page2.Page, len(page2.Data))
	}
	if page2.Data[0].FullName != "owner100/repo100" {
		t.Fatalf("page2 first = %q, want owner100/repo100", page2.Data[0].FullName)
	}
}

// 桌面首屏尊重它请求的 per_page(比如 50 ⇒ 200/50 = 4 页,仍只覆盖前 200 条)。
func TestPluginListDesktopFirstWaveHonorsPerPage(t *testing.T) {
	s := seededPluginServer(6662)
	page1 := pluginListAt(t, s, desktopMarketUserAgent, "/v1/plugins?page=1&per_page=50")
	if page1.PerPage != 50 || page1.Total != desktopFirstWaveMaxItems || page1.TotalPages != 4 || len(page1.Data) != 50 {
		t.Fatalf("per_page/total/total_pages/len = %d/%d/%d/%d, want 50/200/4/50",
			page1.PerPage, page1.Total, page1.TotalPages, len(page1.Data))
	}
}

// 目录不足上限时按实际条数返回,不虚报。
func TestPluginListDesktopFirstWaveSmallCatalog(t *testing.T) {
	s := seededPluginServer(30)
	page1 := pluginListAt(t, s, desktopMarketUserAgent, "/v1/plugins?page=1&per_page=100")
	if page1.Total != 30 || page1.TotalPages != 1 || len(page1.Data) != 30 {
		t.Fatalf("total/total_pages/len = %d/%d/%d, want 30/1/30", page1.Total, page1.TotalPages, len(page1.Data))
	}
}

// 非桌面客户端(网站搜索、公开 API 用户)不受截断影响,拿到完整目录。
func TestPluginListNonDesktopUnaffected(t *testing.T) {
	s := seededPluginServer(6662)
	page1 := pluginListAt(t, s, "Mozilla/5.0", "/v1/plugins?page=1&per_page=100")
	if page1.Total != 6662 || page1.TotalPages != 67 {
		t.Fatalf("non-desktop total/total_pages = %d/%d, want 6662/67", page1.Total, page1.TotalPages)
	}
}
