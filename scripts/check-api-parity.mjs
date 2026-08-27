/**
 * API 边缘 Worker 与线上 Go 的逐字节比对（docs/d1-migration-plan.md P4 验收）。
 *
 * 前提：两侧数据代次一致（gen-api-artifacts 刚跑过、期间 Go 没刷新快照）——
 * data_version 不等时直接报错退出，先重新生成产物再比。
 *
 * 用法：node scripts/check-api-parity.mjs [worker地址] [Go地址]
 *   worker地址默认 http://localhost:8790（wrangler dev）；
 *   切流后可传 https://api.dshfind.com 对生产复检。
 *
 * ⚠️ 已切流的路径在 api.dshfind.com 上是 Worker 自己在服务，拿它当对照组等于
 * 自己比自己。脚本按响应有没有 x-railway-request-id 判断对照组到底是不是 Go，
 * 不是就跳过并提示——想真正复检这些路径，第二个参数传 Railway 直连域名
 * （*.up.railway.app）。
 */
const WORKER = process.argv[2] ?? "http://localhost:8790";
const LIVE = process.argv[3] ?? "https://api.dshfind.com";
const DESKTOP_UA = "dsh-community-market/0.1";
/** Go 匿名限流 30 次/分（ANON_RATE_PER_MIN），对照组请求必须放慢，否则吃 429。 */
const LIVE_INTERVAL_MS = 2100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CASES = [
  // [路径, UA 或 null, 备注]
  ["/v1/plugins?page=1&per_page=100", null, "完整目录 第1页（线上最高频请求）"],
  ["/v1/plugins?page=2&per_page=100", null, "完整目录 第2页"],
  ["/v1/plugins?page=114&per_page=100", null, "完整目录 末页"],
  ["/v1/plugins?page=9999&per_page=100", null, "越界页（应空 data）"],
  ["/v1/plugins", null, "默认分页 per_page=20"],
  ["/v1/plugins?page=0&per_page=abc", null, "非法参数回退默认"],
  ["/v1/plugins?page=1&per_page=100", DESKTOP_UA, "桌面首屏 第1页"],
  ["/v1/plugins?page=2&per_page=100", DESKTOP_UA, "桌面首屏 第2页"],
  ["/v1/plugins?page=3&per_page=100", DESKTOP_UA, "桌面越界页"],
  ["/v1/plugins?page=1&per_page=100&data_version=sha256%3Abogus", null, "版本不符应 409"],
  ["/v1/plugins?page=1&per_page=100&data_version=sha256%3Abogus", DESKTOP_UA, "桌面 409"],

  // ── /market/*：桌面端市场契约（server/internal/httpapi/market.go）──────────
  ["/market/manifest.json", null, "market manifest"],
  ["/market/v1/plugins", DESKTOP_UA, "market 默认 limit=50"],
  ["/market/v1/plugins?limit=100", DESKTOP_UA, "market limit=100（线上最高频）"],
  ["/market/v1/plugins?limit=1", null, "market limit 下界"],
  ["/market/v1/plugins?limit=0", null, "market limit=0 → clamp 到 1"],
  ["/market/v1/plugins?limit=999", null, "market limit 上界 → clamp 到 100"],
  ["/market/v1/plugins?limit=abc", null, "market 非法 limit 回退默认"],
  ["/market/v1/plugins?cursor=!!!", null, "market 坏游标应 400"],
  ["/market/v1/plugins?cursor=c2hhMjU2OmRlYWRiZWVmOjA", null, "market 旧版本游标应 409"],
  ["/market/v1/plugins?category=ui&limit=100", DESKTOP_UA, "market category 过滤"],
  ["/market/v1/plugins?category=memory&limit=50", null, "market category 过滤（另一类）"],
  ["/market/v1/plugins?category=nope", null, "market 不存在的 category → 空"],
  ["/market/v1/plugins?q=web&limit=50", DESKTOP_UA, "market 关键词过滤"],
  ["/market/v1/plugins?q=DSH-better-sidebar&limit=100", null, "market 关键词大小写不敏感"],
  ["/market/v1/plugins?q=%E6%8E%A8%E7%90%86&limit=50", null, "market 中文关键词"],
  ["/market/v1/plugins?q=%20%20web%20%20&limit=50", null, "market 关键词两端空白应被 trim"],
  ["/market/v1/plugins?category=ui&q=dsh&limit=10", null, "market category + q 组合"],
  ["/market/v1/plugins?sort=stars&unknown=1&limit=2", null, "market 未知参数应被忽略（不是报错）"],
  ["/market/v1/plugins?q=zzzzzznotfound", null, "market 关键词无命中 → 空 items"],

  // ── /v1/suggest（server/internal/httpapi/suggest.go）────────────────────────
  ["/v1/suggest?q=dsh", null, "suggest 常规"],
  ["/v1/suggest?q=DSH", null, "suggest 大小写不敏感"],
  ["/v1/suggest?q=%20%20dsh%20%20", null, "suggest 两端空白应被 trim"],
  ["/v1/suggest?q=%E6%8F%92%E4%BB%B6", null, "suggest 中文"],
  ["/v1/suggest?q=python", null, "suggest 不该按 language 命中（hay 不含 language）"],
  ["/v1/suggest?q=web", null, "suggest 命中数应封顶 10"],
  ["/v1/suggest?q=d", null, "suggest q 不足 2 码点 → no-store 空集"],
  ["/v1/suggest?q=", null, "suggest q 为空"],
  ["/v1/suggest", null, "suggest 不传 q"],
  ["/v1/suggest?q=zzzzzznotfound", null, "suggest 无命中"],
  [`/v1/suggest?q=${"x".repeat(80)}`, null, "suggest 超长 q 截断到 64 码点"],

  // ── /v1/catalog（server/internal/httpapi/catalog.go）───────────────────────
  ["/v1/catalog", null, "catalog 整包"],
  ["/v1/catalog?data_version=sha256%3Abogus", null, "catalog 版本不符不 409，退回短缓存"],
];

