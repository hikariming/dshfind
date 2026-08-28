/**
 * /graphql 与 /graphql/schema 的边缘实现，逐项复刻 server/internal/httpapi/graphql.go。
 *
 * 三条最容易翻车的既成契约（详见 docs/d1-migration-plan.md S2 修正）：
 *
 * 1. **响应键按字母序**，不是选择顺序——Go 的 Data 是 map[string]any，
 *    encoding/json 序列化 map 会排序（嵌套的每一层都排）。marshalSorted 负责。
 * 2. **结果对象必须用 Object.create(null)**：alias 是合法的 GraphQL name，
 *    `__proto__` 也是（`{ __proto__: dataset {...} }`）。普通对象上赋值
 *    result["__proto__"] 会改原型链、键从 JSON 里消失，Go 那边却正常输出。
 * 3. **错误分三种响应头**（fixtures 实测）：传输层 400 + no-store；
 *    「query is required / 超长」400 **无** Cache-Control；执行错误 200 + no-store。
 *    错误体是 {"errors":[{"message":…}]} 加一个换行（json.NewEncoder 的行为）。
 *
 * 数据源：目录字段走 catalog-full.ndjson（解析单行拿字段，最多一页 50 行）；
 * pluginFacets 走生成期预算好的 graphql-facets.json；i18n 与快照实时查 D1
 * （与 Go 查 Turso 同构，双写保证两库一致）。
 *
 * 与 worker.mjs 是有意的循环导入：两边都只在请求期调用对方的函数（ESM 对
 * call-time-only 的循环引用有完整定义的行为），共享 filter/sort/growth 的
 * 实现避免与 REST 口径漂移。
 */
import {
  GraphParseError,
  expandFields,
  parseGraphDocument,
  resolveGraphValue,
  responseKey,
  selectOperation,
} from "./graphql-parse.mjs";
import { GRAPHQL_SDL } from "./graphql-static.mjs";
import {
  CACHE_CONTROL,
  SCHEMA_CACHE_CONTROL,
  cacheableResponse,
  cached,
  computeGrowth,
  corsHeaders,
  fetchAsset,
  filterListIndices,
  getCatalog,
  getDetailIndex,
  getListFacets,
  goTrimSpace,
  sortListIndices,
} from "./shared.mjs";

const MAX_QUERY_BYTES = 8 << 10;
const MAX_BODY_BYTES = 16 << 10;
const MAX_DEPTH = 8;
const MAX_FIRST = 50;
const DEFAULT_FIRST = 20;
const MAX_ROOT_FIELDS = 8;
const MAX_PLUGIN_DATA_RESOLVERS = 1;
const MAX_KEYWORD_RUNES = 64;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** GraphQL 执行错误：HTTP 200，message 进 errors 数组。 */
class GraphExecError extends Error {}
/** 传输层错误：HTTP 400 + no-store，message 带 "invalid GraphQL request: " 前缀。 */
class TransportError extends Error {}

const isContractError = (err) =>
  err instanceof GraphExecError || err instanceof GraphParseError || err instanceof TransportError;

const getGraphqlFacets = cached(async (env) => (await fetchAsset(env, "graphql-facets.json")).json());

// ── 序列化（对齐 encoding/json）───────────────────────────────────────────────

/** encoding/json 的 HTML 转义，作用在已拼好的 JSON 串上（< > & 只出现在字符串值里）。 */
const goEscape = (s) =>
  s
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

/**
 * map 键按字母序的 JSON 序列化。数组保序；本 API 的数值全是整数。
 * 键都是 ASCII（GraphQL name / locale），JS 默认 sort 与 Go 的字节序一致。
 */
function marshalSorted(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(marshalSorted).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${marshalSorted(value[k])}`).join(",")}}`;
}

// ── 错误响应（三种头形态，见文件头注释）──────────────────────────────────────

function errorsBody(message) {
  return goEscape(`{"errors":[{"message":${JSON.stringify(message)}}]}`) + "\n";
}

