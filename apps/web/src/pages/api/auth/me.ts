/**
 * GET /api/auth/me —— 顶栏 / 讨论区读取当前会话。
 *
 * 会话 JWT 由 api-edge（api.dshfind.com）签发、Domain=dshfind.com，它自己就有 GET /auth/me。
 * 这里只把 Cookie 原样转过去：签名密钥 AUTH_SECRET 只留在 api-edge 一处，新站不必再存一份。
 * 服务端请求不带 Origin，api-edge 对 /auth/me 按「非浏览器只读」放行。
 */
import type { APIRoute } from "astro";

import { API_BASE } from "~/config";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  let user: unknown = null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) user = ((await res.json()) as { user?: unknown }).user ?? null;
  } catch {
    // api-edge 不可用时按未登录处理（与老站会话校验失败时的行为一致）
  }
  // 个人数据：绝不进任何缓存
  return Response.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
};
