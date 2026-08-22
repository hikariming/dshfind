#!/usr/bin/env node
/**
 * 同步官方文档到 Turso docs_pages，并导出待翻译清单。
 *
 * 上游 deepseek-ai/deepseek-harness 是 MIT，docs 含在内，转载与翻译合法，
 * 前提是保留出处与许可声明——页面上的声明栏由 src/app/[locale]/docs 负责渲染。
 *
 * 上游命名约定：<name>.md 为英文、<name>.zh.md 为中文、<name>.i18n.yaml 是它们
 * 自己的翻译元数据（我们不用）。官方没有任何 ja/ko 文档，那部分是我们独有的增量。
 *
 * 流程（与 score-plugins / collect-i18n-candidates 同构）：
 *   1. 本脚本拉取 PINNED_SHA 的 en/zh 原文入库，并导出 ja/ko 待翻译清单
 *   2. AI 逐篇翻译 → translations.json
 *   3. scripts/apply-docs-translations.mjs 写回
 *
 * 用法：
 *   node --env-file=.env.local scripts/sync-official-docs.mjs <out-candidates.json> \
 *        [--section=develop] [--limit=20]
 */
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@libsql/client/web";

import { DOC_SECTIONS, PINNED_SHA, UPSTREAM_REPO } from "./lib/docs-sections.mjs";

const args = process.argv.slice(2);
const outPath = args.find((a) => !a.startsWith("--"));
const opt = (n, d) => {
  const v = args.find((a) => a.startsWith(`--${n}=`));
  return v ? v.slice(n.length + 3) : d;
};
if (!outPath) {
  console.error(
    "用法：sync-official-docs.mjs <out.json> [--section=<id>] [--limit=N]",
  );
  process.exit(1);
}
const onlySection = opt("section", null);
const limit = Number(opt("limit", "0")) || Infinity;

const client = createClient({
  url: process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://"),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/** 走 gh CLI 而不是裸 fetch：复用用户已有的 GitHub 鉴权，绕开匿名限流。 */
function gh(path) {
  return JSON.parse(
    execFileSync("gh", ["api", path], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
}

function ghRaw(path) {
  const res = gh(path);
  if (res.encoding !== "base64") throw new Error(`意外的编码：${res.encoding}`);
  return Buffer.from(res.content, "base64").toString("utf8");
}

const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/** 取 Markdown 首个 H1 作标题；没有就用 slug 兜底。 */
function extractTitle(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim().replace(/\s*\{#.*\}\s*$/, "") : fallback;
}

/** 取第一段正文当摘要（meta description 用），去掉标题与代码块。 */
function extractSummary(md) {
  const body = md
    .replace(/^---[\s\S]*?---\n/, "")
    .replace(/^#\s+.+$/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^>\s.*$/gm, "");
  for (const para of body.split(/\n\s*\n/)) {
    const t = para.replace(/\s+/g, " ").trim();
    // 跳过列表、表格、指令行等非叙述段落
    if (t && !/^[-*|#<:]/.test(t) && t.length > 30) return t.slice(0, 300);
  }
  return null;
}

console.log(`上游 ${UPSTREAM_REPO} @ ${PINNED_SHA.slice(0, 8)}`);
const tree = gh(
  `repos/${UPSTREAM_REPO}/git/trees/${PINNED_SHA}?recursive=1`,
).tree;

const now = new Date().toISOString();
const stmts = [];
const candidates = [];
let scanned = 0;

for (const section of DOC_SECTIONS) {
  if (onlySection && section.id !== onlySection) continue;

  // 同一主题的英/中两个文件：x.md 与 x.zh.md
  const files = tree
    .filter(
      (t) =>
        t.type === "blob" &&
        t.path.startsWith(section.upstream + "/") &&
        t.path.endsWith(".md") &&
        !t.path.endsWith(".zh.md"),
    )
    .sort((a, b) => a.path.localeCompare(b.path));

  let order = 0;
  for (const f of files) {
    if (scanned >= limit) break;
    // docs/user/develop/basic/tool.md → basic/tool；index.md → 目录自身
    const rel = f.path
      .slice(section.upstream.length + 1)
      .replace(/\.md$/, "");
    const slug = rel === "index" ? "index" : rel.replace(/\/index$/, "");
    order += 10;

    const en = ghRaw(`repos/${UPSTREAM_REPO}/contents/${f.path}?ref=${PINNED_SHA}`);
    const zhPath = f.path.replace(/\.md$/, ".zh.md");
    const hasZh = tree.some((t) => t.path === zhPath);
    const zh = hasZh
      ? ghRaw(`repos/${UPSTREAM_REPO}/contents/${zhPath}?ref=${PINNED_SHA}`)
      : null;

    const upsert = (locale, title, summary, body, srcPath, translated) => ({
      sql: `INSERT INTO docs_pages
              (section, slug, locale, title, summary, body, source_path,
               source_sha, source_hash, is_translated, nav_order, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(section, slug, locale) DO UPDATE SET
              title=excluded.title, summary=excluded.summary, body=excluded.body,
              source_path=excluded.source_path, source_sha=excluded.source_sha,
              source_hash=excluded.source_hash, nav_order=excluded.nav_order,
              updated_at=excluded.updated_at`,
      args: [
        section.id, slug, locale, title, summary, body, srcPath,
        PINNED_SHA, hash(body), translated ? 1 : 0, order, now,
      ],
    });

    stmts.push(
      upsert("en", extractTitle(en, slug), extractSummary(en), en, f.path, false),
    );
    if (zh) {
      stmts.push(
        upsert("zh", extractTitle(zh, slug), extractSummary(zh), zh, zhPath, false),
      );
    }

    // ja/ko 待翻译：以中文版为源（术语更贴近生态），没有中文就用英文
    candidates.push({
      section: section.id,
      slug,
      navOrder: order,
      sourceLocale: zh ? "zh" : "en",
      sourcePath: zh ? zhPath : f.path,
      sourceHash: hash(zh ?? en),
      title: extractTitle(zh ?? en, slug),
      body: zh ?? en,
    });
    scanned++;
  }
}

// 已入库且 source_hash 未变的 ja/ko 不必重译
const existing = new Map(
  (
    await client.execute(
      "SELECT section, slug, locale, source_hash FROM docs_pages WHERE is_translated = 1",
    )
  ).rows.map((r) => [`${r.section}/${r.slug}/${r.locale}`, r.source_hash]),
);

const todo = [];
for (const c of candidates) {
  const need = ["ja", "ko"].filter(
    (l) => existing.get(`${c.section}/${c.slug}/${l}`) !== c.sourceHash,
  );
  if (need.length) todo.push({ ...c, need });
}

if (stmts.length) {
  for (let i = 0; i < stmts.length; i += 40) {
    await client.batch(stmts.slice(i, i + 40), "write");
  }
}

writeFileSync(
  outPath,
  JSON.stringify(
    { pinnedSha: PINNED_SHA, generatedAt: now, count: todo.length, pages: todo },
    null,
    2,
  ) + "\n",
);

console.log(`✅ 入库 en/zh：${stmts.length} 条`);
console.log(`✅ 待翻译 ja/ko：${todo.length} 篇 → ${outPath}`);
const chars = todo.reduce((n, p) => n + p.body.length, 0);
console.log(`   源文合计 ${(chars / 1000).toFixed(1)}k 字符`);
