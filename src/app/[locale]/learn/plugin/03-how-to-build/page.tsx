import { getLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";

export default async function LessonPage() {
  const locale = await getLocale();
  const Module = getLessonContent("plugin", "03-how-to-build", locale);
  const Content = Module.default;
  return <Content />;
}
