"use client";

import * as React from "react";
import { FolderGit2, Puzzle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pluginCategories, realPlugins } from "@/lib/plugins-real";

export function PluginsBrowser() {
  const [category, setCategory] = React.useState<string>("all");

  const filtered =
    category === "all"
      ? realPlugins
      : realPlugins.filter((p) => p.category === category);

  const catMeta = (id: string) => pluginCategories.find((c) => c.id === id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <Badge className="bg-gradient-brand text-white">
          <Puzzle className="size-3" />
          插件超市
        </Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          dsh-external 插件清单
        </h1>
        <p className="mt-3 text-muted-foreground">
          数据来自{" "}
          <a
            href="https://github.com/dsh-external/hub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline-offset-4 hover:underline dark:text-brand-300"
          >
            dsh-external/hub
          </a>{" "}
          的 catalog.json（CI 自动索引全组织仓库）。组织为私有，此页为快照；
          安装需要内测环境与 plugin-registry。
        </p>
        <div className="mt-5 flex items-center gap-2">
          <div className="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">
            {realPlugins.length}
          </div>
          <div className="text-sm text-muted-foreground">个插件 ·</div>
          <div className="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">
            {pluginCategories.length}
          </div>
          <div className="text-sm text-muted-foreground">个分类</div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="mt-8 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={category === "all" ? "default" : "outline"}
          className="rounded-lg"
          onClick={() => setCategory("all")}
        >
          全部（{realPlugins.length}）
        </Button>
        {pluginCategories.map((c) => {
          const count = realPlugins.filter((p) => p.category === c.id).length;
          return (
            <Button
              key={c.id}
              size="sm"
              variant={category === c.id ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setCategory(c.id)}
            >
              {c.emoji} {c.title}（{count}）
            </Button>
          );
        })}
      </div>

      {/* 插件网格 */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plugin) => {
          const meta = catMeta(plugin.category);
          return (
            <Card key={plugin.name} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-mono text-sm font-semibold break-all">
                    {plugin.name}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {meta ? `${meta.emoji} ${meta.title}` : plugin.category}
                  </Badge>
                </div>
                {plugin.isSkill && (
                  <Badge variant="outline" className="w-fit">
                    🎓 skill
                  </Badge>
                )}
                <CardDescription className="text-sm leading-snug">
                  {plugin.description || "（暂无描述）"}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                {plugin.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plugin.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="ghost" className="text-[11px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="text-xs text-muted-foreground">
                    {plugin.language || "—"}
                  </span>
                  <Button asChild size="sm" className="rounded-lg">
                    <a
                      href={plugin.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FolderGit2 />
                      查看仓库
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          该分类下暂无插件
        </p>
      )}
    </div>
  );
}
