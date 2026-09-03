import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RELEASE_ASSET_BYTES,
  catalogSubdirectory,
  deriveInstall,
  desktopPreviewVerdict,
  expandableWorkspaceGlob,
  fetchOutcome,
  manifestFacts,
  mergeManifestProbe,
  mergeNpmProbe,
  normalizeNpmRepository,
  npmRepoBacklink,
  npmRepoSubdirectory,
  pickBundleSubpackage,
  retryableStatus,
  selectReleaseTarball,
  workspaceGlobsFromManifest,
  workspaceGlobsFromPnpmYaml,
} from "./install.mjs";

const FULL_NAME = "example/dsh-widget";
const PKG_NAME = "dsh-widget";
const VERSION = "1.2.3";

function githubRelease({
  draft = false,
  prerelease = false,
  tag = `v${VERSION}`,
  assetName = `${PKG_NAME}-${VERSION}.tgz`,
  url = `https://github.com/${FULL_NAME}/releases/download/${tag}/${assetName}`,
  size = 1_024,
  state = "uploaded",
} = {}) {
  return {
    draft,
    prerelease,
    tag_name: tag,
    assets: [
      {
        name: assetName,
        browser_download_url: url,
        size,
        state,
        digest: `sha256:${"a".repeat(64)}`,
      },
    ],
  };
}

function releaseFacts(overrides = {}) {
  const selected = selectReleaseTarball({
    fullName: FULL_NAME,
    pkgName: PKG_NAME,
    pkgVersion: VERSION,
    releases: [githubRelease(overrides)],
  });
  assert.ok(selected);
  return selected;
}

function installFacts(overrides = {}) {
  return {
    fullName: FULL_NAME,
    pkgName: PKG_NAME,
    pkgVersion: VERSION,
    pkgPrivate: false,
    hasBundle: true,
    hasPrepare: false,
    entryNeedsBuild: true,
    npmPublished: false,
    releaseTgzUrl: null,
    releaseTag: null,
    releasePrerelease: false,
    releaseAssetName: null,
    releaseAssetSize: null,
    releaseAssetDigest: null,
    ...overrides,
  };
}

test("manifestFacts preserves the package version used to bind releases", () => {
  assert.deepEqual(
    manifestFacts({
      name: PKG_NAME,
      version: VERSION,
      dsh: { bundle: "cordis.patch.yml" },
      main: "dist/index.js",
    }),
    {
      pkgName: PKG_NAME,
      pkgVersion: VERSION,
      pkgPrivate: false,
      hasBundle: true,
      hasPrepare: false,
      entryNeedsBuild: true,
    },
  );
});

test("selects one uploaded GitHub asset whose tag, package, and version match", () => {
  const selected = selectReleaseTarball({
    fullName: FULL_NAME,
    pkgName: PKG_NAME,
    pkgVersion: VERSION,
    releases: [githubRelease()],
  });
  assert.deepEqual(selected, {
    releaseTgzUrl:
      "https://github.com/example/dsh-widget/releases/download/v1.2.3/dsh-widget-1.2.3.tgz",
    releaseTag: "v1.2.3",
    releasePrerelease: false,
    releaseAssetName: "dsh-widget-1.2.3.tgz",
    releaseAssetSize: 1_024,
    releaseAssetDigest: `sha256:${"a".repeat(64)}`,
  });
});

test("uses npm-pack naming for scoped packages", () => {
  const pkgName = "@scope/dsh-widget";
  const assetName = "scope-dsh-widget-1.2.3.tgz";
  assert.ok(
    selectReleaseTarball({
      fullName: FULL_NAME,
      pkgName,
      pkgVersion: VERSION,
      releases: [githubRelease({ assetName })],
    }),
  );
});

test("ignores draft releases", () => {
  assert.equal(
    selectReleaseTarball({
      fullName: FULL_NAME,
      pkgName: PKG_NAME,
      pkgVersion: VERSION,
      releases: [githubRelease({ draft: true })],
    }),
    null,
  );
});

