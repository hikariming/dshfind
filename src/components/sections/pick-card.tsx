import { Star, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/reveal";
import { ScoreBadge } from "@/components/score-badge";
import { Link } from "@/i18n/navigation";
import type { HomePick } from "@/lib/types";

/**
 * 首页三条 rail 共用的卡片。
 *
 * 刻意不加 "use client"：服务端渲染的两条 rail（飙升/新面孔）直接在服务端出 HTML，
 * 而「编辑推荐」那条被客户端组件引用后会自动进客户端包。短评是 string 而不是
 * 现查 plugin-i18n——那个模块两千多行，让它进浏览器包不值得。
 */
export interface PickCard extends HomePick {
  /** 服务端按当前语言解析好的一句话短评；没有就传空串，卡片自动省掉这一段。 */
  blurb: string;
}

export function StarCount({ stars }: { stars: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
      <Star className="size-3 fill-amber-400 text-amber-400" />
      {stars.toLocaleString("en-US")}
    </span>
  );
}

export function PickCardView({ pick, delay }: { pick: PickCard; delay: number }) {
  const t = useTranslations("Home");
  const tc = useTranslations("Plugins");

  const hasMarks =
    pick.isOfficial ||
    pick.isFeatured ||
    pick.isInsider ||
    pick.starGrowth != null ||
    pick.firstSeenAt != null;

  return (
    <Reveal delay={delay} className="flex">
      <Link
        href={`/plugins/${pick.fullName}`}
        className="group flex w-full flex-col rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-brand-500/50 hover:bg-muted/40"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono text-sm font-semibold break-all group-hover:text-brand-600 dark:group-hover:text-brand-300">
            {pick.name}
            <ScoreBadge score={pick.score} />
          </span>
          <StarCount stars={pick.stars} />
        </div>
        <span className="text-xs text-muted-foreground">@{pick.owner}</span>

        {hasMarks && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pick.isOfficial && (
              <Badge className="w-fit bg-sky-600 text-white dark:bg-sky-500">
                🏛 {tc("official")}
              </Badge>
            )}
            {pick.isFeatured && (
              <Badge className="bg-gradient-brand w-fit text-white">
                ✨ {tc("featured")}
              </Badge>
            )}
            {pick.isInsider && (
              <Badge variant="secondary" className="w-fit">
                {tc("insider")}
              </Badge>
            )}
            {pick.starGrowth != null && (
              <Badge
                variant="secondary"
                className="w-fit gap-1 tabular-nums text-emerald-700 dark:text-emerald-300"
              >
                <TrendingUp className="size-3" />+
                {pick.starGrowth.toLocaleString("en-US")}
              </Badge>
            )}
            {pick.firstSeenAt != null && (
              <Badge variant="secondary" className="w-fit tabular-nums">
                {t("newBadge")} · {pick.firstSeenAt.slice(5)}
              </Badge>
            )}
          </div>
        )}

        {pick.blurb && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {pick.blurb}
          </p>
        )}
      </Link>
    </Reveal>
  );
}
