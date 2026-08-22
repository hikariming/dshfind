import { getTranslations } from "next-intl/server";

import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { isLocale, type Locale } from "@/i18n/config";
import { jsonLdSafe } from "@/lib/json-ld";
import {
  chapterId,
  lessonCrumbs,
  lessonJsonLd,
} from "@/lib/lesson-seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

/**
 * 课时页的结构化数据 + 可见面包屑。
 *
 * 37 个课时页是同一份 14 行样板，所以这里做成一个组件，每页加一行即可。
 * 面包屑同时出现在 DOM 与 JSON-LD 里，两者用同一份 crumbs——
 * 展示与结构化数据不会漂移，这是 Google 明确要求的一致性。
 */
export async function LessonSeo({
  chapter,
  slug,
  locale,
}: {
  chapter: string;
  slug: string;
  locale: string;
}) {
  if (!isLocale(locale)) return null;
  const loc = locale as Locale;

  const t = await getTranslations("Learn");
  const id = chapterId(chapter);
  // i18n 缺章节标题时退回目录名——宁可粗糙，也不要空字符串进结构化数据
  const chapterName = id ? t(`chapters.${id}.title`) : chapter;
  const learnLabel = t("learningCenter");

  const crumbs = lessonCrumbs(chapter, slug, loc, learnLabel, chapterName);
  const lesson = lessonJsonLd(chapter, slug, loc, chapterName);

  return (
    <>
      {lesson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdSafe(lesson) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe(breadcrumbJsonLd(loc, crumbs)),
        }}
      />
      <div className="mb-4">
        <BreadcrumbNav crumbs={crumbs} />
      </div>
    </>
  );
}