function graphErrorResponse(request, status, message, cacheControl) {
  const headers = { ...corsHeaders(), "Content-Type": "application/json; charset=utf-8" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(request.method === "HEAD" ? null : errorsBody(message), { status, headers });
}

// ── 传输层：复刻 graphRequestFromHTTP 与 Go json 解码器的错误文案 ─────────────
// 合法客户端永远走不到这些 400；对**深层**畸形 JSON 的文案是尽力而为
// （Go 的 json 扫描器错误种类太多），首字符/字面量/截断这几类常见形态已逐字对齐。

const goJSONTypeName = (v) => {
  if (typeof v === "number") return "number";
  if (typeof v === "string") return "string";
  if (typeof v === "boolean") return "bool";
  return Array.isArray(v) ? "array" : "object";
};

/** 复刻 Go 对 byte 的 %q（json 语法错误里引用的是字节，不是码点）。 */
function goQuoteByte(b) {
  if (b === 0x27) return "'\\''";
  if (b === 0x5c) return "'\\\\'";
  if (b >= 0x20 && b < 0x7f) return `'${String.fromCharCode(b)}'`;
  const named = { 7: "\\a", 8: "\\b", 9: "\\t", 10: "\\n", 11: "\\v", 12: "\\f", 13: "\\r" };
  if (named[b]) return `'${named[b]}'`;
  return `'\\x${b.toString(16).padStart(2, "0")}'`;
}

const firstByteOf = (ch) => encoder.encode(ch)[0];

/**
 * 找到 text 中从 start 起第一个 JSON 值的结束位置并解析它。
 * 畸形时抛出带 Go 风格文案的错误；eofMessage 区分 Decoder（"unexpected EOF"）
 * 与 Unmarshal（"unexpected end of JSON input"）两套截断措辞。
 */
function scanJSONValue(text, start, eofMessage) {
  let i = start;
  while (i < text.length && /[ \t\r\n]/.test(text[i])) i++;
  if (i >= text.length) throw new Error("EOF");
  const c = text[i];

  const literal = { n: "null", t: "true", f: "false" }[c];
  if (literal) {
    for (let k = 0; k < literal.length; k++) {
      if (i + k >= text.length) throw new Error(eofMessage);
      if (text[i + k] !== literal[k]) {
        throw new Error(
          `invalid character ${goQuoteByte(firstByteOf(text[i + k]))} in literal ${literal} (expecting ${goQuoteByte(firstByteOf(literal[k]))})`,
        );
      }
    }
    return { value: JSON.parse(literal), end: i + literal.length };
  }

  if (c === "{" || c === "[") {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let k = i; k < text.length; k++) {
      const ch = text[k];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === "{" || ch === "[") depth++;
      else if (ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) {
          const slice = text.slice(i, k + 1);
          try {
            return { value: JSON.parse(slice), end: k + 1 };
          } catch {
            // 括号配平但内部畸形：文案尽力而为（Go 这里有十几种措辞）
            throw new Error(`invalid character ${goQuoteByte(firstByteOf(slice[1] ?? "}"))} looking for beginning of object key string`);
          }
        }
      }
    }
    throw new Error(eofMessage);
  }

  if (c === '"') {
    let escaped = false;
    for (let k = i + 1; k < text.length; k++) {
      if (escaped) escaped = false;
      else if (text[k] === "\\") escaped = true;
      else if (text[k] === '"') {
        const slice = text.slice(i, k + 1);
        return { value: JSON.parse(slice), end: k + 1 };
      }
    }
    throw new Error(eofMessage);
  }

  if (c === "-" || (c >= "0" && c <= "9")) {
    let k = i;
    while (k < text.length && /[0-9eE+\-.]/.test(text[k])) k++;
    const slice = text.slice(i, k);
    try {
      return { value: JSON.parse(slice), end: k };
    } catch {
      throw new Error(`invalid character ${goQuoteByte(firstByteOf(slice[slice.length - 1]))} in numeric literal`);
    }
  }

  throw new Error(`invalid character ${goQuoteByte(firstByteOf(c))} looking for beginning of value`);
}

/** 复刻 POST 分支：json.NewDecoder(body).Decode(&graphRequest) + ensureSingleJSONValue。 */
function parsePostBody(text) {
  const { value, end } = (() => {
    try {
      return scanJSONValue(text, 0, "unexpected EOF");
    } catch (err) {
      throw new TransportError(err.message);
    }
  })();

  // ensureSingleJSONValue：第一个值之后只允许空白；再来一个完整 JSON 值是
  // 固定文案，畸形尾巴则是那个位置的语法错误。
  const rest = text.slice(end);
  if (/[^ \t\r\n]/.test(rest)) {
    try {
      scanJSONValue(rest, 0, "unexpected EOF");
    } catch (err) {
      throw new TransportError(err.message);
    }
    throw new TransportError("request body must contain one JSON object");
  }

  // Decode(null) 是 no-op 成功；非对象顶层值按 Go 的 unmarshal 错误报。
  const req = { query: "", operationName: "", variables: null };
  if (value === null) return req;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TransportError(
      `json: cannot unmarshal ${goJSONTypeName(value)} into Go value of type httpapi.graphRequest`,
    );
  }
  // 键按输入顺序处理、同键后者覆盖前者、大小写不敏感回退——都是 Go 的行为。
  for (const key of Object.keys(value)) {
    const v = value[key];
    const lower = key.toLowerCase();
    if (lower === "query" || lower === "operationname") {
      const target = lower === "query" ? "query" : "operationName";
      if (v === null) continue; // null 解进 string 是 no-op
      if (typeof v !== "string") {
        throw new TransportError(
          `json: cannot unmarshal ${goJSONTypeName(v)} into Go struct field graphRequest.${target === "query" ? "query" : "operationName"} of type string`,
        );
      }
      req[target] = v;
    } else if (lower === "variables") {
      if (v === null) continue;
      if (typeof v !== "object" || Array.isArray(v)) {
        throw new TransportError(
          `json: cannot unmarshal ${goJSONTypeName(v)} into Go struct field graphRequest.variables of type map[string]interface {}`,
        );
      }
      req.variables = v;
    }
    // 未知键忽略（Go 未开 DisallowUnknownFields）
  }
  return req;
}

