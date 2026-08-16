package store

import "context"

// 只建本服务新增的三张表;plugins 等既有表归 Next 仓库的 sync 脚本管。
var migrations = []string{
	`CREATE TABLE IF NOT EXISTS api_keys (
		id           INTEGER PRIMARY KEY AUTOINCREMENT,
		key_hash     TEXT NOT NULL UNIQUE,
		key_prefix   TEXT NOT NULL,
		name         TEXT NOT NULL,
		contact      TEXT NOT NULL DEFAULT '',
		rate_per_min INTEGER NOT NULL DEFAULT 120,
		created_at   TEXT NOT NULL,
		last_used_at TEXT,
		revoked_at   TEXT
	)`,
	`CREATE TABLE IF NOT EXISTS api_requests (
		id          INTEGER PRIMARY KEY AUTOINCREMENT,
		ts          TEXT NOT NULL,
		api_key_id  INTEGER NOT NULL DEFAULT 0,
		key_prefix  TEXT NOT NULL DEFAULT '',
		ip          TEXT NOT NULL DEFAULT '',
		ua          TEXT NOT NULL DEFAULT '',
		origin      TEXT NOT NULL DEFAULT '',
		referer     TEXT NOT NULL DEFAULT '',
		path        TEXT NOT NULL,
		query       TEXT NOT NULL DEFAULT '',
		status      INTEGER NOT NULL,
		duration_ms INTEGER NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS idx_api_requests_ts ON api_requests(ts)`,
	`CREATE INDEX IF NOT EXISTS idx_api_requests_key_ts ON api_requests(api_key_id, ts)`,
	`CREATE TABLE IF NOT EXISTS api_usage_daily (
		day        TEXT    NOT NULL,
		api_key_id INTEGER NOT NULL DEFAULT 0,
		endpoint   TEXT    NOT NULL,
		hits       INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (day, api_key_id, endpoint)
	)`,
}

func (s *Store) Migrate(ctx context.Context) error {
	for _, stmt := range migrations {
		if _, err := s.db.ExecContext(ctx, stmt); err != nil {
			return err
		}
	}
	return nil
}
