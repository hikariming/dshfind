#!/usr/bin/env node
/**
 * 运营打标：给插件设置 蹭热度 / 内测用户 / 优质项目 标记。
 *
 * 用法（fullName 大小写不敏感）：
 *   node --env-file=.env.local scripts/flag-plugin.mjs <owner/repo> [--offtopic=0|1] [--insider=0|1] [--featured=0|1]
 *   node --env-file=.env.local scripts/flag-plugin.mjs --list             # 列出已打标的插件
 *
 * 例：
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --offtopic=1     # 标蹭热度（站点隐藏）
 *   node --env-file=.env.local scripts/flag-plugin.mjs foo/bar --featured=1 --insider=1
 *
 * 这些列每日同步不会碰（upsert 不含它们），标一次长期有效。
 */
import { createClient } from "@libsql/client/web";

const FLAGS = ["offtopic", "insider", "featured"];

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
    `SELECT full_name, stars, is_offtopic, is_insider, is_featured
     FROM plugins WHERE is_offtopic + is_insider + is_featured > 0
     ORDER BY is_featured DESC, stars DESC`,
  );
  for (const r of rs.rows) {
    const marks = [
      Number(r.is_featured) ? "✨优质" : "",
      Number(r.is_insider) ? "内测" : "",
      Number(r.is_offtopic) ? "🚫蹭热度" : "",
    ].filter(Boolean).join(" ");
    console.log(`  ${r.full_name}  ⭐${r.stars}  ${marks}`);
  }
  console.log(`共 ${rs.rows.length} 个已打标`);
  process.exit(0);
}

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
if (!fullName || sets.length === 0) {
  console.error("用法：flag-plugin.mjs <owner/repo> --offtopic=0|1 --insider=0|1 --featured=0|1 | --list");
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