/** 复刻 GET 分支：query/operationName 直取，variables 单独 json.Unmarshal。 */
function parseGetQuery(url) {
  const q = url.searchParams;
  const req = { query: q.get("query") ?? "", operationName: q.get("operationName") ?? "", variables: null };
  const rawVariables = q.get("variables") ?? "";
  if (rawVariables !== "") {
    let parsed;
    try {
      const scanned = scanJSONValue(rawVariables, 0, "unexpected end of JSON input");
      if (/[^ \t\r\n]/.test(rawVariables.slice(scanned.end))) {
        throw new Error(
          `invalid character ${goQuoteByte(firstByteOf(rawVariables.slice(scanned.end).trimStart()[0]))} after top-level value`,
        );
      }
      parsed = scanned.value;
    } catch (err) {
      throw new TransportError(`variables must be a JSON object: ${err.message === "EOF" ? "unexpected end of JSON input" : err.message}`);
    }
    if (parsed === null) throw new TransportError("variables must be a JSON object");
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TransportError(
        `variables must be a JSON object: json: cannot unmarshal ${goJSONTypeName(parsed)} into Go value of type map[string]interface {}`,
      );
    }
    req.variables = parsed;
  }
  return req;
}

// ── 参数取值助手（graphArg 一族）──────────────────────────────────────────────

const argOf = (field, name) => (field.args instanceof Map ? field.args.get(name) : undefined);
const hasArg = (field, name) => field.args instanceof Map && field.args.has(name);

function requiredString(field, name, variables) {
  if (!hasArg(field, name)) throw new GraphExecError(`${field.name}.${name} is required`);
  const value = resolveValue(argOf(field, name), variables);
  if (typeof value !== "string" || value === "") {
    throw new GraphExecError(`${field.name}.${name} must be a non-empty string`);
  }
  return value;
}

function optionalString(field, name, variables) {
  if (!hasArg(field, name)) return null;
  const value = resolveValue(argOf(field, name), variables);
  if (value === null) return null;
  if (typeof value !== "string") throw new GraphExecError(`${field.name}.${name} must be a string`);
  return value;
}

function intArg(field, name, variables, def, max) {
  if (!hasArg(field, name)) return def;
  const value = resolveValue(argOf(field, name), variables);
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new GraphExecError(`${field.name}.${name} must be an integer between 1 and ${max}`);
  }
  return value;
}

function enumArg(field, name, variables, def) {
  if (!hasArg(field, name)) return def;
  const value = resolveValue(argOf(field, name), variables);
  if (typeof value !== "string") throw new GraphExecError(`${field.name}.${name} must be an enum value`);
  return value.toUpperCase();
}

/** resolveGraphValue 抛的是 GraphParseError 家族之外的普通 Error，这里统一包装。 */
function resolveValue(value, variables) {
  try {
    return resolveGraphValue(value, variables);
  } catch (err) {
    throw new GraphExecError(err.message);
  }
}

function expand(doc, selection) {
  try {
    return expandFields(doc, selection);
  } catch (err) {
    throw new GraphExecError(err.message);
  }
}

function rejectScalarSelection(typeName, field) {
  if (field.selection && field.selection.length !== 0) {
    throw new GraphExecError(`${typeName}.${field.name} is a scalar and must not have a selection set`);
  }
}

const truncateRunes = (s, max) => {
  const runes = [...s];
  return runes.length <= max ? s : runes.slice(0, max).join("");
};

// ── 游标：签名 + base64url（encodeGraphCursor / decodeGraphCursor）───────────

