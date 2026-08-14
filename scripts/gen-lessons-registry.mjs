// 生成 src/content/lessons/registry.ts：扫描 src/content/lessons/<chapter>/<slug>/<locale>.mdx，
// 为每个实际存在的语言文件生成 import 与注册表条目。缺失的语言在运行时回退到 zh。
// 用法：node scripts/gen-lessons-registry.mjs
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDir = join(root, "src/content/lessons");
const locales = ["zh", "en", "ja", "ko"];

const varName = (chapter, slug, locale) =>
  `${chapter}_${slug.replaceAll("-", "_")}_${locale}`;

const chapters = readdirSync(lessonsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const imports = [];
const entries = [];

for (const chapter of chapters) {
  const slugs = readdirSync(join(lessonsDir, chapter), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const slugEntries = [];
  for (const slug of slugs) {
    const dir = join(lessonsDir, chapter, slug);
    const found = locales.filter((locale) =>
      existsSync(join(dir, `${locale}.mdx`))
    );
    if (found.length === 0) continue;
    for (const locale of found) {
      imports.push(
        `import * as ${varName(chapter, slug, locale)} from "@/content/lessons/${chapter}/${slug}/${locale}.mdx";`
      );
    }
    const localeLines = found
      .map((locale) => `      ${locale}: ${varName(chapter, slug, locale)},`)
      .join("\n");
    slugEntries.push(`    "${slug}": {\n${localeLines}\n    },`);
  }
  entries.push(`  ${chapter}: {\n${slugEntries.join("\n")}\n  },`);
}

const output = `// 由 scripts/gen-lessons-registry.mjs 生成：所有课程内容的注册表（含已存在的各语言版本）
import type { ComponentType } from "react";

${imports.join("\n")}

const registry: Record<string, Record<string, Record<string, { default: ComponentType<any> }>>> = {
${entries.join("\n")}
};

export function getLessonContent(chapter: string, slug: string, locale: string) {
  const m = registry[chapter]?.[slug];
  if (!m) throw new Error(\`lesson not found: \${chapter}/\${slug}\`);
  return m[locale] ?? m.zh;
}
`;

writeFileSync(join(lessonsDir, "registry.ts"), output);
console.log(
  `registry.ts regenerated: ${chapters.length} chapters, ${imports.length} locale modules`
);
