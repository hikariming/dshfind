#!/usr/bin/env node
/**
 * 由 Turso 生成两个静态文件：
 *   src/lib/plugins-real.ts  插件静态兜底 + 首页/搜索数据（plugins 表）
 *   src/lib/plugin-i18n.ts   多语言文案与详情富文案（plugin_i18n 表 + plugins.install_cmd）
 *
 * 用法：
 *   pnpm gen:plugins    # 读 .env.local 的 Turso 凭据
 *
 * 文案的唯一事实源是 Turso（scripts/set-plugin-i18n.mjs 维护）；
 * 动态页（插件页/详情页）直接读库即时生效，这里的生成物服务首页静态渲染与 DB 兜底。
 * 蹭热度（is_offtopic=1）和已摘 topic（is_present=0）的仓库不会进静态数据。
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client/web";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/lib/plugins-real.ts");
const outI18n = resolve(root, "src/lib/plugin-i18n.ts");

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
  `SELECT full_name, name, owner, url, description, tags, language, stars, pushed_at, archived, category, score,
          is_featured, featured_boost, is_insider, is_official, is_risky, risk_note
   FROM plugins
   WHERE is_present = 1 AND is_offtopic = 0
   ORDER BY is_risky ASC, is_featured * featured_boost DESC, stars DESC, full_name`,
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
  score: r.score == null ? null : Number(r.score),
  isFeatured: Boolean(r.is_featured),
  featuredBoost: Boolean(r.featured_boost),
  isInsider: Boolean(r.is_insider),
  isOfficial: Boolean(r.is_official),
  isRisky: Boolean(r.is_risky),
  riskNote: r.risk_note == null ? null : String(r.risk_note),
}));

const line = (p) =>
  `  { name: ${JSON.stringify(p.name)}, owner: ${JSON.stringify(p.owner)}, fullName: ${JSON.stringify(p.fullName)}, url: ${JSON.stringify(p.url)}, description: ${JSON.stringify(p.description)}, tags: [${p.tags.map((t) => JSON.stringify(t)).join(",")}], language: ${JSON.stringify(p.language)}, stars: ${p.stars}, pushedAt: ${JSON.stringify(p.pushedAt)}, archived: ${p.archived}, category: ${JSON.stringify(p.category)}, score: ${p.score}, isFeatured: ${p.isFeatured}${p.featuredBoost ? "" : ", featuredBoost: false"}, isInsider: ${p.isInsider}, isOfficial: ${p.isOfficial}, isRisky: ${p.isRisky}, riskNote: ${JSON.stringify(p.riskNote)} },`;

const owners = new Set(plugins.map((p) => p.owner));
const languages = [...new Set(plugins.map((p) => p.language).filter(Boolean))]
  .map((lang) => ({ lang, n: plugins.filter((p) => p.language === lang).length }))
  .sort((a, b) => b.n - a.n || a.lang.localeCompare(b.lang, "en"))
  .map((x) => x.lang);

// 单个几千行的数组字面量会让 TS 类型检查报 TS2590（union 过于复杂），
// 按 1500 行分块、再拼装导出，规避编译器复杂度上限。
const CHUNK_SIZE = 1500;
const chunks = [];
for (let i = 0; i < plugins.length; i += CHUNK_SIZE) {
  chunks.push(plugins.slice(i, i + CHUNK_SIZE));
}

const source = `// 由 scripts/gen-plugins-real.mjs 从 Turso plugins 表生成——请勿手改。
// 数据源：每日同步维护的 Turso 库（已排除蹭热度与摘 topic 的仓库），行序 featured 优先、风险项目沉底。
// featuredBoost: false 的推荐项目不参与置顶，按 star 排在正常位次（标记与徽标保留）。
// 生成时间：${new Date().toISOString()}
import type { RealPlugin } from "./types";

/** 出现过的语言，按仓库数降序——插件页的语言筛选直接用这个顺序。 */
export const pluginLanguages: string[] = [
${languages.map((l) => `  ${JSON.stringify(l)},`).join("\n")}
];

/** 发布过插件的作者数（GitHub 账号去重）。 */
export const pluginAuthorCount = ${owners.size};

${chunks
  .map(
    (c, i) => `const chunk${i}: RealPlugin[] = [
${c.map(line).join("\n")}
];`,
  )
  .join("\n\n")}

export const realPlugins: RealPlugin[] = [${chunks.map((_, i) => `...chunk${i}`).join(", ")}];
`;

writeFileSync(out, source);
console.log(
  `wrote ${out}: ${plugins.length} plugins, ${owners.size} authors, ${languages.length} languages`,
);

// ---------- plugin-i18n.ts ----------

const i18nRows = (
  await client.execute(
    `SELECT full_name, locale, description, intro, highlights FROM plugin_i18n ORDER BY full_name, locale`,
  )
).rows;
const cmdRows = (
  await client.execute(
    `SELECT full_name, install_cmd FROM plugins WHERE install_cmd IS NOT NULL`,
  )
).rows;

const descriptions = {};
const editorial = {};
for (const r of i18nRows) {
  const full = String(r.full_name);
  const loc = String(r.locale);
  if (r.description) (descriptions[full] ??= {})[loc] = String(r.description);
  if (r.intro) ((editorial[full] ??= {}).intro ??= {})[loc] = String(r.intro);
  if (r.highlights) {
    ((editorial[full] ??= {}).highlights ??= {})[loc] = JSON.parse(String(r.highlights));
  }
}
for (const r of cmdRows) {
  (editorial[String(r.full_name)] ??= {}).installCmd = String(r.install_cmd);
}

const i18nSource = `// 由 scripts/gen-plugins-real.mjs 从 Turso plugin_i18n 表生成——请勿手改。
// 文案唯一事实源在 Turso，用 scripts/set-plugin-i18n.mjs 维护；改完跑 pnpm gen:plugins 刷新本文件。
// 生成时间：${new Date().toISOString()}
import type { Locale } from "@/i18n/config";

/** 详情页富文案：intro 长介绍 / highlights 亮点 / installCmd 安装命令覆盖。 */
export interface PluginEditorial {
  intro?: Partial<Record<Locale, string>>;
  highlights?: Partial<Record<Locale, string[]>>;
  installCmd?: string;
}

const descriptions: Record<string, Partial<Record<Locale, string>>> = ${JSON.stringify(descriptions, null, 2)};

const editorial: Record<string, PluginEditorial> = ${JSON.stringify(editorial, null, 2)};

/** 取某插件在当前语言下的描述；没有人工翻译时回退 GitHub 原文。 */
export function localizePluginDescription(
  fullName: string,
  locale: string,
  fallback: string,
): string {
  return descriptions[fullName]?.[locale as Locale] ?? fallback;
}

/** 详情页富文案；没有的插件返回 undefined，页面自动降级为基础形态。 */
export function getPluginEditorial(fullName: string): PluginEditorial | undefined {
  return editorial[fullName];
}
`;

writeFileSync(outI18n, i18nSource);
console.log(
  `wrote ${outI18n}: ${Object.keys(descriptions).length} descriptions, ${Object.keys(editorial).length} editorial entries`,
);
