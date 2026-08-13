import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { BookOpen, Puzzle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/search-box";
import { Typewriter } from "@/components/typewriter";
import { learnChapters } from "@/lib/nav";
import { pluginAuthorCount, realPlugins } from "@/lib/plugins-real";

export async function Hero() {
  const t = await getTranslations("Hero");
  const phrases = t.raw("phrases") as { text: string; accent?: [number, number] }[];

  // 全部由真实数据推导，不写死——插件数来自 hub catalog 快照，课程数来自导航结构。
  const chaptersWithContent = learnChapters.filter((c) =>
    c.items.some((i) => i.href),
  ).length;
  const lessonCount = learnChapters.reduce(
    (n, c) => n + c.items.filter((i) => i.href).length,
    0,
  );

  const stats = [
    { key: "courses", value: String(chaptersWithContent) },
    { key: "lessons", value: String(lessonCount) },
    { key: "plugins", value: String(realPlugins.length) },
    { key: "authors", value: String(pluginAuthorCount) },
  ];

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
            <Typewriter phrases={phrases} />
          </h1>

          <div className="mx-auto mt-10 max-w-xl">
            <SearchBox />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/learn">
                <BookOpen />
                {t("startLearning")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href="/plugins">
                <Puzzle />
                {t("browsePlugins")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="rounded-xl border border-border/60 bg-background/70 p-4 text-center backdrop-blur transition-colors hover:border-brand-500/40"
            >
              <div className="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t(`stats.${stat.key}`)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
