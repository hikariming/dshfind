import type { Metadata } from "next";
import { PluginsBrowser } from "@/components/plugins-browser";

export const metadata: Metadata = {
  title: "插件超市",
  description: "dsh-external 组织的 DSH 插件清单，来自 hub catalog.json。",
};

export default function PluginsPage() {
  return <PluginsBrowser />;
}
