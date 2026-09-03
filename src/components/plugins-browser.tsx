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
import { downloadTier, flexTier } from "@/lib/downloads";
import { ScoreBadge, gradeOf } from "@/components/score-badge";
import type { PluginWithGrowth } from "@/lib/types";

type SortKey = "stars" | "downloads" | "score" | "updated" | "name";

const SORTS: SortKey[] = ["stars", "downloads", "score", "updated", "name"];

const GRADES = ["S", "A", "B", "C"] as const;

/** SSR 与首屏只渲染这么多张卡片，挂载后切换为虚拟滚动——避免 2000+ 卡片把首屏拖垮。 */
const SSR_PREVIEW = 24;

/** 单行高度估值（px）；measureElement 会测真实高度修正。 */
const ROW_ESTIMATE = 260;

/** 只取日期部分——相对时间会在 SSR 与客户端算出不同结果，导致 hydration 不一致。 */
function day(iso: string) {
  return iso ? iso.slice(0, 10) : "-";
}

function haystack(p: PluginWithGrowth) {
  return `${p.id ?? p.fullName} ${p.description} ${p.tags.join(" ")} ${p.language}`.toLowerCase();
}

/** "all" 放行一切；其余等级要求已评分，未评分的插件在选中任意等级后自动出局。 */
function matchesGrade(p: PluginWithGrowth, grade: string) {
  if (grade === "all") return true;
  return p.score != null && gradeOf(p.score) === grade;
}

/** /api/plugins-data 的响应体（懒加载的全量数据）。 */
interface FullData {
  plugins: PluginWithGrowth[];
  i18nDescriptions: Record<string, Record<string, string>>;
}

