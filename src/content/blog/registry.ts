// 由 scripts/gen-blog-registry.mjs 生成：所有博客正文的注册表（含已存在的各语言版本）
import type { ComponentType } from "react";

import * as top_plugins_2026_08_zh from "@/content/blog/top-plugins-2026-08/zh.mdx";
import * as top_plugins_2026_08_en from "@/content/blog/top-plugins-2026-08/en.mdx";
import * as top_plugins_2026_08_ja from "@/content/blog/top-plugins-2026-08/ja.mdx";
import * as top_plugins_2026_08_ko from "@/content/blog/top-plugins-2026-08/ko.mdx";

const registry: Record<string, Record<string, { default: ComponentType<any> }>> = {
  "top-plugins-2026-08": {
    zh: top_plugins_2026_08_zh,
    en: top_plugins_2026_08_en,
    ja: top_plugins_2026_08_ja,
    ko: top_plugins_2026_08_ko,
  },
};

/** 取某篇文章某语言的 MDX 模块；缺语言回退 zh，找不到文章抛错。 */
export function getPostModule(slug: string, locale: string) {
  const m = registry[slug];
  if (!m) throw new Error(`blog post not found: ${slug}`);
  return m[locale] ?? m.zh;
}
