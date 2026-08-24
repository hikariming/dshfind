#!/usr/bin/env node
/**
 * 探测头部插件的「累计下载量」，分渠道写回 Turso plugins 表。
 *
 * 用法：
 *   pnpm probe:downloads                      # star ≥ 500、超过 7 天没探的（默认）
 *   pnpm probe:downloads --min-stars 200      # 扩大覆盖（每仓约 3-5 个请求，量力而行）
 *   pnpm probe:downloads --stale-days 30      # 换新鲜度阈值
 *   pnpm probe:downloads --all                # 无视新鲜度全部重探
 *   pnpm probe:downloads --only owner/repo    # 只探一个（可重复传）
 *   pnpm probe:downloads --include-offtopic   # 连蹭热度仓一起探（默认排除）
 *   pnpm probe:downloads --dry-run            # 只打印，不写库
 *
 * 三个渠道，分开存不合并（理由见 scripts/lib/downloads.mjs 顶部）：
 *   dl_npm_total      npm 官方 registry 的生命周期累计
 *   dl_mirror_total   npmmirror（淘宝镜像）的累计——国内用户走镜像，npm 完全统计不到，
 *                     实测占 npm 的 35%~50%，这部分是 shields.io 给不了的
 *   dl_release_total  GitHub Release 全部资产的 download_count 合计
 *
 * 为什么只要累计值：npm 的 point 接口支持任意日期区间（单次上限 18 个月），
 * 生命周期累计一次请求就能拿；周下载则要么被限流（scoped 包只能逐个查，
 * 并发 8 实测 725 次 429），要么得自己存日快照差分。累计值单调、一周跑一次够用。
 *
 * 包名归属必须校验：全库 2,531 个「已发布」里有 1,072 个 package.json 的包名
 * 在 npm 上属于别人（voyager→wieden-kennedy、aegis→killdream、ruflo→claude-flow…），
 * 直接取数会把陌生人的下载量安在作者头上。只有 repository 回链等于本仓库才采信，
 * 占名的事实记进 dl_note，dl_pkg 留空。
 */
import { execFileSync } from "node:child_process";
import { createClient } from "@libsql/client/web";

import { normalizeNpmRepository, npmRepoBacklink } from "./lib/install.mjs";
import {
  NPM_STATS_EPOCH,
  downloadStatus,
  downloadWindows,
  downloadsPointUrl,
  encodePackage,
  isoDay,
  maxPointMonths,
  sumAssetDownloads,
} from "./lib/downloads.mjs";

const CONCURRENCY = 4;
const DEFAULT_MIN_STARS = 500;
const DEFAULT_STALE_DAYS = 7;
/** 单仓最多翻这么多页 release（每页 100）。上千个 tag 的仓库不值得为几十次下载翻到底。 */
const MAX_RELEASE_PAGES = 3;
/** packument 大得离谱时放弃 npm 渠道——只为拿 repository 与 time.created，不值得下载几十 MB。 */
const MAX_PACKUMENT_BYTES = 20_000_000;

// ---------- 参数 ----------

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [argv[i + 1]] : []));
const dryRun = has("--dry-run");
const all = has("--all");
const includeOfftopic = has("--include-offtopic");
const staleDays = Number(val("--stale-days", DEFAULT_STALE_DAYS));
const minStars = Number(val("--min-stars", DEFAULT_MIN_STARS));
const limit = Number(val("--limit", 0));

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
    : "⚠️ 未找到 GITHUB_TOKEN / gh 登录，Release 渠道将使用每小时 60 次的匿名限额",
);

// ---------- 抓取 ----------

/**
 * 带退避的 fetch。撞 429 要等，连接层抖动要重试。
 * 全部重试完仍失败返回 null，调用方按「这轮没测到」处理——不写库，留给下轮 stale 重探，
 * 避免把网络抖动记成「下载量归零」。
 */
async function tryFetch(url, init, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429 || (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0")) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 900 * (i + 1);
        await new Promise((r) => setTimeout(r, Math.min(wait, 60_000)));
        continue;
      }
      return res;
    } catch {
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  return null;
}

