/**
 * 限流，复刻 server/internal/ratelimit 的令牌桶语义。
 *
 * 后端选择（原方案是 Upstash REST，2026-08-28 改为全 CF）：
 *   1. 首选 Durable Object（RATE_LIMITER binding）：单实例串行执行，桶状态
 *      天然全局一致，比 Upstash 的等价固定窗口还忠实于 Go 的令牌桶。写路径
 *      每天几十次调用，DO 往返成本可以忽略。
 *   2. DO 故障/未绑定时降级 isolate 内存桶——与 Go「未配 Redis 用进程内桶」
 *      同语义，isolate 回收清零对应 Go 的「重启只清易失状态」。
 *
 * 桶状态存 DO 内存而非 storage：额度是热路径计数器不是业务数据（Go 的注释
 * 原话），DO 被驱逐重算即可，不值得每请求付一次持久化。
 */
const MAX_BUCKETS = 65_536;

/**
 * 纯函数版令牌桶（ratelimit.go Allow 的直译）：先全部检查再全部扣，
 * 避免部分扣费。states 是 Map<key, {tokens, updatedAt, pinned}>，原地更新。
 */
export function allowOnBuckets(states, buckets, now) {
  const picked = [];
  let retryAfterMs = 0;
  for (const bucket of buckets) {
    const cost = bucket.cost || 1;
    if (!bucket.key || bucket.perMinute <= 0 || bucket.burst <= 0 || cost > bucket.burst) {
      return { allowed: false, retryAfterSec: 1 };
    }
    let st = states.get(bucket.key);
    if (!st) {
      if (states.size >= MAX_BUCKETS) {
        // 满了先清最旧的非 pinned 键；攻击者造的 IP 键不许挤掉全局桶
        for (const [k, v] of states) {
          if (!v.pinned) {
            states.delete(k);
            break;
          }
        }
      }
      st = { tokens: bucket.burst, updatedAt: now, pinned: Boolean(bucket.pinned) };
      states.set(bucket.key, st);
    }
    const accrued = ((now - st.updatedAt) / 60000) * bucket.perMinute;
    st.tokens = Math.min(bucket.burst, st.tokens + accrued);
    st.updatedAt = now;
    if (st.tokens < cost) {
      const needMs = ((cost - st.tokens) / bucket.perMinute) * 60000;
      retryAfterMs = Math.max(retryAfterMs, needMs);
    }
    picked.push({ st, cost });
  }
  if (retryAfterMs > 0) return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  for (const { st, cost } of picked) st.tokens -= cost;
  return { allowed: true, retryAfterSec: 0 };
}

/** isolate 内的降级桶。 */
const localBuckets = new Map();

/**
 * 统一入口。buckets: [{key, perMinute, burst, cost?, pinned?}]。
 * DO 优先（全局一致），失败降级本地桶（fail-open 到较松的一侧，
 * 与 Go 的 Redis fail-open 语义一致——限流组件自己绝不能成为可用性瓶颈）。
 */
export async function rateAllow(env, buckets) {
  if (env.RATE_LIMITER) {
    try {
      const stub = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName("global"));
      return await stub.allow(buckets);
    } catch {
      /* DO 故障 → 本地桶 */
    }
  }
  return allowOnBuckets(localBuckets, buckets, Date.now());
}

/** 复刻 rateLimitIPKey：IP 先 sha256 再进限流器，原始 IP 不出请求处理器。 */
export async function hashedIPKey(request) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const sum = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(sum), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 限流参数。与 Go config.go 的默认一致；可用 wrangler vars 覆盖。 */
export function rateConfig(env) {
  const n = (name, def) => {
    const v = Number(env[name]);
    return Number.isFinite(v) && v > 0 ? v : def;
  };
  return {
    anonPerMin: n("ANON_RATE_PER_MIN", 30),
    anonBurst: n("ANON_RATE_BURST", 10),
    authPerMin: n("AUTH_RATE_PER_MIN", 60),
    authBurst: n("AUTH_RATE_BURST", 20),
    authGlobalPerMin: n("AUTH_GLOBAL_RATE_PER_MIN", 1800),
    authGlobalBurst: n("AUTH_GLOBAL_RATE_BURST", 100),
    commentPerHour: n("FORUM_COMMENT_RATE_PER_HOUR", 5),
    commentBurst: n("FORUM_COMMENT_BURST", 3),
    votePerHour: n("FORUM_VOTE_RATE_PER_HOUR", 30),
    voteBurst: n("FORUM_VOTE_BURST", 10),
    threadPerHour: n("FORUM_THREAD_RATE_PER_HOUR", 5),
    threadBurst: n("FORUM_THREAD_BURST", 2),
  };
}
