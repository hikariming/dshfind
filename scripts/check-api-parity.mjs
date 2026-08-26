/**
 * API 边缘 Worker 与线上 Go 的逐字节比对（docs/d1-migration-plan.md P4 验收）。
 *
 * 前提：两侧数据代次一致（gen-api-artifacts 刚跑过、期间 Go 没刷新快照）——
 * data_version 不等时直接报错退出，先重新生成产物再比。
 *
 * 用法：node scripts/check-api-parity.mjs [worker地址]
 *   worker地址默认 http://localhost:8790（wrangler dev）；
 *   切流后可传 https://api.dshfind.com 对生产复检（此时比对对象换成 Railway 直连地址）。
 */
const WORKER = process.argv[2] ?? "http://localhost:8790";
const LIVE = "https://api.dshfind.com";
const DESKTOP_UA = "dsh-community-market/0.1";

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
];

/** Go compress.go 对压缩表示的 ETag 加 -gzip/-br 后缀；identity 表示两边相同，视为等价。 */
const normEtag = (etag) => etag?.replace(/-(gzip|br)"$/, '"') ?? null;

async function get(base, path, ua) {
  const headers = ua ? { "User-Agent": ua } : {};
  const res = await fetch(base + path, { headers });
  return {
    status: res.status,
    etag: normEtag(res.headers.get("etag")),
    body: Buffer.from(await res.arrayBuffer()),
    res,
  };
}

let bad = 0;
for (const [path, ua, note] of CASES) {
  const [w, l] = await Promise.all([get(WORKER, path, ua), get(LIVE, path, ua)]);
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

if (bad > 0) {
  console.error(`\n${bad} 项不一致`);
  process.exit(1);
}
console.log("\n全部一致");
