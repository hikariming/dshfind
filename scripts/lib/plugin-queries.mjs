/** Shared public-read SQL. Keep the real workerd read-budget tests on these queries. */
export const PLUGIN_DETAIL_SQL = `
SELECT full_name, name, owner, url, description, tags, language,
       stars, contributors, pushed_at, archived, category, score,
       is_featured, is_insider, is_official, is_risky, risk_note,
       first_seen_at, scored_at, score_detail,
       install_cmd, install_kind, install_cmd_auto, pkg_name, pkg_version,
       npm_latest_version,
       dl_pkg, dl_npm_total, dl_mirror_total, dl_release_total, dl_status,
       dl_manual_total, dl_manual_note
FROM plugins INDEXED BY idx_plugins_full_name_lower
WHERE lower(full_name) = lower(?1) AND is_present = 1 AND is_offtopic = 0
LIMIT 1`;

/**
 * At most two rows, using (full_name, snapshot_date) point/range seeks.
 * Missing/one-row histories still return zero/one row so callers preserve their
 * existing "not enough history" semantics. Never fetch a lifetime of history
 * just to calculate a seven-day delta.
 */
export const GROWTH_SNAPSHOTS_SQL = `
WITH latest AS (
  SELECT snapshot_date FROM plugin_snapshots
  WHERE full_name = ?1 ORDER BY snapshot_date DESC LIMIT 1
), baseline AS (
  SELECT snapshot_date FROM plugin_snapshots
  WHERE full_name = ?1 AND snapshot_date <= date((SELECT snapshot_date FROM latest), '-7 days')
  ORDER BY snapshot_date DESC LIMIT 1
)
SELECT full_name, snapshot_date, stars, contributors, pushed_at
FROM plugin_snapshots
WHERE full_name = ?1 AND snapshot_date IN (
  (SELECT snapshot_date FROM latest),
  COALESCE((SELECT snapshot_date FROM baseline),
    (SELECT snapshot_date FROM plugin_snapshots WHERE full_name = ?1 ORDER BY snapshot_date ASC LIMIT 1))
)
ORDER BY snapshot_date`;

/** One daily snapshot per date: at most 91 rows including today's boundary. */
export const RECENT_SNAPSHOTS_SQL = `
SELECT full_name, snapshot_date, stars, contributors, pushed_at
FROM plugin_snapshots
WHERE full_name = ?1 AND snapshot_date >= ?2 AND snapshot_date <= ?3
ORDER BY snapshot_date
LIMIT 91`;

/** Offline generation only. Seek the baseline per plugin; no history GROUP BY. */
export const PLUGIN_GROWTH_JOIN_SQL = `
LEFT JOIN plugin_snapshots bs ON bs.full_name = p.full_name
AND bs.snapshot_date = COALESCE(
  (SELECT snapshot_date FROM plugin_snapshots s WHERE s.full_name = p.full_name
    AND s.snapshot_date <= date(
      (SELECT snapshot_date FROM plugin_snapshots l WHERE l.full_name = p.full_name
       ORDER BY snapshot_date DESC LIMIT 1), '-7 days')
   ORDER BY snapshot_date DESC LIMIT 1),
  (SELECT snapshot_date FROM plugin_snapshots s WHERE s.full_name = p.full_name
   ORDER BY snapshot_date ASC LIMIT 1)
)`;

/** @param {number} days @param {number} [now] */
export function snapshotRange(days, now = Date.now()) {
  return [new Date(now - days * 86400000).toISOString().slice(0, 10),
    new Date(now).toISOString().slice(0, 10)];
}
