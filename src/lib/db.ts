/**
 * 数据库客户端：D1 binding 优先，Turso HTTP 兜底。
 *
 * 业务库已迁到 Cloudflare D1（迁移方案见 docs/d1-migration-plan.md）。
 * 生产 Worker 里走 env.DB binding——同机房调用，没有跨网往返。
 *
 * 两种场景拿不到 binding，此时回退到原有的 Turso HTTP 路径：
 *   1. `next dev` / `next build`：不在 workerd 里，getCloudflareContext 会抛错。
 *      双写期（scripts/lib/db.mjs 同时写 Turso 与 D1）两库数据一致，回退无损。
 *   2. 生产环境 binding 误删：Turso 兜底顶上，页面不至于集体 500。
 *   Go 服务退役、双写停止后（阶段二 S5），Turso 路径连同这段注释一并删除。
 *
 * Turso 路径为什么手写 HTTP 而不用 @libsql/client：它的 web 入口即使只走
 * HTTP，也会把 @libsql/hrana-client → isomorphic-ws 的 WebSocket 链路拖进
 * 依赖图，esbuild 按 workerd 条件解析时 "Could not resolve"。Turso 的 HTTP
 * 协议就是一个带 Bearer 头的 JSON POST，整个 @libsql 依赖树随之消失。
 *
 * 仅供服务端使用。TURSO_AUTH_TOKEN 没有 NEXT_PUBLIC_ 前缀，Next 不会把它
 * 烤进客户端 bundle。抛错时只带 HTTP 状态与响应体，绝不带请求头——
 * Worker 开了 observability，日志会留存。
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

/** 单条查询的硬超时（仅 Turso 兜底路径）。外层 plugins-db 也有 20s 兜底，
 *  但那只让 Promise 提前 reject、不会真正掐断 fetch；这里用 AbortSignal
 *  让连接实际关闭。D1 binding 调用同机房、自带 30s 上限，不需要这层。 */
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

// ---------- D1 binding 路径 ----------

/** 结构化描述 D1 的最小接口，避免依赖 gitignore 的 cloudflare-env.d.ts 生成物。 */
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all(): Promise<{ results: Record<string, unknown>[] }>;
}
interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatement;
}

/**
 * 拿 D1 binding；不在 workerd 里（dev/build）返回 null 走兜底。
 * async 模式兼容 SSG/ISR 的预渲染上下文。
 */
async function getD1(): Promise<D1DatabaseLike | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as { DB?: D1DatabaseLike }).DB;
    return db ?? null;
  } catch {
    return null;
  }
}

/** D1 绑定参数：布尔转 0/1（与 SQLite 存储一致），bigint 收窄为 number。 */
function toD1Arg(arg: unknown): unknown {
  if (typeof arg === "boolean") return arg ? 1 : 0;
  if (typeof arg === "bigint") return Number(arg);
  return arg;
}

async function executeD1(
  db: D1DatabaseLike,
  sql: string,
  args: unknown[],
): Promise<ResultSet> {
  let stmt = db.prepare(sql);
  if (args.length > 0) stmt = stmt.bind(...args.map(toD1Arg));
  const { results } = await stmt.all();
  // D1 的整数列原生返回 number，无需 Turso 路径那样的 decode。
  return { rows: results as Row[] };
}

// ---------- Turso HTTP 兜底路径 ----------

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
      throw new Error("无 D1 binding 且缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 环境变量");
    }
    // libsql:// 是 WebSocket 方言的 scheme，HTTP 端点用 https://。
    endpoint = `${url.replace(/^libsql:\/\//, "https://").replace(/\/+$/, "")}/v2/pipeline`;
    authToken = token;
  }
  return { endpoint, authToken };
}

async function executeTurso(sql: string, args: unknown[]): Promise<ResultSet> {
  const { endpoint, authToken } = config();

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

// ---------- 统一入口 ----------

async function execute(
  stmt: string | { sql: string; args?: unknown[] },
): Promise<ResultSet> {
  const sql = typeof stmt === "string" ? stmt : stmt.sql;
  const args = typeof stmt === "string" ? [] : (stmt.args ?? []);

  const d1 = await getD1();
  if (d1) return executeD1(d1, sql, args);
  return executeTurso(sql, args);
}

const db: Db = { execute };

export function getDb(): Db {
  return db;
}
