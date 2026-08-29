#!/usr/bin/env node
/**
 * 建 plugin_images 表（插件配图的抽取结果）。幂等，可重复执行。
 *
 * 为什么单独一张表而不是往 plugins 上加列：抽图是独立的、会失败的、需要单独
 * 记录新鲜度的过程，跟仓库元数据的同步周期不一样。混进 plugins 表会让每次
 * `pnpm sync:db` 都要考虑"要不要覆盖抽图结果"。
 *
 * status 有四种取值，`none` 是其中最重要的一个——它记录的是"看过了，确实没有图"。
 * 没有这个状态，每次跑都会把 5,000 个没图的仓库重新探一遍。
 *
 *   ok     图已处理并上传 R2，thumb_key / full_key 有效
 *   found  找到了图但没入库（--probe-only / --dry-run 跑出来的）
 *   none   确实没有可用图
 *   failed 找到了但下载/解码失败，或尺寸不达标；原因见 note
 *
 * 用法：node --env-file=.env.local scripts/init-plugin-images-schema.mjs
 */
import { openDb } from "./lib/db.mjs";

const client = openDb();

await client.batch(
  [
    `CREATE TABLE IF NOT EXISTS plugin_images (
       full_name    TEXT PRIMARY KEY,
       status       TEXT NOT NULL,
       source_kind  TEXT,
       source_url   TEXT,
       source_raw   TEXT,
       source_hash  TEXT,
       alt          TEXT,
       width        INTEGER,
       height       INTEGER,
       thumb_key    TEXT,
       full_key     TEXT,
       note         TEXT,
       probed_at    TEXT NOT NULL
     )`,
    // 按状态 + 新鲜度选取待处理的仓库，是本表唯一的高频查询
    `CREATE INDEX IF NOT EXISTS idx_plugin_images_status
       ON plugin_images (status, probed_at)`,
  ],
  "write",
);

const cols = (await client.execute("SELECT * FROM plugin_images LIMIT 1")).columns;
console.log("✅ plugin_images 就绪，列：", cols.join(", "));
const rows = (
  await client.execute("SELECT status, count(*) n FROM plugin_images GROUP BY status")
).rows;
if (rows.length === 0) console.log("   现有行数：0");
else for (const r of rows) console.log(`   ${r.status}: ${r.n}`);
