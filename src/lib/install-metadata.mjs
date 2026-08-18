const DAY_MS = 86_400_000;

/** Build the mutually exclusive scope filter used by the install probe query. */
export function installProbeFilter({
  only,
  rederive,
  all,
  staleDays,
  now = Date.now(),
}) {
  if (only.length) {
    return {
      sql: ` AND lower(full_name) IN (${only.map(() => "?").join(",")})`,
      args: only.map((name) => name.toLowerCase()),
    };
  }
  if (rederive) return { sql: " AND install_probed_at IS NOT NULL", args: [] };
  if (all) return { sql: "", args: [] };

  const cutoff = new Date(now - staleDays * DAY_MS).toISOString();
  return {
    sql: " AND (install_probed_at IS NULL OR install_probed_at < ? OR pushed_at > install_probed_at)",
    args: [cutoff],
  };
}

/** Resolve install UI strictly from live database fields, never from an editorial snapshot. */
export function resolveLiveInstallDisplay({
  liveCuratedCmd,
  automaticCmd,
  automaticKind,
}) {
  return {
    installCmd: liveCuratedCmd ?? automaticCmd,
    installKind: liveCuratedCmd ? "curated" : automaticKind,
  };
}
