import { getLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";

export default async function LessonPage() {
  const locale = await getLocale();
  const Module = getLessonContent("dev", "05-config-publish", locale);
  const Content = Module.default;
  return <Content />;
}
