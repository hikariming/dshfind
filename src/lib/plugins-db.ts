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
  /** false = DB 不可用，正在用构建期静态数据兜底（无增长信息）。 */
  live: boolean;
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
       p.stars, p.contributors, p.pushed_at, p.archived, p.category,
       p.is_featured, p.is_insider,
       COALESCE(p.stars - bs.stars, 0) AS star_growth,
       CASE WHEN p.contributors IS NOT NULL AND bs.contributors IS NOT NULL
            THEN p.contributors - bs.contributors END AS contributor_growth
FROM plugins p
LEFT JOIN base b  ON b.full_name = p.full_name
LEFT JOIN plugin_snapshots bs ON bs.full_name = b.full_name AND bs.snapshot_date = b.d
WHERE p.is_present = 1 AND p.is_offtopic = 0
ORDER BY p.is_featured DESC, p.stars DESC, p.full_name
`;

/** DB 挂掉时的兜底：构建期静态快照，增长记 0，页面永不 500。 */
function staticFallback(): PluginsPageData {
  return {
    plugins: realPlugins.map((p) => ({
      ...p,
      contributors: null,
      starGrowth: 0,
      contributorGrowth: null,
      isFeatured: false,
      isInsider: false,
    })),
    languages: pluginLanguages,
    authorCount: pluginAuthorCount,
    live: false,
  };
}

/**
 * 插件页全部数据，一次 SQL 拿完。React cache() 只做请求内去重——
 * 数据一天一变、页面本就动态、流量小，时间缓存的失效语义不值得引入。
 */
export const getPluginsPageData = cache(async (): Promise<PluginsPageData> => {
  try {
    const rs = await getDb().execute(GROWTH_SQL);

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
      starGrowth: Number(r.star_growth ?? 0),
      contributorGrowth:
        r.contributor_growth == null ? null : Number(r.contributor_growth),
      isFeatured: Boolean(r.is_featured),
      isInsider: Boolean(r.is_insider),
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

    return { plugins, languages, authorCount, live: true };
  } catch (err) {
    console.error("[plugins-db] 读库失败，回退静态数据：", err);
    return staticFallback();
  }
});
