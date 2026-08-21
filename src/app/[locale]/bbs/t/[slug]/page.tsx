import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Lock } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Markdown } from "@/components/markdown";
import { ThreadConversation } from "@/components/thread-conversation";
import { threadFromBackend } from "@/lib/backend";
import { plainExcerpt, threadLocale, threadPath, type Thread } from "@/lib/forum";
import { localeUrl } from "@/lib/site";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * 帖子页 —— BBS 的 SEO 主战场，正文必须在服务端 HTML 里。
 *
 * 设计文档原方案是"长 revalidate + Go 发帖后回调 /api/revalidate 按需刷新"。
 * 迁到 Cloudflare Workers 之后这条路走不通：OpenNext 的按需失效要挂 tagCache
 * （见 open-next.config.ts 的注释——全站只用时间型 revalidate，没装），
 * revalidatePath 在 Workers 上不会真的清掉 R2 里的产物。
 * 于是改成 10 分钟的时间型 ISR：爬虫拿到的最多滞后 10 分钟，真人看到的回复
 * 由 <ThreadConversation> 挂载后直连 Go 刷新，两边都不吃亏，也不用多养一套 D1。
 */
export const revalidate = 600;

/**
 * 空数组 = 构建期一个帖子页都不预渲染，全部首次访问时按需生成后进 ISR 缓存。
 * 这个导出不能省：没有它，这条动态路由会被当成纯动态、每次请求都跑函数
 * （Next 文档 generate-static-params.md 明确要求返回空数组才能运行时 ISR）。
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const thread = await threadFromBackend(slug, revalidate);
  if (!thread) return { title: t("notFoundTitle"), robots: { index: false } };

  const description = plainExcerpt(thread.body_md) || thread.title;
  return {
    title: thread.title,
    description,
    // canonical 永远指向帖子的写作语言，而不是访客当前所在的语言前缀：
    // 同一篇正文在 /zh /en /ja /ko 下渲染的内容完全一样，四条都自我 canonical
    // 就是四份重复内容。也正因为没有真正的译文，这里不给 hreflang。
    alternates: {
      canonical: localeUrl(threadLocale(thread.locale), threadPath(slug)),
    },
    openGraph: {
      type: "article",
      title: thread.title,
      description,
      publishedTime: thread.created_at,
      modifiedTime: thread.last_post_at,
      authors: [`https://github.com/${thread.author.login}`],
    },
    // 插件讨论帖的正文是空的，标题只是仓库名——没有独立收录价值，
    // 让爬虫把精力留给插件详情页与真正的文章。
    robots: thread.plugin_full_name ? { index: false } : undefined,
  };
}

export default async function ThreadPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const thread = await threadFromBackend(slug, revalidate);
  if (!thread) notFound();

  const t = await getTranslations({ locale, namespace: "Bbs" });
  const board = thread.plugin_full_name ? "plugin" : thread.board;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/bbs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {t("backToList")}
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight break-words">{thread.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5">{t(`boards.${board}`)}</span>
        <a
          href={`https://github.com/${thread.author.login}`}
          target="_blank"
          rel="noopener"
          className="hover:underline"
        >
          @{thread.author.login}
        </a>
        <time dateTime={thread.created_at}>{thread.created_at.slice(0, 10)}</time>
        {thread.is_locked && (
          <span className="inline-flex items-center gap-1">
            <Lock className="size-3" />
            {t("locked")}
          </span>
        )}
      </div>

      {thread.plugin_full_name && (
        <p className="mt-4 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm">
          <Link
            href={`/plugins/${thread.plugin_full_name}`}
            className="text-brand-600 hover:underline dark:text-brand-300"
          >
            {t("pluginThreadNotice", { plugin: thread.plugin_full_name })}
          </Link>
        </p>
      )}

      {thread.body_md && (
        <div className="mt-6">
          <Markdown>{thread.body_md}</Markdown>
        </div>
      )}

      <ThreadConversation
        slug={thread.slug}
        initialPosts={thread.posts ?? []}
        threadAuthor={thread.author.login}
        isLocked={thread.is_locked}
      />

      {!thread.plugin_full_name && <ThreadJsonLd thread={thread} />}
    </article>
  );
}

/**
 * DiscussionForumPosting 结构化数据：让搜索引擎认出这是一篇有作者、有时间、
 * 有回复的论坛文章，而不是一坨列表页。字段全部来自已经渲染出来的内容，
 * 不额外查库。
 */
function ThreadJsonLd({ thread }: { thread: Thread }) {
  // 与 canonical 同一个 URL，别让结构化数据指到别的语言前缀去。
  const url = localeUrl(threadLocale(thread.locale), threadPath(thread.slug));
  const data = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": url,
    url,
    headline: thread.title,
    articleBody: thread.body_md,
    datePublished: thread.created_at,
    dateModified: thread.last_post_at || thread.created_at,
    inLanguage: thread.locale,
    author: {
      "@type": "Person",
      name: thread.author.name || thread.author.login,
      url: `https://github.com/${thread.author.login}`,
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: thread.reply_count,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdSafe(data) }}
    />
  );
}

/**
 * JSON.stringify 不转义 `<`，而 articleBody 里装的是用户写的 Markdown 原文——
 * 正文里出现一个字面量 `</script>` 就会提前闭合这个 script 标签，后面的内容
 * 变成可执行的 HTML。把 `<` 换成 \u003c 即可：JSON 解析器认这个转义，
 * HTML 分词器认不出闭合标签。（`&` 一并转，避免嵌在别处时被实体解码。）
 */
function jsonLdSafe(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/&/g, "\\u0026");
}
