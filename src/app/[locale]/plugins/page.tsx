import type { Metadata } from "next";
import { PluginsBrowser } from "@/components/plugins-browser";
import { getPluginsPageData } from "@/lib/plugins-db";

export const metadata: Metadata = {
  title: "插件超市",
  description:
    "DSH 插件生态清单：GitHub topic dsh-plugin 下的公开仓库，每日同步 star、贡献者与增长数据。",
};

export default async function PluginsPage() {
  const { plugins, languages, authorCount } = await getPluginsPageData();
  return (
    <PluginsBrowser
      plugins={plugins}
      languages={languages}
      authorCount={authorCount}
    />
  );
}
