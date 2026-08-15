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

// ---------- 条件请求与限流退避 ----------

/** 造一个最小的 Response 替身，只实现 fetchRelease 会用到的部分。 */
function fakeRes({ status = 200, headers = {}, body = "[]" }) {
  const h = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (k) => h.get(k.toLowerCase()) ?? null },
    body: {
      getReader() {
        let sent = false;
        return {
          read: async () =>
            sent ? { done: true } : ((sent = true), { done: false, value: new TextEncoder().encode(body) }),
          cancel: async () => {},
        };
      },
    },
  };
}

test("sends If-None-Match when a previous ETag exists", async () => {
  let seen = null;
  await fetchRelease({
    fullName: "example/dsh-widget",
    manifest,
    etag: '"abc123"',
    warn: () => {},
    fetchImpl: async (_url, init) => {
      seen = init.headers["If-None-Match"];
      return fakeRes({ status: 304 });
    },
  });
  assert.equal(seen, '"abc123"');
});

test("304 is a complete probe that keeps the previous facts untouched", async () => {
  const release = await fetchRelease({
    fullName: "example/dsh-widget",
    manifest,
    etag: '"abc123"',
    warn: () => {},
    fetchImpl: async () => fakeRes({ status: 304 }),
  });
  assert.equal(release.complete, true);
  assert.equal(release.unchanged, true);

  const merged = mergeReleaseProbe({ manifest, npmPublished: false, release, previousRelease });
  assert.equal(merged.facts.releaseTgzUrl, previousRelease.releaseTgzUrl);
  // 304 说明 release 确实没变，算一次成功探测，应当推进时间戳
  assert.equal(probeTimestamp({ rederive: false, complete: merged.complete, previous: "old", now: "new" }), "new");
});

test("stores the response ETag on a complete probe", async () => {
  const release = await fetchRelease({
    fullName: "example/dsh-widget",
    manifest,
    warn: () => {},
    fetchImpl: async () => fakeRes({ headers: { etag: '"fresh"' }, body: "[]" }),
  });
  assert.equal(release.facts.releaseEtag, '"fresh"');
});

test("backs off and retries on rate limiting, then succeeds", async () => {
  const waits = [];
  let calls = 0;
  const release = await fetchRelease({
    fullName: "example/dsh-widget",
    manifest,
    warn: () => {},
    sleep: async (ms) => waits.push(ms),
    fetchImpl: async () => {
      calls++;
      return calls === 1
        ? fakeRes({ status: 403, headers: { "retry-after": "2", "x-ratelimit-remaining": "4900" } })
        : fakeRes({ headers: { etag: '"after-retry"' }, body: "[]" });
    },
  });
  assert.equal(calls, 2);
  assert.deepEqual(waits, [2000]);
  assert.equal(release.complete, true);
  assert.equal(release.facts.releaseEtag, '"after-retry"');
});

test("a plain 403 without rate-limit signals is not retried", async () => {
  let calls = 0;
  const release = await fetchRelease({
    fullName: "example/dsh-widget",
    manifest,
    warn: () => {},
    sleep: async () => {},
    fetchImpl: async () => {
      calls++;
      return fakeRes({ status: 403, headers: { "x-ratelimit-remaining": "4900" } });
    },
  });
  assert.equal(calls, 1);
  assert.equal(release.complete, false);
});

test("gives up after MAX_RETRIES and preserves previous facts", async () => {
  let calls = 0;
  const release = await fetchRelease({
    fullName: "example/dsh-widget",
    manifest,
    warn: () => {},
    sleep: async () => {},
    fetchImpl: async () => {
      calls++;
      return fakeRes({ status: 429, headers: { "retry-after": "1" } });
    },
  });
  assert.equal(calls, 5); // 首次 + 4 次重试
  assert.equal(release.complete, false);
  const merged = mergeReleaseProbe({ manifest, npmPublished: false, release, previousRelease });
  assert.equal(merged.facts.releaseTgzUrl, previousRelease.releaseTgzUrl);
});
