import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("cordis", "12-loader-koishi");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("cordis", "12-loader-koishi", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"cordis"} slug={"12-loader-koishi"} locale={locale} />
      <Content />
    </>
  );
}
