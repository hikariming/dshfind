import type { AstroComponentFactory } from "astro/runtime/server/index.js";

import { lessonHref } from "@/lib/lesson-seo";
import { lessonManifest, type LessonManifestEntry } from "@/lib/lessons-manifest";
import type { Locale } from "~/i18n";

type MdxModule = { default: AstroComponentFactory };

// 课程正文仍住在老站 src/content/lessons（新老两站共用同一份 MDX）
const modules = import.meta.glob<MdxModule>("../../../src/content/lessons/*/*/*.mdx");

function loader(chapter: string, slug: string, locale: string) {
  return modules[`../../../src/content/lessons/${chapter}/${slug}/${locale}.mdx`];
}

export interface LessonPage {
  entry: LessonManifestEntry;
  locale: Locale;
  /** 语言前缀之后的路径，如 /learn/cordis/lessons/01-intro */
  path: string;
  /** 本语言有真正文；false 表示回落到中文，页面必须 noindex */
  native: boolean;
  load: () => Promise<MdxModule>;
}

/** 与老站 registry 同口径：缺语言回落中文。 */
export function lessonPage(entry: LessonManifestEntry, locale: Locale): LessonPage {
  const own = loader(entry.chapter, entry.slug, locale);
  const load = own ?? loader(entry.chapter, entry.slug, "zh");
  if (!load) throw new Error(`lesson without zh source: ${entry.chapter}/${entry.slug}`);
  return {
    entry,
    locale,
    path: lessonHref(entry.chapter, entry.slug),
    native: Boolean(own) && Boolean(entry.titles[locale]),
    load,
  };
}

export { lessonManifest };
