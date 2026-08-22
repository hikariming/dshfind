#!/usr/bin/env node
/**
 * 从 src/content/lessons 的 MDX 生成 src/lib/lessons-manifest.ts。
 *
 * 解决的问题：37 篇课程 × 4 语言的页面此前**没有 generateMetadata**，
 * 152 个 URL 共用站点默认 title/description，连 canonical 与 hreflang 都没有——
 * 站里最厚的内容（单页 4,400–14,700 字符）在搜索引擎眼里完全无法区分。
 *
 * 标题与摘要不另建一套文案：每篇 MDX 的 H1 与紧随其后的「一句话版」引用块
 * 本来就是各语言译好的，直接抽出来当 title / description，
 * 改正文即改 meta，不会漂移。
 *
 * locales 键同时是「这一课实际有哪个语言的正文」的事实来源：
 * registry 的 getLessonContent 在缺语言时回落到中文，
 * 于是 /ja/learn/plugin/01-* 是日文 URL 配中文正文——sitemap 不能照发，
 * 页面也该 noindex，否则就是自造重复内容 + 错误的语言信号。
 *
 * 用法：node scripts/gen-lessons-manifest.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src/content/lessons", import.meta.url).pathname;
const LOCALES = ["zh", "en", "ja", "ko"];

/** 首个 H1 即课程标题（142 份 MDX 全部第一行就是 H1，已核）。 */
function extractTitle(md) {
  const m = md.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

/**
 * 首个引用块即「一句话版 / In one sentence / 一言でいうと / 한 문장 요약」。
 * 去掉 `> `、粗体标记与那个标签前缀，剩下的正好是一句自然的摘要。
 */
function extractSummary(md) {
  const m = md.match(/^>\s+(.+?)\s*$/m);
  if (!m) return null;
  let s = m[1];
  // 去掉开头的「**标签**：」/「**Label**:」
  s = s.replace(/^\*\*[^*]+\*\*\s*[：:]\s*/, "");
  // 去掉行内粗体/斜体/行内代码标记，保留文字
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
  s = s.replace(/\s+/g, " ").trim();
  // meta description 超过约 160 字符会被截断，这里留一点余量
  return s.length > 300 ? s.slice(0, 300) : s;
}

const chapters = readdirSync(ROOT).filter((d) =>
  statSync(join(ROOT, d)).isDirectory(),
);

const entries = [];
for (const chapter of chapters.sort()) {
  const dir = join(ROOT, chapter);
  const slugs = readdirSync(dir).filter((d) =>
    statSync(join(dir, d)).isDirectory(),
  );
  for (const slug of slugs.sort()) {
    const titles = {};
    const summaries = {};
    for (const locale of LOCALES) {
      let md;
      try {
        md = readFileSync(join(dir, slug, `${locale}.mdx`), "utf8");
      } catch {
        continue; // 该语言没有正文——不登记，页面与 sitemap 据此规避
      }
      const title = extractTitle(md);
      if (!title) {
        console.error(`⚠️  ${chapter}/${slug}/${locale}.mdx 没有 H1，跳过`);
        continue;
      }
      titles[locale] = title;
      const summary = extractSummary(md);
      if (summary) summaries[locale] = summary;
    }
    if (Object.keys(titles).length) {
      entries.push({ chapter, slug, titles, summaries });
    }
  }
}

const body = entries
  .map(
    (e) =>
      `  {\n` +
      `    chapter: ${JSON.stringify(e.chapter)},\n` +
      `    slug: ${JSON.stringify(e.slug)},\n` +
      `    titles: ${JSON.stringify(e.titles)},\n` +
      `    summaries: ${JSON.stringify(e.summaries)},\n` +
      `  },`,
  )
  .join("\n");

const out = `// 由 scripts/gen-lessons-manifest.mjs 从 src/content/lessons 的 MDX 生成——请勿手改。
// title 取每篇 MDX 的 H1，description 取紧随其后的「一句话版」引用块——
// 两者本来就是各语言译好的，改正文即改 meta，不会漂移。
// 改动课程内容后跑 pnpm gen:lessons 刷新本文件。
// 生成时间：${new Date().toISOString()}

export interface LessonManifestEntry {
  chapter: string;
  slug: string;
  /**
   * locale → 标题。**键即「这一课实际有哪个语言的正文」**：
   * registry 缺语言时会回落到中文，页面与 sitemap 据此避免把
   * 「日文 URL + 中文正文」当成真的日文页收录。
   */
  titles: Record<string, string>;
  /** locale → 一句话摘要，用作 meta description。可能缺。 */
  summaries: Record<string, string>;
}

export const lessonManifest: LessonManifestEntry[] = [
${body}
];

const byKey = new Map(
  lessonManifest.map((e) => [\`\${e.chapter}/\${e.slug}\`, e]),
);

export function lessonEntry(
  chapter: string,
  slug: string,
): LessonManifestEntry | null {
  return byKey.get(\`\${chapter}/\${slug}\`) ?? null;
}

/** 该课时在这个语言下是否有原生正文（而不是回落到中文）。 */
export function lessonHasLocale(
  chapter: string,
  slug: string,
  locale: string,
): boolean {
  return Boolean(byKey.get(\`\${chapter}/\${slug}\`)?.titles[locale]);
}

/** 由课程 href 反查课时；nav 里的 href 形如 /learn/core/03-agent-loop-session。 */
export function lessonFromHref(href: string): LessonManifestEntry | null {
  const m = /^\\/learn\\/(?:cordis\\/lessons|([a-z]+))\\/([^/]+)$/.exec(href);
  if (!m) return null;
  return lessonEntry(m[1] ?? "cordis", m[2]);
}
`;

const path = new URL("../src/lib/lessons-manifest.ts", import.meta.url).pathname;
writeFileSync(path, out);

const localeCount = {};
for (const e of entries)
  for (const l of Object.keys(e.titles))
    localeCount[l] = (localeCount[l] ?? 0) + 1;
console.log(`wrote ${path}: ${entries.length} lessons`);
console.log(`  按语言: ${JSON.stringify(localeCount)}`);
const partial = entries.filter((e) => Object.keys(e.titles).length < 4);
console.log(`  语言不全的课时: ${partial.length}`);
for (const e of partial)
  console.log(
    `    ${e.chapter}/${e.slug} 仅有 ${Object.keys(e.titles).join(",")}`,
  );
const noSummary = entries.filter(
  (e) => Object.keys(e.summaries).length < Object.keys(e.titles).length,
);
console.log(`  有语言缺摘要的课时: ${noSummary.length}`);
