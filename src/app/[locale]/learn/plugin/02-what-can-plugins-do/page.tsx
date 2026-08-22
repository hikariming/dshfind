import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("plugin", "02-what-can-plugins-do");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("plugin", "02-what-can-plugins-do", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"plugin"} slug={"02-what-can-plugins-do"} locale={locale} />
      <Content />
    </>
  );
}
