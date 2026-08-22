import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";
import { LessonSeo } from "@/components/lesson-seo";
import { lessonMetadata } from "@/lib/lesson-seo";

export const generateMetadata = lessonMetadata("plugin", "03-how-to-build");

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("plugin", "03-how-to-build", locale);
  const Content = Module.default;
  return (
    <>
      <LessonSeo chapter={"plugin"} slug={"03-how-to-build"} locale={locale} />
      <Content />
    </>
  );
}
