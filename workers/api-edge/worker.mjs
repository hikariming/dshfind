/**
 * API 边缘 Worker：在 api.dshfind.com/v1/plugins* 路由上接管纯分页的
 * 列表请求（占全站流量 80%），其余请求原样透传 Railway 上的 Go 服务。
 * 方案见 docs/d1-migration-plan.md P4。
 *
 * 数据是 scripts/gen-api-artifacts.mjs 预渲染的 NDJSON 产物（每行一个
 * 条目的 JSON 字节，已与 Go 的 encoding/json 输出逐字节对齐——验证方式：
 * data_version 与 Go 完全相等）。Worker 只做字节拼接，从不 JSON.parse
 * 目录本体：13MB 产物以 Uint8Array + 行偏移索引驻留 isolate，堆内存
 * ~13MB 而不是解析成对象的 30-50MB，CPU 每请求 ~1ms。
 *
 * 行为契约逐项复刻 server/internal/httpapi/plugins.go：
 *   - 桌面 UA（dsh-community-market/0.1）→ 首屏 200 条子集，其余 → 完整目录
 *   - data_version 不符 → 409 stale_data（换代时桌面端自动从第 1 页重同步）
 *   - 强 ETag（sha256）+ If-None-Match 304；Vary: User-Agent；CORS *
 *   - 带过滤/排序参数（category/q/sort/...）的请求不在此实现，透传 Go
 */

const DESKTOP_UA = "dsh-community-market/0.1";
/** 只有这三个参数的请求才吃产物；出现其它非空参数（过滤/排序）→ 透传 Go。 */
const ALLOWED_PARAMS = new Set(["page", "per_page", "data_version"]);
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;
const MAX_PAGE = 1 << 30;
/** 与 Go publicDataCacheControl 一致。 */
const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";
const INT64_MAX = 9223372036854775807n;

const encoder = new TextEncoder();

/** isolate 级缓存：产物随部署不可变，加载一次用到 isolate 回收。 */
let catalogPromise = null;

async function fetchAsset(env, name) {
  const res = await env.ASSETS.fetch(`https://assets.local/${name}`);
  if (!res.ok) throw new Error(`asset ${name}: HTTP ${res.status}`);
  return res;
}

/** NDJSON → 原始字节 + 每行的 [start, end) 偏移。 */
async function loadAudience(env, name) {
  const buf = new Uint8Array(await (await fetchAsset(env, name)).arrayBuffer());
  const offsets = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 10) {
      if (i > start) offsets.push([start, i]);
      start = i + 1;
    }
  }
  if (start < buf.length) offsets.push([start, buf.length]);
  return { buf, offsets };
}

function getCatalog(env) {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const meta = await (await fetchAsset(env, "meta.json")).json();
      const [full, desktop] = await Promise.all([
        loadAudience(env, "catalog-full.ndjson"),
        loadAudience(env, "catalog-desktop.ndjson"),
      ]);
      return { meta, full, desktop };
    })().catch((err) => {
      catalogPromise = null; // 失败不缓存，下个请求重试
      throw err;
    });
  }
  return catalogPromise;
}

