/**
 * 脚本层的统一数据库入口：单库 D1（2026-08-29 起，Turso 已退役）。
 *
 * 迁移史见 docs/d1-migration-plan.md。双写过渡桥已拆：Go 服务与 Turso 一并
 * 退役（S5），本模块只剩 D1 通道。历史数据存档在 ~/dshfind-turso-archive/。
 *
 * D1 通道走站点 Worker 上的内部路由（src/app/api/internal/db/route.ts）：
 * 脚本在本机/CI 拿不到 binding，由 Worker 代执行拿 binding 的速度，
 * 也不吃 Cloudflare API 的全局限速。需要环境变量：
 *   D1_INTERNAL_URL   例 https://dshfind.com/api/internal/db
 *   D1_INTERNAL_TOKEN 与 Worker secret INTERNAL_DB_TOKEN 一致
 *
 * 接口与从前的 @libsql/client 形态对齐（execute / batch 返回 {rows,
 * rowsAffected, columns}），22 个调用方脚本因此一行不改。差异一条：
 * batch 不再有跨语句事务语义边界的选择（D1 的 batch 本身就是原子的）。
 */

/** 会改数据或 schema 的语句。保留导出：单测与个别脚本在用。 */
const WRITE_RE = /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP)\b/i;

/** 内部路由单次调用的语句上限，与 route.ts 的校验一致。 */
export const D1_BATCH_LIMIT = 100;

export function isWriteStatement(sql) {
  return WRITE_RE.test(sql);
}

/** 统一成 {sql, args} 形态；undefined 参数按 null 处理（JSON 序列化的语义）。 */
export function normalizeStatement(stmt) {
  if (typeof stmt === "string") return { sql: stmt, args: [] };
  return { sql: stmt.sql, args: (stmt.args ?? []).map((a) => (a === undefined ? null : a)) };
}

/** 把语句序列切成不超过 limit 的段。 */
export function chunkStatements(stmts, limit = D1_BATCH_LIMIT) {
  const out = [];
  for (let i = 0; i < stmts.length; i += limit) out.push(stmts.slice(i, i + limit));
  return out;
}

function channelConfig() {
  const url = process.env.D1_INTERNAL_URL;
  const token = process.env.D1_INTERNAL_TOKEN;
  if (!url || !token) {
    console.error("缺少 D1_INTERNAL_URL / D1_INTERNAL_TOKEN（用 --env-file=.env.local 运行）");
    process.exit(1);
  }
  return { url, token };
}

/** 发一批语句到内部路由；5xx/网络抖动重试三次。返回 route 的 results 数组。 */
async function sendChunk(url, token, chunk) {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "x-internal-token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ statements: chunk }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status >= 500) {
        lastErr = new Error(`D1 内部路由 HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`D1 内部路由 HTTP ${res.status}：${body.slice(0, 300)}`);
      }
      const { results } = await res.json();
      return results;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** route 的单条结果 → @libsql 形态的 ResultSet。 */
const toResultSet = (r) => ({
  rows: r.rows ?? [],
  rowsAffected: r.changes ?? 0,
  // D1 的行是对象，列名从首行推导；空结果拿不到列名（现有调用方都在非空表上用）
  columns: r.rows?.[0] ? Object.keys(r.rows[0]) : [],
});

/**
 * 直接对 D1 执行语句并返回行。历史上供一致性核对读 D1；现在 openDb 本身
 * 就是 D1，保留只为兼容旧引用。
 */
export async function queryD1(stmts) {
  const { url, token } = channelConfig();
  const results = await sendChunk(url, token, stmts.map(normalizeStatement));
  return results.map((r) => r.rows ?? []);
}

/** 打开 D1 客户端。读写接口与旧 @libsql/client 一致：execute / batch。 */
export function openDb() {
  const { url, token } = channelConfig();
  return {
    async execute(stmt) {
      const [r] = await sendChunk(url, token, [normalizeStatement(stmt)]);
      return toResultSet(r);
    },
    async batch(stmts) {
      const out = [];
      for (const chunk of chunkStatements(stmts.map(normalizeStatement))) {
        const results = await sendChunk(url, token, chunk);
        out.push(...results.map(toResultSet));
      }
      return out;
    },
  };
}
