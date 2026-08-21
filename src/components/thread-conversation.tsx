"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/github-icon";
import { Markdown } from "@/components/markdown";
import { useSessionState } from "@/components/user-chip";
import { Link, useRouter } from "@/i18n/navigation";
import {
  FORUM_API_BASE,
  MAX_REPLY_BODY,
  threadPath,
  type ForumPost,
  type Thread,
} from "@/lib/forum";

/**
 * 帖子页的动态部分：回复流、回帖框、作者自己的删除操作。
 *
 * 主题帖的标题与正文由服务端渲染（帖子页是 ISR，SEO 要的是那份 HTML），
 * 这里只接管会变的部分。初始回复同样来自服务端 props，挂载后再拉一次拿最新的
 * ——帖子页缓存 10 分钟，人不该等那么久才看到自己刚发的回复。
 */
export function ThreadConversation({
  slug,
  initialPosts,
  threadAuthor,
  isLocked,
}: {
  slug: string;
  initialPosts: ForumPost[];
  threadAuthor: string;
  isLocked: boolean;
}) {
  const t = useTranslations("Bbs");
  const locale = useLocale();
  const router = useRouter();
  const { user, ready } = useSessionState();

  const [posts, setPosts] = React.useState<ForumPost[]>(initialPosts);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const base = `${FORUM_API_BASE}/v1/forum/threads/${encodeURIComponent(slug)}`;

  React.useEffect(() => {
    if (!FORUM_API_BASE) return;
    let alive = true;
    fetch(base)
      .then((r) => (r.ok ? r.json() : null))
      .then((fresh: Thread | null) => {
        if (alive && fresh) setPosts(fresh.posts ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [base]);

  function failure(status: number): string {
    if (status === 401) return t("errorSignedOut");
    if (status === 403) return t("errorForbidden");
    if (status === 409) return t("errorLocked");
    if (status === 429) return t("errorTooFast");
    if (status === 400) return t("errorRejected");
    return t("errorGeneric");
  }

  async function reply(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!user || busy || !text) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body_md: text }),
      });
      if (!res.ok) {
        setError(failure(res.status));
        return;
      }
      const { post } = (await res.json()) as { post: ForumPost };
      setPosts((prev) => [...prev, post]);
      setBody("");
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function removePost(id: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${FORUM_API_BASE}/v1/forum/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(failure(res.status));
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function removeThread() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(base, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        setError(failure(res.status));
        return;
      }
      // 帖子页缓存了 10 分钟，删完留在原地会看到自己刚删的帖子还在。
      router.push("/bbs");
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  if (!FORUM_API_BASE) return null;

  return (
    <section className="mt-8 border-t border-border/60 pt-6">
      {user?.login === threadAuthor && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={removeThread}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            {t("deleteThread")}
          </button>
        </div>
      )}

      <h2 className="flex items-center gap-2 text-base font-semibold">
        <MessageSquare className="size-4" />
        {t("replies")}
        {posts.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {posts.length}
          </span>
        )}
      </h2>

      {error && (
        <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {posts.length > 0 && (
        <ul className="mt-4 space-y-5">
          {posts.map((post) => (
            <li key={post.id} className="flex gap-3">
              {post.author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar}
                  alt=""
                  className="size-8 shrink-0 rounded-full border border-border/60"
                />
              ) : (
                <span className="size-8 shrink-0 rounded-full border border-border/60" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://github.com/${post.author.login}`}
                    target="_blank"
                    rel="noopener"
                    className="text-sm font-medium hover:underline"
                  >
                    @{post.author.login}
                  </a>
                  <time className="text-xs text-muted-foreground" dateTime={post.created_at}>
                    {formatDay(post.created_at, locale)}
                  </time>
                  {user?.login === post.author.login && (
                    <button
                      type="button"
                      onClick={() => removePost(post.id)}
                      disabled={busy}
                      aria-label={t("delete")}
                      className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-1">
                  <Markdown>{post.body_md}</Markdown>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isLocked ? (
        <p className="mt-6 border-t border-border/60 pt-4 text-sm text-muted-foreground">
          {t("lockedNotice")}
        </p>
      ) : ready && !user ? (
        <div className="mt-6 flex flex-col items-start gap-2 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">{t("replyNeedsLogin")}</p>
          <Button asChild size="sm" className="rounded-lg">
            <Link href={`/login?from=${threadPath(slug)}`}>
              <GithubIcon className="size-4" />
              {t("signIn")}
            </Link>
          </Button>
        </div>
      ) : user ? (
        <form onSubmit={reply} className="mt-6 space-y-2 border-t border-border/60 pt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_REPLY_BODY))}
            rows={4}
            placeholder={t("replyPlaceholder")}
            className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{t("markdownHint")}</span>
            <Button type="submit" size="sm" disabled={busy || !body.trim()} className="rounded-lg">
              {t("postReply")}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function formatDay(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}
