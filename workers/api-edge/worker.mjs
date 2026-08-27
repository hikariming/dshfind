/**
 * API 边缘 Worker：在 api.dshfind.com 上接管两条读路径——
 *   /v1/plugins*   纯分页的目录列表（切流前占全站流量 80%）
 *   /market/*      桌面端插件市场的「标准目录源」契约
 * 其余请求原样透传 Railway 上的 Go 服务。方案见 docs/d1-migration-plan.md P4。
 *
 * 数据是 scripts/gen-api-artifacts.mjs 预渲染的 NDJSON 产物（每行一个
 * 条目的 JSON 字节，已与 Go 的 encoding/json 输出逐字节对齐——验证方式：
 * data_version 与 Go 完全相等）。Worker 只做字节拼接，从不 JSON.parse
 * 目录本体：13MB 产物以 Uint8Array + 行偏移索引驻留 isolate，堆内存
 * ~13MB 而不是解析成对象的 30-50MB，CPU 每请求 ~1ms。
 *
 * 行为契约逐项复刻 server/internal/httpapi/：
 *   plugins.go —— 桌面 UA（dsh-community-market/0.1）→ 首屏 200 条子集，
 *     其余 → 完整目录；data_version 不符 → 409 stale_data（换代时桌面端
 *     自动从第 1 页重同步）；Vary: User-Agent；带过滤/排序参数的请求透传 Go
 *   market.go —— limit/cursor/q/category 全部在边缘实现（Go 对未知参数是
 *     忽略而非报错，因此这条路径不需要透传兜底）；游标绑定快照版本，
 *     版本不符 409、游标本身非法 400；**无 Vary**（响应与 UA 无关）
 * 两条路径都是强 ETag（sha256）+ If-None-Match 304、CORS *。
 */

const DESKTOP_UA = "dsh-community-market/0.1";
/** 只有这三个参数的请求才吃产物；出现其它非空参数（过滤/排序）→ 透传 Go。 */
const ALLOWED_PARAMS = new Set(["page", "per_page", "data_version"]);
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;
const MAX_PAGE = 1 << 30;
const MARKET_DEFAULT_LIMIT = 50;
const MARKET_MAX_LIMIT = 100;
/** 与 Go publicDataCacheControl 一致。 */
const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";
/** 与 Go publicSchemaCacheControl 一致（manifest 内容恒定）。 */
const SCHEMA_CACHE_CONTROL = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";
const INT64_MAX = 9223372036854775807n;

/**
 * server/internal/httpapi/market.go 的 marketManifestJSON 原样搬运，
 * 含结尾换行（Go 那边是反引号字符串，最后一行 `}` 后面有个换行）。
 * 改这里必须同步改 Go，否则两边 ETag 不同。
 */
const MARKET_MANIFEST = `{
  "manifestVersion": "1.0.0",
  "providerId": "com.dshfind.catalog",
  "name": "dshfind Plugin Catalog",
  "description": "Community catalog of DeepSeek Harness plugins indexed by dshfind.",
  "homepage": "https://dshfind.com",
  "attribution": { "name": "dshfind", "url": "https://dshfind.com" },
  "transport": { "kind": "https-json", "endpoint": "https://api.dshfind.com/market/v1/plugins", "method": "GET" },
  "query": { "supported": ["q", "category", "cursor", "limit"], "defaultLimit": 50, "maxLimit": 100, "sorts": [] }
}
`;

const encoder = new TextEncoder();

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

/**
 * isolate 级缓存：产物随部署不可变，加载一次用到 isolate 回收。失败不缓存，
 * 下个请求重试。分成四个独立入口是为了让每条路径只付自己那份内存与 I/O——
 * 只服务 /v1/plugins 的 isolate 不会去拉 market 产物，反之亦然。
 */
function cached(load) {
  let promise = null;
  return (env) => {
    if (!promise) {
      promise = load(env).catch((err) => {
        promise = null;
        throw err;
      });
    }
    return promise;
  };
}

const getMeta = cached(async (env) => (await fetchAsset(env, "meta.json")).json());

const getCatalog = cached(async (env) => {
  const [meta, full, desktop] = await Promise.all([
    getMeta(env),
    loadAudience(env, "catalog-full.ndjson"),
    loadAudience(env, "catalog-desktop.ndjson"),
  ]);
  return { meta, full, desktop };
});

