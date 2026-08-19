import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * OpenNext 的 Cloudflare Workers 适配配置。
 *
 * incrementalCache：ISR 产物存 R2（绑定 NEXT_INC_CACHE_R2_BUCKET）。
 *   /plugins 1800s、插件详情页 86400s、/api/plugins-data 1800s 都靠它，
 *   否则每次重验证都要重新查 Turso 并重渲染。
 * queue：重验证去重。过期路径只放一个请求回源重建，其余先吃 stale。
 *
 * 没配 tagCache 是有意的——全站只用时间型 revalidate，
 * 没有任何 revalidateTag/revalidatePath 调用，装了纯属多一套 D1/DO 要维护。
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
});
