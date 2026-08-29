import assert from "node:assert/strict";
import test from "node:test";

import {
  catalogIdentity,
  pluginSource,
  repositoryPath,
  workspaceDirectories,
  workspaceItemFullName,
} from "./workspaces.mjs";

const manifests = [
  "packages/a/package.json",
  "packages/b/package.json",
  "packages/a/plugins/nested/package.json",
  "tools/plugin/package.json",
];

test("workspaceDirectories supports package.json workspace forms", () => {
  assert.deepEqual(workspaceDirectories({ workspaces: ["packages/*"] }, manifests), {
    directories: ["packages/a", "packages/b"],
    complete: true,
  });
  assert.deepEqual(
    workspaceDirectories({ workspaces: { packages: ["tools/*"] } }, manifests),
    { directories: ["tools/plugin"], complete: true },
  );
});

test("workspaceDirectories supports recursive, nested, brace, extglob, and exclusion patterns", () => {
  for (const pattern of ["packages/**", "packages/*/plugins/*", "packages/{a,b}", "packages/@(a|b)"]) {
    assert.ok(workspaceDirectories({ workspaces: [pattern] }, manifests).directories.length > 0, pattern);
  }
  assert.deepEqual(
    workspaceDirectories({ workspaces: ["packages/**", "!packages/a/plugins/*"] }, manifests),
    { directories: ["packages/a", "packages/b"], complete: true },
  );
});

test("workspaceDirectories rejects unsafe declarations without authorizing cleanup", () => {
  assert.deepEqual(workspaceDirectories({ workspaces: ["../outside"] }, manifests), {
    directories: [],
    complete: false,
  });
});

test("workspaceItemFullName creates a stable internal route key", () => {
  assert.equal(
    workspaceItemFullName("TGYD-helige/dsh-plugins", "@amaster.ai/dsh-a2a"),
    "TGYD-helige/dsh-plugins~amaster.ai~dsh-a2a",
  );
});

test("pluginSource and repositoryPath resolve package-relative source files", () => {
  assert.deepEqual(
    pluginSource({ full_name: "route/key", repository_full_name: "owner/repo", package_path: "packages/a" }),
    { fullName: "route/key", repositoryFullName: "owner/repo", packagePath: "packages/a" },
  );
  assert.equal(repositoryPath("packages/a", "README.md"), "packages/a/README.md");
  assert.equal(repositoryPath(null, "README.md"), "README.md");
});

test("catalogIdentity uses the exact workspace package name", () => {
  assert.equal(catalogIdentity({ full_name: "owner/repo" }), "owner/repo");
  assert.equal(catalogIdentity({
    full_name: "owner/repo~scope~plugin",
    repository_full_name: "owner/repo",
    pkg_name: "@scope/plugin",
  }), "@scope/plugin");
});
