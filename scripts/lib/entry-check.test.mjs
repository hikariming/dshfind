import assert from "node:assert/strict";
import test from "node:test";

import {
  BOOST_STATE,
  CHECKER_VERSION,
  FLOW_STATE,
  emptyEntry,
  mapReport,
  notRunEntry,
  rawForReport,
  rowToEntry,
  stateForReport,
} from "./entry-check.mjs";
import { childEnv } from "./process-env.mjs";

const CHECKED_AT = "2026-11-07T00:00:00.000Z";
const COMMIT = "ce7073d51254c26cd63b22a60835b8f948deb447";
const ALLOWED_STATES = new Set(["checked", "not_run", "not_checked"]);

function report(overrides = {}) {
  return {
    conclusion: { status: "pass", exitCode: 0, level: "DSH-ENTRY recognized" },
    anchor: { repo: "deepseek-ai/deepseek-harness", commit: COMMIT },
    subject: { name: "dsh-widget", version: "1.2.3", kind: "plugin", path: "/tmp/secret/package" },
    coverage: {
      entryBlocking: {
        required: 6,
        pass: false,
        checked: ["C-1.1", "C-1.2", "C-1.4"],
        notChecked: ["C-3.1", "C-3.2", "C-3.5"],
        failed: [],
      },
    },
    notChecked: [
      {
        id: "DSC-03",
        clause: "C-3",
        result: "NA",
        coverage: "not-run",
        reason: "install spec not supplied (package profile)",
        howToEnable: "pass --install-spec <spec>",
      },
    ],
    ...overrides,
  };
}

const meta = { checkedAt: CHECKED_AT, dir: "packages/dsh-widget" };

/** 公开响应里不允许出现旧的状态词。 */
function assertNoOldStates(value) {
  const text = JSON.stringify(value);
  assert.ok(!text.includes('"state":"failed"'), text);
  assert.ok(!text.includes('"state":"recognized"'), text);
}

test("four report classes map to checked / checked / checked / not_run", () => {
  assert.equal(stateForReport(report({ conclusion: { status: "pass", exitCode: 0 } })), "checked");
  assert.equal(stateForReport(report({ conclusion: { status: "warn", exitCode: 0 } })), "checked");
  assert.equal(stateForReport(report({ conclusion: { status: "fail", exitCode: 1 } })), "checked");
  assert.equal(stateForReport(report({ conclusion: { status: "incomplete", exitCode: 2 } })), "not_run");
  // 没有 conclusion 的报告不能被当成跑完。
  assert.equal(stateForReport({}), "not_run");
});

test("raw keeps the checker verdict and exit code within the allowed vocabulary", () => {
  assert.deepEqual(rawForReport(report({ conclusion: { status: "pass", exitCode: 0 } })), {
    status: "pass",
    exit_code: 0,
  });
  assert.deepEqual(rawForReport(report({ conclusion: { status: "warn", exitCode: 0 } })), {
    status: "warn",
    exit_code: 0,
  });
  assert.deepEqual(rawForReport(report({ conclusion: { status: "fail", exitCode: 1 } })), {
    status: "fail",
    exit_code: 1,
  });
  assert.deepEqual(rawForReport(report({ conclusion: { status: "incomplete", exitCode: 2 } })), {
    status: "not_run",
    exit_code: 2,
  });
  assert.deepEqual(rawForReport(report({ conclusion: { status: "something-new", exitCode: 9 } })), {
    status: "not_run",
    exit_code: null,
  });
  assert.deepEqual(rawForReport({}), { status: "not_run", exit_code: null });
});

test("entry_blocking.pass=false is preserved for pass, warn, and fail raw reports", () => {
  for (const [status, exitCode] of [["pass", 0], ["warn", 0], ["fail", 1]]) {
    const mapped = mapReport(report({ conclusion: { status, exitCode } }), meta);
    assert.equal(mapped.state, "checked");
    assert.deepEqual(mapped.raw, { status, exit_code: exitCode });
    assert.equal(mapped.entry_blocking.pass, false);
    assert.deepEqual(mapped.entry_blocking.checked, ["C-1.1", "C-1.2", "C-1.4"]);
    assert.deepEqual(mapped.entry_blocking.not_checked, ["C-3.1", "C-3.2", "C-3.5"]);
  }
  const passing = report();
  passing.coverage.entryBlocking.pass = true;
  assert.equal(mapReport(passing, meta).entry_blocking.pass, true);
});

