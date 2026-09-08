import handler from "./.open-next/worker.js";
import { applyPageCachePolicy, cacheTtl } from "./scripts/lib/page-cache-policy.mjs";

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
    const start = Date.now();
    let response = await handler.fetch(request, env, ctx);
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
