/**
 * 新站中间件（只对进入 Worker 的请求生效；命中静态资源的请求由资源层直接返回，不经过这里）：
 *
 * 1. 语言前缀：`/` 与没有合法语言前缀的页面路径 307 到协商出的语言（口径同老站 next-intl middleware，
 *    见 scripts/lib/locale-redirect.mjs）。
 * 2. 边缘缓存口径：给按需渲染的响应套老站同一份 page-cache-policy（s-maxage、Vary、带会话绕过缓存……）。
 *    迁移期请求先经老站路由器、那边也会套一次，同一函数重复套结果不变；域名直接挂到新站后由这里独自负责。
 */
import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

import { localeRedirectTarget, needsLocalePrefix } from "../../../scripts/lib/locale-redirect.mjs";
import { applyPageCachePolicy } from "../../../scripts/lib/page-cache-policy.mjs";

export const onRequest = defineMiddleware(async (ctx, next) => {
  // 构建期预渲染也会经过中间件：那时没有真实请求，什么都不做
  if (ctx.isPrerendered) return next();

  const { request, url } = ctx;
  if (needsLocalePrefix(url.pathname)) {
    const target = localeRedirectTarget(url, request.headers.get("cookie"), request.headers.get("accept-language"));
    // 结果取决于 cookie 与 Accept-Language，不能进共享缓存
    return new Response(null, { status: 307, headers: { Location: target, "Cache-Control": "private, no-store" } });
  }
  return applyPageCachePolicy(request, await next(), env);
});
