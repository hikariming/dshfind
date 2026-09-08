import { cache } from "react";

import { getDb } from "./db";
import { PLUGIN_DETAIL_SQL, GROWTH_SNAPSHOTS_SQL } from "../../scripts/lib/plugin-queries.mjs";
import {
  primaryDownloads,
  summaryFromSnapshot,
  type DownloadSummary,
} from "./downloads";
import { realPlugins } from "./plugins-real";
import { installVersionOf, type InstallKind } from "./install";
import type { PluginWithGrowth } from "./types";

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

export type { InstallKind };

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
  /**
   * 页面上标在安装命令旁边的版本号——**这条命令实际会装到的那个版本**。
   *
   * npm 装法用 npm 上的 dist-tags.latest，其余装法用仓库 package.json 的版本。
   * 两者经常不同：作者提交了 0.30.3 但还没发布，npm 上最新仍是 0.30.2。
   * 标 pkgVersion 就等于告诉用户「你装到的是 0.30.3」，而他执行完拿到的是 0.30.2。
   */
  installVersion: string | null;
  /**
   * 累计下载量摘要（渠道 + 总数 + npm 渠道的拆分）。
   *
   * 读库成功时由三渠道原值推出，静态兜底时来自构建期快照（只有总数、没有拆分）。
   * null = 没有可报的数字，展示层据此整块不显示，而不是显示 0。
   */
  downloadSummary: DownloadSummary | null;
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
          sql: PLUGIN_DETAIL_SQL,
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
          sql: GROWTH_SNAPSHOTS_SQL,
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
        installVersion: installVersionOf(
          r.install_kind == null ? null : String(r.install_kind),
          r.npm_latest_version == null ? null : String(r.npm_latest_version),
          r.pkg_version == null ? null : String(r.pkg_version),
        ),
        downloadSummary: primaryDownloads({
          manual: r.dl_manual_total == null ? null : Number(r.dl_manual_total),
          manualNote: r.dl_manual_note == null ? null : String(r.dl_manual_note),
          pkg: r.dl_pkg == null ? null : String(r.dl_pkg),
          npm: r.dl_npm_total == null ? null : Number(r.dl_npm_total),
          mirror: r.dl_mirror_total == null ? null : Number(r.dl_mirror_total),
          release: r.dl_release_total == null ? null : Number(r.dl_release_total),
          status: r.dl_status == null ? null : String(r.dl_status),
        }),
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
        // 读不到库时用构建期快照里的安装方式。构建环境没有 Turso 凭据，头部 24 个
        // 预渲染页走的正是这条路——没有它，全站最热门的插件详情页反而只会写着
        // 「请查看仓库 README」。快照里也没有（install_kind 从未探测）才是真的不知道，
        // 那时页面指向 README，而不是编一条命令出来。
        installKind: p.install?.kind ?? null,
        installCmdAuto: p.install?.cmd ?? null,
        pkgName: p.install?.pkgName ?? null,
        pkgVersion: p.install?.pkgVersion ?? null,
        installVersion: installVersionOf(
          p.install?.kind ?? null,
          p.install?.npmVersion ?? null,
          p.install?.pkgVersion ?? null,
        ),
        // 读不到库时用构建期快照里的下载量：构建环境没有 Turso 凭据，
        // 头部 24 个预渲染页走的正是这条路，没有它们永远显示不出数字
        downloadSummary: summaryFromSnapshot(p.downloads),
        i18n: {},
        scoreDetail: null,
      };
    }
  },
);

