package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/dsh-external/dshfind/server/internal/cache"
)

func catalogAt(t *testing.T, s *Server, target string) (catalogResponse, *http.Response) {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	rec := httptest.NewRecorder()
	s.handleCatalog(rec, req)
	res := rec.Result()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	var body catalogResponse
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return body, res
}

// 整包端点一次返回全量目录,版本与列表端点同源。
func TestCatalogReturnsFullSnapshot(t *testing.T) {
	s := seededPluginServer(250)
	body, res := catalogAt(t, s, "/v1/catalog")
	if body.Total != 250 || len(body.Data) != 250 {
		t.Fatalf("total/len = %d/%d, want 250/250", body.Total, len(body.Data))
	}
	if !strings.HasPrefix(body.DataVersion, "sha256:") {
		t.Fatalf("data_version = %q, want sha256: prefix", body.DataVersion)
	}
	if cc := res.Header.Get("Cache-Control"); cc != publicDataCacheControl {
		t.Fatalf("Cache-Control = %q, want %q", cc, publicDataCacheControl)
	}
	if res.Header.Get("ETag") == "" {
		t.Fatal("missing ETag")
	}
}

// 带匹配 data_version 的请求按内容寻址处理:不可变长缓存;不匹配时退回常规短缓存。
func TestCatalogImmutableCacheOnMatchingVersion(t *testing.T) {
	s := seededPluginServer(10)
	snap := s.cache.Get()

	_, res := catalogAt(t, s, "/v1/catalog?data_version="+snap.Version)
	if cc := res.Header.Get("Cache-Control"); cc != catalogImmutableCacheControl {
		t.Fatalf("Cache-Control = %q, want %q", cc, catalogImmutableCacheControl)
	}

	_, res = catalogAt(t, s, "/v1/catalog?data_version=sha256:stale")
	if cc := res.Header.Get("Cache-Control"); cc != publicDataCacheControl {
		t.Fatalf("stale version Cache-Control = %q, want %q", cc, publicDataCacheControl)
	}
}

// 快照未加载时 503,与列表端点一致。
func TestCatalogCacheNotLoaded(t *testing.T) {
	s := New(nil, cache.New(nil), nil, nil, nil)
	req := httptest.NewRequest(http.MethodGet, "/v1/catalog", nil)
	rec := httptest.NewRecorder()
	s.handleCatalog(rec, req)
	if rec.Result().StatusCode != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Result().StatusCode)
	}
}
