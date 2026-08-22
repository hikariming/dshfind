import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("intro", "why-dynamic");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("intro", "why-dynamic", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"intro"} slug={"why-dynamic"} locale={locale} />
      <Content />
    </>
  );
}
