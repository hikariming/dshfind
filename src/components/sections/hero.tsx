import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { BookOpen, Puzzle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/search-box";
import { Typewriter } from "@/components/typewriter";

export async function Hero() {
  const t = await getTranslations("Hero");
  const phrases = t.raw("phrases") as { text: string; accent?: [number, number] }[];

  return (
    <section className="relative">
      {/* 背景：一层隐约网格 + 一片偏左上的品牌色低饱和晕染。
          原来三坨 blur-3xl 光晕是典型的 AI 落地页套路，收成单层。
          overflow-hidden 只加在这层背景上——加在 section 上会把搜索框的下拉建议裁掉。 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-60 dark:opacity-25" />
        <div className="absolute -top-32 -left-24 h-[28rem] w-[38rem] rounded-full bg-brand-500/8 blur-[100px] dark:bg-brand-500/12" />
      </div>

      {/* 非对称布局：左侧承载全部信息，右侧留白。
          hero 顶部内边距不超过 pt-24，避免内容浮到视口中间。 */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20 sm:pb-12">
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
    </section>
  );
}
