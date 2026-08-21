/**
 * Sitemap 的分片与 XML 渲染。
 *
 * 为什么不用 Next 的 sitemap.ts 约定 + generateSitemaps()：那个组合只产出
 * /sitemap/0.xml、/sitemap/1.xml，**不生成索引文件**，而 /sitemap.xml 会随之
 * 消失——那正是 robots.txt 指向、且 Google 已经收录的地址。所以这里手写：
 * /sitemap.xml 保持存在但改为 <sitemapindex>，分片挂在 /sitemap/*.xml。
 * 入口地址不变，Google 无需重新发现。
 *
 * 拆分的直接原因是硬上限：单个 sitemap 最多 50,000 个 <url> 或 50MB。
 * 拆分前实测 34,324 个 URL / 24.2MB，已用掉 69% 和 48%，而插件库还在涨。
 * 撞线后 Google 会拒收整份文件，不是截断。
 */
import { locales } from "@/i18n/config";
import { languageAlternates, localeUrl, SITE_URL } from "@/lib/site";

/**
 * 每个分片放多少个插件。一个插件产出 4 条 URL（4 种语言），所以 2500 →
 * 10,000 条 URL、约 7MB，离两个上限都有足够余量。上限按 <url> 元素计数，
 * hreflang 交替链接不计入。
 */
export const PLUGINS_PER_SHARD = 2500;

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
  /** hreflang → URL；省略则不输出交替链接（帖子就是这种情况）。 */
  alternates?: Record<string, string>;
}

/** XML 文本转义。插件全名来自 GitHub，& 与尖括号都可能出现。 */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value: string | undefined): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

/** 渲染一个分片：<urlset>，带 xhtml 命名空间以便输出 hreflang。 */
export function renderUrlset(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const parts = [`    <loc>${esc(entry.url)}</loc>`];
      const lastmod = isoDate(entry.lastModified);
      if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
      if (entry.changeFrequency) {
        parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (typeof entry.priority === "number") {
        parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      }
      for (const [hreflang, href] of Object.entries(entry.alternates ?? {})) {
        parts.push(
          `    <xhtml:link rel="alternate" hreflang="${esc(hreflang)}" href="${esc(href)}"/>`,
        );
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

/** 渲染索引：<sitemapindex>，列出全部分片。 */
export function renderIndex(shards: string[]): string {
  const now = new Date().toISOString();
  const body = shards
    .map(
      (shard) =>
        `  <sitemap>\n    <loc>${esc(`${SITE_URL}/sitemap/${shard}.xml`)}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

/** 同一路径在全部语言下各登记一条，并互相声明 hreflang。 */
export function entriesForAllLocales(
  path: string,
  opts: {
    priority: number;
    changeFrequency: "daily" | "weekly" | "monthly";
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

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
} as const;
