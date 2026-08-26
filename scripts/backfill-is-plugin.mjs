#!/usr/bin/env node
/**
 * 一次性回填 plugins.is_plugin（插件归属）：
 *
 *   1  = 确认是 DSH 插件：探测发现 package.json 声明了 dsh.bundle（has_bundle = 1）
 *   0  = 确认非插件：探测判定 install_kind = 'not-installable'（无清单 / 无 bundle）
 *   NULL = 未探测或证据不足，保持未知（API 不过滤未知条目）
 *
 * 人工标记（is_plugin_manual = 1）的行一律不碰；之后由 probe-install.mjs 在每次
 * 探测时持续维护（规则与本脚本一致），无需重复运行本脚本。
 *
 * 用法：
 *   node --env-file=.env.local scripts/backfill-is-plugin.mjs            # 写库
 *   node --env-file=.env.local scripts/backfill-is-plugin.mjs --dry-run  # 只打印统计
 */
import { openDb } from "./lib/db.mjs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN（用 --env-file=.env.local 运行）");
  process.exit(1);
}
const client = openDb();
const dryRun = process.argv.includes("--dry-run");

// 列可能还没建（早于 server 迁移运行），duplicate column 忽略即可
for (const sql of [
  `ALTER TABLE plugins ADD COLUMN is_plugin INTEGER`,
  `ALTER TABLE plugins ADD COLUMN is_plugin_manual INTEGER NOT NULL DEFAULT 0`,
]) {
  try {
    await client.execute(sql);
  } catch (err) {
    if (!/duplicate column/i.test(String(err?.message ?? err))) throw err;
  }
}

const before = (
  await client.execute(
    `SELECT
       SUM(CASE WHEN is_plugin = 1 THEN 1 ELSE 0 END) AS yes,
       SUM(CASE WHEN is_plugin = 0 THEN 1 ELSE 0 END) AS no,
       SUM(CASE WHEN is_plugin IS NULL THEN 1 ELSE 0 END) AS unknown,
       SUM(is_plugin_manual) AS manual
     FROM plugins WHERE is_present = 1`,
  )
).rows[0];

if (dryRun) {
  const plan = (
    await client.execute(
      `SELECT
         SUM(CASE WHEN has_bundle = 1 AND is_plugin_manual = 0 AND (is_plugin IS NULL OR is_plugin != 1) THEN 1 ELSE 0 END) AS to_yes,
         SUM(CASE WHEN install_kind = 'not-installable' AND COALESCE(has_bundle, 0) = 0 AND is_plugin_manual = 0 AND (is_plugin IS NULL OR is_plugin != 0) THEN 1 ELSE 0 END) AS to_no
       FROM plugins WHERE is_present = 1`,
    )
  ).rows[0];
  console.log("--dry-run：未写库。");
  console.log(`将标记 is_plugin = 1：${plan.to_yes ?? 0} 行（has_bundle = 1）`);
  console.log(`将标记 is_plugin = 0：${plan.to_no ?? 0} 行（install_kind = not-installable）`);
  process.exit(0);
}

// has_bundle 优先于 install_kind：有清单就是插件，即使 release 探测不完整。
const r1 = await client.execute(
  `UPDATE plugins SET is_plugin = 1
   WHERE is_present = 1 AND has_bundle = 1 AND is_plugin_manual = 0
     AND (is_plugin IS NULL OR is_plugin != 1)`,
);
const r0 = await client.execute(
  `UPDATE plugins SET is_plugin = 0
   WHERE is_present = 1 AND install_kind = 'not-installable' AND COALESCE(has_bundle, 0) = 0
     AND is_plugin_manual = 0 AND (is_plugin IS NULL OR is_plugin != 0)`,
);

const after = (
  await client.execute(
    `SELECT
       SUM(CASE WHEN is_plugin = 1 THEN 1 ELSE 0 END) AS yes,
       SUM(CASE WHEN is_plugin = 0 THEN 1 ELSE 0 END) AS no,
       SUM(CASE WHEN is_plugin IS NULL THEN 1 ELSE 0 END) AS unknown
     FROM plugins WHERE is_present = 1`,
  )
).rows[0];

console.log(`回填前：插件 ${before.yes ?? 0} / 非插件 ${before.no ?? 0} / 未知 ${before.unknown ?? 0}（人工标记 ${before.manual ?? 0}）`);
console.log(`本次写库：标记插件 ${r1.rowsAffected} 行，标记非插件 ${r0.rowsAffected} 行`);
console.log(`回填后：插件 ${after.yes ?? 0} / 非插件 ${after.no ?? 0} / 未知 ${after.unknown ?? 0}`);
