"use client";

import { Check, Lock, PlayCircle } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLessonProgress } from "@/components/lesson-progress";
import { deriveLessonStatus, nextLesson } from "@/lib/lesson-status";
import type { Lesson, LessonStatus } from "@/lib/types";

const statusIcon: Record<LessonStatus, React.ReactNode> = {
  completed: <Check className="size-4 text-emerald-500" />,
  in_progress: <PlayCircle className="size-4 text-brand-500 dark:text-brand-300" />,
  locked: <Lock className="size-4 text-muted-foreground" />,
};

/** 课程头部的「进度 x/y」与进度条；挂载前按 0 渲染，避免 SSR 不一致。 */
export function CourseProgressStat({ lessons }: { lessons: Lesson[] }) {
  const { mounted, isLearned } = useLessonProgress();
  const done = mounted ? lessons.filter((l) => isLearned(l.id)).length : 0;

  return (
    <>
      <span>
        进度 {done}/{lessons.length}
      </span>
      <div className="mt-4 w-full max-w-md">
        <Progress
          value={lessons.length ? (done / lessons.length) * 100 : 0}
          className="h-2 bg-white/25 [&>div]:bg-white"
        />
      </div>
    </>
  );
}

/** 「继续学习」入口——指向第一节尚未标记学会的课。 */
export function ContinueLessonCard({
  lessons,
  hrefPrefix,
}: {
  lessons: Lesson[];
  /** 课程链接前缀，最终地址为 `${hrefPrefix}/${lesson.slug}`。 */
  hrefPrefix: string;
}) {
  const { mounted, isLearned } = useLessonProgress();
  const current = mounted ? nextLesson(lessons, isLearned) : lessons[0];
  if (!current) return null;

  return (
    <Card className="mt-6 border-brand-500/30 bg-brand-500/5">
      <CardContent className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
        <div>
          <div className="text-base font-medium">继续学习：第 {current.index} 课</div>
          <CardDescription className="mt-0.5 text-base">{current.title}</CardDescription>
        </div>
        <Button asChild className="rounded-xl">
          <Link href={`${hrefPrefix}/${current.slug}`}>
            <PlayCircle />
            开始这一课
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** 课程目录，状态由本机学习进度推导。 */
export function LessonCatalog({
  lessons,
  hrefPrefix,
}: {
  lessons: Lesson[];
  /** 课程链接前缀，最终地址为 `${hrefPrefix}/${lesson.slug}`。 */
  hrefPrefix: string;
}) {
  const { mounted, isLearned } = useLessonProgress();
  const status = deriveLessonStatus(lessons, mounted ? isLearned : () => false);

  return (
    <div className="mt-4 space-y-2">
      {lessons.map((lesson) => {
        const state = status.get(lesson.id) ?? "locked";
        return (
          <Link
            key={lesson.id}
            href={`${hrefPrefix}/${lesson.slug}`}
            className={`flex scroll-mt-24 items-start gap-4 rounded-xl border border-border/60 p-4 transition-colors ${
              state === "in_progress"
                ? "border-brand-500/40 bg-brand-500/5 hover:bg-brand-500/10"
                : state === "completed"
                  ? "bg-background hover:bg-muted/50"
                  : "bg-muted/30 opacity-70"
            }`}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
              {lesson.index}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-medium">{lesson.title}</span>
                {state === "completed" && (
                  <Badge variant="secondary" className="text-[10px]">
                    已学会
                  </Badge>
                )}
                {state === "in_progress" && <Badge className="text-[10px]">下一节</Badge>}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{lesson.summary}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {lesson.duration}
              </span>
              {statusIcon[state]}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
