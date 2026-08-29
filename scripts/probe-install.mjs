#!/usr/bin/env node
/**
 * 探测每个收录仓库「到底怎么装」，把事实与推导结论写回 Turso plugins 表。
 *
 * 用法：
 *   pnpm probe:install                     # 探测所有从未探过 / 超过 7 天没探的仓库
 *   pnpm probe:install --stale-days 30     # 换个新鲜度阈值
 *   pnpm probe:install --all               # 无视新鲜度，全部重探
 *   pnpm probe:install --all --min-stars 100   # 只重探头部（桌面端市场就看这批）
 *   pnpm probe:install --all --npm-bundles     # 改了桌面端运行时常量后只重探可能受影响的行
 *   pnpm probe:install --only owner/repo   # 只探一个（可重复传）
 *   pnpm probe:install --deadline 8        # 最多跑 8 分钟，到点收工（CI 用，见下）
 *   pnpm probe:install --rederive          # 不联网，用库里已有事实按当前规则重算 kind/cmd
 *   pnpm probe:install --dry-run           # 只打印，不写库
 *
 * 探三个来源：仓库根 package.json、npm registry，以及有限的 GitHub Releases 元数据。
 * 推导规则在 scripts/lib/install.mjs——改规则后跑 --rederive 即可全库生效，无需重新联网抓。
 *
 * 运营手工设的 plugins.install_cmd 优先级最高，本脚本从不覆盖它。
 *
 * npm_latest_version 会作为精确 revision 发给 DSH 桌面端市场（/market/v1/plugins），
 * 桌面端照着它装。所以这一列不是展示字段而是安装契约：探测跑得越勤，
 * 用户装到的版本越新。头部插件一周能发十几个版本，别让它放着不动。
 */
import { execFileSync } from "node:child_process";
import { openDb } from "./lib/db.mjs";

import {
  buildEntryPath,
  deriveInstall,
  desktopPreviewVerdict,
  fetchOutcome,
  manifestFacts,
  mergeManifestProbe,
  mergeNpmProbe,
  npmRepoBacklink,
  npmRepoSubdirectory,
  readmeInstallHint,
  retryableStatus,
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
const minStars = Number(opt("--min-stars", 0));
const npmBundles = has("--npm-bundles");
const dryRun = has("--dry-run");
const rederive = has("--rederive");
const all = has("--all");

/**
 * 墙钟上限（分钟），0 = 不限。
 *
 * 为什么需要它：CI 里 GitHub 给 Actions 的配额只有 1000 次/小时，用完之后每个
 * 仓库都要按 120s 退避重试 4 次——8 个并发槽跑一批就是 8 分钟，20 分钟的 job
 * 预算永远走不完，后面的产物生成、边缘部署、提交推送一步都跑不到
 * （2026-08-27 实测，整轮同步就断在这里）。
 *
 * 脚本本身早就容忍「这轮没问全」：事实沿用上一轮、**不刷新** install_probed_at、
 * 下一轮自然重探。加这个上限只是让它走得到那个收尾，而不是耗死在退避里。
 */
const deadlineMinutes = Number(opt("--deadline", 0));
const deadlineAt = Number.isFinite(deadlineMinutes) && deadlineMinutes > 0
  ? Date.now() + deadlineMinutes * 60_000
  : null;
const pastDeadline = () => deadlineAt !== null && Date.now() >= deadlineAt;
/**
 * 退避不许睡过上限：睡到点就当这次重试用完，让 fetchRelease 尽快判成 incomplete，
 * 而不是抱着一个 120s 的 setTimeout 把并发槽占到 job 超时。
 */
const budgetedSleep = (ms) =>
  new Promise((r) =>
    setTimeout(r, deadlineAt === null ? ms : Math.max(0, Math.min(ms, deadlineAt - Date.now()))),
  );
let skippedByDeadline = 0;

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
  return openDb();
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
 * 不兜住的话一次 ECONNRESET 就掀掉整轮探测。429 / 5xx 同样重试（限流退避要更久）。
 * 全部重试完仍失败返回 null，调用方用 fetchOutcome() 把它判成 unknown。
 */
async function tryFetch(url, init, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (!retryableStatus(res.status) || i === attempts - 1) return res;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    } catch {
      if (i === attempts - 1) return null;
      await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    }
  }
  return null;
}

