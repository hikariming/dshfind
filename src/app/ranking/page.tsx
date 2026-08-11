import type { Metadata } from "next";
import { Medal, TrendingDown, TrendingUp, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTranslations } from "next-intl/server";
import { rankingUsers } from "@/lib/mock";

export const metadata: Metadata = {
  title: "用户排名",
  description: "dshfind 用户排名：读完一课、提交插件、回答问题都能获得贡献值。",
};

const podiumColors = [
  "from-amber-400 to-yellow-500",
  "from-slate-300 to-slate-400",
  "from-orange-400 to-amber-600",
];

export default async function RankingPage() {
  const t = await getTranslations("Ranking");
  const [first, second, third, ...rest] = rankingUsers;
  const podium = [second, first, third];

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
        {podium.map((user, i) => {
          const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
          return (
            <div key={user.id} className="flex flex-col items-center gap-2">
              <div
                className={`flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br ${user.color} text-2xl font-bold text-white shadow-lg sm:size-20`}
              >
                {user.initial}
              </div>
              <div className="text-center">
                <div className="text-sm font-medium sm:text-base">
                  {user.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.points.toLocaleString()} {t("points")}
                </div>
              </div>
              <div
                className={`flex w-full items-center justify-center gap-1 rounded-t-xl bg-gradient-to-b ${podiumColors[i]} py-2 text-sm font-bold text-white sm:py-3`}
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
          {[...podium, ...rest].map((user, i) => (
            <div
              key={user.id}
              className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="w-7 text-center text-sm font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <Avatar className="size-10">
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
                  {t("level")}{user.level.slice(3)} · {user.contributions} {t("contributions")}
                </div>
              </div>
              {user.trend === "up" ? (
                <TrendingUp className="size-4 text-emerald-500" />
              ) : (
                <TrendingDown className="size-4 text-rose-500" />
              )}
              <span className="w-16 text-right text-sm font-semibold tabular-nums">
                {user.points.toLocaleString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
