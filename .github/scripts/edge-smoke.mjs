#!/usr/bin/env node
/**
 * 生产冒烟（S5 后的哨兵）：网站首页 + api-edge 全部接管面各打一枪。
 * 只验「生产在健康服务」，不验「当前 commit 已上线」；失败重试三轮后标红。
 * 旧的 Railway 门禁（锚点/观察/回滚）随 Go 退役删除，见 git 历史。
 */
const WEB = process.env.PROD_WEB_URL || "https://dshfind.com";
const API = process.env.PROD_API_URL || "https://api.dshfind.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, init = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000), redirect: "manual" });
      return res;
    } catch (err) {
      if (attempt >= 3) throw err;
      await sleep(5000);
    }
  }
}

const checks = [
  ["网站首页", async () => {
    const res = await get(`${WEB}/zh`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  }],
  ["healthz（边缘自答）", async () => {
    const res = await get(`${API}/healthz`);
    const body = await res.json();
    if (res.status !== 200 || body.status !== "ok" || body.served_by !== "api-edge") {
      throw new Error(`HTTP ${res.status} ${JSON.stringify(body)}`);
    }
  }],
  ["目录列表", async () => {
    const res = await get(`${API}/v1/plugins?per_page=1`);
    const body = await res.json();
    if (!Array.isArray(body.data) || body.data.length === 0 || !body.data_version?.startsWith("sha256:")) {
      throw new Error("信封不健康");
    }
  }],
  ["桌面市场契约", async () => {
    const res = await get(`${API}/market/v1/plugins?limit=1`, { headers: { "User-Agent": "dsh-community-market/0.1" } });
    const body = await res.json();
    if (body.schemaVersion !== "1.0.0" || !Array.isArray(body.items)) throw new Error("信封不健康");
  }],
  ["suggest", async () => {
    const res = await get(`${API}/v1/suggest?q=dsh`);
    const body = await res.json();
    if (!Array.isArray(body.items) || body.items.length === 0) throw new Error("无结果");
  }],
  ["GraphQL", async () => {
    const res = await get(`${API}/graphql?query=%7Bdataset%7BdataVersion%7D%7D`);
    const body = await res.json();
    if (!body.data?.dataset?.dataVersion?.startsWith("sha256:")) throw new Error("dataset 不健康");
  }],
  ["插件详情（D1 读）", async () => {
    const res = await get(`${API}/v1/plugins/deepseek-ai/deepseek-harness`);
    const body = await res.json();
    if (body.full_name !== "deepseek-ai/deepseek-harness" || !Array.isArray(body.snapshots)) {
      throw new Error("详情不健康（D1 binding？）");
    }
  }],
  ["论坛列表（D1 读）", async () => {
    const res = await get(`${API}/v1/forum/threads?per_page=1`);
    const body = await res.json();
    if (!Array.isArray(body.items) || !Array.isArray(body.boards)) throw new Error("论坛不健康");
  }],
  ["auth/me", async () => {
    const res = await get(`${API}/auth/me`);
    const body = await res.json();
    if (!("user" in body)) throw new Error("信封不健康");
  }],
];

let bad = 0;
for (const [name, fn] of checks) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    bad++;
    console.error(`✗ ${name}: ${err.message}`);
  }
}
if (bad > 0) {
  console.error(`\n${bad} 项失败。api-edge 回滚：pnpm exec wrangler rollback --config workers/api-edge/wrangler.jsonc；主站回滚：wrangler rollback`);
  process.exit(1);
}
console.log("\n生产健康");
