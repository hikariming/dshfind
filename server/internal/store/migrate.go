package store

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

// migrations 是服务运行所依赖的最小 Turso schema。内容同步仍归
// scripts/sync-plugins-db.mjs 所有；这里仅保证全新库或较早的库不会因缺表/缺列
// 而让 API 启动失败。
var migrations = []string{
	`CREATE TABLE IF NOT EXISTS plugins (
		full_name            TEXT PRIMARY KEY,
		name                 TEXT NOT NULL,
		owner                TEXT NOT NULL,
		url                  TEXT NOT NULL,
		description          TEXT NOT NULL DEFAULT '',
		tags                 TEXT NOT NULL DEFAULT '[]',
		language             TEXT NOT NULL DEFAULT '',
		stars                INTEGER NOT NULL DEFAULT 0,
		contributors         INTEGER,
		pushed_at            TEXT NOT NULL DEFAULT '',
		archived             INTEGER NOT NULL DEFAULT 0,
		first_seen_at        TEXT NOT NULL,
		last_synced_at       TEXT NOT NULL,
		is_present           INTEGER NOT NULL DEFAULT 1,
		is_offtopic          INTEGER NOT NULL DEFAULT 0,
		is_insider           INTEGER NOT NULL DEFAULT 0,
		is_featured          INTEGER NOT NULL DEFAULT 0,
		is_official          INTEGER NOT NULL DEFAULT 0,
		is_risky             INTEGER NOT NULL DEFAULT 0,
		risk_note            TEXT,
		category             TEXT NOT NULL DEFAULT '',
		category_manual      INTEGER NOT NULL DEFAULT 0,
		score                INTEGER,
		score_detail         TEXT,
		scored_at            TEXT,
		score_version        TEXT,
		install_cmd          TEXT,
		pkg_name             TEXT,
		pkg_version          TEXT,
		pkg_private          INTEGER,
		has_bundle           INTEGER,
		has_prepare          INTEGER,
		entry_needs_build    INTEGER,
		npm_published        INTEGER,
		release_tgz_url      TEXT,
		release_tag          TEXT,
		release_prerelease   INTEGER,
		release_asset_name   TEXT,
		release_asset_size   INTEGER,
		release_asset_digest TEXT,
		release_etag         TEXT,
		install_kind         TEXT,
		install_cmd_auto     TEXT,
		install_probed_at    TEXT,
		readme_install_cmd   TEXT,
		install_source       TEXT,
		entry_committed      INTEGER,
		npm_latest_version   TEXT,
		npm_repo_backlink    INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE TABLE IF NOT EXISTS plugin_i18n (
		full_name   TEXT NOT NULL,
		locale      TEXT NOT NULL,
		description TEXT,
		intro       TEXT,
		highlights  TEXT,
		updated_at  TEXT NOT NULL,
		PRIMARY KEY (full_name, locale)
	)`,
	`CREATE TABLE IF NOT EXISTS plugin_snapshots (
		full_name     TEXT NOT NULL,
		snapshot_date TEXT NOT NULL,
		stars         INTEGER NOT NULL,
		contributors  INTEGER,
		pushed_at     TEXT,
		PRIMARY KEY (full_name, snapshot_date)
	)`,
	`CREATE INDEX IF NOT EXISTS idx_snapshots_date ON plugin_snapshots(snapshot_date)`,
	`CREATE TABLE IF NOT EXISTS sync_runs (
		id                   INTEGER PRIMARY KEY AUTOINCREMENT,
		started_at           TEXT NOT NULL,
		finished_at          TEXT,
		status               TEXT NOT NULL,
		repo_count           INTEGER,
		contributor_failures INTEGER,
		error                TEXT
	)`,
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
	// 社区功能（docs/bbs-design.md）：插件评论不单独建表，每个插件首条评论时
	// 自动建一个隐式帖子（board='plugin'、plugin_full_name 非空），评论即其回复，
	// 因此「插件讨论」天然是 BBS 的一个板块。作者信息按会话快照，不建 users 表。
	`CREATE TABLE IF NOT EXISTS forum_threads (
		id               INTEGER PRIMARY KEY AUTOINCREMENT,
		slug             TEXT NOT NULL UNIQUE,
		board            TEXT NOT NULL,
		title            TEXT NOT NULL,
		body_md          TEXT NOT NULL DEFAULT '',
		author_login     TEXT NOT NULL,
		author_name      TEXT,
		author_avatar    TEXT,
		locale           TEXT NOT NULL DEFAULT 'zh',
		plugin_full_name TEXT,
		reply_count      INTEGER NOT NULL DEFAULT 0,
		last_post_at     TEXT,
		is_pinned        INTEGER NOT NULL DEFAULT 0,
		is_locked        INTEGER NOT NULL DEFAULT 0,
		deleted_at       TEXT,
		created_at       TEXT NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS idx_threads_board ON forum_threads(board, last_post_at DESC)`,
	`CREATE INDEX IF NOT EXISTS idx_threads_plugin ON forum_threads(plugin_full_name)`,
	`CREATE TABLE IF NOT EXISTS forum_posts (
		id            INTEGER PRIMARY KEY AUTOINCREMENT,
		thread_id     INTEGER NOT NULL,
		body_md       TEXT NOT NULL,
		kind          TEXT NOT NULL DEFAULT 'comment',
		author_login  TEXT NOT NULL,
		author_name   TEXT,
		author_avatar TEXT,
		deleted_at    TEXT,
		created_at    TEXT NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS idx_posts_thread ON forum_posts(thread_id, created_at)`,
	`CREATE TABLE IF NOT EXISTS plugin_votes (
		full_name  TEXT NOT NULL,
		user_login TEXT NOT NULL,
		verdict    TEXT NOT NULL,
		created_at TEXT NOT NULL,
		PRIMARY KEY (full_name, user_login)
	)`,
}

