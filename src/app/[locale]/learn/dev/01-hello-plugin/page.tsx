import { getLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";

export default async function LessonPage() {
  const locale = await getLocale();
  const Module = getLessonContent("dev", "01-hello-plugin", locale);
  const Content = Module.default;
  return <Content />;
}
