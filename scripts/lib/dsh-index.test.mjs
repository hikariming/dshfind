import assert from "node:assert/strict";
import { test } from "node:test";

import { assertDshIndex, buildDshIndex } from "./dsh-index.mjs";

const row = (over = {}) => ({
  full_name: "bowenliang123/dsh-context",
  name: "dsh-context",
  owner: "bowenliang123",
  url: "https://github.com/bowenliang123/dsh-context",
  description: "Context insight\nand management",
  category: "agent",
  stars: 2134,
  score: 91,
  is_featured: 1,
  is_risky: 0,
  is_plugin: 1,
  npm_desktop_installable: 0,
  npm_published: 1,
  npm_repo_backlink: 1,
  has_bundle: 1,
  npm_latest_version: "0.69.1",
  pkg_name: "dsh-context",
  npm_repo_directory: null,
  pushed_at: "2026-10-15T07:26:08Z",
  install_probed_at: null,
  ...over,
});

test("builds a format-1 entry with npm source and dshfind homepage", () => {
  const index = buildDshIndex([row()]);
  assertDshIndex(index);
  assert.equal(index.format, 1);
  const [p] = index.plugins;
  assert.equal(p.name, "dsh-context");
  assert.equal(p.description, "Context insight and management");
  assert.equal(p.homepage, "https://dshfind.com/en/plugins/bowenliang123/dsh-context");
  assert.deepEqual(p.metadata, { category: "agent", labels: ["featured"], sortKeys: { stars: 2134, score: 91 } });
  assert.deepEqual(p.versions, [{ version: "0.69.1", publishTimestamp: 1792049168, source: { type: "npm" } }]);
});

test("skips rows the reader would reject or we cannot vouch for", () => {
  const index = buildDshIndex([
    row({ is_risky: 1 }),
    row({ has_bundle: 0 }),
    row({ npm_published: 0 }),
    row({ npm_repo_backlink: 0 }),
    row({ pkg_name: "@deepseek-ai/dsh-acp-app" }),
    row({ is_plugin: null }),
    row({ npm_latest_version: "latest" }),
    row({ pkg_name: "Bad Name" }),
  ]);
  assert.equal(index.plugins.length, 0);
});

test("Discover can list an npm latest prerelease from a workspace with a verified backlink", () => {
  const candidate = row({ npm_latest_version: null, npm_index_prerelease: "1.2.0-rc.3", npm_repo_directory: "packages/plugin" });
  const index = buildDshIndex([candidate]);
  assertDshIndex(index);
  assert.equal(index.plugins[0].versions[0].version, "1.2.0-rc.3");
  assert.deepEqual(index.plugins[0].versions[0].source, { type: "npm" });
  assert.equal(index.plugins[0].repository.directory, "packages/plugin");
  for (const change of [{ npm_repo_backlink: 0 }, { is_risky: 1 }, { npm_published: 0 }, { has_bundle: 0 }]) {
    assert.equal(buildDshIndex([{ ...candidate, ...change }]).plugins.length, 0);
  }
});

test("keeps the first repo claiming a package name", () => {
  const index = buildDshIndex([row(), row({ full_name: "fork/dsh-context", owner: "fork" })]);
  assert.equal(index.plugins.length, 1);
  assert.equal(index.plugins[0].author, "bowenliang123");
});

test("omits invalid optional fields instead of emitting them", () => {
  const index = buildDshIndex([
    row({ category: "", description: "   ", url: "https://github.com/a/b#x", npm_repo_directory: "../x", pushed_at: null }),
  ], new Date("2026-10-17T00:00:00Z"));
  assertDshIndex(index);
  const [p] = index.plugins;
  assert.equal("description" in p, false);
  assert.equal("repository" in p, false);
  assert.equal("category" in p.metadata, false);
  assert.equal(p.versions[0].publishTimestamp, 1792195200);
});
