import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/github-icon";
import { verifySession } from "@/lib/auth";

export const metadata: Metadata = { title: "登录" };

const errorMessages: Record<string, string> = {
  invalid_state: "登录状态校验失败，请重试。",
  not_configured: "服务端尚未配置 GitHub OAuth，请联系管理员。",
  token_exchange_failed: "与 GitHub 通信失败，请稍后重试。",
  no_token: "GitHub 授权失败，未取得访问令牌。",
  user_fetch_failed: "获取 GitHub 用户信息失败，请重试。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("Login");
  const user = await verifySession(
    (await cookies()).get("dshfind_session")?.value
  );

  // 已是成员：直接进站
  if (user?.isMember) {
    redirect({
      href: from && from.startsWith("/") ? from : "/",
      locale,
    });
  }

  const errorText = error ? errorMessages[error] ?? error : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="bg-gradient-brand flex size-16 items-center justify-center rounded-2xl text-white glow-brand">
        <GithubIcon className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {t("desc")}
        <span className="mx-1 font-mono text-brand-600 dark:text-brand-300">
          {t("org")}
        </span>
        {t("desc2")}
      </p>

      {errorText && (
        <div className="mt-4 w-full rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          {errorText}
        </div>
      )}

      {user ? (
        <div className="mt-8 flex w-full flex-col items-center gap-4 rounded-xl border border-border/60 p-6">
          <div className="flex items-center gap-3">
            {user.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.login}
                className="size-10 rounded-full"
              />
            )}
            <div className="text-left">
              <div className="text-sm font-medium">@{user.login}</div>
              <div className="text-xs text-muted-foreground">
                {user.isMember ? t("member") : t("notMember")}
              </div>
            </div>
          </div>
          {!user.isMember && (
            <p className="text-xs text-muted-foreground">
              {t("notMemberHint")}
            </p>
          )}
          <form action="/api/auth/logout" method="post">
            <Button variant="outline" className="rounded-xl">
              <LogOut />
              {t("logout")}
            </Button>
          </form>
        </div>
      ) : (
        <Button
          asChild
          size="lg"
          className="mt-8 rounded-xl bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          <Link href="/api/auth/github">
            <GithubIcon className="size-5" />
            {t("loginButton")}
          </Link>
        </Button>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        {t("privacy")}
      </p>
    </div>
  );
}
