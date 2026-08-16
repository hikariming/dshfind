package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

type errorBody struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	RetryAfter int    `json:"retry_after,omitempty"` // 秒,仅 rate_limited 时出现
}

// writeError 输出统一错误结构 {"error":{code,message,retry_after?}}。
// code ∈ bad_request / unauthorized / not_found / rate_limited / stale_data / internal。
func writeError(w http.ResponseWriter, status int, code, message string, retryAfter int) {
	if retryAfter > 0 {
		w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
	}
	writeJSON(w, status, map[string]errorBody{
		"error": {Code: code, Message: message, RetryAfter: retryAfter},
	})
}
