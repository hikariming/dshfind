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

export interface SessionState {
  user: SessionUser | null;
  /** 答案是否已经拿到（缓存命中、确定未登录或请求返回）；讨论区靠它避免先闪一下登录按钮 */
  ready: boolean;
}

export function useSessionState(): SessionState {
  const [state, setState] = useState<SessionState>({ user: null, ready: false });
  useEffect(() => {
    let alive = true;
    const signedIn = hasSignedInMarker();
    try {
      const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (cached != null) {
        const parsed = JSON.parse(cached) as { user: SessionUser | null };
        // 缓存与登录标记一致才敢用：不一致说明刚登录或刚退出，都要重查
        if (Boolean(parsed.user) === signedIn) {
          setState({ user: parsed.user ?? null, ready: true });
          return;
        }
      }
    } catch {
      // sessionStorage 不可用（隐私模式等）就退化为每页一次请求
    }
    // 没有登录标记就一定没登录（标记与会话 cookie 成对下发）：省掉绝大多数访客的一次请求
    if (!signedIn) {
      setState({ user: null, ready: true });
      return;
    }
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user: SessionUser | null }) => {
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user: d.user ?? null }));
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
