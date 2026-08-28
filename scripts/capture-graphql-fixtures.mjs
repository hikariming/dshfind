#!/usr/bin/env node
/**
 * 录制 GraphQL 契约语料：把一批查询打到指定源站，逐字节存下响应。
 *
 * 为什么要录：/graphql 的对外契约（docs/api-query.md §5）细节极多——响应键
 * **按字母序**而非选择顺序（Go 的 map[string]any 序列化行为，spec 上其实是违规的
 * 但已经是既成契约）、错误只有 message 一个字段、还有一组自定义限额与错误文案。
 * 迁移到边缘时这些必须逐字对上，靠人眼比对不现实，只能拿真实响应当规格。
 *
 * 用法：
 *   node scripts/capture-graphql-fixtures.mjs [源站] [输出文件]
 *     源站默认 https://api.dshfind.com，迁移后要录 Go 就传 Railway 直连域名
 *     输出默认 workers/api-edge/fixtures/graphql.json
 *
 * 录完用 scripts/check-graphql-parity.mjs 回放比对。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = process.argv[2] ?? "https://api.dshfind.com";
const OUT = process.argv[3] ?? resolve(root, "workers/api-edge/fixtures/graphql.json");
/** Go 侧有限流，录制必须放慢；429 按 Retry-After 重试。 */
const INTERVAL_MS = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PLUGIN = "bowenliang123/dsh-context";

