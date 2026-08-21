import { cache } from "react";

import { getDb } from "./db";
import {
  pluginAuthorCount,
  pluginLanguages,
  realPlugins,
} from "./plugins-real";
import type { PluginWithGrowth } from "./types";

export interface PluginsPageData {
  plugins: PluginWithGrowth[];
  /** 出现过的语言，按仓库数降序。 */
  languages: string[];
  authorCount: number;
  /**
   * 实时的人工翻译短描述（plugin_i18n 表），fullName → locale → 文案。
   * 比构建期烤进 plugin-i18n.ts 的生成物新；组件按 实时 → 生成物 → 原文 兜底。
   */
  i18nDescriptions: Record<string, Record<string, string>>;
  /** false = DB 不可用，正在用构建期静态数据兜底（无增长信息）。 */
  live: boolean;
}

/**
 * 单条查询的超时上限。Turso 偶发抖动时（构建期预渲染重试 3 次、每次 60s 就会
 * 拖垮整个 next build），超时按查询失败处理，落进各自的静态兜底分支。
 */
const DB_TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label}超时（>${DB_TIMEOUT_MS}ms）`)),
      DB_TIMEOUT_MS,
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * 增长基线：优先取 7 天前（含）最近的一张快照，历史不足 7 天回退到最早一张。
 * 当前值直接读 plugins 维度表，快照只用来提供基线。
 */
const GROWTH_SQL = `
WITH latest AS (
  SELECT full_name, MAX(snapshot_date) AS d FROM plugin_snapshots GROUP BY full_name
),
base AS (
  SELECT l.full_name,
    COALESCE(
      (SELECT MAX(s.snapshot_date) FROM plugin_snapshots s
        WHERE s.full_name = l.full_name AND s.snapshot_date <= date(l.d, '-7 days')),
      (SELECT MIN(s.snapshot_date) FROM plugin_snapshots s WHERE s.full_name = l.full_name)
    ) AS d
  FROM latest l
)
SELECT p.full_name, p.name, p.owner, p.url, p.description, p.tags, p.language,
       p.stars, p.contributors, p.pushed_at, p.archived, p.category, p.score,
       p.is_featured, p.featured_boost, p.is_insider, p.is_official, p.is_risky, p.risk_note,
       COALESCE(p.stars - bs.stars, 0) AS star_growth,
       CASE WHEN p.contributors IS NOT NULL AND bs.contributors IS NOT NULL
            THEN p.contributors - bs.contributors END AS contributor_growth
