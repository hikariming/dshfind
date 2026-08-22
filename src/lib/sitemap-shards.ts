import { locales } from "@/i18n/config";
import { threadPageFromBackend } from "@/lib/backend";
import { getAllDocPaths } from "@/lib/docs-db";
import { isIndexable, sectionById } from "@/lib/docs-sections";
import { threadLocale, threadPath } from "@/lib/forum";
import { learnChapters } from "@/lib/nav";
import {
  allIndexPageCount,
  listCategories,
  listLanguages,
  listTags,
} from "@/lib/plugin-hubs";
import { realPlugins } from "@/lib/plugins-real";
import { languageAlternates, localeUrl, SITE_URL } from "@/lib/site";

/**
 * 分片 sitemap 的共用逻辑。
 *
 * 为什么拆：单文件已到 40,264 条 URL / 28.1MB，用掉 Google 上限（50,000 / 50MB）
 * 的 80%，而插件库每天还在涨。**撞线后 Google 是拒收整份文件而不是截断**，
 * 等于全站 URL 一次性掉出索引——这不是慢慢劣化，是断崖。
 *
 * 为什么手写而不用 Next 的 generateSitemaps()：那个组合只产出 /sitemap/N.xml
 * 分片、**不生成索引文件**，且 `/sitemap.xml` 会随之消失——而那正是 robots.txt
 * 指向、Google 已经收录的入口 URL。丢掉它等于让 Google 重新发现整个站点。
 * （2026-08-21 踩过一次，见 docs/seo-plan.md。）
 */

/**
 * 每个插件分片装多少个插件（× 4 语言 = 实际 URL 数）。
 *
 * 800 → 每片 3,200 条 URL、约 2.4MB，远低于 Workers 单个静态资源 25 MiB 的上限。
 * 上次拆分尝试用的是 2500（每片 7.4MB）且 CF 构建失败、原因未查明，
 * 这里刻意取一个有数量级余量的值。
 */
export const PLUGINS_PER_SHARD = 800;

/** 进 sitemap 的帖子上限。超出的靠站内链接被发现，不让分片无限膨胀。 */
const THREAD_LIMIT = 50;

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
  /** hreflang → URL。 */
  alternates?: Record<string, string>;
}

/** 非风险插件——与详情页 noindex 的口径一致，不给假冒仓库送 SEO。 */
const indexablePlugins = realPlugins.filter((p) => !p.isRisky);

export function pluginShardCount(): number {
  return Math.max(1, Math.ceil(indexablePlugins.length / PLUGINS_PER_SHARD));
}

/** 全部分片 id，顺序即索引文件里的列出顺序。 */
export function shardIds(): string[] {
  return [
    "pages",
    "hubs",
    "docs",
    "all-index",
    "threads",
    ...Array.from({ length: pluginShardCount() }, (_, i) => `plugins-${i}`),
  ];
}

/** 帖子分片要每小时刷新（BBS 发的 SEO 文章不该等下次部署才进 sitemap）。 */
export function shardRevalidate(id: string): number {
  return id === "threads" ? 3600 : 86400;
}

function forAllLocales(
  path: string,
  opts: {
    priority: number;
    changeFrequency: SitemapEntry["changeFrequency"];
    lastModified?: string;
  },
): SitemapEntry[] {
  const alternates = languageAlternates(path);
  return locales.map((locale) => ({
    url: localeUrl(locale, path),
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates,
  }));
}

async function buildPages(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];
  out.push(...forAllLocales("", { priority: 1, changeFrequency: "daily" }));
  out.push(
    ...forAllLocales("/plugins", { priority: 0.9, changeFrequency: "daily" }),
  );
  out.push(
    ...forAllLocales("/plugins/browse", {
      priority: 0.8,
      changeFrequency: "weekly",
    }),
  );
  out.push(
    ...forAllLocales("/learn/cordis", {
      priority: 0.8,
      changeFrequency: "weekly",
    }),
  );
  out.push(...forAllLocales("/bbs", { priority: 0.7, changeFrequency: "daily" }));

  // 课程页：导航结构里所有已上线的课时
  for (const chapter of learnChapters) {
    for (const item of chapter.items) {
      if (item.href) {
        out.push(
          ...forAllLocales(item.href, {
            priority: 0.7,
            changeFrequency: "monthly",
          }),
        );
      }
    }
  }
  return out;
}

async function buildHubs(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];
  // 聚合页优先级高于插件详情页（0.6）：hub 才是去竞争「DSH memory 插件」
  // 这类中长尾词的页面，详情页内容极薄、只适合承接品牌词与仓库名。
  for (const c of listCategories()) {
    out.push(
      ...forAllLocales(`/plugins/c/${c.slug}`, {
        priority: 0.8,
        changeFrequency: "weekly",
      }),
    );
  }
  for (const l of listLanguages()) {
    out.push(
      ...forAllLocales(`/plugins/lang/${l.slug}`, {
        priority: 0.7,
        changeFrequency: "weekly",
      }),
    );
  }
  for (const tag of listTags()) {
    out.push(
      ...forAllLocales(`/plugins/t/${tag.slug}`, {
        priority: 0.7,
        changeFrequency: "weekly",
      }),
    );
  }
  return out;
}