test("requires prerelease metadata to agree with a prerelease package version", () => {
  const pkgVersion = "1.2.3-rc.1";
  const assetName = `${PKG_NAME}-${pkgVersion}.tgz`;
  const accepted = githubRelease({
    prerelease: true,
    tag: `v${pkgVersion}`,
    assetName,
    url: `https://github.com/${FULL_NAME}/releases/download/v${pkgVersion}/${assetName}`,
  });
  assert.ok(
    selectReleaseTarball({
      fullName: FULL_NAME,
      pkgName: PKG_NAME,
      pkgVersion,
      releases: [accepted],
    }),
  );
  assert.equal(
    selectReleaseTarball({
      fullName: FULL_NAME,
      pkgName: PKG_NAME,
      pkgVersion,
      releases: [{ ...accepted, prerelease: false }],
    }),
    null,
  );
  assert.equal(
    selectReleaseTarball({
      fullName: FULL_NAME,
      pkgName: PKG_NAME,
      pkgVersion: VERSION,
      releases: [githubRelease({ prerelease: true })],
    }),
    null,
  );
});

test("rejects wrong filenames and host-spoofed or decorated URLs", () => {
  for (const release of [
    githubRelease({ assetName: "other-1.2.3.tgz" }),
    githubRelease({
      url: "https://github.com.evil.example/example/dsh-widget/releases/download/v1.2.3/dsh-widget-1.2.3.tgz",
    }),
    githubRelease({
      url: "https://github.com/example/dsh-widget/releases/download/v1.2.3/dsh-widget-1.2.3.tgz?token=surprise",
    }),
  ]) {
    assert.equal(
      selectReleaseTarball({
        fullName: FULL_NAME,
        pkgName: PKG_NAME,
        pkgVersion: VERSION,
        releases: [release],
      }),
      null,
    );
  }
});

test("rejects oversized, incomplete, and ambiguous assets", () => {
  for (const release of [
    githubRelease({ size: MAX_RELEASE_ASSET_BYTES + 1 }),
    githubRelease({ state: "new" }),
  ]) {
    assert.equal(
      selectReleaseTarball({
        fullName: FULL_NAME,
        pkgName: PKG_NAME,
        pkgVersion: VERSION,
        releases: [release],
      }),
      null,
    );
  }
  assert.equal(
    selectReleaseTarball({
      fullName: FULL_NAME,
      pkgName: PKG_NAME,
      pkgVersion: VERSION,
      releases: [githubRelease(), githubRelease()],
    }),
    null,
  );
});

test("prefers npm over a release tarball when the package is published", () => {
  // npm 与 release 都是无法与源码对账的预构建产物，但 npm 有 provenance、
  // 恶意包扫描与 unpublish 机制，所以已发布 npm 时不降级到 Release 资产。
  const selected = releaseFacts();
  assert.deepEqual(deriveInstall(installFacts({ ...selected, npmPublished: true })), {
    kind: "npm",
    reason: null,
    cmd: "dsh plugin --profile web add dsh-widget",
    profile: "web",
    source: "manifest",
  });
});

test("falls back to a safe release tarball over build-required when npm is absent", () => {
  const selected = releaseFacts();
  assert.deepEqual(deriveInstall(installFacts({ ...selected, npmPublished: false })), {
    kind: "release",
    reason: null,
    cmd: "dsh plugin --profile web add https://github.com/example/dsh-widget/releases/download/v1.2.3/dsh-widget-1.2.3.tgz",
    profile: "web",
    source: "manifest",
  });
});

test("revalidates stored release metadata before generating a command", () => {
  // npmPublished 必须为 false，否则 npm 分支会先返回，这条就证明不了重新校验生效。
  const selected = releaseFacts();
  assert.equal(
    deriveInstall(
      installFacts({
        ...selected,
        releaseTgzUrl:
          "https://evil.example/example/dsh-widget/releases/download/v1.2.3/dsh-widget-1.2.3.tgz",
        npmPublished: false,
      }),
    ).kind,
    "build-required",
  );
});

