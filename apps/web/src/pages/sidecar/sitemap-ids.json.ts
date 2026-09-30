/** 构建期写出 sitemap 分片清单（插件分片数随收录量变化），供按需渲染的 /sitemap.xml 读取。 */
import type { APIRoute } from "astro";

import { shardIds } from "@/lib/sitemap-shards";

export const GET: APIRoute = () => Response.json(shardIds());
