#!/usr/bin/env node
/**
 * 每日同步：GitHub topic `dsh-plugin` 的公开仓库指标 → Turso。
 *
 * 用法：
 *   pnpm sync:db                       # 本地（.env.local + gh CLI token）
 *   GITHUB_TOKEN=... node scripts/sync-plugins-db.mjs   # CI（GitHub Actions）
 *
 * 写三张表：
 *   plugins           当前态（upsert；摘掉 topic 的仓库软删 is_present=0，保住快照历史）
 *   plugin_snapshots  每日快照（(full_name, snapshot_date) 主键，同日重跑幂等）
 *   sync_runs         运维日志
 *
 * 贡献者数不在 search API 里，需逐仓库调 /contributors?per_page=1&anon=1
 * 并解析 Link header 的 last 页码（约 233 次调用，并发 10，token 限额 1000/时够用）。
 */
import { execFileSync } from "node:child_process";
import { createClient } from "@libsql/client/web";

import { TOPIC, pluginTags } from "./lib/topics.mjs";

const API = "https://api.github.com";
const CONCURRENCY = 10;

// ---------- 凭据 ----------

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("需要 GITHUB_TOKEN 环境变量，或本地已登录 gh CLI");
  }
}

function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
  }
  // libsql:// → https://：走无状态 HTTP，脚本和 serverless 里行为一致
  return createClient({
    url: url.replace(/^libsql:\/\//, "https://"),
    authToken,
  });
}

// ---------- GitHub 抓取 ----------

const TOKEN = githubToken();

async function gh(path) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return res;
}

/** search API 全量翻页；带 token 也只会返回公开库，但 is:public 显式兜底。 */
async function fetchRepos() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const res = await gh(
      `/search/repositories?q=topic:${TOPIC}+is:public&per_page=100&page=${page}`,
    );
    if (!res.ok) throw new Error(`search API ${res.status}: ${await res.text()}`);
    const body = await res.json();
    all.push(...body.items);
    if (body.items.length < 100) break;
  }
  // 同名仓库可能来自不同作者，用 full_name 去重
  const seen = new Set();
  return all.filter((r) => !seen.has(r.full_name) && seen.add(r.full_name));
}

/**
 * 单仓库贡献者数。失败返回 null（计入 failures，但不炸整轮）。
 * per_page=1 时 Link header 的 last 页码即总数；无 Link 说明只有 0/1 页。
 */
async function contributorCount(fullName) {
  try {
    const res = await gh(`/repos/${fullName}/contributors?per_page=1&anon=1`);
    if (res.status === 204) return 0; // 空仓库
    if (!res.ok) return null; // 403（列表过大）/ 404 等
    const link = res.headers.get("link") ?? "";
    const m = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
    if (m) return Number(m[1]);
    const rows = await res.json();
    return Array.isArray(rows) ? rows.length : null;
  } catch {
    return null;
  }
}

/** 简单并发池：不引依赖，顺序无关。 */
async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

// ---------- DDL ----------

const DDL = [
  `CREATE TABLE IF NOT EXISTS plugins (
    full_name      TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    owner          TEXT NOT NULL,
    url            TEXT NOT NULL,
    description    TEXT NOT NULL DEFAULT '',
    tags           TEXT NOT NULL DEFAULT '[]',
    language       TEXT NOT NULL DEFAULT '',
    stars          INTEGER NOT NULL DEFAULT 0,
    contributors   INTEGER,
    pushed_at      TEXT NOT NULL DEFAULT '',
    archived       INTEGER NOT NULL DEFAULT 0,
    first_seen_at  TEXT NOT NULL,
    last_synced_at TEXT NOT NULL,
    is_present     INTEGER NOT NULL DEFAULT 1,
    is_offtopic    INTEGER NOT NULL DEFAULT 0,  -- 蹭热度/与 DSH 无关，站点不展示（运营手工标记）
    is_insider     INTEGER NOT NULL DEFAULT 0,  -- 作者是内测用户
    is_featured    INTEGER NOT NULL DEFAULT 0   -- 优质项目，插件页置顶
  )`,
  `CREATE TABLE IF NOT EXISTS plugin_snapshots (
    full_name     TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    stars         INTEGER NOT NULL,
    contributors  INTEGER,
    pushed_at     TEXT,
    PRIMARY KEY (full_name, snapshot_date)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_snapshots_date ON plugin_snapshots(snapshot_date)`,
  `CREATE TABLE IF NOT EXISTS sync_runs (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at           TEXT NOT NULL,
    finished_at          TEXT,
    status               TEXT NOT NULL,
    repo_count           INTEGER,
    contributor_failures INTEGER,
    error                TEXT
  )`,
];

