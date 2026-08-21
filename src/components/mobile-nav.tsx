"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, LogOut, Menu, MessagesSquare, Puzzle, X } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/search-box";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useSessionUser } from "@/components/user-chip";
import { logoutURL } from "@/lib/auth-api";

/**
 * 图标不能作为 props 从 server component 传过来（组件不可序列化），
 * 所以 server 那边只传 id，图标在这里查表。
 */
const ICONS = {
  learn: BookOpen,
  plugins: Puzzle,
  bbs: MessagesSquare,
} as const;

export type MobileNavItem = {
  id: keyof typeof ICONS;
  href: string;
  label: string;
};

/**
 * 窄屏（< lg）的汉堡菜单。
 * 顶栏在手机上放不下完整导航，所以窄屏把搜索、导航、语言、账号
 * 全收进这个抽屉。
 */
export function MobileNav({ items }: { items: MobileNavItem[] }) {
  const t = useTranslations("Header");
  const locale = useLocale();
  // 登录态走客户端（/api/auth/me + sessionStorage 缓存），不能从 server 传——
  // 那需要服务端读 cookies()，会让全站页面失去静态渲染。
  const user = useSessionUser();
  // 登出端点在 Go API（NEXT_PUBLIC_API_BASE_URL），客户端可直接拼
  const logoutAction = logoutURL(`/${locale}/login`);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // 路由一变就收起，否则抽屉会盖在刚跳过去的页面上。
  // 抽屉里的链接自己也会 setOpen(false)，这里兜的是前进/后退导航。
  const [shownAt, setShownAt] = React.useState(pathname);
  if (shownAt !== pathname) {
    setShownAt(pathname);
    if (open) setOpen(false);
  }

  React.useEffect(() => {
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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={open ? t("closeMenu") : t("menu")}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/*
        这里不能用 position:fixed —— header 带 backdrop-blur-xl，
        backdrop-filter 会让 header 成为 fixed 后代的包含块，
        抽屉会被压成 header 那 1px 高的盒子。
        改成锚定 header 的 absolute + top-full：既绕开这个坑，
        也自动对齐 header 下沿（顶部还有赞助商横幅时同样正确）。
      */}
      {open && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="absolute inset-x-0 top-full h-dvh bg-foreground/20 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            id="mobile-nav-panel"
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-6rem)] overflow-y-auto border-b border-border/60 bg-background px-4 pt-4 pb-6 shadow-xl lg:hidden"
          >
            <SearchBox compact />

            <nav className="mt-4 flex flex-col gap-1">
              {items.map((item) => {
                const Icon = ICONS[item.id];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-muted active:bg-muted"
                  >
                    <Icon className="size-5 text-muted-foreground" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
              <span className="text-sm text-muted-foreground">
                {t("language")}
              </span>
              <LocaleSwitcher />
            </div>

            {user && (
              <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                {user.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.login}
                    className="size-8 rounded-full border border-border/60"
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {user.login}
                </span>
                {logoutAction && (
                  <form action={logoutAction} method="post">
                    <Button variant="ghost" size="sm" type="submit">
                      <LogOut className="size-4" />
                      {t("logout")}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
