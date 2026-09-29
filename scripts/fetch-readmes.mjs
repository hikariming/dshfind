#!/usr/bin/env node
/**
 * 抓取头部插件的 README，渲染成净化后的 HTML 写进 D1 plugin_readmes 表，
 * 详情页直接读这张表展示（渲染规则见 scripts/lib/readme-render.mjs）。
 *
 * 用法：
 *   pnpm readmes:fetch                       # star ≥ 100，只抓超过 7 天没抓的
 *   pnpm readmes:fetch --min-stars 50        # 扩大覆盖
 *   pnpm readmes:fetch --only owner/repo     # 只处理一个（可重复传），无视新鲜度
 *   pnpm readmes:fetch --all                 # 无视新鲜度，全部重抓（仍带 ETag，没变的不计配额）
 *   pnpm readmes:fetch --stale-days 1        # 换个新鲜度阈值（默认 7 天）
 *   pnpm readmes:fetch --limit 20            # 只处理前 N 个（按 star 降序）
 *   pnpm readmes:fetch --dry-run             # 只打印，不写库
 *   pnpm readmes:fetch --out DIR             # 另把渲染结果写成本地 HTML，方便肉眼验收
 *
 * 为什么走 GitHub API 而不是 raw.githubusercontent（extract-plugin-images 走 raw）：
 *   1. /readme 端点替我们找 README——文件名大小写、放在 docs/ 或 .github/ 下都能命中，
 *      而相对路径的基准目录恰恰取决于它在哪；
 *   2. 带 If-None-Match 的 304 响应**不计**入 5,000/时 的配额。头部几百个仓库，
 *      每轮绝大多数 README 没变，实际消耗接近零。
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { openDb } from "./lib/db.mjs";
import { RENDER_VERSION, renderReadme } from "./lib/readme-render.mjs";

// ---------- 参数 ----------

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [argv[i + 1]] : []));
const minStars = Number(val("--min-stars", 100));
const staleDays = Number(val("--stale-days", 7));
const limit = Number(val("--limit", 0)) || 0;
const all = has("--all");
const dryRun = has("--dry-run");
const outDir = val("--out", null);

const CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 20_000;

// ---------- 凭据 ----------

/** 返回 { token, from }；明说凭据哪来的，别让人不知不觉用上个人 token。 */
function githubToken() {
  if (process.env.GITHUB_TOKEN) {
    return { token: process.env.GITHUB_TOKEN.trim(), from: "GITHUB_TOKEN" };
  }
  try {
    const out = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out ? { token: out, from: "gh auth token（你的个人凭据）" } : { token: null, from: null };
  } catch {
    return { token: null, from: null };
  }
}

const { token: TOKEN, from: tokenFrom } = githubToken();
console.log(
  TOKEN
    ? `🔑 GitHub API 凭据来自 ${tokenFrom}`
    : "⚠️ 未找到 GITHUB_TOKEN / gh 登录，将使用每小时 60 次的匿名限额",
);

// ---------- 工具 ----------

