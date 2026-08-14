import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("learnTitle"),
    description: t("learnDescription"),
  };
}

/**
 * /learn 跳到课程起点。
 * 「读到哪了」是每个用户的本机状态，服务端无从得知；续读入口在 /learn/cordis 概览页。
 */
export default async function LearnPage() {
  const locale = await getLocale();
  redirect({ href: "/learn/cordis", locale });
}
