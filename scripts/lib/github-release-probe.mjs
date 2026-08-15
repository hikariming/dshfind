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
    releaseEtag: null,
  };
}

/** 撞限流时最多退避重试这么多次。 */
const MAX_RETRIES = 4;

/**
 * 是不是限流：429，或 403 且配额确实归零。
 * 普通 403（仓库私有/被封）不该重试，配额没归零的 403 属于次级限流，也要退避。
 */
function rateLimited(res) {
  if (res.status === 429) return true;
  if (res.status !== 403) return false;
  const remaining = res.headers.get("x-ratelimit-remaining");
  // 次级限流（并发过高触发）主配额还剩很多，靠 retry-after 认
  return remaining === "0" || res.headers.get("retry-after") != null;
}

/** 退避多久：优先 retry-after，其次 x-ratelimit-reset，都没有就退指数。 */
function backoffMs(res, attempt) {
  const retryAfter = Number(res.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 120_000);
  }
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) {
    return Math.min(Math.max(reset * 1000 - Date.now() + 1000, 1000), 120_000);
  }
  return Math.min(1000 * 2 ** attempt, 60_000);
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
 * 最多一次 API 请求（撞限流时退避重试），最多 MAX_RELEASES 条，
 * 且不下载或解包任何资产。
 *
 * 带上次的 ETag 发条件请求：release 没变时 GitHub 回 304，**完全不计配额**。
 * 全库 1491 个够格仓库里绝大多数每周都没新 release，所以重探基本是白嫖。
 *
 * complete=false 表示 API 不可用：调用方应保留上次成功事实并尽快重试。
 * unchanged=true 表示 304：调用方应原样保留上次事实（含 ETag）。
 */
export async function fetchRelease({
  fullName,
  manifest,
  token,
  etag = null,
  fetchImpl = fetch,
  warn = console.warn,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
  if (!manifest.pkgName || !manifest.pkgVersion || !manifest.hasBundle) {
    return { complete: true, unchanged: false, facts: noRelease() };
  }
  // fullName 来自库里，拼进请求 URL 之前先校验一次。selectReleaseTarball 也会校验，
  // 但那是拿到响应之后——带着 token 的请求不该先发出去再说。
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(fullName))) {
    warn(`  ⚠️ ${fullName} 不是合法的 owner/repo，跳过 release 探测`);
    return { complete: true, unchanged: false, facts: noRelease() };
  }

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(etag ? { "If-None-Match": etag } : {}),
  };
  const url = `https://api.github.com/repos/${fullName}/releases?per_page=${MAX_RELEASES}`;

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchImpl(url, { headers });

      if (rateLimited(res)) {
        if (attempt >= MAX_RETRIES) {
          warn(`  ⚠️ ${fullName} 限流重试 ${MAX_RETRIES} 次仍失败，保留上次事实`);
          return { complete: false, unchanged: false, facts: noRelease() };
        }
        const wait = backoffMs(res, attempt);
        warn(`  ⏳ ${fullName} 触发限流，等待 ${Math.ceil(wait / 1000)}s 重试（第 ${attempt + 1} 次）`);
        await sleep(wait);
        continue;
      }

      // 304：release 列表没变，上次的事实继续有效，且这次不计配额
      if (res.status === 304) {
        return { complete: true, unchanged: true, facts: null };
      }

      const remainingHeader = res.headers.get("x-ratelimit-remaining");
      const remaining = remainingHeader == null ? null : Number(remainingHeader);
      if (remaining != null && Number.isFinite(remaining) && remaining < 100) {
        warn(`  ⚠️ GitHub API 剩余 ${remaining} 次`);
      }
      if (!res.ok) {
        warn(`  ⚠️ ${fullName} releases API ${res.status}，保留上次事实`);
        return { complete: false, unchanged: false, facts: noRelease() };
      }

      const releases = await boundedJson(res, RELEASE_RESPONSE_MAX_BYTES);
      if (!Array.isArray(releases)) throw new Error("releases response is not an array");
      const selected = selectReleaseTarball({ fullName, ...manifest, releases });
      return {
        complete: true,
        unchanged: false,
        // 只有确定拿到完整响应才存 ETag，否则下次会拿一个不对应的 304
        facts: { ...(selected ?? noRelease()), releaseEtag: res.headers.get("etag") },
      };
    } catch (err) {
      warn(`  ⚠️ ${fullName} release 探测失败：${String(err?.message ?? err)}`);
      return { complete: false, unchanged: false, facts: noRelease() };
    }
  }
}

/**
 * API 失败或 304 都保留旧 release 事实；只有拿到完整响应才替换。
 * 304 视为一次成功探测（complete=true）——release 确实没变，该刷新探测时间。
 */
export function mergeReleaseProbe({ manifest, npmPublished, release, previousRelease }) {
  const keepPrevious = !release.complete || release.unchanged;
  return {
    facts: {
      ...manifest,
      npmPublished,
      ...(keepPrevious ? previousRelease : release.facts),
    },
    complete: release.complete,
  };
}

/** 失败不刷新时间，保证下轮仍会立即重试；rederive 永远不冒充网络探测。 */
export function probeTimestamp({ rederive, complete, previous, now }) {
  return rederive || !complete ? previous : now;
}
