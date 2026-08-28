#!/usr/bin/env node
/**
 * S3 验收（一）：论坛读路径与线上 Go 的逐字节比对。
 *
 * 前提：本地 D1 已导入与 Turso 相同的论坛数据（scratchpad 的 export-forum 流程，
 * 或切流 runbook 的正式导入）。论坛写量约 1 次/天，比对窗口里数据漂移的概率
 * 可以忽略；万一比对红了先核对两库行数再怀疑代码。
 *
 * 写路径不打线上（会污染生产数据），由 check-forum-writes.mjs 在本地 D1 上断言。
 *
 * 用法：node scripts/check-forum-parity.mjs [worker地址] [Go地址]
 */
const WORKER = process.argv[2] ?? "http://localhost:8790";
const LIVE = process.argv[3] ?? "https://api.dshfind.com";
const WEB_ORIGIN = "https://dshfind.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CASES = [
  // [path, headers, note]
  ["/v1/forum/threads", {}, "列表 默认"],
  ["/v1/forum/threads?board=plugin", {}, "列表 board=plugin"],
  ["/v1/forum/threads?board=general", {}, "列表 board=general（空板块）"],
  ["/v1/forum/threads?board=bogus", {}, "列表 非法 board 当不过滤"],
  ["/v1/forum/threads?locale=zh", {}, "列表 locale=zh"],
  ["/v1/forum/threads?locale=xx", {}, "列表 非法 locale 当不过滤"],
  ["/v1/forum/threads?page=2&per_page=2", {}, "列表 翻页"],
  ["/v1/forum/threads?per_page=999", {}, "列表 per_page clamp 到 50"],
  ["/v1/forum/threads?page=abc&per_page=-1", {}, "列表 非法分页回默认"],
  ["/v1/forum/threads?page=99", {}, "列表 越界页（空 items）"],
  ["/v1/forum/threads/plugin-xmanrui-dsh-im-34471c0d", {}, "帖子详情（插件讨论帖）"],
  ["/v1/forum/threads/nope-not-a-slug", {}, "帖子 404"],
  ["/v1/plugins/xmanrui/dsh-im/discussion", {}, "讨论区（有评论）"],
  ["/v1/plugins/XMANRUI/DSH-IM/discussion", {}, "讨论区 大小写不敏感"],
  ["/v1/plugins/deepseek-ai/deepseek-harness/discussion", {}, "讨论区（可能空）"],
  ["/v1/plugins/nope/nope-nope/discussion", {}, "讨论区 插件不存在 404"],
];

const normEtag = (etag) => etag?.replace(/-(gzip|br)"$/, '"').replace(/^W\//, "") ?? null;

async function get(base, path, headers, method = "GET") {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(base + path, { method, headers });
    if (base === LIVE && res.status === 429 && attempt < 3) {
      const wait = Number(res.headers.get("retry-after") ?? 2) * 1000 + 500;
      await res.arrayBuffer();
      console.log(`  （对照组 429，等 ${Math.round(wait / 1000)}s）`);
      await sleep(wait);
      continue;
    }
    return {
      status: res.status,
      etag: normEtag(res.headers.get("etag")),
      cc: res.headers.get("cache-control"),
      allowOrigin: res.headers.get("access-control-allow-origin"),
      allowCred: res.headers.get("access-control-allow-credentials"),
      allowMethods: res.headers.get("access-control-allow-methods"),
      body: Buffer.from(await res.arrayBuffer()),
    };
  }
}

let bad = 0;
const report = (ok, note, extra) => {
  if (ok) console.log(`✓ ${note}${extra ?? ""}`);
  else {
    bad++;
    console.error(`✗ ${note}${extra ?? ""}`);
  }
};

for (const [path, headers, note] of CASES) {
  const [w, l] = [await get(WORKER, path, headers), await get(LIVE, path, headers)];
  await sleep(1300);
  const problems = [];
  if (w.status !== l.status) problems.push(`status ${w.status}/${l.status}`);
  if (!w.body.equals(l.body)) problems.push(`body ${w.body.length}B vs ${l.body.length}B`);
  if (w.cc !== l.cc) problems.push(`cc "${w.cc}" vs "${l.cc}"`);
  if (w.status === 200 && w.etag !== l.etag) problems.push(`etag ${w.etag} vs ${l.etag}`);
  if (problems.length === 0) report(true, note, `（${w.status}，${w.body.length}B）`);
  else {
    report(false, note, `: ${problems.join(", ")}`);
    if (w.status === l.status && !w.body.equals(l.body)) {
      const n = Math.min(w.body.length, l.body.length);
      let i = 0;
      while (i < n && w.body[i] === l.body[i]) i++;
      console.error(`  首个差异 @${i}:`);
      console.error(`  worker: …${w.body.subarray(Math.max(0, i - 60), i + 80).toString()}…`);
      console.error(`  live:   …${l.body.subarray(Math.max(0, i - 60), i + 80).toString()}…`);
    }
  }
}

