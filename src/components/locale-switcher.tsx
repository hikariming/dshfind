"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/config";

/**
 * 语言切换器：切换到其他语言的同路径 URL（如 /learn/x → /en/learn/x），
 * 并同步写 cookie（用于 / 根路径与登录回调的语言选择）。
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    router.replace(pathname, { locale: next });
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 p-0.5">
      <Languages className="ml-1.5 mr-0.5 size-3.5 text-muted-foreground" />
      {locales.map((l) => (
        <Button
          key={l}
          type="button"
          variant={locale === l ? "default" : "ghost"}
          size="xs"
          className="h-6 px-2 text-xs"
          onClick={() => switchTo(l)}
        >
          {localeLabels[l]}
        </Button>
      ))}
    </div>
  );
}
