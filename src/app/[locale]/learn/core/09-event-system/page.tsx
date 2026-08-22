import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("core", "09-event-system");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("core", "09-event-system", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"core"} slug={"09-event-system"} locale={locale} />
      <Content />
    </>
  );
}
