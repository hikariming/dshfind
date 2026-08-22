import {
  renderSitemapIndex,
  XML_HEADERS,
} from "@/lib/sitemap-shards";

/**
 * `/sitemap.xml` —— sitemap 索引。
 *
 * 这个 URL 必须原地保住：robots.txt 指向它，Google 也已经收录了它。
 * 用手写 route handler 而不是 Next 的 `sitemap.ts` + `generateSitemaps()`，
 * 正是因为后者只产分片、不产索引，还会让这个 URL 消失。
 *
 * 每小时重验证：threads 分片本身每小时刷新，索引里的 lastmod 得跟着动，
 * 否则 Google 看到 lastmod 没变就不会回头抓那个分片。
 */
export const revalidate = 3600;

export function GET() {
  return new Response(renderSitemapIndex(new Date().toISOString()), {
    headers: XML_HEADERS,
  });
}
