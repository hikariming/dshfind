import { setRequestLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const Module = getLessonContent("core", "02-ctx-basics", locale);
  const Content = Module.default;
  return <Content />;
}
