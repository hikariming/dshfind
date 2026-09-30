import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import { MIN_QUERY_LENGTH, type Suggestion } from "@/lib/suggest";
import { API_BASE } from "~/config";

/**
 * 顶栏搜索框 + 下拉建议（Preact 岛），行为与老站 search-box.tsx 一致：
 * 直连 API 的 /v1/suggest，失败降级同源 /api/suggest；防抖 + 中止；输入法组合期间不检索；
 * 方向键/回车/Esc 键盘操作；提交跳到 /[locale]/search。
 */

export interface SearchLabels {
  placeholder: string;
  search: string;
  /** 含 {query} */
  seeAll: string;
  featured: string;
}

/** 打字停顿多久才发请求 */
const DEBOUNCE_MS = 200;
/** 同一个词退格再打回来时直接命中，不重复请求 */
const cache = new Map<string, Suggestion[]>();
const CACHE_MAX = 50;

export default function SearchBox({ locale, labels: t }: { locale: string; labels: SearchLabels }) {
  const [query, setQuery] = useState("");
  // 真正参与检索的值：输入法组合中（拼音还没上屏）不跟着变
  const [committed, setCommitted] = useState("");
  const composing = useRef(false);
  const [fetched, setFetched] = useState<{ key: string; items: Suggestion[] }>({ key: "", items: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const trimmed = committed.trim();
  const cacheKey = trimmed.length >= MIN_QUERY_LENGTH ? trimmed.toLowerCase() : "";
  // 缓存命中立刻出结果；没命中就等这次 key 的请求回来，期间不展示上一次的旧结果
  const suggestions = useMemo<Suggestion[]>(
    () => (cacheKey ? (cache.get(cacheKey) ?? (fetched.key === cacheKey ? fetched.items : [])) : []),
    [cacheKey, fetched],
  );

  useEffect(() => {
    if (!cacheKey || cache.has(cacheKey)) return;
    // 防抖 + 中止：查询一变就取消上一次请求，顺带解决了乱序返回
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        let items: Suggestion[] | null = null;
        try {
          const res = await fetch(`${API_BASE}/v1/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
          if (res.ok) items = ((await res.json()) as { items?: Suggestion[] }).items ?? [];
        } catch (err) {
          // 用户继续输入触发的中止不算失败；其余（API 挂了/网络）降级
          if ((err as Error).name === "AbortError") return;
        }
        if (items === null) {
          const res = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
          if (!res.ok) return;
          items = ((await res.json()) as { items?: Suggestion[] }).items ?? [];
        }
        if (cache.size >= CACHE_MAX) cache.clear();
        cache.set(cacheKey, items);
        setFetched({ key: cacheKey, items });
      } catch {
        // 中止或网络出错：静默，别打断输入
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cacheKey, trimmed]);

  // 建议里的 href 不含语言前缀（老站由 next-intl 路由补齐）
  const go = (href: string) => {
    setOpen(false);
    window.location.href = `/${locale}${href}`;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    // 输入法候选框开着时，方向键/回车属于候选选择，别抢
    if (composing.current || e.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(suggestions.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0 && suggestions[active]) {
      e.preventDefault();
      go(suggestions[active].href);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    // 原生表单提交即跳 /[locale]/search?q=（无 JS 时同样可用）
    <form action={`/${locale}/search`} method="get" class="relative w-full" onSubmit={() => setOpen(false)}>
      <div class="flex items-center gap-2.5">
        <div class="relative flex-1">
          <svg
            class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            name="q"
            value={query}
            required
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value;
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
              setCommitted((e.target as HTMLInputElement).value);
            }}
            onFocus={() => setOpen(query.trim().length >= MIN_QUERY_LENGTH)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={onKeyDown}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            class="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 pl-9 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
        <button
          type="submit"
          aria-label={t.search}
          class="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div
          class="absolute top-full right-0 left-0 z-50 mt-2 max-h-[min(70vh,30rem)] overflow-y-auto rounded-xl border border-border/60 bg-background shadow-xl"
          onMouseDown={(e) => e.preventDefault()} // 让点击先于 blur
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(s.href)}
              class={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? "bg-muted" : "hover:bg-muted/60"}`}
            >
              <svg class="size-4 shrink-0 text-brand-500 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
                <circle cx="13" cy="12" r="2" />
                <path d="M18 19c-2.8 0-5-2.2-5-5v8" />
                <circle cx="20" cy="19" r="2" />
              </svg>
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-1.5">
                  <span class="truncate text-sm font-medium">{s.label}</span>
                  {s.featured && (
                    <span class="bg-gradient-brand inline-flex h-4 items-center rounded-4xl px-1.5 text-[10px] font-medium text-white">
                      ✨ {t.featured}
                    </span>
                  )}
                </span>
                <span class="block truncate text-xs text-muted-foreground">{s.sub}</span>
              </span>
              <span class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
                <svg class="size-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                </svg>
                {s.stars.toLocaleString("en-US")}
              </span>
            </button>
          ))}
          <button
            type="submit"
            onMouseEnter={() => setActive(-1)}
            class="flex w-full items-center justify-center gap-1.5 border-t border-border/60 px-4 py-2.5 text-sm text-brand-600 transition-colors hover:bg-brand-500/5 dark:text-brand-300"
          >
            {t.seeAll.replace("{query}", query.trim())}
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </form>
  );
}