/** 复刻 Go parseIntOr：strconv.Atoi 语义（可带符号的十进制，溢出 int64 视为无效）。 */
function parseIntOr(v, def) {
  if (v === null || v === "" || !/^[+-]?\d+$/.test(v)) return def;
  try {
    const n = BigInt(v);
    if (n > INT64_MAX || n < -INT64_MAX - 1n) return def;
    return Number(n); // 后续立刻 clamp 到 [1, 2^30]，2^53 以上的精度损失不影响结果
  } catch {
    return def;
  }
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

async function strongETag(body) {
  const sum = await crypto.subtle.digest("SHA-256", body);
  const hex = Array.from(new Uint8Array(sum), (b) => b.toString(16).padStart(2, "0")).join("");
  return `"${hex}"`;
}

/** 复刻 Go etagMatches：逗号分隔、容忍 W/ 前缀与 *。 */
function etagMatches(header, etag) {
  if (!header) return false;
  return header.split(",").some((c) => {
    const t = c.trim();
    return t === "*" || (t.startsWith("W/") ? t.slice(2) : t) === etag;
  });
}

/** 拼一页响应：{"data":[<原始条目字节>,...],"page":...}。条目零解析零转义。 */
function buildBody(aud, meta, page, perPage) {
  const total = aud.offsets.length;
  const totalPages = Math.ceil(total / perPage);
  let startIdx = (page - 1) * perPage;
  if (startIdx > total) startIdx = total;
  const endIdx = Math.min(startIdx + perPage, total);

  const head = encoder.encode('{"data":[');
  const tail = encoder.encode(
    `],"page":${page},"per_page":${perPage},"total":${total},"total_pages":${totalPages},` +
      `"data_version":"${meta.data_version}","as_of":"${meta.as_of}","generated_at":"${meta.as_of}"}`,
  );
  let size = head.length + tail.length;
  for (let i = startIdx; i < endIdx; i++) {
    size += aud.offsets[i][1] - aud.offsets[i][0] + (i > startIdx ? 1 : 0);
  }
  const out = new Uint8Array(size);
  out.set(head, 0);
  let pos = head.length;
  for (let i = startIdx; i < endIdx; i++) {
    if (i > startIdx) out[pos++] = 44; // ","
    const [s, e] = aud.offsets[i];
    out.set(aud.buf.subarray(s, e), pos);
    pos += e - s;
  }
  out.set(tail, pos);
  return out;
}

function baseHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    Vary: "User-Agent",
  };
}

/** 复刻 writeError 的 {"error":{code,message}}（json.NewEncoder 会带末尾换行）。 */
function staleDataResponse() {
  const body =
    JSON.stringify({
      error: { code: "stale_data", message: "data version changed; restart pagination from page 1" },
    }) + "\n";
  return new Response(body, {
    status: 409,
    headers: { ...baseHeaders(), "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * 透传 Railway 源站。生产环境同 zone 的子请求会绕过 Worker 路由直达源站，
 * 不会重入自身；PASSTHROUGH_ORIGIN 是本地开发与应急用的显式源站覆盖。
 */
function passthrough(request, env) {
  if (env.PASSTHROUGH_ORIGIN) {
    const url = new URL(request.url);
    const target = new URL(env.PASSTHROUGH_ORIGIN);
    url.protocol = target.protocol;
    url.host = target.host;
    return fetch(new Request(url, request));
  }
  return fetch(request);
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/v1/plugins") return passthrough(request, env);
    if (request.method !== "GET" && request.method !== "HEAD") return passthrough(request, env);
    for (const [k, v] of url.searchParams) {
      // 空值参数在 Go 侧等价于未传，不影响结果，无需为它回源。
      if (!ALLOWED_PARAMS.has(k) && v !== "") return passthrough(request, env);
    }

    let catalog;
    try {
      catalog = await getCatalog(env);
    } catch {
      return passthrough(request, env); // 产物缺失时退回 Go，不给调用方吃 500
    }

    const requested = url.searchParams.get("data_version");
    if (requested && requested !== catalog.meta.data_version) return staleDataResponse();

    const aud = request.headers.get("User-Agent") === DESKTOP_UA ? catalog.desktop : catalog.full;
    const page = clamp(parseIntOr(url.searchParams.get("page"), 1), 1, MAX_PAGE);
    const perPage = clamp(
      parseIntOr(url.searchParams.get("per_page"), DEFAULT_PER_PAGE),
      1,
      MAX_PER_PAGE,
    );

    const body = buildBody(aud, catalog.meta, page, perPage);
    const etag = await strongETag(body);
    const headers = {
      ...baseHeaders(),
      "Cache-Control": CACHE_CONTROL,
      ETag: etag,
    };
    if (etagMatches(request.headers.get("If-None-Match"), etag)) {
      return new Response(null, { status: 304, headers });
    }
    headers["Content-Type"] = "application/json; charset=utf-8";
    return new Response(request.method === "HEAD" ? null : body, { status: 200, headers });
  },
};

export default worker;