async function sha256hex(s) {
  const sum = await crypto.subtle.digest("SHA-256", encoder.encode(s));
  return Array.from(new Uint8Array(sum), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 复刻 graphConnectionSignature：匿名 struct 的 json.Marshal——键名即字段名、
 * 顺序即声明顺序（struct 不排序，只有 map 排序）。⚠️ Go 的 payload **漏了
 * Risky**，所以游标其实不绑定这个过滤条件——是上游 bug，但改了游标就不兼容，
 * 照抄。字符串值要过 goEscape（Keyword 可能含 <>&）。
 */
async function connectionSignature(sig, sortBy, order) {
  const s = (v) => JSON.stringify(v);
  const b = (v) => (v === null ? "null" : v ? "true" : "false");
  const payload =
    `{"Category":${s(sig.category)},"Language":${s(sig.language)},"Grade":${s(sig.grade)},` +
    `"Keyword":${s(sig.keyword)},"Owner":${s(sig.owner)},"Tag":${s(sig.tag)},` +
    `"MinScore":${sig.minScore === null ? "null" : sig.minScore},` +
    `"Featured":${b(sig.featured)},"Official":${b(sig.official)},"Archived":${b(sig.archived)},` +
    `"Insider":${b(sig.insider)},"HasInstall":${b(sig.hasInstall)},"IsPlugin":${b(sig.isPlugin)},` +
    `"Sort":${s(sortBy)},"Order":${s(order)}}`;
  return sha256hex(goEscape(payload));
}

function encodeCursor(offset, version, signature) {
  const payload = `{"v":${JSON.stringify(version)},"q":"${signature}","o":${offset}}`;
  return btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCursor(cursor, expectedVersion, expectedSignature) {
  const invalid = () => new GraphExecError("after must be a valid cursor");
  if (!/^[A-Za-z0-9_-]*$/.test(cursor) || cursor.length % 4 === 1) throw invalid();
  let obj;
  try {
    const padded = cursor.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (cursor.length % 4)) % 4);
    obj = JSON.parse(atob(padded));
  } catch {
    throw invalid();
  }
  // json.Unmarshal 进 struct：null 是 no-op（零值）、非对象报错、字段类型不符报错、多余键忽略
  let v = "";
  let q = "";
  let o = 0;
  if (obj !== null) {
    if (typeof obj !== "object" || Array.isArray(obj)) throw invalid();
    if (Object.hasOwn(obj, "v")) {
      if (typeof obj.v !== "string") throw invalid();
      v = obj.v;
    }
    if (Object.hasOwn(obj, "q")) {
      if (typeof obj.q !== "string") throw invalid();
      q = obj.q;
    }
    if (Object.hasOwn(obj, "o")) {
      if (!Number.isInteger(obj.o)) throw invalid();
      o = obj.o;
    }
  }
  if (v === "" || q === "" || o < 0) throw invalid();
  if (v !== expectedVersion) {
    throw new GraphExecError("after cursor refers to a different data version; restart pagination");
  }
  if (q !== expectedSignature) {
    throw new GraphExecError("after cursor was issued for different filters or sorting; restart pagination");
  }
  return o;
}

// ── D1 批量读取（PluginI18nBatch / PluginSnapshotsBatch 同构）────────────────

async function loadI18nBatch(env, names) {
  const out = new Map(names.map((n) => [n, new Map()]));
  if (names.length === 0) return out;
  try {
    const res = await env.DB.prepare(
      `SELECT full_name, locale, description, intro, highlights, updated_at FROM plugin_i18n WHERE full_name IN (${names.map(() => "?").join(",")})`,
    )
      .bind(...names)
      .all();
    for (const r of res.results ?? []) out.get(r.full_name)?.set(r.locale, r);
    return out;
  } catch (err) {
    throw new GraphExecError(`load plugin i18n: ${err.message}`);
  }
}

async function loadSnapshotsBatch(env, names) {
  const out = new Map(names.map((n) => [n, []]));
  if (names.length === 0) return out;
  try {
    const res = await env.DB.prepare(
      `SELECT full_name, snapshot_date, stars, contributors, pushed_at FROM plugin_snapshots WHERE full_name IN (${names.map(() => "?").join(",")}) ORDER BY full_name, snapshot_date`,
    )
      .bind(...names)
      .all();
    for (const r of res.results ?? []) {
      out.get(r.full_name)?.push({
        date: r.snapshot_date,
        stars: Number(r.stars),
        contributors: r.contributors === null || r.contributors === undefined ? null : Number(r.contributors),
        pushed_at: r.pushed_at ?? null,
      });
    }
    return out;
  } catch (err) {
    throw new GraphExecError(`load plugin snapshots: ${err.message}`);
  }
}

/** 只有选中了 i18n / snapshots / growth 才碰 D1，且整页一次批量（Go 同构）。 */
async function prefetchPluginFields(env, rows, selection, doc) {
  const prefetch = { i18n: new Map(), snapshots: new Map() };
  const fields = expand(doc, selection);
  let needI18n = false;
  let needSnapshots = false;
  for (const field of fields) {
    if (field.name === "i18n") needI18n = true;
    if (field.name === "snapshots" || field.name === "growth") needSnapshots = true;
  }
  if ((!needI18n && !needSnapshots) || rows.length === 0) return prefetch;
  const names = [...new Set(rows.map((r) => r.full_name))];
  if (needI18n) prefetch.i18n = await loadI18nBatch(env, names);
  if (needSnapshots) prefetch.snapshots = await loadSnapshotsBatch(env, names);
  return prefetch;
}

// ── 字段 selector（select* 一族）─────────────────────────────────────────────

/** Plugin 的标量字段 → 取值函数。行对象是 catalog-full.ndjson 的一行（snake_case）。 */
const PLUGIN_SCALARS = {
  __typename: () => "Plugin",
  id: (p) => p.full_name,
  fullName: (p) => p.full_name,
  name: (p) => p.name,
  owner: (p) => p.owner,
  url: (p) => p.url,
  repositoryUrl: (p) => (p.repository_url ? p.repository_url : p.url),
  description: (p) => p.description,
  tags: (p) => p.tags,
  language: (p) => p.language,
  stars: (p) => p.stars,
  contributors: (p) => p.contributors ?? null,
  pushedAt: (p) => p.pushed_at ?? null,
  archived: (p) => p.archived,
  category: (p) => p.category,
  score: (p) => p.score ?? null,
  grade: (p) => p.grade ?? null,
  isFeatured: (p) => p.is_featured,
  isOfficial: (p) => p.is_official,
  isInsider: (p) => p.is_insider,
  isRisky: (p) => p.is_risky,
  riskNote: (p) => p.risk_note ?? null,
  isPlugin: (p) => p.is_plugin ?? null,
  firstSeenAt: (p) => p.first_seen_at ?? null,
  lastSyncedAt: (p) => p.last_synced_at ?? null,
};

function selectDataset(meta, field, doc) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("Dataset requires a selection set");
  }
  const result = Object.create(null);
  for (const child of expand(doc, field.selection)) {
    rejectScalarSelection("Dataset", child);
    if (child.name === "__typename") result[responseKey(child)] = "Dataset";
    else if (child.name === "dataVersion") result[responseKey(child)] = meta.data_version;
    else if (child.name === "asOf") result[responseKey(child)] = meta.as_of;
    else throw new GraphExecError(`Dataset.${child.name} does not exist`);
  }
  return result;
}

