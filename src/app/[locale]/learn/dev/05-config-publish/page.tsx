import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("dev", "05-config-publish");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("dev", "05-config-publish", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"dev"} slug={"05-config-publish"} locale={locale} />
      <Content />
    </>
  );
}
