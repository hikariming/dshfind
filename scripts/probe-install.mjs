#!/usr/bin/env node
/**
 * 探测每个收录仓库「到底怎么装」，把事实与推导结论写回 Turso plugins 表。
 *
 * 用法：
 *   pnpm probe:install                     # 探测所有从未探过 / 超过 7 天没探的仓库
 *   pnpm probe:install --stale-days 30     # 换个新鲜度阈值
 *   pnpm probe:install --all               # 无视新鲜度，全部重探
 *   pnpm probe:install --only owner/repo   # 只探一个（可重复传）
 *   pnpm probe:install --rederive          # 不联网，用库里已有事实按当前规则重算 kind/cmd
 *   pnpm probe:install --dry-run           # 只打印，不写库
 *
 * 探两个来源：仓库根 package.json（raw.githubusercontent，免鉴权）与 npm registry。
 * 推导规则在 scripts/lib/install.mjs——改规则后跑 --rederive 即可全库生效，无需重新联网抓。
 *
 * 运营手工设的 plugins.install_cmd 优先级最高，本脚本从不覆盖它。
 */
import { createClient } from "@libsql/client/web";

import {
  buildEntryPath,
  deriveInstall,
  manifestFacts,
  readmeInstallHint,
} from "./lib/install.mjs";

const CONCURRENCY = 12;
const DEFAULT_STALE_DAYS = 7;

// ---------- 参数 ----------

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opt = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [argv[i + 1]] : []));
const staleDays = Number(opt("--stale-days", DEFAULT_STALE_DAYS));
const dryRun = has("--dry-run");
const rederive = has("--rederive");
const all = has("--all");

function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
  return createClient({ url: url.replace(/^libsql:\/\//, "https://"), authToken });
}

/** 简单并发池：不引依赖，顺序无关。 */
async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

// ---------- 探测 ----------

/**
 * 带重试的 fetch。上千个仓库要打几千个请求，连接层偶发失败是常态——
 * 不兜住的话一次 ECONNRESET 就掀掉整轮探测。全部重试完仍失败返回 null，
 * 调用方按「拿不到」处理（保守地判成不可安装，下轮 stale 重探会自愈）。
 */
async function tryFetch(url, init, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init);
    } catch {
      if (i === attempts - 1) return null;
      await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    }
  }
  return null;
}

/** 仓库根 package.json；没有（404）或解析失败都返回 null，等价于「不是 npm 包」。 */
async function fetchManifest(fullName) {
  const res = await tryFetch(
    `https://raw.githubusercontent.com/${fullName}/HEAD/package.json`,
  );
  if (!res?.ok) return null;
  try {
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}

/** npm registry 上是否真发布过。私有包不查（一定没有）。 */
async function fetchNpmPublished(name, isPrivate) {
  if (!name || isPrivate) return false;
  // 只要状态码，不要几 MB 的版本元数据
  const res = await tryFetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    method: "HEAD",
  });
  return Boolean(res?.ok);
}

/** README 原文。文件名各家不一，按常见顺序试；都没有就返回 null。 */
async function fetchReadme(fullName) {
  for (const file of ["README.md", "readme.md", "README.zh-CN.md", "README.rst"]) {
    const res = await tryFetch(`https://raw.githubusercontent.com/${fullName}/HEAD/${file}`);
    if (!res?.ok) continue;
    try {
      return await res.text();
    } catch {
      return null; // 连接中途断了，当作没有 README
    }
  }
  return null;
}

/** 构建产物是不是已经提交进仓库了——是的话 git 直装拿到的源码就是能跑的。 */
async function fetchEntryCommitted(fullName, entryPath) {
  if (!entryPath) return false;
  const res = await tryFetch(
    `https://raw.githubusercontent.com/${fullName}/HEAD/${entryPath}`,
    { method: "HEAD" },
  );
  return Boolean(res?.ok);
}

async function probe(fullName) {
  const pkg = await fetchManifest(fullName);
  const facts = manifestFacts(pkg);
  const npmPublished = await fetchNpmPublished(facts.pkgName, facts.pkgPrivate);
  // 只有真是组合包才值得多打这两个请求——不可安装的仓库里这些信息没有用
  const [readmeCmd, entryCommitted] = facts.hasBundle
    ? await Promise.all([
        fetchReadme(fullName).then((md) => readmeInstallHint(md)?.cmd ?? null),
        fetchEntryCommitted(fullName, buildEntryPath(pkg)),
      ])
    : [null, false];
  return { ...facts, npmPublished, readmeCmd, entryCommitted };
}

// ---------- 主流程 ----------

const client = db();

