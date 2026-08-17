/**
 * 身份认证端点由 Go API 托管。它读取公开 API Base URL，是为了让登录跳转可在
 * server/client component 中共用；OAuth secret 永不进入 Vercel 或浏览器 bundle。
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

function apiURL(path: string, returnTo: string): string | null {
  if (!API_BASE) return null;
  try {
    const url = new URL(path, API_BASE);
    url.searchParams.set("return_to", returnTo);
    return url.toString();
  } catch {
    return null;
  }
}

export function githubLoginURL(returnTo: string): string | null {
  return apiURL("/auth/github", returnTo);
}

export function logoutURL(returnTo: string): string | null {
  return apiURL("/auth/logout", returnTo);
}
