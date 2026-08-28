/**
 * 全局限流计数器（Durable Object）。单独成文件是因为 `cloudflare:workers`
 * 只在 workerd 里可导入——纯数学留在 ratelimit.mjs 供 Node 单测。
 * 单实例（idFromName("global")），DO 的串行执行模型就是 Go 那把互斥锁；
 * 桶状态放内存不落 storage：额度是热路径计数器不是业务数据，驱逐重算即可。
 */
import { DurableObject } from "cloudflare:workers";
import { allowOnBuckets } from "./ratelimit.mjs";

export class RateLimiter extends DurableObject {
  buckets = new Map();

  allow(buckets) {
    return allowOnBuckets(this.buckets, buckets, Date.now());
  }
}
