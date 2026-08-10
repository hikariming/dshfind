import Link from "next/link";
import { ArrowRight, Medal, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { rankingUsers } from "@/lib/mock";

const podiumColors = [
  "from-amber-400 to-yellow-500",
  "from-slate-300 to-slate-400",
  "from-orange-400 to-amber-600",
];

export function RankingSection() {
  const [first, second, third, ...rest] = rankingUsers;
  const podium = [second, first, third];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            用户排名 · <span className="text-brand-600 dark:text-brand-400">共同进步</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            读完一课、提交一个插件、回答一个问题，都能获得贡献值。
            每周更新，看看谁在带大家读论文。
          </p>
        </div>
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/ranking">
            完整榜单
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* 前三名领奖台 */}
        <div className="grid grid-cols-3 items-end gap-3">
          {podium.map((user, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            return (
              <div key={user.id} className="flex flex-col items-center gap-2">
                <div
                  className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${user.color} text-xl font-bold text-white shadow-lg`}
                >
                  {user.initial}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.points.toLocaleString()} 分
                  </div>
                </div>
                <div
                  className={`flex w-full items-center justify-center gap-1 rounded-t-xl bg-gradient-to-b ${podiumColors[i]} py-2 text-sm font-bold text-white`}
                  style={{ height: rank === 1 ? "3.5rem" : rank === 2 ? "2.75rem" : "2.25rem" }}
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
            <CardTitle className="text-base">本周贡献榜</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {[...podium, ...rest].map((user, i) => (
              <div
                key={user.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <Avatar className="size-9">
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
                    {user.badges.slice(0, 2).map((badge) => (
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
                    {user.level} · {user.contributions} 次贡献
                  </div>
                </div>
                {user.trend === "up" ? (
                  <TrendingUp className="size-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="size-4 text-rose-500" />
                )}
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