function selectFacetValues(field, values, doc) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError(`PluginFacets.${field.name} requires a selection set`);
  }
  const fields = expand(doc, field.selection);
  return values.map((facet) => {
    const entry = Object.create(null);
    for (const child of fields) {
      rejectScalarSelection("PluginFacet", child);
      if (child.name === "__typename") entry[responseKey(child)] = "PluginFacet";
      else if (child.name === "value") entry[responseKey(child)] = facet.value;
      else if (child.name === "count") entry[responseKey(child)] = facet.count;
      else throw new GraphExecError(`PluginFacet.${child.name} does not exist`);
    }
    return entry;
  });
}

function selectPluginFacets(facets, field, doc) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("PluginFacets requires a selection set");
  }
  const result = Object.create(null);
  for (const child of expand(doc, field.selection)) {
    const key = responseKey(child);
    if (Object.hasOwn(result, key)) {
      throw new GraphExecError(`response key ${JSON.stringify(key)} is selected more than once`);
    }
    if (child.name === "__typename") {
      rejectScalarSelection("PluginFacets", child);
      result[key] = "PluginFacets";
    } else if (["categories", "languages", "tags", "grades"].includes(child.name)) {
      result[key] = selectFacetValues(child, facets[child.name], doc);
    } else {
      throw new GraphExecError(`PluginFacets.${child.name} does not exist`);
    }
  }
  return result;
}

function selectRating(field, plugin, doc) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("PluginRating requires a selection set");
  }
  if (plugin.score === null || plugin.score === undefined || plugin.grade === null || plugin.grade === undefined) {
    return null;
  }
  const result = Object.create(null);
  for (const child of expand(doc, field.selection)) {
    rejectScalarSelection("PluginRating", child);
    if (child.name === "__typename") result[responseKey(child)] = "PluginRating";
    else if (child.name === "score") result[responseKey(child)] = plugin.score;
    else if (child.name === "grade") result[responseKey(child)] = plugin.grade;
    else if (child.name === "calculatedAt") result[responseKey(child)] = plugin.scored_at ?? null;
    else if (child.name === "version") result[responseKey(child)] = plugin.score_version ?? null;
    else throw new GraphExecError(`PluginRating.${child.name} does not exist`);
  }
  return result;
}

function selectInstall(field, install, doc) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("Install requires a selection set");
  }
  const result = Object.create(null);
  for (const child of expand(doc, field.selection)) {
    rejectScalarSelection("Install", child);
    const key = responseKey(child);
    if (child.name === "__typename") result[key] = "Install";
    else if (child.name === "cmd") result[key] = install.cmd ?? null;
    else if (child.name === "source") result[key] = install.source;
    else if (child.name === "kind") result[key] = install.kind ?? null;
    else if (child.name === "pkgName") result[key] = install.pkg_name ?? null;
    else if (child.name === "npmPublished") result[key] = install.npm_published;
    // Go 侧是空串转 null（字段是普通 string）；产物里空值直接省略，语义一致
    else if (child.name === "releaseTgzUrl") result[key] = install.release_tgz_url || null;
    else if (child.name === "releaseTag") result[key] = install.release_tag || null;
    else if (child.name === "probedAt") result[key] = install.probed_at ?? null;
    else throw new GraphExecError(`Install.${child.name} does not exist`);
  }
  return result;
}

/**
 * highlights 的口径（照抄 store 层的宽容解析）：列 NULL / 空串 / 解析失败 → null；
 * 合法字符串数组 → 原样（含空数组 []）。
 */
function i18nHighlights(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
    return null;
  } catch {
    return null;
  }
}

function selectI18nEntry(selection, locale, entry, doc) {
  const result = Object.create(null);
  for (const field of expand(doc, selection)) {
    rejectScalarSelection("PluginI18n", field);
    if (field.name === "__typename") result[responseKey(field)] = "PluginI18n";
    else if (field.name === "locale") result[responseKey(field)] = locale;
    else if (field.name === "description") result[responseKey(field)] = entry.description ?? null;
    else if (field.name === "intro") result[responseKey(field)] = entry.intro ?? null;
    else if (field.name === "highlights") result[responseKey(field)] = i18nHighlights(entry.highlights);
    else if (field.name === "updatedAt") result[responseKey(field)] = entry.updated_at || null;
    else throw new GraphExecError(`PluginI18n.${field.name} does not exist`);
  }
  return result;
}