async function mapPool(items, poolSize, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(poolSize, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

// ---------- 单仓处理 ----------

/**
 * @returns {Promise<{fullName: string, status: string, etag?: string|null, path?: string|null,
 *   sha?: string|null, html?: string|null, truncated?: boolean, sourceBytes?: number, note?: string}>}
 */
async function processRepo(row) {
  const fullName = String(row.full_name);
  // 渲染口径变了就不带 ETag：README 没变也要按新规则重渲
  const sameVersion = Number(row.render_version ?? 0) === RENDER_VERSION;
  const etag = sameVersion && row.html != null ? row.etag : null;

  let res;
  try {
    res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "dshfind-readme-bot (+https://dshfind.com)",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        ...(etag ? { "If-None-Match": String(etag) } : {}),
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    return { fullName, status: "error", note: String(err?.message ?? err).slice(0, 200) };
  }

  if (res.status === 304) return { fullName, status: "unchanged" };
  if (res.status === 404) return { fullName, status: "none" };
  if (!res.ok) {
    // 403/429 多半是限额；不写库，下一轮再来，别把已有 README 抹掉
    return { fullName, status: "error", note: `HTTP ${res.status}` };
  }

  const body = await res.json();
  // 超过 1MB 的文件 API 不内联 content；这种 README 本来也要截断，直接走 download_url
  let source;
  if (body.content && body.encoding === "base64") {
    source = Buffer.from(body.content, "base64").toString("utf8");
  } else if (body.download_url) {
    try {
      const raw = await fetch(body.download_url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      source = raw.ok ? await raw.text() : null;
    } catch {
      source = null;
    }
  }
  if (source == null) return { fullName, status: "error", note: "取不到 README 正文" };

  let rendered;
  try {
    rendered = await renderReadme(source, { fullName, path: body.path });
  } catch (err) {
    return { fullName, status: "error", note: `渲染失败：${String(err?.message ?? err).slice(0, 160)}` };
  }
  return {
    fullName,
    status: rendered.status,
    etag: res.headers.get("etag"),
    path: body.path ?? null,
    sha: body.sha ?? null,
    html: rendered.html,
    truncated: rendered.truncated,
    sourceBytes: rendered.sourceBytes,
  };
}

// ---------- 主流程 ----------

const client = openDb();

// --dry-run 不碰库结构：表不存在时下面的查询退化成不带 README 状态的版本
if (!dryRun) await client.execute(`CREATE TABLE IF NOT EXISTS plugin_readmes (
  full_name TEXT PRIMARY KEY,
  status TEXT NOT NULL,          -- ok / none（仓库没有 README）/ empty / too_large
  html TEXT,                     -- 净化后的 HTML；status 不是 ok 时为 NULL
  path TEXT,                     -- README 在仓库里的路径
  sha TEXT,
  etag TEXT,
  truncated INTEGER NOT NULL DEFAULT 0,
  source_bytes INTEGER,
  render_version INTEGER NOT NULL DEFAULT 0,
  fetched_at TEXT NOT NULL
)`);

const where = ["p.is_present = 1", "p.is_offtopic = 0", "p.is_risky = 0"];
const args = [];
if (only.length) {
  where.push(`p.full_name IN (${only.map(() => "?").join(",")})`);
  args.push(...only);
} else {
  if (minStars > 0) where.push(`p.stars >= ${minStars}`);
  if (!all) {
    where.push(
      `(r.fetched_at IS NULL OR r.fetched_at < datetime('now', '-${staleDays} days') OR r.render_version != ${RENDER_VERSION})`,
    );
  }
}

// 风险仓（冒充官方等）不展示 README：里面的安装说明正是它要骗人执行的东西
const selectRows = (withReadmes) =>
  client.execute({
    sql: withReadmes
      ? `SELECT p.full_name, p.stars, r.etag, r.render_version, r.html
         FROM plugins p LEFT JOIN plugin_readmes r ON r.full_name = p.full_name
         WHERE ${where.join(" AND ")}
         ORDER BY p.stars DESC${limit > 0 ? ` LIMIT ${limit}` : ""}`
      : `SELECT p.full_name, p.stars FROM plugins p
         WHERE ${where.filter((w) => !w.includes("r.")).join(" AND ")}
         ORDER BY p.stars DESC${limit > 0 ? ` LIMIT ${limit}` : ""}`,
    args,
  });

let rows;
try {
  rows = (await selectRows(true)).rows;
} catch (err) {
  if (!dryRun || !/no such table/i.test(String(err?.message ?? err))) throw err;
  rows = (await selectRows(false)).rows;
}

console.log(`待处理 ${rows.length} 个仓库（${only.length ? "指定仓库" : `star ≥ ${minStars}`}，并发 ${CONCURRENCY}）…`);

let done = 0;
const results = await mapPool(rows, CONCURRENCY, async (row) => {
  const out = await processRepo(row);
  done++;
  if (done % 25 === 0) console.log(`  …${done}/${rows.length}`);
  if (out.status === "error") console.warn(`  ⚠️ ${out.fullName}：${out.note}`);
  return out;
});

if (outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const r of results) {
    if (!r.html) continue;
    writeFileSync(join(outDir, `${r.fullName.replace("/", "__")}.html`), r.html);
  }
  console.log(`已把 ${results.filter((r) => r.html).length} 份渲染结果写到 ${outDir}`);
}

const count = (s) => results.filter((r) => r.status === s).length;
console.log(
  `\n结果：新渲染 ${count("ok")}，未变化 ${count("unchanged")}，无 README ${count("none")}，` +
    `空文件 ${count("empty")}，过大 ${count("too_large")}，失败 ${count("error")}；` +
    `其中截断 ${results.filter((r) => r.truncated).length}`,
);

if (dryRun) {
  console.log("--dry-run，未写库。");
} else {
  const now = new Date().toISOString();
  const stmts = [];
  for (const r of results) {
    if (r.status === "error") continue;
    if (r.status === "unchanged") {
      stmts.push({ sql: `UPDATE plugin_readmes SET fetched_at = ? WHERE full_name = ?`, args: [now, r.fullName] });
      continue;
    }
    stmts.push({
      sql: `INSERT INTO plugin_readmes
              (full_name, status, html, path, sha, etag, truncated, source_bytes, render_version, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(full_name) DO UPDATE SET
              status = excluded.status, html = excluded.html, path = excluded.path,
              sha = excluded.sha, etag = excluded.etag, truncated = excluded.truncated,
              source_bytes = excluded.source_bytes, render_version = excluded.render_version,
              fetched_at = excluded.fetched_at`,
      args: [
        r.fullName,
        r.status,
        r.html ?? null,
        r.path ?? null,
        r.sha ?? null,
        r.etag ?? null,
        r.truncated ? 1 : 0,
        r.sourceBytes ?? null,
        RENDER_VERSION,
        now,
      ],
    });
  }
  // 单行 HTML 最大 200KB：小批量提交，免得一次请求体过大
  for (let i = 0; i < stmts.length; i += 10) {
    await client.batch(stmts.slice(i, i + 10), "write");
  }
  console.log(`已写库：${stmts.length} 行。`);
}

if (count("error") > 0 && count("error") === results.length) process.exit(1);
