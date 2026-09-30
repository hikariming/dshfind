/**
 * hub 页 URL 片段的生成规则。独立成零依赖模块：plugin-hubs.ts 会加载全量快照（plugins-real），
 * 而 Astro 新站的详情页运行在 Worker 里，只需要这两个纯函数，不能为此把快照编进 Worker。
 */

/**
 * 语言名转 URL 片段。`+` / `#` 先转成词再做通用替换，
 * 否则 "C++" 与 "C#" 都会塌成同一个 "c-" 造成 slug 撞车。
 */
export function languageSlug(language: string): string {
  return language
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/#/g, "sharp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** GitHub topic 本身就是小写短横线格式，这里只做兜底净化。 */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