test("preserves npm, build-required, git, and not-installable fallbacks", () => {
  assert.equal(deriveInstall(installFacts({ npmPublished: true })).kind, "npm");
  assert.equal(deriveInstall(installFacts()).kind, "build-required");
  assert.equal(
    deriveInstall(installFacts({ entryNeedsBuild: false })).kind,
    "git",
  );
  assert.equal(deriveInstall(installFacts({ hasBundle: false })).kind, "not-installable");
});

test("normalizeNpmRepository accepts every npm repository shape", () => {
  const url = `https://github.com/${FULL_NAME}`;
  for (const repository of [
    url, // string 形态
    { url }, // {url}
    { url, directory: "packages/widget" }, // {url, directory}（monorepo 子目录不影响回链）
    `git+${url}`, // git+ 前缀
    `git@github.com:${FULL_NAME}`, // scp 风格
    `${url}.git`, // .git 后缀
    `git+${url}.git`, // git+ 前缀 + .git 后缀
    `github:${FULL_NAME}`, // npm 简写
  ]) {
    assert.equal(normalizeNpmRepository(repository), FULL_NAME, JSON.stringify(repository));
  }
});

test("normalizeNpmRepository lowercases owner and repo", () => {
  assert.equal(
    normalizeNpmRepository("https://github.com/Example/DSH-Widget.git"),
    FULL_NAME,
  );
});

test("normalizeNpmRepository rejects non-GitHub and unparseable values", () => {
  for (const repository of [
    "https://gitlab.com/example/dsh-widget", // 非 GitHub
    "git@gitlab.com:example/dsh-widget", // 非 GitHub scp
    "not a url at all",
    "https://github.com/only-owner",
    "https://github.com/example/dsh-widget/tree/main", // 多余的页面路径
    "",
    null,
    undefined,
    42,
    {},
    { url: null },
  ]) {
    assert.equal(normalizeNpmRepository(repository), null, JSON.stringify(repository));
  }
});

test("npmRepoBacklink compares case-insensitively against the GitHub full name", () => {
  assert.equal(npmRepoBacklink(FULL_NAME, `git@github.com:${FULL_NAME}.git`), true);
  assert.equal(
    npmRepoBacklink("Example/DSH-Widget", "https://github.com/example/dsh-widget"),
    true,
  );
  assert.equal(npmRepoBacklink(FULL_NAME, "https://github.com/example/other-repo"), false);
  assert.equal(npmRepoBacklink(FULL_NAME, "https://gitlab.com/example/dsh-widget"), false);
  assert.equal(npmRepoBacklink(FULL_NAME, null), false);
  assert.equal(npmRepoBacklink(FULL_NAME, undefined), false);
});

// ---------- catalogSubdirectory / npmRepoSubdirectory ----------

test("catalogSubdirectory 镜像桌面端 normalizeSubdirectory：合规原样返回", () => {
  for (const value of ["packages/x", "plugins/dsh-widget", "a/b/c", "with space/x"]) {
    assert.equal(catalogSubdirectory(value), value, value);
  }
});

test("catalogSubdirectory 拒掉桌面端会整页拒收的值", () => {
  for (const value of [
    "", // minLength 1
    "/packages/x", // 绝对路径
    "packages/x/", // 尾斜杠
    "./packages/x", // dot 段
    "packages/../x", // parent 段
    "packages//x", // 空段
    "packages\\x", // 反斜杠
    "packages/100%", // 段内非法百分号编码（decodeURIComponent 抛）
    "packages%2Fx", // 解码出路径分隔符
    "%2E%2E/x", // 解码出 dot 段
    "p".repeat(241), // wire schema maxLength 240
    42,
    null,
    undefined,
  ]) {
    assert.equal(catalogSubdirectory(value), null, String(value));
  }
});

