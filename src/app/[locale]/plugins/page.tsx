import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PluginsBrowser } from "@/components/plugins-browser";
import { PLUGIN_CATEGORIES, type PluginCategory } from "@/lib/categories";
import { getPluginsPageData } from "@/lib/plugins-db";
import { isLocale } from "@/i18n/config";
import { pageAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("pluginsTitle"),
    description: t("pluginsDescription"),
    alternates: pageAlternates(locale, "/plugins"),
  };
}

export default async function PluginsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ plugins, languages, authorCount, i18nDescriptions }, { category }] =
    await Promise.all([getPluginsPageData(), searchParams]);
  const initialCategory = PLUGIN_CATEGORIES.includes(category as PluginCategory)
    ? category
    : "all";
  return (
    <PluginsBrowser
      plugins={plugins}
      languages={languages}
      authorCount={authorCount}
      i18nDescriptions={i18nDescriptions}
      initialCategory={initialCategory}
    />
  );
}
