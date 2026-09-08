import { NextResponse } from "next/server";

import { getPluginsPageData } from "@/lib/plugins-page-data";

/**
 * GET /api/plugins-data —— 插件超市的全量数据（懒加载第二段）。
 *
 * /plugins 页首屏只直出前 100 个插件（HTML 从 3.6MB 降到约 0.2MB），
 * 其余由 PluginsBrowser 在浏览器空闲时从这里拉取。
 * 读取每日生成的快照：包括缓存未命中、Cookie 绕过在内，均不查数据库。
 */
export const revalidate = 0;

export async function GET() {
  const { plugins, i18nDescriptions } = await getPluginsPageData();
  return NextResponse.json({ plugins, i18nDescriptions }, {
    headers: { 'x-dshfind-data-source': 'build-snapshot' },
  });
}
