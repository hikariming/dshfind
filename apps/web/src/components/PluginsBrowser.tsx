import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { memo } from "preact/compat";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";

import { PLUGIN_CATEGORIES, type PluginCategory } from "@/lib/categories";
import { downloadTier, flexTier } from "@/lib/downloads";
import { gradeOf } from "@/lib/grade";
import type { PluginWithGrowth } from "@/lib/types";

/**
 * 插件超市（Preact 岛，client:load）。交互与老站 src/components/plugins-browser.tsx 一致：
 * 首屏直出前 100 个 → 空闲时懒加载全量 → 搜索/排序/分类/评级/语言筛选 + 计数联动 → 窗口虚拟滚动。
 * 区别只在文案由 props 传入（不依赖 next-intl），shadcn 组件换成等价 class，图标内联 SVG。
 */

type SortKey = "stars" | "downloads" | "score" | "updated" | "name";
const SORTS: SortKey[] = ["stars", "downloads", "score", "updated", "name"];
const GRADES = ["S", "A", "B", "C"] as const;

/** SSR 与首屏只渲染这么多张卡片，挂载后切换为虚拟滚动——避免 2000+ 卡片把首屏拖垮 */
const SSR_PREVIEW = 24;
/** 单行高度估值（px）；measureElement 会测真实高度修正 */
const ROW_ESTIMATE = 260;

/** 老站同款 shadcn 样式（Button / Badge / Card / Input 展开后的等价 class） */
const BTN =
  "inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";
const BTN_SM = "h-7 gap-1 px-2.5 text-[0.8rem]";
const BTN_XS = "h-6 gap-1 px-2 text-xs";
const V_DEFAULT = "bg-primary text-primary-foreground hover:bg-primary/80";
const V_OUTLINE =
  "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50";
const V_GHOST = "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50";
const BADGE =
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export interface BrowserLabels {
  badge: string;
  title: string;
  descPrefix: string;
  descSuffix: string;
  plugins: string;
  authors: string;
  searchPlaceholder: string;
  language: string;
  allLanguages: string;
  /** 含 {n} {total} */
  showing: string;
  loadingAll: string;
  partialResults: string;
  loadFailed: string;
  retryLoad: string;
  clearFilters: string;
  viewDetail: string;
  noDesc: string;
  archived: string;
  noResults: string;
  contributors: string;
  weeklyGrowth: string;
  downloads: string;
  updated: string;
  featured: string;
  insider: string;
  risky: string;
  score: string;
  gradeLabel: string;
  official: string;
  sort: Record<SortKey, string>;
  /** 含 all */
  categories: Record<string, string>;
}

/** /api/plugins-data 的响应体（懒加载的全量数据） */
interface FullData {
  plugins: PluginWithGrowth[];
  i18nDescriptions: Record<string, Record<string, string>>;
}

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));

/** 只取日期部分——相对时间会在服务端与客户端算出不同结果，导致水合不一致 */
const day = (iso: string) => (iso ? iso.slice(0, 10) : "-");

const haystack = (p: PluginWithGrowth) => `${p.fullName} ${p.description} ${p.tags.join(" ")} ${p.language}`.toLowerCase();

/** "all" 放行一切；其余等级要求已评分，未评分的插件在选中任意等级后自动出局 */
const matchesGrade = (p: PluginWithGrowth, grade: string) =>
  grade === "all" || (p.score != null && gradeOf(p.score) === grade);

/** 是否进列表置顶组：带推荐标记、且没被运营降权 */
const pinned = (p: PluginWithGrowth) => p.isFeatured && p.featuredBoost !== false;

const GRADE_STYLES: Record<string, string> = {
  S: "bg-gradient-brand text-white",
  A: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  B: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  C: "bg-muted text-muted-foreground",
};

