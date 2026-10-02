import test from "node:test";
import assert from "node:assert/strict";
import { collectRepos, parseGithubRepo, pickBatch } from "./npm-discovery.mjs";

test("parseGithubRepo 兼容 npm 常见的几种 repository 写法", () => {
  assert.equal(parseGithubRepo("git+https://github.com/Foo/bar.git"), "Foo/bar");
  assert.equal(parseGithubRepo("https://github.com/foo/bar"), "foo/bar");
  assert.equal(parseGithubRepo("git+ssh://git@github.com/foo/bar.git"), "foo/bar");
  assert.equal(parseGithubRepo("git+github:foo/bar.git"), null); // 简写不含 github.com，宁缺毋滥
  assert.equal(parseGithubRepo("https://github.com/foo/bar/tree/main/pkg"), "foo/bar");
  assert.equal(parseGithubRepo("https://github.com/foo/my.repo.git"), "foo/my.repo");
});

test("parseGithubRepo 拒绝非 GitHub 与模板占位符", () => {
  assert.equal(parseGithubRepo("https://gitee.com/foo/bar.git"), null);
  assert.equal(parseGithubRepo("https://github.com/<your-account>/dsh-skill-lens"), null);
  assert.equal(parseGithubRepo("https://github.com/foo/.."), null);
  assert.equal(parseGithubRepo(undefined), null);
});

test("collectRepos 按仓库合并多个包，大小写不敏感去重", () => {
  const m = collectRepos([
    { package: { name: "a", links: { repository: "https://github.com/Foo/Mono" } } },
    { package: { name: "b", links: { repository: "git+https://github.com/foo/mono.git" } } },
    { package: { name: "c", links: {} } },
  ]);
  assert.equal(m.size, 1);
  assert.deepEqual(m.get("foo/mono"), { repo: "Foo/Mono", packages: ["a", "b"] });
});

test("pickBatch 已入库的全留，新仓库按 limit 截断", () => {
  const known = new Set(["a/x"]);
  const r = pickBatch(["A/x", "b/y", "c/z", "d/w"], known, 2);
  assert.deepEqual(r, { have: ["A/x"], fresh: ["b/y", "c/z"] });
});
