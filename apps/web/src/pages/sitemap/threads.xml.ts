/** /sitemap/threads.xml —— 论坛帖子分片，按需渲染（BBS 发的文章不该等下次部署才进 sitemap），1h 边缘缓存。 */
import type { APIRoute } from "astro";

import { buildThreads, renderUrlset, XML_HEADERS } from "@/lib/sitemap-xml";

export const prerender = false;

export const GET: APIRoute = async () => new Response(renderUrlset(await buildThreads()), { headers: XML_HEADERS });
