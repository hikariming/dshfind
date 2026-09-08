import { NextResponse } from "next/server";

import { getPluginsPageData } from "@/lib/plugins-db";

/**
 * GET /api/plugins-data —— 插件超市的全量数据（懒加载第二段）。
 *
 * /plugins 页首屏只直出前 100 个插件（HTML 从 3.6MB 降到约 0.2MB），
 * 其余由 PluginsBrowser 在浏览器空闲时从这里拉取。
 * Workers Cache 复用公开 JSON 30 分钟；缓存未命中才查库。
 */
export const revalidate = 0;

export async function GET() {
  const { plugins, i18nDescriptions } = await getPluginsPageData();
  return NextResponse.json({ plugins, i18nDescriptions });
}
