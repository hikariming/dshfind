/**
 * README → 可以直接塞进详情页的安全 HTML。纯函数，不联网——联网部分在
 * scripts/fetch-readmes.mjs。
 *
 * 为什么在同步时渲染、而不是详情页请求时渲染：详情页缓存未命中时的 CPU P95
 * 只有 64ms（docs/native-page-cache.md），一个长 README 走一遍 remark/rehype
 * 就能把它翻倍。放到脚本里在本机算掉，页面只剩一次查库加一段 innerHTML。
 *
 * 管线：remark-parse + GFM → remark-rehype（保留原始 HTML）→ rehype-raw
 *   → 标题降级 / 相对路径改写 → rehype-sanitize（GitHub 口径白名单）
 *   → 净化之后再加的「自家」属性（锚点 id、外链 rel、图片懒加载）。
 *
 * 顺序有讲究：锚点 id 与外链 rel 是我们自己生成的可信值，放在净化**之后**加，
 * 否则 sanitize 会给 id 加 user-content- 前缀、把 target/rel 剥掉。
 * 反过来，路径改写必须在净化**之前**：净化按协议白名单判 URL，相对路径改成
 * 绝对 https 之后才能稳妥地过闸。
 */
import { posix } from "node:path";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

import { proxyImageUrl } from "./readme-proxy.mjs";

export { proxyImageUrl };

/**
 * 渲染口径版本。改了渲染规则就 +1：抓取脚本见到库里版本不一致会绕过 ETag
 * 重抓重渲，否则 README 没变的仓库永远停在旧口径上。
 */
export const RENDER_VERSION = 4;

/**
 * 源文件截断阈值（字节）。实测头部插件 README 中位数十几 KB，但有几十万字节的
 * 变更日志式 README；详情页不是全文镜像，截断后给「在 GitHub 查看全文」。
 */
export const MAX_SOURCE_BYTES = 60_000;

/** 渲染产物上限。超过（多半是巨型 HTML 表格或内联 SVG）就不存，页面只放链接。 */
export const MAX_HTML_BYTES = 200_000;

/** 锚点 id 前缀：与站点自己的元素 id 隔开，也让 README 内的 #xxx 跳转有落点。 */
const ID_PREFIX = "readme-";
/** rehype-sanitize 默认给 id/name 加的前缀，净化后换成 ID_PREFIX。 */
const CLOBBER_PREFIX = "user-content-";

/**
 * 净化白名单：以 hast-util-sanitize 的默认口径（即 GitHub 的）为底，补上 README
 * 里高频、且无脚本风险的几样：居中对齐（头图/徽章墙几乎都靠它）、图片宽高、
 * 深浅色切换用的 <picture><source>。
 */
const schema = {
  ...defaultSchema,
  tagNames: [...new Set([...(defaultSchema.tagNames ?? []), "picture", "source", "u"])],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "align"],
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height", "align"],
    source: ["srcSet", "media", "type"],
    // 代码块语言保留下来，后续要做高亮时有依据
    code: [["className", /^language-[\w-]+$/]],
  },
  // id/name 沿用默认的 user-content- 前缀隔离（作者写个 id="main-content" 就能劫持站点锚点），
  // 净化后再统一换成 readme- 前缀，与我们生成的标题锚点同一命名空间
  strip: ["script", "style"],
};

/** 读取 README 文件名判断格式；非 Markdown（.rst/.txt/无扩展名以外）按纯文本处理。 */
export function isMarkdownPath(path) {
  if (!path) return true;
  const ext = posix.extname(path).toLowerCase();
  return ext === "" || ext === ".md" || ext === ".markdown" || ext === ".mdx";
}

/**
 * 在块边界处截断 Markdown：退回到阈值前最后一个空行，并补齐未闭合的代码围栏，
 * 免得后半页全变成代码块。
 *
 * @returns {{ text: string, truncated: boolean }}
 */
