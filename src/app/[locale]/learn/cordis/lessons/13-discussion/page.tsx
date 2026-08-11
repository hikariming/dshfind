import { getLocale } from "next-intl/server";
import { getLessonContent } from "@/content/lessons/registry";

export default async function LessonPage() {
  const locale = await getLocale();
  const Module = getLessonContent("cordis", "13-discussion", locale);
  const Content = Module.default;
  return <Content />;
}
