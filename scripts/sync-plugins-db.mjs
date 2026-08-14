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
 * 并解析 Link header 的 last 页码（约 1000 次调用，并发 10，core API 限额 5000/时够用）。
 */
import { execFileSync } from "node:child_process";
import { createClient } from "@libsql/client/web";

import { TOPIC, pluginTags } from "./lib/topics.mjs";
import { classifyPlugin } from "./lib/categories.mjs";

const API = "https://api.github.com";
const CONCURRENCY = 10;

/**
 * 内测组织白名单：这些 owner 的仓库每日同步自动标 is_insider=1。
 * 只加标不摘标——手动标过内测的其他仓库不受影响。
 */
const INSIDER_OWNERS = new Set(["omdsh-dev"]);

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

async function searchPage(q, page) {
  const res = await gh(
    `/search/repositories?q=${q}&per_page=100&page=${page}`,
  );
  if (!res.ok) throw new Error(`search API ${res.status}: ${await res.text()}`);
  return res.json();
}

/** 单个查询全量翻页；调用方需保证该查询的结果数 < 1000（search API 硬上限）。 */
async function fetchAllPages(q) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const body = await searchPage(q, page);
    all.push(...body.items);
    if (body.items.length < 100) break;
  }
  return all;
}

/**
 * search API 每个查询最多吐 1000 条，topic 仓库数已逼近上限——
 * 超限后不仅漏新仓库，漏掉的还会被误判成「摘了 topic」软删。
 * 所以按仓库创建日期递归二分：哪个日期区间结果数逼近 1000 就对半切，
 * 直到每片都能全量翻完。带 token 也只会返回公开库，但 is:public 显式兜底。
 */
async function fetchRepos() {
  const all = [];
  const day = (d) => d.toISOString().slice(0, 10);
  async function walk(from, to) {
    const q = `topic:${TOPIC}+is:public+created:${day(from)}..${day(to)}`;
    const first = await searchPage(q, 1);
    if (first.total_count < 900) {
      all.push(...first.items);
      if (first.total_count > first.items.length) {
        for (let page = 2; page <= 10; page++) {
          const body = await searchPage(q, page);
          all.push(...body.items);
          if (body.items.length < 100) break;
        }
      }
      return;
    }
    const mid = new Date((from.getTime() + to.getTime()) / 2);
    // 区间已缩到 1 天还超限时只能截断收 1000 条，翻页收满并明说
    if (day(from) === day(mid) || day(mid) === day(to)) {
      console.warn(`  ⚠️ ${q} 单日超 1000 仓库，只能收前 1000`);
      all.push(...(await fetchAllPages(q)));
      return;
    }
    await walk(from, mid);
    await walk(new Date(mid.getTime() + 86400_000), to);
  }
  await walk(new Date("2008-01-01"), new Date());
  // 同名仓库可能来自不同作者，用 full_name 去重；切片边界重叠也靠这里兜底
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
    is_featured    INTEGER NOT NULL DEFAULT 0,  -- 优质项目，插件页置顶
    is_official    INTEGER NOT NULL DEFAULT 0,  -- 官方出品（DeepSeek 官方或官方生态组织）
    category        TEXT NOT NULL DEFAULT '',   -- 分类 slug（枚举见 scripts/lib/categories.mjs），'' = 未分类
    category_manual INTEGER NOT NULL DEFAULT 0, -- 1 = 运营手工定的分类，自动分类不覆盖
    score           INTEGER,                    -- 综合评分 0-100（scripts/lib/scoring.mjs），NULL = 未评
    score_detail    TEXT,                       -- 评分明细 JSON（分项/权重/AI 点评）
    scored_at       TEXT                        -- 上次评分时间
  )`,
  `CREATE TABLE IF NOT EXISTS plugin_i18n (
    full_name   TEXT NOT NULL,
    locale      TEXT NOT NULL,   -- zh / en / ja / ko
    description TEXT,            -- 卡片短描述（人工翻译，覆盖 GitHub 原文）
    intro       TEXT,            -- 详情页长介绍
    highlights  TEXT,            -- 亮点 JSON 数组
    updated_at  TEXT NOT NULL,
    PRIMARY KEY (full_name, locale)
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

/** 已有库的增量迁移；列已存在时 SQLite 会报 duplicate column，忽略即可。 */
const MIGRATIONS = [
  `ALTER TABLE plugins ADD COLUMN category TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE plugins ADD COLUMN category_manual INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE plugins ADD COLUMN score INTEGER`,
  `ALTER TABLE plugins ADD COLUMN score_detail TEXT`,
  `ALTER TABLE plugins ADD COLUMN scored_at TEXT`,
  `ALTER TABLE plugins ADD COLUMN is_official INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE plugins ADD COLUMN install_cmd TEXT`, // 详情页安装命令覆盖（与语言无关，运营维护）
];

// ---------- 主流程 ----------

const client = db();
const startedAt = new Date().toISOString();

try {
  for (const sql of DDL) await client.execute(sql);
  for (const sql of MIGRATIONS) {
    try {
      await client.execute(sql);
    } catch (err) {
      if (!/duplicate column/i.test(String(err?.message ?? err))) throw err;
    }
  }

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

  // 分类每天随仓库描述/topic 重算，但运营手工定的分类（category_manual=1）永不覆盖；
  // 内测白名单组织的仓库自动加 is_insider（只加不摘，手动标的照旧保留）
  const upserts = repos.map((r, i) => ({
    sql: `INSERT INTO plugins
            (full_name, name, owner, url, description, tags, language, stars,
             contributors, pushed_at, archived, first_seen_at, last_synced_at, is_present, category, is_insider)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
          ON CONFLICT(full_name) DO UPDATE SET
            name = excluded.name, owner = excluded.owner, url = excluded.url,
            description = excluded.description, tags = excluded.tags,
            language = excluded.language, stars = excluded.stars,
            contributors = COALESCE(excluded.contributors, plugins.contributors),
            pushed_at = excluded.pushed_at, archived = excluded.archived,
            last_synced_at = excluded.last_synced_at, is_present = 1,
            category = CASE WHEN plugins.category_manual = 1
                            THEN plugins.category ELSE excluded.category END,
            is_insider = CASE WHEN excluded.is_insider = 1 THEN 1 ELSE plugins.is_insider END`,
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
      classifyPlugin({
        name: r.name,
        description: r.description ?? "",
        tags: pluginTags(r.topics),
      }),
      INSIDER_OWNERS.has(r.owner.login.toLowerCase()) ? 1 : 0,
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
