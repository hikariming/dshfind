import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import {
  Check,
  Clock,
  GraduationCap,
  Lock,
  PlayCircle,
} from "lucide-react";

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
import { cordisLessons, courses } from "@/lib/mock";

export const metadata: Metadata = {
  title: "Cordis 论文精读",
  description: "从零读懂《一种面向时空可组合性的编程范式》：可回退效应与反应式余效应。",
};

const statusIcon = {
  completed: <Check className="size-4 text-emerald-500" />,
  in_progress: <PlayCircle className="size-4 text-brand-500 dark:text-brand-300" />,
  locked: <Lock className="size-4 text-muted-foreground/50" />,
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
  const current = cordisLessons.find((l) => l.status === "in_progress")!;

  return (
    <>
      {/* 课程头部 */}
      <div className="bg-gradient-brand relative overflow-hidden rounded-2xl p-8 text-white glow-brand">
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
            <span>
              进度 {course.progress}/{course.lessons}
            </span>
          </div>
          <div className="mt-4 max-w-md">
            <Progress
              value={(course.progress / course.lessons) * 100}
              className="h-2 bg-white/25 [&>div]:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 继续学习 CTA */}
      <Card className="mt-6 border-brand-500/30 bg-brand-500/5">
        <CardContent className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-base font-medium">
              继续学习：第 {current.index} 课
            </div>
            <CardDescription className="mt-0.5 text-base">
              {current.title}
            </CardDescription>
          </div>
          <Button asChild className="rounded-xl">
            <Link href={`/learn/cordis/lessons/${current.slug}`}>
              <PlayCircle />
              开始这一课
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* 课程目录 */}
      <h2 className="mt-10 text-2xl font-bold">课程目录</h2>
      <div className="mt-4 space-y-2">
        {cordisLessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/learn/cordis/lessons/${lesson.slug}`}
            className={`flex scroll-mt-24 items-start gap-4 rounded-xl border border-border/60 p-4 transition-colors ${
              lesson.status === "in_progress"
                ? "border-brand-500/40 bg-brand-500/5 hover:bg-brand-500/10"
                : lesson.status === "completed"
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
                {lesson.status === "completed" && (
                  <Badge variant="secondary" className="text-[10px]">
                    已完成
                  </Badge>
                )}
                {lesson.status === "in_progress" && (
                  <Badge className="text-[10px]">进行中</Badge>
                )}
                {lesson.status === "locked" && (
                  <Badge variant="outline" className="text-[10px]">
                    未解锁
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {lesson.summary}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {lesson.duration}
              </span>
              {statusIcon[lesson.status]}
            </div>
          </Link>
        ))}
      </div>

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
