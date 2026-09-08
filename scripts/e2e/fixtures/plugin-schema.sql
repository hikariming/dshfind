-- Public catalog schema captured from production on 2026-09-09; no data or credentials.
CREATE TABLE plugin_i18n (
  full_name TEXT NOT NULL, locale TEXT NOT NULL,
  description TEXT, intro TEXT, highlights TEXT, updated_at TEXT NOT NULL,
  PRIMARY KEY (full_name, locale));
CREATE TABLE plugin_snapshots (
    full_name     TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    stars         INTEGER NOT NULL,
    contributors  INTEGER,
    pushed_at     TEXT,
    PRIMARY KEY (full_name, snapshot_date)
  );
CREATE TABLE plugins (
    full_name      TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    owner          TEXT NOT NULL,
    url            TEXT NOT NULL,
    description    TEXT NOT NULL DEFAULT '',
    tags           TEXT NOT NULL DEFAULT '[]',
    language       TEXT NOT NULL DEFAULT '',
    stars          INTEGER NOT NULL DEFAULT 0,
    contributors   INTEGER,
    pushed_at      TEXT NOT NULL DEFAULT '',
    archived       INTEGER NOT NULL DEFAULT 0,
    first_seen_at  TEXT NOT NULL,
    last_synced_at TEXT NOT NULL,
    is_present     INTEGER NOT NULL DEFAULT 1
  , is_offtopic INTEGER NOT NULL DEFAULT 0, is_insider INTEGER NOT NULL DEFAULT 0, is_featured INTEGER NOT NULL DEFAULT 0, category TEXT NOT NULL DEFAULT '', category_manual INTEGER NOT NULL DEFAULT 0, score INTEGER, score_detail TEXT, scored_at TEXT, is_official INTEGER NOT NULL DEFAULT 0, install_cmd TEXT, pkg_name TEXT, pkg_private INTEGER, has_bundle INTEGER, has_prepare INTEGER, entry_needs_build INTEGER, npm_published INTEGER, install_kind TEXT, install_cmd_auto TEXT, install_probed_at TEXT, readme_install_cmd TEXT, install_source TEXT, entry_committed INTEGER, pkg_version TEXT, release_tgz_url TEXT, release_tag TEXT, release_prerelease INTEGER, release_asset_name TEXT, release_asset_size INTEGER, release_asset_digest TEXT, release_etag TEXT, score_version TEXT, is_risky INTEGER NOT NULL DEFAULT 0, risk_note TEXT, is_plugin INTEGER, is_plugin_manual INTEGER NOT NULL DEFAULT 0, npm_latest_version TEXT, npm_repo_backlink INTEGER NOT NULL DEFAULT 0, npm_desktop_installable INTEGER NOT NULL DEFAULT 0, featured_boost INTEGER NOT NULL DEFAULT 1, has_badge INTEGER NOT NULL DEFAULT 0, dshfind_link INTEGER NOT NULL DEFAULT 0, badge_probed_at TEXT, badge_first_seen_at TEXT, dshfind_repo_link INTEGER NOT NULL DEFAULT 0, dl_pkg TEXT, dl_npm_total INTEGER, dl_mirror_total INTEGER, dl_release_total INTEGER, dl_status TEXT, dl_note TEXT, dl_probed_at TEXT, dl_manual_total INTEGER, dl_manual_note TEXT, npm_repo_directory TEXT);
CREATE INDEX idx_snapshots_date ON plugin_snapshots(snapshot_date);