"use client";

import { Link } from "@/i18n/navigation";
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
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { useTranslations } from "next-intl";
import { useLessonProgress } from "@/components/lesson-progress";
import { learnChapters } from "@/lib/nav";
import { cordisLessons } from "@/lib/lessons";
import { cordisTotalMinutes, featuredCourse } from "@/lib/courses";

/** 每个章节的「进入」入口 */
const chapterEntry: Record<string, string> = {
  ch1: "/learn/intro/what-is-dsh",
  ch2: "/learn/cordis",
  ch3: "/learn/core/01-boot-config",
  ch4: "/learn/dev/01-hello-plugin",
  ch5: "/learn/plugin/01-what-is-plugin",
};

export function LearningSection() {
  const { mounted, isLearned } = useLessonProgress();
  const th = useTranslations("Home");
  const tl = useTranslations("Learn");
  const tc = useTranslations("Cordis");
  const featured = featuredCourse;

  // 精选课总时长按当前语言格式化（分钟/小时）
  const featuredDuration =
    cordisTotalMinutes >= 60
      ? tc("durationApproxHour", {
          n: Math.round((cordisTotalMinutes / 60) * 10) / 10,
        })
      : tc("durationApproxMin", { n: cordisTotalMinutes });

  // 论文精读进度：全部来自本机已学会记录，挂载前按 0 渲染
  const cordisDone = mounted
    ? cordisLessons.filter((l) => isLearned(l.id)).length
    : 0;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        title={th("learnTitle")}
        accent="5"
        description={th("learnSubtitle")}
        action={
          <Button asChild variant="ghost" className="hidden shrink-0 sm:inline-flex">
            <Link href="/learn">
              {th("learnCta")}
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="mt-10 space-y-6">
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
              </div>
              <CardTitle className="text-xl leading-snug sm:text-2xl">
                {tl("chapters.ch2.courseTitle")}
              </CardTitle>
              <CardDescription className="text-base">
                {tl("chapters.ch2.courseDescription")}
              </CardDescription>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  {featured.lessons} {th("lessonsCount")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {featuredDuration}
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
              <Button asChild size="lg" className="rounded-lg">
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
          {learnChapters.map((chapter, i) => {
            const items = chapter.items.filter((it) => it.href);
            const total = items.length;
            const done = mounted
              ? items.filter((it) => isLearned(it.id)).length
              : 0;
            const href = chapterEntry[chapter.id];

            return (
              <Reveal key={chapter.id} delay={60 * i} className="flex">
              <Card className="flex w-full flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {tl(`chapters.${chapter.id}.title`).split(" · ")[0]}
                    </Badge>
                    {total === 0 && (
                      <Badge variant="outline">{th("preparing")}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-snug">
                    {tl(`chapters.${chapter.id}.title`).split(" · ").slice(1).join(" · ")}
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
                    className="w-full rounded-lg"
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
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
