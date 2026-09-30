/**
 * 前端重写迁移期的路由器（docs/frontend-rewrite-plan.md）：老站 custom-worker.mjs 按路径
 * 把已迁移的路由经 service binding 交给新 Astro Worker（dshfind-web），其余照旧走 OpenNext。
 *
 * 回滚：从下面两个清单删掉对应条目，重新部署老站即可。
 * 上线顺序：新站先发布（含这些页面），再推这里——反过来会有几分钟被转给还没有该页的新站（404 不回落）。
 */

/** 已迁移的页面前缀（语言段之后）：自身及其所有子路径。每接管一段在这里加一行。 */
export const MIGRATED_PAGE_PREFIXES = [
  '/learn',
  // 插件聚合页（分类/标签/语言/全量索引）。这四个段是 RESERVED_PLUGIN_SEGMENTS，
  // 不会与 /plugins/<owner>/<repo> 详情页冲突
  '/plugins/c',
  '/plugins/t',
  '/plugins/lang',
  '/plugins/all',
  '/plugins/browse',
  // 文档中心（首页预渲染；文档页按需渲染读 D1）
  '/docs',
  // 论坛：列表与帖子页按需渲染（服务端取公开 API），发帖页静态外壳
  '/bbs',
];

/**
 * 已迁移的单页（语言段之后，精确匹配）。前缀匹配会误吞子路径的页面放这里，如 /plugins 下还有详情页。
 * '' 是语言首页（/zh、/en……）。
 */
export const MIGRATED_EXACT_PAGES = ['', '/plugins', '/search', '/login'];

/**
 * 已迁移的路径模式（语言段之后）。插件详情页 /plugins/<owner>/<repo>：恰好两段，
 * 保留段（c/t/lang/all）同形的聚合页上面已按前缀迁走，两边落到同一个新站，匹配顺序无关。
 */
export const MIGRATED_PATTERNS = [/^\/plugins\/[^/]+\/[^/]+$/];

/**
 * 已迁移的无语言前缀路径：接口与 sitemap。响应仍走老站缓存口径（page-cache-policy 已为它们各写了规则）。
 * /api/auth/me、/api/internal/db 依赖老站 Worker 的密钥（AUTH_SECRET / D1_INTERNAL_TOKEN），第 7 阶段再迁。
 */
export const MIGRATED_ROOT_EXACT = ['/sitemap.xml', '/api/suggest', '/api/plugins-data'];
export const MIGRATED_ROOT_PREFIXES = ['/sitemap/', '/api/badge/', '/api/card/', '/api/readme-img/'];

const LOCALE = /^\/(?:zh|en|ja|ko)(\/.*)?$/;

/**
 * @returns {'page' | 'asset' | null}
 *   page：新站页面，响应仍走老站的页面缓存口径；
 *   asset：新站的带 hash 静态资源（/_astro/*），原样透传其 immutable 缓存头；
 *   null：不归新站管。
 */
export function rewriteTarget(pathname) {
  if (pathname.startsWith('/_astro/')) return 'asset';
  if (MIGRATED_ROOT_EXACT.includes(pathname) || MIGRATED_ROOT_PREFIXES.some(p => pathname.startsWith(p))) return 'page';
  const m = LOCALE.exec(pathname);
  if (!m) return null;
  const rest = m[1] ?? ''; // /zh 本身 → ''（语言首页）
  if (MIGRATED_EXACT_PAGES.includes(rest)) return 'page';
  if (MIGRATED_PATTERNS.some(re => re.test(rest))) return 'page';
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
