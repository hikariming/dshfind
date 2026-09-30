/**
 * GET /api/plugins-data —— 插件超市的全量数据（懒加载第二段），与老站同一路径、同一形状。
 * 构建期直接生成静态 JSON：请求由静态资源返回，不跑 Worker、不查数据库。
 * 静态文件无扩展名，Content-Type 由 public/_headers 指定为 application/json。
 */
import type { APIRoute } from "astro";

import { getPluginsPageData } from "@/lib/plugins-page-data";

export const GET: APIRoute = () => {
  const { plugins, i18nDescriptions } = getPluginsPageData();
  return new Response(JSON.stringify({ plugins, i18nDescriptions }), {
    headers: { "content-type": "application/json" },
  });
};
