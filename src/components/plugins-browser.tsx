"use client";

import * as React from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
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
import { PLUGIN_CATEGORIES, type PluginCategory } from "@/lib/categories";
import { localizePluginDescription } from "@/lib/plugin-i18n";
import { ScoreBadge, gradeOf } from "@/components/score-badge";
import type { PluginWithGrowth } from "@/lib/types";

type SortKey = "stars" | "score" | "updated" | "name";

const SORTS: SortKey[] = ["stars", "score", "updated", "name"];

const GRADES = ["S", "A", "B", "C"] as const;

/** SSR 与首屏只渲染这么多张卡片，挂载后切换为虚拟滚动——避免 2000+ 卡片把首屏拖垮。 */
const SSR_PREVIEW = 24;

/** 单行高度估值（px）；measureElement 会测真实高度修正。 */
const ROW_ESTIMATE = 260;

/** 只取日期部分——相对时间会在 SSR 与客户端算出不同结果，导致 hydration 不一致。 */
function day(iso: string) {
  return iso ? iso.slice(0, 10) : "-";
}

/** /api/plugins-data 的响应体（懒加载的全量数据）。 */
interface FullData {
  plugins: PluginWithGrowth[];
  i18nDescriptions: Record<string, Record<string, string>>;
}

export function PluginsBrowser({
  initialPlugins,
  totalCount,
  languages,
  authorCount,
  categoryCounts,
  gradeCounts,
  i18nDescriptions: initialI18n = {},
}: {
  /** 首屏直出的前 100 个（featured 优先、star 降序）；全量在客户端懒加载。 */
  initialPlugins: PluginWithGrowth[];
  /** 全量插件数——首屏数据不全，头部统计与「全部」计数都用它。 */
  totalCount: number;
  languages: string[];
  authorCount: number;
  /** 分类/评级计数由服务端按全量算好传入，客户端只有部分数据算不准。 */
  categoryCounts: Record<string, number>;
  gradeCounts: Record<string, number>;
  /** 实时人工翻译（Turso plugin_i18n），比构建期生成物新；缺省回退生成物再回退原文。 */
  i18nDescriptions?: Record<string, Record<string, string>>;
}) {
  const t = useTranslations("Plugins");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("stars");
  const [language, setLanguage] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const [grade, setGrade] = React.useState("all");

  // ?category= 深链在挂载后从 URL 读取，而不是 server 端 await searchParams——
  // 后者会把 /plugins 拖成每请求动态渲染，页面就没法进 ISR 缓存了。
  // 代价是深链首帧短暂显示「全部」，随即切到目标分类。
  React.useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    if (c && PLUGIN_CATEGORIES.includes(c as PluginCategory)) setCategory(c);
  }, []);

  // 全量数据懒加载：首屏 HTML 只带前 100 个插件（3.6MB → ~0.2MB），
  // 挂载后趁浏览器空闲从 /api/plugins-data（ISR 缓存的静态 JSON）拉齐，
  // 到达后无缝替换——搜索/筛选/滚动此后作用于全量数据。
  const [full, setFull] = React.useState<FullData | null>(null);
  React.useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/plugins-data")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: FullData | null) => {
          if (alive && d) setFull(d);
        })
        .catch(() => {});
    const idle = window.requestIdleCallback?.(load, { timeout: 2000 });
    const timer = idle == null ? window.setTimeout(load, 300) : null;
    return () => {
      alive = false;
      if (idle != null) window.cancelIdleCallback?.(idle);
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);

  const plugins = full?.plugins ?? initialPlugins;
  const i18nDescriptions = full?.i18nDescriptions ?? initialI18n;

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

    // 优质项目在任何排序下都置顶，风险项目在任何排序下都沉底（组内再按所选键排）。
    const pin = (a: PluginWithGrowth, b: PluginWithGrowth) =>
      Number(a.isRisky) - Number(b.isRisky) ||
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

  // 虚拟滚动依赖 window 尺寸，SSR 期间无法得知——挂载前先渲染确定性首屏，挂载后再上虚拟列表。
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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
            rel="noopener"
            className="text-brand-600 underline-offset-4 hover:underline dark:text-brand-300"
          >
            dsh-plugin
          </a>{" "}
          {t("descSuffix")}
        </p>
        <div className="mt-5 flex items-center gap-2">
          <div className="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">
            {totalCount}
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
          <span className="text-xs opacity-70 tabular-nums">{totalCount}</span>
        </Button>
        {PLUGIN_CATEGORIES.filter((c) => categoryCounts[c] != null).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setCategory(category === c ? "all" : c)}
          >
            {t(`categories.${c}`)}
            <span className="text-xs opacity-70 tabular-nums">
              {categoryCounts[c]}
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
        {GRADES.filter((g) => gradeCounts[g] != null).map((g) => (
          <Button
            key={g}
            size="sm"
            variant={grade === g ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setGrade(grade === g ? "all" : g)}
          >
            {g}
            <span className="text-xs opacity-70 tabular-nums">
              {gradeCounts[g]}
            </span>
          </Button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {t("showing", { n: visible.length, total: totalCount })}
      </p>

      {/* 插件网格：挂载前渲染首屏少量卡片（SSR 友好），挂载后切换为窗口虚拟滚动 */}
      {visible.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      ) : !mounted ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.slice(0, SSR_PREVIEW).map((plugin) => (
            <PluginCard
              key={plugin.fullName}
              plugin={plugin}
              i18nDescriptions={i18nDescriptions}
            />
          ))}
        </div>
      ) : (
        <VirtualizedPluginGrid
          visible={visible}
          i18nDescriptions={i18nDescriptions}
        />
      )}

      {/* 全量数据未到时的尾部加载态；到达后本行消失，列表无缝延长 */}
      {!full && totalCount > initialPlugins.length && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("loadingAll", { total: totalCount })}
        </p>
      )}
    </div>
  );
}

