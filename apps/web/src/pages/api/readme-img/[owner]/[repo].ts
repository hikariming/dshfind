/** GET /api/readme-img/[owner]/[repo]?u= —— README 图片代理。逻辑在 @/lib/readme-img-proxy（与老站同一份）。 */
import type { APIRoute } from "astro";

import { proxyReadmeImage, README_IMG_LISTED_SQL } from "@/lib/readme-img-proxy";
import { query } from "~/detail/data";

export const prerender = false;

async function isListed(fullName: string, needle: string) {
  try {
    return (await query(README_IMG_LISTED_SQL, fullName, needle)).length > 0;
  } catch {
    return false;
  }
}

export const GET: APIRoute = ({ params, request }) => proxyReadmeImage(request, params.owner ?? "", params.repo ?? "", isListed);
