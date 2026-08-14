import type { Metadata } from "next";
import { PluginsBrowser } from "@/components/plugins-browser";
import { PLUGIN_CATEGORIES, type PluginCategory } from "@/lib/categories";
import { getPluginsPageData } from "@/lib/plugins-db";

export const metadata: Metadata = {
  title: "插件超市",
  description:
    "DSH 插件生态清单：GitHub topic dsh-plugin 下的公开仓库，每日同步 star、贡献者与增长数据。",
};

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
