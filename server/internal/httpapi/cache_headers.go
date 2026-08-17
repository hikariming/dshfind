package httpapi

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
)

const (
	// Browsers retain a short fresh copy; shared caches retain the public,
	// versioned response for longer and may serve it while refreshing.
	publicDataCacheControl    = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
	publicSuggestCacheControl = "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400"
	publicSchemaCacheControl  = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800"
)

// writeCacheableJSON derives a strong ETag from the exact JSON representation,
// so query parameters, GraphQL variables, and snapshot changes cannot share an
// accidental validator. It deliberately serializes before checking the ETag:
// REST filters are in-memory and GraphQL may include live nested fields, so a
// version-only validator would be incorrect for a changed representation.
func writeCacheableJSON(w http.ResponseWriter, r *http.Request, status int, value any, cacheControl string) {
	body, err := json.Marshal(value)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "encode response", 0)
		return
	}
	writeCacheableBytes(w, r, status, body, "application/json; charset=utf-8", cacheControl)
}

func writeCacheableText(w http.ResponseWriter, r *http.Request, status int, body, contentType, cacheControl string) {
	writeCacheableBytes(w, r, status, []byte(body), contentType, cacheControl)
}

func writeCacheableBytes(w http.ResponseWriter, r *http.Request, status int, body []byte, contentType, cacheControl string) {
	etag := strongETag(body)
	h := w.Header()
	h.Set("Cache-Control", cacheControl)
	h.Set("ETag", etag)
	// 304 is defined for conditional GET/HEAD. GraphQL POST still receives an
	// ETag for observability and compatible intermediaries, but clients that
	// need conditional revalidation should use the supported GET query form.
	if (r.Method == http.MethodGet || r.Method == http.MethodHead) && etagMatches(r.Header.Get("If-None-Match"), etag) {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	h.Set("Content-Type", contentType)
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

func strongETag(body []byte) string {
	sum := sha256.Sum256(body)
	return `"` + hex.EncodeToString(sum[:]) + `"`
}

func etagMatches(header, etag string) bool {
	for _, candidate := range strings.Split(header, ",") {
		candidate = strings.TrimSpace(candidate)
		if candidate == "*" {
			return true
		}
		candidate = strings.TrimPrefix(candidate, "W/")
		if candidate == etag {
			return true
		}
	}
	return false
}
