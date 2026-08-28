#!/usr/bin/env node
/**
 * 论坛三张表（forum_threads / forum_posts / plugin_votes）Turso → D1（S3 切流）。
 *
 * 幂等：每次全量 DELETE + INSERT（保留原 id，AUTOINCREMENT 序列随显式 id 自动
 * 抬升）。数据量个位数到两位数行，全量重导比增量省心。
 *
 * 切流 runbook（docs/d1-migration-plan.md §S3）：
 *   1. 提前跑一次本脚本（建表 + 首轮导入，让 deploy 验收的论坛断言能过）
 *   2. 切流时刻再跑一次（补上窗口期 Go 写入的增量）→ 立即 wrangler deploy
 *   3. 跑 --verify 核对两边行数；红了说明冻结窗口里有人写了 Turso，重跑 1-2
 *
 * 用法：
 *   node --env-file=.env.local scripts/migrate-forum-to-d1.mjs            # 建表 + 导入 + 核对
 *   node --env-file=.env.local scripts/migrate-forum-to-d1.mjs --verify  # 只核对行数
 *   node --env-file=.env.local scripts/migrate-forum-to-d1.mjs --local   # 对本地 miniflare D1（测试）
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openDb } from "./lib/db.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = resolve(root, "workers/api-edge/wrangler.jsonc");
const verifyOnly = process.argv.includes("--verify");
const targetFlag = process.argv.includes("--local") ? "--local" : "--remote";

const TABLES = {
  forum_threads: ["id", "slug", "board", "title", "body_md", "author_login", "author_name", "author_avatar", "locale", "plugin_full_name", "reply_count", "last_post_at", "is_pinned", "is_locked", "deleted_at", "created_at"],
  forum_posts: ["id", "thread_id", "body_md", "kind", "author_login", "author_name", "author_avatar", "deleted_at", "created_at"],
  plugin_votes: ["full_name", "user_login", "verdict", "created_at"],
};

/** DDL 与 server/internal/store/migrate.go 逐字段一致。 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS forum_threads (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  board            TEXT NOT NULL,
  title            TEXT NOT NULL,
  body_md          TEXT NOT NULL DEFAULT '',
  author_login     TEXT NOT NULL,
  author_name      TEXT,
  author_avatar    TEXT,
  locale           TEXT NOT NULL DEFAULT 'zh',
  plugin_full_name TEXT,
  reply_count      INTEGER NOT NULL DEFAULT 0,
  last_post_at     TEXT,
  is_pinned        INTEGER NOT NULL DEFAULT 0,
  is_locked        INTEGER NOT NULL DEFAULT 0,
  deleted_at       TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_threads_board ON forum_threads(board, last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_plugin ON forum_threads(plugin_full_name);
CREATE TABLE IF NOT EXISTS forum_posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id     INTEGER NOT NULL,
  body_md       TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'comment',
  author_login  TEXT NOT NULL,
  author_name   TEXT,
  author_avatar TEXT,
  deleted_at    TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_thread ON forum_posts(thread_id, created_at);
CREATE TABLE IF NOT EXISTS plugin_votes (
  full_name  TEXT NOT NULL,
  user_login TEXT NOT NULL,
  verdict    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (full_name, user_login)
);
`;

function d1(args, { json = false } = {}) {
  const out = execFileSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", "dshfind", "--config", CONFIG, targetFlag, ...args, ...(json ? ["--json"] : [])],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], cwd: root },
  );
  if (!json) return out;
  return JSON.parse(out.slice(out.indexOf("[")));
}

const esc = (v) =>
  v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`;

const turso = openDb();

async function tursoCounts() {
  const out = {};
  for (const table of Object.keys(TABLES)) {
    const rs = await turso.execute(`SELECT COUNT(*) n FROM ${table}`);
    out[table] = Number(rs.rows[0].n);
  }
  return out;
}

function d1Counts() {
  const res = d1(
    ["--command", "SELECT (SELECT COUNT(*) FROM forum_threads) t, (SELECT COUNT(*) FROM forum_posts) p, (SELECT COUNT(*) FROM plugin_votes) v"],
    { json: true },
  );
  const r = res[0].results[0];
  return { forum_threads: Number(r.t), forum_posts: Number(r.p), plugin_votes: Number(r.v) };
}

function compare(a, b) {
  let same = true;
  for (const table of Object.keys(TABLES)) {
    const ok = a[table] === b[table];
    console.log(`${ok ? "✓" : "✗"} ${table}: Turso ${a[table]} vs D1 ${b[table]}`);
    if (!ok) same = false;
  }
  return same;
}

if (verifyOnly) {
  const same = compare(await tursoCounts(), d1Counts());
  process.exit(same ? 0 : 1);
}

// 1) 导出（openDb 走双写通道，但这里只 SELECT）
let sql = SCHEMA;
const source = await tursoCounts();
for (const [table, cols] of Object.entries(TABLES)) {
  sql += `DELETE FROM ${table};\n`;
  const rs = await turso.execute(`SELECT ${cols.join(",")} FROM ${table}`);
  for (const r of rs.rows) {
    sql += `INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map((c) => esc(r[c])).join(",")});\n`;
  }
  console.log(`导出 ${table}: ${rs.rows.length} 行`);
}

// 2) 导入（一个文件一次执行——D1 按批处理，行数极小没有超限问题）
const dir = mkdtempSync(join(tmpdir(), "forum-migrate-"));
const file = join(dir, "forum.sql");
writeFileSync(file, sql);
try {
  d1(["--file", file]);
  console.log(`已导入 D1（${targetFlag}）`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// 3) 核对
const same = compare(source, d1Counts());
if (!same) {
  console.error("行数不一致——导入期间 Turso 有新写入？重跑本脚本即可（幂等）。");
  process.exit(1);
}
console.log("迁移完成，两边一致");
