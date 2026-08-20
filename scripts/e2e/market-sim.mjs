#!/usr/bin/env node
/**
 * 桌面端社区市场的 e2e 模拟器：以 dsh-community-market/0.1 的 UA 与校验规则
 * 扫描本地 dshfind API，验证服务端为它做的截断与非插件剔除，以及常规客户端、
 * 整包端点、is_plugin 过滤、ETag 条件请求的行为。
 *
 * 用法（compose 里 API_BASE=http://api:8080）：
 *   API_BASE=http://localhost:18080 node scripts/e2e/market-sim.mjs
 */
const API_BASE = (process.env.API_BASE ?? "http://localhost:18080").replace(/\/$/, "");
const DESKTOP_UA = "dsh-community-market/0.1";

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  ✅ ${name}`);
  } else {
    failures++;
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function getJson(path, ua) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "user-agent": ua, accept: "application/json", "accept-encoding": "identity" },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return { body: await res.json(), etag: res.headers.get("etag") };
}

// 等 api 容器就绪（distroless 镜像里没有 shell/wget，做不了 compose healthcheck，在这里轮询）。
async function waitForApi() {
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      const res = await fetch(`${API_BASE}/healthz`);
      if (res.ok) return;
    } catch { /* 还没起来 */ }
    if (Date.now() > deadline) throw new Error("等待 API 就绪超时（120s）");
    await new Promise((r) => setTimeout(r, 1000));
  }
}

await waitForApi();
console.log(`API 就绪：${API_BASE}\n`);

// ── 1. 桌面端 UA：翻页抓完整个首屏目录，校验与桌面 adapter 相同的严格不变量 ──
console.log("1. 桌面端 UA 扫描（截断 + 非插件剔除）");
const scanStart = Date.now();
let page = 1;
let dataVersion = null;
let totalPages = null;
const desktopItems = [];
for (;;) {
  const url = `/v1/plugins?page=${page}&per_page=100` + (dataVersion ? `&data_version=${dataVersion}` : "");
  const { body } = await getJson(url, DESKTOP_UA);
  if (dataVersion === null) dataVersion = body.data_version;
  if (totalPages === null) totalPages = body.total_pages;
  // 与 dsh-community-market adapter 一致的严格校验
  check(`page ${page}: per_page 恰为 100`, body.per_page === 100, `got ${body.per_page}`);
  check(`page ${page}: total_pages = ceil(total/100)`, body.total_pages === Math.ceil(body.total / 100));
  check(`page ${page}: data_version 稳定且为 sha256`, body.data_version === dataVersion && /^sha256:[0-9a-f]{64}$/.test(body.data_version));
  check(`page ${page}: 条数与元数据一致`, body.data.length === Math.min(100, body.total - (page - 1) * 100));
  desktopItems.push(...body.data);
  if (page >= totalPages) break;
  page++;
}
const scanMs = Date.now() - scanStart;
check("首屏最多 2 页（截断生效）", totalPages <= 2, `total_pages=${totalPages}`);
check("本地扫描 10 秒内完成", scanMs < 10_000, `耗时 ${scanMs}ms`);
check("无确认非插件（is_plugin=false）条目", desktopItems.every((p) => p.is_plugin !== false));
check("每条都带 is_plugin 字段（三态含 null）", desktopItems.every((p) => "is_plugin" in p));
const pluginCount = desktopItems.filter((p) => p.is_plugin === true).length;
console.log(`  ℹ️ 首屏 ${desktopItems.length} 条：确认插件 ${pluginCount} / 未知 ${desktopItems.length - pluginCount}，耗时 ${scanMs}ms`);

// ── 2. 普通客户端：拿到全量目录，不受桌面端截断影响 ──
console.log("2. 普通 UA 全量列表");
const { body: full } = await getJson("/v1/plugins?page=1&per_page=100", "market-sim/1.0");
check("普通 UA total 为全量（≥ 桌面首屏）", full.total >= desktopItems.length, `full=${full.total} desktop=${desktopItems.length}`);
check("普通 UA data_version 与桌面端一致", full.data_version === dataVersion);

// ── 3. is_plugin 过滤参数 ──
console.log("3. is_plugin 过滤");
const { body: onlyPlugins } = await getJson("/v1/plugins?is_plugin=1&per_page=100", "market-sim/1.0");
check("is_plugin=1 返回的每条都是确认插件", onlyPlugins.data.every((p) => p.is_plugin === true));
check("is_plugin=1 total 不超过全量", onlyPlugins.total <= full.total);
const { body: onlyNonPlugins } = await getJson("/v1/plugins?is_plugin=0&per_page=100", "market-sim/1.0");
check("is_plugin=0 返回的每条都是确认非插件", onlyNonPlugins.data.every((p) => p.is_plugin === false));
console.log(`  ℹ️ 全量 ${full.total}：确认插件 ${onlyPlugins.total} / 确认非插件 ${onlyNonPlugins.total} / 其余未知`);

// ── 4. 整包端点 /v1/catalog ──
console.log("4. /v1/catalog 整包");
const { body: catalog } = await getJson("/v1/catalog", "market-sim/1.0");
check("整包 total 与列表全量一致", catalog.total === full.total, `catalog=${catalog.total} list=${full.total}`);
check("整包 data_version 与列表一致", catalog.data_version === dataVersion);
check("整包 data 长度 = total", catalog.data.length === catalog.total);
const { body: catalogV } = await getJson(`/v1/catalog?data_version=${dataVersion}`, "market-sim/1.0");
check("带匹配版本的整包同样返回全量", catalogV.total === catalog.total);

// ── 5. ETag 条件请求 ──
console.log("5. ETag / 304");
const { etag } = await getJson("/v1/plugins?page=1&per_page=20", "market-sim/1.0");
const res304 = await fetch(`${API_BASE}/v1/plugins?page=1&per_page=20`, {
  headers: { "user-agent": "market-sim/1.0", "if-none-match": etag ?? "" },
});
check("If-None-Match 命中返回 304", res304.status === 304, `got ${res304.status}`);

// ── 6. 标准目录源契约（/market/manifest.json + /market/v1/plugins）──
console.log("6. 标准目录源契约");
const { body: manifest } = await getJson("/market/manifest.json", DESKTOP_UA);
check("manifest.manifestVersion 为 1.0.0", manifest.manifestVersion === "1.0.0", `got ${manifest.manifestVersion}`);
check("manifest.providerId 为反向域名式 ID", /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(manifest.providerId ?? ""), `got ${manifest.providerId}`);
check("manifest.transport.kind 为 https-json", manifest.transport?.kind === "https-json", `got ${manifest.transport?.kind}`);
const transportUrl = new URL(manifest.transport?.endpoint ?? "https://invalid/");
check("transport.endpoint 与 API 同 origin", transportUrl.origin === new URL(API_BASE).origin, `got ${transportUrl.origin}`);
check("transport.endpoint 路径以 /v1/plugins 结尾", transportUrl.pathname.endsWith("/v1/plugins"), `got ${transportUrl.pathname}`);
check("manifest.query.maxLimit 不超过 100", typeof manifest.query?.maxLimit === "number" && manifest.query.maxLimit <= 100, `got ${manifest.query?.maxLimit}`);

// 契约 item 的字段白名单（additionalProperties:false）
const CONTRACT_ITEM_FIELDS = new Set([
  "id", "name", "displayName", "summary", "homepage", "latestVersion", "license",
  "categories", "keywords", "repository", "package", "publisher", "media",
  "capabilities", "compatibility", "updatedAt",
]);
const contractItems = [];
let contractTotal = null;
let contractCursor = null;
let contractExhausted = false;
// 首页用小 limit 验证分页形状，后续页拉满 limit=100 以便数千条目录也能翻完
for (let p = 1; p <= 60; p++) {
  const limit = p === 1 ? 5 : 100;
  const path = `/market/v1/plugins?limit=${limit}` + (contractCursor ? `&cursor=${encodeURIComponent(contractCursor)}` : "");
  const { body } = await getJson(path, DESKTOP_UA);
  if (p === 1) {
    check("契约 page.schemaVersion 为 1.0.0", body.schemaVersion === "1.0.0", `got ${body.schemaVersion}`);
    check("limit=5 首页 items 不超过 5 条", Array.isArray(body.items) && body.items.length <= 5, `got ${body.items?.length}`);
    check("契约 page.total 为数字", typeof body.page?.total === "number", `got ${body.page?.total}`);
    contractTotal = body.page?.total;
  }
  contractItems.push(...(body.items ?? []));
  const nextCursor = body.page?.nextCursor ?? null;
  if (nextCursor === null) {
    contractExhausted = true;
    break;
  }
  check(`契约第 ${p} 页游标确实推进`, nextCursor !== contractCursor, "nextCursor 与当前 cursor 相同");
  contractCursor = nextCursor;
}
check("页数上限内翻完整个契约目录", contractExhausted, "仍有 nextCursor（目录过大或游标未收敛）");
check("契约累计条数与 total 一致", contractItems.length === contractTotal, `got ${contractItems.length} / total=${contractTotal}`);
check("每条 item 的 id/name/displayName/summary 均为非空字符串", contractItems.every((it) =>
  [it.id, it.name, it.displayName, it.summary].every((v) => typeof v === "string" && v.length > 0)));
const extraItemKeys = [...new Set(contractItems.flatMap((it) => Object.keys(it).filter((k) => !CONTRACT_ITEM_FIELDS.has(k))))];
check("item 字段不超出白名单", extraItemKeys.length === 0, `多余字段: ${extraItemKeys.join(",")}`);
const withPackage = contractItems.filter((it) => it.package != null);
check("含 package 的 item registry 均为 npm", withPackage.every((it) => it.package?.registry === "npm"));
check("含 package 的 item 必带精确稳定 latestVersion", withPackage.every((it) => /^\d+\.\d+\.\d+$/.test(it.latestVersion ?? "")));
check("含 package 的 item 必带 https repository.url", withPackage.every((it) => typeof it.repository?.url === "string" && it.repository.url.startsWith("https://")));
console.log(`  ℹ️ 契约目录 ${contractItems.length} 条（含 package 的 ${withPackage.length} 条）`);

console.log(failures === 0 ? "\n🎉 全部断言通过" : `\n💥 ${failures} 条断言失败`);
process.exit(failures === 0 ? 0 : 1);
