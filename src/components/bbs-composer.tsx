"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/github-icon";
import { Markdown } from "@/components/markdown";
import { useSessionState } from "@/components/user-chip";
import { Link, useRouter } from "@/i18n/navigation";
import {
  BOARDS,
  FORUM_API_BASE,
  MAX_THREAD_BODY,
  MAX_THREAD_TITLE,
  threadPath,
  type PostableBoard,
  type Thread,
} from "@/lib/forum";

/**
 * 发主题帖。announce 板前端不藏——能不能发由 Go 端按 FORUM_ADMIN_LOGINS 判定，
 * 被拒时回 403，这里翻成一句人话。把准入判断也搬到前端只会多一份要同步的名单。
 */
/**
 * 400 只说明"没过校验"，但作者需要知道是哪一项没过——尤其是自定义链接，
 * 它是唯一一个填了却可能被整条拒掉的字段。
 */
async function rejection(res: Response): Promise<"errorSlugRejected" | "errorThreadRejected"> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body.error?.message?.includes("slug")) return "errorSlugRejected";
  } catch {
    // 响应体不是 JSON 就按通用的校验失败处理
  }
  return "errorThreadRejected";
}

export function BbsComposer() {
  const t = useTranslations("Bbs");
  const locale = useLocale();
  const router = useRouter();
  const { user, ready } = useSessionState();

  const [board, setBoard] = React.useState<PostableBoard>("general");
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [body, setBody] = React.useState("");
  const [preview, setPreview] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!user || busy || !cleanTitle || !cleanBody) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${FORUM_API_BASE}/v1/forum/threads`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board,
          title: cleanTitle,
          body_md: cleanBody,
          locale,
          slug: slug.trim(),
        }),
      });
      if (!res.ok) {
        if (res.status === 401) setError(t("errorSignedOut"));
        else if (res.status === 403) setError(t("errorAnnounceOnly"));
        else if (res.status === 429) setError(t("errorTooFast"));
        else if (res.status === 400) setError(t(await rejection(res)));
        else setError(t("errorGeneric"));
        setBusy(false);
        return;
      }
      const { thread } = (await res.json()) as { thread: Thread };
      // 成功后不解锁：正在跳去帖子页，解开只会给重复提交留一扇门。
      router.push(threadPath(thread.slug));
    } catch {
      setError(t("errorGeneric"));
      setBusy(false);
    }
  }

  if (!FORUM_API_BASE) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground sm:px-6">
        {t("backendMissing")}
      </p>
    );
  }

  if (ready && !user) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 px-4 py-16 sm:px-6">
        <h1 className="text-xl font-semibold">{t("newThread")}</h1>
        <p className="text-sm text-muted-foreground">{t("postNeedsLogin")}</p>
        <Button asChild size="sm" className="rounded-lg">
          <Link href="/login?from=/bbs/new">
            <GithubIcon className="size-4" />
            {t("signIn")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("newThread")}</h1>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {BOARDS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setBoard(name)}
            aria-pressed={board === name}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              board === name
                ? "border-brand-500 bg-brand-500/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {t(`boards.${name}`)}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, MAX_THREAD_TITLE))}
        placeholder={t("titlePlaceholder")}
        className="mt-4 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      {/* 中文标题自动生成不出可读的地址（路由段只吃 ASCII），写文章时可以自己指定 */}
      <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="shrink-0">/bbs/t/</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value.slice(0, 60))}
          placeholder={t("slugPlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-2 py-1 font-mono text-xs outline-none focus-visible:border-ring"
        />
        <span className="w-full sm:w-auto">{t("slugHint")}</span>
      </label>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{t("markdownHint")}</span>
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {preview ? <PenLine className="size-3.5" /> : <Eye className="size-3.5" />}
          {preview ? t("edit") : t("preview")}
        </button>
      </div>

      {preview ? (
        <div className="mt-2 min-h-64 rounded-xl border border-border/60 px-3 py-2">
          {body.trim() ? (
            <Markdown>{body}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">{t("previewEmpty")}</p>
          )}
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_THREAD_BODY))}
          rows={16}
          placeholder={t("bodyPlaceholder")}
          className="mt-2 w-full rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-lg">
          <Link href="/bbs">{t("cancel")}</Link>
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={busy || !title.trim() || !body.trim()}
          className="rounded-lg"
        >
          {t("publish")}
        </Button>
      </div>
    </form>
  );
}