/** 是否进列表置顶组：带推荐标记、且没被运营降权。 */
const pinned = (p: PluginWithGrowth) => p.isFeatured && p.featuredBoost !== false;

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
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  // 空闲加载可被用户操作抢先触发：全量数据没到之前筛选只跑在首屏 100 条上，
  // 一旦有人动筛选器就别再等 requestIdleCallback 了。
  const loadNowRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => {
    let alive = true;
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      loadNowRef.current = null;
      fetch("/api/plugins-data")
        .then((r) =>
          r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
        )
        .then((d: FullData) => {
          if (alive) setFull(d);
        })
        // 失败必须显式暴露：静默吞掉的话筛选会一直只作用于首屏 100 条，
        // 而计数牌写的是全量数字，用户看到的是「牌子写 70、结果只有 7 个」。
        .catch(() => {
          if (alive) setLoadFailed(true);
        });
    };
    loadNowRef.current = load;
    const idle = window.requestIdleCallback?.(load, { timeout: 2000 });
    const timer = idle == null ? window.setTimeout(load, 300) : null;
    return () => {
      alive = false;
      loadNowRef.current = null;
      if (idle != null) window.cancelIdleCallback?.(idle);
      if (timer != null) window.clearTimeout(timer);
    };
  }, [attempt]);

  const ensureFullData = React.useCallback(() => loadNowRef.current?.(), []);

  const plugins = full?.plugins ?? initialPlugins;
  const i18nDescriptions = full?.i18nDescriptions ?? initialI18n;

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = plugins.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!matchesGrade(p, grade)) return false;
      if (language !== "all" && p.language !== language) return false;
      if (!q) return true;
      return haystack(p).includes(q);
    });

    // 优质项目在任何排序下都置顶，风险项目在任何排序下都沉底（组内再按所选键排）。
    // 被运营降权的推荐（featuredBoost === false）不进置顶组——标记还在，只是不插队。
    const pin = (a: PluginWithGrowth, b: PluginWithGrowth) =>
      Number(a.isRisky) - Number(b.isRisky) ||
      Number(pinned(b)) - Number(pinned(a));
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
    if (sort === "downloads") {
      // 没探到下载量的沉底（口径见 src/lib/downloads.ts）。跨插件比的是各自的
      // 主口径总数，而 npm 装包数与 Release 安装包下载数本就不同量级——
      // 这条排序回答的是「谁被下得多」，不宣称两个渠道的数一比一可比。
      // 同数按 star 兜底。
      return [...matched].sort(
        (a, b) =>
          pin(a, b) ||
          (b.downloads?.total ?? -1) - (a.downloads?.total ?? -1) ||
          b.stars - a.stars,
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

  /**
   * 计数牌的数字。
   *
   * 全量数据到达前只能用服务端算好的全局计数——客户端手里只有首屏 100 条，
   * 自己算会把 70 个 C 算成 7 个。到达后改为按「其它已选筛选」实时联动：
   * 每个维度的计数都排除它自己的选择，回答的是「切到这一项会剩多少个」，
   * 否则会出现「分类牌写着 341、点进去 0 个」这种自相矛盾。
   */
  const counts = React.useMemo(() => {
    if (!full) {
      return {
        live: false,
        categoryAll: totalCount,
        category: categoryCounts,
        gradeAll: totalCount,
        grade: gradeCounts,
      };
    }
    const q = query.trim().toLowerCase();
    const cat: Record<string, number> = {};
    const gra: Record<string, number> = {};
    let categoryAll = 0;
    let gradeAll = 0;
    for (const p of full.plugins) {
      if (q && !haystack(p).includes(q)) continue;
      if (language !== "all" && p.language !== language) continue;
      const catOk = category === "all" || p.category === category;
      const graOk = matchesGrade(p, grade);
      if (graOk) {
        categoryAll++;
        if (p.category) cat[p.category] = (cat[p.category] ?? 0) + 1;
      }
      if (catOk) {
        gradeAll++;
        if (p.score != null) {
          const g = gradeOf(p.score);
          gra[g] = (gra[g] ?? 0) + 1;
        }
      }
    }
    return { live: true, categoryAll, category: cat, gradeAll, grade: gra };
  }, [
    full,
    query,
    language,
    category,
    grade,
    totalCount,
    categoryCounts,
    gradeCounts,
  ]);

  /** 非默认排序同样需要全量数据：只对首屏 100 条排「最近更新」，出来的根本不是最近更新的。 */
  const narrowed =
    query.trim() !== "" ||
    sort !== "stars" ||
    language !== "all" ||
    category !== "all" ||
    grade !== "all";
  /** 全量未到 + 已经在筛选/排序 = 当前结果不完整，必须明说，不能装作是最终答案。 */
  const partial = full == null && narrowed;

  const resetFilters = () => {
    setQuery("");
    setSort("stars");
    setLanguage("all");
    setCategory("all");
    setGrade("all");
  };

  // 虚拟滚动依赖 window 尺寸，SSR 期间无法得知——挂载前先渲染确定性首屏，挂载后再上虚拟列表。
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // 换筛选后列表会变短，若停在原滚动位置会直接落到新结果的中段甚至尾部，
  // 看起来像「筛完什么都没了」。列表顶端被滚出视口时把它拉回来。
  const resultsRef = React.useRef<HTMLParagraphElement>(null);
  const firstPass = React.useRef(true);
  React.useEffect(() => {
    if (firstPass.current) {
      firstPass.current = false;
      return;
    }
    const el = resultsRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: "start" });
    }
  }, [sort, language, category, grade]);

  return (
    // 第一次交互就抢先触发全量加载：等 requestIdleCallback 的话，
    // 立刻去点筛选的人会拿到只跑在首屏 100 条上的结果。load() 幂等，重复触发无害。
    <div
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"
      onPointerDownCapture={ensureFullData}
      onFocusCapture={ensureFullData}
    >
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
          <span className="text-xs opacity-70 tabular-nums">
            {counts.categoryAll}
          </span>
        </Button>
        {PLUGIN_CATEGORIES.filter((c) => categoryCounts[c] != null).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            className="rounded-full"
            // 数字是实时联动的，0 就代表点进去必然空——禁掉，别让人走进死路。
            // 当前选中项永远可点，否则筛出 0 个后就取消不掉了。
            disabled={counts.live && category !== c && !counts.category[c]}
            onClick={() => setCategory(category === c ? "all" : c)}
          >
            {t(`categories.${c}`)}
            <span className="text-xs opacity-70 tabular-nums">
              {counts.category[c] ?? 0}
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
          <span className="text-xs opacity-70 tabular-nums">
            {counts.gradeAll}
          </span>
        </Button>
        {GRADES.filter((g) => gradeCounts[g] != null).map((g) => (
          <Button
            key={g}
            size="sm"
            variant={grade === g ? "default" : "outline"}
            className="rounded-full"
            disabled={counts.live && grade !== g && !counts.grade[g]}
            onClick={() => setGrade(grade === g ? "all" : g)}
          >
            {g}
            <span className="text-xs opacity-70 tabular-nums">
              {counts.grade[g] ?? 0}
            </span>
          </Button>
        ))}
      </div>

      <div
        className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <p ref={resultsRef}>
          {t("showing", { n: visible.length, total: totalCount })}
        </p>
        {narrowed && (
          <Button
            size="xs"
            variant="ghost"
            className="rounded-full"
            onClick={resetFilters}
          >
            {t("clearFilters")}
          </Button>
        )}
        {/* 全量数据的三种状态都要说清楚，尤其是「结果还不完整」和「加载失败」 */}
        {loadFailed ? (
          <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            {t("loadFailed", { loaded: initialPlugins.length })}
            <Button
              size="xs"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setLoadFailed(false);
                setAttempt((n) => n + 1);
              }}
            >
              {t("retryLoad")}
            </Button>
          </span>
        ) : partial ? (
          <span className="text-amber-600 dark:text-amber-400">
            {t("partialResults", { total: totalCount })}
          </span>
        ) : (
          !full &&
          totalCount > initialPlugins.length && (
            <span>{t("loadingAll", { total: totalCount })}</span>
          )
        )}
      </div>

      {/* 插件网格：挂载前渲染首屏少量卡片（SSR 友好），挂载后切换为窗口虚拟滚动 */}
      {visible.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-muted-foreground">{t("noResults")}</p>
          {narrowed && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4 rounded-full"
              onClick={resetFilters}
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>
      ) : !mounted ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.slice(0, SSR_PREVIEW).map((plugin) => (
            <PluginCard
              key={plugin.fullName}
              plugin={plugin}
              i18nDescriptions={i18nDescriptions}
              allDownloads={sort === "downloads"}
            />
          ))}
        </div>
      ) : (
        <VirtualizedPluginGrid
          visible={visible}
          i18nDescriptions={i18nDescriptions}
          allDownloads={sort === "downloads"}
        />
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
  allDownloads,
}: {
  visible: PluginWithGrowth[];
  i18nDescriptions: Record<string, Record<string, string>>;
  allDownloads: boolean;
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
                allDownloads={allDownloads}
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
  allDownloads,
}: {
  plugin: PluginWithGrowth;
  i18nDescriptions: Record<string, Record<string, string>>;
  /** 按下载量排序时放宽到「有数就挂档」，否则整屏只有前 20 个看得出排序依据。 */
  allDownloads: boolean;
}) {
  const t = useTranslations("Plugins");
  const locale = useLocale();
  // 过万才给标记；口径与阈值见 src/lib/downloads.ts
  const tier = allDownloads
    ? plugin.downloads
      ? downloadTier(plugin.downloads.total)
      : null
    : flexTier(plugin.downloads);
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
        {(plugin.isRisky || plugin.isOfficial || plugin.isFeatured || plugin.isInsider || plugin.archived || tier) && (
          <div className="flex flex-wrap gap-1.5">
            {/* 下载量炫耀标记：只有过万才挂，档位配色与详情页徽章同一套 */}
            {tier && (
              <Badge
                title={t("downloads")}
                className="w-fit text-white"
                style={{ backgroundColor: tier.color }}
              >
                ↓ {tier.label}
              </Badge>
            )}
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
