"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutURL } from "@/lib/auth-api";
import type { SessionUser } from "@/lib/auth-shared";

const CACHE_KEY = "dshfind:me";

/**
 * 客户端会话读取：会话 cookie 由 Go API 签发且 httpOnly，浏览器读不到，
 * 只能问 /api/auth/me；结果（含未登录的否定结果）缓存在 sessionStorage，
 * 每个标签页会话最多请求一次。
 * 之所以不在服务端读——SSR 里碰 cookies() 会把全站页面拖回每请求动态渲染，
 * 这正是之前 Vercel 函数费用爆炸的根源。
 */
export function useSessionUser(): SessionUser | null {
  const [user, setUser] = React.useState<SessionUser | null>(null);

  React.useEffect(() => {
    let alive = true;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached != null) {
        const parsed = JSON.parse(cached) as { user: SessionUser | null };
        if (parsed.user) setUser(parsed.user);
        return;
      }
    } catch {
      // sessionStorage 不可用（隐私模式等）就退化为每页一次请求
    }
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user: SessionUser | null }) => {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ user: d.user ?? null }));
        } catch {}
        if (alive && d.user) setUser(d.user);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return user;
}

/** 顶栏桌面端的登录用户块：头像 + 用户名 + 退出。未登录/非成员不渲染。 */
export function UserChip() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const user = useSessionUser();
  const logoutAction = logoutURL(`/${locale}/login`);
  if (!user?.isMember) return null;

  return (
    <div className="hidden items-center gap-2 lg:flex">
      {user.avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt={user.login}
          className="size-7 rounded-full border border-border/60"
        />
      )}
      <span className="hidden max-w-28 truncate text-sm font-medium xl:inline">
        {user.login}
      </span>
      {logoutAction && (
        <form action={logoutAction} method="post">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("logout")}
            type="submit"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
