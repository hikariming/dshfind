import { NextResponse } from "next/server";

import { getPluginDetail } from "@/lib/plugins-db";
import { badgeSvg, SHARE_CACHE, SHARE_CACHE_SHORT } from "@/lib/share-render";

/**
 * GET /api/badge/[owner]/[repo]?lang=en|zh|ja|ko&metric=auto|downloads
 * —— shields 风格的一行小标，给插件作者贴进 README，点击跳回 dshfind 详情页。
 *
 * 渲染与取数逻辑在 lib/share-render（与 Astro 新站共用，出图字节一致）。
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/badge/[owner]/[repo]">
) {
  const { owner, repo } = await ctx.params;
  const { svg, cacheable } = await badgeSvg(owner, repo, new URL(request.url).searchParams, getPluginDetail);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": cacheable ? SHARE_CACHE : SHARE_CACHE_SHORT,
    },
  });
}
