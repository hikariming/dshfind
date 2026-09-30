/**
 * GET /api/suggest?q= —— 搜索框下拉建议的降级路径（浏览器正常直连 API 服务的 /v1/suggest）。
 * 这里先转发同一个公开接口；它也不可用时扫构建期静态 /api/plugins-data 兜底（按 isolate 缓存），
 * 所以这条路永远有结果。与老站同口径：行序 featured 优先、star 降序，命中 MAX_SUGGESTIONS 条就停。
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { MAX_QUERY_LENGTH, MAX_SUGGESTIONS, MIN_QUERY_LENGTH, type Suggestion } from "@/lib/suggest";
import type { PluginWithGrowth } from "@/lib/types";
import { API_BASE } from "~/config";

export const prerender = false;

type Entry = Suggestion & { hay: string };
let entries: Promise<Entry[]> | null = null;

function staticEntries(base: URL): Promise<Entry[]> {
  entries ??= (env as unknown as { ASSETS: { fetch(u: URL): Promise<Response> } }).ASSETS.fetch(new URL("/api/plugins-data", base))
    .then((r) => r.json() as Promise<{ plugins: PluginWithGrowth[] }>)
    .then(({ plugins }) =>
      plugins.map((p) => ({
        type: "plugin" as const,
        id: p.fullName,
        label: p.name,
        sub: p.description || `@${p.owner}`,
        // 站内详情页，不是 GitHub
        href: `/plugins/${p.fullName}`,
        stars: p.stars,
        featured: p.isFeatured,
        hay: `${p.fullName} ${p.description} ${p.tags.join(" ")}`.toLowerCase(),
      })),
    );
  return entries;
}

async function fromApi(q: string): Promise<Suggestion[] | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/suggest?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    return ((await res.json()) as { items?: Suggestion[] }).items ?? [];
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH).toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) {
    return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }
  let items = await fromApi(q);
  if (items === null) {
    items = [];
    for (const { hay, ...s } of await staticEntries(url)) {
      if (!hay.includes(q)) continue;
      items.push(s);
      if (items.length >= MAX_SUGGESTIONS) break;
    }
  }
  // 数据每天同步一次，放心缓存长一点
  return Response.json({ items }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
};
