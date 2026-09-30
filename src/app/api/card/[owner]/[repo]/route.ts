import { NextResponse } from "next/server";

import { getPluginDetail } from "@/lib/plugins-db";
import { cardSvg, SHARE_CACHE, SHARE_CACHE_SHORT } from "@/lib/share-render";

/**
 * GET /api/card/[owner]/[repo]?lang=en|zh|ja|ko —— 440×122 的展示卡（纯 SVG，深浅色跟随读者系统主题）。
 *
 * 渲染与取数逻辑在 lib/share-render（与 Astro 新站共用，出图字节一致）。
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/card/[owner]/[repo]">
) {
  const { owner, repo } = await ctx.params;
  const { svg, cacheable } = await cardSvg(owner, repo, new URL(request.url).searchParams, getPluginDetail);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": cacheable ? SHARE_CACHE : SHARE_CACHE_SHORT,
    },
  });
}