/**
 * 窗口级虚拟滚动的插件网格。
 * 按当前列数把 visible 切成行，每行一个 measured 的绝对定位容器，
 * 只有落在视口附近的行才会被渲染——2000+ 卡片也不会卡。
 */
function VirtualizedPluginGrid({
  visible,
  i18nDescriptions,
}: {
  visible: PluginWithGrowth[];
  i18nDescriptions: Record<string, Record<string, string>>;
}) {
  // 列数跟随 Tailwind 的 sm/lg 视口断点（640/1024），用 matchMedia 保证与 CSS 完全对齐。
  const [columnCount, setColumnCount] = React.useState(3);
  React.useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const sm = window.matchMedia("(min-width: 640px)");
    const update = () =>
      setColumnCount(lg.matches ? 3 : sm.matches ? 2 : 1);
    update();
    lg.addEventListener("change", update);
    sm.addEventListener("change", update);
    return () => {
      lg.removeEventListener("change", update);
      sm.removeEventListener("change", update);
    };
  }, []);

  const rows = React.useMemo(() => {
    const out: PluginWithGrowth[][] = [];
    for (let i = 0; i < visible.length; i += columnCount) {
      out.push(visible.slice(i, i + columnCount));
    }
    return out;
  }, [visible, columnCount]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 4,
  });

  return (
    <div
      className="mt-6 w-full"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: "relative",
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index];
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="grid gap-5 pb-5"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            }}
          >
            {row.map((plugin) => (
              <PluginCard
                key={plugin.fullName}
                plugin={plugin}
                i18nDescriptions={i18nDescriptions}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

const PluginCard = React.memo(function PluginCard({
  plugin,
  i18nDescriptions,
}: {
  plugin: PluginWithGrowth;
  i18nDescriptions: Record<string, Record<string, string>>;
}) {
  const t = useTranslations("Plugins");
  const locale = useLocale();
  return (
    <Card
      className={`flex flex-col ${
        plugin.isRisky
          ? "border-red-500/40 bg-gradient-to-br from-red-500/6 to-transparent"
          : plugin.isFeatured
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
            rel="noopener"
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
        {(plugin.isRisky || plugin.isOfficial || plugin.isFeatured || plugin.isInsider || plugin.archived) && (
          <div className="flex flex-wrap gap-1.5">
            {plugin.isRisky && (
              <Badge className="w-fit bg-red-600 text-white dark:bg-red-500">
                ⚠️ {t("risky")}
              </Badge>
            )}
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
          {i18nDescriptions[plugin.fullName]?.[locale] ??
            (localizePluginDescription(
              plugin.fullName,
              locale,
              plugin.description,
            ) ||
              t("noDesc"))}
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
            <Link href={`/plugins/${plugin.fullName}`}>
              <FolderGit2 />
              {t("viewDetail")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