// ---------- 主流程 ----------

const client = db();
const startedAt = new Date().toISOString();

try {
  for (const sql of DDL) await client.execute(sql);

  console.log(`拉取 topic:${TOPIC} 仓库…`);
  const repos = await fetchRepos();
  console.log(`  ${repos.length} 个仓库`);

  console.log(`逐仓库抓贡献者数（并发 ${CONCURRENCY}）…`);
  const contributors = await mapPool(repos, CONCURRENCY, (r) =>
    contributorCount(r.full_name),
  );
  const failures = contributors.filter((c) => c === null).length;
  console.log(`  完成，失败 ${failures} 个`);

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const upserts = repos.map((r, i) => ({
    sql: `INSERT INTO plugins
            (full_name, name, owner, url, description, tags, language, stars,
             contributors, pushed_at, archived, first_seen_at, last_synced_at, is_present)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON CONFLICT(full_name) DO UPDATE SET
            name = excluded.name, owner = excluded.owner, url = excluded.url,
            description = excluded.description, tags = excluded.tags,
            language = excluded.language, stars = excluded.stars,
            contributors = COALESCE(excluded.contributors, plugins.contributors),
            pushed_at = excluded.pushed_at, archived = excluded.archived,
            last_synced_at = excluded.last_synced_at, is_present = 1`,
    args: [
      r.full_name,
      r.name,
      r.owner.login,
      r.html_url,
      (r.description ?? "").trim(),
      JSON.stringify(pluginTags(r.topics)),
      r.language ?? "",
      r.stargazers_count ?? 0,
      contributors[i],
      r.pushed_at ?? "",
      r.archived ? 1 : 0,
      now,
      now,
    ],
  }));

  const snapshots = repos.map((r, i) => ({
    sql: `INSERT OR REPLACE INTO plugin_snapshots
            (full_name, snapshot_date, stars, contributors, pushed_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      r.full_name,
      today,
      r.stargazers_count ?? 0,
      contributors[i],
      r.pushed_at ?? "",
    ],
  }));

  console.log(`写库：${upserts.length} 条 upsert + ${snapshots.length} 条快照…`);
  const stmts = [...upserts, ...snapshots];
  for (let i = 0; i < stmts.length; i += 100) {
    await client.batch(stmts.slice(i, i + 100), "write");
  }

  // 全部 upsert 成功后才软删——中途崩溃不会把站点清空
  await client.execute({
    sql: `UPDATE plugins SET is_present = 0
          WHERE full_name NOT IN (SELECT value FROM json_each(?))`,
    args: [JSON.stringify(repos.map((r) => r.full_name))],
  });

  const status = failures === 0 ? "ok" : "partial";
  await client.execute({
    sql: `INSERT INTO sync_runs (started_at, finished_at, status, repo_count, contributor_failures)
          VALUES (?, ?, ?, ?, ?)`,
    args: [startedAt, new Date().toISOString(), status, repos.length, failures],
  });
  console.log(`同步完成：${status}（${repos.length} 仓库，贡献者失败 ${failures}）`);
} catch (err) {
  console.error("同步失败：", err);
  try {
    await client.execute({
      sql: `INSERT INTO sync_runs (started_at, finished_at, status, error)
            VALUES (?, ?, 'failed', ?)`,
      args: [startedAt, new Date().toISOString(), String(err?.message ?? err)],
    });
  } catch {
    // 连日志都写不进去时只能靠退出码
  }
  process.exit(1);
}
