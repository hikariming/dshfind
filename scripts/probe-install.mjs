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
 * 探三个来源：仓库根 package.json、npm registry，以及有限的 GitHub Releases 元数据。
 * 推导规则在 scripts/lib/install.mjs——改规则后跑 --rederive 即可全库生效，无需重新联网抓。
 *
 * 运营手工设的 plugins.install_cmd 优先级最高，本脚本从不覆盖它。
 */
import { execFileSync } from "node:child_process";
import { createClient } from "@libsql/client/web";

import {
  buildEntryPath,
  deriveInstall,
  manifestFacts,
  npmRepoBacklink,
  readmeInstallHint,
} from "./lib/install.mjs";
import {
  fetchRelease,
  mergeReleaseProbe,
  probeTimestamp,
} from "./lib/github-release-probe.mjs";

const CONCURRENCY = 8;
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

/** 返回 { token, from }；from 用于明说凭据是哪来的，别让人不知不觉用上了个人 token。 */
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

const { token, from: tokenFrom } = rederive ? { token: null, from: null } : githubToken();
if (!rederive) {
  console.log(
    token
      ? `🔑 GitHub API 凭据来自 ${tokenFrom}`
      : "⚠️ 未找到 GITHUB_TOKEN / gh 登录，将使用每小时 60 次的匿名 API 限额",
  );
}

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

/**
 * npm registry 全量 packument：发布状态、dist-tags.latest、repository 与 deprecated。
 * 缩写 packument（application/vnd.npm.install-v1+json）不含 repository 字段，必须 GET 全量。
 * 私有包不查（一定没有）；404 / 请求失败 / 解析失败都按「未发布」处理。
 */
async function fetchNpmPublished(name, isPrivate) {
  const absent = { published: false, latestVersion: null, repository: null, deprecated: false };
  if (!name || isPrivate) return absent;
  const res = await tryFetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res?.ok) return absent;
  try {
    const doc = await res.json();
    const latest = doc?.["dist-tags"]?.latest;
    const versionDoc =
      typeof latest === "string" && doc?.versions ? doc.versions[latest] : null;
    return {
      published: true,
      latestVersion: typeof latest === "string" ? latest : null,
      repository: versionDoc?.repository ?? null,
      deprecated: Boolean(versionDoc?.deprecated),
    };
  } catch {
    return absent;
  }
}

/** 精确稳定 semver：无 prerelease / build 后缀。桌面端目录契约只认这种版本号。 */
const EXACT_STABLE_VERSION = /^\d+\.\d+\.\d+$/;

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

async function probe(fullName, previousRelease) {
  const pkg = await fetchManifest(fullName);
  const manifest = manifestFacts(pkg);
  // README / 构建产物这两个请求只有真是组合包才值得打——不可安装的仓库里这些信息没有用。
  // fetchRelease 内部同样会对非组合包短路。
  const [npm, release, readmeCmd, entryCommitted] = await Promise.all([
    fetchNpmPublished(manifest.pkgName, manifest.pkgPrivate),
    fetchRelease({ fullName, manifest, token, etag: previousRelease.releaseEtag }),
    manifest.hasBundle
      ? fetchReadme(fullName).then((md) => readmeInstallHint(md)?.cmd ?? null)
      : null,
    manifest.hasBundle ? fetchEntryCommitted(fullName, buildEntryPath(pkg)) : false,
  ]);
  const merged = mergeReleaseProbe({ manifest, npmPublished: npm.published, release, previousRelease });
  return {
    ...merged,
    facts: {
      ...merged.facts,
      readmeCmd,
      entryCommitted,
      // 目录契约要的是 npm 上真实存在的精确稳定版本：prerelease / deprecated 都不采信
      npmLatestVersion:
        !npm.deprecated && npm.latestVersion && EXACT_STABLE_VERSION.test(npm.latestVersion)
          ? npm.latestVersion
          : null,
      npmRepoBacklink: npmRepoBacklink(fullName, npm.repository),
    },
  };
}

// ---------- 主流程 ----------

const client = db();

// 列可能已存在，duplicate column 忽略即可（与 sync-plugins-db.mjs 的迁移写法一致）
for (const sql of [
  `ALTER TABLE plugins ADD COLUMN pkg_name TEXT`,
  `ALTER TABLE plugins ADD COLUMN pkg_version TEXT`,
  `ALTER TABLE plugins ADD COLUMN pkg_private INTEGER`,
  `ALTER TABLE plugins ADD COLUMN has_bundle INTEGER`,
  `ALTER TABLE plugins ADD COLUMN has_prepare INTEGER`,
  `ALTER TABLE plugins ADD COLUMN entry_needs_build INTEGER`,
  `ALTER TABLE plugins ADD COLUMN npm_published INTEGER`,
  `ALTER TABLE plugins ADD COLUMN release_tgz_url TEXT`,
  `ALTER TABLE plugins ADD COLUMN release_tag TEXT`,
  `ALTER TABLE plugins ADD COLUMN release_prerelease INTEGER`,
  `ALTER TABLE plugins ADD COLUMN release_asset_name TEXT`,
  `ALTER TABLE plugins ADD COLUMN release_asset_size INTEGER`,
  `ALTER TABLE plugins ADD COLUMN release_asset_digest TEXT`,
  `ALTER TABLE plugins ADD COLUMN install_kind TEXT`,
  `ALTER TABLE plugins ADD COLUMN install_cmd_auto TEXT`,
  `ALTER TABLE plugins ADD COLUMN install_probed_at TEXT`,
  `ALTER TABLE plugins ADD COLUMN readme_install_cmd TEXT`,
  `ALTER TABLE plugins ADD COLUMN install_source TEXT`,
  `ALTER TABLE plugins ADD COLUMN entry_committed INTEGER`,
  `ALTER TABLE plugins ADD COLUMN release_etag TEXT`,
  `ALTER TABLE plugins ADD COLUMN is_plugin INTEGER`,
  `ALTER TABLE plugins ADD COLUMN is_plugin_manual INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE plugins ADD COLUMN npm_latest_version TEXT`,
  `ALTER TABLE plugins ADD COLUMN npm_repo_backlink INTEGER NOT NULL DEFAULT 0`,
]) {
  try {
    await client.execute(sql);
  } catch (err) {
    if (!/duplicate column/i.test(String(err?.message ?? err))) throw err;
  }
}

