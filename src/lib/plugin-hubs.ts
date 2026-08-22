import { PLUGIN_CATEGORIES } from "./categories";
import { realPlugins } from "./plugins-real";
import type { RealPlugin } from "./types";

/**
 * 插件聚合页（hub）的数据层。
 *
 * 存在的理由是内链：详情页此前只有首页 63 条 + 目录页 24 条 SSR 链接指进去，
 * 其余 9,500+ 个 URL 只能靠 sitemap 被发现，等于孤儿页——拿不到站内权重传递，
 * 抓取优先级被压到最低。分类/标签/语言 hub 负责「可排名」，
 * /plugins/all/[page] 全量分页索引负责「100% 可达」，两者分工不重叠。
 *
 * 数据源刻意用构建期快照 realPlugins 而不是 Turso：
 * hub 页因此零数据库查询、可全量预渲染，产物进 CF assets 不占 Worker 体积。
 * 代价是数据新鲜度等于部署频率——每日同步本来就会触发部署，与 sitemap 口径一致。
 */

/**
 * hub 路由占用的 /plugins/<seg>/... 前缀。
 *
 * 这些静态段在 Next 的路由优先级里高于 /plugins/[owner]/[repo]，所以一旦
 * 出现同名的 GitHub 账号（如 owner 叫 `all`），那个账号下的插件详情页
 * 会被 hub 页静默遮蔽。当前 5,659 个 owner 中无冲突（2026-08-22 核过），
 * 每日同步若新增冲突 owner 需要在这里改前缀或给 hub 换命名空间。
 */
export const RESERVED_PLUGIN_SEGMENTS = ["c", "t", "lang", "all", "browse"] as const;

/** 标签开 hub 页的最低插件数。低于此数的页面太薄，不值得单开一个可索引 URL。 */
export const MIN_TAG_PLUGINS = 10;
/** 语言开 hub 页的最低插件数。 */
export const MIN_LANGUAGE_PLUGINS = 3;
/** 单个 hub 页最多列出的插件数；超出部分由 /plugins/all 全量索引兜底。 */
export const HUB_LIST_LIMIT = 200;
/** 全量索引每页条数。 */
export const ALL_INDEX_PAGE_SIZE = 200;
/** 详情页「相关插件」条数。 */
export const RELATED_LIMIT = 12;

/**
 * hub 列表用的精简插件形态。
 * 不直接传 RealPlugin：description/tags 这些字段会让 RSC 载荷白白翻几倍，
 * 而 hub 卡片只露出这几项。
 */
export interface HubPlugin {
  fullName: string;
  name: string;
  owner: string;
  description: string;
  stars: number;
  score: number | null;
  language: string;
  isFeatured: boolean;
  isOfficial: boolean;
  archived: boolean;
}

function toHubPlugin(p: RealPlugin): HubPlugin {
  return {
    fullName: p.fullName,
    name: p.name,
    owner: p.owner,
    description: p.description,
    stars: p.stars,
    score: p.score,
    language: p.language,
    isFeatured: p.isFeatured,
    isOfficial: p.isOfficial,
    archived: p.archived,
  };
}

/**
 * 风险仓库（假冒官方等）不进任何 hub。
 * 与 sitemap 同一口径：详情页 noindex，站内也不给它们导权重。
 */
const indexable: RealPlugin[] = realPlugins.filter((p) => !p.isRisky);

/**
 * 语言名转 URL 片段。`+` / `#` 先转成词再做通用替换，
 * 否则 "C++" 与 "C#" 都会塌成同一个 "c-" 造成 slug 撞车。
 */
export function languageSlug(language: string): string {
  return language
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/#/g, "sharp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** GitHub topic 本身就是小写短横线格式，这里只做兜底净化。 */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface HubFacet {
  /** URL 片段。 */
  slug: string;
  /** 展示用原名（分类是 slug 本身，文案走 i18n）。 */
  name: string;
  count: number;
}

interface HubIndex {
  categories: HubFacet[];
  languages: HubFacet[];
  tags: HubFacet[];
  byCategory: Map<string, RealPlugin[]>;
  byLanguage: Map<string, RealPlugin[]>;
  byTag: Map<string, RealPlugin[]>;
  byFullName: Map<string, RealPlugin>;
}

let cached: HubIndex | null = null;

/**
 * 惰性建索引：Worker 冷启动时不为没用到 hub 的路由付这份遍历成本。
 * 全部 hub 页都预渲染的情况下，这段在运行时基本不会执行。
 */
function index(): HubIndex {
  if (cached) return cached;

  const byCategory = new Map<string, RealPlugin[]>();
  const byLanguage = new Map<string, RealPlugin[]>();
  const byTag = new Map<string, RealPlugin[]>();
  const byFullName = new Map<string, RealPlugin>();
  // slug → 原始名，用于展示（语言/标签的大小写按数据里第一次出现的为准）
  const languageNames = new Map<string, string>();
  const tagNames = new Map<string, string>();

  const push = (m: Map<string, RealPlugin[]>, key: string, p: RealPlugin) => {
    const list = m.get(key);
    if (list) list.push(p);
    else m.set(key, [p]);
  };

  // realPlugins 行序已经是 featured 优先、star 降序，顺序遍历即得确定性排序
  for (const p of indexable) {
    byFullName.set(p.fullName, p);
    if (p.category) push(byCategory, p.category, p);
    if (p.language) {
      const slug = languageSlug(p.language);
      if (slug) {
        if (!languageNames.has(slug)) languageNames.set(slug, p.language);
        push(byLanguage, slug, p);
      }
    }
    for (const tag of p.tags) {
      const slug = tagSlug(tag);
      if (!slug) continue;
      if (!tagNames.has(slug)) tagNames.set(slug, tag);
      push(byTag, slug, p);
    }
  }

  const categories: HubFacet[] = PLUGIN_CATEGORIES.map((slug) => ({
    slug,
    name: slug,
    count: byCategory.get(slug)?.length ?? 0,
  })).filter((c) => c.count > 0);

  const languages: HubFacet[] = [...byLanguage.entries()]
    .filter(([, list]) => list.length >= MIN_LANGUAGE_PLUGINS)
    .map(([slug, list]) => ({
      slug,
      name: languageNames.get(slug) ?? slug,
      count: list.length,
    }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));

  const tags: HubFacet[] = [...byTag.entries()]
    .filter(([, list]) => list.length >= MIN_TAG_PLUGINS)
    .map(([slug, list]) => ({
      slug,
      name: tagNames.get(slug) ?? slug,
      count: list.length,
    }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));

  cached = {
    categories,
    languages,
    tags,
    byCategory,
    byLanguage,
    byTag,
    byFullName,
  };
  return cached;
}

