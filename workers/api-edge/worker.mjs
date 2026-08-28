/**
 * API 边缘 Worker：在 api.dshfind.com 上接管这几条读路径——
 *   /v1/plugins*   纯分页的目录列表（切流前占全站流量 80%）
 *   /market/*      桌面端插件市场的「标准目录源」契约
 *   /v1/suggest    搜索框补全
 *   /v1/catalog    整包目录下载
 *   /v1/plugins/{owner}/{repo}   插件详情（主体来自产物，i18n 与 star 历史查 D1）
 * 其余请求原样透传 Railway 上的 Go 服务。方案见 docs/d1-migration-plan.md P4/S1。
 *
 * 数据是 scripts/gen-api-artifacts.mjs 预渲染的 NDJSON 产物（每行一个
 * 条目的 JSON 字节，已与 Go 的 encoding/json 输出逐字节对齐——验证方式：
 * data_version 与 Go 完全相等）。Worker 只做字节拼接，从不 JSON.parse
 * 目录本体：13MB 产物以 Uint8Array + 行偏移索引驻留 isolate，堆内存
 * ~13MB 而不是解析成对象的 30-50MB，CPU 每请求 ~1ms。
 *
 * 行为契约逐项复刻 server/internal/httpapi/：
 *   plugins.go —— 桌面 UA（dsh-community-market/0.1）→ 首屏 200 条子集，
 *     其余 → 完整目录；14 个过滤条件与 4 种排序全在边缘（Go 对不认识的参数
 *     是忽略而非报错，所以这条路径也不需要透传兜底）；data_version 不符
 *     → 409 stale_data（换代时桌面端自动从第 1 页重同步）；Vary: User-Agent
 *   market.go —— limit/cursor/q/category 全部在边缘实现（Go 对未知参数是
 *     忽略而非报错，因此这条路径不需要透传兜底）；游标绑定快照版本，
 *     版本不符 409、游标本身非法 400；**无 Vary**（响应与 UA 无关）
 *   suggest.go —— 顺序扫描小写检索串取前 10；q 不足 2 码点时走的是
 *     writeJSON 而非 writeCacheableJSON（no-store、无 ETag、带尾换行）
 *   catalog.go —— 整包目录；带匹配 data_version 时换 immutable 缓存头，
 *     版本不符也不 409。ETag 在生成期预算好，不每次对 11MB 做 sha256
 * 除 suggest 的短 query 分支外，都是强 ETag（sha256）+ If-None-Match 304、CORS *。
 */

import { handleGraphQL, handleGraphQLSchema } from "./graphql.mjs";

const DESKTOP_UA = "dsh-community-market/0.1";
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;
const MAX_PAGE = 1 << 30;
const MARKET_DEFAULT_LIMIT = 50;
const MARKET_MAX_LIMIT = 100;
const SUGGEST_MIN_QUERY = 2;
const SUGGEST_MAX_QUERY = 64;
const SUGGEST_LIMIT = 10;
/** 与 Go publicDataCacheControl 一致。 */
export const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";
/** 与 Go publicSchemaCacheControl 一致（manifest 内容恒定）。 */
export const SCHEMA_CACHE_CONTROL = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";
/** 与 Go publicSuggestCacheControl 一致。 */
const SUGGEST_CACHE_CONTROL = "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400";
/** 与 Go catalogImmutableCacheControl 一致：带匹配 data_version 的整包响应是版本寻址的。 */
const CATALOG_IMMUTABLE_CACHE_CONTROL = "public, max-age=60, s-maxage=86400, immutable";
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

