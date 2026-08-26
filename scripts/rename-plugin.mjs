#!/usr/bin/env node
/**
 * 仓库改名迁移：把旧 full_name 上沉淀的运营数据搬到新 full_name。
 *
 *   node --env-file=.env.local scripts/rename-plugin.mjs <旧 owner/repo> <新 owner/repo> [--dry-run] [--skip-verify]
 *
 * 为什么需要它：全库以 full_name 为主键，sync-plugins-db.mjs 靠「本轮搜索结果里还在不在」
 * 判断存活，认不出 GitHub 改名。一次改名会被读成两件事——旧名消失（软删 is_present=0）、
 * 新名出现（当成新仓库插入）。后果：旧 URL 404，评分/精选/手工下载量/四语言描述/star 历史
 * 全 stranded 在旧行上，新行是一张白纸。已经踩过两次：
 *   dsh-web-ui → dsh-web（commit 1dbdd9c）、deepseek-harness-desktop → dsh-desktop。
 *
 * 迁移口径分三类：
 *   CARRY  运营人工列——同步/探测管道自己不会写，旧行的值就是唯一真相，直接覆盖新行。
 *   GROUP  探测列——按各自的 *_probed_at / scored_at 整组比新旧，晚的那组胜出。
 *          必须整组走：评分四列、徽标五列各自内部一致，单列挑着搬会拼出自相矛盾的行
 *          （比如 score 是旧的、scored_at 是新的）。也不能无脑 CARRY——新行常常
 *          已被重新评过分/重新探过，拿旧值盖上去是回退。
 *   FILL   其余零散列——只在新行为 NULL 时补。
 * 子表（i18n / 快照 / 投票 / 配图 / 论坛帖）整体 re-key 到新名。
 *
 * 旧行保留（is_present=0，站点所有查询都带这个过滤，不会露出来），留作审计痕迹。
 * 迁移成功后自动往 src/lib/plugin-renames.ts 记一条，旧 URL 与旧徽标据此 301。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { openDb } from "./lib/db.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const SKIP_VERIFY = args.includes("--skip-verify");
const positional = args.filter((a) => !a.startsWith("--"));
const [OLD, NEW] = positional;

if (!OLD || !NEW || !OLD.includes("/") || !NEW.includes("/")) {
  console.error(
    "用法：node --env-file=.env.local scripts/rename-plugin.mjs <旧 owner/repo> <新 owner/repo> [--dry-run] [--skip-verify]",
  );
  process.exit(1);
}

/**
 * 标记类布尔列取并集：任一行为 1 则新行为 1。
 *
 * 不能用「旧行覆盖新行」——新行身上也可能有独立成立的判断：is_insider 由同步
 * 按 owner 白名单自动加（改名换了 owner 时新行才是对的），is_featured 也可能是
 * 改名后新打的。旧行是改名那一刻的快照，没人会再去编辑它，所以并集只会加不会减，
 * 恰好是想要的语义。
 */
const FLAGS_OR = [
  "is_offtopic",
  "is_insider",
  "is_featured",
  "is_official",
  "is_risky",
];

/** 降权标记反过来取交集：任一行为 0（被运营降过权）则新行为 0。 */
const FLAGS_AND = ["featured_boost"];

/** 运营人工填的文本/数值：只在新行为空时补，不覆盖新行上已有的说法。 */
const CARRY = ["risk_note", "install_cmd", "dl_manual_total", "dl_manual_note"];