/** [名称, {method, query, variables?, operationName?, raw?}] */
const CASES = [
  // ── 根字段 ───────────────────────────────────────────────────────────────
  ["dataset", { query: "{ dataset { dataVersion asOf } }" }],
  ["dataset 字段倒序（验证响应键按字母序而非选择序）", { query: "{ dataset { asOf dataVersion } }" }],
  ["dataset alias", { query: "{ zzz: dataset { asOf dataVersion } }" }],
  ["facets 全部四组", { query: "{ pluginFacets { categories { value count } languages { value count } tags { value count } grades { value count } } }" }],
  ["facets 只要 count", { query: "{ pluginFacets { grades { count } } }" }],
  ["根字段倒序", { query: "{ pluginFacets { grades { value count } } dataset { asOf dataVersion } }" }],

  // ── plugin 单查 ─────────────────────────────────────────────────────────
  ["plugin 全部标量字段", { query: `{ plugin(fullName:"${PLUGIN}") { id fullName name owner url repositoryUrl description tags language stars contributors pushedAt archived category score grade isFeatured isOfficial isInsider isRisky riskNote isPlugin firstSeenAt lastSyncedAt } }` }],
  ["plugin 字段乱序", { query: `{ plugin(fullName:"${PLUGIN}") { stars fullName owner archived name } }` }],
  ["plugin install", { query: `{ plugin(fullName:"${PLUGIN}") { install { cmd source kind pkgName npmPublished releaseTgzUrl releaseTag probedAt } } }` }],
  ["plugin rating", { query: `{ plugin(fullName:"${PLUGIN}") { rating { score grade calculatedAt version } } }` }],
  ["plugin i18n 全部", { query: `{ plugin(fullName:"${PLUGIN}") { i18n { locale description intro highlights updatedAt } } }` }],
  ["plugin i18n 指定 locale", { query: `{ plugin(fullName:"${PLUGIN}") { i18n(locale:"zh") { locale description highlights } } }` }],
  ["plugin i18n 不存在的 locale", { query: `{ plugin(fullName:"${PLUGIN}") { i18n(locale:"xx") { locale } } }` }],
  ["plugin snapshots 默认 30 天", { query: `{ plugin(fullName:"${PLUGIN}") { snapshots { date stars contributors pushedAt } } }` }],
  ["plugin snapshots days=3", { query: `{ plugin(fullName:"${PLUGIN}") { snapshots(days:3) { date stars } } }` }],
  ["plugin snapshots days 上限", { query: `{ plugin(fullName:"${PLUGIN}") { snapshots(days:90) { date } } }` }],
  ["plugin growth", { query: `{ plugin(fullName:"${PLUGIN}") { growth { windowDays stars contributors } } }` }],
  ["plugin 不存在 → null", { query: '{ plugin(fullName:"nope/nope-nope") { fullName } }' }],
  ["plugin 大小写不敏感", { query: '{ plugin(fullName:"BOWENLIANG123/DSH-CONTEXT") { fullName } }' }],
  ["未评分插件的 grade/rating 为 null", { query: '{ plugins(first:50, filter:{minScore:0}) { nodes { fullName } } }' }],

  // ── connection ──────────────────────────────────────────────────────────
  ["connection 基本", { query: "{ plugins(first:2) { totalCount dataVersion asOf nodes { fullName stars } pageInfo { hasNextPage endCursor } } }" }],
  ["connection first 下界", { query: "{ plugins(first:1) { nodes { fullName } } }" }],
  ["connection first 上界", { query: "{ plugins(first:50) { totalCount nodes { fullName } } }" }],
  ["connection 默认 first=20", { query: "{ plugins { nodes { fullName } totalCount } }" }],
  ["connection sort=STARS", { query: "{ plugins(first:3, sort:STARS) { nodes { fullName stars } } }" }],
  ["connection sort=STARS order=ASC", { query: "{ plugins(first:3, sort:STARS, order:ASC) { nodes { fullName stars } } }" }],
  ["connection sort=NAME", { query: "{ plugins(first:3, sort:NAME) { nodes { fullName } } }" }],
  ["connection sort=SCORE", { query: "{ plugins(first:3, sort:SCORE) { nodes { fullName score } } }" }],
  ["connection sort=UPDATED", { query: "{ plugins(first:3, sort:UPDATED) { nodes { fullName pushedAt } } }" }],
  ["connection sort=DEFAULT 时 order 不重排", { query: "{ plugins(first:3, sort:DEFAULT, order:ASC) { nodes { fullName } } }" }],
  ["filter category", { query: '{ plugins(first:2, filter:{category:"ui"}) { totalCount nodes { fullName category } } }' }],
  ["filter language 大小写", { query: '{ plugins(first:2, filter:{language:"GO"}) { totalCount nodes { language } } }' }],
  ["filter grade", { query: "{ plugins(first:2, filter:{grade:S}) { totalCount nodes { fullName grade } } }" }],
  ["filter q", { query: '{ plugins(first:2, filter:{q:"mcp"}) { totalCount nodes { fullName } } }' }],
  ["filter q 中文", { query: '{ plugins(first:2, filter:{q:"余额"}) { totalCount nodes { fullName } } }' }],
  ["filter owner", { query: '{ plugins(first:2, filter:{owner:"DEEPSEEK-AI"}) { totalCount nodes { owner } } }' }],
  ["filter tag", { query: '{ plugins(first:2, filter:{tag:"mcp"}) { totalCount nodes { tags } } }' }],
  ["filter minScore", { query: "{ plugins(first:2, filter:{minScore:90}) { totalCount nodes { score } } }" }],
  ["filter 布尔组合", { query: "{ plugins(first:2, filter:{featured:true, official:false, archived:false, insider:false, risky:false, hasInstall:true, isPlugin:true}) { totalCount nodes { fullName } } }" }],
  ["filter isPlugin=false", { query: "{ plugins(first:2, filter:{isPlugin:false}) { totalCount } }" }],
  ["filter 空结果集", { query: '{ plugins(first:2, filter:{category:"nope"}) { totalCount nodes { fullName } pageInfo { hasNextPage endCursor } } }' }],

  // ── variables / fragment / alias / operationName ─────────────────────────
  ["variables", { query: "query P($n: ID!) { plugin(fullName:$n) { fullName stars } }", variables: { n: PLUGIN } }],
  ["variables 带 filter 对象", { query: "query L($f: PluginFilter) { plugins(first:2, filter:$f) { totalCount nodes { fullName } } }", variables: { f: { category: "memory", minScore: 70, hasInstall: true } } }],
  ["named fragment", { query: `fragment F on Plugin { fullName stars } { plugin(fullName:"${PLUGIN}") { ...F } }` }],
  ["inline fragment", { query: `{ plugin(fullName:"${PLUGIN}") { ... on Plugin { fullName owner } } }` }],
  ["operationName 选中第二个 operation", { query: "query A { dataset { dataVersion } } query B { dataset { asOf } }", operationName: "B" }],
  ["字段 alias", { query: `{ plugin(fullName:"${PLUGIN}") { n: fullName s: stars } }` }],

  // ── 错误：限额与语义 ─────────────────────────────────────────────────────
  ["错误 未知根字段", { query: "{ nope }" }],
  ["错误 未知 Plugin 字段", { query: `{ plugin(fullName:"${PLUGIN}") { nope } }` }],
  ["错误 标量带选择集", { query: `{ plugin(fullName:"${PLUGIN}") { stars { x } } }` }],
  ["错误 对象缺选择集", { query: `{ plugin(fullName:"${PLUGIN}") { install } }` }],
  ["错误 first 越界", { query: "{ plugins(first:51) { totalCount } }" }],
  ["错误 first 为 0", { query: "{ plugins(first:0) { totalCount } }" }],
  ["错误 minScore 越界", { query: "{ plugins(first:1, filter:{minScore:101}) { totalCount } }" }],
  ["错误 未知 sort", { query: "{ plugins(first:1, sort:BOGUS) { totalCount } }" }],
  ["错误 坏游标", { query: '{ plugins(first:1, after:"!!!") { totalCount } }' }],
  ["错误 两个 plugin 数据根解析器", { query: `{ a: plugins(first:1) { totalCount } b: plugin(fullName:"${PLUGIN}") { fullName } }` }],
  ["错误 重复响应键", { query: "{ dataset { dataVersion } dataset { asOf } }" }],
  ["错误 mutation", { query: "mutation { dataset { dataVersion } }" }],
  ["错误 缺变量", { query: "query P($n: ID!) { plugin(fullName:$n) { fullName } }" }],
  ["错误 fragment 不存在", { query: `{ plugin(fullName:"${PLUGIN}") { ...Missing } }` }],
  ["错误 空 query", { query: "" }],
  ["错误 introspection", { query: "{ __schema { types { name } } }" }],
  ["错误 directive", { query: "{ dataset @include(if:true) { dataVersion } }" }],
  ["错误 block string", { query: '{ plugin(fullName:"""x""") { fullName } }' }],
  ["错误 语法错误", { query: "{ dataset { " }],

  // ── 传输层 ───────────────────────────────────────────────────────────────
  ["POST 基本", { method: "POST", query: "{ dataset { dataVersion asOf } }" }],
  ["POST 带 variables", { method: "POST", query: "query P($n: ID!) { plugin(fullName:$n) { fullName } }", variables: { n: PLUGIN } }],
  ["传输错误 body 不是 JSON", { method: "POST", raw: "not json" }],
  ["传输错误 body 有两个 JSON 值", { method: "POST", raw: '{"query":"{dataset{asOf}}"} {"query":"x"}' }],
  ["传输错误 GET variables 不是对象", { rawQS: "query=%7Bdataset%7BasOf%7D%7D&variables=123" }],
];

