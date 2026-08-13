"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  BookMarked,
  BookOpen,
  Check,
  List,
  PlayCircle,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { useLessonProgress } from "@/components/lesson-progress";
import { learnChapters } from "@/lib/nav";

const allItems = learnChapters.flatMap((chapter) => chapter.items);

/** 根据当前路径找到处于激活状态的导航条目 id */
function findActiveId(pathname: string | null): string | null {
  if (!pathname) return null;
  const item = allItems.find(
    (it) => it.href && pathname.startsWith(it.href)
  );
  return item?.id ?? null;
}

/** 非激活状态下的右侧小图标（进行中/已完成/未解锁） */
/** 已学会打勾，当前课显示播放图标；其余无标记。学会与否只看本机进度。 */
function StatusIcon({
  learned,
  current,
  white,
}: {
  learned: boolean;
  current: boolean;
  white: boolean;
}) {
  if (learned) {
    return <Check className="size-4 shrink-0 text-emerald-500" />;
  }
  if (current) {
    return (
      <PlayCircle
        className={`size-4 shrink-0 ${white ? "text-white/90" : "text-brand-500 dark:text-brand-300"}`}
      />
    );
  }
  return null;
}

/**
 * 学习站点通用侧栏导航：学习进度 + 学习中心 + 五大章节目录。
 * 当前所在章节用实心高亮标记，并滚动到导航可视区。
 */
export function LearnNav() {
  const pathname = usePathname();
  const t = useTranslations("Learn");
  const navRef = React.useRef<HTMLElement>(null);
  const { learned, mounted, isLearned } = useLessonProgress();

  const activeId = findActiveId(pathname);

  // 章节变化时，把当前条目滚动到导航容器中间
  React.useEffect(() => {
    if (!activeId) return;
    const container = navRef.current;
    const el = container?.querySelector(`[data-nav-id="${activeId}"]`);
    if (container && el instanceof HTMLElement) {
      const top =
        el.offsetTop - container.offsetTop - container.clientHeight / 2 + 24;
      container.scrollTo({ top, behavior: "smooth" });
    }
  }, [pathname, activeId]);

  // 学习进度：所有可学习的章节（第一章 3 节 + 第二章 13 节）中已标记「已学会」的数量
  const learnableItems = allItems.filter((it) => it.href);
  const total = learnableItems.length;
  const done = mounted
    ? learnableItems.filter((it) => isLearned(it.id)).length
    : 0;

  return (
    <nav ref={navRef} className="space-y-0.5">
      <div className="flex items-center gap-2 px-2 pb-3 text-sm font-semibold text-muted-foreground">
        <List className="size-4" />
        {t("courseNav")}
      </div>

      {/* 学习进度 */}
      <div className="mb-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("progress")}</span>
          <span className="font-medium text-brand-500 dark:text-brand-300">
            {done}/{total}
          </span>
        </div>
        <Progress
          value={total > 0 ? (done / total) * 100 : 0}
          className="h-1.5"
        />
      </div>

      <Link
        href="/learn"
        data-nav-id="learn"
        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
          pathname === "/learn"
            ? "bg-brand-600 text-white dark:bg-brand-500"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <BookOpen className="size-4 shrink-0" />
        {t("learningCenter")}
      </Link>

      {learnChapters.map((chapter) => (
        <div key={chapter.id} className="pt-3">
          <div className="px-3 pb-1.5 text-[13px] font-semibold tracking-wide text-muted-foreground/80">
            {t(`chapters.${chapter.id}.title`)}
          </div>
          <div className="space-y-0.5">
            {chapter.items.map((item) => {
              const isActive = item.id === activeId;
              const isLearnedItem = mounted && isLearned(item.id);
              return item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  data-nav-id={item.id}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] transition-colors ${
                    isActive
                      ? "bg-brand-600 font-semibold text-white shadow-sm dark:bg-brand-500"
                      : isLearnedItem
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.index !== undefined && (
                    <span
                      className={`w-4 shrink-0 text-right tabular-nums ${
                        isActive ? "text-white/70" : "text-muted-foreground/70"
                      }`}
                    >
                      {item.index}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {t(`lessons.${item.href.split("/").pop()}`)}
                  </span>
                  <StatusIcon
                    learned={isLearnedItem}
                    current={isActive}
                    white={isActive}
                  />
                </Link>
              ) : (
                <div
                  key={item.id}
                  className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-[15px] text-muted-foreground/60"
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.note && (
                    <span className="shrink-0 rounded-full border border-border/60 px-1.5 py-0.5 text-[11px] text-muted-foreground/70">
                      {item.note}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Link
        href="/learn/cordis#glossary"
        className="mt-3 flex items-center gap-2 rounded-lg border-t border-border/60 px-3 pt-3 text-[15px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <BookMarked className="size-4 shrink-0" />
        {t("glossary")}
      </Link>
    </nav>
  );
}
