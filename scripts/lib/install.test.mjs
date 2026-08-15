import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  MAX_RELEASE_ASSET_BYTES,
  deriveInstall,
  manifestFacts,
  selectReleaseTarball,
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

test("probe preserves an intentional curated pin even if it equals an earlier automatic command", async () => {
  // String equality cannot establish provenance: an operator may deliberately keep that exact pin.
  // Guard the write statement itself so probing may refresh install_cmd_auto but never install_cmd.
  const source = await readFile(new URL("../probe-install.mjs", import.meta.url), "utf8");
  const update = source.match(/sql: `UPDATE plugins SET([\s\S]*?)WHERE full_name = \?`/);
  assert.ok(update, "probe UPDATE statement not found");
  assert.doesNotMatch(update[1], /(?:^|[,\s])install_cmd\s*=/m);
  assert.match(update[1], /(?:^|[,\s])install_cmd_auto\s*=/m);
});
