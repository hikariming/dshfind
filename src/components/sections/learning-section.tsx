"use client";

import Link from "next/link";
import { ArrowRight, Clock, GraduationCap, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { useLessonProgress } from "@/components/lesson-progress";
import { learnChapters } from "@/lib/nav";
import { cordisLessons, courses } from "@/lib/mock";

/** 每个章节的「进入」入口 */
const chapterEntry: Record<string, string> = {
  ch1: "/learn/intro/what-is-dsh",
  ch2: "/learn/cordis",
  ch3: "/learn/core/01-boot-config",
  ch4: "/learn/dev/01-hello-plugin",
};

const chapterBadge: Record<string, string> = {
  ch1: "第一章",
  ch2: "第二章",
  ch3: "第三章",
  ch4: "第四章",
  ch5: "第五章",
};

export function LearningSection() {
  const { learned, mounted, isLearned } = useLessonProgress();
  const th = useTranslations("Home");
  const tl = useTranslations("Learn");
  const featured = courses.find((c) => c.featured)!;

  // 论文精读进度：优先用真实已学会数量
  const cordisDone = mounted
    ? cordisLessons.filter((l) => isLearned(l.id)).length
    : featured.progress;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {th("learnTitle")} · <span className="text-brand-600 dark:text-brand-400">5</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {th("learnSubtitle")}
          </p>
        </div>
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/learn">
            {th("learnCta")}
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="mt-8 space-y-6">
        {/* ============ 精选：Cordis 论文精读 ============ */}
        <Card className="overflow-hidden border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent">
          <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-brand text-white">
                  <Sparkles className="size-3" />
                  {th("featuredTag")}
                </Badge>
                <Badge variant="outline">{th("featuredLevel")}</Badge>
                <Badge variant="secondary">{th("featuredStatus")}</Badge>
              </div>
              <CardTitle className="text-xl leading-snug sm:text-2xl">
                {featured.title}
              </CardTitle>
              <CardDescription className="text-base">
                {featured.description}
              </CardDescription>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  {featured.lessons} {th("lessonsCount")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {featured.duration}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-center gap-4 lg:border-l lg:border-border/60">
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-muted-foreground">{th("progress")}</span>
                  <span className="font-medium text-brand-500 dark:text-brand-300">
                    {cordisDone}/{featured.lessons}
                  </span>
                </div>
                <Progress
                  value={(cordisDone / featured.lessons) * 100}
                  className="h-2.5"
                />
              </div>
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/learn">
                  {th("continueLearning")}
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </div>
        </Card>

        {/* ============ 五大章节 ============ */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {learnChapters.map((chapter) => {
            const items = chapter.items.filter((it) => it.href);
            const total = items.length;
            const done = mounted
              ? items.filter((it) => isLearned(it.id)).length
              : 0;
            const href = chapterEntry[chapter.id];

            return (
              <Card key={chapter.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{chapterBadge[chapter.id]}</Badge>
                    {total === 0 && (
                      <Badge variant="outline">{th("preparing")}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-snug">
                    {tl(`chapters.${chapter.id}.title`).replace(/^第[一二三四五]章 · /, "")}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {tl(`chapters.${chapter.id}.description`)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GraduationCap className="size-4" />
                    {total > 0 ? `${total} ${th("lessonsCount")}` : th("preparing")}
                  </div>
                  {total > 0 ? (
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-muted-foreground">{th("progress")}</span>
                        <span className="font-medium text-brand-500 dark:text-brand-300">
                          {done}/{total}
                        </span>
                      </div>
                      <Progress
                        value={total > 0 ? (done / total) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  ) : (
                    <Progress value={0} className="h-2 opacity-30" />
                  )}
                  <Button
                    asChild={Boolean(href)}
                    variant={href ? "outline" : "secondary"}
                    className="w-full rounded-xl"
                    disabled={!href}
                  >
                    {href ? (
                      <Link href={href}>
                        {th("enterChapter")}
                        <ArrowRight />
                      </Link>
                    ) : (
                      <span>{th("stayTuned")}</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
