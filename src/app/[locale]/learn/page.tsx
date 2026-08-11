import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Metadata } from "next";

import { cordisLessons } from "@/lib/mock";

export const metadata: Metadata = {
  title: "学习",
  description: "dshfind 学习中心：从 Cordis 论文精读开始，理解 DSH 的时空可组合性。",
};

/**
 * /learn 默认跳到用户当前读到的课程（mock 中为「进行中」的那一课）。
 * 课程目录见 /learn/cordis 概览页与侧栏章节导航。
 */
export default async function LearnPage() {
  const locale = await getLocale();
  const current = cordisLessons.find((l) => l.status === "in_progress");
  redirect({
    href: current
      ? `/learn/cordis/lessons/${current.slug}`
      : "/learn/cordis/lessons/01-intro",
    locale,
  });
}
