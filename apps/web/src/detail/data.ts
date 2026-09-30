/**
 * 插件详情页的运行时数据（按需渲染，仅在 Worker 里执行）。
 *
 * 与老站 src/lib/plugins-db.ts、plugin-readme.ts 同一套 SQL 与字段口径，区别：
 * - 直接用 D1 binding（cloudflare:workers 的 env.DB），没有内部路由兜底；
 * - **没有静态快照兜底**：读库失败就抛出 → 页面 500 → 老站路由器回落到 Next 渲染。
 *   快照兜底意味着把 11.7MB 的 plugins-real 编进 Worker，这正是重写要去掉的东西。
 */
import { env } from "cloudflare:workers";

import { primaryDownloads } from "@/lib/downloads";
import { installVersionOf } from "@/lib/install";
import type { PluginDetail } from "@/lib/plugins-db";
import type { PluginReadme } from "@/lib/plugin-readme";
import { GROWTH_SNAPSHOTS_SQL, PLUGIN_DETAIL_SQL } from "../../../../scripts/lib/plugin-queries.mjs";
import { shardOf, shardPath, type SidecarEntry, type SidecarShard } from "~/detail/sidecar";

type Row = Record<string, string | number | null>;

interface D1Like {
  prepare(sql: string): { bind(...v: unknown[]): { all(): Promise<{ results: Row[] }> } };
}
interface AssetsLike {
  fetch(input: Request | string | URL): Promise<Response>;
}

const cf = env as unknown as { DB: D1Like; ASSETS: AssetsLike };

export async function query(sql: string, ...args: unknown[]): Promise<Row[]> {
  const { results } = await cf.DB.prepare(sql)
    .bind(...args.map((a) => (typeof a === "boolean" ? (a ? 1 : 0) : a)))
    .all();
  return results;
}

/** 单插件详情；未收录 / 已隐藏返回 null。读库失败直接抛（交给路由器回落）。 */
export async function getPluginDetail(fullName: string): Promise<PluginDetail | null> {
  const r = (await query(PLUGIN_DETAIL_SQL, fullName))[0];
  if (!r) return null;
  const name = String(r.full_name);

  const [i18nRows, snaps] = await Promise.all([
    query(`SELECT locale, description, intro, highlights FROM plugin_i18n WHERE full_name = ?`, name),
    query(GROWTH_SNAPSHOTS_SQL, name),
  ]);

  const i18n: PluginDetail["i18n"] = {};
  for (const row of i18nRows) {
    i18n[String(row.locale)] = {
      description: row.description == null ? undefined : String(row.description),
      intro: row.intro == null ? undefined : String(row.intro),
      highlights: row.highlights == null ? undefined : (JSON.parse(String(row.highlights)) as string[]),
    };
  }

  // 增长基线：7 天前（含）最近的一张快照，历史不足回退最早一张（老站同口径）
  let starGrowth = 0;
  let contributorGrowth: number | null = null;
  if (snaps.length >= 2) {
    const latest = snaps[snaps.length - 1];
    const cutoff = new Date(Date.parse(String(latest.snapshot_date)) - 7 * 86400_000).toISOString().slice(0, 10);
    const base = [...snaps].reverse().find((s) => String(s.snapshot_date) <= cutoff) ?? snaps[0];
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

  const str = (v: string | number | null) => (v == null ? null : String(v));
  return {
    fullName: name,
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
    riskNote: str(r.risk_note),
    firstSeenAt: String(r.first_seen_at ?? ""),
    scoredAt: str(r.scored_at),
    installCmd: str(r.install_cmd),
    installKind: str(r.install_kind) as PluginDetail["installKind"],
    installCmdAuto: str(r.install_cmd_auto),
    pkgName: str(r.pkg_name),
    pkgVersion: str(r.pkg_version),
    installVersion: installVersionOf(str(r.install_kind), str(r.npm_latest_version), str(r.pkg_version)),
    downloadSummary: primaryDownloads({
      manual: r.dl_manual_total == null ? null : Number(r.dl_manual_total),
      manualNote: str(r.dl_manual_note),
      pkg: str(r.dl_pkg),
      npm: r.dl_npm_total == null ? null : Number(r.dl_npm_total),
      mirror: r.dl_mirror_total == null ? null : Number(r.dl_mirror_total),
      release: r.dl_release_total == null ? null : Number(r.dl_release_total),
      status: str(r.dl_status),
    }),
    i18n,
    scoreDetail,
  } as PluginDetail;
}

/** README：同步时已渲染并净化入库；查不到 / 超时一律不展示（锦上添花，不能拖垮详情页）。 */
export async function getPluginReadme(fullName: string): Promise<PluginReadme | null> {
  try {
    const r = (
      await Promise.race([
        query(
          `SELECT status, html, truncated, path, fetched_at FROM plugin_readmes
           WHERE full_name = ? AND status IN ('ok', 'too_large') LIMIT 1`,
          fullName,
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("README 查询超时")), 5_000)),
      ])
    )[0];
    if (!r) return null;
    const status = String(r.status) as PluginReadme["status"];
    const html = r.html == null ? null : String(r.html);
    if (status === "ok" && !html) return null;
    return { status, html, truncated: Boolean(r.truncated), path: r.path == null ? null : String(r.path), fetchedAt: String(r.fetched_at ?? "") };
  } catch {
    return null;
  }
}

