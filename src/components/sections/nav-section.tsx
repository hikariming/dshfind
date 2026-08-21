import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  BookMarked,
  Bot,
  Brain,
  Gamepad2,
  LayoutGrid,
  MessagesSquare,
  MonitorSmartphone,
  Palette,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { EditorPicksRail } from "@/components/sections/editor-picks-rail";
import {
  PickCardView,
  StarCount,
  type PickCard,
} from "@/components/sections/pick-card";
import { PLUGIN_CATEGORIES, type PluginCategory } from "@/lib/categories";
import { editorPool, newcomerPicks, RAIL_SIZE, trendingPicks } from "@/lib/home-picks";
import { getPluginEditorial, localizePluginDescription } from "@/lib/plugin-i18n";
import { realPlugins } from "@/lib/plugins-real";
import { ScoreBadge } from "@/components/score-badge";
import type { HomePick } from "@/lib/types";
import type { Locale } from "@/i18n/config";

/**
 * 导航站式首页主体：三条 rail（编辑推荐 / 本周飙升 / 新面孔）+ 按分类的密集链接列表。
 *
 * 三条 rail 是刻意拆开的：只按 featured/star 排的话，头部几个几万 star 的仓库
 * 几个月都不动，回访用户永远看到同一批。飙升和新面孔各带一个时间维度，
 * 每天同步完自己就换人，不靠随机。口径见 scripts/gen-plugins-real.mjs 末尾。
 */
const PER_CATEGORY = 6;

const categoryIcons: Record<PluginCategory, LucideIcon> = {
  skin: Palette,
  ui: LayoutGrid,
  agent: Bot,
  memory: Brain,
  client: MonitorSmartphone,
  channel: MessagesSquare,
  tools: Wrench,
  fun: Gamepad2,
  resource: BookMarked,
};

const groups = PLUGIN_CATEGORIES.map((category) => {
  const all = realPlugins.filter((p) => p.category === category);
  return { category, total: all.length, plugins: all.slice(0, PER_CATEGORY) };
}).filter((g) => g.total > 0);

/** rail 只带展示字段，GitHub 原描述得回 realPlugins 里取——建表一次，别每张卡扫全量。 */
const descriptionOf = new Map(realPlugins.map((p) => [p.fullName, p.description]));

/**
 * 卡片短评：优先编辑短评的首句，没有就回落到本地化描述、再回落 GitHub 原文。
 *
 * 取首句而不是硬截断：intro 是段落体，截到一半会断在词中间；首句本身就是
 * 编辑写的那句总结，中位 55 字，正好是两行卡片文案的长度。
 *
 * 西文句点必须后跟空白才算断句——否则「一份 awesome.re 徽章的清单」会被
 * 域名里的点切成「一份 awesome.」。中日韩句号没这个问题，可以直接断。
 */
function blurbFor(pick: HomePick, locale: Locale): string {
  const fallback = descriptionOf.get(pick.fullName) ?? "";
  const intro = getPluginEditorial(pick.fullName)?.intro?.[locale];
  if (!intro) return localizePluginDescription(pick.fullName, locale, fallback);
  const first = intro.split(/(?<=[。！？])|(?<=[.!?])\s+/)[0] || intro;
  return first.length > 120 ? `${first.slice(0, 119)}…` : first;
}

const toCards = (picks: HomePick[], locale: Locale): PickCard[] =>
  picks.map((p) => ({ ...p, blurb: blurbFor(p, locale) }));

export function NavSection() {
  const t = useTranslations("Home");
  const tc = useTranslations("Plugins");
  const locale = useLocale() as Locale;

  return (
    <>
      {/* ============ 编辑推荐（带换一批） ============ */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:px-6 sm:pt-6">
        <SectionHeading
          title={t("topPicksTitle")}
          accent="Hot"
          description={t("topPicksSubtitle")}
        />
        <EditorPicksRail
          cards={toCards(editorPool, locale)}
          perBatch={RAIL_SIZE}
        />
      </section>

      {/* ============ 本周飙升 ============ */}
      {trendingPicks.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <SectionHeading
            title={t("trendingTitle")}
            description={t("trendingSubtitle")}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toCards(trendingPicks, locale).map((pick, i) => (
              <PickCardView key={pick.fullName} pick={pick} delay={40 * i} />
            ))}
          </div>
        </section>
      )}

      {/* ============ 新面孔 ============ */}
      {newcomerPicks.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <SectionHeading
            title={t("newcomersTitle")}
            description={t("newcomersSubtitle")}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toCards(newcomerPicks, locale).map((pick, i) => (
              <PickCardView key={pick.fullName} pick={pick} delay={40 * i} />
            ))}
          </div>
        </section>
      )}

      {/* ============ 分类导航 ============ */}
      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            title={t("navTitle")}
            accent={groups.length}
            description={t("navSubtitle")}
            action={
              <Button asChild variant="ghost" className="hidden shrink-0 sm:inline-flex">
                <Link href="/plugins">
                  {t("allPlugins")}
                  <ArrowRight />
                </Link>
              </Button>
            }
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, gi) => {
              const Icon = categoryIcons[group.category];
              return (
                <Reveal key={group.category} delay={50 * gi} className="flex">
                  <Card className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <span className="flex size-7 items-center justify-center rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-300">
                            <Icon className="size-4" />
                          </span>
                          {tc(`categories.${group.category}`)}
                        </CardTitle>
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-muted-foreground"
                        >
                          <Link href={`/plugins?category=${group.category}`}>
                            {t("allOfCategory", { n: group.total })}
                            <ArrowRight />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col divide-y divide-border/60">
                      {group.plugins.map((plugin) => (
                        <Link
                          key={plugin.fullName}
                          href={`/plugins/${plugin.fullName}`}
                          title={localizePluginDescription(
                            plugin.fullName,
                            locale,
                            plugin.description,
                          )}
                          className="group flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
                        >
                          <span className="truncate font-mono text-sm font-medium group-hover:text-brand-600 dark:group-hover:text-brand-300">
                            {plugin.name}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <ScoreBadge score={plugin.score} />
                            <StarCount stars={plugin.stars} />
                          </span>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          <Button asChild variant="outline" className="mt-8 w-full rounded-lg sm:hidden">
            <Link href="/plugins">
              {t("allPlugins")}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