const getMarket = cached(async (env) => {
  const [meta, items] = await Promise.all([getMeta(env), loadAudience(env, "market-items.ndjson")]);
  return { meta, items };
});

/** 只在请求带 q / category 时才加载解析（占 market 流量约三成）。 */
const getMarketFilters = cached(async (env) => (await fetchAsset(env, "market-filters.json")).json());

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

/** /v1/plugins 的响应按 UA 分流，必须声明 Vary；market 不按 UA 变，不能带。 */
function baseHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    Vary: "User-Agent",
  };
}

function marketHeaders() {
  return { "Access-Control-Allow-Origin": "*" };
}

/**
 * 复刻 writeError 的 {"error":{code,message}}（json.NewEncoder 会带末尾换行）。
 * 与 Go 一致：错误响应不带 ETag / Cache-Control，只有 CORS。
 */
function errorResponse(status, code, message, headers) {
  const body = JSON.stringify({ error: { code, message } }) + "\n";
  return new Response(body, {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

const staleDataResponse = () =>
  errorResponse(
    409,
    "stale_data",
    "data version changed; restart pagination from page 1",
    baseHeaders(),
  );

/** 复刻 Go strings.TrimSpace 的字符集（JS trim() 多 U+FEFF、少 U+0085）。 */
function goIsSpace(c) {
  return (
    c === 0x20 || (c >= 0x09 && c <= 0x0d) || c === 0x85 || c === 0xa0 ||
    c === 0x1680 || (c >= 0x2000 && c <= 0x200a) ||
    c === 0x2028 || c === 0x2029 || c === 0x202f || c === 0x205f || c === 0x3000
  );
}

function goTrimSpace(s) {
  const cps = [...s];
  let i = 0;
  let j = cps.length;
  while (i < j && goIsSpace(cps[i].codePointAt(0))) i++;
  while (j > i && goIsSpace(cps[j - 1].codePointAt(0))) j--;
  return cps.slice(i, j).join("");
}

/** 游标 = base64url("<version>:<offset>")，RawURLEncoding 无填充。 */
function encodeMarketCursor(version, offset) {
  return btoa(`${version}:${offset}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * 复刻 decodeMarketCursor：RawURLEncoding 解码 → 按**最后一个**冒号切分
 * （version 自身含冒号：sha256:...）→ strconv.Atoi 且非负。非法一律 null。
 */
function decodeMarketCursor(cursor) {
  // RawURLEncoding 的字母表与长度约束：不接受填充、不接受标准表的 +/、长度 %4 不为 1。
  if (!/^[A-Za-z0-9_-]*$/.test(cursor) || cursor.length % 4 === 1) return null;
  let decoded;
  try {
    const padded = cursor.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (cursor.length % 4)) % 4);
    decoded = atob(padded);
  } catch {
    return null;
  }
  const i = decoded.lastIndexOf(":");
  if (i <= 0 || i === decoded.length - 1) return null;
  const offset = parseIntOr(decoded.slice(i + 1), null);
  if (offset === null || offset < 0) return null;
  return { version: decoded.slice(0, i), offset };
}

/**
 * 拼一页 market 响应。字段序照 marketPluginsResponse 的 struct 定义，
 * 条目零解析零转义。"null" 占位行（buildMarketItem 判定不过 schema 的条目）
 * 计入 total 与游标偏移，但不进 items——与 Go 的两段式过滤口径一致。
 */
function buildMarketBody(market, meta, indices, offset, end, total) {
  const head = encoder.encode(
    `{"schemaVersion":"1.0.0","generatedAt":"${meta.as_of}",` +
      `"revision":"${meta.data_version}","items":[`,
  );
  const nextCursor = end < total ? encodeMarketCursor(meta.data_version, end) : null;
  const tail = encoder.encode(
    `],"page":{${nextCursor === null ? "" : `"nextCursor":"${nextCursor}",`}"total":${total}}}`,
  );

  const picked = [];
  for (let i = offset; i < end; i++) {
    const row = indices === null ? i : indices[i];
    const [s, e] = market.items.offsets[row];
    if (e - s === 4 && market.items.buf[s] === 110) continue; // "null" 占位
    picked.push([s, e]);
  }

  let size = head.length + tail.length;
  for (let k = 0; k < picked.length; k++) {
    size += picked[k][1] - picked[k][0] + (k > 0 ? 1 : 0);
  }
  const out = new Uint8Array(size);
  out.set(head, 0);
  let pos = head.length;
  for (let k = 0; k < picked.length; k++) {
    if (k > 0) out[pos++] = 44; // ","
    const [s, e] = picked[k];
    out.set(market.items.buf.subarray(s, e), pos);
    pos += e - s;
  }
  out.set(tail, pos);
  return out;
}

/** 复刻 writeCacheableBytes：先算强 ETag，命中 If-None-Match 就 304（含 ETag/Cache-Control）。 */
async function cacheableResponse(request, body, contentType, cacheControl, headers) {
  const etag = await strongETag(body);
  const out = { ...headers, "Cache-Control": cacheControl, ETag: etag };
  if (etagMatches(request.headers.get("If-None-Match"), etag)) {
    return new Response(null, { status: 304, headers: out });
  }
  out["Content-Type"] = contentType;
  return new Response(request.method === "HEAD" ? null : body, { status: 200, headers: out });
}

/** GET /market/v1/plugins —— 复刻 handleMarketPlugins。 */
async function handleMarketPlugins(request, env, url) {
  const market = await getMarket(env);
  const params = url.searchParams;
  const limit = clamp(
    parseIntOr(params.get("limit"), MARKET_DEFAULT_LIMIT),
    1,
    MARKET_MAX_LIMIT,
  );

  let offset = 0;
  const rawCursor = params.get("cursor");
  if (rawCursor) {
    const cursor = decodeMarketCursor(rawCursor);
    if (cursor === null) {
      return errorResponse(400, "bad_request", "invalid cursor", marketHeaders());
    }
    if (cursor.version !== market.meta.data_version) {
      return errorResponse(
        409,
        "stale_data",
        "data version changed; restart pagination without cursor",
        marketHeaders(),
      );
    }
    offset = cursor.offset;
  }

  const keyword = goTrimSpace(params.get("q") ?? "").toLowerCase();
  const category = params.get("category") ?? "";

  // indices = null 表示无过滤，直接用行序，省掉过滤面产物的加载与解析。
  let indices = null;
  if (keyword !== "" || category !== "") {
    const filters = await getMarketFilters(env);
    indices = [];
    for (let i = 0; i < filters.categories.length; i++) {
      if (category !== "" && filters.categories[i] !== category) continue;
      // Go 是对 name 与 description 分别 Contains，不能拼成一条再搜。
      if (keyword !== "" && !filters.names[i].includes(keyword) && !filters.descs[i].includes(keyword)) {
        continue;
      }
      indices.push(i);
    }
  }

  const total = indices === null ? market.items.offsets.length : indices.length;
  if (offset > total) offset = total;
  const end = Math.min(offset + limit, total);

  const body = buildMarketBody(market, market.meta, indices, offset, end, total);
  return cacheableResponse(
    request,
    body,
    "application/json; charset=utf-8",
    CACHE_CONTROL,
    marketHeaders(),
  );
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

/** GET /v1/plugins —— 复刻 handleListPlugins 的纯分页分支。 */
async function handleListPlugins(request, env, url) {
  const catalog = await getCatalog(env);

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
  return cacheableResponse(
    request,
    body,
    "application/json; charset=utf-8",
    CACHE_CONTROL,
    baseHeaders(),
  );
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const readOnly = request.method === "GET" || request.method === "HEAD";

    // 路由只把 /v1/plugins* 与 /market/* 送进来；其余一律透传。写方法（含 OPTIONS
    // 预检）也透传 Go——Go 的 mux 对它们有既定行为，没必要在边缘重造。
    if (!readOnly) return passthrough(request, env);

    try {
      if (url.pathname === "/market/manifest.json") {
        return await cacheableResponse(
          request,
          encoder.encode(MARKET_MANIFEST),
          "application/json; charset=utf-8",
          SCHEMA_CACHE_CONTROL,
          marketHeaders(),
        );
      }
      if (url.pathname === "/market/v1/plugins") {
        return await handleMarketPlugins(request, env, url);
      }
      if (url.pathname === "/v1/plugins") {
        for (const [k, v] of url.searchParams) {
          // 空值参数在 Go 侧等价于未传，不影响结果，无需为它回源。
          if (!ALLOWED_PARAMS.has(k) && v !== "") return passthrough(request, env);
        }
        return await handleListPlugins(request, env, url);
      }
    } catch {
      return passthrough(request, env); // 产物缺失/损坏时退回 Go，不给调用方吃 500
    }

    return passthrough(request, env);
  },
};

export default worker;
