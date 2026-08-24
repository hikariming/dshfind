#!/usr/bin/env node
/**
 * 由 Turso 生成三个静态文件：
 *   src/lib/plugins-real.ts  插件静态兜底 + 首页/搜索数据（plugins 表）
 *   src/lib/plugin-i18n.ts   多语言文案与详情富文案（plugin_i18n 表 + plugins.install_cmd）
 *   src/lib/home-picks.ts    首页三条 rail 的候选池（编辑推荐 / 本周飙升 / 新面孔）
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
const outPicks = resolve(root, "src/lib/home-picks.ts");

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
          is_featured, featured_boost, is_insider, is_official, is_risky, risk_note,
          dl_pkg, dl_npm_total, dl_mirror_total, dl_release_total,
          dl_manual_total, dl_manual_note,
          install_kind, install_cmd, install_cmd_auto, pkg_name, pkg_version,
          npm_latest_version
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
  /**
   * 累计下载量：只带「有数可报」的那一档进快照。
   *
   * 详情页首选读 Turso，但构建期预渲染（generateStaticParams 的头部 24 个页面）
   * 跑在没有 Turso 凭据的构建环境里，只能走 realPlugins 兜底——下载量不进快照，
   * 恰恰是最该显示的头部页永远看不到数字。口径与 src/lib/downloads.ts 一致：
   * 有归属校验通过的 npm 包就报 npm+镜像，否则报 Release 资产。
   */
  downloads: downloadsOf(r),
  /**
   * 安装方式：同 downloads，构建期预渲染的头部 24 个详情页读不到 Turso，
   * 不进快照就只能显示「请查看仓库 README」——而它们恰恰是最多人照着装的那批。
   */
  install: installOf(r),
}));

/** 与 primaryDownloads 同口径的构建期版本；没数可报返回 null（不写进快照）。 */
function downloadsOf(r) {
  // 运营手工填的全渠道数优先（官网自建分发那部分探测不到），并带上出处
  if (r.dl_manual_total != null && Number(r.dl_manual_total) > 0) {
    return {
      channel: "manual",
      total: Number(r.dl_manual_total),
      note: r.dl_manual_note == null ? null : String(r.dl_manual_note),
    };
  }
  const npm = r.dl_pkg != null && r.dl_npm_total != null ? Number(r.dl_npm_total) : null;
  if (npm != null) {
    return { channel: "npm", total: npm + Number(r.dl_mirror_total ?? 0) };
  }
  const release = r.dl_release_total == null ? 0 : Number(r.dl_release_total);
  return release > 0 ? { channel: "release", total: release } : null;
}

/**
 * 与详情页读库口径一致的构建期版本：运营手工核对的 install_cmd 压过推导的
 * install_cmd_auto，没探测过（install_kind 为空）返回 null，页面据此说「见 README」，
 * 而不是编一条命令出来。
 *
 * 手工命令与 plugin-i18n.ts 的 editorial.installCmd 是同一列，这里是刻意的重复：
 * 详情页取 curated 时走 editorial，取不到时才落到这里，两条路给出同一个答案。
 * 五条 not-installable 仓库带着手工命令（官方仓库那类），走的正是 editorial 那条。
 */
function installOf(r) {
  if (r.install_kind == null) return null;
  const cmd = r.install_cmd ?? r.install_cmd_auto;
  return {
    kind: String(r.install_kind),
    cmd: cmd == null ? null : String(cmd),
    pkgName: r.pkg_name == null ? null : String(r.pkg_name),
    pkgVersion: r.pkg_version == null ? null : String(r.pkg_version),
    // npm 装法下这才是命令实际会装到的版本，见 src/lib/install.ts installVersionOf
    npmVersion: r.npm_latest_version == null ? null : String(r.npm_latest_version),
  };
}

