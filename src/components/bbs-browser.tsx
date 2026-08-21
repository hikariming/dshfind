"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare, Pin, PenLine, Lock } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  BOARDS,
  FORUM_API_BASE,
  threadPath,
  type ThreadPage,
  type ThreadSummary,
} from "@/lib/forum";

/**
 * 总板块聚合页的交互层（docs/bbs-design.md §4）。
 *
 * 首屏那一页由服务端 ISR 渲染好传进来——纯客户端拉取的话爬虫抓到的是空壳，
 * 帖子页就永远没有站内入口。挂载后再拉一次拿最新的，之后的翻页与筛选全在
 * 浏览器里直连 Go，不经过 Vercel/Workers 的函数。
 */

const ALL = "";

export function BbsBrowser({ initial }: { initial: ThreadPage | null }) {
  const t = useTranslations("Bbs");
  const locale = useLocale();

  const [board, setBoard] = React.useState<string>(ALL);
  // 低流量社区不按语言拆板块，但默认只看当前语言，一键可以看全部。
  const [onlyMyLocale, setOnlyMyLocale] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<ThreadPage | null>(initial);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!FORUM_API_BASE) return;
    const query = new URLSearchParams();
    if (board) query.set("board", board);
    if (onlyMyLocale) query.set("locale", locale);
    if (page > 1) query.set("page", String(page));

    let alive = true;
    setLoading(true);
    fetch(`${FORUM_API_BASE}/v1/forum/threads?${query}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((fresh: ThreadPage) => {
        if (!alive) return;
        setData(fresh);
        setFailed(false);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [board, onlyMyLocale, locale, page]);

  const items = data?.items ?? [];
  const counts = data?.board_counts ?? {};
  const perPage = data?.per_page ?? 20;
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  function pick(next: string) {
    setBoard(next);
    setPage(1);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild size="sm" className="rounded-lg">
          <Link href="/bbs/new">
            <PenLine className="size-4" />
            {t("newThread")}
          </Link>
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <Chip active={board === ALL} onClick={() => pick(ALL)} label={t("boards.all")} />
        {BOARDS.map((name) => (
          <Chip
            key={name}
            active={board === name}
            onClick={() => pick(name)}
            label={t(`boards.${name}`)}
            count={counts[name]}
          />
        ))}
        <Chip
          active={board === "plugin"}
          onClick={() => pick("plugin")}
          label={t("boards.plugin")}
          count={counts.plugin}
        />
        <button
          type="button"
          onClick={() => {
            setOnlyMyLocale((v) => !v);
            setPage(1);
          }}
          className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {onlyMyLocale ? t("showAllLanguages") : t("showMyLanguage")}
        </button>
      </div>

      {failed && (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          {t("loadFailed")}
        </p>
      )}

      <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
        {items.map((thread) => (
          <ThreadRow key={thread.slug} thread={thread} />
        ))}
      </ul>

      {items.length === 0 && !loading && (
        <p className="py-16 text-center text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {lastPage > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("prev")}
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {page} / {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ThreadRow({ thread }: { thread: ThreadSummary }) {
  const t = useTranslations("Bbs");
  const locale = useLocale();
  const board = thread.plugin_full_name ? "plugin" : thread.board;

  return (
    <li className="py-4">
      <div className="flex items-start gap-3">
        {thread.author.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thread.author.avatar}
            alt=""
            className="mt-0.5 size-8 shrink-0 rounded-full border border-border/60"
          />
        ) : (
          <span className="mt-0.5 size-8 shrink-0 rounded-full border border-border/60" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {thread.is_pinned && <Pin className="size-3.5 text-brand-500" aria-label={t("pinned")} />}
            <Link
              href={threadPath(thread.slug)}
              className="text-[15px] font-medium hover:underline"
            >
              {thread.title}
            </Link>
            {thread.is_locked && (
              <Lock className="size-3.5 text-muted-foreground" aria-label={t("locked")} />
            )}
          </div>

          {thread.excerpt && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{thread.excerpt}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">{t(`boards.${board}`)}</span>
            <span>@{thread.author.login}</span>
            <time dateTime={thread.last_post_at}>{formatDay(thread.last_post_at, locale)}</time>
            {thread.reply_count > 0 && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <MessageSquare className="size-3" />
                {thread.reply_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Chip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-brand-500 bg-brand-500/10 text-foreground"
          : "border-border/60 text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
      {count != null && count > 0 && <span className="ml-1 tabular-nums opacity-70">{count}</span>}
    </button>
  );
}

function formatDay(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}