test("npmRepoSubdirectory 只认 repository 对象形态的 directory", () => {
  assert.equal(
    npmRepoSubdirectory({ repository: { url: "https://github.com/o/r", directory: "packages/x" } }),
    "packages/x",
  );
  assert.equal(npmRepoSubdirectory({ repository: "https://github.com/o/r" }), null);
  assert.equal(npmRepoSubdirectory({ repository: { url: "https://github.com/o/r" } }), null);
  assert.equal(npmRepoSubdirectory(null), null);
});

// ---------- desktopPreviewVerdict ----------

const VALID_INTEGRITY = `sha512-${Buffer.alloc(64, 1).toString("base64")}`;

/** 一份能通过桌面端全部复核的版本文档；各用例在此基础上做单一破坏。 */
function desktopDoc(overrides = {}) {
  return {
    name: PKG_NAME,
    version: VERSION,
    repository: `https://github.com/${FULL_NAME}`,
    dsh: { bundle: { patch: "cordis.patch.yml" } },
    dependencies: { "@deepseek-ai/cordis": "^4.0.0" },
    engines: { node: ">=20" },
    dist: {
      integrity: VALID_INTEGRITY,
      tarball: `https://registry.npmjs.org/${PKG_NAME}/-/${PKG_NAME}-${VERSION}.tgz`,
    },
    ...overrides,
  };
}

function verdictReasons(doc, fullName = FULL_NAME) {
  return desktopPreviewVerdict(doc, fullName).reasons;
}

test("desktopPreviewVerdict passes a fully compliant manifest", () => {
  assert.deepEqual(desktopPreviewVerdict(desktopDoc(), FULL_NAME), { ok: true, reasons: [] });
});

test("desktopPreviewVerdict rejects missing identity fields and deprecated packages", () => {
  for (const [doc, reason] of [
    [desktopDoc({ name: undefined }), "bad-name"],
    [desktopDoc({ version: undefined }), "bad-version"],
    [desktopDoc({ deprecated: "use something else" }), "deprecated"],
  ]) {
    const v = desktopPreviewVerdict(doc, FULL_NAME);
    assert.equal(v.ok, false, reason);
    assert.ok(v.reasons.includes(reason), JSON.stringify(v.reasons));
  }
  assert.deepEqual(desktopPreviewVerdict(null, FULL_NAME), {
    ok: false,
    reasons: ["no-version-doc"],
  });
});

test("desktopPreviewVerdict rejects install lifecycle scripts", () => {
  for (const script of ["preinstall", "install", "postinstall", "prepare"]) {
    const v = desktopPreviewVerdict(desktopDoc({ scripts: { [script]: "echo hi" } }), FULL_NAME);
    assert.equal(v.ok, false, script);
    assert.ok(v.reasons.includes("lifecycle-scripts"), script);
  }
  // 普通脚本（build/test）与非法 scripts 形状的区别：前者放行，后者桌面端同样拒
  assert.equal(desktopPreviewVerdict(desktopDoc({ scripts: { build: "tsc" } }), FULL_NAME).ok, true);
  assert.ok(verdictReasons(desktopDoc({ scripts: "oops" })).includes("lifecycle-scripts"));
});

