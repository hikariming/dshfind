import {
  DOC_SECTIONS,
  PINNED_SHA,
  sourceUrl,
  UPSTREAM_REPO,
} from "./docs-sections";

/**
 * 把上游文档正文里的相对链接改写成站内链接。
 *
 * 上游文档互相用相对路径引用（`./config.zh.md`、`../../../cookbook/x.zh.md`），
 * 原样搬过来全是 404。这里在渲染前统一改写：
 *   - 能映射到本站已收录文档的 → /{locale}/docs/<section>/<slug>
 *   - 映射不到的（板块还没同步）→ 指回上游 GitHub blob（带 pinned SHA，永远有效）
 *
 * 放在渲染期而不是入库期：库里存的是忠于源文的原文，
 * 同一份 body 在四种语言下改写出各自的前缀，不必按语言存四份链接。
 */

/** POSIX 风格的相对路径解析，够用即可（上游路径不含符号链接与 . 段以外的花样）。 */
function resolvePath(fromDir: string, rel: string): string {
  const out: string[] = fromDir ? fromDir.split("/") : [];
  for (const seg of rel.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

/** 上游文件路径 → 站内 /docs 路径；映射不到返回 null。 */
function toInternalPath(upstreamPath: string): string | null {
  for (const s of DOC_SECTIONS) {
    if (!upstreamPath.startsWith(s.upstream + "/")) continue;
    const rel = upstreamPath
      .slice(s.upstream.length + 1)
      .replace(/\.zh\.md$/, "")
      .replace(/\.md$/, "");
    const slug = rel === "index" ? "index" : rel.replace(/\/index$/, "");
    return slug === "index" ? `/docs/${s.id}` : `/docs/${s.id}/${slug}`;
  }
  return null;
}

/**
 * 上游每篇文档开头都有一行自己的语言切换器（如 `[English](tool.md) | 中文`）。
 * 本站有自己的 locale switcher 与 hreflang，这行留着既重复又会指向 404。
 */
function stripUpstreamLangSwitcher(body: string): string {
  return body.replace(
    /^\s*\[[^\]]+\]\([^)]+\.md\)\s*\|\s*\S+\s*$/m,
    "",
  );
}

/** 图片走 raw CDN：仓库里的截图不该被复制到本站，热链到 pinned SHA 即可。 */
function rawUrl(path: string): string {
  return `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${PINNED_SHA}/${path}`;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp)$/i;

export function rewriteDocLinks(
  body: string,
  locale: string,
  sourcePath: string,
): string {
  const dir = sourcePath.slice(0, sourcePath.lastIndexOf("/"));

  return (
    stripUpstreamLangSwitcher(body)
      // ![alt](img) —— 相对图片指向仓库里的截图，不改写就是一片裂图
      .replace(
        /!\[([^\]]*)\]\((?!https?:\/\/|\/)([^)\s]+)\)/g,
        (m, alt: string, target: string) =>
          IMAGE_EXT.test(target)
            ? `![${alt}](${rawUrl(resolvePath(dir, target))})`
            : m,
      )
      // [text](target) —— 只处理指向 .md 的相对链接，绝对 URL 与锚点不动
      .replace(
        /\]\((?!https?:\/\/|#|\/)([^)\s]+?\.md)(#[^)\s]*)?\)/g,
        (_m, target: string, anchor: string | undefined) => {
          const abs = resolvePath(dir, target);
          const internal = toInternalPath(abs);
          const href = internal
            ? `/${locale}${internal}${anchor ?? ""}`
            : sourceUrl(abs);
          return `](${href})`;
        },
      )
  );
}
