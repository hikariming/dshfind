"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare, ThumbsDown, ThumbsUp, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GithubIcon } from "@/components/github-icon";
import { useSessionState } from "@/components/user-chip";
import { Link } from "@/i18n/navigation";

/**
 * 插件讨论区（docs/bbs-design.md Phase 1）：投票 + 评论 + "反馈有问题"。
 *
 * 整块都在客户端跑，直连 Railway 的 Go API——详情页本身必须保持 ISR 静态，
 * 服务端一旦为了读会话碰 cookies() 就会把 5900+ 个插件页拖回每请求渲染。
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

/**
 * Markdown 渲染器懒加载，且只在真的有评论时才挂。
 *
 * 它和 BBS 共用一套（Phase 2 的原计划），但 react-markdown + remark-gfm 是几十 KB，
 * 直接 import 会进 5900 个插件详情页的首屏包。评论本来就是挂载后才拉的，
 * 服务端 HTML 里没有它们，所以 ssr:false 不损失任何 SEO——绝大多数还没有评论的
 * 插件页则从头到尾不会下载这个 chunk。
 */
const Markdown = dynamic(() => import("@/components/markdown").then((m) => m.Markdown), {
  ssr: false,
});

type Verdict = "up" | "down";

interface Post {
  id: number;
  body_md: string;
  kind: string;
  author: { login: string; name: string | null; avatar: string | null };
  created_at: string;
}

interface Discussion {
  full_name: string;
  up: number;
  down: number;
  comments: Post[];
}

interface VoteResult {
  up: number;
  down: number;
  my_vote: Verdict | null;
}

const MAX_BODY = 10 * 1024;

export function PluginDiscussion({ owner, repo }: { owner: string; repo: string }) {
  const t = useTranslations("Discussion");
  const locale = useLocale();
  const { user, ready } = useSessionState();

  const [discussion, setDiscussion] = React.useState<Discussion | null>(null);
  const [myVote, setMyVote] = React.useState<Verdict | null>(null);
  const [body, setBody] = React.useState("");
  const [kind, setKind] = React.useState<"comment" | "issue">("comment");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const base = `${API_BASE}/v1/plugins/${owner}/${repo}`;

  React.useEffect(() => {
    if (!API_BASE) return;
    let alive = true;
    fetch(`${base}/discussion`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Discussion | null) => {
        if (alive && data) setDiscussion(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [base]);

  // "我投了什么" 是个人数据，公开的讨论响应要能进缓存，所以单独问一次；
  // 只有登录用户会发这个请求。
  React.useEffect(() => {
    if (!API_BASE || !user) return;
    let alive = true;
    fetch(`${API_BASE}/v1/me/plugin-votes/${owner}/${repo}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { my_vote: Verdict | null } | null) => {
        if (alive && data) setMyVote(data.my_vote);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [owner, repo, user]);

  function failure(status: number): string {
    if (status === 401) return t("errorSignedOut");
    if (status === 429) return t("errorTooFast");
    if (status === 400) return t("errorRejected");
    return t("errorGeneric");
  }

  async function vote(verdict: Verdict) {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    // 再点一次同一边就是撤票
    const undo = myVote === verdict;
    try {
      const res = await fetch(`${base}/vote`, {
        method: undo ? "DELETE" : "PUT",
        credentials: "include",
        headers: undo ? undefined : { "Content-Type": "application/json" },
        body: undo ? undefined : JSON.stringify({ verdict }),
      });
      if (!res.ok) {
        setError(failure(res.status));
        return;
      }
      const result = (await res.json()) as VoteResult;
      setMyVote(result.my_vote);
      setDiscussion((prev) =>
        prev
          ? { ...prev, up: result.up, down: result.down }
          : { full_name: `${owner}/${repo}`, up: result.up, down: result.down, comments: [] }
      );
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!user || busy || !text) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body_md: text, kind, locale }),
      });
      if (!res.ok) {
        setError(failure(res.status));
        return;
      }
      const { post } = (await res.json()) as { post: Post };
      setDiscussion((prev) =>
        prev
          ? { ...prev, comments: [...prev.comments, post] }
          : { full_name: `${owner}/${repo}`, up: 0, down: 0, comments: [post] }
      );
      setBody("");
      setKind("comment");
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/forum/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(failure(res.status));
        return;
      }
      setDiscussion((prev) =>
        prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== id) } : prev
      );
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  // 后端没配置（本地开发默认如此）就整块不渲染，别给一个点不动的空壳。
  if (!API_BASE) return null;

  const up = discussion?.up ?? 0;
  const down = discussion?.down ?? 0;
  const comments = discussion?.comments ?? [];

  return (
    <Card className="mt-5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4" />
          {t("title")}
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground tabular-nums">
              {comments.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <VoteButton
            active={myVote === "up"}
            disabled={!user || busy}
            count={up}
            label={t("useful")}
            onClick={() => vote("up")}
            icon={<ThumbsUp />}
          />
          <VoteButton
            active={myVote === "down"}
            disabled={!user || busy}
            count={down}
            label={t("notUseful")}
            onClick={() => vote("down")}
            icon={<ThumbsDown />}
          />
          {ready && !user && (
            <span className="text-xs text-muted-foreground">{t("voteNeedsLogin")}</span>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </p>
        )}

        {comments.length > 0 && (
          <ul className="space-y-4 border-t border-border/60 pt-4">
            {comments.map((post) => (
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
                    {post.kind === "issue" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        <TriangleAlert className="size-3" />
                        {t("issueTag")}
                      </span>
                    )}
                    <time className="text-xs text-muted-foreground" dateTime={post.created_at}>
                      {formatDay(post.created_at, locale)}
                    </time>
                    {user?.login === post.author.login && (
                      <button
                        type="button"
                        onClick={() => remove(post.id)}
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

        {ready && !user ? (
          <div className="flex flex-col items-start gap-2 border-t border-border/60 pt-4">
            <p className="text-sm text-muted-foreground">{t("joinPrompt")}</p>
            <Button asChild size="sm" className="rounded-lg">
              <Link href={`/login?from=/plugins/${owner}/${repo}`}>
                <GithubIcon className="size-4" />
                {t("joinButton")}
              </Link>
            </Button>
          </div>
        ) : user ? (
          <form onSubmit={submit} className="space-y-2 border-t border-border/60 pt-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
              rows={3}
              placeholder={kind === "issue" ? t("issuePlaceholder") : t("placeholder")}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={kind === "issue"}
                  onChange={(e) => setKind(e.target.checked ? "issue" : "comment")}
                  className="size-3.5 accent-amber-500"
                />
                {t("reportToggle")}
              </label>
              <Button
                type="submit"
                size="sm"
                disabled={busy || !body.trim()}
                className="rounded-lg"
              >
                {t("submit")}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function VoteButton({
  active,
  disabled,
  count,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  count: number;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className="rounded-lg"
    >
      {icon}
      {label}
      <span className="tabular-nums">{count}</span>
    </Button>
  );
}

function formatDay(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}
