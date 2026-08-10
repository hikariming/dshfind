import Link from "next/link";
import { ArrowRight, BookOpen, Puzzle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/search-box";
import { Typewriter } from "@/components/typewriter";

const stats = [
  { label: "精读课程", value: "4" },
  { label: "社区插件", value: "128" },
  { label: "活跃用户", value: "2,860" },
  { label: "累计贡献", value: "15.2k" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 背景装饰：柔和的蓝色光晕 + 隐约网格 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-40 dark:opacity-20" />
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl dark:bg-brand-500/25" />
        <div className="absolute top-48 -left-28 h-72 w-72 rounded-full bg-accent-cyan/10 blur-3xl" />
        <div className="absolute top-72 -right-28 h-72 w-72 rounded-full bg-accent-violet/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl md:text-6xl">
            <Typewriter
              phrases={[
                { text: "构建可自我演化的系统", accent: [2, 7] },
                { text: "理解时空可组合性", accent: [2, 8] },
                { text: "发现最佳 DSH 插件", accent: [3, 9] },
                { text: "学习智能体框架基础", accent: [2, 7] },
                { text: "上手插件开发实战", accent: [2, 6] },
              ]}
            />
          </h1>

          <div className="mx-auto mt-10 max-w-xl">
            <SearchBox />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/learn">
                <BookOpen />
                开始学习
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href="/plugins">
                <Puzzle />
                逛逛插件超市
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-background/70 p-4 text-center backdrop-blur transition-colors hover:border-brand-500/40"
            >
              <div className="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
