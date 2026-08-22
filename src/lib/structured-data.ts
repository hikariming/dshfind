import type { Locale } from "@/i18n/config";
import type { HubPlugin } from "./plugin-hubs";
import { SITE_URL } from "./site";

/**
 * 面包屑与列表页的结构化数据。
 *
 * BreadcrumbList 让 SERP 用「dshfind › 插件超市 › 工具集成」替换掉裸 URL，
 * ItemList 则告诉搜索引擎聚合页是个有序清单而不是一坨随机链接。
 * 全站此前只有详情页有 SoftwareSourceCode、首页有 WebSite，
 * 聚合页与课程页都是空的。
 */

export interface Crumb {
  /** 展示名（已本地化）。 */
  name: string;
  /** 语言前缀之后的路径，需以 / 开头；首项传 "" 表示站点根。 */
  path: string;
}

export function breadcrumbJsonLd(locale: Locale, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}/${locale}${c.path}`,
    })),
  };
}

/**
 * 聚合页的 ItemList。
 * 只登记链接与名字——把 description/star 也塞进去会让 HTML 里的 JSON-LD
 * 比正文还大，而这些字段在列表结构化数据里并不会被采用。
 */
export function itemListJsonLd(
  locale: Locale,
  name: string,
  plugins: HubPlugin[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: plugins.length,
    itemListElement: plugins.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE_URL}/${locale}/plugins/${p.fullName}`,
    })),
  };
}
