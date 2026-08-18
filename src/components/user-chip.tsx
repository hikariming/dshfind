"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { SessionUser } from "@/lib/auth-shared";

const CACHE_KEY = "dshfind:me";

export interface SessionState {
  user: SessionUser | null;
  /** 答案是否已经拿到（缓存命中或请求返回）。登录页靠它避免先闪一下登录按钮。 */
  ready: boolean;
}

/**
 * 客户端会话读取：会话 cookie 由 Go API 签发且 httpOnly，浏览器读不到，
 * 只能问 /api/auth/me；结果（含未登录的否定结果）缓存在 sessionStorage，
 * 每个标签页会话最多请求一次。
 * 之所以不在服务端读——SSR 里碰 cookies() 会把全站页面拖回每请求动态渲染，
 * 这正是之前 Vercel 函数费用爆炸的根源。
 */
export function useSessionState(): SessionState {
  const [state, setState] = React.useState<SessionState>({
    user: null,
    ready: false,
  });

  React.useEffect(() => {
    let alive = true;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached != null) {
        const parsed = JSON.parse(cached) as { user: SessionUser | null };
        setState({ user: parsed.user ?? null, ready: true });
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
        if (alive) setState({ user: d.user ?? null, ready: true });
      })
      .catch(() => {
        if (alive) setState({ user: null, ready: true });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export function useSessionUser(): SessionUser | null {
  return useSessionState().user;
}

/**
 * 顶栏桌面端的登录用户块：只放一个头像，链到 /login（那里能看账号、退出）。
 * 站点对所有人开放后这个块人人可见，顶栏在 max-w-6xl 里已经很挤——
 * 用户名与退出按钮再占约 150px 就会把导航标签挤断行。
 */
export function UserChip() {
  const t = useTranslations("Header");
  const user = useSessionUser();
  if (!user) return null;

  return (
    <Link
      href="/login"
      aria-label={`@${user.login} · ${t("logout")}`}
      title={`@${user.login}`}
      className="hidden shrink-0 lg:block"
    >
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt=""
          className="size-7 rounded-full border border-border/60 transition-opacity hover:opacity-80"
        />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-full border border-border/60 text-xs font-medium uppercase">
          {user.login.slice(0, 1)}
        </span>
      )}
    </Link>
  );
}