function selectI18n(field, entries, doc, variables) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("PluginI18n requires a selection set");
  }
  const onlyLocale = optionalString(field, "locale", variables);
  const locales = [...(entries?.keys() ?? [])].filter((l) => onlyLocale === null || onlyLocale === l).sort();
  return locales.map((locale) => selectI18nEntry(field.selection, locale, entries.get(locale), doc));
}

function visibleSnapshots(all, days) {
  if (all.length === 0) return [];
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  let start = 0;
  while (start < all.length && all[start].date < cutoff) start++;
  return all.slice(start);
}

function selectSnapshots(field, all, doc, variables) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("PluginSnapshot requires a selection set");
  }
  const days = intArg(field, "days", variables, 30, 90);
  return visibleSnapshots(all, days).map((snapshot) => {
    const result = Object.create(null);
    for (const child of expand(doc, field.selection)) {
      rejectScalarSelection("PluginSnapshot", child);
      if (child.name === "__typename") result[responseKey(child)] = "PluginSnapshot";
      else if (child.name === "date") result[responseKey(child)] = snapshot.date;
      else if (child.name === "stars") result[responseKey(child)] = snapshot.stars;
      else if (child.name === "contributors") result[responseKey(child)] = snapshot.contributors;
      else if (child.name === "pushedAt") result[responseKey(child)] = snapshot.pushed_at;
      else throw new GraphExecError(`PluginSnapshot.${child.name} does not exist`);
    }
    return result;
  });
}

function selectGrowth(plugin, snapshots, field, doc) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("PluginGrowth requires a selection set");
  }
  const growth = computeGrowth(
    { stars: plugin.stars, contributors: plugin.contributors ?? null },
    snapshots,
  );
  const result = Object.create(null);
  for (const child of expand(doc, field.selection)) {
    rejectScalarSelection("PluginGrowth", child);
    if (child.name === "__typename") result[responseKey(child)] = "PluginGrowth";
    else if (child.name === "windowDays") result[responseKey(child)] = growth.window_days;
    else if (child.name === "stars") result[responseKey(child)] = growth.stars;
    else if (child.name === "contributors") result[responseKey(child)] = growth.contributors;
    else throw new GraphExecError(`PluginGrowth.${child.name} does not exist`);
  }
  return result;
}

function selectPageInfo(field, end, total, version, signature, doc) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("PageInfo requires a selection set");
  }
  const result = Object.create(null);
  for (const child of expand(doc, field.selection)) {
    rejectScalarSelection("PageInfo", child);
    if (child.name === "__typename") result[responseKey(child)] = "PageInfo";
    else if (child.name === "hasNextPage") result[responseKey(child)] = end < total;
    else if (child.name === "endCursor") {
      result[responseKey(child)] = end === 0 ? null : encodeCursor(end, version, signature);
    } else throw new GraphExecError(`PageInfo.${child.name} does not exist`);
  }
  return result;
}

function selectPlugin(plugin, selection, doc, variables, prefetch) {
  if (!selection || selection.length === 0) {
    throw new GraphExecError("Plugin requires a selection set");
  }
  const result = Object.create(null);
  for (const field of expand(doc, selection)) {
    const key = responseKey(field);
    if (Object.hasOwn(result, key)) {
      throw new GraphExecError(`response key ${JSON.stringify(key)} is selected more than once`);
    }
    if (Object.hasOwn(PLUGIN_SCALARS, field.name)) {
      rejectScalarSelection("Plugin", field);
      result[key] = PLUGIN_SCALARS[field.name](plugin);
    } else if (field.name === "rating") {
      result[key] = selectRating(field, plugin, doc);
    } else if (field.name === "install") {
      result[key] = selectInstall(field, plugin.install, doc);
    } else if (field.name === "i18n") {
      result[key] = selectI18n(field, prefetch.i18n.get(plugin.full_name), doc, variables);
    } else if (field.name === "snapshots") {
      result[key] = selectSnapshots(field, prefetch.snapshots.get(plugin.full_name) ?? [], doc, variables);
    } else if (field.name === "growth") {
      result[key] = selectGrowth(plugin, prefetch.snapshots.get(plugin.full_name) ?? [], field, doc);
    } else {
      throw new GraphExecError(`Plugin.${field.name} does not exist`);
    }
  }
  return result;
}

// ── 过滤：graphPluginFilter ──────────────────────────────────────────────────

/**
 * 返回 {norm, sig}：norm 是给 filterListIndices 的归一化形态（language/owner/tag
 * 小写），sig 保留**原样**值——游标签名 hash 的是用户传入的原始字符串，
 * 归一化只发生在比较时（EqualFold）。
 */
