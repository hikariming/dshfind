package httpapi

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func gzipTestHandler(body []byte, contentType, etag string) http.Handler {
	return withGzip(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if etag != "" {
			w.Header().Set("ETag", etag)
			if etagMatches(r.Header.Get("If-None-Match"), etag) {
				w.WriteHeader(http.StatusNotModified)
				return
			}
		}
		w.Header().Set("Content-Type", contentType)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(body)
	}))
}

func doGzipRequest(h http.Handler, acceptEncoding, ifNoneMatch string) *http.Response {
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	if acceptEncoding != "" {
		req.Header.Set("Accept-Encoding", acceptEncoding)
	}
	if ifNoneMatch != "" {
		req.Header.Set("If-None-Match", ifNoneMatch)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec.Result()
}

func largeJSON() []byte {
	return []byte(`{"data":"` + strings.Repeat("dsh-plugin-", 500) + `"}`)
}

func TestGzipCompressesLargeJSONAndPreservesBody(t *testing.T) {
	body := largeJSON()
	res := doGzipRequest(gzipTestHandler(body, "application/json; charset=utf-8", ""), "gzip", "")

	if got := res.Header.Get("Content-Encoding"); got != "gzip" {
		t.Fatalf("Content-Encoding = %q, want gzip", got)
	}
	if !strings.Contains(res.Header.Get("Vary"), "Accept-Encoding") {
		t.Fatalf("Vary = %q, want it to include Accept-Encoding", res.Header.Get("Vary"))
	}
	// Content-Length 必须删除：留着未压缩的长度会让客户端提前截断正文。
	if got := res.Header.Get("Content-Length"); got != "" {
		t.Fatalf("Content-Length = %q, want it removed for a compressed body", got)
	}

	zr, err := gzip.NewReader(res.Body)
	if err != nil {
		t.Fatalf("response is not valid gzip: %v", err)
	}
	got, err := io.ReadAll(zr)
	if err != nil {
		t.Fatalf("read gzip body: %v", err)
	}
	if !bytes.Equal(got, body) {
		t.Fatalf("decompressed body does not match the original")
	}
}

func TestGzipSkippedWithoutAcceptEncoding(t *testing.T) {
	body := largeJSON()
	res := doGzipRequest(gzipTestHandler(body, "application/json", ""), "", "")

	if got := res.Header.Get("Content-Encoding"); got != "" {
		t.Fatalf("Content-Encoding = %q, want empty for a client that did not ask", got)
	}
	got, _ := io.ReadAll(res.Body)
	if !bytes.Equal(got, body) {
		t.Fatalf("body was altered for an uncompressed client")
	}
}

func TestGzipSkipsSmallAndNonTextResponses(t *testing.T) {
	small := []byte(`{"ok":true}`)
	res := doGzipRequest(gzipTestHandler(small, "application/json", ""), "gzip", "")
	if got := res.Header.Get("Content-Encoding"); got != "" {
		t.Fatalf("small response Content-Encoding = %q, want empty", got)
	}
	if got, _ := io.ReadAll(res.Body); !bytes.Equal(got, small) {
		t.Fatalf("small response body was altered")
	}

	binary := bytes.Repeat([]byte{0x89, 0x50}, 2000)
	res = doGzipRequest(gzipTestHandler(binary, "image/png", ""), "gzip", "")
	if got := res.Header.Get("Content-Encoding"); got != "" {
		t.Fatalf("image Content-Encoding = %q, want empty; already-compressed types must not be re-compressed", got)
	}
}

// 压缩变体与未压缩变体是不同的表示，强 ETag 必须能区分它们，否则共享缓存
// 会在重验证时配错变体。
func TestGzipDistinguishesETagPerVariant(t *testing.T) {
	body := largeJSON()
	h := gzipTestHandler(body, "application/json", `"abc"`)

	plain := doGzipRequest(h, "", "")
	if got := plain.Header.Get("ETag"); got != `"abc"` {
		t.Fatalf("uncompressed ETag = %q, want \"abc\"", got)
	}

	compressed := doGzipRequest(h, "gzip", "")
	if got := compressed.Header.Get("ETag"); got != `"abc-gzip"` {
		t.Fatalf("compressed ETag = %q, want \"abc-gzip\"", got)
	}
}

// 回归防线：若不在请求侧剥掉 -gzip 后缀，handler 内那次强 ETag 比较必然失配，
// 所有浏览器的条件请求都会从 304 退化成 200 全量重传。
func TestGzipConditionalRequestStillReturns304(t *testing.T) {
	body := largeJSON()
	h := gzipTestHandler(body, "application/json", `"abc"`)

	res := doGzipRequest(h, "gzip", `"abc-gzip"`)
	if res.StatusCode != http.StatusNotModified {
		t.Fatalf("status = %d, want 304 for a client holding the compressed variant", res.StatusCode)
	}
	if got := res.Header.Get("ETag"); got != `"abc-gzip"` {
		t.Fatalf("304 ETag = %q, want the compressed variant's validator", got)
	}
	if got := res.Header.Get("Content-Encoding"); got != "" {
		t.Fatalf("304 Content-Encoding = %q, want empty; a 304 carries no body", got)
	}

	// 未压缩客户端拿自己的验证器同样应当命中。
	if res := doGzipRequest(h, "", `"abc"`); res.StatusCode != http.StatusNotModified {
		t.Fatalf("uncompressed conditional status = %d, want 304", res.StatusCode)
	}
}

func TestStripGzipETagSuffixHandlesLists(t *testing.T) {
	if got := stripGzipETagSuffix(`"a-gzip", "b", W/"c-gzip"`); got != `"a", "b", W/"c"` {
		t.Fatalf("stripGzipETagSuffix = %q", got)
	}
}
