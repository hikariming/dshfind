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
 *   meta.json              data_version / as_of / 行数
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

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "catalog-full.ndjson"), items.join("\n") + "\n");
writeFileSync(resolve(outDir, "catalog-desktop.ndjson"), desktopItems.join("\n") + "\n");
writeFileSync(
  resolve(outDir, "meta.json"),
  JSON.stringify({
    data_version: version,
    as_of: asOf,
    total_full: items.length,
    total_desktop: desktopItems.length,
    generated_at: new Date().toISOString(),
  }) + "\n",
);
console.log(`完整目录 ${items.length} 条，桌面首屏 ${desktopItems.length} 条`);
console.log(`data_version: ${version}`);
console.log(`as_of: ${asOf}`);
