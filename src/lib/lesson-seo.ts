import type { Metadata } from "next";

import { isLocale, type Locale } from "@/i18n/config";
import { jsonLdSafe } from "./json-ld";
import { lessonEntry } from "./lessons-manifest";
import { pageAlternates, SITE_URL } from "./site";
import { breadcrumbJsonLd, type Crumb } from "./structured-data";

/**
 * 课程页的 SEO 层。
 *
 * 这 37 个页面此前**完全没有 generateMetadata**——152 个 URL 共用站点默认的
 * title/description，没有 canonical、没有 hreflang。站里最厚的内容
 * （单页 4,400–14,700 字符）在搜索引擎眼里彼此无法区分，等于白写。
 *
 * 课时页是 37 份一模一样的 14 行样板，所以这里做成工厂：每个页面加两行即可，
 * 不必逐个手写 metadata，也不会漏掉某一篇。
 */

/** 课时 href：cordis 章节的路径形状与其余章节不同。 */
export function lessonHref(chapter: string, slug: string): string {
  return chapter === "cordis"
    ? `/learn/cordis/lessons/${slug}`
    : `/learn/${chapter}/${slug}`;
}

/**
 * 内容目录 → nav.ts 的章节 id。
 * 章节标题只有 i18n 里有本地化版本（Learn.chapters.<id>.title），
 * nav.ts 里那份是写死的中文，不能拿去喂结构化数据。
 */
const CHAPTER_IDS: Record<string, string> = {
  intro: "ch1",
  cordis: "ch2",
  core: "ch3",
  dev: "ch4",
  plugin: "ch5",
};

export function chapterId(chapter: string): string | null {
  return CHAPTER_IDS[chapter] ?? null;
}

/**
 * 生成课时页的 generateMetadata。
 *
 * 关键的一条是 robots：registry 的 getLessonContent 在缺语言时回落到中文，
 * 于是 /ja/learn/plugin/01-* 是日文 URL 配中文正文。这种页面必须 noindex——
 * 收录它等于自造重复内容，还给 Google 一个错误的语言信号。
 */
export function lessonMetadata(chapter: string, slug: string) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    if (!isLocale(locale)) return {};

    const entry = lessonEntry(chapter, slug);
    if (!entry) return {};

    const native = Boolean(entry.titles[locale]);
    // 回落到中文时，标题也用中文的——展示什么就声明什么，不制造假象
    const title = entry.titles[locale] ?? entry.titles.zh;
    const description = entry.summaries[locale] ?? entry.summaries.zh;
    const path = lessonHref(chapter, slug);

    return {
      title,
      description,
      alternates: pageAlternates(locale, path),
      openGraph: { title, description, type: "article" },
      robots: native ? undefined : { index: false, follow: true },
    };
  };
}

/**
 * 课时页的结构化数据。
 *
 * 用 LearningResource 而不是 Course：单篇是一节课，不是一整门课程；
 * Course 该挂在章节概览页上。isPartOf 把它关回所属章节，
 * 让搜索引擎理解这 37 篇是一个整体而不是散页。
 */
export function lessonJsonLd(
  chapter: string,
  slug: string,
  locale: Locale,
  chapterName: string,
) {
  const entry = lessonEntry(chapter, slug);
  if (!entry) return null;

  const title = entry.titles[locale] ?? entry.titles.zh;
  const description = entry.summaries[locale] ?? entry.summaries.zh;
  const url = `${SITE_URL}/${locale}${lessonHref(chapter, slug)}`;

  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: title,
    description: description || undefined,
    inLanguage: locale,
    url,
    learningResourceType: "Lesson",
    educationalLevel: "Beginner",
    isPartOf: {
      "@type": "Course",
      name: chapterName,
      provider: { "@type": "Organization", name: "dshfind", url: SITE_URL },
    },
    about: {
      "@type": "SoftwareApplication",
      name: "DeepSeek Harness",
      applicationCategory: "DeveloperApplication",
    },
  };
}

/** 课时页的面包屑：dshfind › 学习 › 章节 › 本课。 */
export function lessonCrumbs(
  chapter: string,
  slug: string,
  locale: Locale,
  learnLabel: string,
  chapterName: string,
): Crumb[] {
  const entry = lessonEntry(chapter, slug);
  const title = entry?.titles[locale] ?? entry?.titles.zh ?? slug;
  return [
    { name: "dshfind", path: "" },
    { name: learnLabel, path: "/learn/cordis" },
    { name: chapterName, path: lessonHref(chapter, slug) },
    { name: title, path: lessonHref(chapter, slug) },
  ];
}

/** 把两份结构化数据拼成可直接注入的 HTML 片段。 */
export function lessonJsonLdHtml(
  chapter: string,
  slug: string,
  locale: Locale,
  chapterName: string,
  crumbs: Crumb[],
): string[] {
  const out: string[] = [];
  const lesson = lessonJsonLd(chapter, slug, locale, chapterName);
  if (lesson) out.push(jsonLdSafe(lesson));
  out.push(jsonLdSafe(breadcrumbJsonLd(locale, crumbs)));
  return out;
}