export async function fetchAsset(env, name) {
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
export function cached(load) {
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

export const getCatalog = cached(async (env) => {
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

/** 只在请求真带了过滤/排序参数时才加载解析（3.7MB，线上占比很小）。 */
export const getListFacets = cached(async (env) => (await fetchAsset(env, "list-facets.json")).json());

/** 小写 full_name → 行号。只有详情端点用。 */
export const getDetailIndex = cached(async (env) => (await fetchAsset(env, "detail-index.json")).json());

const getSuggest = cached(async (env) => {
  const [meta, items, hay] = await Promise.all([
    getMeta(env),
    loadAudience(env, "suggest-items.ndjson"),
    fetchAsset(env, "suggest-hay.json").then((r) => r.json()),
  ]);
  return { meta, items, hay };
});

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

/**
 * head + line,line,… + tail 的字节拼接，条目零解析零转义。四条读路径
 * （列表 / market / suggest / catalog）只在「挑哪些行」和信封上有差别，
 * 拼接本身共用这一处，省得四份各自算一遍偏移。
 */
function joinRawLines(buf, spans, head, tail) {
  let size = head.length + tail.length;
  for (let k = 0; k < spans.length; k++) {
    size += spans[k][1] - spans[k][0] + (k > 0 ? 1 : 0);
  }
  const out = new Uint8Array(size);
  out.set(head, 0);
  let pos = head.length;
  for (let k = 0; k < spans.length; k++) {
    if (k > 0) out[pos++] = 44; // ","
    const [s, e] = spans[k];
    out.set(buf.subarray(s, e), pos);
    pos += e - s;
  }
  out.set(tail, pos);
  return out;
}

/**
 * 拼一页列表响应：{"data":[<原始条目字节>,...],"page":...}。
 * indices 为 null 表示无过滤无排序，直接切连续区间（不必构造 1.1 万元素的下标数组）。
 */
function buildBody(aud, meta, page, perPage, indices = null) {
  const total = indices === null ? aud.offsets.length : indices.length;
  const totalPages = Math.ceil(total / perPage);
  let startIdx = (page - 1) * perPage;
  if (startIdx > total) startIdx = total;
  const endIdx = Math.min(startIdx + perPage, total);
  const spans =
    indices === null
      ? aud.offsets.slice(startIdx, endIdx)
      : indices.slice(startIdx, endIdx).map((i) => aud.offsets[i]);

  return joinRawLines(
    aud.buf,
    spans,
    encoder.encode('{"data":['),
    encoder.encode(
      `],"page":${page},"per_page":${perPage},"total":${total},"total_pages":${totalPages},` +
        `"data_version":"${meta.data_version}","as_of":"${meta.as_of}","generated_at":"${meta.as_of}"}`,
    ),
  );
}

// list-facets.json 里的位掩码，与 gen-api-artifacts.mjs 一一对应。
const FLAG_FEATURED = 1;
const FLAG_OFFICIAL = 2;
const FLAG_ARCHIVED = 4;
const FLAG_INSIDER = 8;
const FLAG_RISKY = 16;
const FLAG_HAS_INSTALL = 32;

/** 复刻 Go parseBool：只认 true/1/false/0（大小写不敏感），其余一律 null（= 不过滤）。 */
function parseTriBool(v) {
  switch ((v ?? "").toLowerCase()) {
    case "true":
    case "1":
      return true;
    case "false":
    case "0":
      return false;
    default:
      return null;
  }
}

/** 复刻 parseOptionalInt：空 → null；非整数或越界 → INVALID（调用方转 400）。 */
const INVALID_INT = Symbol("invalid int");
function parseOptionalInt(v, lo, hi) {
  if (v === "") return null;
  if (!/^[+-]?\d+$/.test(v)) return INVALID_INT;
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < lo || n > hi) return INVALID_INT;
  return n;
}

/** 复刻 filterPlugins。返回命中的行下标，顺序即快照序。 */
export function filterListIndices(facets, f) {
  const out = [];
  const flagged = (i, mask, want) => ((facets.flags[i] & mask) !== 0) === want;
  for (let i = 0; i < facets.hay.length; i++) {
    if (f.category !== "" && facets.category[i] !== f.category) continue;
    if (f.language !== "" && facets.language[i] !== f.language) continue;
    if (f.grade !== "" && (facets.grade[i] === null || facets.grade[i] !== f.grade)) continue;
    if (f.featured !== null && !flagged(i, FLAG_FEATURED, f.featured)) continue;
    if (f.official !== null && !flagged(i, FLAG_OFFICIAL, f.official)) continue;
    if (f.keyword !== "" && !facets.hay[i].includes(f.keyword)) continue;
    if (f.owner !== "" && facets.owner[i] !== f.owner) continue;
    if (f.tag !== "" && !facets.tags[i].includes(f.tag)) continue;
    if (f.minScore !== null && (facets.score[i] === null || facets.score[i] < f.minScore)) continue;
    if (f.archived !== null && !flagged(i, FLAG_ARCHIVED, f.archived)) continue;
    if (f.insider !== null && !flagged(i, FLAG_INSIDER, f.insider)) continue;
    if (f.risky !== null && !flagged(i, FLAG_RISKY, f.risky)) continue;
    if (f.hasInstall !== null && !flagged(i, FLAG_HAS_INSTALL, f.hasInstall)) continue;
    // is_plugin 是三态：传了就要精确匹配，未知（null）一律不匹配。
    if (f.isPlugin !== null && (facets.isPlugin[i] === null || (facets.isPlugin[i] === 1) !== f.isPlugin)) {
      continue;
    }
    out.push(i);
  }
  return out;
}

/**
 * 复刻 sortPlugins：默认降序；name 默认升序；不认识的 sort 值保持快照原序。
 * 字符串比较用 JS 的 `<`（UTF-16 码元序）而非 Go 的字节序——参与比较的
 * name / full_name / pushed_at 都是 ASCII（GitHub 仓库名与 ISO8601），两者等价。
 */
export function sortListIndices(indices, facets, sortBy, order) {
  let less;
  switch (sortBy) {
    case "stars":
      less = (a, b) => facets.stars[a] < facets.stars[b];
      break;
    case "updated":
      less = (a, b) => facets.pushedAt[a] < facets.pushedAt[b];
      break;
    case "score":
      less = (a, b) => (facets.score[a] ?? -1) < (facets.score[b] ?? -1);
      break;
    case "name":
      less = (a, b) => {
        const an = facets.nameLower[a];
        const bn = facets.nameLower[b];
        if (an !== bn) return an < bn;
        return facets.fullName[a] < facets.fullName[b];
      };
      break;
    default:
      return;
  }
  let desc = order !== "asc";
  if (order === "" && sortBy === "name") desc = false;
  // Go 用 sort.SliceStable；JS 的 Array#sort 规范上同样稳定，同分条目保持快照序。
  indices.sort((a, b) =>
    desc ? (less(b, a) ? -1 : less(a, b) ? 1 : 0) : less(a, b) ? -1 : less(b, a) ? 1 : 0,
  );
}

/** /v1/plugins 的响应按 UA 分流，必须声明 Vary；market 不按 UA 变，不能带。 */
function baseHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    Vary: "User-Agent",
  };
}

export function corsHeaders() {
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

export function goTrimSpace(s) {
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
  const nextCursor = end < total ? encodeMarketCursor(meta.data_version, end) : null;
  const picked = [];
  for (let i = offset; i < end; i++) {
    const row = indices === null ? i : indices[i];
    const [s, e] = market.items.offsets[row];
    if (e - s === 4 && market.items.buf[s] === 110) continue; // "null" 占位
    picked.push([s, e]);
  }
  return joinRawLines(
    market.items.buf,
    picked,
    encoder.encode(
      `{"schemaVersion":"1.0.0","generatedAt":"${meta.as_of}",` +
        `"revision":"${meta.data_version}","items":[`,
    ),
    encoder.encode(
      `],"page":{${nextCursor === null ? "" : `"nextCursor":"${nextCursor}",`}"total":${total}}}`,
    ),
  );
}

/**
 * 复刻 writeCacheableBytes：先算强 ETag，命中 If-None-Match 就 304（含 ETag/Cache-Control）。
 * precomputedETag 供整包目录用——对 11MB 做 sha256 要几十毫秒 CPU，生成期算一次就够。
 * 304 只对 GET/HEAD 生效：POST /graphql 带 If-None-Match 时 Go 照样回 200 全量
 * （ETag 仍附上，仅供观测与兼容中间层），这里必须一致。
 */
export async function cacheableResponse(request, body, contentType, cacheControl, headers, precomputedETag) {
  const etag = precomputedETag ?? (await strongETag(body));
  const out = { ...headers, "Cache-Control": cacheControl, ETag: etag };
  const conditional = request.method === "GET" || request.method === "HEAD";
  if (conditional && etagMatches(request.headers.get("If-None-Match"), etag)) {
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
      return errorResponse(400, "bad_request", "invalid cursor", corsHeaders());
    }
    if (cursor.version !== market.meta.data_version) {
      return errorResponse(
        409,
        "stale_data",
        "data version changed; restart pagination without cursor",
        corsHeaders(),
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
    corsHeaders(),
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

/** GET /v1/plugins —— 复刻 handleListPlugins（过滤、排序、分页全在边缘）。 */
async function handleListPlugins(request, env, url) {
  const catalog = await getCatalog(env);
  const q = url.searchParams;

  const requested = q.get("data_version");
  if (requested && requested !== catalog.meta.data_version) return staleDataResponse();

  const page = clamp(parseIntOr(q.get("page"), 1), 1, MAX_PAGE);
  const perPage = clamp(parseIntOr(q.get("per_page"), DEFAULT_PER_PAGE), 1, MAX_PER_PAGE);
  const respond = (aud, indices) =>
    cacheableResponse(
      request,
      buildBody(aud, catalog.meta, page, perPage, indices),
      "application/json; charset=utf-8",
      CACHE_CONTROL,
      baseHeaders(),
    );

  // 桌面 UA 在 Go 侧是在解析过滤参数**之前**短路的（plugins.go:65）：它拿的
  // 永远是首屏 200 条子集，带 category/q 也照样被忽略。别调换这个顺序。
  if (request.headers.get("User-Agent") === DESKTOP_UA) {
    return respond(catalog.desktop, null);
  }

  const minScore = parseOptionalInt(q.get("min_score") ?? "", 0, 100);
  if (minScore === INVALID_INT) {
    // Vary 在 Go 侧是进 handler 就 Add 的，错误响应同样带着。
    return errorResponse(
      400,
      "bad_request",
      "min_score must be an integer between 0 and 100",
      baseHeaders(),
    );
  }

  const filter = {
    category: q.get("category") ?? "",
    language: (q.get("language") ?? "").toLowerCase(),
    grade: (q.get("grade") ?? "").toUpperCase(),
    keyword: goTrimSpace(q.get("q") ?? "").toLowerCase(),
    owner: (q.get("owner") ?? "").toLowerCase(),
    tag: (q.get("tag") ?? "").toLowerCase(),
    minScore,
    featured: parseTriBool(q.get("featured")),
    official: parseTriBool(q.get("official")),
    archived: parseTriBool(q.get("archived")),
    insider: parseTriBool(q.get("insider")),
    risky: parseTriBool(q.get("risky")),
    hasInstall: parseTriBool(q.get("has_install")),
    isPlugin: parseTriBool(q.get("is_plugin")),
  };
  const hasFilter =
    filter.category !== "" || filter.language !== "" || filter.grade !== "" ||
    filter.keyword !== "" || filter.owner !== "" || filter.tag !== "" ||
    filter.minScore !== null || filter.featured !== null || filter.official !== null ||
    filter.archived !== null || filter.insider !== null || filter.risky !== null ||
    filter.hasInstall !== null || filter.isPlugin !== null;

  const sortBy = q.get("sort") ?? "";
  const order = q.get("order") ?? "";
  // 快路径：既不过滤也不排序时连 facets 都不加载，直接切连续区间。
  if (!hasFilter && sortBy === "") return respond(catalog.full, null);

  const facets = await getListFacets(env);
  const indices = hasFilter
    ? filterListIndices(facets, filter)
    : Array.from({ length: catalog.full.offsets.length }, (_, i) => i);
  sortListIndices(indices, facets, sortBy, order);
  return respond(catalog.full, indices);
}

/** encoding/json 默认做 HTML 转义；产物生成器里的同名函数，两边必须一致。 */
export function goJSON(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * 复刻 store.PluginI18n 的结果形状：{locale: {description?, intro?, highlights?, updated_at}}。
 * **键必须按 locale 排序**——Go 序列化 map 时会排序，JS 对象走插入序，
 * 不显式排就会按数据库返回顺序输出，字节对不上。
 * description / intro 是指针 + omitempty：SQL NULL 才省略，空串照样输出。
 * highlights 是切片 + omitempty：NULL、空串、解析成空数组都省略。
 */
function buildI18n(rows) {
  const out = {};
  for (const r of [...rows].sort((a, b) => (a.locale < b.locale ? -1 : a.locale > b.locale ? 1 : 0))) {
    const entry = {};
    if (r.description !== null && r.description !== undefined) entry.description = r.description;
    if (r.intro !== null && r.intro !== undefined) entry.intro = r.intro;
    if (r.highlights) {
      try {
        const parsed = JSON.parse(r.highlights);
        if (Array.isArray(parsed) && parsed.length > 0) entry.highlights = parsed;
      } catch {
        /* 与 Go 的 `_ = json.Unmarshal(...)` 一致：解析不了就当没有 */
      }
    }
    entry.updated_at = r.updated_at;
    out[r.locale] = entry;
  }
  return out;
}

/** contributors / pushed_at 是指针但**没有** omitempty，缺失要输出 null 而不是省略。 */
const buildSnapshots = (rows) =>
  rows.map((r) => ({
    date: r.snapshot_date,
    stars: Number(r.stars),
    contributors: r.contributors === null || r.contributors === undefined ? null : Number(r.contributors),
    pushed_at: r.pushed_at ?? null,
  }));

/**
 * 复刻 computeGrowth：基线取「最新快照日 -7 天」当天或更早的最近一张，
 * 历史不足 7 天回退最早一张；少于 2 张记 0 / null。当前值用维度表的 stars。
 */
export function computeGrowth(plugin, snaps) {
  const growth = { window_days: 7, stars: 0, contributors: null };
  if (snaps.length < 2) return growth;
  const latest = snaps[snaps.length - 1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(latest.date)) return growth;
  const cutoff = new Date(Date.parse(latest.date + "T00:00:00Z") - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  let base = snaps[0];
  for (let i = snaps.length - 1; i >= 0; i--) {
    if (snaps[i].date <= cutoff) {
      base = snaps[i];
      break;
    }
  }
  growth.stars = plugin.stars - base.stars;
  if (plugin.contributors !== null && plugin.contributors !== undefined && base.contributors !== null) {
    growth.contributors = plugin.contributors - base.contributors;
  }
  return growth;
}

/** GET /v1/plugins/{owner}/{repo} —— 复刻 handlePluginDetail。 */
async function handlePluginDetail(request, env, url, owner, repo) {
  const [catalog, index] = await Promise.all([getCatalog(env), getDetailIndex(env)]);
  const row = index[`${owner}/${repo}`.toLowerCase()];
  if (row === undefined) {
    return errorResponse(404, "not_found", "plugin not found", corsHeaders());
  }

  const [start, end] = catalog.full.offsets[row];
  const raw = catalog.full.buf.subarray(start, end);
  // 只为拿 full_name / stars / contributors 解析这一行（~1KB）；响应体仍然
  // 直接复用原始字节，字节级复刻不受影响。
  const plugin = JSON.parse(new TextDecoder().decode(raw));

  const days = clamp(parseIntOr(url.searchParams.get("snapshot_days"), 30), 1, 90);

  const [i18nRes, snapRes] = await Promise.all([
    env.DB.prepare(
      "SELECT locale, description, intro, highlights, updated_at FROM plugin_i18n WHERE full_name = ?",
    )
      .bind(plugin.full_name)
      .all(),
    // Go 是 ORDER BY full_name, snapshot_date；单仓库查询里前者恒定，等价。
    env.DB.prepare(
      "SELECT snapshot_date, stars, contributors, pushed_at FROM plugin_snapshots WHERE full_name = ? ORDER BY snapshot_date",
    )
      .bind(plugin.full_name)
      .all(),
  ]);

  const allSnaps = buildSnapshots(snapRes.results ?? []);
  // 全量取快照算 7 天增长基线，响应里再按 snapshot_days 截取。
  let visible = allSnaps;
  if (allSnaps.length > 0) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    let startIdx = 0;
    while (startIdx < allSnaps.length && allSnaps[startIdx].date < cutoff) startIdx++;
    visible = allSnaps.slice(startIdx);
  }

  // 条目字段是内嵌的（Go 的 struct embedding），所以掐掉原始行的首尾花括号再接后半段。
  const tail = encoder.encode(
    `,"i18n":${goJSON(buildI18n(i18nRes.results ?? []))},` +
      `"snapshots":${goJSON(visible)},` +
      `"growth":${goJSON(computeGrowth(plugin, allSnaps))},` +
      `"data_version":"${catalog.meta.data_version}","as_of":"${catalog.meta.as_of}"}`,
  );
  const body = new Uint8Array(raw.length - 1 + tail.length);
  body.set(raw.subarray(0, raw.length - 1), 0); // 去掉行尾的 }
  body.set(tail, raw.length - 1);

  // 详情响应与 UA 无关，不带 Vary: User-Agent。
  return cacheableResponse(request, body, "application/json; charset=utf-8", CACHE_CONTROL, corsHeaders());
}

/** GET /v1/suggest —— 复刻 handleSuggest。 */
async function handleSuggest(request, env, url) {
  // 归一化顺序照 Go：TrimSpace → 截 64 码点 → ToLower。长度判定在 ToLower **之后**
  // ——个别字符小写后码点数会变，顺序反了结果就不同。
  let q = goTrimSpace(url.searchParams.get("q") ?? "");
  const runes = [...q];
  if (runes.length > SUGGEST_MAX_QUERY) q = runes.slice(0, SUGGEST_MAX_QUERY).join("");
  q = q.toLowerCase();

  if ([...q].length < SUGGEST_MIN_QUERY) {
    // 这条分支 Go 走的是 writeJSON 而非 writeCacheableJSON：no-store、无 ETag，
    // 且 json.NewEncoder 会带一个末尾换行（13 字节，别漏）。
    return new Response('{"items":[]}\n', {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  // 顺序扫描、子串包含、命中 limit 条即停——顺序即快照序，不能重排。
  const suggest = await getSuggest(env);
  const picked = [];
  for (let i = 0; i < suggest.hay.length && picked.length < SUGGEST_LIMIT; i++) {
    if (suggest.hay[i].includes(q)) picked.push(suggest.items.offsets[i]);
  }

  const body = joinRawLines(
    suggest.items.buf,
    picked,
    encoder.encode('{"items":['),
    encoder.encode("]}"),
  );
  return cacheableResponse(
    request,
    body,
    "application/json; charset=utf-8",
    SUGGEST_CACHE_CONTROL,
    corsHeaders(),
  );
}

/** GET /v1/catalog —— 复刻 handleCatalog：整包目录，按 data_version 版本寻址。 */
async function handleCatalog(request, env, url) {
  const catalog = await getCatalog(env);
  const meta = catalog.meta;
  // 版本不匹配**不** 409：整包端点不做分页一致性担保，只是退回常规短缓存，
  // 由调用方比对响应里的 data_version 自行判断。
  const requested = url.searchParams.get("data_version");
  const cacheControl =
    requested && requested === meta.data_version ? CATALOG_IMMUTABLE_CACHE_CONTROL : CACHE_CONTROL;

  const body = joinRawLines(
    catalog.full.buf,
    catalog.full.offsets,
    encoder.encode('{"data":['),
    encoder.encode(
      `],"total":${catalog.full.offsets.length},"data_version":"${meta.data_version}",` +
        `"as_of":"${meta.as_of}","generated_at":"${meta.as_of}"}`,
    ),
  );
  return cacheableResponse(
    request,
    body,
    "application/json; charset=utf-8",
    cacheControl,
    corsHeaders(),
    // 老产物没有这个字段时回退到现算，不至于因为一次产物换代就 500。
    meta.catalog_etag,
  );
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const readOnly = request.method === "GET" || request.method === "HEAD";

    // GraphQL 是唯一一条要收 POST 的路径（查询走 POST body 是标准形态）。
    // 放在 readOnly 闸之前；OPTIONS 预检仍透传。
    if (url.pathname === "/graphql" && (readOnly || request.method === "POST")) {
      try {
        return await handleGraphQL(request, env, url);
      } catch {
        return passthrough(request, env); // 产物缺失或真 bug：退回 Go，别给调用方吃 500
      }
    }

    // 路由只把 /v1/plugins* 与 /market/* 送进来；其余一律透传。写方法（含 OPTIONS
    // 预检）也透传 Go——Go 的 mux 对它们有既定行为，没必要在边缘重造。
    if (!readOnly) return passthrough(request, env);

    try {
      if (url.pathname === "/graphql/schema") return await handleGraphQLSchema(request);
      if (url.pathname === "/market/manifest.json") {
        return await cacheableResponse(
          request,
          encoder.encode(MARKET_MANIFEST),
          "application/json; charset=utf-8",
          SCHEMA_CACHE_CONTROL,
          corsHeaders(),
        );
      }
      if (url.pathname === "/market/v1/plugins") {
        return await handleMarketPlugins(request, env, url);
      }
      // 过滤与排序也在边缘实现了，不再有「带某个参数就得回源」的形状——
      // Go 的 handlePluginList 对不认识的参数是忽略而非报错，全量接管是安全的。
      if (url.pathname === "/v1/plugins") return await handleListPlugins(request, env, url);
      // 详情：只认恰好两段的 /v1/plugins/{owner}/{repo}。三段的 /discussion 与
      // 任何其它形状都透传——讨论区依赖论坛表，那还在 Turso（S3 才动）。
      const detail = /^\/v1\/plugins\/([^/]+)\/([^/]+)$/.exec(url.pathname);
      if (detail) {
        let owner;
        let repo;
        try {
          // Go 1.22 的 mux 会把路径段解码后交给 PathValue，这里对齐。
          owner = decodeURIComponent(detail[1]);
          repo = decodeURIComponent(detail[2]);
        } catch {
          return passthrough(request, env); // %XX 不合法，交给 Go 去决定怎么答
        }
        return await handlePluginDetail(request, env, url, owner, repo);
      }
      if (url.pathname === "/v1/suggest") return await handleSuggest(request, env, url);
      if (url.pathname === "/v1/catalog") return await handleCatalog(request, env, url);
    } catch {
      return passthrough(request, env); // 产物缺失/损坏时退回 Go，不给调用方吃 500
    }

    return passthrough(request, env);
  },
};

export default worker;
