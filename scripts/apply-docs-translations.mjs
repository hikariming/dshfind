#!/usr/bin/env node
/**
 * 把 AI 翻译好的文档写进 Turso docs_pages。
 *
 * 输入 JSON（sync-official-docs.mjs 导出的候选逐篇翻译后的结果）：
 *   { "<section>/<slug>": {
 *       "sourceHash": "…",            // 必须与候选里的一致，防止源文改了却写旧译文
 *       "ja": { "title": "…", "summary": "…", "body": "…" },
 *       "ko": { … } }, … }
 *
 * 用法：
 *   node --env-file=.env.local scripts/apply-docs-translations.mjs <translations.json> [--dry]
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client/web";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry");
if (!file) {
  console.error("用法：apply-docs-translations.mjs <translations.json> [--dry]");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://"),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const data = JSON.parse(readFileSync(file, "utf8"));
const now = new Date().toISOString();

/**
 * 上游文档尾部常有 `<!-- BEGIN GENERATED cordis-surface -->` 生成块：
 * 那段是脚本从源码抽出来的 API 签名与 JSDoc，**四种语言逐字相同**
 * （上游自己也这么说：语言侧只有配对文档路径不同）。
 *
 * 让译文重打一遍毫无意义，还容易在几千字符的代码块里手滑。
 * 所以译文只需留一行 `<!-- KEEP-GENERATED -->` 占位，这里从中文原文
 * 原样搬过来——既省事又保证与上游逐字一致。
 */
const KEEP = "<!-- KEEP-GENERATED -->";
const GENERATED_RE =
  /<!-- BEGIN GENERATED cordis-surface[\s\S]*?<!-- END GENERATED cordis-surface -->/;

const sourceBodies = new Map(
  (
    await client.execute(
      "SELECT section, slug, body FROM docs_pages WHERE locale = 'zh'",
    )
  ).rows.map((r) => [`${r.section}/${r.slug}`, String(r.body)]),
);

function spliceGenerated(key, body) {
  if (!body.includes(KEEP)) return body;
  const src = sourceBodies.get(key);
  const block = src ? GENERATED_RE.exec(src)?.[0] : null;
  if (!block) {
    // 占位符没有对应的生成块——留着它比悄悄塞进一段空白强，会在校验时暴露
    console.error(`⚠️  ${key} 用了 ${KEEP} 但中文原文里找不到生成块`);
    return body;
  }
  return body.replace(KEEP, block);
}

// nav_order / source_path 沿用 en 行——译文与原文是同一篇，不该各自维护一套导航序
const meta = new Map(
  (
    await client.execute(
      "SELECT section, slug, source_path, source_sha, nav_order FROM docs_pages WHERE locale = 'en'",
    )
  ).rows.map((r) => [`${r.section}/${r.slug}`, r]),
);

const stmts = [];
const skipped = [];
for (const [key, entry] of Object.entries(data)) {
  const base = meta.get(key);
  if (!base) {
    skipped.push(`${key}（en 行不存在，先跑 sync-official-docs）`);
    continue;
  }
  const i = key.indexOf("/");
  const section = key.slice(0, i);
  const slug = key.slice(i + 1);

  for (const locale of ["ja", "ko"]) {
    const t = entry[locale];
    if (!t?.body?.trim() || !t?.title?.trim()) continue;
    const body = spliceGenerated(key, t.body);
    stmts.push({
      sql: `INSERT INTO docs_pages
              (section, slug, locale, title, summary, body, source_path,
               source_sha, source_hash, is_translated, nav_order, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,1,?,?)
            ON CONFLICT(section, slug, locale) DO UPDATE SET
              title=excluded.title, summary=excluded.summary, body=excluded.body,
              source_path=excluded.source_path, source_sha=excluded.source_sha,
              source_hash=excluded.source_hash, is_translated=1,
              nav_order=excluded.nav_order, updated_at=excluded.updated_at`,
      args: [
        section, slug, locale, t.title, t.summary ?? null, body,
        base.source_path, base.source_sha, entry.sourceHash ?? "",
        base.nav_order, now,
      ],
    });
  }
}

if (skipped.length) {
  console.log("跳过：");
  for (const s of skipped) console.log("  " + s);
}
console.log(`${dry ? "[dry] 将写入" : "写入"} ${stmts.length} 条译文`);
if (dry || !stmts.length) process.exit(0);

for (let i = 0; i < stmts.length; i += 20) {
  await client.batch(stmts.slice(i, i + 20), "write");
}

const n = (
  await client.execute(
    "SELECT count(*) n FROM docs_pages WHERE is_translated = 1",
  )
).rows[0].n;
console.log(`✅ 完成。库中译文总数：${n}`);
