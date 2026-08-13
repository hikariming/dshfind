import { Link } from "@/i18n/navigation";
import { ArrowRight, ExternalLink, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { realPlugins } from "@/lib/plugins-real";

/** 首页只展示星标最高的 6 个；完整清单在 /plugins。 */
const featuredPlugins = [...realPlugins]
  .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name, "en"))
  .slice(0, 6);

export function PluginsSection() {
  const t = useTranslations("Home");
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("pluginsTitle")} · <span className="text-brand-600 dark:text-brand-400">Hot</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {t("pluginsSubtitle")}
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/plugins">
              全部插件
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPlugins.map((plugin) => (
            <Card key={plugin.name} className="group transition-shadow hover:shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand text-lg font-bold text-white">
                    {plugin.name.charAt(0).toUpperCase()}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-lg opacity-90 group-hover:opacity-100"
                  >
                    <a href={plugin.url} target="_blank" rel="noreferrer noopener">
                      <ExternalLink />
                      仓库
                    </a>
                  </Button>
                </div>
                <CardTitle className="pt-2 font-mono text-sm font-semibold">
                  {plugin.name}
                </CardTitle>
                <CardDescription className="text-sm leading-snug">
                  {plugin.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {plugin.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {plugin.stars}
                  </span>
                  <span>{plugin.language || "—"}</span>
                  {plugin.version && <span>v{plugin.version}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
