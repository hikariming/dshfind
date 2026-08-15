import { NextRequest, NextResponse } from "next/server";

import { realPlugins } from "@/lib/plugins-real";
import {
  MAX_QUERY_LENGTH,
  MAX_SUGGESTIONS,
  MIN_QUERY_LENGTH,
  type Suggestion,
} from "@/lib/suggest";

/**
 * GET /api/suggest?q= —— 搜索框的插件下拉建议。
 *
 * 放在服务端的唯一原因是体积：插件数据有 1203 条（约 580KB），
 * 之前搜索框作为 client component 直接 import，把整份数据打进了每个页面的
 * 客户端 bundle（553KB / gzip 133KB）。这里只回传最多 10 条结果。
 */

interface Entry {
  id: string;
  label: string;
  sub: string;
  href: string;
  stars: number;
  featured: boolean;
  /** 预先拼好并小写的检索串。 */
  hay: string;
}

// 索引按 lambda 实例算一次并缓存。Fluid Compute 会复用实例，
// 所以热实例上每个请求只剩一次 includes 扫描。
let pluginEntries: Entry[] | null = null;

function getPluginEntries(): Entry[] {
  pluginEntries ??= realPlugins.map((p) => ({
    id: p.fullName,
    label: p.name,
    sub: p.description || `@${p.owner}`,
    // 站内详情页，不是 p.url——直接甩去 GitHub 等于把人送出站
    href: `/plugins/${p.fullName}`,
    stars: p.stars,
    featured: p.isFeatured,
    hay: `${p.fullName} ${p.description} ${p.tags.join(" ")}`.toLowerCase(),
  }));
  return pluginEntries;
}

/**
 * 命中 limit 条就停，不再扫剩下的表。
 * realPlugins 的行序本身就是 featured 优先、star 降序，所以先命中的天然是更该露出的。
 */
function take(entries: Entry[], q: string, limit: number): Suggestion[] {
  const out: Suggestion[] = [];
  for (let i = 0; i < entries.length && out.length < limit; i++) {
    const e = entries[i];
    if (e.hay.includes(q)) {
      out.push({
        type: "plugin",
        id: e.id,
        label: e.label,
        sub: e.sub,
        href: e.href,
        stars: e.stars,
        featured: e.featured,
      });
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("q") ?? "")
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .toLowerCase();

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { items: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const items = take(getPluginEntries(), q, MAX_SUGGESTIONS);

  return NextResponse.json(
    { items },
    {
      // 数据每天同步一次、且每次部署都会刷掉 CDN 缓存，放心缓存长一点。
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
