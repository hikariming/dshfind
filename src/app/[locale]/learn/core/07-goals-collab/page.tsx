import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("core", "07-goals-collab", locale);
  const Content = Module.default;
  return <Content />;
}
