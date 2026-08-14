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

import { deriveInstall, manifestFacts } from "./lib/install.mjs";
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

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  try {
    return execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const token = rederive ? null : githubToken();
if (!rederive && !token) {
  console.warn("⚠️ 未找到 GITHUB_TOKEN / gh 登录，将使用每小时 60 次的匿名 API 限额");
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

/** 仓库根 package.json；没有（404）或解析失败都返回 null，等价于「不是 npm 包」。 */
async function fetchManifest(fullName) {
  const res = await fetch(
    `https://raw.githubusercontent.com/${fullName}/HEAD/package.json`,
  );
  if (!res.ok) return null;
  try {
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}

/** npm registry 上是否真发布过。私有包不查（一定没有）。 */
async function fetchNpmPublished(name, isPrivate) {
  if (!name || isPrivate) return false;
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      // 只要状态码，不要几 MB 的版本元数据
      method: "HEAD",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function probe(fullName, previousRelease) {
  const pkg = await fetchManifest(fullName);
  const manifest = manifestFacts(pkg);
  const [npmPublished, release] = await Promise.all([
    fetchNpmPublished(manifest.pkgName, manifest.pkgPrivate),
    fetchRelease({ fullName, manifest, token }),
  ]);
  return mergeReleaseProbe({ manifest, npmPublished, release, previousRelease });
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
]) {
  try {
    await client.execute(sql);
  } catch (err) {
    if (!/duplicate column/i.test(String(err?.message ?? err))) throw err;
  }
}

let sql = `SELECT full_name, pkg_name, pkg_version, pkg_private, has_bundle, has_prepare,
                  entry_needs_build, npm_published, release_tgz_url, release_tag,
                  release_prerelease, release_asset_name, release_asset_size,
                  release_asset_digest, install_probed_at
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
          npmPublished: Boolean(r.npm_published),
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
          entry_needs_build = ?, npm_published = ?, release_tgz_url = ?, release_tag = ?,
          release_prerelease = ?, release_asset_name = ?, release_asset_size = ?,
          release_asset_digest = ?,
          install_kind = ?, install_cmd_auto = ?, install_probed_at = ?
        WHERE full_name = ?`,
  args: [
    facts.pkgName,
    facts.pkgVersion,
    facts.pkgPrivate ? 1 : 0,
    facts.hasBundle ? 1 : 0,
    facts.hasPrepare ? 1 : 0,
    facts.entryNeedsBuild ? 1 : 0,
    facts.npmPublished ? 1 : 0,
    facts.releaseTgzUrl,
    facts.releaseTag,
    facts.releasePrerelease ? 1 : 0,
    facts.releaseAssetName,
    facts.releaseAssetSize,
    facts.releaseAssetDigest,
    derived.kind,
    derived.cmd,
    probedAt,
    fullName,
  ],
}));

for (let i = 0; i < stmts.length; i += 100) {
  await client.batch(stmts.slice(i, i + 100), "write");
}
console.log(`\n已写库：${stmts.length} 行。`);
