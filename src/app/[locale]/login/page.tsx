import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, ShieldCheck } from "lucide-react";

import { GithubIcon } from "@/components/github-icon";
import { LoginPanel } from "@/components/login-panel";
import { isLocale } from "@/i18n/config";
import { isGateEnabled } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Login" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * 登录页：对所有 GitHub 账号开放，不看组织、不看邀请。
 *
 * 页面壳子保持静态渲染（无 cookies()/searchParams），会话与错误码全部由
 * <LoginPanel /> 在客户端处理；useSearchParams 需要 Suspense 边界。
 */
export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Login");
  const perks = [t("perk1"), t("perk2"), t("perk3")];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center sm:py-24">
      <div className="bg-gradient-brand flex size-16 items-center justify-center rounded-2xl text-white">
        <GithubIcon className="size-8" />
      </div>

      <span className="mt-6 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
        {t("welcome")}
      </span>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("desc")}</p>

      <Suspense
        fallback={<div className="mt-8 h-10 w-full animate-pulse rounded-xl bg-muted" />}
      >
        <LoginPanel gateEnabled={isGateEnabled()} />
      </Suspense>

      <ul className="mt-8 w-full space-y-2 text-left">
        {perks.map((perk) => (
          <li
            key={perk}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <Check className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" />
            {perk}
          </li>
        ))}
      </ul>

      <p className="mt-6 flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        {t("privacy")}
      </p>
    </div>
  );
}
