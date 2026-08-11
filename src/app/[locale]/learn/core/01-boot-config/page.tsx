import { getLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";

export default async function LessonPage() {
  const locale = await getLocale();
  const Module = getLessonContent("core", "01-boot-config", locale);
  const Content = Module.default;
  return <Content />;
}