test("state=checked with raw.status=fail keeps entry_blocking untouched", () => {
  const mapped = mapReport(
    report({ conclusion: { status: "fail", exitCode: 1 }, coverage: { entryBlocking: {
      pass: false,
      checked: ["C-1.1", "C-1.2"],
      notChecked: ["C-3.1"],
    } } }),
    meta,
  );
  assert.equal(mapped.state, "checked");
  assert.deepEqual(mapped.raw, { status: "fail", exit_code: 1 });
  assert.deepEqual(mapped.entry_blocking, {
    pass: false,
    checked: ["C-1.1", "C-1.2"],
    not_checked: ["C-3.1"],
  });
});

test("checker status and exit code appear only inside raw", () => {
  const mapped = mapReport(report(), meta);
  assert.equal("conclusion" in mapped, false);
  assert.equal("status" in mapped, false);
  assert.equal("exit_code" in mapped, false);
  assert.deepEqual(mapped.raw, { status: "pass", exit_code: 0 });
  const stray = [];
  const walk = (value, path) => {
    if (Array.isArray(value)) return value.forEach((child, i) => walk(child, [...path, i]));
    if (value === null || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "status" || key === "exit_code") stray.push([...path, key].join("."));
      walk(child, [...path, key]);
    }
  };
  walk(mapped, []);
  assert.deepEqual(stray.sort(), ["raw.exit_code", "raw.status"]);
});

test("flow/boost stay hard-coded constants even if a report tries to override them", () => {
  const mapped = mapReport(
    report({ flow: "pass", boost: "measured", entry: { flow: "pass", boost: "measured" } }),
    meta,
  );
  assert.equal(mapped.flow, FLOW_STATE);
  assert.equal(mapped.boost, BOOST_STATE);
  assert.equal(mapped.flow, "not-run");
  assert.equal(mapped.boost, "not-measured");
});

test("entry block carries no score or grade fields", () => {
  const mapped = mapReport(report(), meta);
  const keys = new Set();
  const walk = (value) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (value === null || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      walk(child);
    }
  };
  walk(mapped);
  for (const key of keys) {
    assert.doesNotMatch(key, /score|grade/i, `unexpected field ${key}`);
  }
});

test("maps subject, source, commit, and the probe directory without leaking the runner path", () => {
  const mapped = mapReport(report(), meta);
  assert.equal(mapped.state, "checked");
  assert.equal(mapped.checked_at, CHECKED_AT);
  assert.equal(mapped.checker_version, CHECKER_VERSION);
  assert.equal(mapped.commit, COMMIT);
  assert.equal(mapped.source, "npm");
  assert.deepEqual(mapped.subject, { name: "dsh-widget", version: "1.2.3", kind: "plugin", dir: "packages/dsh-widget" });
  assert.deepEqual(mapped.raw, { status: "pass", exit_code: 0 });
  assert.deepEqual(mapped.not_checked, [
    { id: "DSC-03", reason: "install spec not supplied (package profile)" },
  ]);
  assert.ok(!JSON.stringify(mapped).includes("/tmp/secret"));
  assertNoOldStates(mapped);
});

test("commit is optional and a bad commit is omitted rather than guessed", () => {
  const noAnchor = report({ anchor: undefined });
  assert.equal("commit" in mapReport(noAnchor, meta), false);
  const badAnchor = report({ anchor: { commit: "not-a-sha" } });
  assert.equal("commit" in mapReport(badAnchor, meta), false);
});

test("no database row yields a stable not_checked block", () => {
  assert.deepEqual(emptyEntry(), {
    state: "not_checked",
    checked_at: null,
    checker_version: null,
    source: null,
    subject: null,
    raw: null,
    entry_blocking: null,
    not_checked: [],
    flow: "not-run",
    boost: "not-measured",
  });
  assert.deepEqual(rowToEntry(undefined), emptyEntry());
  assertNoOldStates(emptyEntry());
});

test("a failed attempt is not_run with a raw not_run verdict", () => {
  const entry = notRunEntry({ name: "dsh-widget", version: "1.2.3", checkedAt: CHECKED_AT, dir: "packages/x" });
  assert.equal(entry.state, "not_run");
  assert.deepEqual(entry.raw, { status: "not_run", exit_code: null });
  assert.deepEqual(entry.subject, { name: "dsh-widget", version: "1.2.3", kind: "unknown", dir: "packages/x" });
  assert.deepEqual(entry.entry_blocking, { pass: false, checked: [], not_checked: [] });
  assert.equal(entry.flow, "not-run");
  assert.equal(entry.boost, "not-measured");
  assert.throws(() => notRunEntry({ name: "", version: "1.0.0", checkedAt: CHECKED_AT }), /name/);
  assertNoOldStates(entry);
});

