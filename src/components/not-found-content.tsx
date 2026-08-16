"use client";

import Image from "next/image";
import { Home, Puzzle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * 404 页面主体：漂浮的鲸鱼吉祥物 + 渐变大字 404 + 文案 + 导航按钮。
 *
 * 用在两处：
 *  - app/not-found.tsx（未匹配 URL 的全局 404，自带 ThemeProvider + i18n Provider 包裹）
 *  - app/[locale]/not-found.tsx（segment 内 notFound() 触发，由 [locale] layout 提供包裹）
 *
 * 是 client component：要用 next-intl 的 useTranslations + Link，
 * 二者都依赖外层 NextIntlClientProvider 注入的 locale/messages。
 */
export function NotFoundContent() {
  const t = useTranslations("NotFound");
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <Image
        src="/brand/dshfind-whale.png"
        alt=""
        width={160}
        height={160}
        className="size-32 animate-float object-contain sm:size-40"
        priority
      />
      <h1 className="mt-6 bg-gradient-brand bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
        {t("code")}
      </h1>
      <p className="mt-4 text-xl font-semibold sm:text-2xl">{t("whaleLine")}</p>
      <p className="mt-2 max-w-md text-muted-foreground">{t("description")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="rounded-lg">
          <Link href="/">
            <Home />
            {t("goHome")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/plugins">
            <Puzzle />
            {t("browsePlugins")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