export function truncateMarkdown(source, maxBytes = MAX_SOURCE_BYTES) {
  const buf = Buffer.from(source, "utf8");
  if (buf.length <= maxBytes) return { text: source, truncated: false };
  // 按字节切会切坏多字节字符，先切再丢掉尾部残缺的替换字符
  let text = buf.subarray(0, maxBytes).toString("utf8").replace(/�+$/, "");
  const cut = text.lastIndexOf("\n\n");
  if (cut > maxBytes * 0.5) text = text.slice(0, cut);
  const fences = text.match(/^\s{0,3}(```|~~~)/gm) ?? [];
  if (fences.length % 2 === 1) text += `\n${fences[fences.length - 1].trim()}`;
  return { text, truncated: true };
}

/** 是否为不需要改写的 URL（绝对地址、锚点、mailto 等）。 */
function isAbsoluteOrSpecial(url) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
}

/**
 * 把 README 里的相对路径解析成仓库内路径。根相对（/docs/a.md）在 GitHub 语境下
 * 指仓库根；其余相对于 README 所在目录。越出仓库根（../../x）返回 null。
 */
export function resolveRepoPath(url, readmeDir = "") {
  const clean = url.split(/[?#]/, 1)[0];
  if (!clean) return null;
  const joined = clean.startsWith("/")
    ? clean.slice(1)
    : posix.join(readmeDir || ".", clean);
  const normalized = posix.normalize(joined);
  if (normalized.startsWith("..") || normalized === ".") return null;
  return normalized;
}

/** 链接的锚点部分（#section），相对链接指向 .md 时要带到 GitHub 上。 */
function hashOf(url) {
  const i = url.indexOf("#");
  return i >= 0 ? url.slice(i) : "";
}

/** 图片地址：相对路径 → raw 域名；github.com 的 blob/raw 包装页 → raw 字节。 */
export function resolveImageSrc(url, fullName, readmeDir = "") {
  const src = url.trim();
  if (!src) return null;
  if (src.startsWith("//")) return `https:${src}`;
  const blob = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/i.exec(src);
  if (blob) {
    return `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3].split(/[?#]/, 1)[0]}`;
  }
  if (isAbsoluteOrSpecial(src)) return src;
  const path = resolveRepoPath(src, readmeDir);
  return path ? `https://raw.githubusercontent.com/${fullName}/HEAD/${encodePath(path)}` : null;
}

/** 链接地址：相对路径 → github.com 的 blob 页（目录也能用 blob，GitHub 会自动跳 tree）。 */
export function resolveLinkHref(url, fullName, readmeDir = "") {
  const href = url.trim();
  if (!href || isAbsoluteOrSpecial(href)) return href;
  const path = resolveRepoPath(href, readmeDir);
  if (!path) return null;
  return `https://github.com/${fullName}/blob/HEAD/${encodePath(path)}${hashOf(href)}`;
}

function encodePath(path) {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(decodeURIComponentSafe(seg)))
    .join("/");
}

function decodeURIComponentSafe(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * GitHub 风格的标题锚点：小写、去标点、空格变连字符，重名追加 -1、-2。
 * 中日韩字符保留（GitHub 同样保留），所以中文标题的 #安装 跳转也能对上。
 */
export function makeSlugger() {
  const seen = new Map();
  return (text) => {
    const base =
      text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s_-]/gu, "")
        .replace(/\s/g, "-") || "section";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

function textOf(node) {
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(textOf).join("");
}

/** 净化之前：标题整体降一级（页面 h1 是插件名），并改写所有相对路径。 */
function rehypeRewrite({ fullName, readmeDir }) {
  return (tree) => {
    visit(tree, "element", (node) => {
      const m = /^h([1-6])$/.exec(node.tagName);
      if (m) node.tagName = `h${Math.min(Number(m[1]) + 1, 6)}`;

      const p = node.properties ?? {};
      if (node.tagName === "img" && typeof p.src === "string") {
        const src = resolveImageSrc(p.src, fullName, readmeDir);
        if (src) p.src = src;
        else delete p.src;
      }
      if (node.tagName === "source" && p.srcSet != null) {
        const raw = Array.isArray(p.srcSet) ? p.srcSet.join(", ") : String(p.srcSet);
        p.srcSet = raw
          .split(",")
          .map((part) => {
            const [u, ...desc] = part.trim().split(/\s+/);
            const src = resolveImageSrc(u ?? "", fullName, readmeDir);
            return src ? [src, ...desc].join(" ") : null;
          })
          .filter(Boolean)
          .join(", ");
      }
      if (node.tagName === "a" && typeof p.href === "string") {
        const href = resolveLinkHref(p.href, fullName, readmeDir);
        if (href) p.href = href;
        else delete p.href;
      }
    });
  };
}

/** GitHub 提示块（> [!NOTE] 等）的类型与标题；GitHub 自己也只显示英文标题。 */
const ALERTS = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
};

/**
 * 把 `> [!IMPORTANT]` 开头的引用块转成提示块。放在净化之后做：生成的
 * class 是我们自己的可信值，不必为它放宽白名单。
 */
function toAlert(node) {
  if (node.tagName !== "blockquote") return;
  const first = node.children.find((c) => c.type === "element");
  if (first?.tagName !== "p") return;
  const lead = first.children[0];
  if (lead?.type !== "text") return;
  const m = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n)?/i.exec(lead.value);
  if (!m) return;
  const type = m[1].toUpperCase();
  lead.value = lead.value.slice(m[0].length);
  // 标记独占一行时后面常跟 <br>，去掉免得提示块开头空一行
  if (!lead.value) {
    first.children.shift();
    if (first.children[0]?.tagName === "br") first.children.shift();
  }
  if (first.children.length === 0) node.children.splice(node.children.indexOf(first), 1);
  node.tagName = "div";
  node.properties = { className: ["markdown-alert", `markdown-alert-${type.toLowerCase()}`] };
  node.children.unshift({
    type: "element",
    tagName: "p",
    properties: { className: ["markdown-alert-title"] },
    children: [{ type: "text", value: ALERTS[type] }],
  });
}

