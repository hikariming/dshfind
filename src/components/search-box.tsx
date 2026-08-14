"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  FolderGit2,
  Search,
  Trophy,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { learnChapters } from "@/lib/nav";
import { realPlugins } from "@/lib/plugins-real";
import { rankingUsers } from "@/lib/ranking-real";

interface Suggestion {
  type: "lesson" | "plugin" | "user";
  id: string;
  label: string;
  sub: string;
  href?: string;
  external?: boolean;
}

/** 少于这个长度不检索：单个字母（含输入法敲下的第一个拼音字母）会命中几乎全表。 */
const MIN_QUERY_LENGTH = 2;
/** 下拉最多展示的条数。 */
const MAX_SUGGESTIONS = 10;
const LIMIT = { lesson: 4, plugin: 5, user: 2 };

// 插件/用户索引与语言无关，惰性算一次并缓存；课程条目在组件内按当前语言生成。
// 插件描述加起来有几百 KB，拼串 + toLowerCase 只在首次检索时付一次：
// 既不拖慢 hydration（搜索框在每个页面的 header 里），也不会每次按键重算一遍。
interface SearchEntry {
  id: string;
  label: string;
  sub: string;
  href?: string;
  hay: string;
}

let pluginIndex: SearchEntry[] | null = null;
let userIndex: SearchEntry[] | null = null;

function getPluginIndex() {
  pluginIndex ??= realPlugins.map((p) => ({
    id: p.fullName,
    label: p.name,
    sub: p.description || `@${p.owner}`,
    href: p.url,
    hay: `${p.fullName} ${p.description} ${p.tags.join(" ")}`.toLowerCase(),
  }));
  return pluginIndex;
}

function getUserIndex() {
  userIndex ??= rankingUsers.map((u) => {
    const sub = `@${u.login} · ${u.badges.join(" · ")}`;
    return {
      id: u.id,
      label: u.name,
      sub,
      href: "/ranking",
      hay: `${u.name} ${sub}`.toLowerCase(),
    };
  });
  return userIndex;
}

/** 命中 limit 条就停，不再扫剩下的表。 */
function takeMatches(
  entries: SearchEntry[],
  q: string,
  limit: number,
  type: Suggestion["type"],
  external?: boolean
): Suggestion[] {
  const out: Suggestion[] = [];
  for (let i = 0; i < entries.length && out.length < limit; i++) {
    const e = entries[i];
    if (e.hay.includes(q)) {
      out.push({ type, id: e.id, label: e.label, sub: e.sub, href: e.href, external });
    }
  }
  return out;
}

function buildSuggestions(query: string, lessonIndex: SearchEntry[]): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];

  return [
    ...takeMatches(lessonIndex, q, LIMIT.lesson, "lesson"),
    ...takeMatches(getPluginIndex(), q, LIMIT.plugin, "plugin", true),
    ...takeMatches(getUserIndex(), q, LIMIT.user, "user"),
  ].slice(0, MAX_SUGGESTIONS);
}

const typeIcon = {
  lesson: <BookOpen className="size-4 shrink-0 text-brand-500 dark:text-brand-300" />,
  plugin: <FolderGit2 className="size-4 shrink-0 text-brand-500 dark:text-brand-400" />,
  user: <Trophy className="size-4 shrink-0 text-amber-500" />,
};

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const t = useTranslations("Common");
  const tl = useTranslations("Learn");
  // 课程条目的标题按当前语言从 messages 取（结构与 href 来自导航配置）
  const lessonIndex = React.useMemo<SearchEntry[]>(
    () =>
      learnChapters.flatMap((ch) =>
        ch.items
          .filter((i) => i.href)
          .map((i) => {
            const label = tl(`lessons.${i.href!.split("/").pop()}`);
            return {
              id: i.id,
              label,
              sub: tl(`chapters.${ch.id}.title`),
              href: i.href!,
              hay: label.toLowerCase(),
            };
          })
      ),
    [tl]
  );
  const typeLabel = {
    lesson: t("typeLesson"),
    plugin: t("typePlugin"),
    user: t("typeUser"),
  };
  const [query, setQuery] = React.useState("");
  // 真正参与检索的值：输入法组合中（拼音还没上屏）不跟着变，
  // 否则每敲一个拼音字母都要全表扫一遍，结果还全是噪音。
  const [committed, setCommitted] = React.useState("");
  const composing = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const blurTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(blurTimer.current), []);

  // 检索让给输入渲染：打字始终跟手，下拉稍后追上
  const deferredQuery = React.useDeferredValue(committed);
  const suggestions = React.useMemo(
    () => buildSuggestions(deferredQuery, lessonIndex),
    [deferredQuery, lessonIndex]
  );

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
