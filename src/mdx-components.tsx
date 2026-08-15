import type { MDXComponents } from "mdx/types";
import { Link } from "@/i18n/navigation";

/**
 * 全局 MDX 组件映射：给右侧正文里的 Markdown 元素套上 Tailwind 样式，
 * 让课程内容与站内设计语言一致。
 */
const components: MDXComponents = {
  h1: (props) => (
    <h1
      className="mt-2 scroll-mt-24 text-4xl font-bold tracking-tight"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="mt-10 scroll-mt-24 border-b border-border/60 pb-2 text-2xl font-bold"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mt-6 scroll-mt-24 text-xl font-semibold" {...props} />
  ),
  h4: (props) => (
    <h4 className="mt-5 scroll-mt-24 text-lg font-semibold" {...props} />
  ),
  p: (props) => <p className="mt-4 leading-8 text-[17px]" {...props} />,
  a: (props) => {
    const { href, ...rest } = props;
    const isExternal = href?.startsWith("http");
    const Comp = isExternal ? "a" : Link;
    return (
      <Comp
        href={href ?? "#"}
        {...(isExternal ? { target: "_blank", rel: "noopener" } : {})}
        className="text-brand-600 underline-offset-4 hover:underline dark:text-brand-400"
        {...rest}
      />
    );
  },
  ul: (props) => (
    <ul className="mt-4 list-disc space-y-1.5 pl-6 marker:text-brand-500" {...props} />
  ),
  ol: (props) => (
    <ol className="mt-4 list-decimal space-y-1.5 pl-6 marker:text-brand-500" {...props} />
  ),
  li: (props) => <li className="leading-8 text-[17px]" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mt-4 border-l-2 border-brand-500 bg-brand-500/5 py-2 pr-4 pl-4 text-muted-foreground"
      {...props}
    />
  ),
  code: (props) => {
    const { className, ...rest } = props;
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className="font-mono text-[0.95em]" {...rest} />;
    }
    return (
      <code
        className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
        {...rest}
      />
    );
  },
  pre: (props) => (
    <pre
      className="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-muted/50 p-5 font-mono text-base leading-7"
      {...props}
    />
  ),
  table: (props) => (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full border-collapse text-base" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-muted/60" {...props} />,
  tbody: (props) => <tbody className="[&_tr:last-child_td]:border-b-0" {...props} />,
  tr: (props) => (
    <tr className="transition-colors hover:bg-muted/30" {...props} />
  ),
  th: (props) => (
    <th
      className="border-b border-border px-3.5 py-2.5 text-left font-semibold"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="border-b border-border/50 px-3.5 py-2.5 align-top leading-7"
      {...props}
    />
  ),
  hr: (props) => <hr className="my-8 border-border/60" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="my-4 rounded-xl border border-border/60" {...props} />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