export default function PluginsBrowser({
  locale,
  initialPlugins,
  totalCount,
  languages,
  authorCount,
  categoryCounts,
  gradeCounts,
  i18nDescriptions: initialI18n,
  labels: t,
}: {
  locale: string;
  /** 首屏直出的前 100 个（featured 优先、star 降序）；全量在客户端懒加载 */
  initialPlugins: PluginWithGrowth[];
  /** 全量插件数——首屏数据不全，头部统计与「全部」计数都用它 */
  totalCount: number;
  languages: string[];
  authorCount: number;
  /** 分类/评级计数由构建期按全量算好传入，客户端只有部分数据算不准 */
  categoryCounts: Record<string, number>;
  gradeCounts: Record<string, number>;
  i18nDescriptions: Record<string, Record<string, string>>;
  labels: BrowserLabels;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("stars");
  const [language, setLanguage] = useState("all");
  const [category, setCategory] = useState("all");
  const [grade, setGrade] = useState("all");

  // ?category= 深链：挂载后从 URL 读取（页面是静态的，服务端看不到查询串）
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    if (c && PLUGIN_CATEGORIES.includes(c as PluginCategory)) setCategory(c);
  }, []);

  // 全量数据懒加载：挂载后趁浏览器空闲拉齐，到达后无缝替换
  const [full, setFull] = useState<FullData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // 空闲加载可被用户操作抢先触发：全量没到之前筛选只跑在首屏 100 条上
  const loadNowRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    let alive = true;
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      loadNowRef.current = null;
      fetch("/api/plugins-data", { credentials: "omit" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((d: FullData) => {
          if (alive) setFull(d);
        })
        // 失败必须显式暴露：静默吞掉的话筛选会一直只作用于首屏 100 条，计数牌却写着全量数字
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
  const ensureFullData = useCallback(() => loadNowRef.current?.(), []);

  const plugins = full?.plugins ?? initialPlugins;
  const i18nDescriptions = full?.i18nDescriptions ?? initialI18n;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = plugins.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!matchesGrade(p, grade)) return false;
      if (language !== "all" && p.language !== language) return false;
      return !q || haystack(p).includes(q);
    });
    // 优质项目在任何排序下都置顶，风险项目在任何排序下都沉底（组内再按所选键排）
    const pin = (a: PluginWithGrowth, b: PluginWithGrowth) =>
      Number(a.isRisky) - Number(b.isRisky) || Number(pinned(b)) - Number(pinned(a));
    if (sort === "name") return [...matched].sort((a, b) => pin(a, b) || a.name.localeCompare(b.name, "en"));
    if (sort === "updated") return [...matched].sort((a, b) => pin(a, b) || b.pushedAt.localeCompare(a.pushedAt));
    if (sort === "downloads") {
      // 没探到下载量的沉底，同数按 star 兜底（口径见 src/lib/downloads.ts）
      return [...matched].sort(
        (a, b) => pin(a, b) || (b.downloads?.total ?? -1) - (a.downloads?.total ?? -1) || b.stars - a.stars,
      );
    }
    if (sort === "score") {
      // 未评分沉底，同分按 star
      return [...matched].sort((a, b) => pin(a, b) || (b.score ?? -1) - (a.score ?? -1) || b.stars - a.stars);
    }
    return matched; // 快照已按 featured DESC, stars DESC 排好
  }, [plugins, query, sort, language, category, grade]);

  /**
   * 计数牌：全量未到用构建期全局计数；到达后按「其它已选筛选」实时联动——
   * 每个维度排除它自己的选择，回答「切到这一项会剩多少个」。
   */
  const counts = useMemo(() => {
    if (!full) {
      return { live: false, categoryAll: totalCount, category: categoryCounts, gradeAll: totalCount, grade: gradeCounts };
    }
    const q = query.trim().toLowerCase();
    const cat: Record<string, number> = {};
    const gra: Record<string, number> = {};
    let categoryAll = 0;
    let gradeAll = 0;
    for (const p of full.plugins) {
      if (q && !haystack(p).includes(q)) continue;
      if (language !== "all" && p.language !== language) continue;
      if (matchesGrade(p, grade)) {
        categoryAll++;
        if (p.category) cat[p.category] = (cat[p.category] ?? 0) + 1;
      }
      if (category === "all" || p.category === category) {
        gradeAll++;
        if (p.score != null) {
          const g = gradeOf(p.score);
          gra[g] = (gra[g] ?? 0) + 1;
        }
      }
    }
    return { live: true, categoryAll, category: cat, gradeAll, grade: gra };
  }, [full, query, language, category, grade, totalCount, categoryCounts, gradeCounts]);

  /** 非默认排序同样需要全量数据 */
  const narrowed = query.trim() !== "" || sort !== "stars" || language !== "all" || category !== "all" || grade !== "all";
  /** 全量未到 + 已经在筛选/排序 = 当前结果不完整，必须明说 */
  const partial = full == null && narrowed;

  const resetFilters = () => {
    setQuery("");
    setSort("stars");
    setLanguage("all");
    setCategory("all");
    setGrade("all");
  };

  // 虚拟滚动依赖 window 尺寸，服务端无法得知——挂载前先渲染确定性首屏
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 换筛选后列表变短，停在原位置会落到新结果中段；列表顶端被滚出视口时拉回来
  const resultsRef = useRef<HTMLParagraphElement>(null);
  const firstPass = useRef(true);
  useEffect(() => {
    if (firstPass.current) {
      firstPass.current = false;
      return;
    }
    const el = resultsRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  }, [sort, language, category, grade]);

  const chip = (active: boolean) => `${BTN} ${BTN_SM} rounded-full ${active ? V_DEFAULT : V_OUTLINE}`;

  return (
    // 第一次交互就抢先触发全量加载；load() 幂等
    <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" onPointerDownCapture={ensureFullData} onFocusCapture={ensureFullData}>
      <div class="max-w-2xl">
        <span class={`${BADGE} bg-gradient-brand text-white`}>
          <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" />
          </svg>
          {t.badge}
        </span>
        <h1 class="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p class="mt-3 text-muted-foreground">
          {t.descPrefix}{" "}
          <a
            href="https://github.com/topics/dsh-plugin"
            target="_blank"
            rel="noopener"
            class="text-brand-600 underline-offset-4 hover:underline dark:text-brand-300"
          >
            dsh-plugin
          </a>{" "}
          {t.descSuffix}
        </p>
        <div class="mt-5 flex items-center gap-2">
          <div class="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">{totalCount}</div>
          <div class="text-sm text-muted-foreground">{t.plugins} ·</div>
          <div class="text-2xl font-bold text-brand-600 tabular-nums dark:text-brand-400">{authorCount}</div>
          <div class="text-sm text-muted-foreground">{t.authors}</div>
        </div>
      </div>

      {/* 搜索 + 排序 + 语言筛选 */}
      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative sm:max-w-xs sm:flex-1">
          <svg
            class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            class="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 pl-9 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          {SORTS.map((key) => (
            <button key={key} type="button" class={`${BTN} ${BTN_SM} rounded-lg ${sort === key ? V_DEFAULT : V_OUTLINE}`} onClick={() => setSort(key)}>
              {t.sort[key]}
            </button>
          ))}
          <select
            value={language}
            onChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}
            aria-label={t.language}
            class="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">{t.allLanguages}</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 分类筛选：只展示有插件的分类，未分类的仓库仍在「全部」里 */}
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" class={chip(category === "all")} onClick={() => setCategory("all")}>
          {t.categories.all}
          <span class="text-xs tabular-nums opacity-70">{counts.categoryAll}</span>
        </button>
        {PLUGIN_CATEGORIES.filter((c) => categoryCounts[c] != null).map((c) => (
          <button
            key={c}
            type="button"
            class={chip(category === c)}
            // 数字实时联动：0 代表点进去必然空，禁掉；当前选中项永远可点，否则取消不掉
            disabled={counts.live && category !== c && !counts.category[c]}
            onClick={() => setCategory(category === c ? "all" : c)}
          >
            {t.categories[c]}
            <span class="text-xs tabular-nums opacity-70">{counts.category[c] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* 评级筛选：只有已评分的插件有等级，选中后未评分自动被过滤 */}
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted-foreground">{t.gradeLabel}</span>
        <button type="button" class={chip(grade === "all")} onClick={() => setGrade("all")}>
          {t.categories.all}
          <span class="text-xs tabular-nums opacity-70">{counts.gradeAll}</span>
        </button>
        {GRADES.filter((g) => gradeCounts[g] != null).map((g) => (
          <button
            key={g}
            type="button"
            class={chip(grade === g)}
            disabled={counts.live && grade !== g && !counts.grade[g]}
            onClick={() => setGrade(grade === g ? "all" : g)}
          >
            {g}
            <span class="text-xs tabular-nums opacity-70">{counts.grade[g] ?? 0}</span>
          </button>
        ))}
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground" aria-live="polite">
        <p ref={resultsRef}>{fill(t.showing, { n: visible.length, total: totalCount })}</p>
        {narrowed && (
          <button type="button" class={`${BTN} ${BTN_XS} rounded-full ${V_GHOST}`} onClick={resetFilters}>
            {t.clearFilters}
          </button>
        )}
        {/* 全量数据的三种状态都要说清楚，尤其是「结果还不完整」和「加载失败」 */}
        {loadFailed ? (
          <span class="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            {fill(t.loadFailed, { loaded: initialPlugins.length })}
            <button
              type="button"
              class={`${BTN} ${BTN_XS} rounded-full ${V_OUTLINE}`}
              onClick={() => {
                setLoadFailed(false);
                setAttempt((n) => n + 1);
              }}
            >
              {t.retryLoad}
            </button>
          </span>
        ) : partial ? (
          <span class="text-amber-600 dark:text-amber-400">{fill(t.partialResults, { total: totalCount })}</span>
        ) : (
          !full && totalCount > initialPlugins.length && <span>{fill(t.loadingAll, { total: totalCount })}</span>
        )}
      </div>

      {/* 插件网格：挂载前渲染首屏少量卡片（服务端可见），挂载后切换为窗口虚拟滚动 */}
      {visible.length === 0 ? (
        <div class="mt-10 text-center">
          <p class="text-muted-foreground">{t.noResults}</p>
          {narrowed && (
            <button type="button" class={`${BTN} ${BTN_SM} mt-4 rounded-full ${V_OUTLINE}`} onClick={resetFilters}>
              {t.clearFilters}
            </button>
          )}
        </div>
      ) : !mounted ? (
        <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.slice(0, SSR_PREVIEW).map((plugin) => (
            <PluginCard
              key={plugin.fullName}
              plugin={plugin}
              locale={locale}
              description={i18nDescriptions[plugin.fullName]?.[locale]}
              allDownloads={sort === "downloads"}
              t={t}
            />
          ))}
        </div>
      ) : (
        <VirtualizedGrid visible={visible} locale={locale} i18nDescriptions={i18nDescriptions} allDownloads={sort === "downloads"} t={t} />
      )}
    </div>
  );
}

