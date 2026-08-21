package httpapi

import (
	"compress/gzip"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

// 响应压缩。此前整个 API 一律裸传：/v1/catalog 单次 9.0MB，gzip 后 1.2MB。
// 出口流量按量计费，且大多数消费者拿到的是同一份快照。
//
// 只做传输层，JSON 一个字节不改——不认压缩的客户端不发 Accept-Encoding，
// 照常拿未压缩响应，契约不变。
//
// ETag 的处理是这里最容易出错的地方。writeCacheableBytes 用未压缩正文算强
// ETag 并自行处理 304，而按 RFC 7232 强 ETag 必须唯一标识"选中的表示"——
// 不同 content-coding 是不同的表示。直接沿用同一个 ETag，共享缓存在重验证
// 时可能把压缩变体和未压缩变体配错；而若只在响应侧改写 ETag，handler 里那次
// If-None-Match 比较就会失配，所有支持压缩的客户端（即全部浏览器）的 304 都
// 会退化成 200。
//
// 采用 nginx 的解法：请求进来时把 If-None-Match 里的 -gzip 后缀剥掉，让
// handler 的比较照常成立；响应出去时再给 ETag 补上后缀。配合
// Vary: Accept-Encoding，两种变体各自持有一致的验证器。

// 小响应压不出收益，gzip 头尾反而可能让它变大。1400 字节约等于一个 MTU。
const minCompressSize = 1400

const gzipETagSuffix = "-gzip"

// 压缩级别取默认(6)而非 BestSpeed(1)。在真实的 9.0MB /v1/catalog 上实测：
// level 1 → 1488KB / 0.03s，level 6 → 1249KB / 0.08s，level 9 → 1232KB / 0.11s。
// 6 比 1 小 16% 只多 50ms CPU，9 再往上几乎没收益。
//
// api.dshfind.com 是灰云直连 Railway、前面没有 Cloudflare 代理，s-maxage 挡不住
// 回源，每个请求都会真的压一次——省下的带宽因此也是实打实的。
var gzipWriterPool = sync.Pool{
	New: func() any {
		w, _ := gzip.NewWriterLevel(nil, gzip.DefaultCompression)
		return w
	},
}

func clientAcceptsGzip(r *http.Request) bool {
	for _, part := range strings.Split(r.Header.Get("Accept-Encoding"), ",") {
		// 忽略 q 值：只区分"提到了 gzip"与否。q=0 的显式拒绝极为罕见，
		// 且误判的代价只是多压一次，不影响正确性。
		if strings.EqualFold(strings.TrimSpace(strings.SplitN(part, ";", 2)[0]), "gzip") {
			return true
		}
	}
	return false
}

/** 只压文本类。图片、字体等已压缩过的内容再压一遍纯属浪费 CPU。 */
func compressibleContentType(contentType string) bool {
	base := strings.ToLower(strings.TrimSpace(strings.SplitN(contentType, ";", 2)[0]))
	switch base {
	case "application/json", "application/xml", "application/javascript",
		"application/graphql-response+json", "image/svg+xml":
		return true
	}
	return strings.HasPrefix(base, "text/")
}

func addGzipETagSuffix(etag string) string {
	if etag == "" || strings.HasSuffix(etag, gzipETagSuffix+`"`) {
		return etag
	}
	if strings.HasSuffix(etag, `"`) {
		return etag[:len(etag)-1] + gzipETagSuffix + `"`
	}
	return etag + gzipETagSuffix
}

func stripGzipETagSuffix(header string) string {
	parts := strings.Split(header, ",")
	for i, candidate := range parts {
		trimmed := strings.TrimSpace(candidate)
		if strings.HasSuffix(trimmed, gzipETagSuffix+`"`) {
			trimmed = trimmed[:len(trimmed)-len(gzipETagSuffix)-1] + `"`
		}
		parts[i] = trimmed
	}
	return strings.Join(parts, ", ")
}

type gzipWriter struct {
	http.ResponseWriter

	status    int
	wroteHead bool
	// 是否已确定要压缩。在攒够 minCompressSize 或 handler 结束前都可能翻转。
	compress bool
	gz       *gzip.Writer
	// 决策前的缓冲。只在还没判定时使用。
	buf     []byte
	decided bool
}

func (w *gzipWriter) WriteHeader(status int) {
	if w.wroteHead {
		return
	}
	w.status = status
	// 204/304 没有正文；压缩头会让它们变成非法响应。
	if status == http.StatusNoContent || status == http.StatusNotModified {
		w.decided = true
		w.compress = false
		// 客户端持有的是压缩变体的验证器，304 要原样回给它。
		if etag := w.Header().Get("ETag"); etag != "" {
			w.Header().Set("ETag", addGzipETagSuffix(etag))
			w.Header().Add("Vary", "Accept-Encoding")
		}
		w.wroteHead = true
		w.ResponseWriter.WriteHeader(status)
		return
	}
	if !compressibleContentType(w.Header().Get("Content-Type")) {
		w.decided = true
		w.compress = false
		w.wroteHead = true
		w.ResponseWriter.WriteHeader(status)
		return
	}
	// Content-Length 已知且太小时立刻定案，省掉缓冲。
	if cl := w.Header().Get("Content-Length"); cl != "" {
		if n, err := strconv.Atoi(cl); err == nil && n < minCompressSize {
			w.decided = true
			w.compress = false
			w.wroteHead = true
			w.ResponseWriter.WriteHeader(status)
			return
		}
	}
	// 其余情况推迟到正文攒够长度再定，headers 也一并推迟发送。
}

/** 定案：要么开压缩、要么直写，并把此前缓冲的内容放出去。 */
func (w *gzipWriter) decide(compress bool) {
	w.decided = true
	w.compress = compress
	h := w.Header()
	if compress {
		h.Set("Content-Encoding", "gzip")
		h.Add("Vary", "Accept-Encoding")
		// 压缩后长度未知；留着原值会让客户端在正文读完前就截断。
		h.Del("Content-Length")
		if etag := h.Get("ETag"); etag != "" {
			h.Set("ETag", addGzipETagSuffix(etag))
		}
		w.gz = gzipWriterPool.Get().(*gzip.Writer)
		w.gz.Reset(w.ResponseWriter)
	}
	if w.status == 0 {
		w.status = http.StatusOK
	}
	w.wroteHead = true
	w.ResponseWriter.WriteHeader(w.status)
	if len(w.buf) > 0 {
		if compress {
			_, _ = w.gz.Write(w.buf)
		} else {
			_, _ = w.ResponseWriter.Write(w.buf)
		}
		w.buf = nil
	}
}

func (w *gzipWriter) Write(p []byte) (int, error) {
	if !w.decided {
		w.buf = append(w.buf, p...)
		if len(w.buf) < minCompressSize {
			// 还看不出值不值得压；等下一次 Write 或 close()。
			return len(p), nil
		}
		w.decide(true)
		return len(p), nil
	}
	if w.compress {
		return w.gz.Write(p)
	}
	if !w.wroteHead {
		w.wroteHead = true
		w.ResponseWriter.WriteHeader(w.status)
	}
	return w.ResponseWriter.Write(p)
}

/** handler 返回后收尾：正文没攒够阈值的走直写，压缩的要 Close 才会冲出尾部。 */
func (w *gzipWriter) close() {
	if !w.decided {
		w.decide(false)
	}
	if w.compress && w.gz != nil {
		_ = w.gz.Close()
		gzipWriterPool.Put(w.gz)
		w.gz = nil
	}
	if !w.wroteHead {
		if w.status == 0 {
			w.status = http.StatusOK
		}
		w.wroteHead = true
		w.ResponseWriter.WriteHeader(w.status)
	}
}

func (w *gzipWriter) Flush() {
	if !w.decided {
		w.decide(len(w.buf) >= minCompressSize)
	}
	if w.compress && w.gz != nil {
		_ = w.gz.Flush()
	}
	if f, ok := w.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// withGzip 按 Accept-Encoding 压缩文本类响应。挂在最外层，覆盖全部端点。
func withGzip(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !clientAcceptsGzip(r) {
			next.ServeHTTP(w, r)
			return
		}
		// 见文件顶部：先把客户端持有的压缩变体验证器还原成未压缩形式，
		// 否则 handler 内部那次强 ETag 比较必然失配，304 全部退化成 200。
		if inm := r.Header.Get("If-None-Match"); inm != "" {
			r.Header.Set("If-None-Match", stripGzipETagSuffix(inm))
		}
		gw := &gzipWriter{ResponseWriter: w}
		defer gw.close()
		next.ServeHTTP(gw, r)
	})
}
