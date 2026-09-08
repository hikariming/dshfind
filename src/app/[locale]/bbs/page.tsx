import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BbsBrowser } from "@/components/bbs-browser";
import { threadPageFromBackend } from "@/lib/backend";
import { isLocale } from "@/i18n/config";
import { pageAlternates } from "@/lib/site";

/** SSR 首屏保留帖子内链；公开响应边缘缓存 60 秒。 */
export const revalidate = 0;

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
  const initial = await threadPageFromBackend({ locale });

  return <BbsBrowser initial={initial} />;
}
