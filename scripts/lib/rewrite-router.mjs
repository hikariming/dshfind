/**
 * 前端重写迁移期的路由器（docs/frontend-rewrite-plan.md）：老站 custom-worker.mjs 按路径前缀
 * 把已迁移的路由经 service binding 交给新 Astro Worker（dshfind-web），其余照旧走 OpenNext。
 *
 * 回滚：从 MIGRATED_PAGE_PREFIXES 删掉对应前缀，重新部署老站即可。
 */

/** 已迁移的页面前缀（语言段之后）。每接管一段在这里加一行。 */
export const MIGRATED_PAGE_PREFIXES = ['/learn'];

const LOCALE = /^\/(?:zh|en|ja|ko)(\/.*)?$/;

/**
 * @returns {'page' | 'asset' | null}
 *   page：新站页面，响应仍走老站的页面缓存口径；
 *   asset：新站的带 hash 静态资源（/_astro/*），原样透传其 immutable 缓存头；
 *   null：不归新站管。
 */
export function rewriteTarget(pathname) {
  if (pathname.startsWith('/_astro/')) return 'asset';
  const rest = LOCALE.exec(pathname)?.[1];
  if (rest === undefined) return null;
  return MIGRATED_PAGE_PREFIXES.some(p => rest === p || rest.startsWith(`${p}/`)) ? 'page' : null;
}

/**
 * 新站在 workers.dev 上整站 X-Robots-Tag: noindex（防止预览域被收录）。
 * 经正式域名转发时必须摘掉——否则被接管的页面在 dshfind.com 上也会被判为不收录。
 * 页面级的 noindex（缺译文的课时）写在 <meta name="robots">，不受影响。
 */
export function stripPreviewHeaders(response) {
  if (!response.headers.has('x-robots-tag')) return response;
  const headers = new Headers(response.headers);
  headers.delete('x-robots-tag');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
