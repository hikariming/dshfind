import type { Metadata } from "next";
import { Medal, Minus, TrendingDown, TrendingUp, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTranslations } from "next-intl/server";
import { rankingMeta, rankingUsers } from "@/lib/ranking-real";
import { isLocale } from "@/i18n/config";
import { pageAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("rankingTitle"),
    description: t("rankingDescription"),
    alternates: pageAlternates(locale, "/ranking"),
  };
}

const podiumColors = [
  "from-amber-400 to-yellow-500",
  "from-slate-300 to-slate-400",
  "from-orange-400 to-amber-600",
];

export default async function RankingPage() {
  const t = await getTranslations("Ranking");
  const [first, second, third] = rankingUsers;
  // 领奖台按 2-1-3 摆放，下方完整榜单仍按真实名次顺序。
  const podium = [second, first, third].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <Badge className="bg-gradient-brand text-white">
          <Trophy className="size-3" />
          {t("badge")}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* 领奖台 */}
      <div className="mt-10 grid grid-cols-3 items-end gap-3 sm:gap-6">
        {podium.map((user) => {
          const rank = user.rank;
          return (
            <div key={user.id} className="flex flex-col items-center gap-2">
              <Avatar className="size-16 rounded-xl shadow-lg sm:size-20">
                <AvatarImage src={user.avatarUrl} alt={user.login} className="rounded-xl" />
                <AvatarFallback
                  className={`rounded-xl bg-gradient-to-br ${user.color} text-2xl font-bold text-white`}
                >
                  {user.initial}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="text-sm font-medium sm:text-base">
                  {user.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.points.toLocaleString()} {t("points")}
                </div>
              </div>
              <div
                className={`flex w-full items-center justify-center gap-1 rounded-t-xl bg-gradient-to-b ${podiumColors[rank - 1]} py-2 text-sm font-bold text-white sm:py-3`}
                style={{
                  height: rank === 1 ? "4rem" : rank === 2 ? "3rem" : "2.5rem",
                }}
              >
                <Medal className="size-4" />
                {t("rank")} {rank}
              </div>
            </div>
          );
        })}
      </div>

      {/* 完整榜单 */}
      <Card className="mt-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("fullBoard")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          {rankingUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="w-7 text-center text-sm font-semibold text-muted-foreground">
                {user.rank}
              </span>
              <Avatar className="size-10">
                <AvatarImage src={user.avatarUrl} alt={user.login} />
                <AvatarFallback
                  className={`bg-gradient-to-br ${user.color} text-sm font-bold text-white`}
                >
                  {user.initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{user.name}</span>
                  {user.badges.map((badge) => (
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
                  @{user.login} · {user.contributions} {t("contributions")}
                </div>
              </div>
              {user.trend === "up" ? (
                <TrendingUp className="size-4 text-emerald-500" />
              ) : user.trend === "down" ? (
                <TrendingDown className="size-4 text-rose-500" />
              ) : (
                <Minus className="size-4 text-muted-foreground/50" />
              )}
              <span className="w-16 text-right text-sm font-semibold tabular-nums">
                {user.points.toLocaleString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        数据来自{" "}
        <a
          href={rankingMeta.source}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 hover:text-foreground"
        >
          dsh-external/dsh-club
        </a>{" "}
        快照 {rankingMeta.snapshot}，积分口径与该站的「综合积分榜」一致；
        共 {rankingMeta.totalContributors} 位贡献者，此处收录前 {rankingMeta.listed} 名。
      </p>
    </div>
  );
}
