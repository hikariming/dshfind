import type { InstallKind } from "./install";
import type { DownloadSummary } from "./downloads";
import type { PluginWithGrowth } from "./types";

/**
 * 插件详情页的数据形状。读库实现在新站 apps/web/src/detail/data.ts
 * （同一套 SQL：scripts/lib/plugin-queries.mjs）。
 */

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
