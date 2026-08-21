import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BbsBrowser } from "@/components/bbs-browser";
import { threadPageFromBackend } from "@/lib/backend";
import { isLocale } from "@/i18n/config";
import { pageAlternates } from "@/lib/site";

/**
 * 总板块聚合页。
 *
 * 设计文档原本把这页定为"纯客户端拉取的静态壳"，实施时改成了 ISR + 服务端
 * 首屏：BBS 现在要承载 SEO 文章，纯客户端列表意味着爬虫看不到任何指向帖子页
 * 的 <a>，帖子只能靠 sitemap 被发现，站内权重一点传不过去。5 分钟一次重验证，
 * 每种语言各一份缓存，成本可以忽略。
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("bbsTitle"),
    description: t("bbsDescription"),
    alternates: pageAlternates(locale, "/bbs"),
  };
}

export default async function BbsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 后端不可用时给 null，浏览器挂载后会自己再拉一次。
  const initial = await threadPageFromBackend({ locale }, revalidate);

  return <BbsBrowser initial={initial} />;
}