function buildPluginFilter(field, variables) {
  const empty = {
    category: "", language: "", grade: "", keyword: "", owner: "", tag: "",
    minScore: null, featured: null, official: null, archived: null,
    insider: null, risky: null, hasInstall: null, isPlugin: null,
  };
  const sig = { ...empty };
  if (!hasArg(field, "filter")) return { norm: normalizeFilter(sig), sig };
  const resolved = resolveValue(argOf(field, "filter"), variables);
  if (resolved === null || resolved === undefined) return { norm: normalizeFilter(sig), sig };
  if (typeof resolved !== "object" || Array.isArray(resolved)) {
    throw new GraphExecError("plugins.filter must be an object");
  }
  for (const [name, target] of [
    ["category", "category"], ["language", "language"], ["grade", "grade"],
    ["q", "keyword"], ["owner", "owner"], ["tag", "tag"],
  ]) {
    const v = resolved[name];
    if (v !== undefined && v !== null) {
      if (typeof v !== "string") throw new GraphExecError(`plugins.filter.${name} must be a string`);
      sig[target] = v;
    }
  }
  sig.grade = sig.grade.toUpperCase();
  // 顺序照 Go：先截 64 码点，再 TrimSpace，再小写（与 REST 的 q 口径不同，别混）
  sig.keyword = goTrimSpace(truncateRunes(sig.keyword, MAX_KEYWORD_RUNES)).toLowerCase();
  for (const name of ["featured", "official", "archived", "insider", "risky", "hasInstall", "isPlugin"]) {
    const v = resolved[name];
    if (v !== undefined && v !== null) {
      if (typeof v !== "boolean") throw new GraphExecError(`plugins.filter.${name} must be a boolean`);
      sig[name] = v;
    }
  }
  const minScore = resolved.minScore;
  if (minScore !== undefined && minScore !== null) {
    if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) {
      throw new GraphExecError("plugins.filter.minScore must be an integer between 0 and 100");
    }
    sig.minScore = minScore;
  }
  return { norm: normalizeFilter(sig), sig };
}

const normalizeFilter = (sig) => ({
  ...sig,
  language: sig.language.toLowerCase(),
  owner: sig.owner.toLowerCase(),
  tag: sig.tag.toLowerCase(),
});

const filterIsEmpty = (sig) =>
  sig.category === "" && sig.language === "" && sig.grade === "" && sig.keyword === "" &&
  sig.owner === "" && sig.tag === "" && sig.minScore === null && sig.featured === null &&
  sig.official === null && sig.archived === null && sig.insider === null && sig.risky === null &&
  sig.hasInstall === null && sig.isPlugin === null;

// ── connection 与根执行 ──────────────────────────────────────────────────────

const parseRow = (catalog, i) => {
  const [s, e] = catalog.full.offsets[i];
  return JSON.parse(decoder.decode(catalog.full.buf.subarray(s, e)));
};

async function selectConnection(env, catalog, field, doc, variables) {
  if (!field.selection || field.selection.length === 0) {
    throw new GraphExecError("PluginConnection requires a selection set");
  }
  const { norm, sig } = buildPluginFilter(field, variables);
  const sortBy = enumArg(field, "sort", variables, "DEFAULT");
  const order = enumArg(field, "order", variables, "DESC");

  // 过滤/排序才需要 facets；裸 connection 用目录原序（= Go 的快照原序）
  let indices = null;
  if (!filterIsEmpty(sig)) {
    const facets = await getListFacets(env);
    indices = filterListIndices(facets, norm);
  }
  if (sortBy !== "DEFAULT") {
    const mapped = { STARS: "stars", UPDATED: "updated", SCORE: "score", NAME: "name" }[sortBy];
    if (!mapped) throw new GraphExecError(`unsupported plugins.sort ${JSON.stringify(sortBy)}`);
    const mappedOrder = { ASC: "asc", DESC: "desc" }[order];
    if (!mappedOrder) throw new GraphExecError(`unsupported plugins.order ${JSON.stringify(order)}`);
    const facets = await getListFacets(env);
    indices ??= Array.from({ length: catalog.full.offsets.length }, (_, i) => i);
    sortListIndices(indices, facets, mapped, mappedOrder);
  } else if (order !== "ASC" && order !== "DESC") {
    throw new GraphExecError(`unsupported plugins.order ${JSON.stringify(order)}`);
  }
  const total = indices === null ? catalog.full.offsets.length : indices.length;
  const signature = await connectionSignature(sig, sortBy, order);

  const first = intArg(field, "first", variables, DEFAULT_FIRST, MAX_FIRST);
  const after = optionalString(field, "after", variables);
  let start = 0;
  if (after !== null) {
    start = decodeCursor(after, catalog.meta.data_version, signature);
    if (start > total) throw new GraphExecError("after cursor is outside this result set");
  }
  const end = Math.min(start + first, total);

  const result = Object.create(null);
  for (const child of expand(doc, field.selection)) {
    const key = responseKey(child);
    if (Object.hasOwn(result, key)) {
      throw new GraphExecError(`response key ${JSON.stringify(key)} is selected more than once`);
    }
    switch (child.name) {
      case "__typename":
        rejectScalarSelection("PluginConnection", child);
        result[key] = "PluginConnection";
        break;
      case "totalCount":
        rejectScalarSelection("PluginConnection", child);
        result[key] = total;
        break;
      case "dataVersion":
        rejectScalarSelection("PluginConnection", child);
        result[key] = catalog.meta.data_version;
        break;
      case "asOf":
        rejectScalarSelection("PluginConnection", child);
        result[key] = catalog.meta.as_of;
        break;
      case "nodes": {
        if (!child.selection || child.selection.length === 0) {
          throw new GraphExecError("PluginConnection.nodes requires a selection set");
        }
        const rows = [];
        for (let i = start; i < end; i++) rows.push(parseRow(catalog, indices === null ? i : indices[i]));
        const prefetch = await prefetchPluginFields(env, rows, child.selection, doc);
        result[key] = rows.map((row) => selectPlugin(row, child.selection, doc, variables, prefetch));
        break;
      }
      case "pageInfo":
        result[key] = selectPageInfo(child, end, total, catalog.meta.data_version, signature, doc);
        break;
      default:
        throw new GraphExecError(`PluginConnection.${child.name} does not exist`);
    }
  }
  return result;
}

