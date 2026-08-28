/**
 * 生成 API 边缘 Worker 的静态产物（docs/d1-migration-plan.md P4）。
 *
 * 逐字节复刻 Go 端 /v1/plugins 的响应条目：字段顺序对齐 store.Plugin 的
 * struct 定义（server/internal/store/plugins.go），转义对齐 encoding/json
 * 的 HTML 转义（< > & U+2028 U+2029）。复刻是否成功可直接验证——
 * data_version 是对整个条目数组字节做 sha256，与线上 Go 完全一致才算对，
 * 用 scripts/check-api-parity.mjs 核对。
 *
 * 产物（workers/api-edge/assets/）：
 *   catalog-full.ndjson    完整目录，每行一个条目的 JSON 字节（快照序）
 *   catalog-desktop.ndjson 桌面首屏子集：剔除 is_plugin=false 后前 200 条
 *   market-items.ndjson    /market/v1/plugins 契约条目（is_plugin=1，full_name 字节序）
 *   market-filters.json    category / 小写 name / 小写 description 三条平行数组
 *   suggest-items.ndjson   /v1/suggest 的预渲染条目
 *   suggest-hay.json       suggest 检索串（不含 language）
 *   list-facets.json       /v1/plugins 的过滤与排序面（14 个条件 + 4 种排序）
 *   detail-index.json      小写 full_name → 行号，供详情端点查找
 *   meta.json              data_version / as_of / 行数 / catalog 的 ETag
 *
 * 用法：node --env-file=.env.local scripts/gen-api-artifacts.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { openDb } from "./lib/db.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "workers/api-edge/assets");

// 与 server/internal/store/plugins.go loadPluginsSQL 逐字对齐（含行序）。
const LOAD_SQL = `
SELECT full_name, name, owner, url, description, tags, language,
       stars, contributors, pushed_at, archived, category, score, scored_at, score_version,
       is_featured, is_insider, is_official, is_risky, risk_note, first_seen_at, last_synced_at,
       install_cmd, install_kind, install_cmd_auto, pkg_name, pkg_version,
       npm_published, npm_latest_version, npm_repo_backlink, npm_desktop_installable,
       release_tgz_url, release_tag, install_probed_at, is_plugin
FROM plugins
WHERE is_present = 1 AND is_offtopic = 0
ORDER BY is_risky ASC, is_featured * featured_boost DESC, stars DESC, full_name`;

// 与桌面端适配器审查口径逐字一致（store/plugins.go 的同名 pattern）。
const npmPackagePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const stableSemverPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const DESKTOP_FIRST_WAVE_MAX = 200;

/** NULL/空串 → null（对齐 Go 侧 sql.NullString + 非空判断的指针语义）。 */
const orNull = (v) => (v === null || v === undefined || v === "" ? null : String(v));
const toBool = (v) => Number(v) !== 0;

/** 等级线与 scripts/lib/scoring.mjs、store/plugins.go gradeOf 一致。 */
function gradeOf(score) {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  return "C";
}

