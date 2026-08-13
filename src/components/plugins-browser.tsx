"use client";

import * as React from "react";
import { FolderGit2, Puzzle, Search, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  pluginAuthorCount,
  pluginLanguages,
  realPlugins,
} from "@/lib/plugins-real";

type SortKey = "stars" | "updated" | "name";

const SORTS: SortKey[] = ["stars", "updated", "name"];

/** 只取日期部分——相对时间会在 SSR 与客户端算出不同结果，导致 hydration 不一致。 */
function day(iso: string) {
  return iso ? iso.slice(0, 10) : "-";
}

export function PluginsBrowser() {
  const t = useTranslations("Plugins");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("stars");
  const [language, setLanguage] = React.useState("all");

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = realPlugins.filter((p) => {
      if (language !== "all" && p.language !== language) return false;
      if (!q) return true;
      return `${p.fullName} ${p.description} ${p.tags.join(" ")} ${p.language}`
        .toLowerCase()
        .includes(q);
    });

    // realPlugins 本身已按星标降序，只有另两种排序需要重排。
    if (sort === "name") {
      return [...matched].sort((a, b) =>
        a.name.localeCompare(b.name, "en"),
      );
    }
    if (sort === "updated") {
      return [...matched].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
    }
    return matched;
  }, [query, sort, language]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <Badge className="bg-gradient-brand text-white">
          <Puzzle className="size-3" />
          {t("badge")}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("descPrefix")}{" "}
          <a
            href="https://github.com/topics/dsh-plugin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline-offset-4 hover:underline dark:text-brand-300"
          >
            dsh-plugin
          </a>{" "}
          {t("descSuffix")}
        </p>
        <div className="mt-5 flex items-center gap-2">
          <div className="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">
            {realPlugins.length}
          </div>
          <div className="text-sm text-muted-foreground">{t("plugins")} ·</div>
          <div className="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">
            {pluginAuthorCount}
          </div>
          <div className="text-sm text-muted-foreground">{t("authors")}</div>
        </div>
      </div>

      {/* 搜索 + 排序 + 语言筛选 */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
            aria-label={t("searchPlaceholder")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SORTS.map((key) => (
            <Button
              key={key}
              size="sm"
              variant={sort === key ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setSort(key)}
            >
              {t(`sort.${key}`)}
            </Button>
          ))}

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t("language")}
            className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">{t("allLanguages")}</option>
            {pluginLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {t("showing", { n: visible.length, total: realPlugins.length })}
      </p>

      {/* 插件网格 */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((plugin) => (
          <Card key={plugin.fullName} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-mono text-sm font-semibold break-all">
                  {plugin.name}
                </CardTitle>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {plugin.stars}
                </span>
              </div>
              <a
                href={`https://github.com/${plugin.owner}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                @{plugin.owner}
              </a>
              {plugin.archived && (
                <Badge variant="outline" className="w-fit">
                  {t("archived")}
                </Badge>
              )}
              {/* 描述长度差异极大（有的仓库写了整段中英双语），截断三行才排得齐 */}
              <CardDescription className="line-clamp-3 text-sm leading-snug">
                {plugin.description || t("noDesc")}
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
                  {plugin.language || "-"} · {day(plugin.pushedAt)}
                </span>
                <Button asChild size="sm" className="rounded-lg">
                  <a href={plugin.url} target="_blank" rel="noopener noreferrer">
                    <FolderGit2 />
                    {t("viewRepo")}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      )}
    </div>
  );
}