async function execute(env, req) {
  const doc = parseGraphDocument(req.query, MAX_DEPTH);
  const op = (() => {
    try {
      return selectOperation(doc, req.operationName ?? "");
    } catch (err) {
      throw new GraphExecError(err.message);
    }
  })();
  if (op.kind !== "query") throw new GraphExecError("only query operations are supported");

  const catalog = await getCatalog(env);
  const fields = expand(doc, op.selection);
  if (fields.length > MAX_ROOT_FIELDS) {
    throw new GraphExecError(`query selects too many root fields (maximum ${MAX_ROOT_FIELDS})`);
  }
  const pluginDataResolvers = fields.filter((f) => f.name === "plugins" || f.name === "plugin").length;
  if (pluginDataResolvers > MAX_PLUGIN_DATA_RESOLVERS) {
    throw new GraphExecError(`query may select at most ${MAX_PLUGIN_DATA_RESOLVERS} plugin data resolver`);
  }

  const result = Object.create(null);
  for (const field of fields) {
    const key = responseKey(field);
    if (Object.hasOwn(result, key)) {
      throw new GraphExecError(`response key ${JSON.stringify(key)} is selected more than once`);
    }
    if (field.name === "__typename") {
      rejectScalarSelection("Query", field);
      result[key] = "Query";
    } else if (field.name === "dataset") {
      result[key] = selectDataset(catalog.meta, field, doc);
    } else if (field.name === "plugin") {
      const fullName = requiredString(field, "fullName", variablesOf(req));
      const index = await getDetailIndex(env);
      const row = index[fullName.toLowerCase()];
      if (row === undefined) {
        // 找不到时不展开选择集：{ plugin(fullName:"没有的") { ...Missing } } 也返回 null
        result[key] = null;
        continue;
      }
      const plugin = parseRow(catalog, row);
      const prefetch = await prefetchPluginFields(env, [plugin], field.selection ?? [], doc);
      result[key] = selectPlugin(plugin, field.selection ?? [], doc, variablesOf(req), prefetch);
    } else if (field.name === "plugins") {
      result[key] = await selectConnection(env, catalog, field, doc, variablesOf(req));
    } else if (field.name === "pluginFacets") {
      result[key] = selectPluginFacets(await getGraphqlFacets(env), field, doc);
    } else {
      throw new GraphExecError(`Query.${field.name} does not exist`);
    }
  }
  return result;
}

const variablesOf = (req) => req.variables ?? undefined;

// ── HTTP handler ─────────────────────────────────────────────────────────────

export async function handleGraphQLSchema(request) {
  return cacheableResponse(
    request,
    encoder.encode(GRAPHQL_SDL),
    "application/graphql; charset=utf-8",
    SCHEMA_CACHE_CONTROL,
    corsHeaders(),
  );
}

export async function handleGraphQL(request, env, url) {
  let req;
  try {
    if (request.method === "GET" || request.method === "HEAD") {
      req = parseGetQuery(url);
    } else {
      const text = await request.text();
      if (encoder.encode(text).length > MAX_BODY_BYTES) {
        throw new TransportError("http: request body too large");
      }
      req = parsePostBody(text);
    }
  } catch (err) {
    if (!(err instanceof TransportError)) throw err;
    return graphErrorResponse(request, 400, `invalid GraphQL request: ${err.message}`, "no-store");
  }

  // 这两条 400 **没有** Cache-Control——Go 走的是不带头的 writeGraphError
  if (goTrimSpace(req.query) === "") {
    return graphErrorResponse(request, 400, "query is required", null);
  }
  if (encoder.encode(req.query).length > MAX_QUERY_BYTES) {
    return graphErrorResponse(request, 400, "query exceeds 8192 bytes", null);
  }

  let data;
  try {
    data = await execute(env, req);
  } catch (err) {
    if (!isContractError(err)) throw err; // 真 bug 让 worker.mjs 的兜底透传去处理
    return graphErrorResponse(request, 200, err.message, "no-store");
  }

  const body = encoder.encode(goEscape(`{"data":${marshalSorted(data)}}`));
  return cacheableResponse(request, body, "application/json; charset=utf-8", CACHE_CONTROL, corsHeaders());
}
