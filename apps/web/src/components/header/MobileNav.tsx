import { useEffect, useState } from "preact/hooks";

import { localeLabels, locales, type Locale } from "@/i18n/config";
import { apiURL } from "~/config";
import SearchBox, { type SearchLabels } from "~/components/header/SearchBox";
import { useSessionUser } from "~/components/header/session";

/**
 * 窄屏（< lg）的汉堡菜单：把搜索、导航、语言、账号收进抽屉。与老站 mobile-nav.tsx 一致。
 * 只在窄屏水合（client:media），桌面端不下载这段代码。
 */

export interface MobileNavItem {
  id: "learn" | "plugins" | "bbs";
  href: string;
  label: string;
}

export interface MobileNavLabels {
  menu: string;
  closeMenu: string;
  language: string;
  logout: string;
  search: SearchLabels;
}

const ICONS: Record<MobileNavItem["id"], string> = {
  learn:
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  plugins:
    '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
  bbs: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
};

export default function MobileNav({
  locale,
  items,
  labels: t,
}: {
  locale: Locale;
  items: MobileNavItem[];
  labels: MobileNavLabels;
}) {
  const user = useSessionUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // 抽屉展开期间锁掉背景滚动
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const rest = typeof window === "undefined" ? "" : window.location.pathname.replace(/^\/(zh|en|ja|ko)/, "");

  return (
    <>
      <button
        type="button"
        class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-all hover:bg-muted hover:text-foreground lg:hidden dark:hover:bg-muted/50"
        aria-label={open ? t.closeMenu : t.menu}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 12h16M4 6h16M4 18h16" />}
        </svg>
      </button>
      {/*
        不能用 position:fixed —— header 带 backdrop-blur，backdrop-filter 会让 header 成为 fixed 后代的
        包含块。锚定 header 的 absolute + top-full 既绕开这个坑，也自动对齐 header 下沿。
      */}
      {open && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            class="absolute inset-x-0 top-full h-dvh bg-foreground/20 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-nav-panel"
            class="absolute inset-x-0 top-full max-h-[calc(100dvh-6rem)] overflow-y-auto border-b border-border/60 bg-background px-4 pt-4 pb-6 shadow-xl lg:hidden"
          >
            <SearchBox locale={locale} labels={t.search} />
            <nav class="mt-4 flex flex-col gap-1">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  class="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-muted active:bg-muted"
                >
                  <svg
                    class="size-5 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: ICONS[item.id] }}
                  />
                  {item.label}
                </a>
              ))}
            </nav>
            <div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
              <span class="text-sm text-muted-foreground">{t.language}</span>
              <div class="flex flex-wrap gap-1">
                {locales.map((l) => (
                  <a
                    key={l}
                    href={`/${l}${rest}`}
                    hreflang={l}
                    onClick={() => {
                      document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`;
                    }}
                    class={`rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-muted ${l === locale ? "bg-muted font-medium" : "text-muted-foreground"}`}
                  >
                    {localeLabels[l]}
                  </a>
                ))}
              </div>
            </div>
            {user && (
              <div class="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                {user.avatar && <img src={user.avatar} alt={user.login} class="size-8 rounded-full border border-border/60" />}
                <span class="min-w-0 flex-1 truncate text-sm font-medium">{user.login}</span>
                <form action={apiURL("/auth/logout", `/${locale}/login`)} method="post">
                  <button type="submit" class="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[0.8rem] font-medium hover:bg-muted">
                    <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    {t.logout}
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