function parseTags(raw) {
  if (!raw) return [];
  try {
    const tags = JSON.parse(raw);
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

/** 复刻 store/plugins.go buildInstall：cmd 取 manual 优先，methods 仅复核通过才发。 */
function buildInstall(r) {
  const install = {
    cmd: null,
    source: "",
    kind: orNull(r.install_kind),
    pkg_name: orNull(r.pkg_name),
  };
  const pkgVersion = orNull(r.pkg_version);
  if (pkgVersion !== null) install.pkg_version = pkgVersion;
  install.npm_published = toBool(r.npm_published);
  const tgz = orNull(r.release_tgz_url);
  if (tgz !== null) install.release_tgz_url = tgz;
  const relTag = orNull(r.release_tag);
  if (relTag !== null) install.release_tag = relTag;
  const npmLatest = orNull(r.npm_latest_version);
  const pkgName = orNull(r.pkg_name);
  if (
    toBool(r.npm_desktop_installable) &&
    npmLatest !== null && stableSemverPattern.test(npmLatest) &&
    pkgName !== null && npmPackagePattern.test(pkgName)
  ) {
    install.methods = [{
      kind: "npm",
      verification: "verified",
      code: "repository_backlink",
      requiresBuildAllowance: false,
      spec: pkgName,
      revision: npmLatest,
    }];
  }
  install.probed_at = orNull(r.install_probed_at);
  const manual = orNull(r.install_cmd);
  const auto = orNull(r.install_cmd_auto);
  if (manual !== null) {
    install.cmd = manual;
    install.source = "manual";
  } else if (auto !== null) {
    install.cmd = auto;
    install.source = "auto";
  }
  return install;
}

/** 行 → 与 store.Plugin json 标签同序的对象。JS 对象保持插入序，序列化即 Go 的字段序。 */
function toPlugin(r) {
  const score = r.score === null || r.score === undefined ? null : Number(r.score);
  return {
    full_name: r.full_name,
    name: r.name,
    owner: r.owner,
    url: r.url,
    repository_url: r.url,
    description: r.description ?? "",
    tags: parseTags(r.tags),
    language: r.language ?? "",
    stars: Number(r.stars),
    contributors: r.contributors === null || r.contributors === undefined ? null : Number(r.contributors),
    pushed_at: orNull(r.pushed_at),
    archived: toBool(r.archived),
    category: r.category ?? "",
    score,
    grade: score === null ? null : gradeOf(score),
    scored_at: orNull(r.scored_at),
    score_version: orNull(r.score_version),
    is_featured: toBool(r.is_featured),
    is_official: toBool(r.is_official),
    is_insider: toBool(r.is_insider),
    is_risky: toBool(r.is_risky),
    risk_note: orNull(r.risk_note),
    is_plugin: r.is_plugin === null || r.is_plugin === undefined ? null : toBool(r.is_plugin),
    install: buildInstall(r),
    first_seen_at: orNull(r.first_seen_at),
    last_synced_at: orNull(r.last_synced_at),
  };
}

/** encoding/json 默认做 HTML 转义；< > & 与 U+2028/29 只会出现在字符串值里，全局替换安全。 */
function goJSON(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** 复刻 cache.datasetMetadata 的 as_of：三个时间字段的全局最大值，秒精度 RFC3339。 */
function computeAsOf(plugins) {
  let max = null;
  for (const p of plugins) {
    for (const raw of [p.last_synced_at, p.scored_at, p.install.probed_at]) {
      if (!raw) continue;
      const t = Date.parse(raw);
      if (!Number.isNaN(t) && (max === null || t > max)) max = t;
    }
  }
  const at = max === null ? new Date() : new Date(max);
  return at.toISOString().replace(/\.\d{3}Z$/, "Z");
}

// ── /market/v1/plugins 契约（server/internal/httpapi/market.go）────────────────
// 桌面端市场的「标准目录源」契约，schema 是 additionalProperties:false，字段与
// 顺序都不能有半点出入。这里逐函数复刻 buildMarketItem 及其三个辅助函数。
// 注意 Go 的 len(string) 是**字节数**（id/pkg_name/category/url 的上限），而
// truncateRunes 按码点截断（schema maxLength 以字符计）——两种口径别混。

const MARKET_SUMMARY_MAX = 1000;
const marketIDPattern = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$/;
const categoryIDPattern = /^[a-z0-9][a-z0-9._:-]*$/;
const bytes = (s) => Buffer.byteLength(s, "utf8");

/** Go unicode.IsSpace 的字符集。JS 的 trim() 与它有出入（多 U+FEFF、少 U+0085），故手写。 */
function goIsSpace(c) {
  return (
    c === 0x20 || (c >= 0x09 && c <= 0x0d) || c === 0x85 || c === 0xa0 ||
    c === 0x1680 || (c >= 0x2000 && c <= 0x200a) ||
    c === 0x2028 || c === 0x2029 || c === 0x202f || c === 0x205f || c === 0x3000
  );
}

/** 复刻 plainMarketText：剔除 schema plainText 禁止的控制字符与 bidi 控制符，再 TrimSpace。 */
function plainMarketText(s) {
  const kept = [];
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (
      c < 0x20 || (c >= 0x7f && c <= 0x9f) ||
      (c >= 0x202a && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069)
    ) continue;
    kept.push(ch);
  }
  let i = 0;
  let j = kept.length;
  while (i < j && goIsSpace(kept[i].codePointAt(0))) i++;
  while (j > i && goIsSpace(kept[j - 1].codePointAt(0))) j--;
  return kept.slice(i, j).join("");
}

/** 复刻 truncateRunes：按码点截断，不切断多字节字符。 */
function truncateRunes(s, max) {
  const runes = [...s];
  return runes.length <= max ? s : runes.slice(0, max).join("");
}

/** 复刻 validMarketHTTPSURL：https 前缀、无 fragment、authority 无 userinfo 无端口。 */
function validMarketHTTPSURL(u) {
  if (u === "" || bytes(u) > 2048 || !u.startsWith("https://") || u.includes("#")) return false;
  let authority = u.slice("https://".length);
  const i = authority.search(/[/?]/);
  if (i >= 0) authority = authority.slice(0, i);
  return authority !== "" && !authority.includes("@") && !authority.includes(":");
}

/**
 * 复刻 time.Parse(RFC3339).Format(RFC3339)：丢掉小数秒，零偏移一律写成 Z
 * （RFC3339 布局里的 "Z07:00" 就是这个语义）。解析失败 → Go 跳过该字段。
 */
function goRFC3339(raw) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/.exec(raw);
  if (!m) return null;
  const zone = /^[Zz]$/.test(m[7]) || /^[+-]00:00$/.test(m[7]) ? "Z" : m[7];
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${zone}`;
}

/**
 * 复刻 buildMarketItem。返回 null = 该条无法满足 schema 必填约束，整项跳过。
 * 键的插入顺序即 marketItem 的 struct 字段序，不能按代码可读性重排。
 */
function buildMarketItem(r) {
  const id = r.full_name;
  if (bytes(id) > 160 || !marketIDPattern.test(id)) return null;

  let name = truncateRunes(plainMarketText(r.name ?? ""), 160);
  if (name === "") name = truncateRunes(plainMarketText(r.full_name), 160);
  if (name === "") return null;

  let summary = truncateRunes(plainMarketText(r.description ?? ""), MARKET_SUMMARY_MAX);
  if (summary === "") summary = truncateRunes(name, 120);

  // store.Plugin 的 RepositoryURL 与 URL 都取 url 列，Go 侧的 "" 兜底恒不触发。
  const repoURL = r.url ?? "";
  const repository = validMarketHTTPSURL(repoURL) ? { url: repoURL } : null;

  // npm 安装信息门控：只看 npm_desktop_installable + 非空版本 + 包名合法。
  // 注意这里**不要求**稳定版 semver（buildInstall 的 methods 才要），别顺手对齐。
  let pkg = null;
  let latestVersion = "";
  const npmLatest = orNull(r.npm_latest_version);
  const pkgName = orNull(r.pkg_name);
  if (
    toBool(r.npm_desktop_installable) && npmLatest !== null &&
    pkgName !== null && bytes(pkgName) <= 214 && npmPackagePattern.test(pkgName)
  ) {
    pkg = { registry: "npm", name: pkgName };
    latestVersion = truncateRunes(npmLatest, 64);
  }

  // publisher.url 拼的是**原始** owner，不是 plainMarketText 洗过的那个。
  let publisher = null;
  const owner = truncateRunes(plainMarketText(r.owner ?? ""), 120);
  if (owner !== "") {
    publisher = { name: owner };
    const u = "https://github.com/" + (r.owner ?? "");
    if (validMarketHTTPSURL(u)) publisher.url = u;
  }

  const category = r.category ?? "";
  const categories =
    category !== "" && bytes(category) <= 64 && categoryIDPattern.test(category)
      ? [category]
      : null;

  const updatedAt = r.pushed_at ? goRFC3339(String(r.pushed_at)) : null;

  // schema anyOf：repository 与 package 至少其一。
  if (repository === null && pkg === null) return null;

  const item = { id, name, displayName: truncateRunes(name, 120), summary };
  if (repository !== null) item.repository = repository;
  if (pkg !== null) item.package = pkg;
  if (publisher !== null) item.publisher = publisher;
  if (categories !== null) item.categories = categories;
  if (latestVersion !== "") item.latestVersion = latestVersion;
  if (updatedAt !== null && updatedAt !== "") item.updatedAt = updatedAt;
  return item;
}

const db = openDb();
const { rows } = await db.execute(LOAD_SQL);
const plugins = rows.map(toPlugin);
const items = plugins.map(goJSON);

// 与 Go 一致：版本号 = sha256(json.Marshal(整个数组))。条目字节相同则版本相同。
const arrayBytes = "[" + items.join(",") + "]";
const version = "sha256:" + createHash("sha256").update(arrayBytes, "utf8").digest("hex");
const asOf = computeAsOf(plugins);

// 桌面首屏：剔除确认非插件（is_plugin=false；null 未知保留），截前 200 条，快照原序。
const desktopItems = [];
for (let i = 0; i < plugins.length && desktopItems.length < DESKTOP_FIRST_WAVE_MAX; i++) {
  if (plugins[i].is_plugin === false) continue;
  desktopItems.push(items[i]);
}

// ── /v1/suggest 检索索引（server/internal/cache/plugins.go）────────────────────
// hay 的口径是 lower(full_name + " " + description + " " + tags.join(" "))，
// **不含 language**（那是列表用的 ListHay）。顺序必须与快照一致：Suggest 是
// 顺序扫描、命中 10 条即停，顺序变了返回的就是另一批。
const suggestItems = plugins.map((p) =>
  goJSON({
    type: "plugin",
    id: p.full_name,
    label: p.name,
    // description 为空时退回 "@owner"
    sub: p.description === "" ? "@" + p.owner : p.description,
    // 站内相对路径，locale 前缀由前端 next-intl router 补
    href: "/plugins/" + p.full_name,
    stars: p.stars,
    featured: p.is_featured,
  }),
);
const suggestHay = plugins.map((p) =>
  (p.full_name + " " + p.description + " " + p.tags.join(" ")).toLowerCase(),
);

// ── /v1/plugins 的过滤与排序面（server/internal/httpapi/plugins.go）────────────
// 14 个过滤条件 + 4 种排序全靠这一份。用平行数组而不是对象数组：11,633 行
// 每行重复一遍键名，光键名就要几 MB。Worker 只在请求真带了过滤/排序参数时
// 才加载解析它（线上占 /v1/plugins 流量的极小一部分）。
//
// ListHay 的口径是 suggest 的 hay **再加一段 language**（cache/plugins.go:135），
// 对齐 /search 页「搜 python 能按语言命中」的既有行为。这里不复用 suggestHay
// 拼接是有意的：跨 hay 与 language 边界的关键词必须能命中，运行时拼会多一次
// 每行分配，直接存全串更省事。
const FLAG_FEATURED = 1;
const FLAG_OFFICIAL = 2;
const FLAG_ARCHIVED = 4;
const FLAG_INSIDER = 8;
const FLAG_RISKY = 16;
const FLAG_HAS_INSTALL = 32;

const listFacets = {
  // EqualFold 的字段一律存小写，比较时两边都转小写——owner 是 GitHub 登录名、
  // language 是英文，简单小写与 Unicode 折叠等价。
  category: plugins.map((p) => p.category),
  language: plugins.map((p) => p.language.toLowerCase()),
  grade: plugins.map((p) => p.grade),
  owner: plugins.map((p) => p.owner.toLowerCase()),
  tags: plugins.map((p) => p.tags.map((t) => String(t).toLowerCase())),
  score: plugins.map((p) => p.score),
  // 六个二值标记压成一个位掩码，省下 11,633 × 6 个 JSON 布尔字面量。
  flags: plugins.map(
    (p) =>
      (p.is_featured ? FLAG_FEATURED : 0) |
      (p.is_official ? FLAG_OFFICIAL : 0) |
      (p.archived ? FLAG_ARCHIVED : 0) |
      (p.is_insider ? FLAG_INSIDER : 0) |
      (p.is_risky ? FLAG_RISKY : 0) |
      (p.install.cmd !== null ? FLAG_HAS_INSTALL : 0),
  ),
  // is_plugin 是三态，不能塞进位掩码：null 表示「未知」，传 is_plugin=1 时不匹配。
  isPlugin: plugins.map((p) => (p.is_plugin === null ? null : p.is_plugin ? 1 : 0)),
  hay: plugins.map((p, i) => suggestHay[i] + " " + p.language.toLowerCase()),
  // 排序用：sort=updated 比的是 pushed_at 字典序（ISO8601 即时间序），null 当空串。
  stars: plugins.map((p) => p.stars),
  pushedAt: plugins.map((p) => p.pushed_at ?? ""),
  nameLower: plugins.map((p) => p.name.toLowerCase()),
  fullName: plugins.map((p) => p.full_name),
};

// ── /graphql 的 pluginFacets 预计算（httpapi/graphql.go graphFacetValues）─────
// facet 计数只依赖快照本身，与查询无关，生成期算一次省掉每请求全表扫描。
// 排序口径：count 降序、value 升序；Go 的 string < 是**字节序**，tags 可能含
// 非 ASCII，用 Buffer.compare 而不是 JS 默认的 UTF-16 码元比较。
function sortedFacets(counts) {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) =>
      a.count !== b.count
        ? b.count - a.count
        : Buffer.compare(Buffer.from(a.value, "utf8"), Buffer.from(b.value, "utf8")),
    );
}
const facetCounts = { categories: new Map(), languages: new Map(), tags: new Map(), grades: new Map() };
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
for (const p of plugins) {
  if (p.category !== "") bump(facetCounts.categories, p.category);
  if (p.language !== "") bump(facetCounts.languages, p.language);
  for (const tag of p.tags) if (tag !== "") bump(facetCounts.tags, tag);
  if (p.grade !== null) bump(facetCounts.grades, p.grade);
}
const graphqlFacets = {
  categories: sortedFacets(facetCounts.categories),
  languages: sortedFacets(facetCounts.languages),
  tags: sortedFacets(facetCounts.tags),
  grades: sortedFacets(facetCounts.grades),
};

// ── /v1/plugins/{owner}/{repo} 的查找索引 ─────────────────────────────────────
// Go 用 snap.ByFullName[lower(fullName)]，详情查找大小写不敏感。这里只存
// 「小写 full_name → 行号」；条目本体、canonical full_name、stars、contributors
// 都从那一行现取——详情是低频端点（~44 次/天），单行 JSON.parse 完全划算，
// 犯不上为它再冗余一份字段。
const detailIndex = {};
plugins.forEach((p, i) => {
  detailIndex[p.full_name.toLowerCase()] = i;
});

// ── /v1/catalog 的 ETag（server/internal/httpapi/catalog.go）───────────────────
// 整包响应体完全由产物决定，ETag 在这里算好，Worker 就不必每次对 11MB 做
// sha256（Go 那边每次都算，我们没必要跟着付这个 CPU）。
const catalogBody =
  `{"data":[${items.join(",")}],"total":${items.length},` +
  `"data_version":"${version}","as_of":"${asOf}","generated_at":"${asOf}"}`;
const catalogEtag = '"' + createHash("sha256").update(catalogBody, "utf8").digest("hex") + '"';

// market 契约：只收 is_plugin 确认为真的条目（null 未知与确认非插件都排除），
// 按 full_name 升序。Go 用 sort.Slice + string < 比的是 UTF-8 字节序，这里照做——
// full_name 目前全 ASCII，但别把口径寄托在数据现状上。
const marketRows = rows
  .filter((r) => r.is_plugin !== null && r.is_plugin !== undefined && toBool(r.is_plugin))
  .sort((a, b) =>
    Buffer.compare(Buffer.from(a.full_name, "utf8"), Buffer.from(b.full_name, "utf8")),
  );

// 过不了 schema 的条目写 "null" 占位而不是删行：Go 的 total 数的是**过滤后**的
// 条目数（buildMarketItem 之前），游标偏移也按这个口径走。删行会让两者都偏。
const marketItems = marketRows.map((r) => {
  const item = buildMarketItem(r);
  return item === null ? "null" : goJSON(item);
});

// 过滤面产物：category 原值 + 小写 name/description。q 在 Go 侧是对 name 与
// description **分别** Contains，所以两条数组不能拼成一条（拼接会让跨边界的
// 关键词假命中）。Worker 只在请求带 q/category 时才加载解析这个文件。
const marketFilters = {
  categories: marketRows.map((r) => r.category ?? ""),
  names: marketRows.map((r) => (r.name ?? "").toLowerCase()),
  descs: marketRows.map((r) => (r.description ?? "").toLowerCase()),
};

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "catalog-full.ndjson"), items.join("\n") + "\n");
writeFileSync(resolve(outDir, "catalog-desktop.ndjson"), desktopItems.join("\n") + "\n");
writeFileSync(resolve(outDir, "market-items.ndjson"), marketItems.join("\n") + "\n");
writeFileSync(resolve(outDir, "market-filters.json"), JSON.stringify(marketFilters) + "\n");
writeFileSync(resolve(outDir, "suggest-items.ndjson"), suggestItems.join("\n") + "\n");
writeFileSync(resolve(outDir, "suggest-hay.json"), JSON.stringify(suggestHay) + "\n");
writeFileSync(resolve(outDir, "list-facets.json"), JSON.stringify(listFacets) + "\n");
writeFileSync(resolve(outDir, "detail-index.json"), JSON.stringify(detailIndex) + "\n");
writeFileSync(resolve(outDir, "graphql-facets.json"), JSON.stringify(graphqlFacets) + "\n");
writeFileSync(
  resolve(outDir, "meta.json"),
  JSON.stringify({
    data_version: version,
    as_of: asOf,
    total_full: items.length,
    total_desktop: desktopItems.length,
    total_market: marketItems.length,
    catalog_etag: catalogEtag,
    generated_at: new Date().toISOString(),
  }) + "\n",
);
console.log(`完整目录 ${items.length} 条，桌面首屏 ${desktopItems.length} 条`);
console.log(
  `market 契约 ${marketItems.length} 条（其中 ${marketItems.filter((l) => l === "null").length} 条不过 schema 被跳过）`,
);
console.log(`data_version: ${version}`);
console.log(`as_of: ${asOf}`);
