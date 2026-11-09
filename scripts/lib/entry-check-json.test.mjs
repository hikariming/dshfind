import assert from "node:assert/strict";
import test from "node:test";

import { CHECKER_VERSION, mapReport, notRunEntry } from "./entry-check.mjs";
import {
  assertResultsMatchCandidates,
  makeCandidatesDocument,
  makeResultsDocument,
  parseCandidatesDocument,
  parseResultsDocument,
} from "./entry-check-json.mjs";

const candidate = {
  full_name: "acme/dsh-widget",
  pkg_name: "dsh-widget",
  npm_latest_version: "1.2.3",
  npm_repo_directory: "packages/widget",
  last_pkg_version: null,
};

const report = {
  conclusion: { status: "pass", exitCode: 0 },
  anchor: { repo: "deepseek-ai/deepseek-harness", commit: "ce7073d51254" },
  subject: { name: "dsh-widget", version: "1.2.3", kind: "plugin" },
  coverage: { entryBlocking: { pass: true, checked: ["C-1.1"], notChecked: [] } },
  notChecked: [],
};

const entry = mapReport(report, { checkedAt: "2026-11-09T00:00:00.000Z", dir: "packages/widget" });

test("candidates round-trip and keep only the runner fields", () => {
  const doc = makeCandidatesDocument([{ ...candidate, stars: 999, secret: "no" }], {
    generatedAt: "2026-11-09T00:00:00.000Z",
  });
  assert.equal(doc.schema, 1);
  assert.equal(doc.checker_version, CHECKER_VERSION);
  assert.deepEqual(parseCandidatesDocument(doc), [candidate]);
});

test("candidates reject invalid names, versions and fields", () => {
  assert.throws(() => makeCandidatesDocument([{ ...candidate, pkg_name: "../escape" }]));
  assert.throws(() => makeCandidatesDocument([{ ...candidate, npm_latest_version: "latest" }]));
  assert.throws(() => parseCandidatesDocument({ schema: 1, generated_at: "x", checker_version: CHECKER_VERSION, candidates: [] }));
});

test("results round-trip with a mapped entry", () => {
  const doc = makeResultsDocument([{ ...candidate, entry }], { generatedAt: "2026-11-09T00:00:00.000Z" });
  assert.equal(doc.schema, 1);
  assert.equal(doc.checker_version, CHECKER_VERSION);
  assert.deepEqual(parseResultsDocument(doc), [{ ...candidate, entry }]);
});

test("results accept a not_run entry", () => {
  const notRun = notRunEntry({ name: "dsh-widget", version: "1.2.3", checkedAt: "2026-11-09T00:00:00.000Z" });
  const doc = makeResultsDocument([{ ...candidate, entry: notRun }]);
  assert.equal(parseResultsDocument(doc)[0].entry.state, "not_run");
});

test("results reject a subject mismatch and a foreign checker version", () => {
  assert.throws(() => makeResultsDocument([{ ...candidate, entry: { ...entry, subject: { ...entry.subject, version: "9.9.9" } } }]));
  assert.throws(() => makeResultsDocument([{ ...candidate, entry: { ...entry, checker_version: "1.6.7" } }]));
});

test("results cannot claim FLOW or BOOST", () => {
  assert.throws(() => makeResultsDocument([{ ...candidate, entry: { ...entry, flow: "checked" } }]));
  assert.throws(() => makeResultsDocument([{ ...candidate, entry: { ...entry, boost: "measured" } }]));
});

test("results reject malformed blocking/not_checked shapes", () => {
  assert.throws(() => makeResultsDocument([{ ...candidate, entry: { ...entry, entry_blocking: { pass: true, checked: [1], not_checked: [] } } }]));
  assert.throws(() => makeResultsDocument([{ ...candidate, entry: { ...entry, not_checked: [{ id: 1, reason: "" }] } }]));
});

test("results must be a subset of the candidate list", () => {
  const results = parseResultsDocument(makeResultsDocument([{ ...candidate, entry }]));
  const candidates = parseCandidatesDocument(makeCandidatesDocument([candidate]));
  assert.doesNotThrow(() => assertResultsMatchCandidates(results, candidates));
  assert.throws(() => assertResultsMatchCandidates(
    results,
    parseCandidatesDocument(makeCandidatesDocument([{ ...candidate, full_name: "other/repo" }])),
  ));
});
