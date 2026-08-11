import { getLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";

export default async function LessonPage() {
  const locale = await getLocale();
  const Module = getLessonContent("dev", "03-write-service", locale);
  const Content = Module.default;
  return <Content />;
}
