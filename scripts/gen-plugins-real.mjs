#!/usr/bin/env node
/**
 * 由 Turso 的 plugins 表生成 src/lib/plugins-real.ts（静态兜底 + 首页/搜索数据）。
 *
 * 用法：
 *   pnpm gen:plugins    # 读 .env.local 的 Turso 凭据
 *
 * 数据源是每日同步（scripts/sync-plugins-db.mjs）维护的 plugins 表——
 * 蹭热度（is_offtopic=1）和已摘 topic（is_present=0）的仓库不会进静态数据，
 * 运营标记因此对首页热门插件、搜索建议、DB 兜底数据同样生效。
 * 行序 featured 优先，首页 top5 直接切前 5 个即为置顶的优质项目。
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client/web";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/lib/plugins-real.ts");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN（用 pnpm gen:plugins 运行）");
  process.exit(1);
}
const client = createClient({
  url: url.replace(/^libsql:\/\//, "https://"),
  authToken,
});

const rs = await client.execute(
  `SELECT full_name, name, owner, url, description, tags, language, stars, pushed_at, archived, category
   FROM plugins
   WHERE is_present = 1 AND is_offtopic = 0
   ORDER BY is_featured DESC, stars DESC, full_name`,
);

const plugins = rs.rows.map((r) => ({
  name: String(r.name),
  owner: String(r.owner),
  fullName: String(r.full_name),
  url: String(r.url),
  description: String(r.description ?? ""),
  tags: JSON.parse(String(r.tags ?? "[]")),
  language: String(r.language ?? ""),
  stars: Number(r.stars ?? 0),
  pushedAt: String(r.pushed_at ?? ""),
  archived: Boolean(r.archived),
  category: String(r.category ?? ""),
}));

const line = (p) =>
  `  { name: ${JSON.stringify(p.name)}, owner: ${JSON.stringify(p.owner)}, fullName: ${JSON.stringify(p.fullName)}, url: ${JSON.stringify(p.url)}, description: ${JSON.stringify(p.description)}, tags: [${p.tags.map((t) => JSON.stringify(t)).join(",")}], language: ${JSON.stringify(p.language)}, stars: ${p.stars}, pushedAt: ${JSON.stringify(p.pushedAt)}, archived: ${p.archived}, category: ${JSON.stringify(p.category)} },`;

const owners = new Set(plugins.map((p) => p.owner));
const languages = [...new Set(plugins.map((p) => p.language).filter(Boolean))]
  .map((lang) => ({ lang, n: plugins.filter((p) => p.language === lang).length }))
  .sort((a, b) => b.n - a.n || a.lang.localeCompare(b.lang, "en"))
  .map((x) => x.lang);

const source = `// 由 scripts/gen-plugins-real.mjs 从 Turso plugins 表生成——请勿手改。
// 数据源：每日同步维护的 Turso 库（已排除蹭热度与摘 topic 的仓库），行序 featured 优先。
// 生成时间：${new Date().toISOString()}
import type { RealPlugin } from "./types";

/** 出现过的语言，按仓库数降序——插件页的语言筛选直接用这个顺序。 */
export const pluginLanguages: string[] = [
${languages.map((l) => `  ${JSON.stringify(l)},`).join("\n")}
];

/** 发布过插件的作者数（GitHub 账号去重）。 */
export const pluginAuthorCount = ${owners.size};

export const realPlugins: RealPlugin[] = [
${plugins.map(line).join("\n")}
];
`;

writeFileSync(out, source);
console.log(
  `wrote ${out}: ${plugins.length} plugins, ${owners.size} authors, ${languages.length} languages`,
);
