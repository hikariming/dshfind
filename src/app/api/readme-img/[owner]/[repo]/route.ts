import { getDb } from "@/lib/db";
import { proxyReadmeImage, README_IMG_LISTED_SQL } from "@/lib/readme-img-proxy";

/**
 * GET /api/readme-img/[owner]/[repo]?u=<图片地址> —— 详情页 README 图片的站内代理。
 * 逻辑在 lib/readme-img-proxy（与 Astro 新站共用）；成本说明见那里与 scripts/lib/page-cache-policy.mjs。
 */
async function isListed(fullName: string, needle: string) {
  try {
    const rs = await getDb().execute({ sql: README_IMG_LISTED_SQL, args: [fullName, needle] });
    return rs.rows.length > 0;
  } catch {
    return false;
  }
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/readme-img/[owner]/[repo]">,
) {
  const { owner, repo } = await ctx.params;
  return proxyReadmeImage(request, owner, repo, isListed);
}
