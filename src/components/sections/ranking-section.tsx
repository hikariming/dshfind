import { Link } from "@/i18n/navigation";
import { ArrowRight, Medal, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SectionHeading } from "@/components/section-heading";
import { useTranslations } from "next-intl";
import { rankingUsers } from "@/lib/ranking-real";

const podiumColors = [
  "from-amber-400 to-yellow-500",
  "from-slate-300 to-slate-400",
  "from-orange-400 to-amber-600",
];

export function RankingSection() {
  const t = useTranslations("Home");
  const [first, second, third] = rankingUsers;
  // 领奖台按 2-1-3 摆放；右侧列表按真实名次顺序取前 6。
  const podium = [second, first, third].filter(Boolean);
  const board = rankingUsers.slice(0, 6);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        title={t("rankingTitle")}
        accent="Top 6"
        description={t("rankingSubtitle")}
        action={
          <Button asChild variant="ghost" className="hidden shrink-0 sm:inline-flex">
            <Link href="/ranking">
              {t("fullRanking")}
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      {/* items-center：领奖台比右侧榜单矮不少，不居中的话左栏顶上会空出一大块 */}
      <div className="mt-10 grid items-center gap-5 lg:grid-cols-2">
        {/* 前三名领奖台 */}
        <div className="grid grid-cols-3 items-end gap-3">
          {podium.map((user) => {
            const rank = user.rank;
            return (
              <div key={user.id} className="flex flex-col items-center gap-2">
                <Avatar className="size-14 rounded-xl shadow-lg">
                  <AvatarImage src={user.avatarUrl} alt={user.login} className="rounded-xl" />
                  <AvatarFallback
                    className={`rounded-xl bg-gradient-to-br ${user.color} text-xl font-bold text-white`}
                  >
                    {user.initial}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.points.toLocaleString()} 分
                  </div>
                </div>
                <div
                  className={`flex w-full items-center justify-center gap-1 rounded-t-xl bg-gradient-to-b ${podiumColors[rank - 1]} py-2 text-sm font-bold text-white`}
                  style={{ height: rank === 1 ? "4.5rem" : rank === 2 ? "3.25rem" : "2.5rem" }}
                >
                  <Medal className="size-4" />
                  第 {rank} 名
                </div>
              </div>
            );
          })}
        </div>

        {/* 排行榜列表 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("weeklyBoard")}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {board.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
                  {user.rank}
                </span>
                <Avatar className="size-9">
                  <AvatarImage src={user.avatarUrl} alt={user.login} />
                  <AvatarFallback
                    className={`bg-gradient-to-br ${user.color} text-xs font-bold text-white`}
                  >
                    {user.initial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {user.name}
                    </span>
                    {user.badges.slice(0, 2).map((badge: string) => (
                      <Badge
                        key={badge}
                        variant="secondary"
                        className="hidden text-[10px] sm:inline-flex"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @{user.login} · {user.contributions} 次贡献
                  </div>
                </div>
                {user.trend === "up" ? (
                  <TrendingUp className="size-4 text-emerald-500" />
                ) : user.trend === "down" ? (
                  <TrendingDown className="size-4 text-rose-500" />
                ) : null}
                <span className="text-sm font-semibold tabular-nums">
                  {user.points.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
