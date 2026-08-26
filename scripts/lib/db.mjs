/**
 * 脚本层的统一数据库入口：读走 Turso（现阶段权威），写双落 Turso + D1。
 *
 * 迁移方案见 docs/d1-migration-plan.md。双写是阶段一的过渡桥：Go 服务的
 * 内存快照仍从 Turso 加载，前端与 API Worker 已读 D1；两边都要保持新鲜。
 * Go 退役（阶段二 S5）后，删掉 Turso 分支，本模块只剩 D1 通道。
 *
 * D1 通道走站点 Worker 上的内部路由（src/app/api/internal/db/route.ts）：
 * 脚本在本机/CI 拿不到 binding，由 Worker 代执行拿 binding 的速度，
 * 也不吃 Cloudflare API 的全局限速。需要环境变量：
 *   D1_INTERNAL_URL   例 https://dshfind.com/api/internal/db
 *   D1_INTERNAL_TOKEN 与 Worker secret INTERNAL_DB_TOKEN 一致
 * 未配置或路由 404（尚未部署）时告警并跳过 D1，脚本不断——但双写不生效，
 * refresh-site 的一致性核对会兜住漂移。其余 D1 错误默认抛出（宁可停下也
 * 不让两库悄悄分叉）；D1_WRITE_BESTEFFORT=1 可降级为告警。
 *
 * 接口与 @libsql/client 对齐（execute / batch），返回值取 Turso 的结果，
 * rowsAffected 等元信息因此保持原语义。
 */
import { createClient } from "@libsql/client/web";

/** 会改数据或 schema 的语句才需要双写；SELECT/PRAGMA 只打 Turso。 */
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

function makeD1Channel() {
  const url = process.env.D1_INTERNAL_URL;
  const token = process.env.D1_INTERNAL_TOKEN;
  const bestEffort = process.env.D1_WRITE_BESTEFFORT === "1";
  let disabled = !url || !token;
  let warned = false;

  const warnOnce = (msg) => {
    if (!warned) {
      warned = true;
      console.warn(`[db] D1 双写未生效：${msg}——本轮只写 Turso，跑完后需核对两库一致性`);
    }
  };
  if (disabled) {
    return {
      async send() {
        warnOnce("缺少 D1_INTERNAL_URL / D1_INTERNAL_TOKEN");
      },
    };
  }

  return {
    async send(stmts) {
      if (disabled) return warnOnce("内部路由不可用");
      for (const chunk of chunkStatements(stmts)) {
        let lastErr = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: { "x-internal-token": token, "Content-Type": "application/json" },
              body: JSON.stringify({ statements: chunk }),
              signal: AbortSignal.timeout(30_000),
            });
            if (res.status === 404) {
              // 路由尚未随站点部署上线：不是数据错误，降级告警继续。
              disabled = true;
              return warnOnce("内部路由 404（站点尚未部署该路由）");
            }
            if (res.status >= 500) {
              lastErr = new Error(`D1 内部路由 HTTP ${res.status}`);
              continue; // 5xx 重试
            }
            if (!res.ok) {
              const body = await res.text().catch(() => "");
              throw new Error(`D1 内部路由 HTTP ${res.status}：${body.slice(0, 300)}`);
            }
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (lastErr) {
          if (bestEffort) {
            console.warn(`[db] D1 写入失败（best-effort 已降级）：${lastErr.message}`);
            return;
          }
          throw lastErr;
        }
      }
    },
  };
}

/**
 * 直接对 D1 执行语句并返回行（经内部路由）。给一致性核对等
 * 明确要读 D1 的场景用；日常读仍走 openDb()（Turso 权威）。
 */
export async function queryD1(stmts) {
  const url = process.env.D1_INTERNAL_URL;
  const token = process.env.D1_INTERNAL_TOKEN;
  if (!url || !token) throw new Error("缺少 D1_INTERNAL_URL / D1_INTERNAL_TOKEN");
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-internal-token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ statements: stmts.map(normalizeStatement) }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`D1 内部路由 HTTP ${res.status}：${body.slice(0, 300)}`);
  }
  const { results } = await res.json();
  return results.map((r) => r.rows ?? []);
}

/**
 * 打开双写客户端。读写接口与 @libsql/client 一致：
 *   execute(sql | {sql, args}) / batch(stmts, mode)
 */
export function openDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN（用 --env-file=.env.local 运行）");
    process.exit(1);
  }
  // libsql:// 是 WebSocket 方言的 scheme，无状态 HTTP 用 https://。
  const turso = createClient({
    url: url.replace(/^libsql:\/\//, "https://"),
    authToken,
  });
  const d1 = makeD1Channel();

  return {
    async execute(stmt) {
      const norm = normalizeStatement(stmt);
      // Turso 在前：它仍是权威，失败就整体失败，不会出现只写了 D1 的状态。
      const rs = await turso.execute(stmt);
      if (isWriteStatement(norm.sql)) await d1.send([norm]);
      return rs;
    },
    async batch(stmts, mode = "write") {
      const rs = await turso.batch(stmts, mode);
      const writes = stmts.map(normalizeStatement).filter((s) => isWriteStatement(s.sql));
      if (writes.length > 0) await d1.send(writes);
      return rs;
    },
  };
}
