#!/usr/bin/env node
/**
 * 一条命令跑完整轮站点数据刷新：GitHub → Turso → 静态快照 → 构建 → 提交 → 部署。
 *
 * 用法：
 *   pnpm refresh                      # 同步 + 下载量 + 重生成 + 构建 + 提交（不推）
 *   pnpm refresh --push               # 再加一步 push origin main（= 上生产）
 *   pnpm refresh --with-contributors  # 连贡献者数一起同步（约 3 小时，跨 3 个限额窗口）
 *   pnpm refresh --min-stars 200      # 下载量/安装方式探测的 star 门槛（默认 100）
 *   pnpm refresh --skip-sync          # 只重生成静态数据（GitHub 那步刚跑过时用）
 *   pnpm refresh --skip-downloads     # 跳过下载量探测
 *   pnpm refresh --skip-install       # 跳过安装方式探测
 *   pnpm refresh --skip-build         # 跳过 next build 验证（不建议）
 *   pnpm refresh --no-commit          # 只更新文件，不碰 git
 *   pnpm refresh --dry-run            # 只打印将要执行的步骤
 *
 * 五步各自解决什么：
 *   1. sync:db        新仓库、star、快照（生态每天新增上千个仓库，这步不跑其余都是旧的）
 *   2. probe:downloads 头部插件的累计下载量（增量：只探没探过或超 7 天的）
 *   3. probe:install   头部插件的安装方式与 npm 最新版本
 *   4. gen:data       静态快照 = 首页三条 rail + 插件库 + 排名 + 文档/课程清单
 *   5. build          验证；随后只提交生成物这几个文件
 *
 * 第 3 步不是可选的锦上添花：npm_latest_version 会作为精确 revision 发给 DSH
 * 桌面端插件市场（/market/v1/plugins），桌面端照着它装。头部插件一周能发十几个
 * 版本，这一步不跑，市场里的用户就一直装到几周前的旧版本。
 *
 * 为什么只提交生成物：工作区里经常有在途的功能代码（未提交的新模块等），
 * 一把 `git add -A` 会把没验证过的东西一起推上生产。这里显式列出 GENERATED
 * 白名单，其余改动一律留在工作区。
 *
 * push 目标写死 origin：本仓库有两个远端（origin=hikariming/dshfind 驱动生产，
 * dsh-external 是镜像），推错远端的结果是「以为部署了，其实生产没动」。
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { openDb } from "./lib/db.mjs";

/** 只有这几个文件是 gen:data 的产物，也只有它们会被提交。 */
const GENERATED = [
  "src/lib/plugins-real.ts",
  "src/lib/plugin-i18n.ts",
  "src/lib/home-picks.ts",
  "src/lib/ranking-real.ts",
  "src/lib/docs-manifest.ts",
  "src/lib/lessons-manifest.ts",
];

const PUSH_REMOTE = "origin";
const PUSH_BRANCH = "main";

// ---------- 参数 ----------

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const opts = {
  push: has("--push"),
  withContributors: has("--with-contributors"),
  minStars: val("--min-stars", "100"),
  skipSync: has("--skip-sync"),
  skipDownloads: has("--skip-downloads"),
  skipInstall: has("--skip-install"),
  skipBuild: has("--skip-build"),
  commit: !has("--no-commit"),
  dryRun: has("--dry-run"),
};

// ---------- 小工具 ----------

const t0 = Date.now();
const elapsed = () => `${((Date.now() - t0) / 1000 / 60).toFixed(1)}min`;

function step(n, total, title) {
  console.log(`\n${"═".repeat(64)}\n▶ [${n}/${total}] ${title}   （已用 ${elapsed()}）\n${"═".repeat(64)}`);
}

/** 跑一个子命令，输出直通终端；失败即中止——半截的数据比不刷新更糟。 */
function run(cmd, args, label) {
  if (opts.dryRun) {
    console.log(`  [dry-run] ${cmd} ${args.join(" ")}`);
    return;
  }
  const res = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  if (res.status !== 0) {
    console.error(`\n✖ ${label} 失败（退出码 ${res.status}），已中止。工作区未提交，可修复后重跑。`);
    process.exit(1);
  }
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
  return openDb();
}

const num = (v) => (typeof v === "bigint" ? Number(v) : Number(v ?? 0));

