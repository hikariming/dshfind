import handler from "./.open-next/worker.js";
import { applyPageCachePolicy, cacheTtl } from "./scripts/lib/page-cache-policy.mjs";
import { withD1Metrics } from "./scripts/lib/d1-observer.mjs";
import { rewriteTarget, stripPreviewHeaders } from "./scripts/lib/rewrite-router.mjs";

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    // The isolated pilot exposes only the selected pages and their static assets.
    if (env.NATIVE_PAGE_CACHE_PHASE === "canary" &&
        !cacheTtl(path, "canary") && !path.startsWith("/_next/") &&
        !/\.(?:svg|png|jpg|ico|woff2?)$/.test(path)) {
      return new Response("Not found", {
        status: 404, headers: { "Cache-Control": "private, no-store" },
      });
    }
    // 前端重写迁移期：已迁移的路由交给新 Astro Worker（绑定缺失时——canary/预览 Worker——照旧走 Next）
    const target = env.WEB ? rewriteTarget(path) : null;
    // 静态资源原样透传（保留 immutable 缓存头），只摘掉预览域的 noindex——否则图片进不了图片搜索
    if (target === "asset") return stripPreviewHeaders(await env.WEB.fetch(request));
    if (target === "page") {
      const upstream = await env.WEB.fetch(request).catch(() => null);
      if (upstream && upstream.status < 500) {
        return applyPageCachePolicy(request, stripPreviewHeaders(upstream), env);
      }
      // 新站异常时回落到下面的 Next 渲染：迁移期老站仍保留这些路由，最坏情况是用户看到老页面
    }

    const start = Date.now();
    let response = await withD1Metrics(request, env, observedEnv => handler.fetch(request, observedEnv, ctx));
    if (env.NATIVE_CACHE_DIAGNOSTICS === "1") {
      // Pilot only: finish the body before timing; this is wall time, NOT CPU.
      response = new Response(response.body === null ? null : await response.arrayBuffer(), response);
      response.headers.set("x-dshfind-render-id", crypto.randomUUID());
      response.headers.set("x-dshfind-render-wall-ms", String(Date.now() - start));
      response.headers.set("x-robots-tag", "noindex");
      console.log(JSON.stringify({ event: "native-page-render", path,
        status: response.status, wallMs: Date.now() - start }));
    }
    return applyPageCachePolicy(request, response, env);
  },
};

// Retain the deployed class during the migration/rollback observation window.
export { DOQueueHandler } from "./.open-next/worker.js";
