import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("dev", "04-listen-events");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("dev", "04-listen-events", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"dev"} slug={"04-listen-events"} locale={locale} />
      <Content />
    </>
  );
}