async function buildAllIndex(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];
  // 全量索引本身没什么排名价值，收录是为了让爬虫沿着它走到长尾详情页
  for (let p = 1; p <= allIndexPageCount(); p++) {
    out.push(
      ...forAllLocales(`/plugins/all/${p}`, {
        priority: 0.4,
        changeFrequency: "weekly",
      }),
    );
  }
  return out;
}

async function buildDocs(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];
  const docPaths = await getAllDocPaths();
  if (docPaths.length === 0) return out;

  out.push(...forAllLocales("/docs", { priority: 0.8, changeFrequency: "weekly" }));

  // 只收 isIndexable 为真的语言：官方已发布板块的 zh/en 与官方逐字相同，
  // 收录只会稀释自己的抓取预算；ja/ko 全网独有，必须收。
  for (const d of docPaths) {
    const cfg = sectionById(d.section);
    if (!cfg) continue;
    const path =
      d.slug === "index" ? `/docs/${d.section}` : `/docs/${d.section}/${d.slug}`;
    const alternates = languageAlternates(path);
    for (const locale of locales) {
      if (!isIndexable(cfg, locale)) continue;
      out.push({
        url: localeUrl(locale, path),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates,
      });
    }
  }
  return out;
}

async function buildThreads(): Promise<SitemapEntry[]> {
  // 后端不可用时 threadPageFromBackend 回 null——分片少几个 URL 也比整份
  // 构建失败强，下一小时的重验证会补上。
  // 插件讨论帖排除在外：正文是空的、标题只是仓库名，帖子页本身也 noindex。
  //
  // 与其他条目不同，帖子只登记它自己那个语言的 URL：一篇中文帖在 /en /ja /ko
  // 下渲染的是同一份正文，四条都收录就是自造重复内容。
  const threads = await threadPageFromBackend({ perPage: THREAD_LIMIT }, 3600);
  const out: SitemapEntry[] = [];
  for (const thread of threads?.items ?? []) {
    if (thread.plugin_full_name) continue;
    out.push({
      url: localeUrl(threadLocale(thread.locale), threadPath(thread.slug)),
      lastModified: thread.last_post_at || thread.created_at,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
  return out;
}

async function buildPluginShard(index: number): Promise<SitemapEntry[]> {
  const start = index * PLUGINS_PER_SHARD;
  const slice = indexablePlugins.slice(start, start + PLUGINS_PER_SHARD);
  const out: SitemapEntry[] = [];
  for (const plugin of slice) {
    out.push(
      ...forAllLocales(`/plugins/${plugin.fullName}`, {
        priority: 0.6,
        changeFrequency: "weekly",
        // lastModified 用仓库最近推送时间，比"构建时间"对爬虫更有信息量
        lastModified: plugin.pushedAt || undefined,
      }),
    );
  }
  return out;
}

/** 取某个分片的条目；未知 id 返回 null（route handler 走 404）。 */
export async function buildShard(id: string): Promise<SitemapEntry[] | null> {
  if (id === "pages") return buildPages();
  if (id === "hubs") return buildHubs();
  if (id === "docs") return buildDocs();
  if (id === "all-index") return buildAllIndex();
  if (id === "threads") return buildThreads();

  const m = /^plugins-(\d+)$/.exec(id);
  if (m) {
    const n = Number(m[1]);
    if (n >= 0 && n < pluginShardCount()) return buildPluginShard(n);
  }
  return null;
}

/**
 * XML 文本转义。
 *
 * URL 里的 `&` 必须转成 `&amp;`，否则整份 XML 解析失败、Google 直接拒收。
 * 插件的 owner/repo 来自 GitHub（作者可控），标题也可能进 URL，
 * 一律当不可信输入处理。
 */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const e of entries) {
    parts.push("<url>");
    parts.push(`<loc>${xmlEscape(e.url)}</loc>`);
    if (e.alternates) {
      for (const [lang, href] of Object.entries(e.alternates)) {
        parts.push(
          `<xhtml:link rel="alternate" hreflang="${xmlEscape(lang)}" href="${xmlEscape(href)}"/>`,
        );
      }
    }
    if (e.lastModified) {
      parts.push(`<lastmod>${xmlEscape(e.lastModified)}</lastmod>`);
    }
    if (e.changeFrequency) {
      parts.push(`<changefreq>${e.changeFrequency}</changefreq>`);
    }
    if (e.priority != null) {
      parts.push(`<priority>${e.priority}</priority>`);
    }
    parts.push("</url>");
  }
  parts.push("</urlset>");
  return parts.join("\n");
}

export function shardUrl(id: string): string {
  return `${SITE_URL}/sitemap/${id}.xml`;
}

export function renderSitemapIndex(lastModified: string): string {
  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const id of shardIds()) {
    parts.push("<sitemap>");
    parts.push(`<loc>${xmlEscape(shardUrl(id))}</loc>`);
    parts.push(`<lastmod>${xmlEscape(lastModified)}</lastmod>`);
    parts.push("</sitemap>");
  }
  parts.push("</sitemapindex>");
  return parts.join("\n");
}

export const XML_HEADERS = {
  "content-type": "application/xml; charset=utf-8",
} as const;
