#!/usr/bin/env node
/**
 * 运营打标：给插件设置 蹭热度 / 内测用户 / 优质项目 / 分类。
 *
 * 用法（fullName 大小写不敏感）：
 *   node --env-file=.env.local scripts/flag-plugin.mjs <owner/repo> [--offtopic=0|1] [--insider=0|1] [--featured=0|1] [--category=<slug>|auto]
 *   node --env-file=.env.local scripts/flag-plugin.mjs --list             # 列出已打标的插件
 *
 * 例：
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --offtopic=1     # 标蹭热度（站点隐藏）
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --featured=1 --insider=1
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --category=skin  # 手动定分类（每日同步不再覆盖）
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --category=auto  # 交还给自动分类
 *
 * 布尔标记列每日同步不会碰；--category=<slug> 会置 category_manual=1，同步永不覆盖。
 */
import { createClient } from "@libsql/client/web";

import { CATEGORIES, classifyPlugin } from "./lib/categories.mjs";

const FLAGS = ["offtopic", "insider", "featured", "official"];

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN（用 --env-file=.env.local 运行）");
  process.exit(1);
}
const client = createClient({
  url: url.replace(/^libsql:\/\//, "https://"),
  authToken,
});

const args = process.argv.slice(2);

if (args.includes("--list")) {
  const rs = await client.execute(
    `SELECT full_name, stars, is_offtopic, is_insider, is_featured, is_official, category, category_manual
     FROM plugins WHERE is_offtopic + is_insider + is_featured + is_official + category_manual > 0
     ORDER BY is_official DESC, is_featured DESC, stars DESC`,
  );
  for (const r of rs.rows) {
    const marks = [
      Number(r.is_official) ? "🏛官方" : "",
      Number(r.is_featured) ? "✨优质" : "",
      Number(r.is_insider) ? "内测" : "",
      Number(r.is_offtopic) ? "🚫蹭热度" : "",
      Number(r.category_manual) ? `📌${r.category || "未分类"}` : "",
    ].filter(Boolean).join(" ");
    console.log(`  ${r.full_name}  ⭐${r.stars}  ${marks}`);
  }
  console.log(`共 ${rs.rows.length} 个已打标`);
  process.exit(0);
}

const USAGE = `用法：flag-plugin.mjs <owner/repo> --offtopic=0|1 --insider=0|1 --featured=0|1 --official=0|1 --category=<slug>|auto | --list
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
