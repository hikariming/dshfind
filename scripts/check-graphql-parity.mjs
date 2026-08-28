#!/usr/bin/env node
/**
 * GraphQL 边缘实现与线上 Go 的逐字节比对（S2 验收）。
 *
 * 与 REST 的 check-api-parity 同思路：fixtures 里的 71 条用例只当**用例清单**，
 * 期望值不用录制时的旧响应（数据每天变），而是运行时同时打两边现比。
 * 前置条件：两侧数据代次一致——先比 dataset.dataVersion，不等就先
 * `node --env-file=.env.local scripts/gen-api-artifacts.mjs` 再等 Go 的
 * 10 分钟快照刷新对齐。
 *
 * 用法：node scripts/check-graphql-parity.mjs [worker地址] [Go地址]
 *   默认 http://localhost:8790 vs https://api.dshfind.com（/graphql 未切流时那就是 Go）
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKER = process.argv[2] ?? "http://localhost:8790";
const LIVE = process.argv[3] ?? "https://api.dshfind.com";
/** Go 侧有限流；串行 + 间隔，429 按 Retry-After 重试。 */
const LIVE_INTERVAL_MS = 1300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { fixtures } = JSON.parse(
  readFileSync(resolve(root, "workers/api-edge/fixtures/graphql.json"), "utf8"),
);

function buildRequest(base, spec) {
  const method = spec.method ?? "GET";
  let url = `${base}/graphql`;
  const init = { method, headers: {} };
  if (method === "GET") {
    if (spec.rawQS) url += `?${spec.rawQS}`;
    else {
      const qs = new URLSearchParams({ query: spec.query });
      if (spec.variables) qs.set("variables", JSON.stringify(spec.variables));
      if (spec.operationName) qs.set("operationName", spec.operationName);
      url += `?${qs}`;
    }
  } else {
    init.headers["Content-Type"] = "application/json";
    init.body =
      spec.raw ??
      JSON.stringify({
        query: spec.query,
        ...(spec.variables ? { variables: spec.variables } : {}),
        ...(spec.operationName ? { operationName: spec.operationName } : {}),
      });
  }
  return { url, init };
}

async function fire(base, spec, throttled) {
  const { url, init } = buildRequest(base, spec);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (throttled && res.status === 429 && attempt < 3) {
      const wait = Number(res.headers.get("retry-after") ?? 2) * 1000 + 500;
      await res.arrayBuffer();
      console.log(`  （对照组 429，等 ${Math.round(wait / 1000)}s）`);
      await sleep(wait);
      continue;
    }
    return {
      status: res.status,
      cacheControl: res.headers.get("cache-control"),
      contentType: res.headers.get("content-type"),
      etag: res.headers.get("etag")?.replace(/-(gzip|br)"$/, '"').replace(/^W\//, "") ?? null,
      vary: res.headers.get("vary"),
      body: Buffer.from(await res.arrayBuffer()),
    };
  }
}

// 0) 数据代次一致性闸
{
  const probe = { query: "{ dataset { dataVersion } }" };
  const [w, l] = [await fire(WORKER, probe, false), await fire(LIVE, probe, true)];
  const wv = JSON.parse(w.body).data?.dataset?.dataVersion;
  const lv = JSON.parse(l.body).data?.dataset?.dataVersion;
  if (!wv || wv !== lv) {
    console.error(`✗ 两侧数据代次不一致，比不了：\n  worker: ${wv}\n  live:   ${lv}`);
    console.error("  先重新生成产物，再等 Go 的 10 分钟快照刷新追平。");
    process.exit(1);
  }
  console.log(`数据代次一致：${wv.slice(0, 30)}…\n`);
}

let bad = 0;
for (const f of fixtures) {
  const [w, l] = [await fire(WORKER, f.request, false), await fire(LIVE, f.request, true)];
  await sleep(LIVE_INTERVAL_MS);
  const problems = [];
  if (w.status !== l.status) problems.push(`status ${w.status}/${l.status}`);
  if (!w.body.equals(l.body)) {
    problems.push(`body ${w.body.length}B vs ${l.body.length}B`);
  }
  if (w.cacheControl !== l.cacheControl) {
    problems.push(`cache-control "${w.cacheControl}" vs "${l.cacheControl}"`);
  }
  // 成功响应两边都要有 ETag 且值相等（压缩装饰已抹平）；错误响应都不该有
  if (w.etag !== l.etag) problems.push(`etag ${w.etag} vs ${l.etag}`);
  if (problems.length === 0) {
    console.log(`✓ ${f.name}（${w.status}，${w.body.length}B）`);
  } else {
    bad++;
    console.error(`✗ ${f.name}: ${problems.join(", ")}`);
    if (w.status === l.status && !w.body.equals(l.body)) {
      const n = Math.min(w.body.length, l.body.length);
      for (let i = 0; i < n; i++) {
        if (w.body[i] !== l.body[i]) {
          console.error(`  首个差异 @${i}:`);
          console.error(`  worker: …${w.body.subarray(Math.max(0, i - 70), i + 70).toString()}…`);
          console.error(`  live:   …${l.body.subarray(Math.max(0, i - 70), i + 70).toString()}…`);
          break;
        }
      }
      if (w.body.length !== l.body.length && w.body.subarray(0, n).equals(l.body.subarray(0, n))) {
        console.error(`  前 ${n}B 相同，长的一侧多出: …${(w.body.length > l.body.length ? w.body : l.body).subarray(n, n + 120).toString()}`);
      }
    }
  }
}

