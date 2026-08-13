import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "学习",
  description: "dshfind 学习中心：从 Cordis 论文精读开始，理解 DSH 的时空可组合性。",
};

/**
 * /learn 跳到课程起点。
 * 「读到哪了」是每个用户的本机状态，服务端无从得知；续读入口在 /learn/cordis 概览页。
 */
export default async function LearnPage() {
  const locale = await getLocale();
  redirect({ href: "/learn/cordis", locale });
}
