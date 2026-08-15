import { defaultLocale, type Locale } from "@/i18n/config";
import { getPostModule } from "@/content/blog/registry";

/**
 * 一篇博客文章的元数据。正文本身是 MDX 文件（src/content/blog/<slug>/<locale>.mdx），
 * 由 scripts/gen-blog-registry.mjs 扫描生成 registry.ts；这里只放列表/详情页要用的元信息。
 * 标题与摘要按语言存，缺语言回退默认语言（zh），和 lessons 的回退口径一致。
 */
export interface BlogPost {
  /** URL 片段，全局唯一：/blog/<slug> */
  slug: string;
  /** 发布日期 YYYY-MM-DD，用于排序与展示 */
  date: string;
  /** 作者署名（语言中立，直接展示） */
  author: string;
  /** 标签 slug；展示文案在 messages 的 Blog.tags 里按语言取 */
  tags: string[];
  /** 各语言标题 */
  title: Partial<Record<Locale, string>>;
  /** 各语言一句话摘要，用于卡片与 meta description */
  summary: Partial<Record<Locale, string>>;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "top-plugins-2026-08",
    date: "2026-08-15",
    author: "dshfind",
    tags: ["ranking", "plugins", "beginners"],
    title: {
      zh: "2026 年 8 月，DSH 最火的 10 个插件（人话版）",
      en: "The 10 Hottest DeepSeek Harness Plugins Right Now (August 2026)",
      ja: "2026年8月・いま最も人気のDeepSeek Harnessプラグイン10選",
      ko: "2026년 8월, 지금 가장 인기 있는 DeepSeek Harness 플러그인 10선",
    },
    summary: {
      zh: "不懂技术也能看懂：按 GitHub star 排出的当下最受欢迎的 10 个 DSH 插件，每个用一句话说清它能帮你干嘛、适合谁。",
      en: "No tech background needed: the 10 most-starred DeepSeek Harness plugins as of today, each explained in one plain sentence — what it does and who it's for.",
      ja: "技術知識ゼロでも読める：本日時点でGitHubスターの多いDSHプラグイン10個を、それぞれ一言で「何ができて、誰向けか」を解説。",
      ko: "기술 지식이 없어도 이해할 수 있게: 오늘 기준 GitHub 스타가 가장 많은 DSH 플러그인 10개를 한 문장씩 쉽게 정리했습니다.",
    },
  },
];

/** 全部文章，按日期倒序（新在前）。 */
export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 单篇，未找到返回 undefined（页面走 notFound）。 */
export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

/** 出现过的标签，按文章数降序。 */
export function getAllTags(): string[] {
  const count = new Map<string, number>();
  for (const p of blogPosts) {
    for (const tag of p.tags) count.set(tag, (count.get(tag) ?? 0) + 1);
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

/** 从按语言存的字段取当前语言文案，缺失回退默认语言，再退第一个有值的。 */
export function localizedText(
  rec: Partial<Record<Locale, string>>,
  locale: Locale,
): string {
  return rec[locale] ?? rec[defaultLocale] ?? Object.values(rec)[0] ?? "";
}

/** 取某篇文章某语言的 MDX 模块（缺语言在 registry 内回退 zh）。 */
export function getPostContent(slug: string, locale: string) {
  return getPostModule(slug, locale);
}
