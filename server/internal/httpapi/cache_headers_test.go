package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCacheableJSONETagReturnsNotModifiedForExactRepresentation(t *testing.T) {
	firstRequest := httptest.NewRequest(http.MethodGet, "/v1/plugins?page=1", nil)
	first := httptest.NewRecorder()
	writeCacheableJSON(first, firstRequest, http.StatusOK, map[string]any{"data": []string{"plugin"}}, publicDataCacheControl)
	if first.Code != http.StatusOK || first.Header().Get("Cache-Control") != publicDataCacheControl {
		t.Fatalf("first response = %d %#v", first.Code, first.Header())
	}
	etag := first.Header().Get("ETag")
	if etag == "" {
		t.Fatal("missing ETag")
	}

	conditionalRequest := httptest.NewRequest(http.MethodGet, "/v1/plugins?page=1", nil)
	conditionalRequest.Header.Set("If-None-Match", "W/"+etag)
	conditional := httptest.NewRecorder()
	writeCacheableJSON(conditional, conditionalRequest, http.StatusOK, map[string]any{"data": []string{"plugin"}}, publicDataCacheControl)
	if conditional.Code != http.StatusNotModified || conditional.Body.Len() != 0 {
		t.Fatalf("conditional response = %d %q, want empty 304", conditional.Code, conditional.Body.String())
	}
}

func TestCacheableJSONChangesETagWithRepresentation(t *testing.T) {
	first := httptest.NewRecorder()
	writeCacheableJSON(first, httptest.NewRequest(http.MethodGet, "/", nil), http.StatusOK, map[string]any{"data": "one"}, publicDataCacheControl)
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.Header.Set("If-None-Match", first.Header().Get("ETag"))
	second := httptest.NewRecorder()
	writeCacheableJSON(second, request, http.StatusOK, map[string]any{"data": "two"}, publicDataCacheControl)
	if second.Code != http.StatusOK {
		t.Fatalf("changed response status = %d, want 200", second.Code)
	}
}

func TestCacheablePOSTKeepsETagButNeverUsesInvalid304Semantics(t *testing.T) {
	first := httptest.NewRecorder()
	writeCacheableJSON(first, httptest.NewRequest(http.MethodPost, "/graphql", nil), http.StatusOK, map[string]any{"data": "one"}, publicDataCacheControl)
	request := httptest.NewRequest(http.MethodPost, "/graphql", nil)
	request.Header.Set("If-None-Match", first.Header().Get("ETag"))
	second := httptest.NewRecorder()
	writeCacheableJSON(second, request, http.StatusOK, map[string]any{"data": "one"}, publicDataCacheControl)
	if second.Code != http.StatusOK || second.Header().Get("ETag") == "" {
		t.Fatalf("POST response = %d %#v, want ETag-bearing 200", second.Code, second.Header())
	}
}