/** 净化之后：提示块、生成锚点 id、改写页内跳转、外链加 rel/target、图片懒加载。 */
function rehypeDecorate({ fullName }) {
  return (tree) => {
    const slug = makeSlugger();
    visit(tree, "element", (node) => {
      toAlert(node);
      const p = (node.properties ??= {});
      const reprefix = (v) =>
        typeof v === "string" && v.startsWith(CLOBBER_PREFIX)
          ? ID_PREFIX + v.slice(CLOBBER_PREFIX.length).toLowerCase()
          : v;
      for (const key of ["id", "name"]) p[key] = reprefix(p[key]);
      // aria-describedby 在 hast 里是 id 列表
      if (Array.isArray(p.ariaDescribedBy)) p.ariaDescribedBy = p.ariaDescribedBy.map(reprefix);
      // 已有 id 的标题（脚注标题、作者手写的 <h2 id>）保留原 id，免得打断指向它的引用
      if (/^h[2-6]$/.test(node.tagName) && typeof p.id !== "string") {
        p.id = ID_PREFIX + slug(textOf(node));
      }
      if (node.tagName === "a" && typeof p.href === "string") {
        if (p.href.startsWith("#")) {
          // README 里写的是 GitHub 生成的锚点（#installation），对到我们加了前缀的 id
          p.href = `#${ID_PREFIX}${decodeURIComponentSafe(p.href.slice(1)).toLowerCase()}`;
        } else if (/^https?:\/\//i.test(p.href)) {
          p.target = "_blank";
          p.rel = ["nofollow", "ugc", "noopener"];
        }
      }
      // 代理改写放在净化之后：净化只认绝对 https，站内相对路径过不了闸
      if (node.tagName === "img" && typeof p.src === "string") {
        p.src = proxyImageUrl(p.src, fullName);
      }
      if (node.tagName === "source" && typeof p.srcSet === "string") {
        p.srcSet = p.srcSet
          .split(", ")
          .map((part) => {
            const [u, ...desc] = part.split(" ");
            return [proxyImageUrl(u, fullName), ...desc].join(" ");
          })
          .join(", ");
      }
      if (node.tagName === "img") {
        p.loading = "lazy";
        p.decoding = "async";
        // 部分图床按 Referer 防盗链，不带 Referer 反而放行
        p.referrerPolicy = "no-referrer";
      }
    });
  };
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * 渲染一份 README。
 *
 * @param {string} source    README 原文
 * @param {object} opts
 * @param {string} opts.fullName  owner/repo，用于拼绝对地址
 * @param {string} [opts.path]    README 在仓库内的路径（决定相对路径的基准目录与格式）
 * @returns {Promise<{ html: string | null, truncated: boolean, sourceBytes: number, status: "ok" | "too_large" | "empty" }>}
 */
export async function renderReadme(source, { fullName, path = "README.md" }) {
  const sourceBytes = Buffer.byteLength(source, "utf8");
  if (!source.trim()) return { html: null, truncated: false, sourceBytes, status: "empty" };

  const { text, truncated } = truncateMarkdown(source);

  let html;
  if (isMarkdownPath(path)) {
    const readmeDir = posix.dirname(path) === "." ? "" : posix.dirname(path);
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      // 脚注 id 不加前缀，交给 sanitize 统一加，免得出现双重前缀
      .use(remarkRehype, { allowDangerousHtml: true, clobberPrefix: "" })
      .use(rehypeRaw)
      .use(rehypeRewrite, { fullName, readmeDir })
      .use(rehypeSanitize, schema)
      .use(rehypeDecorate, { fullName })
      .use(rehypeStringify)
      .process(text);
    html = String(file);
  } else {
    // .rst / .txt 不引入专门解析器：原样等宽展示，比渲染错乱强
    html = `<pre class="readme-plain">${escapeHtml(text)}</pre>`;
  }

  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    return { html: null, truncated, sourceBytes, status: "too_large" };
  }
  return { html, truncated, sourceBytes, status: "ok" };
}
