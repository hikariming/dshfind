import assert from "node:assert/strict";
import test from "node:test";

import {
  RELEASE_RESPONSE_MAX_BYTES,
  fetchRelease,
  mergeReleaseProbe,
  noRelease,
  probeTimestamp,
} from "./github-release-probe.mjs";

const manifest = {
  pkgName: "dsh-widget",
  pkgVersion: "1.2.3",
  pkgPrivate: false,
  hasBundle: true,
  hasPrepare: false,
  entryNeedsBuild: true,
};

const previousRelease = {
  releaseTgzUrl:
    "https://github.com/example/dsh-widget/releases/download/v1.2.2/dsh-widget-1.2.2.tgz",
  releaseTag: "v1.2.2",
  releasePrerelease: false,
  releaseAssetName: "dsh-widget-1.2.2.tgz",
  releaseAssetSize: 1_024,
  releaseAssetDigest: null,
};

test("HTTP errors are incomplete probes, not evidence that no release exists", async () => {
  const warnings = [];
  const result = await fetchRelease({
    fullName: "example/dsh-widget",
    manifest,
    token: "test-token",
    fetchImpl: async () => new Response("rate limited", { status: 403 }),
    warn: (message) => warnings.push(message),
  });
  assert.equal(result.complete, false);
  assert.deepEqual(result.facts, noRelease());
  assert.equal(warnings.length, 1);
});

test("network errors and oversized metadata are incomplete probes", async () => {
  for (const fetchImpl of [
    async () => {
      throw new Error("offline");
    },
    async () =>
      new Response("[]", {
        status: 200,
        headers: { "content-length": String(RELEASE_RESPONSE_MAX_BYTES + 1) },
      }),
  ]) {
    const result = await fetchRelease({
      fullName: "example/dsh-widget",
      manifest,
      token: null,
      fetchImpl,
      warn: () => {},
    });
    assert.equal(result.complete, false);
  }
});

test("an incomplete probe preserves the previous release facts", () => {
  const merged = mergeReleaseProbe({
    manifest,
    npmPublished: true,
    release: { complete: false, facts: noRelease() },
    previousRelease,
  });
  assert.equal(merged.complete, false);
  assert.deepEqual(merged.facts, {
    ...manifest,
    npmPublished: true,
    ...previousRelease,
  });
});

test("only a complete network probe advances the probe timestamp", () => {
  const input = { previous: "2026-08-01T00:00:00.000Z", now: "2026-08-15T00:00:00.000Z" };
  assert.equal(probeTimestamp({ ...input, rederive: false, complete: true }), input.now);
  assert.equal(probeTimestamp({ ...input, rederive: false, complete: false }), input.previous);
  assert.equal(probeTimestamp({ ...input, rederive: true, complete: true }), input.previous);
});
