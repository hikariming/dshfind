#!/usr/bin/env node
/**
 * 由 GitHub topic `dsh-plugin` 生成 src/lib/plugins-real.ts。
 *
 * 用法：
 *   node scripts/gen-plugins-real.mjs              # 用 gh CLI 拉取（无需特殊权限）
 *   node scripts/gen-plugins-real.mjs ./repos.json # 用本地 search API 响应
 *
 * 唯一真相来源：https://github.com/topics/dsh-plugin
 *
 * 注意 is:public——search API 带 token 时会连同调用者有权限的私有库一起返回，
 * 而站点访客点开那些链接只会 404。这里只取公开库，保证列出的每个仓库都能打开。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/lib/plugins-real.ts");

const TOPIC = "dsh-plugin";

/** 每个仓库都带的生态标记，对区分插件没有信息量，不进标签。 */
const MARKER_TOPICS = new Set([
  TOPIC,
  "dsh",
  "dshx",
  "deepseek",
  "deepseek-harness",
  "deepseekharness",
  "deepseek-harness-plugin",
  "deepseek-harness-plugins",
  "dsh-plugins",
  "dshtopic",
]);

function fetchRepos() {
  const raw = execFileSync(
    "gh",
    [
      "api",
      "--paginate",
      `search/repositories?q=topic:${TOPIC}+is:public&per_page=100`,
      "--jq",
      ".items[]",
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function loadRepos(localPath) {
  if (!localPath) return fetchRepos();
  const parsed = JSON.parse(readFileSync(resolve(localPath), "utf8"));
  return Array.isArray(parsed) ? parsed : parsed.items;
}

const repos = loadRepos(process.argv[2]);

// 同名仓库可能来自不同作者，用 full_name 去重才不会互相覆盖。
const seen = new Set();
const plugins = repos
  .filter((r) => {
    if (seen.has(r.full_name)) return false;
    seen.add(r.full_name);
    return true;
  })
  .map((r) => ({
    name: r.name,
    owner: r.owner.login,
    fullName: r.full_name,
    url: r.html_url,
    description: (r.description ?? "").trim(),
    tags: (r.topics ?? []).filter((t) => !MARKER_TOPICS.has(t)).slice(0, 8),
    language: r.language ?? "",
    stars: r.stargazers_count ?? 0,
    pushedAt: r.pushed_at ?? "",
    archived: Boolean(r.archived),
  }))
  // 默认按星标降序，同星标按仓库名——首页取 top 6 直接切这个顺序即可。
  .sort(
    (a, b) => b.stars - a.stars || a.fullName.localeCompare(b.fullName, "en"),
  );

const line = (p) =>
  `  { name: ${JSON.stringify(p.name)}, owner: ${JSON.stringify(p.owner)}, fullName: ${JSON.stringify(p.fullName)}, url: ${JSON.stringify(p.url)}, description: ${JSON.stringify(p.description)}, tags: [${p.tags.map((t) => JSON.stringify(t)).join(",")}], language: ${JSON.stringify(p.language)}, stars: ${p.stars}, pushedAt: ${JSON.stringify(p.pushedAt)}, archived: ${p.archived} },`;

const owners = new Set(plugins.map((p) => p.owner));
const languages = [...new Set(plugins.map((p) => p.language).filter(Boolean))]
  .map((lang) => ({ lang, n: plugins.filter((p) => p.language === lang).length }))
  .sort((a, b) => b.n - a.n || a.lang.localeCompare(b.lang, "en"))
  .map((x) => x.lang);

const source = `// 由 scripts/gen-plugins-real.mjs 从 GitHub topic \`${TOPIC}\` 生成——请勿手改。
// 数据源：https://github.com/topics/${TOPIC} （只取公开仓库）
// 抓取时间：${new Date().toISOString()}
import type { RealPlugin } from "./types";

/** 出现过的语言，按仓库数降序——插件页的语言筛选直接用这个顺序。 */
export const pluginLanguages: string[] = [
${languages.map((l) => `  ${JSON.stringify(l)},`).join("\n")}
];

/** 发布过插件的作者数（GitHub 账号去重）。 */
export const pluginAuthorCount = ${owners.size};

export const realPlugins: RealPlugin[] = [
${plugins.map(line).join("\n")}
];
`;

writeFileSync(out, source);
console.log(
  `wrote ${out}: ${plugins.length} plugins, ${owners.size} authors, ${languages.length} languages`,
);
