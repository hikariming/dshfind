/**
 * API 服务地址（与老站 NEXT_PUBLIC_API_BASE_URL 同值）：搜索建议直连、登录/登出端点都在这里。
 * 公开值，本来就会进浏览器包。
 */
export const API_BASE = "https://api.dshfind.com";

/** 拼 API 端点并带上回跳地址（老站 src/lib/auth-api.ts 同口径） */
export function apiURL(path: string, returnTo: string): string {
  const url = new URL(path, API_BASE);
  url.searchParams.set("return_to", returnTo);
  return url.toString();
}
