import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Hero } from "@/components/sections/hero";
import { NavSection } from "@/components/sections/nav-section";
import { isLocale, type Locale } from "@/i18n/config";
import { localeUrl, pageAlternates, SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    // 首页用绝对标题，不套 "%s · dshfind" 模板
    title: { absolute: t("siteTitle") },
    description: t("siteDescription"),
    alternates: pageAlternates(locale),
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = (isLocale(locale) ? locale : "zh") as Locale;
  setRequestLocale(loc);

  // WebSite 结构化数据：告诉 Google 站点身份与站内搜索入口
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "dshfind",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${localeUrl(loc, "/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <NavSection />
    </>
  );
}
