import { Link } from "@/i18n/navigation";
import { ArrowRight, ExternalLink, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { useTranslations } from "next-intl";
import { realPlugins } from "@/lib/plugins-real";

/**
 * 首页只展示星标最高的 5 个；realPlugins 已按星标降序，直接切。
 * 5 个而不是 6 个，是为了排成「1 大 + 4 小」的非对称格子：
 * 三等分卡片行是最容易看出 AI 味的排版，换成有主次的构图。
 */
const [lead, ...rest] = realPlugins.slice(0, 5);

export function PluginsSection() {
  const t = useTranslations("Home");

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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* 头名占两列，用更大的字号和留白承担视觉重心 */}
          {lead && (
            <Reveal className="sm:col-span-2">
              <Card className="h-full bg-gradient-to-br from-brand-500/8 to-transparent">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="font-mono text-lg font-semibold break-all">
                        {lead.name}
                      </CardTitle>
                      <a
                        href={`https://github.com/${lead.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        @{lead.owner}
                      </a>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium tabular-nums">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {lead.stars.toLocaleString("en-US")}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 max-w-[60ch] leading-relaxed text-muted-foreground">
                    {lead.description}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild size="sm" variant="outline" className="rounded-lg">
                    <a href={lead.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                      {t("repo")}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          )}

          {rest.map((plugin, i) => (
            <Reveal key={plugin.fullName} delay={60 * (i + 1)}>
              <Card className="group h-full transition-colors hover:border-brand-500/40">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-mono text-sm font-semibold break-all">
                      {plugin.name}
                    </CardTitle>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      {plugin.stars.toLocaleString("en-US")}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    @{plugin.owner}
                  </span>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {plugin.description}
                  </p>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{plugin.language || t("noLanguage")}</span>
                  <Button asChild size="sm" variant="ghost" className="rounded-lg">
                    <a href={plugin.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                      {t("repo")}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
