import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("cordis", "10-context-paradigm");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("cordis", "10-context-paradigm", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"cordis"} slug={"10-context-paradigm"} locale={locale} />
      <Content />
    </>
  );
}
