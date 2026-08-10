"use client";

import * as React from "react";

const STORAGE_KEY = "dshfind.learned.lessons";

interface LessonProgressContextValue {
  /** 用户标记为「已学会」的课程 id 集合 */
  learned: Set<string>;
  /** 是否已挂载（读 localStorage 之后），避免 SSR 不一致 */
  mounted: boolean;
  isLearned: (id: string) => boolean;
  toggleLearned: (id: string) => void;
}

const LessonProgressContext = React.createContext<
  LessonProgressContextValue | null
>(null);

export function LessonProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [learned, setLearned] = React.useState<Set<string>>(new Set());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLearned(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore malformed storage
    }
    setMounted(true);
  }, []);

  const toggleLearned = React.useCallback((id: string) => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  const isLearned = React.useCallback(
    (id: string) => learned.has(id),
    [learned]
  );

  return (
    <LessonProgressContext.Provider
      value={{ learned, mounted, isLearned, toggleLearned }}
    >
      {children}
    </LessonProgressContext.Provider>
  );
}

export function useLessonProgress() {
  const ctx = React.useContext(LessonProgressContext);
  if (!ctx) {
    throw new Error(
      "useLessonProgress must be used within LessonProgressProvider"
    );
  }
  return ctx;
}
