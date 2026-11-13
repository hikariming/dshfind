-- Additive, read-only ENTRY evidence for the plugin detail API.
-- One row per plugin. Rows are only written for confirmed plugins whose
-- published npm package was actually checked; missing rows mean not_checked.
-- No existing table/column is altered, so this migration can be rolled back by
-- dropping plugin_entry_checks without touching catalog or score data.
CREATE TABLE IF NOT EXISTS plugin_entry_checks (
  full_name            TEXT PRIMARY KEY,
  state                TEXT NOT NULL,
  checked_at           TEXT NOT NULL,
  checker_version      TEXT NOT NULL,
  anchor_commit        TEXT,
  source               TEXT NOT NULL,
  pkg_name             TEXT NOT NULL,
  pkg_version          TEXT NOT NULL,
  subject_name         TEXT NOT NULL,
  subject_version      TEXT NOT NULL,
  subject_kind         TEXT NOT NULL,
  subject_dir          TEXT,
  conclusion_status    TEXT NOT NULL,
  exit_code            INTEGER,
  blocking_pass        INTEGER NOT NULL DEFAULT 0,
  blocking_checked     TEXT NOT NULL DEFAULT '[]',
  blocking_not_checked TEXT NOT NULL DEFAULT '[]',
  not_checked          TEXT NOT NULL DEFAULT '[]'
);
PRAGMA optimize;