/**
 * 两处噪音要抹平才能比：
 *   - Go compress.go 给压缩表示的 ETag 加 -gzip/-br 后缀
 *   - 橙云代理后 CF 重压缩时会把强 ETag 降级成 W/"..."（值本身不变）
 * 两者都只改表示不改内容，视为等价。
 */
const normEtag = (etag) =>
  etag?.replace(/-(gzip|br)"$/, '"').replace(/^W\//, "") ?? null;

/** 对照组是 Go 才有这个头；Worker 接管后的响应没有。 */
const servedByGo = (res) => res.headers.has("x-railway-request-id");

let liveGate = Promise.resolve();
/** 串行化并限速所有打向 Go 的请求，吃到 429 就按 Retry-After 等一轮再来。 */
function throttleLive(fn) {
  const run = liveGate.then(async () => {
    for (let attempt = 0; ; attempt++) {
      const res = await fn();
      if (res.status !== 429 || attempt >= 2) return res;
      const wait = Number(res.headers.get("retry-after") ?? 2) * 1000 + 500;
      console.log(`  （对照组 429，等 ${Math.round(wait / 1000)}s 重试）`);
      await sleep(wait);
    }
  });
  liveGate = run.then(() => sleep(LIVE_INTERVAL_MS), () => sleep(LIVE_INTERVAL_MS));
  return run;
}

async function get(base, path, ua) {
  const headers = ua ? { "User-Agent": ua } : {};
  const doFetch = () => fetch(base + path, { headers });
  const res = base === LIVE ? await throttleLive(doFetch) : await doFetch();
  return {
    status: res.status,
    etag: normEtag(res.headers.get("etag")),
    body: Buffer.from(await res.arrayBuffer()),
    res,
  };
}

let bad = 0;
let skipped = 0;
for (const [path, ua, note] of CASES) {
  const [w, l] = await Promise.all([get(WORKER, path, ua), get(LIVE, path, ua)]);
  if (!servedByGo(l.res)) {
    skipped++;
    console.log(`↷ ${note}：对照组已由 Worker 接管，跳过`);
    continue;
  }
  const statusOK = w.status === l.status;
  const bodyOK = w.body.equals(l.body);
  const etagOK = w.status !== 200 || w.etag === l.etag;
  if (statusOK && bodyOK && etagOK) {
    console.log(`✓ ${note}（${w.status}，${w.body.length}B）`);
  } else {
    bad++;
    console.error(`✗ ${note}: status ${w.status}/${l.status}, body ${bodyOK ? "同" : `异（${w.body.length}B vs ${l.body.length}B）`}, etag ${etagOK ? "同" : `异 ${w.etag} vs ${l.etag}`}`);
    if (!bodyOK && w.status === l.status) {
      // 找出第一个不同的字节位置，给一小段上下文
      const n = Math.min(w.body.length, l.body.length);
      for (let i = 0; i < n; i++) {
        if (w.body[i] !== l.body[i]) {
          console.error(`  首个差异 @${i}:`);
          console.error(`  worker: …${w.body.subarray(Math.max(0, i - 60), i + 60).toString()}…`);
          console.error(`  live:   …${l.body.subarray(Math.max(0, i - 60), i + 60).toString()}…`);
          break;
        }
      }
    }
  }
}

// 条件请求：拿 worker 的 ETag 回发 If-None-Match，应 304 且带 ETag/Cache-Control
{
  const first = await get(WORKER, "/v1/plugins?page=1&per_page=100", null);
  const res = await fetch(WORKER + "/v1/plugins?page=1&per_page=100", {
    headers: { "If-None-Match": first.etag },
  });
  const ok = res.status === 304 && res.headers.get("etag") === first.etag && !!res.headers.get("cache-control");
  if (ok) console.log("✓ If-None-Match → 304（含 ETag/Cache-Control）");
  else {
    bad++;
    console.error(`✗ 条件请求: status ${res.status}, etag ${res.headers.get("etag")}`);
  }
}

// 透传：带过滤参数的请求应与 Go 结果一致（本地开发经 PASSTHROUGH_ORIGIN 回源）
{
  const path = "/v1/plugins?category=memory&per_page=5";
  const [w, l] = await Promise.all([get(WORKER, path, null), get(LIVE, path, null)]);
  if (w.status === l.status && w.body.equals(l.body)) console.log(`✓ 过滤参数透传（${w.status}）`);
  else {
    bad++;
    console.error(`✗ 过滤参数透传: status ${w.status}/${l.status}, ${w.body.length}B vs ${l.body.length}B`);
  }
}

// market 游标翻页：游标由对照组现发，两侧代次相同才有效——顺带验证了游标编码一致。
{
  const seed = await get(LIVE, "/market/v1/plugins?limit=100", DESKTOP_UA);
  const first = JSON.parse(seed.body);
  const cases = [
    [`/market/v1/plugins?cursor=${encodeURIComponent(first.page.nextCursor)}&limit=100`, "market 游标第 2 页"],
    [`/market/v1/plugins?cursor=${encodeURIComponent(first.page.nextCursor)}&limit=7`, "market 游标换 limit"],
    // 游标偏移超过 total：Go 把 offset 夹到 total，返回空 items 且不再给 nextCursor。
    [`/market/v1/plugins?cursor=${encodeURIComponent(
      Buffer.from(`${first.revision}:999999`).toString("base64url"),
    )}&limit=10`, "market 游标越界"],
    // 过滤面 + 游标：偏移是**过滤后**列表里的下标，不是全表下标。
    [`/market/v1/plugins?category=ui&cursor=${encodeURIComponent(
      Buffer.from(`${first.revision}:100`).toString("base64url"),
    )}&limit=100`, "market category + 游标"],
  ];
  for (const [path, note] of cases) {
    const [w, l] = await Promise.all([get(WORKER, path, DESKTOP_UA), get(LIVE, path, DESKTOP_UA)]);
    if (!servedByGo(l.res)) {
      skipped++;
      console.log(`↷ ${note}：对照组已由 Worker 接管，跳过`);
      continue;
    }
    const ok = w.status === l.status && w.body.equals(l.body) && (w.status !== 200 || w.etag === l.etag);
    if (ok) console.log(`✓ ${note}（${w.status}，${w.body.length}B）`);
    else {
      bad++;
      console.error(`✗ ${note}: status ${w.status}/${l.status}, ${w.body.length}B vs ${l.body.length}B, etag ${w.etag} vs ${l.etag}`);
    }
  }
}

// market 条件请求：拿 worker 的 ETag 回发，应 304
{
  const path = "/market/v1/plugins?limit=100";
  const first = await get(WORKER, path, DESKTOP_UA);
  const res = await fetch(WORKER + path, {
    headers: { "User-Agent": DESKTOP_UA, "If-None-Match": first.etag },
  });
  if (res.status === 304 && res.headers.get("etag") === first.etag) {
    console.log("✓ market If-None-Match → 304");
  } else {
    bad++;
    console.error(`✗ market 条件请求: status ${res.status}, etag ${res.headers.get("etag")}`);
  }
}

// suggest 的短 query 分支走 writeJSON：Cache-Control 必须是 no-store 且无 ETag。
{
  const [w, l] = await Promise.all([get(WORKER, "/v1/suggest?q=d", null), get(LIVE, "/v1/suggest?q=d", null)]);
  if (!servedByGo(l.res)) {
    skipped++;
    console.log("↷ suggest 短 query 缓存头：对照组已由 Worker 接管，跳过");
  } else {
    const wc = w.res.headers.get("cache-control");
    const lc = l.res.headers.get("cache-control");
    const noEtag = !w.res.headers.get("etag") && !l.res.headers.get("etag");
    if (wc === lc && wc === "no-store" && noEtag) console.log("✓ suggest 短 query → no-store 且无 ETag");
    else {
      bad++;
      console.error(`✗ suggest 短 query 缓存头: worker ${wc}/etag ${w.res.headers.get("etag")} vs live ${lc}/etag ${l.res.headers.get("etag")}`);
    }
  }
}

// suggest 关键词横扫：hay 是生成期用 JS toLowerCase 拼的，Go 是运行时用
// strings.ToLower——大部分字符两者一致，但口径漂移只有拿真实词表扫才看得出来。
{
  const words = ["dsh", "web", "ui", "agent", "code", "插件", "工具", "sidebar", "memory",
    "tui", "mcp", "chat", "browser", "git", "test", "翻译", "图片", "语音", "market", "cli"];
  let swept = 0;
  for (const word of words) {
    const path = `/v1/suggest?q=${encodeURIComponent(word)}`;
    const [w, l] = await Promise.all([get(WORKER, path, null), get(LIVE, path, null)]);
    if (!servedByGo(l.res)) { skipped++; break; }
    if (w.body.equals(l.body)) swept++;
    else {
      bad++;
      console.error(`✗ suggest 横扫 "${word}": ${w.body.length}B vs ${l.body.length}B`);
    }
  }
  if (swept > 0) console.log(`✓ suggest 关键词横扫 ${swept}/${words.length} 词逐字节一致`);
}

// catalog 带**匹配**的 data_version 时换 immutable 缓存头（版本寻址）。
{
  const seed = await get(LIVE, "/v1/plugins?per_page=1", null);
  const version = JSON.parse(seed.body).data_version;
  const path = `/v1/catalog?data_version=${encodeURIComponent(version)}`;
  const [w, l] = await Promise.all([get(WORKER, path, null), get(LIVE, path, null)]);
  if (!servedByGo(l.res)) {
    skipped++;
    console.log("↷ catalog immutable 缓存头：对照组已由 Worker 接管，跳过");
  } else {
    const wc = w.res.headers.get("cache-control");
    const lc = l.res.headers.get("cache-control");
    const bodyOK = w.body.equals(l.body);
    if (wc === lc && (wc ?? "").includes("immutable") && bodyOK) {
      console.log(`✓ catalog 版本匹配 → immutable（${w.body.length}B）`);
    } else {
      bad++;
      console.error(`✗ catalog immutable: worker ${wc} vs live ${lc}, body ${bodyOK ? "同" : "异"}`);
    }
  }
}

// market 不按 UA 分流，Vary 里就不能有 User-Agent——有了会让下游缓存按 UA
// 分桶，白白降命中率。Accept-Encoding 不算数：那是压缩层加的（Go 是
// compress.go，Worker 侧是 CF 边缘），跟契约无关，比之前先摘掉。
{
  const [w, l] = await Promise.all([
    get(WORKER, "/market/v1/plugins?limit=2", null),
    get(LIVE, "/market/v1/plugins?limit=2", null),
  ]);
  const contractVary = (res) =>
    (res.headers.get("vary") ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s !== "" && s !== "accept-encoding")
      .sort()
      .join(",");
  const wv = contractVary(w.res);
  const lv = contractVary(l.res);
  if (!servedByGo(l.res)) {
    skipped++;
    console.log("↷ market Vary：对照组已由 Worker 接管，跳过");
  } else if (wv === lv) {
    console.log(`✓ market Vary 一致（契约维度：${wv === "" ? "无" : wv}）`);
  } else {
    bad++;
    console.error(`✗ market Vary: worker "${wv}" vs live "${lv}"`);
  }
}

if (skipped > 0) {
  console.log(
    `\n${skipped} 项跳过：这些路径在 ${LIVE} 上已经是 Worker 自己在服务，` +
      `拿它当对照组等于自己比自己。要复检就把 Railway 直连域名当第二个参数传进来。`,
  );
}
if (bad > 0) {
  console.error(`\n${bad} 项不一致`);
  process.exit(1);
}
console.log("\n全部一致");