/** 探测列分组：整组比 stamp（该组的探测时间列），晚的一组胜出。 */
const GROUPS = [
  {
    name: "评分",
    stamp: "scored_at",
    cols: ["score", "score_detail", "scored_at", "score_version"],
  },
  {
    name: "徽标/友链",
    stamp: "badge_probed_at",
    cols: ["has_badge", "dshfind_link", "dshfind_repo_link", "badge_probed_at"],
  },
  {
    name: "安装方式",
    stamp: "install_probed_at",
    cols: [
      "pkg_name",
      "pkg_version",
      "pkg_private",
      "has_bundle",
      "has_prepare",
      "entry_needs_build",
      "entry_committed",
      "npm_published",
      "npm_latest_version",
      "npm_repo_backlink",
      "npm_desktop_installable",
      "install_kind",
      "install_cmd_auto",
      "install_source",
      "install_probed_at",
      "readme_install_cmd",
      "release_tgz_url",
      "release_tag",
      "release_prerelease",
      "release_asset_name",
      "release_asset_size",
      "release_asset_digest",
      // release_etag 刻意不搬：它是给下一次条件请求用的，搬过来会让探测拿到
      // 304 直接跳过，新仓库的 Release 反而永远刷不出来。留空，下轮重探。
    ],
  },
  {
    name: "下载量",
    stamp: "dl_probed_at",
    cols: [
      "dl_pkg",
      "dl_npm_total",
      "dl_mirror_total",
      "dl_release_total",
      "dl_status",
      "dl_note",
      "dl_probed_at",
    ],
  },
];

/** 零散列：只在新行为 NULL 时补。 */
const FILL = ["contributors"];

/** 「首次」类列取更早的：改名不该让老项目变成新面孔，也不该重置徽标挂了多久。 */
const EARLIEST = ["first_seen_at", "badge_first_seen_at"];

/** 子表 → 外键列。plugin_images 的 full_name 是主键，冲突行直接丢。 */
const CHILD_TABLES = [
  ["plugin_i18n", "full_name"],
  ["plugin_snapshots", "full_name"],
  ["plugin_votes", "full_name"],
  ["plugin_images", "full_name"],
  ["forum_threads", "plugin_full_name"],
];

function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
  }
  return openDb();
}

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/**
 * 确认这两个名字真是同一个 GitHub 仓库：请求旧名，GitHub 会 301 到改名后的地址。
 * 防的是手滑把两个不相干的仓库合并——那种错误没有回滚路径（旧行的运营数据会被
 * 写进另一个仓库，且子表整体 re-key）。
 */
