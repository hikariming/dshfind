import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("cordis", "05-coeffect");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("cordis", "05-coeffect", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"cordis"} slug={"05-coeffect"} locale={locale} />
      <Content />
    </>
  );
}
