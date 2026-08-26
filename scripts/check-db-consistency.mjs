/**
 * 双写一致性核对：逐表对比 Turso 与 D1 的行数与聚合校验和。
 *
 * 阶段一闸门工具（docs/d1-migration-plan.md §4）：refresh-site 跑完后执行，
 * 任何一项不一致即退出码 1——双写期两库必须逐字节等价，漂移说明
 * scripts/lib/db.mjs 的双写通道有洞或有人绕过它直写了库。
 *
 * 用法：node --env-file=.env.local scripts/check-db-consistency.mjs
 * 需要 D1_INTERNAL_URL / D1_INTERNAL_TOKEN（读 D1 经站点 Worker 内部路由）。
 */
import { openDb, queryD1 } from "./lib/db.mjs";

/** 表 → 校验 SQL。COUNT 之外再挂一个内容敏感的聚合，捕捉「行数相同但内容漂移」。 */
const CHECKS = {
  plugins:
    "SELECT COUNT(*) AS n, COALESCE(SUM(stars),0) AS s, COALESCE(SUM(LENGTH(description)),0) AS d FROM plugins",
  plugin_i18n:
    "SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(COALESCE(intro,''))+LENGTH(COALESCE(description,''))),0) AS s, 0 AS d FROM plugin_i18n",
  plugin_snapshots:
    "SELECT COUNT(*) AS n, COALESCE(SUM(stars),0) AS s, 0 AS d FROM plugin_snapshots",
  plugin_images:
    "SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(COALESCE(source_url,''))),0) AS s, 0 AS d FROM plugin_images",
  docs_pages:
    "SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(body)),0) AS s, COALESCE(SUM(is_translated),0) AS d FROM docs_pages",
  sync_runs: "SELECT COUNT(*) AS n, COALESCE(MAX(id),0) AS s, 0 AS d FROM sync_runs",
};

const db = openDb();
const tables = Object.keys(CHECKS);
const d1Rows = await queryD1(tables.map((t) => CHECKS[t]));

let bad = 0;
for (let i = 0; i < tables.length; i++) {
  const t = tables[i];
  const turso = (await db.execute(CHECKS[t])).rows[0];
  const d1 = d1Rows[i][0] ?? {};
  const same = ["n", "s", "d"].every((k) => Number(turso[k]) === Number(d1[k]));
  if (same) {
    console.log(`✓ ${t}: ${turso.n} 行一致`);
  } else {
    bad++;
    console.error(
      `✗ ${t} 漂移: Turso {n:${turso.n}, s:${turso.s}, d:${turso.d}} vs D1 {n:${d1.n}, s:${d1.s}, d:${d1.d}}`,
    );
  }
}
if (bad > 0) {
  console.error(`\n${bad} 张表不一致——先修双写再继续，别带着漂移进闸门`);
  process.exit(1);
}
console.log("\n两库一致");
