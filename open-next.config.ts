import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Build-only pages live in versioned, read-only Static Assets. Database-backed
// routes use revalidate=0; custom-worker.mjs owns public HTTP response caching.
// There is no ISR queue, persistent fetch cache, or R2 binding in this design.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
