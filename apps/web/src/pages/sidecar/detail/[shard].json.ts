/**
 * 构建期生成详情页旁车数据的分片（见 ~/detail/sidecar.ts）。预渲染为静态 JSON，
 * 运行时由详情页经 ASSETS binding 读取——不经公网、不进 Worker 产物。
 */
import type { APIRoute, GetStaticPaths } from "astro";

import { pluginRelatedDocs } from "@/lib/docs-related";
import { internalTagSlugs, relatedPlugins } from "@/lib/plugin-hubs";
import { getPluginEditorial } from "@/lib/plugin-i18n";
import { realPlugins } from "@/lib/plugins-real";
import { SHARDS, shardOf, type SidecarShard } from "~/detail/sidecar";

export const getStaticPaths = (() =>
  Array.from({ length: SHARDS }, (_, i) => ({ params: { shard: String(i).padStart(2, "0") } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const n = Number(params.shard);
  const shard: SidecarShard = {};
  for (const p of realPlugins) {
    if (shardOf(p.fullName) !== n) continue;
    const tags = internalTagSlugs(p.tags);
    const curated = getPluginEditorial(p.fullName)?.installCmd;
    shard[p.fullName.toLowerCase()] = {
      r: relatedPlugins(p.fullName).map((x) => x.fullName),
      d: pluginRelatedDocs(p.category, tags).map((x) => [x.section, x.slug]),
      t: [...tags],
      ...(curated ? { c: curated } : {}),
    };
  }
  return new Response(JSON.stringify(shard), { headers: { "content-type": "application/json" } });
};
