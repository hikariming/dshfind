import {
  buildShard,
  renderUrlset,
  shardIds,
  XML_HEADERS,
} from "@/lib/sitemap-shards";

/**
 * `/sitemap/<id>.xml` —— 各个分片。
 *
 * 全部预渲染：分片是爬虫的入口，按需渲染意味着 Googlebot 第一次来就得等
 * 函数冷启动跑完几千条 URL 的拼装。
 *
 * threads 分片需要每小时刷新，其余数据都来自构建期快照、只在部署时变化——
 * 但 route segment config 只能是常量，所以统一取 3600；对静态分片而言
 * 重验证只是重新拼一次同样的字符串，成本可以忽略。
 */
export const revalidate = 3600;

/** 未列出的 id 一律 404，不给爬虫留下无限的探测面。 */
export const dynamicParams = false;

export function generateStaticParams() {
  return shardIds().map((id) => ({ shard: `${id}.xml` }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shard: string }> },
) {
  const { shard } = await params;
  const id = shard.replace(/\.xml$/, "");
  const entries = await buildShard(id);
  if (!entries) return new Response("Not found", { status: 404 });

  return new Response(renderUrlset(entries), { headers: XML_HEADERS });
}
