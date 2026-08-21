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

// marketTestPage 镜像契约响应的 JSON 形状(additionalProperties:false 的白名单)。
type marketTestPage struct {
	SchemaVersion string `json:"schemaVersion"`
	GeneratedAt   string `json:"generatedAt"`
	Revision      string `json:"revision"`
	Items         []struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		DisplayName string `json:"displayName"`
		Summary     string `json:"summary"`
		Repository  *struct {
			URL string `json:"url"`
		} `json:"repository"`
		Package *struct {
			Registry string `json:"registry"`
			Name     string `json:"name"`
		} `json:"package"`
		Publisher *struct {
			Name string `json:"name"`
			URL  string `json:"url"`
		} `json:"publisher"`
		Categories    []string `json:"categories"`
		LatestVersion string   `json:"latestVersion"`
		UpdatedAt     string   `json:"updatedAt"`
	} `json:"items"`
	Page struct {
		NextCursor string `json:"nextCursor"`
		Total      int    `json:"total"`
	} `json:"page"`
}

func marketPlugin(i int) store.Plugin {
	full := fmt.Sprintf("owner%03d/repo%03d", i, i)
	confirmed := true
	return store.Plugin{
		FullName:      full,
		Name:          fmt.Sprintf("repo%03d", i),
		Owner:         fmt.Sprintf("owner%03d", i),
		URL:           "https://github.com/" + full,
		RepositoryURL: "https://github.com/" + full,
		Description:   fmt.Sprintf("plugin number %d", i),
		Category:      "tools",
		IsPlugin:      &confirmed,
		Tags:          []string{},
	}
}