/** 库里的关键计数，用于前后对比出「这轮到底变了什么」。 */
async function snapshotCounts() {
  const client = db();
  const q = async (sql) => num((await client.execute(sql)).rows[0].c);
  return {
    plugins: await q(`SELECT COUNT(*) c FROM plugins WHERE is_present = 1`),
    withDownloads: await q(`SELECT COUNT(*) c FROM plugins WHERE dl_probed_at IS NOT NULL`),
    scored: await q(`SELECT COUNT(*) c FROM plugins WHERE score IS NOT NULL`),
    // 桌面端市场能一键安装的条数——这是 /market/v1/plugins 里带 package 的那批
    marketInstallable: await q(
      `SELECT COUNT(*) c FROM plugins WHERE is_present = 1 AND is_offtopic = 0 AND npm_desktop_installable = 1`,
    ),
  };
}

/** 首页三条 rail 的当前阵容，用于报「首页换了谁」。 */
function homeRails() {
  try {
    const src = readFileSync("src/lib/home-picks.ts", "utf8");
    const pick = (name) => {
      const block = src.split(`export const ${name}`)[1]?.split("];")[0] ?? "";
      return [...block.matchAll(/fullName: "([^"]+)"/g)].map((m) => m[1]);
    };
    return {
      editor: pick("editorPool").slice(0, 6),
      trending: pick("trendingPicks"),
      newcomers: pick("newcomerPicks"),
    };
  } catch {
    return { editor: [], trending: [], newcomers: [] };
  }
}

function diffList(before, after) {
  const added = after.filter((x) => !before.includes(x));
  const removed = before.filter((x) => !after.includes(x));
  return { added, removed };
}

function railLine(label, before, after) {
  const { added, removed } = diffList(before, after);
  if (!added.length && !removed.length) return `  ${label}：无变化`;
  const bits = [];
  if (added.length) bits.push(`+ ${added.join(", ")}`);
  if (removed.length) bits.push(`- ${removed.join(", ")}`);
  return `  ${label}：${bits.join("　")}`;
}

// ---------- 主流程 ----------

// API 边缘 Worker 的产物与部署（docs/d1-migration-plan.md P4）。
// 切流后在 .env.local 置 API_EDGE_DEPLOY=1：数据刷新必须连带重发产物，
// 否则桌面端拿到旧 data_version 会一直吃 409 循环重同步。切流前默认只生成不部署。
const apiEdgeDeploy = process.env.API_EDGE_DEPLOY === "1";
// 双写一致性核对需要内部路由；未配置时跳过并醒目告警（闸门期不该出现这种状态）。
const canCheckConsistency = !!process.env.D1_INTERNAL_URL && !!process.env.D1_INTERNAL_TOKEN;

const steps = [
  !opts.skipSync && "同步 GitHub → Turso",
  !opts.skipDownloads && "探测头部插件下载量",
  !opts.skipInstall && "探测头部插件安装方式",
  canCheckConsistency && "双写一致性核对",
  "重新生成静态快照",
  "生成 API 边缘产物",
  apiEdgeDeploy && "部署 api-edge Worker",
  !opts.skipBuild && "构建验证",
  opts.commit && "提交生成物",
  opts.push && `推送 ${PUSH_REMOTE}/${PUSH_BRANCH}（上生产）`,
].filter(Boolean);

console.log(`本轮 ${steps.length} 步：${steps.join(" → ")}`);
if (opts.dryRun) console.log("（--dry-run，不会真的执行）");

const before = opts.dryRun ? null : await snapshotCounts();
const railsBefore = homeRails();
let n = 0;

if (!opts.skipSync) {
  step(++n, steps.length, "同步 GitHub → Turso");
  const args = ["scripts/sync-plugins-db.mjs"];
  // 贡献者数要逐仓库打 core API（限额 5000/时），全量一轮约 3 小时；默认沿用上一轮的值
  if (!opts.withContributors) args.push("--skip-contributors");
  run("node", args, "sync:db");
}

if (!opts.skipDownloads) {
  step(++n, steps.length, `探测头部插件下载量（star ≥ ${opts.minStars}）`);
  run(
    "node",
    ["scripts/probe-downloads.mjs", "--min-stars", opts.minStars, "--include-offtopic"],
    "probe:downloads",
  );
}

