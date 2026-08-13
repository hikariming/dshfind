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

// 静态索引（构建时一次算好）
const lessonIndex = learnChapters
  .flatMap((ch) =>
    ch.items
      .filter((i) => i.href)
      .map((i) => ({
        id: i.id,
        label: i.label,
        sub: ch.title,
        href: i.href!,
      }))
  );

const pluginIndex = realPlugins.map((p) => ({
  id: p.fullName,
  label: p.name,
  sub: p.description || `@${p.owner}`,
  href: p.url,
  keywords: `${p.fullName} ${p.description} ${p.tags.join(" ")}`,
}));

const userIndex = rankingUsers.map((u) => ({
  id: u.id,
  label: u.name,
  sub: `@${u.login} · ${u.badges.join(" · ")}`,
}));

function buildSuggestions(query: string): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const lessons: Suggestion[] = lessonIndex
    .filter((i) => i.label.toLowerCase().includes(q))
    .slice(0, 4)
    .map((i) => ({ type: "lesson", id: i.id, label: i.label, sub: i.sub, href: i.href }));

  const plugins: Suggestion[] = pluginIndex
    .filter((i) => i.keywords.toLowerCase().includes(q))
    .slice(0, 3)
    .map((i) => ({
      type: "plugin",
      id: i.id,
      label: i.label,
      sub: i.sub,
      href: i.href,
      external: true,
    }));

  const users: Suggestion[] = userIndex
    .filter((i) => `${i.label} ${i.sub}`.toLowerCase().includes(q))
    .slice(0, 2)
    .map((i) => ({ type: "user", id: i.id, label: i.label, sub: i.sub, href: "/ranking" }));

  return [...lessons, ...plugins, ...users].slice(0, 8);
}

const typeIcon = {
  lesson: <BookOpen className="size-4 shrink-0 text-brand-500 dark:text-brand-300" />,
  plugin: <FolderGit2 className="size-4 shrink-0 text-accent-violet" />,
  user: <Trophy className="size-4 shrink-0 text-amber-500" />,
};

const typeLabel = {
  lesson: "课程",
  plugin: "插件",
  user: "用户",
};

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const t = useTranslations("Common");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const blurTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const suggestions = React.useMemo(
    () => buildSuggestions(query),
    [query]
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
              setQuery(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(Boolean(query.trim()))}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={onKeyDown}
            placeholder={t("searchPlaceholder")}
            className={`rounded-xl pl-9 ${compact ? "h-8 text-sm" : "h-12 text-base"}`}
          />
        </div>
        <Button type="submit" className={`rounded-xl ${compact ? "h-8 px-3 text-sm" : "h-12 px-6 text-base"}`}>
          <Search />
          {!compact && "搜索"}
        </Button>
      </div>

      {/* 下拉建议 */}
      {open && suggestions.length > 0 && (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-border/60 bg-background shadow-xl"
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
            查看全部「{query.trim()}」的结果
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}
    </form>
  );
}
