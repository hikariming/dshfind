import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@libsql/client";

import {
  installProbeFilter,
  resolveLiveInstallDisplay,
} from "../../src/lib/install-metadata.mjs";

test("a repository pushed after its fresh install probe is selected again", async (t) => {
  const client = createClient({ url: "file::memory:" });
  t.after(() => client.close());
  await client.execute(`CREATE TABLE plugins (
    full_name TEXT, is_present INTEGER, is_offtopic INTEGER,
    pushed_at TEXT, install_probed_at TEXT, stars INTEGER
  )`);
  await client.batch(
    [
      ["pushed/repo", "2026-08-16T01:00:00.000Z", "2026-08-15T01:00:00.000Z"],
      ["quiet/repo", "2026-08-14T01:00:00.000Z", "2026-08-15T01:00:00.000Z"],
    ].map(([fullName, pushedAt, probedAt], stars) => ({
      sql: "INSERT INTO plugins VALUES (?, 1, 0, ?, ?, ?)",
      args: [fullName, pushedAt, probedAt, stars],
    })),
    "write",
  );

  const filter = installProbeFilter({
    only: [],
    rederive: false,
    all: false,
    staleDays: 7,
    now: Date.parse("2026-08-16T02:00:00.000Z"),
  });
  const selected = await client.execute({
    sql: `SELECT full_name FROM plugins
          WHERE is_present = 1 AND is_offtopic = 0${filter.sql}
          ORDER BY stars DESC`,
    args: filter.args,
  });
  assert.deepEqual(selected.rows.map((row) => String(row.full_name)), ["pushed/repo"]);
});

test("a live null never falls back to a stale editorial install command", () => {
  const display = resolveLiveInstallDisplay({
    liveCuratedCmd: null,
    automaticCmd: null,
    automaticKind: null,
    editorialCmd: "dsh plugin add old-release.tgz",
  });
  assert.deepEqual(display, { installCmd: null, installKind: null });
});
