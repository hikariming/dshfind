/**
 * /sitemap/{pages,hubs,docs,all-index,plugins-N}.xml —— 构建期预渲染（取数依赖全量快照，与老站同一份逻辑）。
 * 帖子分片要每小时刷新，单独按需渲染（./threads.xml.ts）。
 */
import type { APIRoute, GetStaticPaths } from "astro";

import { buildShard, renderUrlset, shardIds, XML_HEADERS } from "@/lib/sitemap-shards";

export const getStaticPaths = (() =>
  shardIds()
    .filter((id) => id !== "threads")
    .map((shard) => ({ params: { shard } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const entries = await buildShard(params.shard ?? "");
  if (!entries) return new Response("Not found", { status: 404 });
  return new Response(renderUrlset(entries), { headers: XML_HEADERS });
};
