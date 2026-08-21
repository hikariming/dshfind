import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BbsComposer } from "@/components/bbs-composer";
import { isLocale } from "@/i18n/config";

/**
 * 发帖页：纯静态壳，所有交互与会话读取都在 BbsComposer 里。
 * 服务端一行 cookies() 都不碰——它会把这条路由拖成每请求动态渲染。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Bbs" });
  // 表单页没有收录价值，收进索引只会稀释 /bbs 与帖子页。
  return { title: t("newThread"), robots: { index: false } };
}

export default async function NewThreadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BbsComposer />;
}
