/**
 * Go 后端(Railway)的服务端调用助手:/api/suggest 与 /search 页优先查它拿实时数据,
 * 未配置或不可用时返回 null,调用方各自回落构建期静态数据(plugins-real.ts)。
 * 浏览器端的直连逻辑在 search-box.tsx,不走这里。
 *
 * 仅供服务端代码 import——别引进 client component,那会把 fetch 基址烤错地方。
 */
import type { Suggestion } from "@/lib/suggest";
import type { Thread, ThreadPage } from "@/lib/forum";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
// 仅由 Vercel server runtime 读取，绝不使用 NEXT_PUBLIC_ 前缀。设置后让
// 服务器端搜索使用 Turso 中持久化的专属 API-key 配额，而不会把大量用户
// 汇聚到 Vercel 出口 IP 的匿名限额。
const BACKEND_API_KEY = process.env.BACKEND_API_KEY ?? "";

function backendHeaders(userAgent: string): Record<string, string> {
  const headers: Record<string, string> = { "User-Agent": userAgent };
  if (BACKEND_API_KEY) headers["X-Api-Key"] = BACKEND_API_KEY;
  return headers;
}

/** Go 端 /v1/plugins 响应(snake_case),只声明这里用到的字段。 */
interface BackendPlugin {
  full_name: string;
  name: string;
  url: string;
  description: string;
  language: string;
}

/** /search 页每条结果要渲染的字段;RealPlugin 结构上是它的超集,兜底时可直接塞。 */
export interface SearchHit {
  fullName: string;
  name: string;
  url: string;
  description: string;
  language: string;
}

/** null = 未配置 API_BASE / server-only key 或 Go 不可用;q 应已 trim + 截断 + lower。 */
export async function suggestFromBackend(q: string): Promise<Suggestion[] | null> {
  if (!API_BASE || !BACKEND_API_KEY) return null;
  try {
    const res = await fetch(`${API_BASE}/v1/suggest?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
      // 这是浏览器直连失败后的二级路径,宁可快速放弃回静态数据,别拖住响应
      signal: AbortSignal.timeout(1500),
      // 自定义 UA:Go 审计里把 Vercel 服务端代理流量和真实用户区分开
      headers: backendHeaders("dshfind-next/suggest-fallback"),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Suggestion[] };
    return data.items ?? [];
  } catch {
    return null;
  }
}

/** BBS 在页面缓存未命中时取实时数据，不再写入 Next 持久 fetch 缓存。 */
async function forumGET<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: backendHeaders("dshfind-next/bbs"),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** null = 后端不可用；调用方渲染空壳，浏览器侧会再拉一次。 */
export function threadPageFromBackend(
  params: { board?: string; locale?: string; page?: number; perPage?: number }
): Promise<ThreadPage | null> {
  const query = new URLSearchParams();
  if (params.board) query.set("board", params.board);
  if (params.locale) query.set("locale", params.locale);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.perPage) query.set("per_page", String(params.perPage));
  return forumGET<ThreadPage>(`/v1/forum/threads?${query}`);
}

/**
 * null = 帖子确实不存在（调用方 notFound()）；后端不可用则抛错。
 *
 * 后端抖动不能伪装成 404；错误响应不进入边缘缓存，下次请求可重试。
 */
export async function threadFromBackend(
  slug: string
): Promise<Thread | null> {
  // 本地开发没配后端时不抛错，直接当作没有这个帖子。
  if (!API_BASE) return null;
  const res = await fetch(
    `${API_BASE}/v1/forum/threads/${encodeURIComponent(slug)}`,
    { cache: "no-store", headers: backendHeaders("dshfind-next/bbs") }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`forum thread ${slug}: HTTP ${res.status}`);
  }
  return (await res.json()) as Thread;
}

export async function searchFromBackend(
  q: string,
  limit: number
): Promise<{ total: number; hits: SearchHit[] } | null> {
  if (!API_BASE || !BACKEND_API_KEY) return null;
  try {
    const res = await fetch(
      `${API_BASE}/v1/plugins?q=${encodeURIComponent(q)}&per_page=${limit}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
        headers: backendHeaders("dshfind-next/search"),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { total?: number; data?: BackendPlugin[] };
    return {
      total: data.total ?? 0,
      hits: (data.data ?? []).map((p) => ({
        fullName: p.full_name,
        name: p.name,
        url: p.url,
        description: p.description,
        language: p.language,
      })),
    };
  } catch {
    return null;
  }
}
