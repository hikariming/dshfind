import { NextResponse } from "next/server";

import { getPluginsPageData } from "@/lib/plugins-db";

/**
 * GET /api/plugins-data —— 插件超市的全量数据（懒加载第二段）。
 *
 * /plugins 页首屏只直出前 100 个插件（HTML 从 3.6MB 降到约 0.2MB），
 * 其余由 PluginsBrowser 在浏览器空闲时从这里拉取。
 * revalidate 让本路由进 ISR 缓存：命中缓存直接由 CDN 吐 JSON，
 * 不产生函数调用；数据新鲜度与 /plugins 页一致（30 分钟）。
 */
export const revalidate = 1800;

export async function GET() {
  const { plugins, i18nDescriptions } = await getPluginsPageData();
  return NextResponse.json({ plugins, i18nDescriptions });
}
