// 生成 src/content/blog/registry.ts：扫描 src/content/blog/<slug>/<locale>.mdx，
// 为每个实际存在的语言文件生成 import 与注册表条目。缺失的语言在运行时回退到 zh。
// 用法：node scripts/gen-blog-registry.mjs（或 pnpm gen:blog）
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const blogDir = join(root, "src/content/blog");
const locales = ["zh", "en", "ja", "ko"];

const varName = (slug, locale) => `${slug.replaceAll("-", "_")}_${locale}`;

const slugs = readdirSync(blogDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const imports = [];
const entries = [];

for (const slug of slugs) {
  const dir = join(blogDir, slug);
  const found = locales.filter((locale) =>
    existsSync(join(dir, `${locale}.mdx`)),
  );
  if (found.length === 0) continue;
  for (const locale of found) {
    imports.push(
      `import * as ${varName(slug, locale)} from "@/content/blog/${slug}/${locale}.mdx";`,
    );
  }
  const localeLines = found
    .map((locale) => `    ${locale}: ${varName(slug, locale)},`)
    .join("\n");
  entries.push(`  "${slug}": {\n${localeLines}\n  },`);
}

const out = `// 由 scripts/gen-blog-registry.mjs 生成：所有博客正文的注册表（含已存在的各语言版本）
import type { ComponentType } from "react";

${imports.join("\n")}

const registry: Record<string, Record<string, { default: ComponentType<any> }>> = {
${entries.join("\n")}
};

/** 取某篇文章某语言的 MDX 模块；缺语言回退 zh，找不到文章抛错。 */
export function getPostModule(slug: string, locale: string) {
  const m = registry[slug];
  if (!m) throw new Error(\`blog post not found: \${slug}\`);
  return m[locale] ?? m.zh;
}
`;

writeFileSync(join(blogDir, "registry.ts"), out);
console.log(
  `✓ 已生成 registry.ts：${slugs.length} 篇文章，${imports.length} 个语言文件`,
);