export function listCategories(): HubFacet[] {
  return index().categories;
}

export function listLanguages(): HubFacet[] {
  return index().languages;
}

export function listTags(): HubFacet[] {
  return index().tags;
}

export interface HubResult {
  /** 该 facet 下插件总数。 */
  total: number;
  /** 实际渲染的前 HUB_LIST_LIMIT 条。 */
  plugins: HubPlugin[];
  /** 展示用原名。 */
  name: string;
}

function build(list: RealPlugin[] | undefined, name: string): HubResult | null {
  if (!list || list.length === 0) return null;
  return {
    total: list.length,
    plugins: list.slice(0, HUB_LIST_LIMIT).map(toHubPlugin),
    name,
  };
}

export function categoryHub(slug: string): HubResult | null {
  if (!(PLUGIN_CATEGORIES as readonly string[]).includes(slug)) return null;
  return build(index().byCategory.get(slug), slug);
}

export function languageHub(slug: string): HubResult | null {
  const idx = index();
  const facet = idx.languages.find((l) => l.slug === slug);
  if (!facet) return null;
  return build(idx.byLanguage.get(slug), facet.name);
}

export function tagHub(slug: string): HubResult | null {
  const idx = index();
  const facet = idx.tags.find((t) => t.slug === slug);
  if (!facet) return null;
  return build(idx.byTag.get(slug), facet.name);
}

/** 全量索引的总页数。 */
export function allIndexPageCount(): number {
  return Math.max(1, Math.ceil(indexable.length / ALL_INDEX_PAGE_SIZE));
}

export interface AllIndexPage {
  plugins: HubPlugin[];
  page: number;
  pageCount: number;
  total: number;
}

/** 全量分页索引。page 从 1 开始；越界返回 null 交给页面 404。 */
export function allIndexPage(page: number): AllIndexPage | null {
  const pageCount = allIndexPageCount();
  if (!Number.isInteger(page) || page < 1 || page > pageCount) return null;
  const start = (page - 1) * ALL_INDEX_PAGE_SIZE;
  return {
    plugins: indexable
      .slice(start, start + ALL_INDEX_PAGE_SIZE)
      .map(toHubPlugin),
    page,
    pageCount,
    total: indexable.length,
  };
}

/**
 * 详情页的「相关插件」。
 *
 * 打分规则：同分类 +3，每个共享标签 +2，同语言 +1。得分相同时保持 realPlugins
 * 的原始行序（featured 优先、star 降序），因此结果完全确定——
 * ISR 每次重验证都拿到同一份列表，链接图不会无谓抖动。
 */
export function relatedPlugins(
  fullName: string,
  limit = RELATED_LIMIT,
): HubPlugin[] {
  const idx = index();
  const self = idx.byFullName.get(fullName);
  if (!self) return [];

  const selfTags = new Set(self.tags.map(tagSlug).filter(Boolean));
  const scores = new Map<string, number>();

  const bump = (p: RealPlugin, by: number) => {
    if (p.fullName === fullName) return;
    scores.set(p.fullName, (scores.get(p.fullName) ?? 0) + by);
  };

  if (self.category) {
    for (const p of idx.byCategory.get(self.category) ?? []) bump(p, 3);
  }
  for (const slug of selfTags) {
    for (const p of idx.byTag.get(slug) ?? []) bump(p, 2);
  }
  if (self.language) {
    const slug = languageSlug(self.language);
    if (slug) for (const p of idx.byLanguage.get(slug) ?? []) bump(p, 1);
  }

  // 只按分数排序，同分靠 indexable 的稳定行序决定先后
  const candidates = [...scores.entries()]
    .filter(([, s]) => s > 1) // 仅同语言（+1）不足以称为「相关」
    .sort((a, b) => b[1] - a[1]);

  const rank = new Map<string, number>();
  indexable.forEach((p, i) => rank.set(p.fullName, i));
  candidates.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return (rank.get(a[0]) ?? 0) - (rank.get(b[0]) ?? 0);
  });

  const out: HubPlugin[] = [];
  for (const [name] of candidates) {
    const p = idx.byFullName.get(name);
    if (p) out.push(toHubPlugin(p));
    if (out.length >= limit) break;
  }
  return out;
}

/** 某插件在站内有 hub 页的标签（用于详情页把标签链到站内而不是 GitHub）。 */
export function internalTagSlugs(tags: string[]): Set<string> {
  const known = new Set(index().tags.map((t) => t.slug));
  const out = new Set<string>();
  for (const tag of tags) {
    const slug = tagSlug(tag);
    if (slug && known.has(slug)) out.add(slug);
  }
  return out;
}
