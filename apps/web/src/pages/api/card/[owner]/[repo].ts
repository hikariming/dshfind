/** GET /api/card/[owner]/[repo] —— 分享展示卡。逻辑在 @/lib/share-render（与老站同一份，出图字节一致）。 */
import type { APIRoute } from "astro";

import { cardSvg, SHARE_CACHE, SHARE_CACHE_SHORT } from "@/lib/share-render";
import { getPluginDetail } from "~/detail/data";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const { svg, cacheable } = await cardSvg(params.owner ?? "", params.repo ?? "", url.searchParams, getPluginDetail);
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": cacheable ? SHARE_CACHE : SHARE_CACHE_SHORT },
  });
};