test("desktopPreviewVerdict enforces the repository rules", () => {
  // scp git@ 形式：目录侧回链能认，但桌面端要求剥 git+ 后必须 https://
  assert.ok(
    verdictReasons(desktopDoc({ repository: `git@github.com:${FULL_NAME}` })).includes(
      "repo-not-https",
    ),
  );
  // ssh/git 协议同样不是 https
  assert.ok(
    verdictReasons(desktopDoc({ repository: `ssh://git@github.com/${FULL_NAME}.git` })).includes(
      "repo-not-https",
    ),
  );
  // git+ 前缀的 https 是允许的
  assert.equal(
    desktopPreviewVerdict(desktopDoc({ repository: `git+https://github.com/${FULL_NAME}.git` }), FULL_NAME)
      .ok,
    true,
  );
  // monorepo 子包：directory 能进契约的 subdirectory 就放行（目录会随 item 发出去）
  assert.equal(
    desktopPreviewVerdict(
      desktopDoc({ repository: { url: `https://github.com/${FULL_NAME}`, directory: "packages/x" } }),
      FULL_NAME,
    ).ok,
    true,
  );
  // 发不出去的 directory（桌面端 normalizeSubdirectory 会抛）仍然拒
  for (const directory of ["./packages/x", "packages/../x", "/packages/x", "packages%2Fx", 42]) {
    assert.ok(
      verdictReasons(
        desktopDoc({ repository: { url: `https://github.com/${FULL_NAME}`, directory } }),
      ).includes("repo-directory"),
      String(directory),
    );
  }
  // 指向别的仓库
  assert.ok(
    verdictReasons(desktopDoc({ repository: "https://github.com/example/other-repo" })).includes(
      "repo-mismatch",
    ),
  );
  // 缺 repository
  assert.ok(verdictReasons(desktopDoc({ repository: undefined })).includes("repo-not-https"));
});

test("desktopPreviewVerdict requires a safe dsh.bundle.patch", () => {
  // 允许 ./ 前缀
  assert.equal(
    desktopPreviewVerdict(desktopDoc({ dsh: { bundle: { patch: "./patches/cordis.patch.yml" } } }), FULL_NAME).ok,
    true,
  );
  for (const [dsh, reason] of [
    [undefined, "no-bundle-patch"],
    [{ bundle: { } }, "no-bundle-patch"],
    [{ bundle: "cordis.patch.yml" }, "no-bundle-patch"], // 旧形态：bundle 不是对象
    [{ bundle: { patch: "" } }, "unsafe-bundle-patch"],
    [{ bundle: { patch: "/etc/passwd" } }, "unsafe-bundle-patch"],
    [{ bundle: { patch: "../escape.yml" } }, "unsafe-bundle-patch"],
    [{ bundle: { patch: "a/./b.yml" } }, "unsafe-bundle-patch"],
    [{ bundle: { patch: "a//b.yml" } }, "unsafe-bundle-patch"],
    [{ bundle: { patch: "a\\b.yml" } }, "unsafe-bundle-patch"],
    [{ bundle: { patch: "a:b.yml" } }, "unsafe-bundle-patch"],
    [{ bundle: { patch: `x${"\0"}y` } }, "unsafe-bundle-patch"],
    [{ bundle: { patch: "x".repeat(513) } }, "unsafe-bundle-patch"],
  ]) {
    const v = desktopPreviewVerdict(desktopDoc({ dsh }), FULL_NAME);
    assert.equal(v.ok, false, `${reason}: ${JSON.stringify(dsh)}`);
    assert.ok(v.reasons.includes(reason), `${reason} not in ${JSON.stringify(v.reasons)}`);
  }
});

test("desktopPreviewVerdict enforces runtime compatibility", () => {
  // legacy cordis 出现在任意一种依赖里都直接拒
  for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
    const v = desktopPreviewVerdict(desktopDoc({ [field]: { cordis: "^3.0.0" } }), FULL_NAME);
    assert.ok(v.reasons.includes("legacy-cordis"), field);
  }
  // @deepseek-ai/cordis range 必须覆盖运行时 4.0.1
  assert.ok(
    verdictReasons(desktopDoc({ dependencies: { "@deepseek-ai/cordis": "^3.0.0" } })).includes(
      "runtime-range:@deepseek-ai/cordis",
    ),
  );
  // @deepseek-ai/dsh* range 必须覆盖运行时 0.1.0-rc.7（includePrerelease）
  assert.equal(
    desktopPreviewVerdict(
      desktopDoc({ dependencies: { "@deepseek-ai/dsh-plugin": "^0.1.0-rc.1" } }),
      FULL_NAME,
    ).ok,
    true,
  );
  assert.ok(
    verdictReasons(desktopDoc({ dependencies: { "@deepseek-ai/dsh": "^0.0.9" } })).includes(
      "runtime-range:@deepseek-ai/dsh",
    ),
  );
  // 非法 range 按不兼容处理
  assert.ok(
    verdictReasons(desktopDoc({ dependencies: { "@deepseek-ai/cordis": "not-a-range" } })).includes(
      "runtime-range:@deepseek-ai/cordis",
    ),
  );
  // 与桌面端运行时无关的依赖不检查
  assert.equal(
    desktopPreviewVerdict(desktopDoc({ dependencies: { lodash: "^4.17.21" } }), FULL_NAME).ok,
    true,
  );
  // 依赖字段形状非法
  assert.ok(verdictReasons(desktopDoc({ dependencies: "oops" })).includes("bad-deps:dependencies"));
});

