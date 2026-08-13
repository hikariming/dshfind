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

  // 全部由真实数据推导，不写死——插件数来自 topic 快照，课程数来自导航结构。
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
      {/* 背景：一层隐约网格 + 一片偏左上的品牌色低饱和晕染。
          原来三坨 blur-3xl 光晕是典型的 AI 落地页套路，收成单层。 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-60 dark:opacity-25" />
        <div className="absolute -top-32 -left-24 h-[28rem] w-[38rem] rounded-full bg-brand-500/8 blur-[100px] dark:bg-brand-500/12" />
      </div>

      {/* 非对称布局：左侧承载全部信息，右侧留白。
          hero 顶部内边距不超过 pt-24，避免内容浮到视口中间。 */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl leading-[1.15] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <Typewriter phrases={phrases} />
          </h1>

          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-8 max-w-xl">
            <SearchBox />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-lg">
              <Link href="/learn">
                <BookOpen />
                {t("startLearning")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-lg">
              <Link href="/plugins">
                <Puzzle />
                {t("browsePlugins")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 数据条移出 hero：hero 只负责价值主张与主行动，
          数字是佐证，放在下面一条细带里，用分隔线而不是四个卡片容器。 */}
      <div className="border-t border-border/60">
        <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 divide-x divide-y divide-border/60 px-4 sm:px-6 md:grid-cols-4 md:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.key} className="px-2 py-6 first:pl-0 md:py-7">
              <dt className="text-xs tracking-wide text-muted-foreground">
                {t(`stats.${stat.key}`)}
              </dt>
              <dd className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
