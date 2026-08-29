/**
 * 数据库客户端：D1 binding 优先，内部路由兜底。
 *
 * 业务库在 Cloudflare D1（迁移方案见 docs/d1-migration-plan.md；Turso 已于
 * 2026-08-29 退役，历史存档在运维机 ~/dshfind-turso-archive/）。
 * 生产 Worker 里走 env.DB binding——同机房调用，没有跨网往返。
 *
 * 两种场景拿不到 binding，此时回退到站点 Worker 的内部路由
 * （src/app/api/internal/db/route.ts，需 D1_INTERNAL_URL / D1_INTERNAL_TOKEN）：
 *   1. `next dev` / `next build`：不在 workerd 里，getCloudflareContext 会抛错。
 *   2. 生产环境 binding 误删：内部路由顶上，页面不至于集体 500。
 * 连内部路由的配置都没有时直接抛错——上层（plugins-db.ts 等）会落到构建期
 * 静态快照兜底，页面照常渲染，只是数据停在上次生成时。
 *
 * 仅供服务端使用。D1_INTERNAL_TOKEN 没有 NEXT_PUBLIC_ 前缀，Next 不会把它
 * 烤进客户端 bundle。抛错时只带 HTTP 状态与响应体，绝不带请求头。
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

/** 单条查询的硬超时（仅内部路由兜底路径）。 */
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

// ---------- 内部路由兜底路径 ----------

async function executeInternal(sql: string, args: unknown[]): Promise<ResultSet> {
  const url = process.env.D1_INTERNAL_URL;
  const token = process.env.D1_INTERNAL_TOKEN;
  if (!url || !token) {
    throw new Error("无 D1 binding 且缺少 D1_INTERNAL_URL / D1_INTERNAL_TOKEN（上层将落静态兜底）");
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-internal-token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ statements: [{ sql, args: args.map(toD1Arg) }] }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`D1 内部路由 HTTP ${res.status}：${body.slice(0, 300)}`);
  }
  const payload = (await res.json()) as { results?: Array<{ rows?: Row[] }> };
  return { rows: payload.results?.[0]?.rows ?? [] };
}

// ---------- 统一入口 ----------

async function execute(
  stmt: string | { sql: string; args?: unknown[] },
): Promise<ResultSet> {
  const sql = typeof stmt === "string" ? stmt : stmt.sql;
  const args = typeof stmt === "string" ? [] : (stmt.args ?? []);

  const d1 = await getD1();
  if (d1) return executeD1(d1, sql, args);
  return executeInternal(sql, args);
}

const db: Db = { execute };

export function getDb(): Db {
  return db;
}