/** `install: {...}` 字面量；空字段一律省略，别写 null 进一万行去撑大生成物。 */
function installLiteral(i) {
  if (!i) return "";
  const parts = [`kind: ${JSON.stringify(i.kind)}`];
  if (i.cmd) parts.push(`cmd: ${JSON.stringify(i.cmd)}`);
  if (i.pkgName) parts.push(`pkgName: ${JSON.stringify(i.pkgName)}`);
  if (i.pkgVersion) parts.push(`pkgVersion: ${JSON.stringify(i.pkgVersion)}`);
  // npm 版本与仓库版本一样时不重复写，省一万行里的冗余字节
  if (i.npmVersion && i.npmVersion !== i.pkgVersion) {
    parts.push(`npmVersion: ${JSON.stringify(i.npmVersion)}`);
  }
  return `, install: { ${parts.join(", ")} }`;
}

const line = (p) =>
  `  { name: ${JSON.stringify(p.name)}, owner: ${JSON.stringify(p.owner)}, fullName: ${JSON.stringify(p.fullName)}, url: ${JSON.stringify(p.url)}, description: ${JSON.stringify(p.description)}, tags: [${p.tags.map((t) => JSON.stringify(t)).join(",")}], language: ${JSON.stringify(p.language)}, stars: ${p.stars}, pushedAt: ${JSON.stringify(p.pushedAt)}, archived: ${p.archived}, category: ${JSON.stringify(p.category)}, score: ${p.score}, isFeatured: ${p.isFeatured}${p.featuredBoost ? "" : ", featuredBoost: false"}, isInsider: ${p.isInsider}, isOfficial: ${p.isOfficial}, isRisky: ${p.isRisky}, riskNote: ${JSON.stringify(p.riskNote)}${
    p.downloads
      ? `, downloads: { channel: ${JSON.stringify(p.downloads.channel)}, total: ${p.downloads.total}${
          p.downloads.note ? `, note: ${JSON.stringify(p.downloads.note)}` : ""
        } }`
      : ""
  }${installLiteral(p.install)} },`;

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

// ---------- home-picks.ts ----------

/**
 * 首页三条 rail 的候选池。刻意不复用 realPlugins 的行序：
 * 那个序是「featured 优先 + star 降序」，头部几个几万 star 的仓库几个月都不动，
 * 首页照抄就永远是同一批。这里改用两个会自己走的维度——7 天增长与收录时间。
 */
const railRows = (
  await client.execute(
    `WITH latest AS (
       SELECT full_name, MAX(snapshot_date) AS d FROM plugin_snapshots GROUP BY full_name
     ),
     base AS (
       SELECT l.full_name,
         COALESCE(
           (SELECT MAX(s.snapshot_date) FROM plugin_snapshots s
             WHERE s.full_name = l.full_name AND s.snapshot_date <= date(l.d, '-7 days')),
           (SELECT MIN(s.snapshot_date) FROM plugin_snapshots s WHERE s.full_name = l.full_name)
         ) AS d
       FROM latest l
     )
     SELECT p.full_name, p.name, p.owner, p.stars, p.score, p.first_seen_at, p.is_plugin,
            p.is_featured, p.featured_boost, p.is_official, p.is_insider,
            COALESCE(p.stars - bs.stars, 0) AS star_growth
     FROM plugins p
     LEFT JOIN base b ON b.full_name = p.full_name
     LEFT JOIN plugin_snapshots bs ON bs.full_name = b.full_name AND bs.snapshot_date = b.d
     WHERE p.is_present = 1 AND p.is_offtopic = 0 AND p.is_risky = 0 AND p.archived = 0`,
  )
).rows;

const railAll = railRows.map((r) => ({
  fullName: String(r.full_name),
  name: String(r.name),
  owner: String(r.owner),
  stars: Number(r.stars ?? 0),
  score: r.score == null ? null : Number(r.score),
  isFeatured: Boolean(r.is_featured),
  isOfficial: Boolean(r.is_official),
  isInsider: Boolean(r.is_insider),
  // 置顶推荐 = 有推荐标记且没被运营降权，与列表排序同一口径
  pinned: Boolean(r.is_featured) && Boolean(r.featured_boost),
  isPlugin: Number(r.is_plugin) === 1,
  starGrowth: Number(r.star_growth ?? 0),
  firstSeenAt: String(r.first_seen_at ?? "").slice(0, 10),
}));

