"use client";

import * as React from "react";
import { FolderGit2, Puzzle, Search, Star, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";

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
import { useLocale, useTranslations } from "next-intl";
import { PLUGIN_CATEGORIES } from "@/lib/categories";
import { localizePluginDescription } from "@/lib/plugin-i18n";
import { ScoreBadge, gradeOf } from "@/components/score-badge";
import type { PluginWithGrowth } from "@/lib/types";

type SortKey = "stars" | "score" | "updated" | "name";

const SORTS: SortKey[] = ["stars", "score", "updated", "name"];

const GRADES = ["S", "A", "B", "C"] as const;

/** 只取日期部分——相对时间会在 SSR 与客户端算出不同结果，导致 hydration 不一致。 */
function day(iso: string) {
  return iso ? iso.slice(0, 10) : "-";
}

export function PluginsBrowser({
  plugins,
  languages,
  authorCount,
  initialCategory = "all",
}: {
  plugins: PluginWithGrowth[];
  languages: string[];
  authorCount: number;
  /** 首页「更多」等入口带 ?category= 深链进来时的初始分类。 */
  initialCategory?: string;
}) {
  const t = useTranslations("Plugins");
  const locale = useLocale();
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("stars");
  const [language, setLanguage] = React.useState("all");
  const [category, setCategory] = React.useState(initialCategory);
  const [grade, setGrade] = React.useState("all");

  const gradeCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of plugins) {
      if (p.score == null) continue;
      const g = gradeOf(p.score);
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return counts;
  }, [plugins]);

  // 只列有插件的分类，计数随语言/搜索之外的全量数据走——分类是稳定导航，不跟着筛选跳
  const categoryCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of plugins) {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return counts;
  }, [plugins]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = plugins.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (grade !== "all" && (p.score == null || gradeOf(p.score) !== grade))
        return false;
      if (language !== "all" && p.language !== language) return false;
      if (!q) return true;
      return `${p.fullName} ${p.description} ${p.tags.join(" ")} ${p.language}`
        .toLowerCase()
        .includes(q);
    });

    // 优质项目在任何排序下都置顶（featured 优先，组内再按所选键排）。
    const pin = (a: PluginWithGrowth, b: PluginWithGrowth) =>
      Number(b.isFeatured) - Number(a.isFeatured);
    if (sort === "name") {
      return [...matched].sort(
        (a, b) => pin(a, b) || a.name.localeCompare(b.name, "en"),
      );
    }
    if (sort === "updated") {
      return [...matched].sort(
        (a, b) => pin(a, b) || b.pushedAt.localeCompare(a.pushedAt),
      );
    }
    if (sort === "score") {
      // 未评分沉底，同分按 star
      return [...matched].sort(
        (a, b) =>
          pin(a, b) ||
          (b.score ?? -1) - (a.score ?? -1) ||
          b.stars - a.stars,
      );
    }
    return matched; // SQL 已按 featured DESC, stars DESC 排好
  }, [plugins, query, sort, language, category, grade]);

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
            {plugins.length}
          </div>
          <div className="text-sm text-muted-foreground">{t("plugins")} ·</div>
          <div className="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">
            {authorCount}
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
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 分类筛选：只展示有插件的分类，未分类的仓库仍在「全部」里 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={category === "all" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setCategory("all")}
        >
          {t("categories.all")}
          <span className="text-xs opacity-70 tabular-nums">{plugins.length}</span>
        </Button>
        {PLUGIN_CATEGORIES.filter((c) => categoryCounts.has(c)).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setCategory(category === c ? "all" : c)}
          >
            {t(`categories.${c}`)}
            <span className="text-xs opacity-70 tabular-nums">
              {categoryCounts.get(c)}
            </span>
          </Button>
        ))}
      </div>

      {/* 评级筛选：只有已评分的插件有等级，选中后未评分自动被过滤 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("gradeLabel")}</span>
        <Button
          size="sm"
          variant={grade === "all" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setGrade("all")}
        >
          {t("categories.all")}
        </Button>
        {GRADES.filter((g) => gradeCounts.has(g)).map((g) => (
          <Button
            key={g}
            size="sm"
            variant={grade === g ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setGrade(grade === g ? "all" : g)}
          >
            {g}
            <span className="text-xs opacity-70 tabular-nums">
              {gradeCounts.get(g)}
            </span>
          </Button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {t("showing", { n: visible.length, total: plugins.length })}
      </p>

      {/* 插件网格 */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((plugin) => (
          <Card
            key={plugin.fullName}
            className={`flex flex-col ${
              plugin.isFeatured
                ? "border-brand-500/50 bg-gradient-to-br from-brand-500/8 to-transparent"
                : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-1.5 font-mono text-sm font-semibold break-all">
                  <Link
                    href={`/plugins/${plugin.fullName}`}
                    className="underline-offset-4 hover:text-brand-600 hover:underline dark:hover:text-brand-300"
                  >
                    {plugin.name}
                  </Link>
                  <ScoreBadge score={plugin.score} />
                </CardTitle>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {plugin.stars.toLocaleString("en-US")}
                  {plugin.starGrowth > 0 && (
                    <span
                      title={t("weeklyGrowth")}
                      className="font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      +{plugin.starGrowth.toLocaleString("en-US")}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`https://github.com/${plugin.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  @{plugin.owner}
                </a>
                {plugin.contributors != null && (
                  <span
                    title={t("contributors")}
                    className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums"
                  >
                    <Users className="size-3.5" />
                    {plugin.contributors.toLocaleString("en-US")}
                    {plugin.contributorGrowth != null &&
                      plugin.contributorGrowth > 0 && (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          +{plugin.contributorGrowth.toLocaleString("en-US")}
                        </span>
                      )}
                  </span>
                )}
              </div>
              {(plugin.isOfficial || plugin.isFeatured || plugin.isInsider || plugin.archived) && (
                <div className="flex flex-wrap gap-1.5">
                  {plugin.isOfficial && (
                    <Badge className="w-fit bg-sky-600 text-white dark:bg-sky-500">
                      🏛 {t("official")}
                    </Badge>
                  )}
                  {plugin.isFeatured && (
                    <Badge className="bg-gradient-brand w-fit text-white">
                      ✨ {t("featured")}
                    </Badge>
                  )}
                  {plugin.isInsider && (
                    <Badge variant="secondary" className="w-fit">
                      {t("insider")}
                    </Badge>
                  )}
                  {plugin.archived && (
                    <Badge variant="outline" className="w-fit">
                      {t("archived")}
                    </Badge>
                  )}
                </div>
              )}
              {/* 描述长度差异极大（有的仓库写了整段中英双语），截断三行才排得齐 */}
              <CardDescription className="line-clamp-3 text-sm leading-snug">
                {localizePluginDescription(
                  plugin.fullName,
                  locale,
                  plugin.description,
                ) || t("noDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              {(plugin.category || plugin.tags.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {plugin.category && (
                    <Badge variant="outline" className="text-[11px]">
                      {t(`categories.${plugin.category}`)}
                    </Badge>
                  )}
                  {plugin.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="ghost" className="text-[11px]">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                <span
                  title={t("updated")}
                  className="text-xs text-muted-foreground"
                >
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
