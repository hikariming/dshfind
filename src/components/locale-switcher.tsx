"use client";

import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DropdownMenu } from "radix-ui";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * 语言切换器：切换到其他语言的同路径 URL（如 /learn/x → /en/learn/x），
 * 并同步写 cookie（用于 / 根路径与登录回调的语言选择）。
 *
 * 四种语言平铺时要占 216px，顶栏放不下（窄屏只能整个收进抽屉），
 * 所以收成一个下拉。
 */
export function LocaleSwitcher() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    router.replace(pathname, { locale: next });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("language")}
          className="h-8 gap-1.5 rounded-lg px-2 text-muted-foreground hover:text-foreground"
        >
          <Languages className="size-4" />
          <span className="text-xs font-medium">{localeLabels[locale as Locale]}</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          // header 本身是 z-50，菜单要压在它上面（portal 到 body，不受 header 的
          // backdrop-blur 包含块影响，这点和 mobile-nav 的抽屉不同）
          className="z-60 min-w-36 overflow-hidden rounded-xl border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {locales.map((l) => (
            <DropdownMenu.Item
              key={l}
              onSelect={() => switchTo(l)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none",
                "data-highlighted:bg-muted data-highlighted:text-foreground",
                locale === l && "font-medium",
              )}
            >
              {localeLabels[l]}
              {locale === l && <Check className="size-3.5 text-brand-500 dark:text-brand-300" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
