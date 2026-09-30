import type { ComponentType } from "preact";
import { useEffect, useState } from "preact/hooks";

import { API_BASE } from "~/config";
import { useSessionState } from "~/components/header/session";

/**
 * 插件讨论区（Preact 岛，client:visible——滚到才下载）：投票 + 评论 + 反馈问题。
 * 行为与老站 plugin-discussion.tsx 一致，直连 API 服务；详情页本身不碰会话。
 *
 * 评论的 Markdown 渲染器（老站 src/components/markdown.tsx：react-markdown + remark-gfm，
 * 不解析原始 HTML）动态加载，且只在确实有评论时才加载——绝大多数插件页从头到尾不下载它。
 */

export interface DiscussionLabels {
  title: string;
  useful: string;
  notUseful: string;
  voteNeedsLogin: string;
  issueTag: string;
  delete: string;
  joinPrompt: string;
  joinButton: string;
  placeholder: string;
  issuePlaceholder: string;
  reportToggle: string;
  submit: string;
  errorSignedOut: string;
  errorTooFast: string;
  errorRejected: string;
  errorGeneric: string;
}

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

const MAX_BODY = 10 * 1024;

type MarkdownComponent = ComponentType<{ children: string }>;

const BTN_SM =
  "inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border border-transparent px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5";

const Icon = ({ d, cls = "" }: { d: string; cls?: string }) => (
  <svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
);
const THUMB_UP =
  '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>';
const THUMB_DOWN =
  '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>';

