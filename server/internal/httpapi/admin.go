package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/dsh-external/dshfind/server/internal/store"
)

type adminUsageRow struct {
	Day       string `json:"day,omitempty"`
	KeyID     *int64 `json:"key_id,omitempty"`
	KeyName   string `json:"key_name,omitempty"`
	KeyPrefix string `json:"key_prefix,omitempty"`
	Endpoint  string `json:"endpoint,omitempty"`
	Hits      int64  `json:"hits"`
}

// GET /v1/admin/usage?from=&to=&group_by=day|key|endpoint&key_id=
// 查 api_usage_daily 聚合;默认最近 7 天。
func (s *Server) handleAdminUsage(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	now := time.Now().UTC()
	uq := store.UsageQuery{
		From:    q.Get("from"),
		To:      q.Get("to"),
		GroupBy: q.Get("group_by"),
	}
	if uq.From == "" {
		uq.From = now.AddDate(0, 0, -7).Format("2006-01-02")
	}
	if uq.To == "" {
		uq.To = now.Format("2006-01-02")
	}
	switch uq.GroupBy {
	case "", "day", "key", "endpoint":
	default:
		writeError(w, http.StatusBadRequest, "bad_request", "group_by 只支持 day/key/endpoint", 0)
		return
	}
	if v := q.Get("key_id"); v != "" {
		id, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "bad_request", "key_id 必须是整数", 0)
			return
		}
		uq.KeyID = &id
	}

	rows, err := s.st.QueryUsage(r.Context(), uq)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "查询 usage 失败", 0)
		return
	}

	// 补 key 名称,匿名显示 (anonymous)
	names := map[int64][2]string{}
	if keys, err := s.st.ListKeys(r.Context()); err == nil {
		for _, k := range keys {
			names[k.ID] = [2]string{k.Name, k.KeyPrefix}
		}
	}
	out := make([]adminUsageRow, 0, len(rows))
	for _, row := range rows {
		ar := adminUsageRow{Day: row.Day, KeyID: row.KeyID, Endpoint: row.Endpoint, Hits: row.Hits}
		if row.KeyID != nil {
			if *row.KeyID == 0 {
				ar.KeyName = "(anonymous)"
			} else if n, ok := names[*row.KeyID]; ok {
				ar.KeyName, ar.KeyPrefix = n[0], n[1]
			}
		}
		out = append(out, ar)
	}
	writeJSON(w, http.StatusOK, map[string]any{"from": uq.From, "to": uq.To, "rows": out})
}

// GET /v1/admin/usage/recent?limit=&key_id=&anon=1 —— api_requests 明细,看 IP/UA/来源。
func (s *Server) handleAdminRecent(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit := clampInt(parseIntOr(q.Get("limit"), 100), 1, 1000)
	var keyID *int64
	if v := q.Get("key_id"); v != "" {
		id, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "bad_request", "key_id 必须是整数", 0)
			return
		}
		keyID = &id
	}
	anonOnly := q.Get("anon") == "1"

	rows, err := s.st.RecentRequests(r.Context(), limit, keyID, anonOnly)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "查询明细失败", 0)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows})
}

func (s *Server) handleAdminKeysList(w http.ResponseWriter, r *http.Request) {
	keys, err := s.st.ListKeys(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "查询 key 列表失败", 0)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"keys": keys})
}

// POST /v1/admin/keys {"name","contact","rate_per_min"} → 明文 key 只在这次响应里出现。
func (s *Server) handleAdminKeysCreate(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name       string `json:"name"`
		Contact    string `json:"contact"`
		RatePerMin int    `json:"rate_per_min"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "需要 JSON body,name 必填", 0)
		return
	}
	plaintext, rec, err := s.st.CreateKey(r.Context(), body.Name, body.Contact, body.RatePerMin)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "创建 key 失败", 0)
		return
	}
	if err := s.ReloadKeys(r.Context()); err != nil {
		// key 已入库,内存表最迟随下个刷新周期生效,不算失败
	}
	writeJSON(w, http.StatusCreated, map[string]any{"key": plaintext, "record": rec})
}

func (s *Server) handleAdminKeysRevoke(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "bad_request", "id 必须是整数", 0)
		return
	}
	if err := s.st.RevokeKey(r.Context(), id); err != nil {
		writeError(w, http.StatusNotFound, "not_found", err.Error(), 0)
		return
	}
	_ = s.ReloadKeys(r.Context())
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