func seededMarketServer(t *testing.T, plugins []store.Plugin) *Server {
	t.Helper()
	byName := make(map[string]*store.Plugin, len(plugins))
	for i := range plugins {
		byName[strings.ToLower(plugins[i].FullName)] = &plugins[i]
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

func marketPageAt(t *testing.T, s *Server, target string) marketTestPage {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	rec := httptest.NewRecorder()
	s.handleMarketPlugins(rec, req)
	res := rec.Result()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	var body marketTestPage
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return body
}

// manifest 必填字段齐全,transport.endpoint 与 manifest 同 origin(api.dshfind.com)
// 且路径以 /v1/plugins 结尾。
func TestMarketManifest(t *testing.T) {
	s := New(nil, cache.New(nil), nil, nil, nil)
	req := httptest.NewRequest(http.MethodGet, "/market/manifest.json", nil)
	rec := httptest.NewRecorder()
	s.handleMarketManifest(rec, req)
	res := rec.Result()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	var m struct {
		ManifestVersion string `json:"manifestVersion"`
		ProviderID      string `json:"providerId"`
		Name            string `json:"name"`
		Attribution     struct {
			Name string `json:"name"`
			URL  string `json:"url"`
		} `json:"attribution"`
		Transport struct {
			Kind     string `json:"kind"`
			Endpoint string `json:"endpoint"`
			Method   string `json:"method"`
		} `json:"transport"`
		Query struct {
			Supported    []string `json:"supported"`
			DefaultLimit int      `json:"defaultLimit"`
			MaxLimit     int      `json:"maxLimit"`
		} `json:"query"`
	}
	if err := json.NewDecoder(res.Body).Decode(&m); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if m.ManifestVersion != "1.0.0" || m.ProviderID == "" || m.Name == "" {
		t.Fatalf("manifest identity fields: %+v", m)
	}
	if m.Attribution.Name == "" || m.Attribution.URL == "" {
		t.Fatalf("attribution incomplete: %+v", m.Attribution)
	}
	if m.Transport.Kind != "https-json" || m.Transport.Method != "GET" {
		t.Fatalf("transport = %+v", m.Transport)
	}
	if !strings.HasPrefix(m.Transport.Endpoint, "https://api.dshfind.com/") {
		t.Fatalf("endpoint %q not on manifest origin api.dshfind.com", m.Transport.Endpoint)
	}
	if !strings.HasSuffix(m.Transport.Endpoint, "/v1/plugins") {
		t.Fatalf("endpoint %q must end with /v1/plugins", m.Transport.Endpoint)
	}
	if m.Query.DefaultLimit != 50 || m.Query.MaxLimit != 100 {
		t.Fatalf("query limits = %d/%d, want 50/100", m.Query.DefaultLimit, m.Query.MaxLimit)
	}
}

// 顶层形状:schemaVersion / generatedAt(RFC3339)/ revision(快照版本)/ page.total。
func TestMarketPluginsTopLevelShape(t *testing.T) {
	s := seededMarketServer(t, []store.Plugin{marketPlugin(0)})
	body := marketPageAt(t, s, "/market/v1/plugins")
	if body.SchemaVersion != "1.0.0" {
		t.Fatalf("schemaVersion = %q", body.SchemaVersion)
	}
	if _, err := time.Parse(time.RFC3339, body.GeneratedAt); err != nil {
		t.Fatalf("generatedAt %q not RFC3339: %v", body.GeneratedAt, err)
	}
	snap := s.cache.Get()
	if body.Revision != snap.Version {
		t.Fatalf("revision = %q, want snapshot version %q", body.Revision, snap.Version)
	}
	if body.Page.Total != 1 || len(body.Items) != 1 {
		t.Fatalf("total/len = %d/%d, want 1/1", body.Page.Total, len(body.Items))
	}
	if body.Page.NextCursor != "" {
		t.Fatalf("nextCursor = %q, want empty on last page", body.Page.NextCursor)
	}
}

// item 必填字段:id=full_name、name/displayName/summary 非空、repository 为 https。
func TestMarketItemRequiredFields(t *testing.T) {
	s := seededMarketServer(t, []store.Plugin{marketPlugin(0)})
	body := marketPageAt(t, s, "/market/v1/plugins")
	item := body.Items[0]
	if item.ID != "owner000/repo000" {
		t.Fatalf("id = %q", item.ID)
	}
	if item.Name == "" || item.DisplayName == "" || item.Summary == "" {
		t.Fatalf("required text fields empty: %+v", item)
	}
	if item.Repository == nil || !strings.HasPrefix(item.Repository.URL, "https://") {
		t.Fatalf("repository = %+v, want https url", item.Repository)
	}
	if item.Publisher == nil || item.Publisher.Name != "owner000" {
		t.Fatalf("publisher = %+v", item.Publisher)
	}
	if len(item.Categories) != 1 || item.Categories[0] != "tools" {
		t.Fatalf("categories = %v", item.Categories)
	}
}

// 门控:npm_desktop_installable=1(探测判定过桌面端 npm preview 全部复核)才输出
// package/latestVersion;backlink 通过但 desktop_installable=0 的条目两者都不出现。
func TestMarketItemPackageGate(t *testing.T) {
	version := "1.2.3"
	pkgName := "repo000"

	withPkg := marketPlugin(0)
	withPkg.Install.NpmPublished = true
	withPkg.Install.PkgName = &pkgName
	withPkg.NpmLatestVersion = &version
	withPkg.NpmRepoBacklink = true
	withPkg.NpmDesktopInstallable = true

	// backlink 通过、稳定版本也在,但 desktop_installable=0(如含生命周期脚本):
	// 桌面端 preview 会拒,因此不发证据。
	notInstallable := marketPlugin(1)
	notInstallable.Install.NpmPublished = true
	notInstallable.Install.PkgName = &pkgName
	notInstallable.NpmLatestVersion = &version
	notInstallable.NpmRepoBacklink = true
	notInstallable.NpmDesktopInstallable = false

	s := seededMarketServer(t, []store.Plugin{withPkg, notInstallable})
	body := marketPageAt(t, s, "/market/v1/plugins")
	if len(body.Items) != 2 {
		t.Fatalf("len(items) = %d, want 2", len(body.Items))
	}
	if body.Items[0].Package == nil || body.Items[0].Package.Registry != "npm" || body.Items[0].Package.Name != "repo000" {
		t.Fatalf("items[0].package = %+v", body.Items[0].Package)
	}
	if body.Items[0].LatestVersion != "1.2.3" {
		t.Fatalf("items[0].latestVersion = %q", body.Items[0].LatestVersion)
	}
	if body.Items[1].Package != nil || body.Items[1].LatestVersion != "" {
		t.Fatalf("desktop_installable=false item must omit package/latestVersion: %+v", body.Items[1])
	}
}

// limit 上限 100:超限请求被夹到 100。
func TestMarketPluginsLimitCap(t *testing.T) {
	plugins := make([]store.Plugin, 150)
	for i := range plugins {
		plugins[i] = marketPlugin(i)
	}
	s := seededMarketServer(t, plugins)
	body := marketPageAt(t, s, "/market/v1/plugins?limit=500")
	if len(body.Items) != marketMaxLimit {
		t.Fatalf("len(items) = %d, want %d", len(body.Items), marketMaxLimit)
	}
}

// 游标翻页到底:每页 50,120 条分 3 页,末页无 nextCursor,id 全覆盖不重复。
func TestMarketPluginsCursorPagination(t *testing.T) {
	plugins := make([]store.Plugin, 120)
	for i := range plugins {
		plugins[i] = marketPlugin(i)
	}
	s := seededMarketServer(t, plugins)

	seen := map[string]bool{}
	cursor := ""
	for page := 1; ; page++ {
		target := "/market/v1/plugins?limit=50"
		if cursor != "" {
			target += "&cursor=" + cursor
		}
		body := marketPageAt(t, s, target)
		for _, item := range body.Items {
			if seen[item.ID] {
				t.Fatalf("duplicate id %q across pages", item.ID)
			}
			seen[item.ID] = true
		}
		if body.Page.NextCursor == "" {
			if page != 3 || len(body.Items) != 20 {
				t.Fatalf("last page = %d with %d items, want page 3 with 20", page, len(body.Items))
			}
			break
		}
		cursor = body.Page.NextCursor
		if page > 10 {
			t.Fatal("pagination did not terminate")
		}
	}
	if len(seen) != 120 {
		t.Fatalf("seen %d unique items, want 120", len(seen))
	}
}

// 游标绑定的快照版本与当前不符时返回 409 stale_data。
func TestMarketPluginsStaleCursor(t *testing.T) {
	s := seededMarketServer(t, []store.Plugin{marketPlugin(0)})
	stale := encodeMarketCursor("sha256:"+strings.Repeat("cd", 32), 0)
	req := httptest.NewRequest(http.MethodGet, "/market/v1/plugins?cursor="+stale, nil)
	rec := httptest.NewRecorder()
	s.handleMarketPlugins(rec, req)
	res := rec.Result()
	if res.StatusCode != http.StatusConflict {
		t.Fatalf("status = %d, want 409", res.StatusCode)
	}
	var body struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body.Error.Code != "stale_data" {
		t.Fatalf("error.code = %q, want stale_data", body.Error.Code)
	}
}

// 非法游标 400;未确认插件(is_plugin=nil/false)不出现在目录里;q/category 过滤生效。
func TestMarketPluginsFilteringAndBadCursor(t *testing.T) {
	confirmed := marketPlugin(0)
	unknown := marketPlugin(1)
	unknown.IsPlugin = nil
	rejected := marketPlugin(2)
	notPlugin := false
	rejected.IsPlugin = &notPlugin

	s := seededMarketServer(t, []store.Plugin{confirmed, unknown, rejected})
	body := marketPageAt(t, s, "/market/v1/plugins")
	if body.Page.Total != 1 || body.Items[0].ID != confirmed.FullName {
		t.Fatalf("only confirmed plugins allowed: total=%d", body.Page.Total)
	}

	req := httptest.NewRequest(http.MethodGet, "/market/v1/plugins?cursor=!!!", nil)
	rec := httptest.NewRecorder()
	s.handleMarketPlugins(rec, req)
	if rec.Result().StatusCode != http.StatusBadRequest {
		t.Fatalf("bad cursor status = %d, want 400", rec.Result().StatusCode)
	}

	body = marketPageAt(t, s, "/market/v1/plugins?q=repo000")
	if body.Page.Total != 1 {
		t.Fatalf("q filter total = %d, want 1", body.Page.Total)
	}
	body = marketPageAt(t, s, "/market/v1/plugins?category=nope")
	if body.Page.Total != 0 {
		t.Fatalf("category filter total = %d, want 0", body.Page.Total)
	}
}
