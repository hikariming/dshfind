"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * 用户内容的 Markdown 渲染（docs/bbs-design.md §4）。
 *
 * 安全上依赖 react-markdown 的默认行为：不解析原始 HTML（没装 rehype-raw），
 * 且 URL 会过一遍协议白名单，javascript: 之类进不来。服务端一个字节 HTML
 * 都不产，库里存的永远是 Markdown 原文。
 *
 * 标记了 "use client"，但帖子页的 SSR 一样会把它渲成 HTML——SEO 拿到的是
 * 完整正文，不是空壳。站里没装 typography 插件，排版就在下面手写。
 */

/** 站内链接 dofollow（内链对自家 SEO 有用），站外一律 nofollow ugc。 */
function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?dshfind\.com/i.test(href);
}

const components: Components = {
  // 标题整体降一级：页面的 h1 是帖子标题，正文里再出一个 h1 会打乱大纲。
  h1: ({ children }) => (
    <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold tracking-tight first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-5 mb-2 text-base font-semibold first:mt-0">{children}</h4>
  ),
  h4: ({ children }) => <h5 className="mt-4 mb-2 text-sm font-semibold">{children}</h5>,
  h5: ({ children }) => <h6 className="mt-4 mb-2 text-sm font-semibold">{children}</h6>,
  h6: ({ children }) => <h6 className="mt-4 mb-2 text-sm font-semibold">{children}</h6>,

  p: ({ children }) => <p className="my-3 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  a: ({ href, children }) => {
    const url = href ?? "";
    return isExternal(url) ? (
      <a
        href={url}
        target="_blank"
        rel="nofollow ugc noopener"
        className="text-brand-600 underline underline-offset-2 hover:no-underline dark:text-brand-300"
      >
        {children}
      </a>
    ) : (
      <a
        href={url}
        className="text-brand-600 underline underline-offset-2 hover:no-underline dark:text-brand-300"
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-border pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-border/60" />,
  code: ({ className, children }) => {
    // react-markdown 用 language-* 类名区分围栏代码块与行内代码；
    // 围栏那份由下面的 pre 负责外层样式，这里只管字体。
    const fenced = /language-/.test(className ?? "");
    if (fenced) {
      return <code className="font-mono text-[13px]">{children}</code>;
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-border/60 bg-muted/50 p-4 text-[13px] leading-relaxed">
      {children}
    </pre>
  ),
  // 表格自己横向滚动，绝不让页面 body 出现横向滚动条
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border/60 bg-muted/40 px-3 py-1.5 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-border/60 px-3 py-1.5">{children}</td>,
  img: ({ src, alt }) => (
    // 图片来自任意外站，next/image 需要逐个域名配白名单，这里用原生标签。
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : ""}
      alt={alt ?? ""}
      loading="lazy"
      className="my-4 max-w-full rounded-xl border border-border/60"
    />
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
