/**
 * Turso（libSQL）的最小 HTTP 客户端——只实现本站用到的那点能力。
 *
 * 为什么不用 @libsql/client：它的 web 入口即使只走 HTTP，也会把
 * @libsql/hrana-client → @libsql/isomorphic-ws 这条 WebSocket 链路拖进依赖图。
 * 打 Cloudflare Worker 包时 esbuild 按 workerd 条件解析，要的是
 * isomorphic-ws 的 web.mjs，而 Next 的文件追踪是按 node 条件做的、没把它拷进产物，
 * 于是 bundle 阶段直接 "Could not resolve"。
 *
 * 本站从一开始就只想要无状态 HTTP（serverless 里连接不复用，WS 握手是白付的成本），
 * 所以与其去斗打包条件，不如直接说 Turso 的 HTTP 协议——
 * 它就是一个带 Bearer 头的 JSON POST，整个 @libsql 依赖树随之消失。
 *
 * 仅供服务端使用。TURSO_AUTH_TOKEN 没有 NEXT_PUBLIC_ 前缀，Next 不会把它
 * 烤进客户端 bundle；调用链（plugins-db → 服务端页面/route handler）也不含
 * 任何 client component。抛错时只带 HTTP 状态与响应体，绝不带请求头——
 * Worker 开了 observability，日志会留存。
 */

/** 单条查询的硬超时。外层 plugins-db 也有 20s 兜底，但那只让 Promise 提前 reject、
 *  不会真正掐断 fetch；这里用 AbortSignal 让连接实际关闭。 */
const REQUEST_TIMEOUT_MS = 20_000;

/** 列值只会是这三种：本站没有 blob 列。 */
export type Value = string | number | null;

/** 一行 = 列名到值的映射，与 @libsql/client 的具名取值行为一致。 */
export type Row = Record<string, Value>;

export interface ResultSet {
  rows: Row[];
}

export interface Db {
  execute(stmt: string | { sql: string; args?: unknown[] }): Promise<ResultSet>;
}

/** Turso 线上格式的值。integer 走字符串传输以免 JSON 丢精度。 */
type WireValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "float"; value: number }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string };

/**
 * 线上值 → JS 值。
 *
 * integer 必须还原成真正的 number，不能留着字符串：调用方用
 * `Boolean(r.archived)` 判布尔列，而 `Boolean("0")` 是 true——
 * 留字符串会让 archived / is_featured / is_risky 这些标记集体翻转。
 * 这也是 @libsql/client 默认 intMode:"number" 的行为。
 */
function decode(v: WireValue): Value {
  switch (v.type) {
    case "null":
      return null;
    case "integer":
      return Number(v.value);
    case "float":
      return v.value;
    case "text":
      return v.value;
    case "blob":
      // 本站无 blob 列；真出现了宁可显式报错，也不要悄悄塞个错值进页面。
      throw new Error("Turso 返回了 blob 列，本客户端不支持");
  }
}

/** JS 参数 → 线上值。本站的绑定参数目前只有字符串（full_name）。 */
function encode(arg: unknown): WireValue {
  if (arg === null || arg === undefined) return { type: "null" };
  if (typeof arg === "string") return { type: "text", value: arg };
  if (typeof arg === "boolean") {
    return { type: "integer", value: arg ? "1" : "0" };
  }
  if (typeof arg === "bigint") return { type: "integer", value: String(arg) };
  if (typeof arg === "number") {
    return Number.isInteger(arg)
      ? { type: "integer", value: String(arg) }
      : { type: "float", value: arg };
  }
  throw new Error(`不支持的绑定参数类型：${typeof arg}`);
}

let endpoint: string | null = null;
let authToken: string | null = null;

function config(): { endpoint: string; authToken: string } {
  if (!endpoint || !authToken) {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    if (!url || !token) {
      throw new Error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 环境变量");
    }
    // libsql:// 是 WebSocket 方言的 scheme，HTTP 端点用 https://。
    endpoint = `${url.replace(/^libsql:\/\//, "https://").replace(/\/+$/, "")}/v2/pipeline`;
    authToken = token;
  }
  return { endpoint, authToken };
}

async function execute(
  stmt: string | { sql: string; args?: unknown[] },
): Promise<ResultSet> {
  const { endpoint, authToken } = config();
  const sql = typeof stmt === "string" ? stmt : stmt.sql;
  const args = typeof stmt === "string" ? [] : (stmt.args ?? []);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    // close 与查询同批发出，避免留下未关闭的 stream（Turso 会按 baton 计活跃流）。
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql, args: args.map(encode) } },
        { type: "close" },
      ],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    // 只带状态码与响应体；请求头（含 Bearer token）绝不进错误信息。
    const body = await res.text().catch(() => "");
    throw new Error(`Turso HTTP ${res.status}：${body.slice(0, 300)}`);
  }

  const payload = (await res.json()) as {
    results?: Array<
      | { type: "ok"; response: { result?: { cols: Array<{ name: string }>; rows: WireValue[][] } } }
      | { type: "error"; error: { message?: string } }
    >;
  };

  const first = payload.results?.[0];
  if (!first) throw new Error("Turso 返回了空的 results");
  if (first.type === "error") {
    throw new Error(`Turso 查询失败：${first.error?.message ?? "未知错误"}`);
  }

  const result = first.response.result;
  if (!result) return { rows: [] };

  const names = result.cols.map((c) => c.name);
  const rows = result.rows.map((cells) => {
    const row: Row = {};
    for (let i = 0; i < names.length; i++) row[names[i]] = decode(cells[i]);
    return row;
  });
  return { rows };
}

const db: Db = { execute };

export function getDb(): Db {
  return db;
}