function formatDay(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export default function PluginDiscussion({
  owner,
  repo,
  locale,
  labels: t,
}: {
  owner: string;
  repo: string;
  locale: string;
  labels: DiscussionLabels;
}) {
  const { user, ready } = useSessionState();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [myVote, setMyVote] = useState<Verdict | null>(null);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"comment" | "issue">("comment");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [Markdown, setMarkdown] = useState<MarkdownComponent | null>(null);

  const base = `${API_BASE}/v1/plugins/${owner}/${repo}`;
  const comments = discussion?.comments ?? [];

  useEffect(() => {
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

  // 有评论才加载 Markdown 渲染器
  useEffect(() => {
    if (comments.length === 0 || Markdown) return;
    import("@/components/markdown").then((m) => setMarkdown(() => m.Markdown as unknown as MarkdownComponent));
  }, [comments.length, Markdown]);

  // 「我投了什么」是个人数据，公开讨论响应要能进缓存，所以单独问；只有登录用户会发这个请求
  useEffect(() => {
    if (!user) return;
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

  const failure = (status: number) =>
    status === 401 ? t.errorSignedOut : status === 429 ? t.errorTooFast : status === 400 ? t.errorRejected : t.errorGeneric;

  async function vote(verdict: Verdict) {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    const undo = myVote === verdict; // 再点一次同一边就是撤票
    try {
      const res = await fetch(`${base}/vote`, {
        method: undo ? "DELETE" : "PUT",
        credentials: "include",
        headers: undo ? undefined : { "Content-Type": "application/json" },
        body: undo ? undefined : JSON.stringify({ verdict }),
      });
      if (!res.ok) return setError(failure(res.status));
      const result = (await res.json()) as { up: number; down: number; my_vote: Verdict | null };
      setMyVote(result.my_vote);
      setDiscussion((prev) =>
        prev ? { ...prev, up: result.up, down: result.down } : { full_name: `${owner}/${repo}`, up: result.up, down: result.down, comments: [] },
      );
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: Event) {
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
      if (!res.ok) return setError(failure(res.status));
      const { post } = (await res.json()) as { post: Post };
      setDiscussion((prev) =>
        prev ? { ...prev, comments: [...prev.comments, post] } : { full_name: `${owner}/${repo}`, up: 0, down: 0, comments: [post] },
      );
      setBody("");
      setKind("comment");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/forum/posts/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) return setError(failure(res.status));
      setDiscussion((prev) => (prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== id) } : prev));
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const voteBtn = (verdict: Verdict, label: string, icon: string, count: number) => (
    <button
      type="button"
      disabled={!user || busy}
      aria-pressed={myVote === verdict}
      onClick={() => vote(verdict)}
      class={`${BTN_SM} ${
        myVote === verdict
          ? "bg-secondary text-secondary-foreground"
          : "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
      }`}
    >
      <Icon d={icon} />
      {label}
      <span class="tabular-nums">{count}</span>
    </button>
  );

  return (
    <div class="mt-5 flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10">
      <div class="px-4 pb-2">
        <div class="flex items-center gap-2 text-base leading-snug font-medium">
          <Icon cls="size-4" d='<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>' />
          {t.title}
          {comments.length > 0 && <span class="text-sm font-normal text-muted-foreground tabular-nums">{comments.length}</span>}
        </div>
      </div>

      <div class="space-y-5 px-4">
        <div class="flex flex-wrap items-center gap-2">
          {voteBtn("up", t.useful, THUMB_UP, discussion?.up ?? 0)}
          {voteBtn("down", t.notUseful, THUMB_DOWN, discussion?.down ?? 0)}
          {ready && !user && <span class="text-xs text-muted-foreground">{t.voteNeedsLogin}</span>}
        </div>

        {error && (
          <p class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">{error}</p>
        )}

        {comments.length > 0 && (
          <ul class="space-y-4 border-t border-border/60 pt-4">
            {comments.map((post) => (
              <li key={post.id} class="flex gap-3">
                {post.author.avatar ? (
                  <img src={post.author.avatar} alt="" class="size-8 shrink-0 rounded-full border border-border/60" />
                ) : (
                  <span class="size-8 shrink-0 rounded-full border border-border/60" />
                )}
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <a href={`https://github.com/${post.author.login}`} target="_blank" rel="noopener" class="text-sm font-medium hover:underline">
                      @{post.author.login}
                    </a>
                    {post.kind === "issue" && (
                      <span class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        <Icon cls="size-3" d='<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>' />
                        {t.issueTag}
                      </span>
                    )}
                    <time class="text-xs text-muted-foreground" dateTime={post.created_at}>
                      {formatDay(post.created_at, locale)}
                    </time>
                    {user?.login === post.author.login && (
                      <button
                        type="button"
                        onClick={() => remove(post.id)}
                        disabled={busy}
                        aria-label={t.delete}
                        class="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                      >
                        <Icon cls="size-3.5" d='<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>' />
                      </button>
                    )}
                  </div>
                  <div class="mt-1">
                    {/* 渲染器到达前先显示纯文本，不空着 */}
                    {Markdown ? <Markdown>{post.body_md}</Markdown> : <p class="text-sm leading-7 whitespace-pre-wrap">{post.body_md}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {ready && !user ? (
          <div class="flex flex-col items-start gap-2 border-t border-border/60 pt-4">
            <p class="text-sm text-muted-foreground">{t.joinPrompt}</p>
            <a
              href={`/${locale}/login?from=/plugins/${owner}/${repo}`}
              class={`${BTN_SM} bg-primary text-primary-foreground hover:bg-primary/80 [&_svg]:size-4`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              {t.joinButton}
            </a>
          </div>
        ) : user ? (
          <form onSubmit={submit} class="space-y-2 border-t border-border/60 pt-4">
            <textarea
              value={body}
              onInput={(e) => setBody((e.target as HTMLTextAreaElement).value.slice(0, MAX_BODY))}
              rows={3}
              placeholder={kind === "issue" ? t.issuePlaceholder : t.placeholder}
              class="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div class="flex flex-wrap items-center justify-between gap-2">
              <label class="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={kind === "issue"}
                  onChange={(e) => setKind((e.target as HTMLInputElement).checked ? "issue" : "comment")}
                  class="size-3.5 accent-amber-500"
                />
                {t.reportToggle}
              </label>
              <button type="submit" disabled={busy || !body.trim()} class={`${BTN_SM} bg-primary text-primary-foreground hover:bg-primary/80`}>
                {t.submit}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