test("desktopPreviewVerdict enforces engines.node and dist integrity", () => {
  assert.ok(
    verdictReasons(desktopDoc({ engines: { node: ">=30" } })).includes("engines-node"),
  );
  assert.ok(verdictReasons(desktopDoc({ engines: "oops" })).includes("engines-node"));
  // 未声明 engines 不拒
  assert.equal(desktopPreviewVerdict(desktopDoc({ engines: undefined }), FULL_NAME).ok, true);
  // dist 缺失 / integrity 非法 / tarball 非官方源
  assert.ok(verdictReasons(desktopDoc({ dist: undefined })).includes("bad-dist"));
  assert.ok(
    verdictReasons(desktopDoc({ dist: { ...desktopDoc().dist, integrity: "sha1-abc" } })).includes(
      "bad-dist",
    ),
  );
  assert.ok(
    verdictReasons(
      desktopDoc({ dist: { ...desktopDoc().dist, integrity: `sha512-${Buffer.alloc(32).toString("base64")}` } }),
    ).includes("bad-dist"),
  );
  assert.ok(
    verdictReasons(
      desktopDoc({
        dist: { ...desktopDoc().dist, tarball: "https://evil.example/pkg.tgz" },
      }),
    ).includes("bad-dist"),
  );
  assert.ok(
    verdictReasons(
      desktopDoc({
        dist: {
          ...desktopDoc().dist,
          tarball: `https://user:pass@registry.npmjs.org/${PKG_NAME}/-/x.tgz`,
        },
      }),
    ).includes("bad-dist"),
  );
  assert.ok(
    verdictReasons(
      desktopDoc({
        dist: { ...desktopDoc().dist, tarball: `https://registry.npmjs.org/${PKG_NAME}/-/x.tgz#frag` },
      }),
    ).includes("bad-dist"),
  );
});

// ---------- 取数结论：确认没有 vs 这轮说不准 ----------

test("fetchOutcome：只有 404/410 算确认不存在", () => {
  assert.equal(fetchOutcome({ ok: true, status: 200 }), "ok");
  assert.equal(fetchOutcome({ ok: false, status: 404 }), "absent");
  assert.equal(fetchOutcome({ ok: false, status: 410 }), "absent");
  // 下面这些一个都不能判成 absent：判错了就是把插件从桌面端市场里除名
  assert.equal(fetchOutcome({ ok: false, status: 429 }), "unknown");
  assert.equal(fetchOutcome({ ok: false, status: 403 }), "unknown");
  assert.equal(fetchOutcome({ ok: false, status: 500 }), "unknown");
  assert.equal(fetchOutcome({ ok: false, status: 502 }), "unknown");
  assert.equal(fetchOutcome(null), "unknown"); // 网络层重试完仍失败
});

test("retryableStatus：429 与 5xx 重试，其余 4xx 不重试", () => {
  assert.equal(retryableStatus(429), true);
  assert.equal(retryableStatus(500), true);
  assert.equal(retryableStatus(503), true);
  assert.equal(retryableStatus(404), false);
  assert.equal(retryableStatus(403), false);
  assert.equal(retryableStatus(200), false);
});

