"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  FolderGit2,
  Search,
  Trophy,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MIN_QUERY_LENGTH, type Suggestion } from "@/lib/suggest";

// 建议数据走 /api/suggest，不在这里 import 插件/课程/用户数据：
// 这是个 client component，任何数据 import 都会进每个页面的首屏 bundle。

/** 打字停顿多久才发请求。 */
const DEBOUNCE_MS = 200;

/** 同一个词退格再打回来时直接命中，不重复请求。 */
const cache = new Map<string, Suggestion[]>();
const CACHE_MAX = 50;

const typeIcon = {
  lesson: <BookOpen className="size-4 shrink-0 text-brand-500 dark:text-brand-300" />,
  plugin: <FolderGit2 className="size-4 shrink-0 text-brand-500 dark:text-brand-400" />,
  user: <Trophy className="size-4 shrink-0 text-amber-500" />,
};

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const t = useTranslations("Common");
  const locale = useLocale();
  const typeLabel = {
    lesson: t("typeLesson"),
    plugin: t("typePlugin"),
    user: t("typeUser"),
  };
  const [query, setQuery] = React.useState("");
  // 真正参与检索的值：输入法组合中（拼音还没上屏）不跟着变，
  // 否则每敲一个拼音字母都要发一次请求，结果还全是噪音。
  const [committed, setCommitted] = React.useState("");
  const composing = React.useRef(false);
  // 只记「哪个 key 的结果回来了」，用来触发重渲染；结果本身放 cache
  const [fetched, setFetched] = React.useState<{ key: string; items: Suggestion[] }>({
    key: "",
    items: [],
  });
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const blurTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(blurTimer.current), []);

  const trimmed = committed.trim();
  const cacheKey =
    trimmed.length >= MIN_QUERY_LENGTH ? `${locale}:${trimmed.toLowerCase()}` : "";

  // 渲染期直接派生：缓存命中立刻出结果；没命中就等这次 key 的请求回来，
  // 期间不展示上一次的旧结果（免得下拉和输入框对不上）
  const suggestions = React.useMemo<Suggestion[]>(() => {
    if (!cacheKey) return [];
    return cache.get(cacheKey) ?? (fetched.key === cacheKey ? fetched.items : []);
  }, [cacheKey, fetched]);

  React.useEffect(() => {
    if (!cacheKey || cache.has(cacheKey)) return;

    // 防抖 + 中止：查询一变就取消上一次请求，顺带解决了乱序返回
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/suggest?q=${encodeURIComponent(trimmed)}&locale=${locale}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const items: Suggestion[] = (await res.json()).items ?? [];
        if (cache.size >= CACHE_MAX) cache.clear();
        cache.set(cacheKey, items);
        setFetched({ key: cacheKey, items });
      } catch {
        // 请求被中止或网络出错：静默，别打断输入
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cacheKey, trimmed, locale]);

  const go = (href: string, external?: boolean) => {
    setOpen(false);
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // 输入法候选框开着时，方向键/回车属于候选选择，别抢
    if (composing.current || (e.nativeEvent as KeyboardEvent).isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(suggestions.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      if (active >= 0 && suggestions[active]) {
        const s = suggestions[active];
        e.preventDefault();
        if (s.href) go(s.href, s.external);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <form
      action="/search"
      method="get"
      onSubmit={submit}
      className="relative w-full"
    >
      <div className={`flex items-center gap-2.5 ${compact ? "" : "mx-auto max-w-xl"}`}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            name="q"
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              if (!composing.current) setCommitted(v);
              setActive(-1);
              setOpen(true);
            }}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={(e) => {
              composing.current = false;
              setCommitted(e.currentTarget.value);
            }}
            onFocus={() => setOpen(query.trim().length >= MIN_QUERY_LENGTH)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={onKeyDown}
            placeholder={t("searchPlaceholder")}
            className={`rounded-lg pl-9 ${compact ? "h-8 text-sm" : "h-12 text-base"}`}
          />
        </div>
        <Button type="submit" className={`rounded-lg ${compact ? "h-8 px-3 text-sm" : "h-12 px-6 text-base"}`}>
          <Search />
          {!compact && t("search")}
        </Button>
      </div>

      {/* 下拉建议 */}
      {open && suggestions.length > 0 && (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[min(70vh,30rem)] overflow-y-auto rounded-xl border border-border/60 bg-background shadow-xl"
          onMouseDown={(e) => e.preventDefault()} // 让点击先于 blur
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => s.href && go(s.href, s.external)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === active ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              {typeIcon[s.type]}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {s.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.sub}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {typeLabel[s.type]}
              </span>
            </button>
          ))}

          <button
            type="submit"
            onMouseEnter={() => setActive(-1)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-border/60 px-4 py-2.5 text-sm text-brand-600 transition-colors hover:bg-brand-500/5 dark:text-brand-300"
          >
            {t("seeAllResults", { query: query.trim() })}
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}
    </form>
  );
}
