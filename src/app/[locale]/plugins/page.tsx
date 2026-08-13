import type { Metadata } from "next";
import { PluginsBrowser } from "@/components/plugins-browser";

export const metadata: Metadata = {
  title: "插件超市",
  description:
    "DSH 插件生态清单：GitHub topic dsh-plugin 下的公开仓库，可按 star、更新时间、语言浏览。",
};

export default function PluginsPage() {
  return <PluginsBrowser />;
}
