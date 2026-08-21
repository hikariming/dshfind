import { allShardNames } from "@/lib/sitemap-data";
import { renderIndex, XML_HEADERS } from "@/lib/sitemap";

/**
 * GET /sitemap.xml —— sitemap 索引。
 *
 * 这里是手写的 route handler 而非 Next 的 sitemap.ts 约定：约定配合
 * generateSitemaps() 只会产出 /sitemap/0.xml 这类分片、**不生成索引**，
 * 而 /sitemap.xml 会随之消失。那是 robots.txt 指向、Google 已收录的地址，
 * 不能动。所以保留这个 URL，把内容换成 <sitemapindex>。
 */
export const revalidate = 3600;

export function GET() {
  return new Response(renderIndex(allShardNames()), { headers: XML_HEADERS });
}
