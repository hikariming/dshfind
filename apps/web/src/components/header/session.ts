import { useEffect, useState } from "preact/hooks";

import { SESSION_CACHE_KEY, SIGNED_IN_COOKIE, type SessionUser } from "@/lib/auth-shared";

/**
 * 客户端会话读取（与老站 user-chip.tsx 的 useSessionState 同口径）：
 * 会话 cookie 由 API 签发且 httpOnly，只能问 /api/auth/me；结果（含未登录）缓存在 sessionStorage，
 * 每个标签页最多请求一次。缓存必须对着非 httpOnly 的登录标记复核——OAuth 整页跳转回来时
 * sessionStorage 还留着登录前的否定结果。
 */
function hasSignedInMarker(): boolean {
  return document.cookie.split("; ").some((e) => e.startsWith(`${SIGNED_IN_COOKIE}=`) && !e.endsWith("="));
}

export function useSessionUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    let alive = true;
    const signedIn = hasSignedInMarker();
    try {
      const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (cached != null) {
        const parsed = JSON.parse(cached) as { user: SessionUser | null };
        // 缓存与登录标记一致才敢用：不一致说明刚登录或刚退出，都要重查
        if (Boolean(parsed.user) === signedIn) {
          setUser(parsed.user ?? null);
          return;
        }
      }
    } catch {
      // sessionStorage 不可用（隐私模式等）就退化为每页一次请求
    }
    // 从没登录过的人不必问：省掉绝大多数访客的一次请求
    if (!signedIn) return;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user: SessionUser | null }) => {
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user: d.user ?? null }));
        } catch {}
        if (alive) setUser(d.user ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return user;
}