// 列可能已存在，duplicate column 忽略即可（与 sync-plugins-db.mjs 的迁移写法一致）
for (const sql of [
  `ALTER TABLE plugins ADD COLUMN pkg_name TEXT`,
  `ALTER TABLE plugins ADD COLUMN pkg_private INTEGER`,
  `ALTER TABLE plugins ADD COLUMN has_bundle INTEGER`,
  `ALTER TABLE plugins ADD COLUMN has_prepare INTEGER`,
  `ALTER TABLE plugins ADD COLUMN entry_needs_build INTEGER`,
  `ALTER TABLE plugins ADD COLUMN npm_published INTEGER`,
  `ALTER TABLE plugins ADD COLUMN install_kind TEXT`,
  `ALTER TABLE plugins ADD COLUMN install_cmd_auto TEXT`,
  `ALTER TABLE plugins ADD COLUMN install_probed_at TEXT`,
  `ALTER TABLE plugins ADD COLUMN readme_install_cmd TEXT`,
  `ALTER TABLE plugins ADD COLUMN install_source TEXT`,
  `ALTER TABLE plugins ADD COLUMN entry_committed INTEGER`,
]) {
  try {
    await client.execute(sql);
  } catch (err) {
    if (!/duplicate column/i.test(String(err?.message ?? err))) throw err;
  }
}

let sql = `SELECT full_name, pkg_name, pkg_private, has_bundle, has_prepare,
                  entry_needs_build, entry_committed, npm_published, readme_install_cmd, install_probed_at
           FROM plugins WHERE is_present = 1 AND is_offtopic = 0`;
const args = [];
if (only.length) {
  sql += ` AND lower(full_name) IN (${only.map(() => "?").join(",")})`;
  args.push(...only.map((s) => s.toLowerCase()));
} else if (rederive) {
  sql += ` AND install_probed_at IS NOT NULL`;
} else if (!all) {
  const cutoff = new Date(Date.now() - staleDays * 86400_000).toISOString();
  sql += ` AND (install_probed_at IS NULL OR install_probed_at < ?)`;
  args.push(cutoff);
}
sql += ` ORDER BY stars DESC`;

const rows = (await client.execute({ sql, args })).rows;
console.log(
  rederive
    ? `重算 ${rows.length} 个仓库的安装结论（不联网）…`
    : `探测 ${rows.length} 个仓库的 package.json / npm…`,
);
if (!rows.length) process.exit(0);

let done = 0;
const results = await mapPool(rows, CONCURRENCY, async (r) => {
  const fullName = String(r.full_name);
  const facts = rederive
    ? {
        pkgName: r.pkg_name == null ? null : String(r.pkg_name),
        pkgPrivate: Boolean(r.pkg_private),
        hasBundle: Boolean(r.has_bundle),
        hasPrepare: Boolean(r.has_prepare),
        entryNeedsBuild: Boolean(r.entry_needs_build),
        entryCommitted: Boolean(r.entry_committed),
        npmPublished: Boolean(r.npm_published),
        readmeCmd: r.readme_install_cmd == null ? null : String(r.readme_install_cmd),
      }
    : await probe(fullName);
  if (!rederive && ++done % 100 === 0) console.log(`  …${done}/${rows.length}`);
  return {
    fullName,
    facts,
    derived: deriveInstall({ fullName, ...facts }),
    // 重算模式只改结论，不谎报探测时间
    probedAt: r.install_probed_at == null ? null : String(r.install_probed_at),
  };
});

const tally = {};
for (const { derived } of results) {
  const key = derived.reason ? `${derived.kind}(${derived.reason})` : derived.kind;
  tally[key] = (tally[key] ?? 0) + 1;
}
console.log("\n结论分布：");
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(5)}  ${k}`);
}

if (dryRun) {
  console.log("\n--dry-run：未写库。样例：");
  for (const { fullName, derived } of results.slice(0, 15)) {
    console.log(`  ${fullName.padEnd(40)} ${derived.kind.padEnd(16)} ${(derived.cmd ?? "—").split("\n")[0]}`);
  }
  process.exit(0);
}

const now = new Date().toISOString();
const stmts = results.map(({ fullName, facts, derived, probedAt }) => ({
  sql: `UPDATE plugins SET
          pkg_name = ?, pkg_private = ?, has_bundle = ?, has_prepare = ?,
          entry_needs_build = ?, entry_committed = ?, npm_published = ?, readme_install_cmd = ?,
          install_kind = ?, install_cmd_auto = ?, install_source = ?, install_probed_at = ?
        WHERE full_name = ?`,
  args: [
    facts.pkgName,
    facts.pkgPrivate ? 1 : 0,
    facts.hasBundle ? 1 : 0,
    facts.hasPrepare ? 1 : 0,
    facts.entryNeedsBuild ? 1 : 0,
    facts.entryCommitted ? 1 : 0,
    facts.npmPublished ? 1 : 0,
    facts.readmeCmd ?? null,
    derived.kind,
    derived.cmd,
    derived.source,
    rederive ? probedAt : now,
    fullName,
  ],
}));

for (let i = 0; i < stmts.length; i += 100) {
  await client.batch(stmts.slice(i, i + 100), "write");
}
console.log(`\n已写库：${stmts.length} 行。`);
