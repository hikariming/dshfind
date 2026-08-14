import { Link } from "@/i18n/navigation";
import { ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { useTranslations } from "next-intl";
import { realPlugins } from "@/lib/plugins-real";

/**
 * 首页只推荐这几个分类（顺序即展示顺序），改这里即可换推荐位。
 * realPlugins 已按 featured 优先、star 降序排好，组内直接切前几个。
 */
const FEATURED_CATEGORIES = ["skin", "agent", "memory"] as const;
const PER_CATEGORY = 4;

const groups = FEATURED_CATEGORIES.map((category) => ({
  category,
  plugins: realPlugins
    .filter((p) => p.category === category)
    .slice(0, PER_CATEGORY),
})).filter((g) => g.plugins.length > 0);

export function PluginsSection() {
  const t = useTranslations("Home");
  const tc = useTranslations("Plugins");

  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          title={t("pluginsTitle")}
          accent="Hot"
          description={t("pluginsSubtitle")}
          action={
            <Button asChild variant="ghost" className="hidden shrink-0 sm:inline-flex">
              <Link href="/plugins">
                {t("allPlugins")}
                <ArrowRight />
              </Link>
            </Button>
          }
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {groups.map((group, gi) => (
            <Reveal key={group.category} delay={80 * gi}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold">
                      {tc(`categories.${group.category}`)}
                    </CardTitle>
                    <Button asChild size="sm" variant="ghost" className="rounded-lg text-muted-foreground">
                      <Link href={`/plugins?category=${group.category}`}>
                        {t("moreOfCategory")}
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col divide-y divide-border/60">
                  {group.plugins.map((plugin) => (
                    <a
                      key={plugin.fullName}
                      href={plugin.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-sm font-semibold break-all group-hover:text-brand-600 dark:group-hover:text-brand-300">
                          {plugin.name}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {plugin.stars.toLocaleString("en-US")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        @{plugin.owner}
                      </span>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {plugin.description}
                      </p>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>

        <Button asChild variant="outline" className="mt-8 w-full rounded-lg sm:hidden">
          <Link href="/plugins">
            {t("allPlugins")}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