/**
 * 窗口级虚拟滚动的插件网格：按当前列数把 visible 切成行，每行一个 measured 的绝对定位容器，
 * 只有落在视口附近的行才会被渲染。
 */
function VirtualizedGrid({
  visible,
  locale,
  i18nDescriptions,
  allDownloads,
  t,
}: {
  visible: PluginWithGrowth[];
  locale: string;
  i18nDescriptions: Record<string, Record<string, string>>;
  allDownloads: boolean;
  t: BrowserLabels;
}) {
  // 列数跟随 Tailwind 的 sm/lg 视口断点（640/1024），matchMedia 保证与 CSS 对齐
  const [columnCount, setColumnCount] = useState(3);
  useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const sm = window.matchMedia("(min-width: 640px)");
    const update = () => setColumnCount(lg.matches ? 3 : sm.matches ? 2 : 1);
    update();
    lg.addEventListener("change", update);
    sm.addEventListener("change", update);
    return () => {
      lg.removeEventListener("change", update);
      sm.removeEventListener("change", update);
    };
  }, []);

  const rows = useMemo(() => {
    const out: PluginWithGrowth[][] = [];
    for (let i = 0; i < visible.length; i += columnCount) out.push(visible.slice(i, i + columnCount));
    return out;
  }, [visible, columnCount]);

  const rowVirtualizer = useWindowVirtualizer({ count: rows.length, estimateSize: () => ROW_ESTIMATE, overscan: 4 });

  return (
    <div class="mt-6 w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
        <div
          key={virtualRow.key}
          data-index={virtualRow.index}
          ref={rowVirtualizer.measureElement}
          class="grid gap-5 pb-5"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {rows[virtualRow.index].map((plugin) => (
            <PluginCard
              key={plugin.fullName}
              plugin={plugin}
              locale={locale}
              description={i18nDescriptions[plugin.fullName]?.[locale]}
              allDownloads={allDownloads}
              t={t}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const PluginCard = memo(function PluginCard({
  plugin,
  locale,
  description,
  allDownloads,
  t,
}: {
  plugin: PluginWithGrowth;
  locale: string;
  /** 本语言译文；缺省回退原文 */
  description: string | undefined;
  /** 按下载量排序时放宽到「有数就挂档」，否则整屏只有前 20 个看得出排序依据 */
  allDownloads: boolean;
  t: BrowserLabels;
}) {
  // 过万才给标记；口径与阈值见 src/lib/downloads.ts
  const tier = allDownloads ? (plugin.downloads ? downloadTier(plugin.downloads.total) : null) : flexTier(plugin.downloads);
  const grade = plugin.score == null ? null : gradeOf(plugin.score);
  const href = `/${locale}/plugins/${plugin.fullName}`;
  return (
    <div
      class={`flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 ${
        plugin.isRisky
          ? "border border-red-500/40 bg-gradient-to-br from-red-500/6 to-transparent"
          : plugin.isFeatured
            ? "border border-brand-500/50 bg-gradient-to-br from-brand-500/8 to-transparent"
            : ""
      }`}
    >
      <div class="grid auto-rows-min items-start gap-1 px-4 pb-2">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5 font-mono text-sm leading-snug font-semibold break-all">
            <a href={href} class="underline-offset-4 hover:text-brand-600 hover:underline dark:hover:text-brand-300">
              {plugin.name}
            </a>
            {grade && (
              <span
                title={t.score}
                class={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${GRADE_STYLES[grade]}`}
              >
                {grade}
                <span class="opacity-80">{plugin.score}</span>
              </span>
            )}
          </div>
          <span class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <svg class="size-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
            {plugin.stars.toLocaleString("en-US")}
            {plugin.starGrowth > 0 && (
              <span title={t.weeklyGrowth} class="font-medium text-emerald-600 dark:text-emerald-400">
                +{plugin.starGrowth.toLocaleString("en-US")}
              </span>
            )}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <a
            href={`https://github.com/${plugin.owner}`}
            target="_blank"
            rel="noopener"
            class="w-fit text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            @{plugin.owner}
          </a>
          {plugin.contributors != null && (
            <span title={t.contributors} class="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {plugin.contributors.toLocaleString("en-US")}
              {plugin.contributorGrowth != null && plugin.contributorGrowth > 0 && (
                <span class="font-medium text-emerald-600 dark:text-emerald-400">+{plugin.contributorGrowth.toLocaleString("en-US")}</span>
              )}
            </span>
          )}
        </div>
        {(plugin.isRisky || plugin.isOfficial || plugin.isFeatured || plugin.isInsider || plugin.archived || tier) && (
          <div class="flex flex-wrap gap-1.5">
            {/* 下载量炫耀标记：只有过万才挂，档位配色与详情页徽章同一套 */}
            {tier && (
              <span title={t.downloads} class={`${BADGE} text-white`} style={{ backgroundColor: tier.color }}>
                ↓ {tier.label}
              </span>
            )}
            {plugin.isRisky && <span class={`${BADGE} bg-red-600 text-white dark:bg-red-500`}>⚠️ {t.risky}</span>}
            {plugin.isOfficial && <span class={`${BADGE} bg-sky-600 text-white dark:bg-sky-500`}>🏛 {t.official}</span>}
            {plugin.isFeatured && <span class={`${BADGE} bg-gradient-brand text-white`}>✨ {t.featured}</span>}
            {plugin.isInsider && <span class={`${BADGE} bg-secondary text-secondary-foreground`}>{t.insider}</span>}
            {plugin.archived && <span class={`${BADGE} border-border text-foreground`}>{t.archived}</span>}
          </div>
        )}
        {/* 描述长度差异极大，截断三行才排得齐 */}
        <div class="line-clamp-3 text-sm leading-snug text-muted-foreground">{description ?? (plugin.description || t.noDesc)}</div>
      </div>
      <div class="mt-auto px-4">
        {(plugin.category || plugin.tags.length > 0) && (
          <div class="flex flex-wrap gap-1.5">
            {plugin.category && <span class={`${BADGE} border-border text-[11px] text-foreground`}>{t.categories[plugin.category]}</span>}
            {plugin.tags.slice(0, 4).map((tag) => (
              <span key={tag} class={`${BADGE} text-[11px] hover:bg-muted hover:text-muted-foreground`}>
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div class="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
          <span title={t.updated} class="text-xs text-muted-foreground">
            {plugin.language || "-"} · {day(plugin.pushedAt)}
          </span>
          <a href={href} class={`${BTN} ${BTN_SM} rounded-lg ${V_DEFAULT}`}>
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
              <circle cx="13" cy="12" r="2" />
              <path d="M18 19c-2.8 0-5-2.2-5-5v8" />
              <circle cx="20" cy="19" r="2" />
            </svg>
            {t.viewDetail}
          </a>
        </div>
      </div>
    </div>
  );
});
