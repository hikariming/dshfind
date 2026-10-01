/**
 * POST /api/internal/db —— 内部 D1 通道：同步脚本在本机 / CI 拿不到 binding，由本路由代执行
 * （调用方 scripts/lib/db.mjs，D1_INTERNAL_URL 指向这里）。逻辑与老站 app/api/internal/db/route.ts 一致。
 *
 * 鉴权：x-internal-token 与 Worker secret D1_INTERNAL_TOKEN 比对（老站 secret 名为 INTERNAL_DB_TOKEN，同一个值），
 * 走 SHA-256 摘要比较；secret 未配置或 token 错误一律 404，路由对外不可见；错误信息不回显 SQL 与参数。
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

/** 单次调用的语句上限，与 scripts/lib/db.mjs 的 D1_BATCH_LIMIT 一致 */
const MAX_STATEMENTS = 100;
/** 单条 SQL 的长度上限（字符）。D1 的硬限制是 100KB，这里收紧到一半 */
const MAX_SQL_LENGTH = 50_000;

interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
}
interface D1Like {
  prepare(sql: string): D1Stmt;
  batch(stmts: D1Stmt[]): Promise<Array<{ results?: unknown[]; meta?: { changes?: number } }>>;
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export const POST: APIRoute = async ({ request }) => {
  const { D1_INTERNAL_TOKEN: expected, DB: db } = env as unknown as { D1_INTERNAL_TOKEN?: string; DB?: D1Like };
  const got = request.headers.get("x-internal-token");
  if (!expected || !got || (await sha256(got)) !== (await sha256(expected))) return json(404, { error: "not found" });

  let payload: { statements?: Array<{ sql?: unknown; args?: unknown }> };
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "请求体不是合法 JSON" });
  }
  const statements = payload.statements;
  if (!Array.isArray(statements) || statements.length === 0) return json(400, { error: "statements 必须是非空数组" });
  if (statements.length > MAX_STATEMENTS) return json(400, { error: `statements 上限 ${MAX_STATEMENTS} 条` });
  for (const s of statements) {
    if (typeof s?.sql !== "string" || s.sql.length === 0 || s.sql.length > MAX_SQL_LENGTH) {
      return json(400, { error: "每条语句需要非空且不超长的 sql 字符串" });
    }
    if (s.args !== undefined && !Array.isArray(s.args)) return json(400, { error: "args 必须是数组" });
  }
  if (!db) return json(503, { error: "D1 binding 不可用" });

  try {
    const prepared = statements.map((s) => {
      let stmt = db.prepare(s.sql as string);
      const args = (s.args as unknown[] | undefined) ?? [];
      if (args.length > 0) stmt = stmt.bind(...args.map((a) => (typeof a === "boolean" ? (a ? 1 : 0) : a)));
      return stmt;
    });
    // batch 在 D1 侧是原子的：整段成功或整段回滚
    const results = await db.batch(prepared);
    return json(200, { results: results.map((r) => ({ changes: r.meta?.changes ?? 0, rows: r.results ?? [] })) });
  } catch (err) {
    // 只回错误类别；SQL 与参数不进响应也不进日志
    const msg = err instanceof Error ? err.message : "unknown";
    return json(422, { error: `D1 执行失败：${msg.slice(0, 200)}` });
  }
};