/**
 * 站内 404：404 页是预渲染的静态文件，不在服务端路由表里（Astro.rewrite 找不到），
 * 所以经 ASSETS 取出对应语言的静态 404 页，以 404 状态返回。
 */
export async function notFoundResponse(base: URL, locale?: string): Promise<Response> {
  const path = locale ? `/${locale}/404.html` : "/404.html";
  const page = await cf.ASSETS.fetch(new URL(path, base)).catch(() => null);
  return new Response(page?.ok ? page.body : "Not found", {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** 旁车分片按 isolate 缓存：同一实例后续请求不再重复读取与解析 */
const shardCache = new Map<number, Promise<SidecarShard>>();

/** 读本插件的构建期旁车数据（相关插件 / 相关文档 / 站内标签）；缺失返回空条目，不影响主体渲染。 */
export async function getSidecar(fullName: string, base: URL): Promise<SidecarEntry> {
  const n = shardOf(fullName);
  let p = shardCache.get(n);
  if (!p) {
    p = cf.ASSETS.fetch(new URL(shardPath(n), base))
      .then((res) => (res.ok ? (res.json() as Promise<SidecarShard>) : {}))
      .catch(() => ({}));
    shardCache.set(n, p);
  }
  return (await p)[fullName.toLowerCase()] ?? { r: [], d: [], t: [] };
}

/** 相关插件的展示字段（与 hub 卡片同形状）+ 本语言译文，一次查询带回 */
export interface RelatedCard {
  fullName: string;
  name: string;
  owner: string;
  description: string;
  stars: number;
  score: number | null;
  language: string;
}

export async function getRelatedCards(names: string[], locale: string): Promise<RelatedCard[]> {
  if (names.length === 0) return [];
  const marks = names.map(() => "?").join(",");
  const rows = await query(
    `SELECT p.full_name, p.name, p.owner, p.description, p.stars, p.score, p.language, i.description AS i18n_desc
     FROM plugins p LEFT JOIN plugin_i18n i ON i.full_name = p.full_name AND i.locale = ?
     WHERE p.full_name IN (${marks}) AND p.is_present = 1 AND p.is_offtopic = 0 AND p.is_risky = 0`,
    locale,
    ...names,
  );
  const byName = new Map(rows.map((r) => [String(r.full_name), r]));
  // 保持构建期算好的顺序（确定性，链接图不抖动）；库里已消失的跳过
  return names.flatMap((n) => {
    const r = byName.get(n);
    if (!r) return [];
    return [
      {
        fullName: n,
        name: String(r.name),
        owner: String(r.owner),
        description: String(r.i18n_desc ?? r.description ?? ""),
        stars: Number(r.stars ?? 0),
        score: r.score == null ? null : Number(r.score),
        language: String(r.language ?? ""),
      },
    ];
  });
}
