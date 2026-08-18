"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/github-icon";
import { useSessionState } from "@/components/user-chip";
import { Link } from "@/i18n/navigation";
import { githubLoginURL, logoutURL } from "@/lib/auth-api";

/** Go API 会带回来的失败原因；不认识的一律归到 unknown，绝不把 URL 参数原样显示。 */
const ERROR_KEYS = [
  "invalid_state",
  "not_configured",
  "token_exchange_failed",
  "user_fetch_failed",
  "invalid_callback",
  "oauth_denied",
  "oauth_unavailable",
] as const;

function errorKey(raw: string | null): string | null {
  if (!raw) return null;
  return (ERROR_KEYS as readonly string[]).includes(raw) ? raw : "unknown";
}

/** 只接受站内路径，挡掉 //evil.com 和反斜杠绕过。 */
function safePath(raw: string | null): string {
  return raw &&
    raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.includes("\\")
    ? raw
    : "/";
}

/**
 * 登录页的交互部分。
 *
 * 之所以整块放到客户端：页面本身要保持静态渲染（SSG），server 侧一碰 cookies()
 * 或 searchParams 就会把 /[locale]/login 打回每请求动态渲染。会话改由
 * /api/auth/me 读，错误码与 from 从 URL 读。
 */
export function LoginPanel({ gateEnabled }: { gateEnabled: boolean }) {
  const t = useTranslations("Login");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, ready } = useSessionState();

  const from = safePath(searchParams.get("from"));
  const returnTo = from === "/" ? `/${locale}` : `/${locale}${from}`;
  const loginURL = githubLoginURL(returnTo);
  const logoutAction = logoutURL(`/${locale}/login`);
  const key = errorKey(searchParams.get("error"));
  const errorText = key
    ? t(`errors.${key}`)
    : loginURL
      ? null
      : t("notConfigured");

  return (
    <>
      {errorText && (
        <div
          role="alert"
          className="mt-6 w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
        >
          {errorText}
        </div>
      )}

      <div className="mt-8 w-full">
        {!ready ? (
          <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
        ) : user ? (
          <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-6">
            <div className="flex items-center gap-3">
              {user.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.login}
                  className="size-10 rounded-full border border-border/60"
                />
              )}
              <div className="text-left">
                <div className="text-sm font-medium">@{user.login}</div>
                <div className="text-xs text-muted-foreground">
                  {t("signedInAs")}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="lg" className="rounded-xl">
                <Link href={from}>
                  {t("continue")}
                  <ArrowRight />
                </Link>
              </Button>
              {logoutAction && (
                <form action={logoutAction} method="post">
                  <Button variant="outline" size="lg" className="rounded-xl">
                    <LogOut />
                    {t("logout")}
                  </Button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <Button
            asChild={Boolean(loginURL)}
            disabled={!loginURL}
            size="lg"
            className="w-full rounded-xl bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            {loginURL ? (
              <a href={loginURL}>
                <GithubIcon className="size-5" />
                {t("loginButton")}
              </a>
            ) : (
              <>
                <GithubIcon className="size-5" />
                {t("loginButton")}
              </>
            )}
          </Button>
        )}
      </div>

      {/* 门禁关着的时候，不登录同样能看全站——把这条说清楚，别让人以为必须登录 */}
      {!gateEnabled && ready && !user && (
        <Link
          href={from}
          className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("browse")}
        </Link>
      )}
    </>
  );
}