// pluginColumnMigrations 覆盖较早的 plugins 表。CREATE TABLE IF NOT EXISTS
// 不会为既有表补列；Migrate 先从 PRAGMA 读取现有列，只执行缺失项，并以
// duplicate-column 兜住多个 Railway 实例同时迁移的竞态。
type pluginColumnMigration struct {
	name string
	sql  string
}

var pluginColumnMigrations = []pluginColumnMigration{
	{"is_offtopic", `ALTER TABLE plugins ADD COLUMN is_offtopic INTEGER NOT NULL DEFAULT 0`},
	{"is_insider", `ALTER TABLE plugins ADD COLUMN is_insider INTEGER NOT NULL DEFAULT 0`},
	{"is_featured", `ALTER TABLE plugins ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0`},
	{"is_official", `ALTER TABLE plugins ADD COLUMN is_official INTEGER NOT NULL DEFAULT 0`},
	{"category", `ALTER TABLE plugins ADD COLUMN category TEXT NOT NULL DEFAULT ''`},
	{"category_manual", `ALTER TABLE plugins ADD COLUMN category_manual INTEGER NOT NULL DEFAULT 0`},
	{"score", `ALTER TABLE plugins ADD COLUMN score INTEGER`},
	{"score_detail", `ALTER TABLE plugins ADD COLUMN score_detail TEXT`},
	{"scored_at", `ALTER TABLE plugins ADD COLUMN scored_at TEXT`},
	{"score_version", `ALTER TABLE plugins ADD COLUMN score_version TEXT`},
	{"install_cmd", `ALTER TABLE plugins ADD COLUMN install_cmd TEXT`},
	{"pkg_name", `ALTER TABLE plugins ADD COLUMN pkg_name TEXT`},
	{"pkg_version", `ALTER TABLE plugins ADD COLUMN pkg_version TEXT`},
	{"pkg_private", `ALTER TABLE plugins ADD COLUMN pkg_private INTEGER`},
	{"has_bundle", `ALTER TABLE plugins ADD COLUMN has_bundle INTEGER`},
	{"has_prepare", `ALTER TABLE plugins ADD COLUMN has_prepare INTEGER`},
	{"entry_needs_build", `ALTER TABLE plugins ADD COLUMN entry_needs_build INTEGER`},
	{"npm_published", `ALTER TABLE plugins ADD COLUMN npm_published INTEGER`},
	{"release_tgz_url", `ALTER TABLE plugins ADD COLUMN release_tgz_url TEXT`},
	{"release_tag", `ALTER TABLE plugins ADD COLUMN release_tag TEXT`},
	{"release_prerelease", `ALTER TABLE plugins ADD COLUMN release_prerelease INTEGER`},
	{"release_asset_name", `ALTER TABLE plugins ADD COLUMN release_asset_name TEXT`},
	{"release_asset_size", `ALTER TABLE plugins ADD COLUMN release_asset_size INTEGER`},
	{"release_asset_digest", `ALTER TABLE plugins ADD COLUMN release_asset_digest TEXT`},
	{"release_etag", `ALTER TABLE plugins ADD COLUMN release_etag TEXT`},
	{"install_kind", `ALTER TABLE plugins ADD COLUMN install_kind TEXT`},
	{"install_cmd_auto", `ALTER TABLE plugins ADD COLUMN install_cmd_auto TEXT`},
	{"install_probed_at", `ALTER TABLE plugins ADD COLUMN install_probed_at TEXT`},
	{"readme_install_cmd", `ALTER TABLE plugins ADD COLUMN readme_install_cmd TEXT`},
	{"install_source", `ALTER TABLE plugins ADD COLUMN install_source TEXT`},
	{"entry_committed", `ALTER TABLE plugins ADD COLUMN entry_committed INTEGER`},
	{"is_risky", `ALTER TABLE plugins ADD COLUMN is_risky INTEGER NOT NULL DEFAULT 0`},
	{"risk_note", `ALTER TABLE plugins ADD COLUMN risk_note TEXT`},
	{"is_plugin", `ALTER TABLE plugins ADD COLUMN is_plugin INTEGER`},
	{"is_plugin_manual", `ALTER TABLE plugins ADD COLUMN is_plugin_manual INTEGER NOT NULL DEFAULT 0`},
	{"npm_latest_version", `ALTER TABLE plugins ADD COLUMN npm_latest_version TEXT`},
	{"npm_repo_backlink", `ALTER TABLE plugins ADD COLUMN npm_repo_backlink INTEGER NOT NULL DEFAULT 0`},
}

