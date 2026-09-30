/**
 * sitemap 的 XML 渲染与帖子分片——与全量插件快照无关的那一半，独立成模块：
 * Astro 新站按需渲染 /sitemap.xml 与 /sitemap/threads.xml，Worker 里不能带上 plugins-real。
 * 其余分片（插件 / hub / 文档…）的取数在 sitemap-shards.ts，新站在构建期预渲染。
 */
import { threadPageFromBackend } from "@/lib/backend";
import { threadLocale, threadPath } from "@/lib/forum";
import { localeUrl, SITE_URL } from "@/lib/site";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
  /** hreflang → URL。 */
  alternates?: Record<string, string>;
}

const THREAD_LIMIT = 50;

export async function buildThreads(): Promise<SitemapEntry[]> {
  // 后端不可用时 threadPageFromBackend 回 null——分片少几个 URL 也比整份
  // 构建失败强，下一次边缘缓存刷新会补上。
  // 插件讨论帖排除在外：正文是空的、标题只是仓库名，帖子页本身也 noindex。
  //
  // 与其他条目不同，帖子只登记它自己那个语言的 URL：一篇中文帖在 /en /ja /ko
  // 下渲染的是同一份正文，四条都收录就是自造重复内容。
  const threads = await threadPageFromBackend({ perPage: THREAD_LIMIT });
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

/** 渲染 sitemap 索引；分片清单由调用方给（老站现算，新站读构建期清单） */
export function renderSitemapIndexFor(ids: string[], lastModified: string): string {
  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const id of ids) {
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
