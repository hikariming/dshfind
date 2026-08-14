import assert from "node:assert/strict";
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

test("prefers a safe release tarball over npm and build-required fallbacks", () => {
  const selected = releaseFacts();
  assert.deepEqual(
    deriveInstall(installFacts({ ...selected, npmPublished: true })),
    {
      kind: "release",
      reason: null,
      cmd: "dsh plugin --profile web add https://github.com/example/dsh-widget/releases/download/v1.2.3/dsh-widget-1.2.3.tgz",
      profile: "web",
    },
  );
});

test("revalidates stored release metadata before generating a command", () => {
  const selected = releaseFacts();
  assert.equal(
    deriveInstall(
      installFacts({
        ...selected,
        releaseTgzUrl:
          "https://evil.example/example/dsh-widget/releases/download/v1.2.3/dsh-widget-1.2.3.tgz",
        npmPublished: true,
      }),
    ).kind,
    "npm",
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