function gh(path) {
  return tryFetch(`https://api.github.com${path}`, {
    headers: {
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

/**
 * 仓库根 package.json 里的包名。走 raw 而不是 contents API：不吃 core 配额，
 * 也不需要凭据。私有包（private: true）不返回——它不可能有公开下载量。
 */
async function repoPackageName(fullName) {
  const res = await tryFetch(`https://raw.githubusercontent.com/${fullName}/HEAD/package.json`);
  if (!res) return { ok: false, name: null };
  if (!res.ok) return { ok: true, name: null };
  try {
    const pkg = JSON.parse(await res.text());
    const name = typeof pkg?.name === "string" && !pkg.private ? pkg.name : null;
    return { ok: true, name };
  } catch {
    return { ok: true, name: null }; // package.json 存在但不是合法 JSON，等价于没有
  }
}

/** npm 上这个包的归属与首发时间；null 表示网络失败（与「未发布」是两回事）。 */
async function packument(pkg) {
  const res = await tryFetch(`https://registry.npmjs.org/${encodePackage(pkg)}`);
  if (!res) return null;
  if (res.status === 404) return { published: false };
  if (!res.ok) return null;
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_PACKUMENT_BYTES) return null;
  try {
    const doc = await res.json();
    return {
      published: true,
      repository: doc?.repository ?? null,
      created: typeof doc?.time?.created === "string" ? doc.time.created : NPM_STATS_EPOCH,
    };
  } catch {
    return null;
  }
}

/**
 * 生命周期累计：从包首发日到今天，按 18 个月一段累加。
 * 任何一段失败就整体判「没测到」返回 null——半截的累计值比没有更糟，
 * 会让徽章上的数字莫名其妙地变小。
 */
async function lifetimeDownloads(host, pkg, since, today) {
  const windows = downloadWindows(since, today, maxPointMonths(host));
  if (!windows.length) return null;
  let total = 0;
  for (const window of windows) {
    const res = await tryFetch(downloadsPointUrl(host, pkg, window));
    if (!res) return null;
    // 404 = 该窗口内这个包还不存在（镜像没同步到那么早），算 0 继续
    if (res.status === 404) continue;
    if (!res.ok) return null;
    try {
      const json = await res.json();
      if (typeof json?.downloads !== "number") return null;
      total += json.downloads;
    } catch {
      return null;
    }
  }
  return total;
}

/** Release 全部资产的下载合计；null 表示没测到（保留库里原值）。 */
async function releaseDownloads(fullName) {
  let total = 0;
  for (let page = 1; page <= MAX_RELEASE_PAGES; page++) {
    const res = await gh(`/repos/${fullName}/releases?per_page=100&page=${page}`);
    if (!res) return null;
    if (res.status === 404) return 0; // 仓库没有 releases 端点可读，等价于没有资产
    if (!res.ok) return null;
    let batch;
    try {
      batch = await res.json();
    } catch {
      return null;
    }
    if (!Array.isArray(batch) || batch.length === 0) break;
    total += sumAssetDownloads(batch);
    if (batch.length < 100) break;
  }
  return total;
}

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

// ---------- 单仓探测 ----------

async function probe(row, today) {
  const fullName = String(row.full_name);
  const result = {
    fullName,
    stars: Number(row.stars ?? 0),
    pkg: null,
    npmTotal: null,
    mirrorTotal: null,
    releaseTotal: null,
    note: null,
    failed: false,
  };

  // 1. 包名：库里 probe:install 探过就直接用，没探过现抓一次 package.json
  let pkg = row.pkg_name ? String(row.pkg_name) : null;
  if (!pkg) {
    const found = await repoPackageName(fullName);
    if (!found.ok) {
      result.failed = true;
      return result;
    }
    pkg = found.name;
  }

  // 2. npm：先验归属，回链对不上一律不采信
  let unpublished = false;
  if (pkg) {
    const doc = await packument(pkg);
    if (!doc) {
      result.failed = true;
      return result;
    }
    if (!doc.published) {
      unpublished = true;
    } else if (!npmRepoBacklink(fullName, doc.repository)) {
      // 记下真正的归属方，运营一眼能看出是「撞了个老包」还是「被人抢注」
      const owner = normalizeNpmRepository(doc.repository) ?? "无 repository 字段";
      result.note = `name-taken:${pkg}→${owner}`;
    } else {
      result.pkg = pkg;
      result.npmTotal = await lifetimeDownloads("api.npmjs.org", pkg, doc.created, today);
      result.mirrorTotal = await lifetimeDownloads("registry.npmmirror.com", pkg, doc.created, today);
    }
  }

  // 3. Release 资产：与 npm 互不排斥，桌面端插件两边都有
  result.releaseTotal = await releaseDownloads(fullName);

  result.status = downloadStatus({
    npmTotal: result.npmTotal,
    releaseTotal: result.releaseTotal ?? 0,
    nameTaken: Boolean(result.note),
    unpublished,
  });
  // 三个渠道全军覆没且不是「确实没有」，判没测到，不写库
  result.failed =
    result.npmTotal === null && result.mirrorTotal === null && result.releaseTotal === null;
  return result;
}

// ---------- 主流程 ----------

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
  process.exit(1);
}
const client = createClient({ url: url.replace(/^libsql:\/\//, "https://"), authToken });

// 列可能已存在，duplicate column 忽略即可（与 sync-plugins-db.mjs 的迁移写法一致）
for (const sql of [
  `ALTER TABLE plugins ADD COLUMN dl_pkg TEXT`, // 归属校验通过的 npm 包名
  `ALTER TABLE plugins ADD COLUMN dl_npm_total INTEGER`,
  `ALTER TABLE plugins ADD COLUMN dl_mirror_total INTEGER`,
  `ALTER TABLE plugins ADD COLUMN dl_release_total INTEGER`,
  `ALTER TABLE plugins ADD COLUMN dl_status TEXT`, // npm / release / npm+release / name-taken / unpublished / none
  `ALTER TABLE plugins ADD COLUMN dl_note TEXT`, // 占名等异常的说明，给运营看
  `ALTER TABLE plugins ADD COLUMN dl_probed_at TEXT`,
]) {
  try {
    await client.execute(sql);
  } catch (err) {
    if (!/duplicate column/i.test(String(err?.message ?? err))) throw err;
  }
}

const where = ["is_present = 1", "is_risky = 0"];
const args = [];
if (!includeOfftopic) where.push("is_offtopic = 0");
if (only.length) {
  where.push(`full_name IN (${only.map(() => "?").join(",")})`);
  args.push(...only);
} else {
  if (minStars > 0) where.push(`stars >= ${minStars}`);
  if (!all) {
    where.push(`(dl_probed_at IS NULL OR dl_probed_at < datetime('now', '-${staleDays} days'))`);
  }
}

const rows = (
  await client.execute({
    sql: `SELECT full_name, stars, pkg_name, dl_npm_total, dl_mirror_total, dl_release_total
          FROM plugins WHERE ${where.join(" AND ")}
          ORDER BY stars DESC${limit > 0 ? ` LIMIT ${limit}` : ""}`,
    args,
  })
).rows;

console.log(
  `待探测 ${rows.length} 个仓库（star ≥ ${minStars}${includeOfftopic ? "，含蹭热度仓" : ""}，并发 ${CONCURRENCY}）…`,
);

const today = isoDay(new Date());
let done = 0;
const results = await mapPool(rows, CONCURRENCY, async (row) => {
  const out = await probe(row, today);
  done++;
  if (done % 20 === 0) console.log(`  …${done}/${rows.length}`);
  // 累计值只应该涨，掉了就报出来：可能是包被 unpublish、资产被删，也可能是接口抽风
  for (const [label, next, prev] of [
    ["npm", out.npmTotal, row.dl_npm_total],
    ["镜像", out.mirrorTotal, row.dl_mirror_total],
    ["release", out.releaseTotal, row.dl_release_total],
  ]) {
    if (next != null && prev != null && Number(next) < Number(prev)) {
      console.warn(`  ⚠️ ${out.fullName} 的${label}累计从 ${prev} 掉到 ${next}`);
    }
  }
  return out;
});

const measured = results.filter((r) => !r.failed);
const skipped = results.length - measured.length;
const now = new Date().toISOString();

if (dryRun) {
  console.log("\n--dry-run，未写库。");
} else {
  // 各渠道分别 COALESCE：某个渠道这轮没测到就保留原值，不要把它抹成 NULL
  const stmts = measured.map((r) => ({
    sql: `UPDATE plugins
          SET dl_pkg = ?,
              dl_npm_total = COALESCE(?, dl_npm_total),
              dl_mirror_total = COALESCE(?, dl_mirror_total),
              dl_release_total = COALESCE(?, dl_release_total),
              dl_status = ?, dl_note = ?, dl_probed_at = ?
          WHERE full_name = ?`,
    args: [r.pkg, r.npmTotal, r.mirrorTotal, r.releaseTotal, r.status, r.note, now, r.fullName],
  }));
  for (let i = 0; i < stmts.length; i += 100) {
    await client.batch(stmts.slice(i, i + 100), "write");
  }
  console.log(`\n已写库：${stmts.length} 行。`);
}

// ---------- 汇报 ----------

const byStatus = new Map();
for (const r of measured) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
const combined = (r) => (r.npmTotal ?? 0) + (r.mirrorTotal ?? 0) + (r.releaseTotal ?? 0);
const withData = measured.filter((r) => combined(r) > 0);

console.log(`\n本轮测到 ${measured.length} 个${skipped ? `（${skipped} 个网络失败，未写库，下轮重试）` : ""}`);
for (const status of ["npm", "npm+release", "release", "name-taken", "unpublished", "none"]) {
  if (byStatus.get(status)) console.log(`  ${status.padEnd(12)} ${byStatus.get(status)}`);
}

const nameTaken = measured.filter((r) => r.note);
if (nameTaken.length) {
  console.log(`\n包名被别人占（已拦下，不采信其下载量）${nameTaken.length} 个：`);
  for (const r of nameTaken.slice(0, 10)) console.log(`  ★${String(r.stars).padStart(6)} ${r.fullName} ${r.note}`);
}

console.log("\n累计下载 Top 20（npm / 镜像 / release，刻意不合并）:");
for (const r of withData.sort((a, b) => combined(b) - combined(a)).slice(0, 20)) {
  console.log(
    `  ★${String(r.stars).padStart(6)} ${r.fullName.padEnd(44)} npm ${String(r.npmTotal ?? "-").padStart(8)}  镜像 ${String(r.mirrorTotal ?? "-").padStart(7)}  release ${String(r.releaseTotal ?? "-").padStart(8)}`,
  );
}
