import type { ComponentChildren, JSX } from "preact";

/**
 * 课程正文的 Markdown 元素 → 站内样式。照搬老站 src/mdx-components.tsx 的 class，
 * 只在服务端渲染（不水合），不产生任何客户端 JS。
 */
type P<T extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[T] & { children?: ComponentChildren };

export function mdxComponents(locale: string) {
  return {
    h1: (p: P<"h1">) => <h1 class="mt-2 scroll-mt-24 text-4xl font-bold tracking-tight" {...p} />,
    h2: (p: P<"h2">) => <h2 class="mt-10 scroll-mt-24 border-b border-border/60 pb-2 text-2xl font-bold" {...p} />,
    h3: (p: P<"h3">) => <h3 class="mt-6 scroll-mt-24 text-xl font-semibold" {...p} />,
    h4: (p: P<"h4">) => <h4 class="mt-5 scroll-mt-24 text-lg font-semibold" {...p} />,
    p: (p: P<"p">) => <p class="mt-4 leading-8 text-[17px]" {...p} />,
    a: ({ href, ...rest }: P<"a">) => {
      const url = typeof href === "string" ? href : "#";
      const external = url.startsWith("http");
      // 老站用 next-intl 的 Link：站内绝对路径自动补语言前缀
      const target = !external && url.startsWith("/") && !/^\/(zh|en|ja|ko)(\/|$)/.test(url) ? `/${locale}${url}` : url;
      return (
        <a
          href={target}
          {...(external ? { target: "_blank", rel: "noopener" } : {})}
          class="text-brand-600 underline-offset-4 hover:underline dark:text-brand-400"
          {...rest}
        />
      );
    },
    ul: (p: P<"ul">) => <ul class="mt-4 list-disc space-y-1.5 pl-6 marker:text-brand-500" {...p} />,
    ol: (p: P<"ol">) => <ol class="mt-4 list-decimal space-y-1.5 pl-6 marker:text-brand-500" {...p} />,
    li: (p: P<"li">) => <li class="leading-8 text-[17px]" {...p} />,
    blockquote: (p: P<"blockquote">) => (
      <blockquote class="mt-4 border-l-2 border-brand-500 bg-brand-500/5 py-2 pr-4 pl-4 text-muted-foreground" {...p} />
    ),
    code: ({ class: cls, className, ...rest }: P<"code"> & { className?: string }) => {
      const c = String(cls ?? className ?? "");
      return c.includes("language-") ? (
        <code class="font-mono text-[0.95em]" {...rest} />
      ) : (
        <code class="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground" {...rest} />
      );
    },
    pre: (p: P<"pre">) => (
      <pre class="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-muted/50 p-5 font-mono text-base leading-7" {...p} />
    ),
    table: (p: P<"table">) => (
      <div class="mt-4 overflow-x-auto rounded-xl border border-border/60">
        <table class="w-full border-collapse text-base" {...p} />
      </div>
    ),
    thead: (p: P<"thead">) => <thead class="bg-muted/60" {...p} />,
    tbody: (p: P<"tbody">) => <tbody class="[&_tr:last-child_td]:border-b-0" {...p} />,
    tr: (p: P<"tr">) => <tr class="transition-colors hover:bg-muted/30" {...p} />,
    th: (p: P<"th">) => <th class="border-b border-border px-3.5 py-2.5 text-left font-semibold" {...p} />,
    td: (p: P<"td">) => <td class="border-b border-border/50 px-3.5 py-2.5 align-top leading-7" {...p} />,
    hr: (p: P<"hr">) => <hr class="my-8 border-border/60" {...p} />,
    strong: (p: P<"strong">) => <strong class="font-semibold" {...p} />,
    img: (p: P<"img">) => <img class="my-4 rounded-xl border border-border/60" loading="lazy" {...p} />,
  };
}
