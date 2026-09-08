-- Protect case-insensitive public detail lookups (including misses).
-- Deliberately non-unique: this changes the access path, not existing data rules.
CREATE INDEX IF NOT EXISTS idx_plugins_full_name_lower ON plugins(lower(full_name));
PRAGMA optimize;
