/**
 * 语言前缀重定向（老站 next-intl middleware 的等价口径，Astro 新站的 src/middleware.ts 使用）：
 *   - `/` 与没有合法语言前缀的页面路径 → 307 到 `/{语言}{原路径}`；
 *   - 语言按 NEXT_LOCALE cookie → Accept-Language → 默认中文 依次决定；
 *   - 接口、静态资源、sitemap、robots.txt 等不参与（老站 middleware matcher 同样排除它们）。
 */

export const LOCALES = ['zh', 'en', 'ja', 'ko'];
export const DEFAULT_LOCALE = 'zh';

const PREFIXED = /^\/(?:zh|en|ja|ko)(?:\/|$)/;
// 与老站 middleware 的 matcher 排除项对齐，外加新站自己的 /_astro 与构建期旁车
const EXCLUDED = /^\/(?:api|_astro|_next|sidecar|sitemap)(?:\/|$)|^\/(?:robots\.txt|sitemap\.xml|favicon\.ico)$|\.[a-z0-9]+$/i;

/** 这个路径要不要补语言前缀 */
export function needsLocalePrefix(pathname) {
  return !PREFIXED.test(pathname) && !EXCLUDED.test(pathname);
}

/** NEXT_LOCALE cookie 优先；否则按 Accept-Language 的 q 值找第一个支持的语言；都没有用默认 */
export function negotiateLocale(cookieHeader, acceptLanguage) {
  const fromCookie = /(?:^|;\s*)NEXT_LOCALE=([^;]+)/.exec(cookieHeader ?? '')?.[1];
  if (fromCookie && LOCALES.includes(fromCookie)) return fromCookie;

  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
      return { lang: tag.split('-')[0], q: Number.isFinite(q) ? q : 0, i };
    })
    .filter((x) => x.lang && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return ranked.find((x) => LOCALES.includes(x.lang))?.lang ?? DEFAULT_LOCALE;
}

/** 重定向目标：保留查询串；`/` 落到语言首页 `/zh`（不带尾斜杠，与老站一致） */
export function localeRedirectTarget(url, cookieHeader, acceptLanguage) {
  const locale = negotiateLocale(cookieHeader, acceptLanguage);
  const path = url.pathname === '/' ? '' : url.pathname;
  return `/${locale}${path}${url.search}`;
}
