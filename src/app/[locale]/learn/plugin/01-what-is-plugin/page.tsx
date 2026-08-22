import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("plugin", "01-what-is-plugin");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("plugin", "01-what-is-plugin", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"plugin"} slug={"01-what-is-plugin"} locale={locale} />
      <Content />
    </>
  );
}
