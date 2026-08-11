"use client";

import * as React from "react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLessonProgress } from "@/components/lesson-progress";
import type { LearnChapterItem } from "@/lib/types";

/**
 * 课程页底部的「上一节 / 已学会 / 下一节」导航。
 * 传入有序的章节条目，根据当前路径自动匹配。
 */
export function LessonFooterNav({ items }: { items: LearnChapterItem[] }) {
  const pathname = usePathname();
  const { isLearned, toggleLearned } = useLessonProgress();
  const t = useTranslations("LessonNav");

  const idx = items.findIndex(
    (it) => it.href && pathname?.startsWith(it.href)
  );
  if (idx === -1) return null;

  const current = items[idx];
  const prev = idx > 0 ? items[idx - 1] : null;
  const next = idx < items.length - 1 ? items[idx + 1] : null;
  const learned = isLearned(current.id);

  return (
    <div className="mt-14 border-t border-border/60 pt-6">
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        {/* 上一节 */}
        {prev?.href ? (
          <Link
            href={prev.href}
            className="group flex flex-col gap-1 rounded-xl border border-border/60 px-4 py-3 transition-colors hover:border-brand-500/40 hover:bg-brand-500/5"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              {t("prev")}
            </span>
            <span className="truncate text-sm font-medium">
              {prev.index !== undefined && `${prev.index}. `}
              {prev.label}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {/* 已学会 */}
        <div className="flex justify-center">
          <Button
            variant={learned ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => toggleLearned(current.id)}
          >
            {learned ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Circle className="size-4" />
            )}
            {learned ? t("learned") : t("markLearned")}
          </Button>
        </div>

        {/* 下一节 */}
        {next?.href ? (
          <Link
            href={next.href}
            className="group flex flex-col items-end gap-1 rounded-xl border border-border/60 px-4 py-3 text-right transition-colors hover:border-brand-500/40 hover:bg-brand-500/5"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              下一节
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="truncate text-sm font-medium">
              {next.index !== undefined && `${next.index}. `}
              {next.label}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