test("D1 rows render checked/not_run and keep the fail verdict in raw", () => {
  const row = {
    state: "checked",
    checked_at: CHECKED_AT,
    checker_version: CHECKER_VERSION,
    anchor_commit: COMMIT,
    source: "npm",
    subject_name: "dsh-widget",
    subject_version: "1.2.3",
    subject_kind: "bundle",
    subject_dir: "packages/dsh-widget",
    conclusion_status: "fail",
    exit_code: 1,
    blocking_pass: 0,
    blocking_checked: '["C-1.1"]',
    blocking_not_checked: '["C-3.1"]',
    not_checked: '[{"id":"DSC-04","reason":"--no-exec"}]',
    // 即使库里将来多出这两列，也不能覆盖常量。
    flow: "pass",
    boost: "measured",
  };
  const entry = rowToEntry(row);
  assert.equal(entry.state, "checked");
  assert.deepEqual(entry.raw, { status: "fail", exit_code: 1 });
  assert.deepEqual(entry.entry_blocking, {
    pass: false,
    checked: ["C-1.1"],
    not_checked: ["C-3.1"],
  });
  assert.deepEqual(entry.not_checked, [{ id: "DSC-04", reason: "--no-exec" }]);
  assert.equal(entry.flow, "not-run");
  assert.equal(entry.boost, "not-measured");
  assert.equal(rowToEntry({ ...row, state: "something-else" }).state, "not_run");
  assert.deepEqual(rowToEntry({ ...row, blocking_checked: "not json" }).entry_blocking.checked, []);
  assert.deepEqual(rowToEntry({ ...row, exit_code: 9, conclusion_status: "something-new" }).raw, {
    status: "not_run",
    exit_code: null,
  });
  assertNoOldStates(entry);
});

test("every emitted state is checked / not_run / not_checked and never the old words", () => {
  const entries = [
    mapReport(report({ conclusion: { status: "pass", exitCode: 0 } }), meta),
    mapReport(report({ conclusion: { status: "warn", exitCode: 0 } }), meta),
    mapReport(report({ conclusion: { status: "fail", exitCode: 1 } }), meta),
    mapReport(report({ conclusion: { status: "incomplete", exitCode: 2 } }), meta),
    notRunEntry({ name: "dsh-widget", version: "1.2.3", checkedAt: CHECKED_AT }),
    emptyEntry(),
    rowToEntry({ state: "checked", conclusion_status: "fail", exit_code: 1 }),
  ];
  for (const entry of entries) {
    assert.ok(ALLOWED_STATES.has(entry.state), `unexpected state ${entry.state}`);
    assertNoOldStates(entry);
  }
});

test("malformed reports are rejected so the runner can skip that row", () => {
  assert.throws(() => mapReport(null, meta), /not an object/);
  assert.throws(() => mapReport(report({ subject: undefined }), meta), /no subject/);
  assert.throws(() => mapReport(report({ conclusion: undefined }), meta), /no conclusion/);
  assert.throws(() => mapReport(report(), { checkedAt: "" }), /checkedAt/);
  assert.throws(
    () => mapReport(report({ conclusion: { status: "", exitCode: 0 } }), meta),
    /conclusion.status/,
  );
});


test("childEnv strips database and Cloudflare credentials from child processes", () => {
  const parent = {
    PATH: "/usr/bin",
    HOME: "/home/runner",
    D1_INTERNAL_TOKEN: "secret",
    D1_INTERNAL_URL: "https://example.invalid/db",
    CLOUDFLARE_API_TOKEN: "secret",
    NO_COLOR: "0",
  };
  const env = childEnv({ NO_COLOR: "1" }, parent);
  assert.deepEqual(env, { PATH: "/usr/bin", HOME: "/home/runner", NO_COLOR: "1" });
  assert.equal("D1_INTERNAL_TOKEN" in env, false);
  assert.equal("CLOUDFLARE_API_TOKEN" in env, false);
  // The parent object is not mutated.
  assert.equal(parent.NO_COLOR, "0");
});
