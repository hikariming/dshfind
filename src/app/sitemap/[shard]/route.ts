import {
  allShardNames,
  pagesShard,
  pluginsShard,
} from "@/lib/sitemap-data";
import { renderUrlset, XML_HEADERS } from "@/lib/sitemap";

/**
 * GET /sitemap/{shard}.xml —— sitemap 分片，由 /sitemap.xml 索引引用。
 *
 * 分片全部预渲染并按小时重验证。pages 片依赖实时后端（帖子），插件片只依赖
 * 构建期快照——两者重验证代价差一个数量级，所以分开而不是切成等大的块。
 */
export const revalidate = 3600;
/** 只服务索引里列出的分片；越界的片名一律 404，不给爬虫制造无限 URL 空间。 */
export const dynamicParams = false;

export function generateStaticParams() {
  return allShardNames().map((shard) => ({ shard: `${shard}.xml` }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shard: string }> },
) {
  const { shard } = await params;
  const name = shard.replace(/\.xml$/, "");

  if (name === "pages") {
    return new Response(renderUrlset(await pagesShard(revalidate)), {
      headers: XML_HEADERS,
    });
  }

  const match = /^plugins-(\d+)$/.exec(name);
  if (match) {
    const entries = pluginsShard(Number.parseInt(match[1], 10));
    if (entries) {
      return new Response(renderUrlset(entries), { headers: XML_HEADERS });
    }
  }

  return new Response("Not found", { status: 404 });
}
