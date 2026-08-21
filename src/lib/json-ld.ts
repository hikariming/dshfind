/**
 * JSON-LD 专用序列化，供 dangerouslySetInnerHTML 使用。
 *
 * JSON.stringify 不转义 `<`，而装进 <script type="application/ld+json"> 的
 * 内容里出现一个字面量 `</script>` 就会提前闭合标签，后面的内容变成可执行
 * 的 HTML。BBS 帖子的 articleBody 是用户写的 Markdown 原文，插件页的
 * name/description 来自 GitHub/npm（插件作者可控）——都算不可信输入。
 * 把 `<` 换成 \u003c 即可：JSON 解析器认这个转义，HTML 分词器认不出闭合
 * 标签。（`&` 一并转，避免嵌在别处时被实体解码。）
 */
export function jsonLdSafe(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/&/g, "\\u0026");
}
