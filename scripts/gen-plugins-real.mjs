#!/usr/bin/env node
/**
 * 由 dsh-external/hub 的 catalog.json 生成 src/lib/plugins-real.ts。
 *
 * 用法：
 *   node scripts/gen-plugins-real.mjs                            # 用 gh CLI 直接拉取（需 read:org 权限）
 *   node scripts/gen-plugins-real.mjs ./catalog.json ./club.json # 用本地文件
 *
 * catalog.json 由 hub 仓库 CI 自动生成，是插件清单的唯一真相来源。
 * 星标数、最后推送时间和插件版本来自 dsh-club 的每日快照（同一批仓库的另一个视角）。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/lib/plugins-real.ts");

function ghJson(path) {
  const b64 = execFileSync("gh", ["api", path, "--jq", ".content"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

function loadCatalog(localPath) {
  if (localPath) return JSON.parse(readFileSync(resolve(localPath), "utf8"));
  return ghJson("repos/dsh-external/hub/contents/catalog.json");
}

/** dsh-club 最新快照，仅用于补充 star / pushedAt / 插件版本。 */
function loadClub(localPath) {
  if (localPath) return JSON.parse(readFileSync(resolve(localPath), "utf8"));
  const files = execFileSync(
    "gh",
    ["api", "repos/dsh-external/dsh-club/contents/data/snapshots", "--jq", ".[].name"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  )
    .trim()
    .split("\n")
    .filter((n) => n.endsWith(".json"))
    .sort();
  return ghJson(`repos/dsh-external/dsh-club/contents/data/snapshots/${files[files.length - 1]}`);
}

const catalog = loadCatalog(process.argv[2]);
const club = loadClub(process.argv[3]);
const clubRepos = new Map(club.repos.map((r) => [r.name, r]));
const clubPlugins = new Map(club.plugins.map((p) => [p.repo, p]));
const repos = catalog.repos.filter((r) => !r.hide);

// 分类按 catalog 自带的 order 排；catalog 未声明但被引用的分类（如 _uncategorized）补在末尾。
const declared = Object.entries(catalog.categories)
  .sort((a, b) => a[1].order - b[1].order)
  .map(([id, meta]) => ({ id, title: meta.title, emoji: meta.emoji }));
const extras = [...new Set(repos.map((r) => r.category))]
  .filter((id) => !catalog.categories[id])
  .map((id) => ({ id, title: id === "_uncategorized" ? "待归类" : id, emoji: "📦" }));
const categories = [...declared, ...extras];

const plugins = repos
  .map((r) => ({
    name: r.name,
    url: r.url,
    description: r.note || r.description || "",
    category: r.category,
    tags: r.tags ?? [],
    language: r.language ?? "",
    isSkill: Boolean(r.skill),
    isBundle: Boolean(r.bundle),
    stars: clubRepos.get(r.name)?.stars ?? 0,
    pushedAt: r.pushedAt ?? clubRepos.get(r.name)?.pushedAt ?? "",
    version: clubPlugins.get(r.name)?.pluginVersion ?? "",
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

const line = (p) =>
  `  { name: ${JSON.stringify(p.name)}, url: ${JSON.stringify(p.url)}, description: ${JSON.stringify(p.description)}, category: ${JSON.stringify(p.category)}, tags: [${p.tags.map((t) => JSON.stringify(t)).join(",")}], language: ${JSON.stringify(p.language)}, isSkill: ${p.isSkill}, isBundle: ${p.isBundle}, stars: ${p.stars}, pushedAt: ${JSON.stringify(p.pushedAt)}, version: ${JSON.stringify(p.version)} },`;

const source = `// 由 scripts/gen-plugins-real.mjs 从 dsh-external/hub 的 catalog.json 生成——请勿手改。
// catalog 生成时间：${catalog.generated}
// 数据源：https://github.com/dsh-external/hub （组织私有，catalog.json 由 CI 自动生成）
import type { RealPlugin, PluginCategory } from "./types";

export const pluginCategories: PluginCategory[] = [
${categories.map((c) => `  { id: ${JSON.stringify(c.id)}, title: ${JSON.stringify(c.title)}, emoji: ${JSON.stringify(c.emoji)} },`).join("\n")}
];

export const realPlugins: RealPlugin[] = [
${plugins.map(line).join("\n")}
];
`;

writeFileSync(out, source);
console.log(`wrote ${out}: ${plugins.length} plugins, ${categories.length} categories (catalog ${catalog.generated})`);