// OPTIONS 预检：credentialed 端点带对/错/缺 Origin 三态
for (const [path, methods] of [
  ["/v1/forum/threads", "GET, POST, OPTIONS"],
  ["/v1/plugins/xmanrui/dsh-im/vote", "PUT, DELETE, OPTIONS"],
  ["/v1/plugins/xmanrui/dsh-im/comments", "POST, OPTIONS"],
  ["/v1/me/plugin-votes/xmanrui/dsh-im", "GET, OPTIONS"],
]) {
  const [w, l] = [
    await get(WORKER, path, { Origin: WEB_ORIGIN }, "OPTIONS"),
    await get(LIVE, path, { Origin: WEB_ORIGIN }, "OPTIONS"),
  ];
  await sleep(1300);
  const ok =
    w.status === l.status &&
    w.allowOrigin === l.allowOrigin &&
    w.allowCred === l.allowCred &&
    w.allowMethods === l.allowMethods &&
    w.allowMethods === methods;
  report(ok, `OPTIONS ${path}`, ok ? `（${w.status}，${w.allowMethods}）` : `: ${w.status}/${l.status} "${w.allowMethods}" vs "${l.allowMethods}"`);

  const [wBad, lBad] = [
    await get(WORKER, path, { Origin: "https://evil.example" }, "OPTIONS"),
    await get(LIVE, path, { Origin: "https://evil.example" }, "OPTIONS"),
  ];
  await sleep(1300);
  const okBad = wBad.status === lBad.status && wBad.status === 403 && wBad.body.equals(lBad.body);
  report(okBad, `OPTIONS ${path} 非法 Origin`, okBad ? "（403）" : `: ${wBad.status}/${lBad.status}`);
}

// 讨论区 OPTIONS 是公开预检（CORS *）
{
  const [w, l] = [
    await get(WORKER, "/v1/plugins/xmanrui/dsh-im/discussion", {}, "OPTIONS"),
    await get(LIVE, "/v1/plugins/xmanrui/dsh-im/discussion", {}, "OPTIONS"),
  ];
  await sleep(1300);
  const ok = w.status === l.status && w.allowOrigin === l.allowOrigin && w.allowMethods === l.allowMethods;
  report(ok, "OPTIONS discussion 公开预检", ok ? `（${w.status}，${w.allowOrigin}）` : `: ${w.status}/${l.status}`);
}

// 写端点的未登录/坏 Origin 错误形态（不会产生写入，可以打线上）
for (const [method, path, headers, expectStatus, note] of [
  ["POST", "/v1/forum/threads", { Origin: WEB_ORIGIN, "Content-Type": "application/json" }, 401, "发帖未登录 401"],
  ["POST", "/v1/forum/threads", { "Content-Type": "application/json" }, 403, "发帖无 Origin 403"],
  ["PUT", "/v1/plugins/xmanrui/dsh-im/vote", { Origin: "https://evil.example" }, 403, "投票坏 Origin 403"],
  ["GET", "/v1/me/plugin-votes/xmanrui/dsh-im", { Origin: WEB_ORIGIN }, 401, "查我的票未登录 401"],
  ["DELETE", "/v1/forum/posts/1", { Origin: WEB_ORIGIN }, 401, "删帖未登录 401"],
]) {
  const [w, l] = [await get(WORKER, path, headers, method), await get(LIVE, path, headers, method)];
  await sleep(1300);
  const ok = w.status === l.status && w.status === expectStatus && w.body.equals(l.body) && w.allowOrigin === l.allowOrigin;
  report(ok, note, ok ? "" : `: ${w.status}/${l.status}（期望 ${expectStatus}）body ${w.body.length}B vs ${l.body.length}B`);
}

// /auth/me 的三态（不带 cookie，不会碰会话）
for (const [headers, note] of [
  [{}, "auth/me 无 Origin（非浏览器只读）"],
  [{ Origin: WEB_ORIGIN }, "auth/me 本站 Origin"],
  [{ Origin: "https://evil.example" }, "auth/me 坏 Origin 403"],
]) {
  const [w, l] = [await get(WORKER, "/auth/me", headers), await get(LIVE, "/auth/me", headers)];
  await sleep(1300);
  const ok = w.status === l.status && w.body.equals(l.body) && w.allowOrigin === l.allowOrigin && w.allowCred === l.allowCred;
  report(ok, note, ok ? `（${w.status}，${w.body.toString().trim()}）` : `: ${w.status}/${l.status} body ${JSON.stringify(w.body.toString())} vs ${JSON.stringify(l.body.toString())}`);
}

// logout 的 403 与 303 形状（不带 cookie，清空 cookie 无副作用）
{
  const [w, l] = [
    await get(WORKER, "/auth/logout", { Origin: "https://evil.example" }, "POST"),
    await get(LIVE, "/auth/logout", { Origin: "https://evil.example" }, "POST"),
  ];
  await sleep(1300);
  report(w.status === 403 && l.status === 403 && w.body.equals(l.body), "logout 坏 Origin 403");
}

// 304：拿 worker 的 ETag 回发
{
  const first = await get(WORKER, "/v1/forum/threads", {});
  const res = await fetch(`${WORKER}/v1/forum/threads`, { headers: { "If-None-Match": first.etag } });
  await res.arrayBuffer();
  report(res.status === 304, "列表 If-None-Match → 304", `（${res.status}）`);
}

if (bad > 0) {
  console.error(`\n${bad} 项不一致`);
  process.exit(1);
}
console.log("\n全部一致");
