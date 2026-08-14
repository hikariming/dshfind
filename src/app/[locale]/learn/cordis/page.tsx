import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Clock, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContinueLessonCard,
  CourseProgressStat,
  LessonCatalog,
} from "@/components/course-progress";
import { cordisLessons } from "@/lib/lessons";
import { cordisTotalMinutes } from "@/lib/courses";
const LESSON_BASE = "/learn/cordis/lessons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Cordis");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

interface GlossaryItem {
  term: string;
  en: string;
  desc: string;
}

export default async function CordisCoursePage() {
  const tc = await getTranslations("Cordis");
  const tl = await getTranslations("Learn");
  const glossary = tc.raw("glossary") as GlossaryItem[];

  // 总时长按当前语言格式化（分钟/小时）
  const duration =
    cordisTotalMinutes >= 60
      ? tc("durationApproxHour", {
          n: Math.round((cordisTotalMinutes / 60) * 10) / 10,
        })
      : tc("durationApproxMin", { n: cordisTotalMinutes });

  return (
    <>
      {/* 课程头部 */}
      <div className="bg-gradient-brand relative overflow-hidden rounded-xl p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white backdrop-blur">
              {tl("chapters.ch2.tag")}
            </Badge>
            <Badge className="bg-white/20 text-white backdrop-blur">
              {tl("chapters.ch2.level")}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">
            {tl("chapters.ch2.courseTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85">
            {tl("chapters.ch2.courseDescription")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-base text-white/90">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="size-4" />
              {cordisLessons.length} {tc("lessonsCount")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {duration}
            </span>
            <CourseProgressStat lessons={cordisLessons} />
          </div>
        </div>
      </div>

      <ContinueLessonCard lessons={cordisLessons} hrefPrefix={LESSON_BASE} />

      {/* 课程目录 */}
      <h2 className="mt-10 text-2xl font-bold">{tc("catalogTitle")}</h2>
      <LessonCatalog lessons={cordisLessons} hrefPrefix={LESSON_BASE} />

      {/* 术语表 */}
      <div id="glossary" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-bold">{tc("glossaryTitle")}</h2>
        <p className="mt-2 text-base text-muted-foreground">
          {tc("glossaryNote")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {glossary.map((item) => (
            <Card key={item.term}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{item.term}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {item.en}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-base text-muted-foreground">
                {item.desc}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
