#!/usr/bin/env node
/**
 * 运营打标：给插件设置 蹭热度 / 内测用户 / 优质项目 / 风险可疑 / 分类。
 *
 * 用法（fullName 大小写不敏感）：
 *   node --env-file=.env.local scripts/flag-plugin.mjs <owner/repo> [--offtopic=0|1] [--insider=0|1] [--featured=0|1] [--risky=0|1] [--risk-note=<文案>] [--category=<slug>|auto]
 *   node --env-file=.env.local scripts/flag-plugin.mjs --list             # 列出已打标的插件
 *
 * 例：
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --offtopic=1     # 标蹭热度（站点隐藏）
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --featured=1 --insider=1
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --boost=0             # 降权：留标不置顶
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --risky=1 --risk-note="假冒 xxx/yyy 的非 fork 副本"
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --risky=0 --risk-note=  # 摘标并清空说明
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --category=skin  # 手动定分类（每日同步不再覆盖）
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --category=auto  # 交还给自动分类
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --plugin=0       # 人工标记非插件（API 对桌面端过滤）
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --plugin=auto    # 交还给探测管道
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --downloads=200000 --downloads-note="官网统计"
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --downloads=auto  # 撤回手工数，回到探测值
 *
 * --boost=0 只摘置顶权重：is_featured 与徽标（/api/badge、/api/card）原样保留，
 * 对方 README 里的 ✦ Featured 不受影响，列表改按 star 走正常位次。--boost=1 恢复置顶。
 *
 * 布尔标记列每日同步不会碰；--category=<slug> 会置 category_manual=1，同步永不覆盖。
 * --plugin=0|1 会置 is_plugin_manual=1，probe-install 管道不再改写 is_plugin。
 * 风险标（is_risky）不隐藏条目：列表沉底 + 挂警示徽标，详情页展示 risk_note 并 noindex。
 */
import { openDb } from "./lib/db.mjs";

import { CATEGORIES, classifyPlugin } from "./lib/categories.mjs";

const FLAGS = ["offtopic", "insider", "featured", "official", "risky"];

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN（用 --env-file=.env.local 运行）");
  process.exit(1);
}
const client = openDb();

const args = process.argv.slice(2);

if (args.includes("--list")) {
  const rs = await client.execute(
    `SELECT full_name, stars, is_offtopic, is_insider, is_featured, featured_boost, is_official, is_risky, risk_note, category, category_manual, is_plugin, is_plugin_manual
     FROM plugins WHERE is_offtopic + is_insider + is_featured + is_official + is_risky + category_manual + is_plugin_manual + (1 - featured_boost) > 0
     ORDER BY is_official DESC, is_featured DESC, stars DESC`,
  );
  for (const r of rs.rows) {
    const marks = [
      Number(r.is_official) ? "🏛官方" : "",
      Number(r.is_featured) ? (Number(r.featured_boost) ? "✨优质" : "✨优质(降权)") : "",
      Number(r.is_insider) ? "内测" : "",
      Number(r.is_offtopic) ? "🚫蹭热度" : "",
      Number(r.is_risky) ? `⚠️风险${r.risk_note ? `（${r.risk_note}）` : ""}` : "",
      Number(r.category_manual) ? `📌${r.category || "未分类"}` : "",
      Number(r.is_plugin_manual) ? (Number(r.is_plugin) ? "🧩手工插件" : "🚫手工非插件") : "",
    ].filter(Boolean).join(" ");
    console.log(`  ${r.full_name}  ⭐${r.stars}  ${marks}`);
  }
  console.log(`共 ${rs.rows.length} 个已打标`);
  process.exit(0);
}

const USAGE = `用法：flag-plugin.mjs <owner/repo> --offtopic=0|1 --insider=0|1 --featured=0|1 --boost=0|1 --official=0|1 --risky=0|1 --risk-note=<文案> --category=<slug>|auto --plugin=0|1|auto | --list
分类 slug：${CATEGORIES.join(" ")}`;

const fullName = args.find((a) => !a.startsWith("--"));
const sets = [];
const values = [];
for (const flag of FLAGS) {
  const m = args.find((a) => a.startsWith(`--${flag}=`));
  if (m) {
    sets.push(`is_${flag} = ?`);
    values.push(m.endsWith("=1") ? 1 : 0);
  }
}