async function fire(name, spec) {
  const method = spec.method ?? "GET";
  let url = `${ORIGIN}/graphql`;
  let init = { method, headers: {} };
  if (method === "GET") {
    if (spec.rawQS) {
      url += `?${spec.rawQS}`;
    } else {
      const qs = new URLSearchParams({ query: spec.query });
      if (spec.variables) qs.set("variables", JSON.stringify(spec.variables));
      if (spec.operationName) qs.set("operationName", spec.operationName);
      url += `?${qs}`;
    }
  } else {
    init.headers["Content-Type"] = "application/json";
    init.body = spec.raw ?? JSON.stringify({
      query: spec.query,
      ...(spec.variables ? { variables: spec.variables } : {}),
      ...(spec.operationName ? { operationName: spec.operationName } : {}),
    });
  }
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status === 429 && attempt < 3) {
      const wait = Number(res.headers.get("retry-after") ?? 2) * 1000 + 500;
      console.log(`  （429，等 ${Math.round(wait / 1000)}s）`);
      await sleep(wait);
      continue;
    }
    const body = await res.text();
    return {
      name,
      request: spec,
      status: res.status,
      cacheControl: res.headers.get("cache-control"),
      contentType: res.headers.get("content-type"),
      hasEtag: Boolean(res.headers.get("etag")),
      body,
    };
  }
}

const fixtures = [];
for (const [name, spec] of CASES) {
  const got = await fire(name, spec);
  fixtures.push(got);
  const preview = got.body.length > 90 ? `${got.body.slice(0, 90)}…` : got.body;
  console.log(`${String(got.status).padEnd(3)} ${name}\n    ${preview}`);
  await sleep(INTERVAL_MS);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ origin: ORIGIN, capturedAt: new Date().toISOString(), fixtures }, null, 2) + "\n");
console.log(`\n录了 ${fixtures.length} 条 → ${OUT}`);
