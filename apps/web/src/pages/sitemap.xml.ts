/**
 * /sitemap.xml —— sitemap 索引（robots.txt 指向它、Google 已收录这个入口，URL 必须原地保住）。
 * 按需渲染：lastmod 取请求时刻（1h 边缘缓存），帖子分片每小时更新时 Google 才会回头抓；
 * 分片清单读构建期旁车，这里不碰全量快照。
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { renderSitemapIndexFor, XML_HEADERS } from "@/lib/sitemap-xml";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const assets = (env as unknown as { ASSETS: { fetch(u: URL): Promise<Response> } }).ASSETS;
  const ids = (await (await assets.fetch(new URL("/sidecar/sitemap-ids.json", url))).json()) as string[];
  return new Response(renderSitemapIndexFor(ids, new Date().toISOString()), { headers: XML_HEADERS });
};