/**
 * 仓库根 package.json。返回 { outcome, pkg }：
 * 404 是「这仓库没有 package.json」的事实，429/5xx/网络失败则什么都没证明。
 * 解析失败按 absent 处理——文件确实拿到了，只是不是合法 JSON。
 */
async function fetchManifest(fullName) {
  const res = await tryFetch(
    `https://raw.githubusercontent.com/${fullName}/HEAD/package.json`,
  );
  const outcome = fetchOutcome(res);
  if (outcome !== "ok") return { outcome, pkg: null };
  try {
    return { outcome: "ok", pkg: JSON.parse(await res.text()) };
  } catch {
    return { outcome: "absent", pkg: null };
  }
}

/**
 * npm registry 全量 packument：发布状态、dist-tags.latest、repository 与 deprecated。
 * 缩写 packument（application/vnd.npm.install-v1+json）不含 repository 字段，必须 GET 全量。
 * 私有包不查（一定没有）；404 是「没发过这个包」，429/5xx 则是「这轮没问出来」。
 */
async function fetchNpmPublished(name, isPrivate) {
  const absent = {
    published: false,
    latestVersion: null,
    repository: null,
    deprecated: false,
    latestDoc: null,
  };
  if (!name || isPrivate) return { outcome: "absent", npm: absent };
  const res = await tryFetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: { Accept: "application/json" },
  });
  const outcome = fetchOutcome(res);
  if (outcome !== "ok") return { outcome, npm: absent };
  try {
    const doc = await res.json();
    const latest = doc?.["dist-tags"]?.latest;
    const versionDoc =
      typeof latest === "string" && doc?.versions ? doc.versions[latest] : null;
    return {
      outcome: "ok",
      npm: {
        published: true,
        latestVersion: typeof latest === "string" ? latest : null,
        repository: versionDoc?.repository ?? null,
        deprecated: Boolean(versionDoc?.deprecated),
        // 整个版本文档：桌面端 preview 复核（生命周期脚本、运行时范围、dist 等）要用
        latestDoc: versionDoc ?? null,
      },
    };
  } catch {
    return { outcome: "absent", npm: absent };
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

async function probe(fullName, previous) {
  const previousRelease = previous.release;
  const fetched = await fetchManifest(fullName);
  const manifestProbe = mergeManifestProbe({
    outcome: fetched.outcome,
    facts: manifestFacts(fetched.pkg),
    previous: previous.manifest,
  });
  const manifest = manifestProbe.facts;
  // README / 构建产物这两个请求只有真是组合包才值得打——不可安装的仓库里这些信息没有用。
  // fetchRelease 内部同样会对非组合包短路。
  const [npmFetched, release, readmeCmd, entryCommitted] = await Promise.all([
    fetchNpmPublished(manifest.pkgName, manifest.pkgPrivate),
    fetchRelease({
      fullName,
      manifest,
      token,
      etag: previousRelease.releaseEtag,
      sleep: budgetedSleep,
    }),
    manifest.hasBundle && manifestProbe.complete
      ? fetchReadme(fullName).then((md) => readmeInstallHint(md)?.cmd ?? null)
      : previous.manifest.readmeCmd,
    manifest.hasBundle && manifestProbe.complete
      ? fetchEntryCommitted(fullName, buildEntryPath(fetched.pkg))
      : Boolean(previous.manifest.entryCommitted),
  ]);
  const npmProbe = mergeNpmProbe({
    outcome: npmFetched.outcome,
    npm: npmFetched.npm,
    previous: previous.npm,
  });
  const npm = npmProbe.npm;
  const merged = mergeReleaseProbe({ manifest, npmPublished: npm.published, release, previousRelease });
  // 目录契约要的是 npm 上真实存在的精确稳定版本：prerelease / deprecated 都不采信
  const npmLatestVersion =
    !npm.deprecated && npm.latestVersion && EXACT_STABLE_VERSION.test(npm.latestVersion)
      ? npm.latestVersion
      : null;
  const backlink = npmRepoBacklink(fullName, npm.repository);
  // 桌面端 preview 复核预演：只有已采信版本且有版本文档时才评，
  // 其余情况（未发布/预发布/抓不到）都直接判不可安装——证据只发给 preview 必过的包。
  const verdict =
    npmLatestVersion && npm.latestDoc ? desktopPreviewVerdict(npm.latestDoc, fullName) : null;
  // npm 那边没问出结果时，安装证据整组沿用上一轮（npm.keep），不重算——
  // 重算的输入本来就是空的，算出来必然是「不可安装」。
  const npmEvidence = npm.keep ?? {
    npmLatestVersion,
    npmRepoBacklink: backlink,
    npmDesktopInstallable: Boolean(verdict?.ok && npmLatestVersion && backlink && npm.published),
    // monorepo 子包的仓库子目录：随目录契约发给桌面端（repository.subdirectory），
    // v2.0.1/v2.0.2 的安装复核要求它与 npm manifest 的 directory 相等。
    // 只在包确实归属本仓库（回链）且采信了稳定版本时记录。
    npmRepoDirectory:
      npm.published && backlink && npmLatestVersion ? npmRepoSubdirectory(npm.latestDoc) : null,
  };
  return {
    // 三个来源任一没问出结果，这轮就不算完整：探测时间不刷新，下轮立刻重探。
    complete: merged.complete && manifestProbe.complete && npmProbe.complete,
    facts: {
      ...merged.facts,
      readmeCmd,
      entryCommitted,
      ...npmEvidence,
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
  `ALTER TABLE plugins ADD COLUMN npm_desktop_installable INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE plugins ADD COLUMN npm_repo_directory TEXT`,
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
                  npm_latest_version, npm_repo_backlink, npm_desktop_installable,
                  npm_repo_directory
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
// --only 是点名，下面这些筛子不该越过点名生效。
if (!only.length && minStars > 0) {
  sql += ` AND stars >= ?`;
  args.push(minStars);
}
// 只有「已发 npm 的组合包」才可能拿到桌面端安装证据。改了 DESKTOP_* 运行时常量后
// 用它做定向重探：受影响的只有这批，没必要把一万多个仓库全部重新联网抓一遍。
if (!only.length && npmBundles) {
  sql += ` AND has_bundle = 1 AND npm_published = 1`;
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

/** 一次探一片、写一片。见下面 SLICE 的说明。 */
async function probeRow(r) {
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
  // 上一轮的事实：抓不到时原样留着，绝不让一次限流把结论改写成「不是插件」。
  const previousManifest = {
    pkgName: r.pkg_name == null ? null : String(r.pkg_name),
    pkgVersion: r.pkg_version == null ? null : String(r.pkg_version),
    pkgPrivate: Boolean(r.pkg_private),
    hasBundle: Boolean(r.has_bundle),
    hasPrepare: Boolean(r.has_prepare),
    entryNeedsBuild: Boolean(r.entry_needs_build),
    entryCommitted: Boolean(r.entry_committed),
    readmeCmd: r.readme_install_cmd == null ? null : String(r.readme_install_cmd),
  };
  const previousNpm = {
    npmPublished: Boolean(r.npm_published),
    npmLatestVersion: r.npm_latest_version == null ? null : String(r.npm_latest_version),
    npmRepoBacklink: Boolean(r.npm_repo_backlink),
    npmDesktopInstallable: Boolean(r.npm_desktop_installable),
    npmRepoDirectory: r.npm_repo_directory == null ? null : String(r.npm_repo_directory),
  };
  // 到点之后不再发起任何新的网络探测，原样返回上一轮事实。
  // complete 必须区分开：rederive 是「没联网但结论有效」，到点跳过是「这轮没问到」
  // ——后者让 probeTimestamp 保留旧时间戳，下一轮才会重探这些行。
  const skipped = !rederive && pastDeadline();
  if (skipped) skippedByDeadline++;
  const result = rederive || skipped
    ? {
        facts: {
          ...previousManifest,
          // 离线重算不联网：npm 版本号、回链与桌面端可安装结论原样保留
          ...previousNpm,
          ...previousRelease,
        },
        complete: rederive,
      }
    : await probe(fullName, {
        manifest: previousManifest,
        npm: previousNpm,
        release: previousRelease,
      });
  if (!rederive && ++done % 100 === 0) console.log(`  …${done}/${rows.length}`);
  return {
    fullName,
    // 到点跳过的行一个字节都不写：facts 原样返回没有新信息，而 derived 是拿
    // 「空的上一轮事实」重算出来的，会得出 not-installable，再经 writeResults
    // 的 is_plugin 那一列把「未知」改写成「确认非插件」。写回去比不写糟得多。
    skipped,
    complete: result.complete,
    facts: result.facts,
    was: previousNpm, // 用来对比桌面端市场契约变了什么
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
}

/**
 * 分片大小：探完一片立刻写库，而不是攒满一万多行最后一把写。
 *
 * 全库一轮要跑几小时，路上必然遇到慢仓库、限流、网络抖动。攒到最后写的话，
 * 中途一被打断（或某几个 slot 卡在长超时里拖垮整轮）就是**一行都没落库**，
 * 前面几小时的抓取全部白费。踩过一次：全库跑到 6700/10923 卡住，只能整轮丢掉。
 * 分片之后，被打断也只损失当前这一片，已完成的部分连探测时间一起落库，
 * 下轮 stale 会自然跳过它们、只补剩下的。
 */
const SLICE = 400;

const results = [];
for (let i = 0; i < rows.length; i += SLICE) {
  const slice = rows.slice(i, i + SLICE);
  const part = await mapPool(slice, CONCURRENCY, probeRow);
  results.push(...part);
  if (!dryRun) {
    const writable = part.filter((r) => !r.skipped);
    if (writable.length) await writeResults(writable);
    if (!rederive) console.log(`  ✓ 已落库 ${Math.min(i + SLICE, rows.length)}/${rows.length}`);
  }
  // 到点就收工：剩下的行连碰都不碰，probed_at 保持旧值，下一轮自然接着探。
  // 这一步要在 dry-run 分支之外——干跑同样该受上限约束。
  if (pastDeadline() && i + SLICE < rows.length) {
    console.log(`\n⏱ 到达 ${deadlineMinutes} 分钟上限，剩余 ${rows.length - i - SLICE} 行留给下一轮。`);
    break;
  }
}

const tally = {};
for (const { derived } of results) {
  const key = derived.reason ? `${derived.kind}(${derived.reason})` : derived.kind;
  tally[key] = (tally[key] ?? 0) + 1;
}
console.log("\n结论分布：");
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(5)}  ${k}`);
}

// 不完整 = 某个来源这轮没问出结果（429/5xx/网络），事实沿用上一轮、探测时间不刷新。
// 连续几轮都不完整才值得人工看：多半是仓库没了或包名换了。
const incomplete = results.filter((r) => !r.complete).length;
if (incomplete) {
  const byDeadline = skippedByDeadline ? `，其中 ${skippedByDeadline} 个是到点后直接跳过的` : "";
  console.log(`\n⚠️ ${incomplete} 个仓库这轮没问全（限流/超时）${byDeadline}，沿用上轮事实、不刷新探测时间，下轮会重探。`);
}

// 桌面端市场契约的变化单独列出来：npm_latest_version 是发给桌面端照着装的精确
// revision，npm_desktop_installable 决定发不发一键安装。这两列变了要看得见。
const entering = results.filter((r) => !r.was.npmDesktopInstallable && r.facts.npmDesktopInstallable);
const leaving = results.filter((r) => r.was.npmDesktopInstallable && !r.facts.npmDesktopInstallable);
const bumped = results.filter(
  (r) =>
    r.facts.npmDesktopInstallable &&
    r.was.npmDesktopInstallable &&
    r.was.npmLatestVersion !== r.facts.npmLatestVersion,
);
if (entering.length || leaving.length || bumped.length) {
  console.log("\n桌面端市场契约变化：");
  if (entering.length) {
    console.log(`  + ${entering.length} 个开始可一键安装`);
    for (const r of entering.slice(0, 10)) console.log(`      ${r.fullName} @ ${r.facts.npmLatestVersion}`);
  }
  if (leaving.length) {
    console.log(`  - ${leaving.length} 个不再可一键安装（包被撤、版本转预发布或复核不过）`);
    for (const r of leaving.slice(0, 10)) console.log(`      ${r.fullName}（原 ${r.was.npmLatestVersion}）`);
  }
  if (bumped.length) {
    console.log(`  ↑ ${bumped.length} 个的安装版本更新`);
    for (const r of bumped.slice(0, 10)) {
      console.log(`      ${r.fullName}: ${r.was.npmLatestVersion} → ${r.facts.npmLatestVersion}`);
    }
  }
}

if (dryRun) {
  console.log("\n--dry-run：未写库。样例：");
  for (const { fullName, derived } of results.slice(0, 15)) {
    console.log(`  ${fullName.padEnd(40)} ${derived.kind.padEnd(16)} ${(derived.cmd ?? "—").split("\n")[0]}`);
  }
  process.exit(0);
}

console.log(`\n已写库：${results.length} 行。`);
console.log(
  `desktop-installable: ${results.filter((r) => r.facts.npmDesktopInstallable).length}`,
);

/** 把一片结果写进库；函数声明会被提升，上面的分片循环直接调用。 */
async function writeResults(part) {
const stmts = part.map(({ fullName, facts, derived, probedAt, complete }) => ({
  sql: `UPDATE plugins SET
          pkg_name = ?, pkg_version = ?, pkg_private = ?, has_bundle = ?, has_prepare = ?,
          entry_needs_build = ?, entry_committed = ?, npm_published = ?, readme_install_cmd = ?,
          release_tgz_url = ?, release_tag = ?, release_prerelease = ?,
          release_asset_name = ?, release_asset_size = ?, release_asset_digest = ?,
          release_etag = ?,
          npm_latest_version = ?, npm_repo_backlink = ?, npm_desktop_installable = ?,
          npm_repo_directory = ?,
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
    facts.npmDesktopInstallable ? 1 : 0,
    facts.npmRepoDirectory ?? null,
    derived.kind,
    derived.cmd,
    derived.source,
    probedAt,
    // 插件归属结论：有 dsh.bundle 清单 → 确认插件；**探测完整**且判定不可安装
    // → 确认非插件；其余保持 NULL 未知。人工标记（is_plugin_manual=1）不覆盖。
    //
    // complete 这个判断是必须的：限流下从没探过的新仓库，事实全空，deriveInstall
    // 会得出 not-installable，于是「这轮没问到」被写成了「确认不是插件」——那会让
    // 它直接从桌面端市场契约与首屏子集里消失（两处都只收 is_plugin=1）。
    // 注释里本来就写着「不完整保持 NULL」，只是实现漏了这一条。
    facts.hasBundle ? 1 : complete && derived.kind === "not-installable" ? 0 : null,
    fullName,
  ],
}));

  for (let i = 0; i < stmts.length; i += 100) {
    await client.batch(stmts.slice(i, i + 100), "write");
  }
}
