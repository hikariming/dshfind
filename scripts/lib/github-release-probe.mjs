import {
  MAX_RELEASES,
  selectReleaseTarball,
} from "./install.mjs";

export const RELEASE_RESPONSE_MAX_BYTES = 1_500_000;

export function noRelease() {
  return {
    releaseTgzUrl: null,
    releaseTag: null,
    releasePrerelease: false,
    releaseAssetName: null,
    releaseAssetSize: null,
    releaseAssetDigest: null,
  };
}

/** 读取有限 JSON；GitHub release body / assets 异常大时直接回退。 */
async function boundedJson(res, maxBytes) {
  const declaredHeader = res.headers.get("content-length");
  const declared = declaredHeader == null ? null : Number(declaredHeader);
  if (declared != null && Number.isFinite(declared) && declared > maxBytes) {
    throw new Error(`response too large (${declared} bytes)`);
  }
  if (!res.body) throw new Error("empty response body");

  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`response exceeded ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * 最多一次 API 请求、最多 MAX_RELEASES 条，且不下载或解包任何资产。
 * complete=false 表示 API 不可用：调用方应保留上次成功事实并尽快重试。
 */
export async function fetchRelease({
  fullName,
  manifest,
  token,
  fetchImpl = fetch,
  warn = console.warn,
}) {
  if (!manifest.pkgName || !manifest.pkgVersion || !manifest.hasBundle) {
    return { complete: true, facts: noRelease() };
  }
  // fullName 来自库里，拼进请求 URL 之前先校验一次。selectReleaseTarball 也会校验，
  // 但那是拿到响应之后——带着 token 的请求不该先发出去再说。
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(fullName))) {
    warn(`  ⚠️ ${fullName} 不是合法的 owner/repo，跳过 release 探测`);
    return { complete: true, facts: noRelease() };
  }
  try {
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetchImpl(
      `https://api.github.com/repos/${fullName}/releases?per_page=${MAX_RELEASES}`,
      { headers },
    );
    const remainingHeader = res.headers.get("x-ratelimit-remaining");
    const remaining = remainingHeader == null ? null : Number(remainingHeader);
    if (remaining != null && Number.isFinite(remaining) && remaining < 100) {
      warn(`  ⚠️ GitHub API 剩余 ${remaining} 次`);
    }
    if (!res.ok) {
      warn(`  ⚠️ ${fullName} releases API ${res.status}，保留上次事实`);
      return { complete: false, facts: noRelease() };
    }
    const releases = await boundedJson(res, RELEASE_RESPONSE_MAX_BYTES);
    if (!Array.isArray(releases)) throw new Error("releases response is not an array");
    const selected = selectReleaseTarball({ fullName, ...manifest, releases });
    return { complete: true, facts: selected ?? noRelease() };
  } catch (err) {
    warn(`  ⚠️ ${fullName} release 探测失败：${String(err?.message ?? err)}`);
    return { complete: false, facts: noRelease() };
  }
}

/** API 失败保留旧 release 事实；成功（含“没有匹配资产”）才替换。 */
export function mergeReleaseProbe({ manifest, npmPublished, release, previousRelease }) {
  return {
    facts: {
      ...manifest,
      npmPublished,
      ...(release.complete ? release.facts : previousRelease),
    },
    complete: release.complete,
  };
}

/** 失败不刷新时间，保证下轮仍会立即重试；rederive 永远不冒充网络探测。 */
export function probeTimestamp({ rederive, complete, previous, now }) {
  return rederive || !complete ? previous : now;
}