/** 编辑推荐池上限；6 张一批，60 个正好翻 10 批，再多用户也翻不到。 */
const EDITOR_POOL = 60;
const RAIL_SIZE = 6;

// 编辑推荐：只收有编辑短评的——「编辑推荐」四个字得对得上有人写过点评这件事。
// 池内置顶推荐排前面，所以第 0 批（也是 Google 抓到的那批）永远是最硬的几个。
const editorPool = railAll
  .filter((p) => editorial[p.fullName]?.intro)
  .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.stars - a.stars)
  .slice(0, EDITOR_POOL);

// 本周飙升：排除所有会出现在编辑推荐里的候选。剩下的才是「没人背书但在涨」的，
// 这正是飙升该有的意义；顺带也让生态本体（deepseek-harness，有短评）不霸榜。
const editorNames = new Set(editorPool.map((p) => p.fullName));
const trendingPicks = railAll
  .filter((p) => !editorNames.has(p.fullName) && !p.pinned && p.starGrowth > 0)
  .sort((a, b) => b.starGrowth - a.starGrowth || b.stars - a.stars)
  .slice(0, RAIL_SIZE);

// 新面孔：必须 is_plugin=1（探测确认过是 DSH 插件）。当天新收录的还没跑探测管道，
// 所以这条 rail 会滞后一两天——首页放没验过的仓库风险更大，宁可慢。
const taken = new Set([...editorNames, ...trendingPicks.map((p) => p.fullName)]);
const newcomerPicks = railAll
  .filter((p) => !taken.has(p.fullName) && p.isPlugin && p.stars >= 3)
  .sort(
    (a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt) || b.stars - a.stars,
  )
  .slice(0, RAIL_SIZE);

/** 只写 HomePick 声明过的字段，extra 里的按需追加（增长量/收录日期）。 */
const pickLine = (p, extra = "") =>
  `  { fullName: ${JSON.stringify(p.fullName)}, name: ${JSON.stringify(p.name)}, owner: ${JSON.stringify(p.owner)}, stars: ${p.stars}, score: ${p.score}, isFeatured: ${p.isFeatured}, isOfficial: ${p.isOfficial}, isInsider: ${p.isInsider}${extra} },`;

const picksSource = `// 由 scripts/gen-plugins-real.mjs 生成——请勿手改。
// 首页三条 rail 的候选池，口径见生成脚本末尾的注释。
// 生成时间：${new Date().toISOString()}
import type { HomePick } from "./types";

/** 编辑推荐候选池（有编辑短评的项目，置顶推荐排前）。首页 6 张一批，「换一批」在池内轮换。 */
export const editorPool: HomePick[] = [
${editorPool.map((p) => pickLine(p)).join("\n")}
];

/** 本周飙升：近 7 天 star 增长最快、且不在编辑推荐池里的项目。 */
export const trendingPicks: HomePick[] = [
${trendingPicks.map((p) => pickLine(p, `, starGrowth: ${p.starGrowth}`)).join("\n")}
];

/** 新面孔：最近收录且已确认是 DSH 插件的项目。 */
export const newcomerPicks: HomePick[] = [
${newcomerPicks.map((p) => pickLine(p, `, firstSeenAt: ${JSON.stringify(p.firstSeenAt)}`)).join("\n")}
];

/** 首页每条 rail 一次展示几张——「换一批」按这个数切片。 */
export const RAIL_SIZE = ${RAIL_SIZE};
`;

writeFileSync(outPicks, picksSource);
console.log(
  `wrote ${outPicks}: editor pool ${editorPool.length}, trending ${trendingPicks.length}, newcomers ${newcomerPicks.length}`,
);
