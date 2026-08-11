"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { locales, localeLabels, type Locale } from "@/i18n/config";

/**
 * 语言切换器：写入 NEXT_LOCALE cookie 后刷新页面。
 */
export function LocaleSwitcher() {
  const locale = useLocale();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
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
