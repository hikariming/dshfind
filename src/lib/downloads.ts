/**
 * 下载量的展示口径：库里存的是三个渠道的累计原值（见 scripts/probe-downloads.mjs），
 * 这里决定「一个插件对外只报哪一个数」以及「炫耀档位怎么切」。
 *
 * 两条不能违反的规矩：
 *
 * 1. npm 系与 Release 系不合并。npm 的一次下载是「装了一个包」，Release 的一次下载是
 *    「下了个安装包」，量级差一个数量级——实测 PicGo 的 171 万全来自 Release 资产，
 *    合并会让桌面应用碾压所有真插件。所以主口径二选一，另一个不参与。
 * 2. 只报档位，不报精确值。数字是每轮探测的快照（默认 7 天一探），而徽章会长期挂在
 *    别人的 README 里；「20k+」这种档位随时间只会更保守，不会变成假话，精确值会。
 */

/** plugins 表 dl_* 五列的对外形态。全 null = 没探过或三个渠道都没有。 */
export interface DownloadStats {
  /** 归属校验通过的 npm 包名；null 表示 npm 数据不可采信（包名被别人占等）。 */
  pkg: string | null;
  /** npm 官方 registry 生命周期累计。 */
  npm: number | null;
  /** npmmirror（淘宝镜像）累计；国内用户走镜像，npm 统计不到，实测占 npm 的 43%。 */
  mirror: number | null;
  /** 该仓库全部 Release 资产的 download_count 合计。 */
  release: number | null;
  /** npm / npm+release / release / name-taken / unpublished / none，见采集脚本。 */
  status: string | null;
}

export const EMPTY_DOWNLOADS: DownloadStats = {
  pkg: null,
  npm: null,
  mirror: null,
  release: null,
  status: null,
};

export type DownloadChannel = "npm" | "release";

export interface DownloadSummary {
  channel: DownloadChannel;
  /** 该渠道的累计总数：npm 渠道 = npm + 镜像。 */
  total: number;
  /**
   * npm 渠道的拆分，供详情页展示「npm x + 镜像 y」。
   * release 渠道没有拆分；构建期静态快照（realPlugins）也没有——它只带总数，
   * 于是兜底渲染时只报总数、不报拆分，而不是编一个「镜像 0」出来。
   */
  breakdown: { npm: number; mirror: number } | null;
}

/** 构建期快照里的下载量形态：只有渠道与总数，没有拆分。 */
export interface DownloadSnapshot {
  channel: DownloadChannel;
  total: number;
}

/** 把快照形态提升成统一的摘要，供兜底路径使用。 */
export function summaryFromSnapshot(
  snapshot: DownloadSnapshot | null | undefined,
): DownloadSummary | null {
  return snapshot ? { channel: snapshot.channel, total: snapshot.total, breakdown: null } : null;
}

/**
 * 主口径：有可采信的 npm 包就用 npm+镜像，否则退到 Release 资产。
 * 两者都没有（纯 skills 仓、索引站、包名被占）返回 null——页面据此不展示，
 * 而不是显示一个 0。
 */
export function primaryDownloads(stats: DownloadStats | null | undefined): DownloadSummary | null {
  if (!stats) return null;
  const npm = stats.pkg && stats.npm != null ? stats.npm : null;
  if (npm != null) {
    const mirror = stats.mirror ?? 0;
    return { channel: "npm", total: npm + mirror, breakdown: { npm, mirror } };
  }
  if (stats.release != null && stats.release > 0) {
    return { channel: "release", total: stats.release, breakdown: null };
  }
  return null;
}

/**
 * 炫耀档位。1-2-5 步进，所以 10k 之后是 20k、50k，与运营口头说的「10k 20k 200k」一致。
 * 低于 100 次不给档位：那个量级谈不上炫耀，挂出来反而减分。
 */
const TIERS = [
  2_000_000, 1_000_000, 500_000, 200_000, 100_000, 50_000, 20_000, 10_000,
  5_000, 2_000, 1_000, 500, 200, 100,
] as const;

/** 档位配色：越高越暖，一眼能看出量级。 */
function tierColor(threshold: number): string {
  if (threshold >= 1_000_000) return "#e11d48"; // 百万级
  if (threshold >= 200_000) return "#f59e0b";
  if (threshold >= 50_000) return "#4d6bfe"; // 品牌色
  if (threshold >= 10_000) return "#10b981";
  if (threshold >= 1_000) return "#0ea5e9";
  return "#71717a";
}

/** 100000 -> "100k"；1000000 -> "1M"。档位阈值都是整齐数字，不会出现小数。 */
function tierNumber(threshold: number): string {
  if (threshold >= 1_000_000) return `${threshold / 1_000_000}M`;
  if (threshold >= 1_000) return `${threshold / 1_000}k`;
  return String(threshold);
}

export interface DownloadTier {
  threshold: number;
  /** "20k+"、"1M+"。 */
  label: string;
  color: string;
}

/** 落在哪个档；不足最低档返回 null。 */
export function downloadTier(total: number): DownloadTier | null {
  if (!Number.isFinite(total)) return null;
  for (const threshold of TIERS) {
    if (total >= threshold) {
      return { threshold, label: `${tierNumber(threshold)}+`, color: tierColor(threshold) };
    }
  }
  return null;
}

/** 详情页用的精确值展示（千分位）。徽章不用它——徽章只报档位。 */
export function formatDownloads(total: number): string {
  return total.toLocaleString("en-US");
}