// 动态用例：游标由对照组现发，两边接力翻页要互通
{
  const listQ = { query: "{ plugins(first:5, sort:STARS, filter:{category:\"ui\"}) { totalCount nodes { fullName } pageInfo { hasNextPage endCursor } } }" };
  const seed = await fire(LIVE, listQ, true);
  await sleep(LIVE_INTERVAL_MS);
  const cursor = JSON.parse(seed.body).data.plugins.pageInfo.endCursor;
  const nextQ = { query: `{ plugins(first:5, sort:STARS, filter:{category:"ui"}, after:${JSON.stringify(cursor)}) { nodes { fullName } pageInfo { hasNextPage endCursor } } }` };
  const [w, l] = [await fire(WORKER, nextQ, false), await fire(LIVE, nextQ, true)];
  await sleep(LIVE_INTERVAL_MS);
  if (w.status === 200 && w.body.equals(l.body)) {
    console.log(`✓ Go 发的游标在边缘直接可用（第 2 页逐字节一致，${w.body.length}B）`);
  } else {
    bad++;
    console.error(`✗ 游标互通: status ${w.status}/${l.status}, ${w.body.length}B vs ${l.body.length}B`);
  }
  // 反向：边缘发的游标打回 Go
  const wFirst = await fire(WORKER, listQ, false);
  const wCursor = JSON.parse(wFirst.body).data.plugins.pageInfo.endCursor;
  if (wCursor !== cursor) {
    bad++;
    console.error(`✗ 两边发出的游标本身不一致：${wCursor} vs ${cursor}`);
  } else {
    console.log("✓ 两边发出的游标逐字符相同（签名算法一致）");
  }
}

// 条件请求：GET 304 与 POST 不 304
{
  const spec = { query: "{ dataset { dataVersion asOf } }" };
  const first = await fire(WORKER, spec, false);
  const { url } = buildRequest(WORKER, spec);
  const res304 = await fetch(url, { headers: { "If-None-Match": first.etag } });
  await res304.arrayBuffer();
  if (res304.status === 304) console.log("✓ GET If-None-Match → 304");
  else {
    bad++;
    console.error(`✗ GET 条件请求: ${res304.status}`);
  }
  const post = buildRequest(WORKER, { ...spec, method: "POST" });
  const resPost = await fetch(post.url, { ...post.init, headers: { ...post.init.headers, "If-None-Match": first.etag } });
  const postBody = Buffer.from(await resPost.arrayBuffer());
  if (resPost.status === 200 && postBody.length > 0 && resPost.headers.get("etag")) {
    console.log("✓ POST 带 If-None-Match 仍回 200 全量（ETag 只供观测）");
  } else {
    bad++;
    console.error(`✗ POST 条件请求: ${resPost.status}, ${postBody.length}B`);
  }
}

// schema SDL
{
  const [w, l] = await Promise.all([
    fetch(`${WORKER}/graphql/schema`).then(async (r) => ({ s: r.status, cc: r.headers.get("cache-control"), ct: r.headers.get("content-type"), b: Buffer.from(await r.arrayBuffer()) })),
    fetch(`${LIVE}/graphql/schema`).then(async (r) => ({ s: r.status, cc: r.headers.get("cache-control"), ct: r.headers.get("content-type"), b: Buffer.from(await r.arrayBuffer()) })),
  ]);
  if (w.s === 200 && w.b.equals(l.b) && w.cc === l.cc && w.ct === l.ct) {
    console.log(`✓ /graphql/schema 逐字节一致（${w.b.length}B，${w.ct}）`);
  } else {
    bad++;
    console.error(`✗ schema: status ${w.s}/${l.s}, ${w.b.length}B vs ${l.b.length}B, cc "${w.cc}" vs "${l.cc}"`);
  }
}

if (bad > 0) {
  console.error(`\n${bad} 项不一致`);
  process.exit(1);
}
console.log(`\n全部一致（${fixtures.length} 条固定用例 + 动态用例）`);
