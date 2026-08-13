import type { Metadata } from "next";
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
import { courses } from "@/lib/courses";
const LESSON_BASE = "/learn/cordis/lessons";

export const metadata: Metadata = {
  title: "Cordis 论文精读",
  description: "从零读懂《一种面向时空可组合性的编程范式》：可回退效应与反应式余效应。",
};

const glossary = [
  {
    term: "时间可组合性",
    en: "temporal composability",
    desc: "移除组件时，完整且安全地回退该组件对共享环境所作修改的能力。",
  },
  {
    term: "空间可组合性",
    en: "spatial composability",
    desc: "组件以结构化、可验证的方式声明、发现并解析彼此依赖的能力。",
  },
  {
    term: "可回退效应",
    en: "revertible effect",
    desc: "每个上下文变换都显式给出逆函数，运行时记录并组合逆函数，卸载即恢复。",
  },
  {
    term: "反应式余效应",
    en: "reactive coeffect",
    desc: "组件声明依赖规格，依赖满足性变化时自动驱动激活与停用。",
  },
  {
    term: "效应上下文",
    en: "effect context",
    desc: "∂Γ ≔ Γ × 𝔉Γ：当前状态与累积恢复变换组成的运行时上下文。",
  },
  {
    term: "余效应上下文",
    en: "coeffect context",
    desc: "Σ ≔ (k ∶ K) ⇀ 𝒱ₖ：从依赖键到有类型值的有限依赖偏函数。",
  },
  {
    term: "纪元",
    en: "epoch",
    desc: "已解析依赖值的元组，用于给目标状态的具体依赖配置编号。",
  },
  {
    term: "惯性状态",
    en: "inertial state",
    desc: "异步生命周期中的 Reload/Unload 迁移，一旦进入就运行至完成。",
  },
];

export default function CordisCoursePage() {
  const course = courses.find((c) => c.slug === "cordis")!;

  return (
    <>
      {/* 课程头部 */}
      <div className="bg-gradient-brand relative overflow-hidden rounded-xl p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white backdrop-blur">
              {course.tag}
            </Badge>
            <Badge className="bg-white/20 text-white backdrop-blur">
              {course.level}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85">
            {course.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-base text-white/90">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="size-4" />
              {course.lessons} 节课
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {course.duration}
            </span>
            <CourseProgressStat lessons={cordisLessons} />
          </div>
        </div>
      </div>

      <ContinueLessonCard lessons={cordisLessons} hrefPrefix={LESSON_BASE} />

      {/* 课程目录 */}
      <h2 className="mt-10 text-2xl font-bold">课程目录</h2>
      <LessonCatalog lessons={cordisLessons} hrefPrefix={LESSON_BASE} />

      {/* 术语表 */}
      <div id="glossary" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-bold">术语表 · 论文附录 A</h2>
        <p className="mt-2 text-base text-muted-foreground">
          论文只收录本文提出或赋予特殊含义的概念；通用概念不重复列出。
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