async function verifySameRepo() {
  const token = githubToken();
  const res = await fetch(`https://api.github.com/repos/${OLD}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(
      `GitHub 校验失败：${OLD} 返回 ${res.status}（确认改名属实后可加 --skip-verify 跳过）`,
    );
  }
  const repo = await res.json();
  if (String(repo.full_name).toLowerCase() !== NEW.toLowerCase()) {
    throw new Error(
      `GitHub 上 ${OLD} 现在指向 ${repo.full_name}，不是 ${NEW}——请核对参数`,
    );
  }
  console.log(`GitHub 校验通过：${OLD} → ${repo.full_name}（repo id ${repo.id}）`);
}

const client = db();

async function row(fullName) {
  const rs = await client.execute({
    sql: `SELECT * FROM plugins WHERE lower(full_name) = lower(?)`,
    args: [fullName],
  });
  return rs.rows[0] ?? null;
}

const oldRow = await row(OLD);
const newRow = await row(NEW);

if (!oldRow) throw new Error(`旧行不存在：${OLD}`);
if (!newRow) {
  throw new Error(
    `新行不存在：${NEW}——先跑一轮 sync-plugins-db.mjs 把新名带进库，再迁移`,
  );
}
if (String(oldRow.full_name) === String(newRow.full_name)) {
  throw new Error("新旧名相同，无需迁移");
}
if (!SKIP_VERIFY) await verifySameRepo();

// ---------- 组装 plugins 表的更新 ----------

const sets = [];
const vals = [];
const plan = [];

const has = (v) => v !== null && v !== undefined && v !== "";

for (const col of FLAGS_OR) {
  if (Number(oldRow[col]) !== 1 || Number(newRow[col]) === 1) continue;
  sets.push(`${col} = 1`);
  plan.push(`  FLAG  ${col}: 0 → 1（旧行有标记，取并集）`);
}

for (const col of FLAGS_AND) {
  if (Number(oldRow[col]) !== 0 || Number(newRow[col]) === 0) continue;
  sets.push(`${col} = 0`);
  plan.push(`  FLAG  ${col}: 1 → 0（旧行被降过权，取交集）`);
}

for (const col of CARRY) {
  const from = oldRow[col];
  const to = newRow[col];
  if (!has(from)) continue;
  if (has(to)) continue;
  sets.push(`${col} = ?`);
  vals.push(from);
  plan.push(`  CARRY ${col}: (空) → ${fmt(from)}`);
}

for (const g of GROUPS) {
  const oldStamp = oldRow[g.stamp];
  const newStamp = newRow[g.stamp];
  if (!has(oldStamp)) continue;
  // 新行探得更晚就整组留着——它反映的是改名后的仓库现状
  if (has(newStamp) && String(newStamp) >= String(oldStamp)) {
    plan.push(
      `  KEEP  ${g.name}组：新行 ${g.stamp}=${fmt(newStamp)} 不早于旧行 ${fmt(oldStamp)}，保留新值`,
    );
    continue;
  }
  const changed = g.cols.filter((c) => oldRow[c] !== newRow[c]);
  if (changed.length === 0) continue;
  for (const col of g.cols) {
    sets.push(`${col} = ?`);
    vals.push(oldRow[col] ?? null);
  }
  plan.push(
    `  GROUP ${g.name}组整组搬旧值（旧 ${g.stamp}=${fmt(oldStamp)} vs 新 ${fmt(newStamp)}）：` +
      changed.map((c) => `${c} ${fmt(newRow[c])}→${fmt(oldRow[c])}`).join("；"),
  );
}

for (const col of FILL) {
  const from = oldRow[col];
  const to = newRow[col];
  if (from === null || from === undefined) continue;
  if (to !== null && to !== undefined) continue;
  sets.push(`${col} = ?`);
  vals.push(from);
  plan.push(`  FILL  ${col}: (空) → ${fmt(from)}`);
}

for (const col of EARLIEST) {
  const from = oldRow[col];
  const to = newRow[col];
  if (!has(from)) continue;
  if (has(to) && String(to) <= String(from)) continue;
  sets.push(`${col} = ?`);
  vals.push(from);
  plan.push(`  EARLY ${col}: ${fmt(to)} → ${fmt(from)}`);
}

// 分类只在运营锁定时搬——否则交给每日自动分类，它按新描述/topic 算得更准
if (Number(oldRow.category_manual) === 1) {
  sets.push(`category = ?`, `category_manual = 1`);
  vals.push(oldRow.category);
  plan.push(`  CARRY category: ${fmt(newRow.category)} → ${fmt(oldRow.category)}（手工锁定）`);
}

// 同理，is_plugin 只搬人工判定的那部分，探测结论留给 probe-install
if (Number(oldRow.is_plugin_manual) === 1) {
  sets.push(`is_plugin = ?`, `is_plugin_manual = 1`);
  vals.push(oldRow.is_plugin);
  plan.push(`  CARRY is_plugin: ${fmt(newRow.is_plugin)} → ${fmt(oldRow.is_plugin)}（手工锁定）`);
}

function fmt(v) {
  if (v === null || v === undefined) return "(空)";
  const s = String(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

/**
 * 把 旧名 → 新名 记进 src/lib/plugin-renames.ts，旧 URL 与旧徽标据此 301。
 * 落在代码里而不是库里的理由见那个文件的头注释。
 *
 * 链式改名（A → B，之后 B → C）在写入时拍平：既有的 A → B 一并改写成 A → C，
 * 读取端因此永远只需一跳，不用防环。
 */
function recordRename(from, to) {
  const file = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../src/lib/plugin-renames.ts",
  );
  const src = readFileSync(file, "utf8");
  const open = src.indexOf("const renames: Record<string, string> = {");
  const close = src.indexOf("};", open);
  if (open === -1 || close === -1) {
    console.warn(`! 没能在 ${file} 里定位映射表，请手工补一条：${from} → ${to}`);
    return;
  }

  const body = src.slice(src.indexOf("{", open) + 1, close);
  const entries = new Map();
  for (const m of body.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
    entries.set(m[1], m[2]);
  }

  const before = entries.size;
  // 链式改名拍平：指向旧名的既有条目改指新名
  let rewired = 0;
  for (const [k, v] of entries) {
    if (v.toLowerCase() === from.toLowerCase()) {
      entries.set(k, to);
      rewired++;
    }
  }
  entries.set(from, to);

  const lines = [...entries]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  writeFileSync(
    file,
    src.slice(0, src.indexOf("{", open) + 1) + "\n" + lines.join("\n") + "\n" + src.slice(close),
  );

  console.log(
    entries.size === before
      ? `plugin-renames.ts：${from} 已在表内，未重复添加` +
          (rewired ? `（顺带把 ${rewired} 条链式指向改到新名）` : "")
      : `plugin-renames.ts：+1 条 ${from} → ${to}（共 ${entries.size} 条）` +
          (rewired ? `，并把 ${rewired} 条链式指向改到新名` : ""),
  );
}

console.log(`\n迁移 ${oldRow.full_name} → ${newRow.full_name}`);
console.log(`\nplugins 表 ${plan.length} 处改动：`);
console.log(plan.length ? plan.join("\n") : "  （无）");

// ---------- 子表 ----------

const childPlan = [];
for (const [table, col] of CHILD_TABLES) {
  const rs = await client.execute({
    sql: `SELECT
            SUM(CASE WHEN lower(${col}) = lower(?) THEN 1 ELSE 0 END) AS old_n,
            SUM(CASE WHEN lower(${col}) = lower(?) THEN 1 ELSE 0 END) AS new_n
          FROM ${table}`,
    args: [OLD, NEW],
  });
  const oldN = Number(rs.rows[0].old_n ?? 0);
  const newN = Number(rs.rows[0].new_n ?? 0);
  if (oldN > 0) childPlan.push({ table, col, oldN, newN });
}

console.log(`\n子表 re-key：`);
if (childPlan.length === 0) {
  console.log("  （无）");
} else {
  for (const c of childPlan) {
    console.log(
      `  ${c.table}.${c.col}: ${c.oldN} 条 → 新名` +
        (c.newN ? `（新名已有 ${c.newN} 条，主键冲突的旧条丢弃）` : ""),
    );
  }
}

if (DRY) {
  console.log("\n--dry-run：未写库。");
  process.exit(0);
}

// ---------- 执行 ----------

const stmts = [];
if (sets.length) {
  stmts.push({
    sql: `UPDATE plugins SET ${sets.join(", ")} WHERE full_name = ?`,
    args: [...vals, String(newRow.full_name)],
  });
}
for (const { table, col } of childPlan) {
  // OR IGNORE：主键/唯一键撞上新名已有的行时跳过，随后统一删掉旧名残留
  stmts.push({
    sql: `UPDATE OR IGNORE ${table} SET ${col} = ? WHERE lower(${col}) = lower(?)`,
    args: [String(newRow.full_name), OLD],
  });
  stmts.push({
    sql: `DELETE FROM ${table} WHERE lower(${col}) = lower(?)`,
    args: [OLD],
  });
}
// 旧行保持软删；站点所有查询都带 is_present = 1，不会露出来
stmts.push({
  sql: `UPDATE plugins SET is_present = 0 WHERE full_name = ?`,
  args: [String(oldRow.full_name)],
});

await client.batch(stmts, "write");

console.log(`\n已写库（${stmts.length} 条语句）。旧行 ${oldRow.full_name} 保留为 is_present=0，留作审计痕迹。`);

recordRename(String(oldRow.full_name), String(newRow.full_name));

console.log("接下来：pnpm gen:data 重生成静态快照，再 pnpm build 验证并提交。");
console.log(`注意：旧 URL /plugins/${OLD} 与 /api/badge/${OLD} 仍然指不到东西，那需要 301 / 别名，不在本脚本职责内。`);