FROM plugins p
LEFT JOIN base b  ON b.full_name = p.full_name
LEFT JOIN plugin_snapshots bs ON bs.full_name = b.full_name AND bs.snapshot_date = b.d
WHERE p.is_present = 1 AND p.is_offtopic = 0
ORDER BY p.is_risky ASC, p.is_featured * p.featured_boost DESC, p.stars DESC, p.full_name
`;

/** DB 挂掉时的兜底：构建期静态快照，增长记 0，页面永不 500。 */
function staticFallback(): PluginsPageData {
  return {
    plugins: realPlugins.map((p) => ({
      ...p,
      contributors: null,
      starGrowth: 0,
      contributorGrowth: null,
    })),
    languages: pluginLanguages,
    authorCount: pluginAuthorCount,
    i18nDescriptions: {},
    live: false,
  };
}

/**
 * 安装方式结论（scripts/lib/install.mjs 推导，probe-install.mjs 入库）：
 * release 有唯一的版本匹配 tarball / npm 已发布用包名装 / git 未发布但源码能跑 /
 * build-required 需自行构建 / not-installable 压根不是插件包。
 */
export type InstallKind =
  | "release"
  | "npm"
  | "git"
  | "build-required"
  | "not-installable";

/** 详情页数据：PluginWithGrowth + 评分明细与运维时间戳。 */
export interface PluginDetail extends PluginWithGrowth {
  firstSeenAt: string;
  scoredAt: string | null;
  /** 运营人工核对过的安装命令；优先级最高，null = 用推导结果。 */
  installCmd: string | null;
  /** null = 尚未探测（或走了静态兜底）——此时页面只说「见仓库 README」，不编命令。 */
  installKind: InstallKind | null;
  /** 推导出的命令；not-installable 时为 null。build-required 是多行。 */
  installCmdAuto: string | null;
  /** package.json 里的包名；not-installable 时用它区分「没有 manifest」和「不是组合包」。 */
  pkgName: string | null;
  /** package.json 里的精确版本号；未探测（或静态兜底）时为 null。 */
  pkgVersion: string | null;
  /** 实时多语言文案（plugin_i18n），locale → 字段；比构建期生成物新。 */
  i18n: Record<
    string,
    { description?: string; intro?: string; highlights?: string[] }
  >;
  /** score_detail JSON 原样解析；结构见 scripts/apply-scores.mjs。 */
  scoreDetail: {
    grade?: string;
    parts?: Record<string, number | boolean>;
    ai?: {
      manifest?: number;
      release?: number;
      docs?: number;
      dshIntegration?: number;
      suspicious?: boolean;
      comment?: string;
    };
    suspicious?: boolean;
    pinned?: number | boolean;
  } | null;
}

/** 单插件详情；未收录或已隐藏返回 null（页面走 notFound）。 */
export const getPluginDetail = cache(
  async (fullName: string): Promise<PluginDetail | null> => {
    try {
      const rs = await withTimeout(
        getDb().execute({
          sql: `SELECT full_name, name, owner, url, description, tags, language,
                     stars, contributors, pushed_at, archived, category, score,
                     is_featured, is_insider, is_official, is_risky, risk_note,
                     first_seen_at, scored_at, score_detail,
                     install_cmd, install_kind, install_cmd_auto, pkg_name, pkg_version
              FROM plugins
              WHERE lower(full_name) = lower(?) AND is_present = 1 AND is_offtopic = 0`,
          args: [fullName],
        }),
        "详情查询",
      );
      const r = rs.rows[0];
      if (!r) return null;

      const i18nRs = await withTimeout(
        getDb().execute({
          sql: `SELECT locale, description, intro, highlights FROM plugin_i18n WHERE full_name = ?`,
          args: [String(r.full_name)],
        }),
        "详情 i18n 查询",
      );
      const i18n: PluginDetail["i18n"] = {};
      for (const row of i18nRs.rows) {
        i18n[String(row.locale)] = {
          description: row.description == null ? undefined : String(row.description),
          intro: row.intro == null ? undefined : String(row.intro),
          highlights:
            row.highlights == null
              ? undefined
              : (JSON.parse(String(row.highlights)) as string[]),
        };
      }

      // 增长基线：7 天前（含）最近的一张快照，历史不足回退最早一张
      const snaps = await withTimeout(
        getDb().execute({
          sql: `SELECT snapshot_date, stars, contributors FROM plugin_snapshots
              WHERE full_name = ? ORDER BY snapshot_date`,
          args: [String(r.full_name)],
        }),
        "快照查询",
      );
      let starGrowth = 0;
      let contributorGrowth: number | null = null;
      if (snaps.rows.length >= 2) {
        const latest = snaps.rows[snaps.rows.length - 1];
        const cutoff = new Date(
          Date.parse(String(latest.snapshot_date)) - 7 * 86400_000,
        )
          .toISOString()
          .slice(0, 10);
        const base =
          [...snaps.rows]
            .reverse()
            .find((s) => String(s.snapshot_date) <= cutoff) ?? snaps.rows[0];
        starGrowth = Number(r.stars ?? 0) - Number(base.stars ?? 0);
        if (r.contributors != null && base.contributors != null) {
          contributorGrowth = Number(r.contributors) - Number(base.contributors);
        }
      }

      let scoreDetail: PluginDetail["scoreDetail"] = null;
      try {
        scoreDetail = r.score_detail ? JSON.parse(String(r.score_detail)) : null;
      } catch {
        scoreDetail = null;
      }

      return {
        fullName: String(r.full_name),
        name: String(r.name),
        owner: String(r.owner),
        url: String(r.url),
        description: String(r.description ?? ""),
        tags: JSON.parse(String(r.tags ?? "[]")) as string[],
        language: String(r.language ?? ""),
        stars: Number(r.stars ?? 0),
        contributors: r.contributors == null ? null : Number(r.contributors),
        pushedAt: String(r.pushed_at ?? ""),
        archived: Boolean(r.archived),
        category: String(r.category ?? ""),
        score: r.score == null ? null : Number(r.score),
        starGrowth,
        contributorGrowth,
        isFeatured: Boolean(r.is_featured),
        isInsider: Boolean(r.is_insider),
        isOfficial: Boolean(r.is_official),
        isRisky: Boolean(r.is_risky),
        riskNote: r.risk_note == null ? null : String(r.risk_note),
        firstSeenAt: String(r.first_seen_at ?? ""),
        scoredAt: r.scored_at == null ? null : String(r.scored_at),
        installCmd: r.install_cmd == null ? null : String(r.install_cmd),
        installKind:
          r.install_kind == null ? null : (String(r.install_kind) as InstallKind),
        installCmdAuto:
          r.install_cmd_auto == null ? null : String(r.install_cmd_auto),
        pkgName: r.pkg_name == null ? null : String(r.pkg_name),
        pkgVersion: r.pkg_version == null ? null : String(r.pkg_version),
        i18n,
        scoreDetail,
      };
    } catch (err) {
      console.error("[plugins-db] 详情读库失败：", err);
      // 静态数据兜底：基础信息仍可展示，动态字段置空
      const p = realPlugins.find(
        (x) => x.fullName.toLowerCase() === fullName.toLowerCase(),
      );
      if (!p) return null;
      return {
        ...p,
        contributors: null,
        starGrowth: 0,
        contributorGrowth: null,
        isFeatured: false,
        isInsider: false,
        isOfficial: false,
        firstSeenAt: "",
        scoredAt: null,
        installCmd: null,
        // 读不到库就不知道怎么装——页面据此指向仓库 README，而不是编一条命令出来
        installKind: null,
        installCmdAuto: null,
        pkgName: null,
        pkgVersion: null,
        i18n: {},
        scoreDetail: null,
      };
    }
  },
);

/**
 * 插件页全部数据，一次 SQL 拿完。React cache() 只做请求内去重——
 * 数据一天一变、页面本就动态、流量小，时间缓存的失效语义不值得引入。
 */
export const getPluginsPageData = cache(async (): Promise<PluginsPageData> => {
  try {
    const rs = await withTimeout(getDb().execute(GROWTH_SQL), "增长查询");

    const plugins: PluginWithGrowth[] = rs.rows.map((r) => ({
      fullName: String(r.full_name),
      name: String(r.name),
      owner: String(r.owner),
      url: String(r.url),
      description: String(r.description ?? ""),
      tags: JSON.parse(String(r.tags ?? "[]")) as string[],
      language: String(r.language ?? ""),
      stars: Number(r.stars ?? 0),
      contributors: r.contributors == null ? null : Number(r.contributors),
      pushedAt: String(r.pushed_at ?? ""),
      archived: Boolean(r.archived),
      category: String(r.category ?? ""),
      score: r.score == null ? null : Number(r.score),
      starGrowth: Number(r.star_growth ?? 0),
      contributorGrowth:
        r.contributor_growth == null ? null : Number(r.contributor_growth),
      isFeatured: Boolean(r.is_featured),
      // 只在降权时才带上这个字段：默认值写进 8540 行 JSON 会白白撑大懒加载的响应体
      ...(Number(r.featured_boost ?? 1) ? {} : { featuredBoost: false }),
      isInsider: Boolean(r.is_insider),
      isOfficial: Boolean(r.is_official),
      isRisky: Boolean(r.is_risky),
      riskNote: r.risk_note == null ? null : String(r.risk_note),
    }));

    // 语言按仓库数降序，与 gen 脚本口径一致
    const langCount = new Map<string, number>();
    for (const p of plugins) {
      if (p.language) langCount.set(p.language, (langCount.get(p.language) ?? 0) + 1);
    }
    const languages = [...langCount.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
      .map(([lang]) => lang);

    const authorCount = new Set(plugins.map((p) => p.owner)).size;

    const i18nRs = await withTimeout(
      getDb().execute(
        `SELECT full_name, locale, description FROM plugin_i18n WHERE description IS NOT NULL`,
      ),
      "i18n 查询",
    );
    const i18nDescriptions: Record<string, Record<string, string>> = {};
    for (const r of i18nRs.rows) {
      (i18nDescriptions[String(r.full_name)] ??= {})[String(r.locale)] =
        String(r.description);
    }

    return { plugins, languages, authorCount, i18nDescriptions, live: true };
  } catch (err) {
    console.error("[plugins-db] 读库失败，回退静态数据：", err);
    return staticFallback();
  }
});
