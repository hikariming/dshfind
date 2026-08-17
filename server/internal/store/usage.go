package store

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

// RequestLog 是一条审计事件;audit 包以 type alias 复用,避免循环依赖。
// Endpoint 是路由模板(如 /v1/plugins/{owner}/{repo}),只进聚合表不进明细。
type RequestLog struct {
	TS         string
	APIKeyID   int64 // 0 = 匿名
	KeyPrefix  string
	IP         string
	UA         string
	Origin     string
	Referer    string
	Path       string
	Query      string
	Endpoint   string
	Status     int
	DurationMs int64
}

// SQLite 默认参数上限 999;11 列 × 80 行 = 880,留出余量。
const insertChunkRows = 80

func (s *Store) InsertRequests(ctx context.Context, batch []RequestLog) error {
	for start := 0; start < len(batch); start += insertChunkRows {
		chunk := batch[start:min(start+insertChunkRows, len(batch))]
		var sb strings.Builder
		sb.WriteString(`INSERT INTO api_requests
			(ts, api_key_id, key_prefix, ip, ua, origin, referer, path, query, status, duration_ms) VALUES `)
		args := make([]any, 0, len(chunk)*11)
		for i, e := range chunk {
			if i > 0 {
				sb.WriteString(",")
			}
			sb.WriteString("(?,?,?,?,?,?,?,?,?,?,?)")
			args = append(args, e.TS, e.APIKeyID, e.KeyPrefix, e.IP, e.UA, e.Origin,
				e.Referer, e.Path, e.Query, e.Status, e.DurationMs)
		}
		if _, err := s.db.ExecContext(ctx, sb.String(), args...); err != nil {
			return err
		}
	}
	return nil
}

// UpsertDailyUsage 把一批事件聚合成 天×key×endpoint 的增量,累加进 api_usage_daily。
func (s *Store) UpsertDailyUsage(ctx context.Context, batch []RequestLog) error {
	type bucket struct {
		day      string
		keyID    int64
		endpoint string
	}
	agg := map[bucket]int64{}
	for _, e := range batch {
		day := e.TS
		if len(day) >= 10 {
			day = day[:10]
		}
		agg[bucket{day, e.APIKeyID, e.Endpoint}]++
	}
	for b, hits := range agg {
		if _, err := s.db.ExecContext(ctx,
			`INSERT INTO api_usage_daily (day, api_key_id, endpoint, hits) VALUES (?, ?, ?, ?)
			 ON CONFLICT(day, api_key_id, endpoint) DO UPDATE SET hits = hits + excluded.hits`,
			b.day, b.keyID, b.endpoint, hits); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) PruneRequests(ctx context.Context, retentionDays int) (int64, error) {
	res, err := s.db.ExecContext(ctx,
		`DELETE FROM api_requests WHERE ts < datetime('now', ?)`,
		fmt.Sprintf("-%d days", retentionDays))
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

type UsageQuery struct {
	From    string // YYYY-MM-DD,含
	To      string // YYYY-MM-DD,含
	GroupBy string // "" | day | key | endpoint
	KeyID   *int64
}

type UsageRow struct {
	Day      string `json:"day,omitempty"`
	KeyID    *int64 `json:"key_id,omitempty"`
	Endpoint string `json:"endpoint,omitempty"`
	Hits     int64  `json:"hits"`
}

func (s *Store) QueryUsage(ctx context.Context, q UsageQuery) ([]UsageRow, error) {
	where := `WHERE day >= ? AND day <= ?`
	args := []any{q.From, q.To}
	if q.KeyID != nil {
		where += ` AND api_key_id = ?`
		args = append(args, *q.KeyID)
	}

	var sqlText string
	switch q.GroupBy {
	case "day":
		sqlText = `SELECT day, NULL, '', SUM(hits) FROM api_usage_daily ` + where + ` GROUP BY day ORDER BY day`
	case "key":
		sqlText = `SELECT '', api_key_id, '', SUM(hits) FROM api_usage_daily ` + where + ` GROUP BY api_key_id ORDER BY SUM(hits) DESC`
	case "endpoint":
		sqlText = `SELECT '', NULL, endpoint, SUM(hits) FROM api_usage_daily ` + where + ` GROUP BY endpoint ORDER BY SUM(hits) DESC`
	default:
		sqlText = `SELECT day, api_key_id, endpoint, hits FROM api_usage_daily ` + where + ` ORDER BY day DESC, hits DESC`
	}

	rows, err := s.db.QueryContext(ctx, sqlText, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []UsageRow{}
	for rows.Next() {
		var r UsageRow
		var day, endpoint sql.NullString
		var keyID sql.NullInt64
		if err := rows.Scan(&day, &keyID, &endpoint, &r.Hits); err != nil {
			return nil, err
		}
		r.Day = day.String
		r.Endpoint = endpoint.String
		if keyID.Valid {
			r.KeyID = &keyID.Int64
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

type RequestRow struct {
	TS         string `json:"ts"`
	APIKeyID   int64  `json:"api_key_id"`
	KeyPrefix  string `json:"key_prefix,omitempty"`
	IP         string `json:"ip"`
	UA         string `json:"ua"`
	Origin     string `json:"origin,omitempty"`
	Referer    string `json:"referer,omitempty"`
	Path       string `json:"path"`
	Query      string `json:"query,omitempty"`
	Status     int    `json:"status"`
	DurationMs int64  `json:"duration_ms"`
}

func (s *Store) RecentRequests(ctx context.Context, limit int, keyID *int64, anonOnly bool) ([]RequestRow, error) {
	where := ""
	args := []any{}
	switch {
	case keyID != nil:
		where = `WHERE api_key_id = ?`
		args = append(args, *keyID)
	case anonOnly:
		where = `WHERE api_key_id = 0`
	}
	args = append(args, limit)

	rows, err := s.db.QueryContext(ctx,
		`SELECT ts, api_key_id, key_prefix, ip, ua, origin, referer, path, query, status, duration_ms
		 FROM api_requests `+where+` ORDER BY id DESC LIMIT ?`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []RequestRow{}
	for rows.Next() {
		var r RequestRow
		if err := rows.Scan(&r.TS, &r.APIKeyID, &r.KeyPrefix, &r.IP, &r.UA, &r.Origin,
			&r.Referer, &r.Path, &r.Query, &r.Status, &r.DurationMs); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