const PREV_MANIFEST = {
  pkgName: PKG_NAME,
  pkgVersion: VERSION,
  pkgPrivate: false,
  hasBundle: true,
  hasPrepare: false,
  entryNeedsBuild: true,
  entryCommitted: false,
  readmeCmd: `dsh plugin --profile web add ${PKG_NAME}`,
};

test("mergeManifestProbe：拿到了就用新事实", () => {
  const fresh = manifestFacts({ name: PKG_NAME, version: "2.0.0", dsh: { bundle: {} } });
  const merged = mergeManifestProbe({ outcome: "ok", facts: fresh, previous: PREV_MANIFEST });
  assert.equal(merged.complete, true);
  assert.equal(merged.facts.pkgVersion, "2.0.0");
});

test("mergeManifestProbe：404 是事实，该改成「不是插件」就改", () => {
  const merged = mergeManifestProbe({
    outcome: "absent",
    facts: manifestFacts(null),
    previous: PREV_MANIFEST,
  });
  assert.equal(merged.complete, true);
  assert.equal(merged.facts.hasBundle, false);
  assert.equal(merged.facts.pkgName, null);
});

test("mergeManifestProbe：限流时沿用上一轮，不把插件判成非插件", () => {
  const merged = mergeManifestProbe({
    outcome: "unknown",
    facts: manifestFacts(null), // 抓不到时 manifestFacts 只会给出空壳
    previous: PREV_MANIFEST,
  });
  assert.equal(merged.complete, false); // 不刷新探测时间，下轮重探
  assert.equal(merged.facts.hasBundle, true);
  assert.equal(merged.facts.pkgName, PKG_NAME);
  assert.equal(merged.facts.pkgVersion, VERSION);
});

test("mergeManifestProbe：首探就限流也不写死结论", () => {
  const merged = mergeManifestProbe({
    outcome: "unknown",
    facts: manifestFacts(null),
    previous: {}, // 库里什么都还没有
  });
  assert.equal(merged.complete, false);
  assert.equal(merged.facts.hasBundle, false);
  assert.equal(merged.facts.pkgName, null);
});

const PREV_NPM = {
  npmPublished: true,
  npmLatestVersion: VERSION,
  npmRepoBacklink: true,
  npmDesktopInstallable: true,
  npmRepoDirectory: "packages/x",
};

test("mergeNpmProbe：拿到了就用新结果，不带 keep", () => {
  const npm = { published: true, latestVersion: "2.0.0", repository: null, deprecated: false, latestDoc: {} };
  const merged = mergeNpmProbe({ outcome: "ok", npm, previous: PREV_NPM });
  assert.equal(merged.complete, true);
  assert.equal(merged.npm.latestVersion, "2.0.0");
  assert.equal(merged.npm.keep, undefined); // 调用方据此决定重算安装证据
});

test("mergeNpmProbe：包被 unpublish（404）是事实，该撤证据就撤", () => {
  const absent = { published: false, latestVersion: null, repository: null, deprecated: false, latestDoc: null };
  const merged = mergeNpmProbe({ outcome: "absent", npm: absent, previous: PREV_NPM });
  assert.equal(merged.complete, true);
  assert.equal(merged.npm.published, false);
  assert.equal(merged.npm.keep, undefined);
});

test("mergeNpmProbe：registry 限流时安装证据整组沿用上一轮", () => {
  const absent = { published: false, latestVersion: null, repository: null, deprecated: false, latestDoc: null };
  const merged = mergeNpmProbe({ outcome: "unknown", npm: absent, previous: PREV_NPM });
  assert.equal(merged.complete, false);
  assert.equal(merged.npm.published, true);
  // keep 是给桌面端的安装证据组：版本号、回链、可安装结论、子目录，一个都不能因为限流丢
  assert.deepEqual(merged.npm.keep, {
    npmLatestVersion: VERSION,
    npmRepoBacklink: true,
    npmDesktopInstallable: true,
    npmRepoDirectory: "packages/x",
  });
});