// --boost=0|1 单独处理：列名是 featured_boost，不走 is_<flag> 的命名约定
const boostArg = args.find((a) => a.startsWith("--boost="))?.slice("--boost=".length);
if (boostArg != null) {
  if (boostArg !== "0" && boostArg !== "1") {
    console.error(`未知 --boost 取值 ${boostArg}\n${USAGE}`);
    process.exit(1);
  }
  sets.push("featured_boost = ?");
  values.push(Number(boostArg));
}

const riskNote = args
  .find((a) => a.startsWith("--risk-note="))
  ?.slice("--risk-note=".length);
if (riskNote != null) {
  sets.push("risk_note = ?");
  values.push(riskNote === "" ? null : riskNote);
}

const categoryArg = args
  .find((a) => a.startsWith("--category="))
  ?.slice("--category=".length);
if (categoryArg === "auto") {
  // 交还自动分类：按库里现有的名称/描述/tag 立即重算，之后每日同步继续维护
  const row = (
    await client.execute({
      sql: `SELECT name, description, tags FROM plugins WHERE lower(full_name) = lower(?)`,
      args: [fullName ?? ""],
    })
  ).rows[0];
  if (!row) {
    console.error(`未找到 ${fullName}（库里没有这个仓库，检查拼写或等下次同步）`);
    process.exit(1);
  }
  sets.push("category = ?", "category_manual = 0");
  values.push(
    classifyPlugin({
      name: String(row.name),
      description: String(row.description ?? ""),
      tags: JSON.parse(String(row.tags ?? "[]")),
    }),
  );
} else if (categoryArg != null) {
  if (!CATEGORIES.includes(categoryArg)) {
    console.error(`未知分类 ${categoryArg}\n${USAGE}`);
    process.exit(1);
  }
  sets.push("category = ?", "category_manual = 1");
  values.push(categoryArg);
}

/**
 * --downloads=<数字> 运营手工填的全渠道下载总数，优先级高于探测到的 npm/镜像/Release。
 *
 * 用于官网自建分发这类我们测不到的渠道（deepseek-harness-desktop 官网 20 万，
 * 而 GitHub Release 只有 4 万）。probe:downloads 从不写这两列，所以不会被下一轮探测冲掉。
 * 前台会把它标成「全渠道累计」并把 --downloads-note 的出处挂进 tooltip——
 * 一个我们没量过的数字必须让读者知道它是谁给的。--downloads=auto 撤回覆盖。
 */
const downloadsArg = args
  .find((a) => a.startsWith("--downloads="))
  ?.slice("--downloads=".length);
if (downloadsArg === "auto") {
  sets.push("dl_manual_total = NULL", "dl_manual_note = NULL");
} else if (downloadsArg != null) {
  if (!/^\d+$/.test(downloadsArg)) {
    console.error(`--downloads 只接受非负整数或 auto，收到 ${downloadsArg}\n${USAGE}`);
    process.exit(1);
  }
  sets.push("dl_manual_total = ?");
  values.push(Number(downloadsArg));
}

const downloadsNote = args
  .find((a) => a.startsWith("--downloads-note="))
  ?.slice("--downloads-note=".length);
if (downloadsNote != null) {
  sets.push("dl_manual_note = ?");
  values.push(downloadsNote === "" ? null : downloadsNote);
}

// --plugin=0|1 人工判定插件归属（自动管道不覆盖）；--plugin=auto 交还给探测管道
const pluginArg = args
  .find((a) => a.startsWith("--plugin="))
  ?.slice("--plugin=".length);
if (pluginArg === "auto") {
  sets.push("is_plugin = NULL", "is_plugin_manual = 0");
} else if (pluginArg != null) {
  if (pluginArg !== "0" && pluginArg !== "1") {
    console.error(`未知 --plugin 取值 ${pluginArg}\n${USAGE}`);
    process.exit(1);
  }
  sets.push("is_plugin = ?", "is_plugin_manual = 1");
  values.push(Number(pluginArg));
}

if (!fullName || sets.length === 0) {
  console.error(USAGE);
  process.exit(1);
}

const rs = await client.execute({
  sql: `UPDATE plugins SET ${sets.join(", ")} WHERE lower(full_name) = lower(?)`,
  args: [...values, fullName],
});
if (rs.rowsAffected === 0) {
  console.error(`未找到 ${fullName}（库里没有这个仓库，检查拼写或等下次同步）`);
  process.exit(1);
}
console.log(`✅ ${fullName} 已更新（${sets.length} 个标记）`);
