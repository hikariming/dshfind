import Link from "next/link";
import { ArrowRight, Download, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { plugins } from "@/lib/mock";

export function PluginsSection() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              插件超市 · <span className="text-brand-600 dark:text-brand-400">即装即用</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              基于 Cordis 上下文范式构建的社区插件：声明余效应、自动跟踪效应，
              卸载即恢复，绝不留残留。
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
          {plugins.map((plugin) => (
            <Card key={plugin.id} className="group transition-shadow hover:shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand text-lg font-bold text-white">
                    {plugin.name.charAt(9).toUpperCase()}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="rounded-lg opacity-90 group-hover:opacity-100"
                  >
                    <Link href={`/plugins#${plugin.id}`}>
                      <Download />
                      安装
                    </Link>
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
                  {plugin.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download className="size-3.5" />
                    {plugin.installs}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {plugin.rating.toFixed(1)}
                  </span>
                  <span>v{plugin.version}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