test("mergeNpmProbe：从没探过的仓库限流，keep 是全空而不是 true", () => {
  const absent = { published: false, latestVersion: null, repository: null, deprecated: false, latestDoc: null };
  const merged = mergeNpmProbe({ outcome: "unknown", npm: absent, previous: {} });
  assert.equal(merged.complete, false);
  assert.deepEqual(merged.npm.keep, {
    npmLatestVersion: null,
    npmRepoBacklink: false,
    npmDesktopInstallable: false,
    npmRepoDirectory: null,
  });
});

// ---------- monorepo 子包发现 ----------

test("workspaceGlobsFromManifest：数组与 {packages} 两种形态都认，否定项忽略", () => {
  assert.deepEqual(workspaceGlobsFromManifest({ workspaces: ["packages/*", "!packages/internal"] }), [
    "packages/*",
  ]);
  assert.deepEqual(workspaceGlobsFromManifest({ workspaces: { packages: ["apps/*"] } }), [
    "apps/*",
  ]);
  assert.deepEqual(workspaceGlobsFromManifest({}), []);
  assert.deepEqual(workspaceGlobsFromManifest(null), []);
});

test("workspaceGlobsFromPnpmYaml：列表形态", () => {
  const yaml = [
    "packages:",
    '  - "packages/*"',
    "  - apps/* # 应用",
    "  - '!packages/internal'",
    "",
    "catalog:",
    "  react: ^19",
  ].join("\n");
  assert.deepEqual(workspaceGlobsFromPnpmYaml(yaml), ["packages/*", "apps/*"]);
});

test("workspaceGlobsFromPnpmYaml：行内数组与没有 packages 键", () => {
  assert.deepEqual(workspaceGlobsFromPnpmYaml("packages: ['packages/*', \"apps/*\"]"), [
    "packages/*",
    "apps/*",
  ]);
  assert.deepEqual(workspaceGlobsFromPnpmYaml("catalog:\n  react: ^19"), []);
  assert.deepEqual(workspaceGlobsFromPnpmYaml(null), []);
});

test("expandableWorkspaceGlob：单层尾星与精确目录可展开，复杂 glob 拒绝", () => {
  assert.deepEqual(expandableWorkspaceGlob("packages/*"), { type: "star", dir: "packages" });
  assert.deepEqual(expandableWorkspaceGlob("./packages/foo/"), { type: "dir", dir: "packages/foo" });
  assert.equal(expandableWorkspaceGlob("packages/**"), null);
  assert.equal(expandableWorkspaceGlob("packages/*/sub"), null);
  assert.equal(expandableWorkspaceGlob("../escape"), null);
  assert.equal(expandableWorkspaceGlob("/abs/*"), null);
  assert.equal(expandableWorkspaceGlob(""), null);
});

test("pickBundleSubpackage：只认带 dsh.bundle 的子包", () => {
  const candidates = [
    { path: "packages/app", pkg: { name: "app", private: true } },
    { path: "packages/docs", pkg: { name: "docs" } },
  ];
  assert.equal(pickBundleSubpackage(candidates, "example/repo"), null);
});

test("pickBundleSubpackage：优先非 private，再优先包名沾仓库名，结果稳定", () => {
  // orbis 实景：装配包在 packages/orbis-remote-dsh，根仓库名 orbis
  const candidates = [
    { path: "packages/tools", pkg: { name: "@example/tools", private: true, dsh: { bundle: {} } } },
    { path: "packages/orbis-remote-dsh", pkg: { name: "@orbisapp/remote-dsh", dsh: { bundle: {} } } },
    { path: "packages/z-other", pkg: { name: "z-other", dsh: { bundle: {} } } },
  ];
  const winner = pickBundleSubpackage(candidates, "icodesign/orbis");
  assert.equal(winner.path, "packages/orbis-remote-dsh");
  // 顺序打乱后结果不变
  const shuffled = pickBundleSubpackage([...candidates].reverse(), "icodesign/orbis");
  assert.equal(shuffled.path, "packages/orbis-remote-dsh");
});
