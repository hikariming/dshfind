#!/usr/bin/env node
/**
 * 建 docs_pages 表（官方文档中心的存储）。幂等，可重复执行。
 *
 * 为什么进 Turso 而不是构建期快照：四语言全量语料估算 raw 3-4MB，
 * 塞进 Worker bundle 会吃掉 10MB 上限里一大块（当前已用 4MB+），
 * 而且重译一篇就得重新部署。走 DB + ISR 与 plugins-db 的既有模式一致。
 *
 * 用法：node --env-file=.env.local scripts/init-docs-schema.mjs
 */
import { openDb } from "./lib/db.mjs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
  process.exit(1);
}
const client = openDb();

await client.batch(
  [
    `CREATE TABLE IF NOT EXISTS docs_pages (
       section      TEXT NOT NULL,
       slug         TEXT NOT NULL,
       locale       TEXT NOT NULL,
       title        TEXT NOT NULL,
       summary      TEXT,
       body         TEXT NOT NULL,
       source_path  TEXT NOT NULL,
       source_sha   TEXT NOT NULL,
       source_hash  TEXT NOT NULL,
       is_translated INTEGER NOT NULL DEFAULT 0,
       nav_order    INTEGER NOT NULL DEFAULT 0,
       updated_at   TEXT NOT NULL,
       PRIMARY KEY (section, slug, locale)
     )`,
    `CREATE INDEX IF NOT EXISTS idx_docs_pages_locale
       ON docs_pages (locale, section, nav_order)`,
  ],
  "write",
);

const cols = (await client.execute("SELECT * FROM docs_pages LIMIT 1")).columns;
console.log("✅ docs_pages 就绪，列：", cols.join(", "));
const n = (await client.execute("SELECT count(*) n FROM docs_pages")).rows[0].n;
console.log(`   现有行数：${n}`);
