/**
 * 官方文档中心的板块表。
 * 与 scripts/lib/docs-sections.mjs 保持同步——脚本是 .mjs、这里是 TS，
 * 两边各留一份而不是互相 import。
 */

/** 站内引用的固定上游 commit，页面上的出处链接以它为准。 */
export const PINNED_SHA = "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e";

export const UPSTREAM_REPO = "deepseek-ai/deepseek-harness";

export interface DocSection {
  id: string;
  upstream: string;
  /**
   * 该板块在官方文档站已有网页版。
   *
   * true 时我们的 zh/en 与官方逐字相同，属重复内容——只作为翻译源与站内导航
   * 存在，noindex 且不进 sitemap；ja/ko 官方完全没有，是独有内容，照常收录。
   * false 的板块（subsystems/cookbook/postmortem）官方只有 GitHub blob、
   * 没有带 hreflang 与站内导航的网页版，四语言都收录。
   */
  publishedUpstream: boolean;
  order: number;
}

export const DOC_SECTIONS: DocSection[] = [
  { id: "guide", upstream: "docs/user/guide", publishedUpstream: true, order: 1 },
  { id: "develop", upstream: "docs/user/develop", publishedUpstream: true, order: 2 },
  { id: "subsystems", upstream: "docs/subsystems", publishedUpstream: false, order: 3 },
  { id: "cookbook", upstream: "docs/cookbook", publishedUpstream: false, order: 4 },
  { id: "postmortem", upstream: "docs/postmortem", publishedUpstream: false, order: 5 },
];

export function sectionById(id: string): DocSection | null {
  return DOC_SECTIONS.find((s) => s.id === id) ?? null;
}

/**
 * 这一页该不该进索引。
 *
 * 官方已发布板块的 zh/en 是纯重复内容，收录只会稀释自己的抓取预算，
 * 还可能被判为低质量聚合；ja/ko 全网独有，必须收。
 */
export function isIndexable(section: DocSection, locale: string): boolean {
  if (!section.publishedUpstream) return true;
  return locale === "ja" || locale === "ko";
}

/** 上游源文件在 GitHub 上的固定链接（带 commit，永远指向我们翻译的那一版）。 */
export function sourceUrl(sourcePath: string): string {
  return `https://github.com/${UPSTREAM_REPO}/blob/${PINNED_SHA}/${sourcePath}`;
}