let sql = `SELECT full_name, pkg_name, pkg_version, pkg_private, has_bundle, has_prepare,
                  entry_needs_build, entry_committed, npm_published, readme_install_cmd,
                  release_tgz_url, release_tag, release_prerelease, release_asset_name,
                  release_asset_size, release_asset_digest, release_etag, install_probed_at,
                  npm_latest_version, npm_repo_backlink
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
    : `探测 ${rows.length} 个仓库的 package.json / npm / GitHub Releases…`,
);
if (!rows.length) process.exit(0);

const now = new Date().toISOString();
let done = 0;
const results = await mapPool(rows, CONCURRENCY, async (r) => {
  const fullName = String(r.full_name);
  const previousRelease = {
    releaseTgzUrl: r.release_tgz_url == null ? null : String(r.release_tgz_url),
    releaseTag: r.release_tag == null ? null : String(r.release_tag),
    releasePrerelease: Boolean(r.release_prerelease),
    releaseAssetName: r.release_asset_name == null ? null : String(r.release_asset_name),
    releaseAssetSize: r.release_asset_size == null ? null : Number(r.release_asset_size),
    releaseAssetDigest:
      r.release_asset_digest == null ? null : String(r.release_asset_digest),
    releaseEtag: r.release_etag == null ? null : String(r.release_etag),
  };
  const result = rederive
    ? {
        facts: {
          pkgName: r.pkg_name == null ? null : String(r.pkg_name),
          pkgVersion: r.pkg_version == null ? null : String(r.pkg_version),
          pkgPrivate: Boolean(r.pkg_private),
          hasBundle: Boolean(r.has_bundle),
          hasPrepare: Boolean(r.has_prepare),
          entryNeedsBuild: Boolean(r.entry_needs_build),
          entryCommitted: Boolean(r.entry_committed),
          npmPublished: Boolean(r.npm_published),
          readmeCmd: r.readme_install_cmd == null ? null : String(r.readme_install_cmd),
          // 离线重算不联网：npm 版本号与回链事实原样保留
          npmLatestVersion: r.npm_latest_version == null ? null : String(r.npm_latest_version),
          npmRepoBacklink: Boolean(r.npm_repo_backlink),
          ...previousRelease,
        },
        complete: true,
      }
    : await probe(fullName, previousRelease);
  if (!rederive && ++done % 100 === 0) console.log(`  …${done}/${rows.length}`);
  return {
    fullName,
    facts: result.facts,
    derived: deriveInstall({ fullName, ...result.facts }),
    // 重算模式不改时间；release API 失败则保留旧时间，让下一轮立即重试。
    probedAt: probeTimestamp({
      rederive,
      complete: result.complete,
      previous:
        r.install_probed_at == null ? null : String(r.install_probed_at),
      now,
    }),
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

const stmts = results.map(({ fullName, facts, derived, probedAt }) => ({
  sql: `UPDATE plugins SET
          pkg_name = ?, pkg_version = ?, pkg_private = ?, has_bundle = ?, has_prepare = ?,
          entry_needs_build = ?, entry_committed = ?, npm_published = ?, readme_install_cmd = ?,
          release_tgz_url = ?, release_tag = ?, release_prerelease = ?,
          release_asset_name = ?, release_asset_size = ?, release_asset_digest = ?,
          release_etag = ?,
          npm_latest_version = ?, npm_repo_backlink = ?,
          install_kind = ?, install_cmd_auto = ?, install_source = ?, install_probed_at = ?,
          is_plugin = CASE WHEN is_plugin_manual = 1 THEN is_plugin ELSE COALESCE(?, is_plugin) END
        WHERE full_name = ?`,
  args: [
    facts.pkgName,
    facts.pkgVersion,
    facts.pkgPrivate ? 1 : 0,
    facts.hasBundle ? 1 : 0,
    facts.hasPrepare ? 1 : 0,
    facts.entryNeedsBuild ? 1 : 0,
    facts.entryCommitted ? 1 : 0,
    facts.npmPublished ? 1 : 0,
    facts.readmeCmd ?? null,
    facts.releaseTgzUrl,
    facts.releaseTag,
    facts.releasePrerelease ? 1 : 0,
    facts.releaseAssetName,
    facts.releaseAssetSize,
    facts.releaseAssetDigest,
    facts.releaseEtag ?? null,
    facts.npmLatestVersion ?? null,
    facts.npmRepoBacklink ? 1 : 0,
    derived.kind,
    derived.cmd,
    derived.source,
    probedAt,
    // 插件归属结论：有 dsh.bundle 清单 → 确认插件；探测判定不可安装 → 确认非插件；
    // 其余（如 release 探测不完整）保持 NULL 未知。人工标记（is_plugin_manual=1）不覆盖。
    facts.hasBundle ? 1 : derived.kind === "not-installable" ? 0 : null,
    fullName,
  ],
}));

for (let i = 0; i < stmts.length; i += 100) {
  await client.batch(stmts.slice(i, i + 100), "write");
}
console.log(`\n已写库：${stmts.length} 行。`);
