/**
 * api-edge Worker 的发布三件套：部署 → 生产验收 → 失败自动回滚。
 *
 * 直接 `wrangler deploy` 是盲发：产物坏了桌面端整批遭殃。这里在部署前
 * 记下当前活跃版本，部署后验证生产真的在服务新产物（data_version 与本地
 * meta.json 一致、桌面 UA 截断契约完好），任一失败回滚到记录的版本并退出 1。
 *
 * 调用方：refresh-site 流水线与 .github/workflows/sync-plugins.yml。
 * CI 里需要 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID（wrangler 自动读取）。
 *
 * 用法：
 *   node scripts/deploy-api-edge.mjs             # 部署 + 验收 + 失败回滚
 *   node scripts/deploy-api-edge.mjs --verify-only  # 只验收当前生产（金丝雀/排查用）
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { healthyMarketPageResponse, healthyPluginListResponse } from "./lib/deploy-gate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = resolve(root, "workers/api-edge/wrangler.jsonc");
const META = resolve(root, "workers/api-edge/assets/meta.json");
const API = "https://api.dshfind.com";
const DESKTOP_UA = "dsh-community-market/0.1";
/** 部署到边缘全量生效有传播窗口；按 5s 间隔最多等 2 分钟。 */
const VERIFY_ATTEMPTS = 24;
const VERIFY_INTERVAL_MS = 5_000;

const verifyOnly = process.argv.includes("--verify-only");

function wrangler(args) {
  return execFileSync("pnpm", ["exec", "wrangler", ...args, "--config", CONFIG], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

async function fetchEdge(path, { ua, method = "GET" } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: ua ? { "User-Agent": ua } : {},
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${method} ${path} → HTTP ${res.status}`);
  // 产物缺失时 Worker 会静默透传回 Go——响应照样 200，只是数据回到了旧世界。
  // 这个头只有 Railway 会带，据此把「悄悄退回 Go」和「真的在服务」区分开。
  if (res.headers.has("x-railway-request-id")) {
    throw new Error(`${path} 由 Go 在服务（Worker 透传了，多半是产物缺失或路由没挂上）`);
  }
  return res;
}

async function getJSON(path, ua) {
  return (await fetchEdge(path, { ua })).json();
}

/**
 * 生产验收：接管的每条路径都在服务预期版本，且**确实由 Worker 在服务**
 * （fetchEdge 会把悄悄透传回 Go 的情况判成失败——产物缺失时 Worker 的兜底
 * 是透传，响应仍然 200，只验信封根本发现不了）。
 * market 只验信封会漏掉「游标编码坏了但首页照常」这种最难查的故障，
 * 所以一定要真翻一页。
 */
async function verify(expectedVersion) {
  let lastErr = "尚未探测";
  for (let i = 0; i < VERIFY_ATTEMPTS; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, VERIFY_INTERVAL_MS));
    try {
      const list = await getJSON("/v1/plugins?per_page=1");
      if (!healthyPluginListResponse(list)) throw new Error("完整目录信封不健康");
      if (list.data_version !== expectedVersion) {
        throw new Error(`完整目录版本 ${list.data_version.slice(0, 24)}… ≠ 预期 ${expectedVersion.slice(0, 24)}…`);
      }
      const desktop = await getJSON("/v1/plugins?per_page=1", DESKTOP_UA);
      if (!healthyPluginListResponse(desktop, { maxTotal: 200 })) {
        throw new Error("桌面首屏信封不健康（UA 分流或 200 条截断失效）");
      }
      if (desktop.data_version !== expectedVersion) throw new Error("桌面首屏版本与预期不符");

      const market = await getJSON("/market/v1/plugins?limit=50");
      if (!healthyMarketPageResponse(market, { expectRevision: expectedVersion })) {
        throw new Error("market 信封不健康或 revision 与预期不符");
      }
      if (!market.page.nextCursor) throw new Error("market 首页没给 nextCursor，分页走到死胡同");
      const next = await getJSON(
        `/market/v1/plugins?limit=50&cursor=${encodeURIComponent(market.page.nextCursor)}`,
      );
      if (!healthyMarketPageResponse(next, { expectRevision: expectedVersion })) {
        throw new Error("market 游标页不健康");
      }
      if (next.items[0]?.id === market.items[0]?.id) throw new Error("market 游标没有前进");

      const suggest = await getJSON("/v1/suggest?q=dsh");
      if (!Array.isArray(suggest.items) || suggest.items.length === 0) {
        throw new Error("suggest 没有返回条目");
      }
      if (typeof suggest.items[0]?.href !== "string") throw new Error("suggest 条目形状不对");

      // 整包目录走 HEAD：只要验缓存头与 ETag，没必要在 CI 里拉 11MB。
      const catalog = await fetchEdge(`/v1/catalog?data_version=${encodeURIComponent(expectedVersion)}`, {
        method: "HEAD",
      });
      if (!(catalog.headers.get("cache-control") ?? "").includes("immutable")) {
        throw new Error("catalog 版本匹配时没有换成 immutable 缓存头");
      }
      if (expectedCatalogEtag && catalog.headers.get("etag") !== expectedCatalogEtag) {
        throw new Error(`catalog ETag ${catalog.headers.get("etag")} ≠ 预期 ${expectedCatalogEtag}`);
      }
      return;
    } catch (err) {
      lastErr = err.message;
    }
  }
  throw new Error(`验收超时（${VERIFY_ATTEMPTS} 次尝试）：${lastErr}`);
}

const meta = JSON.parse(readFileSync(META, "utf8"));
const expectedVersion = meta.data_version;
const expectedCatalogEtag = meta.catalog_etag;
if (typeof expectedVersion !== "string" || !expectedVersion.startsWith("sha256:")) {
  console.error("meta.json 里没有合法的 data_version——先跑 scripts/gen-api-artifacts.mjs");
  process.exit(1);
}

if (verifyOnly) {
  await verify(expectedVersion);
  console.log(`✓ 生产 api-edge 正在服务预期版本 ${expectedVersion.slice(0, 24)}…`);
  process.exit(0);
}

// 1) 记录回滚锚点：当前活跃版本（deployments 列表首项）。首次部署时为空，仅告警。
let anchorVersion = null;
try {
  const deployments = JSON.parse(wrangler(["deployments", "list", "--json"]));
  anchorVersion = deployments?.[0]?.versions?.[0]?.version_id ?? null;
} catch {
  /* 拿不到就当首次部署 */
}
console.log(anchorVersion ? `回滚锚点：${anchorVersion}` : "⚠ 无历史版本（首次部署），验收失败将无法自动回滚");

// 2) 部署
wrangler(["deploy"]);

// 3) 验收；失败回滚到锚点
try {
  await verify(expectedVersion);
  console.log(`✓ api-edge 已上线并验收通过：${expectedVersion.slice(0, 24)}…`);
} catch (err) {
  console.error(`✖ api-edge 验收失败：${err.message}`);
  if (anchorVersion) {
    console.error(`回滚到 ${anchorVersion} …`);
    try {
      wrangler(["rollback", anchorVersion, "-y", "-m", "deploy-api-edge 验收失败自动回滚"]);
      console.error("回滚指令已执行；桌面端将回到上一版产物（旧 data_version，一次 409 重同步）");
    } catch (rollbackErr) {
      console.error(`✖ 自动回滚也失败了：${rollbackErr.message}`);
      console.error(`手工恢复：pnpm exec wrangler rollback ${anchorVersion} -y --config ${CONFIG}`);
    }
  }
  process.exit(1);
}