func (s *Store) Migrate(ctx context.Context) error {
	for _, stmt := range migrations {
		if _, err := s.db.ExecContext(ctx, stmt); err != nil {
			return fmt.Errorf("执行 schema migration: %w", err)
		}
	}
	columns, err := s.pluginColumns(ctx)
	if err != nil {
		return fmt.Errorf("读取 plugins schema: %w", err)
	}
	for _, migration := range pluginColumnMigrations {
		if columns[migration.name] {
			continue
		}
		if _, err := s.db.ExecContext(ctx, migration.sql); err != nil && !isDuplicateColumn(err) {
			return fmt.Errorf("执行 plugins column migration: %w", err)
		}
	}
	return nil
}

func (s *Store) pluginColumns(ctx context.Context) (map[string]bool, error) {
	rows, err := s.db.QueryContext(ctx, `PRAGMA table_info(plugins)`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns := map[string]bool{}
	for rows.Next() {
		var cid, notNull, primaryKey int
		var name, typ string
		var defaultValue sql.NullString
		if err := rows.Scan(&cid, &name, &typ, &notNull, &defaultValue, &primaryKey); err != nil {
			return nil, err
		}
		columns[name] = true
	}
	return columns, rows.Err()
}

func isDuplicateColumn(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "duplicate column")
}
