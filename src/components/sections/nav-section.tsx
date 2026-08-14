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
  Star,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { PLUGIN_CATEGORIES, type PluginCategory } from "@/lib/categories";
import { localizePluginDescription } from "@/lib/plugin-i18n";
import { realPlugins } from "@/lib/plugins-real";
import { ScoreBadge } from "@/components/score-badge";

/**
 * 导航站式首页主体：编辑推荐 + 按分类的密集链接列表。
 * realPlugins 行序 featured 优先、star 降序,推荐位与组内排序直接沿用。
 */
const TOP_PICKS = 30;
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

const topPicks = realPlugins.slice(0, TOP_PICKS);

const groups = PLUGIN_CATEGORIES.map((category) => {
  const all = realPlugins.filter((p) => p.category === category);
  return { category, total: all.length, plugins: all.slice(0, PER_CATEGORY) };
}).filter((g) => g.total > 0);

function StarCount({ stars }: { stars: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
      <Star className="size-3 fill-amber-400 text-amber-400" />
      {stars.toLocaleString("en-US")}
    </span>
  );
}

export function NavSection() {
  const t = useTranslations("Home");
  const tc = useTranslations("Plugins");
  const locale = useLocale();

  return (
    <>
      {/* ============ 编辑推荐 ============ */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:px-6 sm:pt-6">
        <SectionHeading
          title={t("topPicksTitle")}
          accent="Hot"
          description={t("topPicksSubtitle")}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topPicks.map((plugin, i) => (
            <Reveal key={plugin.fullName} delay={40 * i} className="flex">
              <Link
                href={`/plugins/${plugin.fullName}`}
                className="group flex w-full flex-col rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-brand-500/50 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-mono text-sm font-semibold break-all group-hover:text-brand-600 dark:group-hover:text-brand-300">
                    {plugin.name}
                    <ScoreBadge score={plugin.score} />
                  </span>
                  <StarCount stars={plugin.stars} />
                </div>
                <span className="text-xs text-muted-foreground">
                  @{plugin.owner}
                </span>
                {(plugin.isOfficial || plugin.isFeatured || plugin.isInsider) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {plugin.isOfficial && (
                      <Badge className="w-fit bg-sky-600 text-white dark:bg-sky-500">
                        🏛 {tc("official")}
                      </Badge>
                    )}
                    {plugin.isFeatured && (
                      <Badge className="bg-gradient-brand w-fit text-white">
                        ✨ {tc("featured")}
                      </Badge>
                    )}
                    {plugin.isInsider && (
                      <Badge variant="secondary" className="w-fit">
                        {tc("insider")}
                      </Badge>
                    )}
                  </div>
                )}
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {localizePluginDescription(
                    plugin.fullName,
                    locale,
                    plugin.description,
                  )}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

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