if (!opts.skipInstall) {
  step(++n, steps.length, `探测头部插件安装方式（star ≥ ${opts.minStars}）`);
  // --all 而不是靠 stale：头部插件发版比 7 天的新鲜度阈值快得多，
  // 而这批只有一百多个仓库，全量重探也就一两分钟。
  run(
    "node",
    ["scripts/probe-install.mjs", "--all", "--min-stars", opts.minStars],
    "probe:install",
  );
}

if (canCheckConsistency) {
  step(++n, steps.length, "双写一致性核对");
  run("node", ["scripts/check-db-consistency.mjs"], "check:consistency");
} else {
  console.warn("\n⚠ 未配置 D1_INTERNAL_URL / D1_INTERNAL_TOKEN，跳过双写一致性核对");
}

step(++n, steps.length, "重新生成静态快照");
run("pnpm", ["run", "gen:data"], "gen:data");

step(++n, steps.length, "生成 API 边缘产物");
run("node", ["scripts/gen-api-artifacts.mjs"], "gen:api-artifacts");

if (apiEdgeDeploy) {
  step(++n, steps.length, "部署 api-edge Worker");
  run(
    "pnpm",
    ["exec", "wrangler", "deploy", "--config", "workers/api-edge/wrangler.jsonc"],
    "deploy:api-edge",
  );
}

if (!opts.skipBuild) {
  step(++n, steps.length, "构建验证");
  run("pnpm", ["run", "build"], "build");
}

// ---------- 汇报 ----------

const after = opts.dryRun ? null : await snapshotCounts();
const railsAfter = homeRails();

console.log(`\n${"═".repeat(64)}\n本轮变化\n${"═".repeat(64)}`);
if (before && after) {
  const delta = (a, b) => (b - a >= 0 ? `+${b - a}` : `${b - a}`);
  console.log(`  收录插件    ${before.plugins} → ${after.plugins}（${delta(before.plugins, after.plugins)}）`);
  console.log(`  有下载量    ${before.withDownloads} → ${after.withDownloads}（${delta(before.withDownloads, after.withDownloads)}）`);
  console.log(`  已评分      ${before.scored} → ${after.scored}（${delta(before.scored, after.scored)}）`);
  console.log(
    `  桌面端可装  ${before.marketInstallable} → ${after.marketInstallable}（${delta(before.marketInstallable, after.marketInstallable)}）`,
  );
}
console.log("首页三条 rail：");
console.log(railLine("编辑推荐", railsBefore.editor, railsAfter.editor));
console.log(railLine("本周飙升", railsBefore.trending, railsAfter.trending));
console.log(railLine("新面孔  ", railsBefore.newcomers, railsAfter.newcomers));

// ---------- 提交与部署 ----------

if (!opts.commit) {
  console.log("\n--no-commit，文件已更新但未提交。");
  process.exit(0);
}

const changed = opts.dryRun
  ? []
  : git(["diff", "--name-only", "--", ...GENERATED]).split("\n").filter(Boolean);

if (!opts.dryRun && changed.length === 0) {
  console.log("\n生成物没有变化，无需提交。");
  process.exit(0);
}

step(++n, steps.length, "提交生成物");
console.log(`  只提交这些文件（工作区其余改动原样保留）：\n${changed.map((f) => `    ${f}`).join("\n")}`);

const message =
  before && after
    ? `数据刷新：插件 ${before.plugins} → ${after.plugins}，下载量覆盖 ${after.withDownloads}`
    : "数据刷新";

if (opts.dryRun) {
  console.log(`  [dry-run] git add ${changed.join(" ")} && git commit -m "${message}"`);
} else {
  git(["add", ...changed]);
  git(["commit", "-m", message]);
  console.log(`  已提交：${git(["log", "--oneline", "-1"])}`);
}

if (!opts.push) {
  console.log(
    `\n未推送。确认无误后跑：git push ${PUSH_REMOTE} ${PUSH_BRANCH}` +
      `\n（注意远端必须是 ${PUSH_REMOTE}——推到 dsh-external 镜像仓不会触发生产部署）`,
  );
  process.exit(0);
}

step(++n, steps.length, `推送 ${PUSH_REMOTE}/${PUSH_BRANCH}`);
run("git", ["push", PUSH_REMOTE, PUSH_BRANCH], "git push");
console.log(
  `\n已推送，Cloudflare Workers Builds 会自动构建（约 6 分钟）。` +
    `\n验证：curl -s https://dshfind.com/zh/plugins | grep -o '共 [0-9,]* 个'`,
);
console.log(`\n全部完成，用时 ${elapsed()}。`);
