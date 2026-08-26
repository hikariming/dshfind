/**
 * 内部 D1 写入路由：脚本双写的 D1 通道（方案见 docs/d1-migration-plan.md P3）。
 *
 * 脚本在本机/CI 拿不到 D1 binding，由本路由代执行——binding 的同机房速度，
 * 不吃 Cloudflare API 的全局限速。调用方是 scripts/lib/db.mjs。
 *
 * 鉴权：x-internal-token 头与 Worker secret INTERNAL_DB_TOKEN 比对。
 * 比对走 SHA-256 摘要——两侧长度恒等，逐字节比较不泄露前缀时序。
 * secret 未配置时一律 404，路由对外不可见；错误信息不回显 SQL 与参数。
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** 单次调用的语句上限，与 scripts/lib/db.mjs 的 D1_BATCH_LIMIT 一致。 */
const MAX_STATEMENTS = 100;
/** 单条 SQL 的长度上限（字符）。D1 的硬限制是 100KB，这里收紧到一半。 */
const MAX_SQL_LENGTH = 50_000;

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
}
interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatement;
  batch(
    stmts: D1PreparedStatement[],
  ): Promise<Array<{ results?: unknown[]; meta?: { changes?: number } }>>;
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request): Promise<Response> {
  const expected = process.env.INTERNAL_DB_TOKEN;
  const got = req.headers.get("x-internal-token");
  // secret 未配置视同路由不存在；token 错误也回 404，不给探测者区分信号。
  if (!expected || !got || (await sha256(got)) !== (await sha256(expected))) {
    return json(404, { error: "not found" });
  }

  let payload: { statements?: Array<{ sql?: unknown; args?: unknown }> };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "请求体不是合法 JSON" });
  }

  const statements = payload.statements;
  if (!Array.isArray(statements) || statements.length === 0) {
    return json(400, { error: "statements 必须是非空数组" });
  }
  if (statements.length > MAX_STATEMENTS) {
    return json(400, { error: `statements 上限 ${MAX_STATEMENTS} 条` });
  }
  for (const s of statements) {
    if (typeof s?.sql !== "string" || s.sql.length === 0 || s.sql.length > MAX_SQL_LENGTH) {
      return json(400, { error: "每条语句需要非空且不超长的 sql 字符串" });
    }
    if (s.args !== undefined && !Array.isArray(s.args)) {
      return json(400, { error: "args 必须是数组" });
    }
  }

  let db: D1DatabaseLike | undefined;
  try {
    const ctx = await getCloudflareContext({ async: true });
    db = (ctx.env as { DB?: D1DatabaseLike }).DB;
  } catch {
    /* dev 环境无 binding */
  }
  if (!db) return json(503, { error: "D1 binding 不可用" });

  try {
    const prepared = statements.map((s) => {
      let stmt = db.prepare(s.sql as string);
      const args = (s.args as unknown[] | undefined) ?? [];
      if (args.length > 0) {
        stmt = stmt.bind(...args.map((a) => (typeof a === "boolean" ? (a ? 1 : 0) : a)));
      }
      return stmt;
    });
    // batch 在 D1 侧是原子的：整段成功或整段回滚，不会留半截。
    const results = await db.batch(prepared);
    // rows 供一致性核对等只读调用；写语句的 results 为空数组，不增加响应体积。
    return json(200, {
      results: results.map((r) => ({ changes: r.meta?.changes ?? 0, rows: r.results ?? [] })),
    });
  } catch (err) {
    // 只回错误类别；SQL 与参数不进响应也不进日志（observability 会留存）。
    const msg = err instanceof Error ? err.message : "unknown";
    return json(422, { error: `D1 执行失败：${msg.slice(0, 200)}` });
  }
}
