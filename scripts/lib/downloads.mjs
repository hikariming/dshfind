/**
 * 累计下载量的取数规则：把「一个仓库到底被下载了多少次」拆成可验证的几步。
 *
 * 只要累计值，不做周/日口径——累计值单调、一次请求就能拿全，不需要日快照差分，
 * 一周跑一次就够。代价是对新插件不利（发得早的天然高），做徽章无所谓，
 * 若将来要做「下载量榜」排序需要另补近 30 天口径。
 *
 * 三个渠道刻意分开存、不合并成一个数：npm 的一次下载是「装了一个包」，
 * GitHub Release 的一次下载是「下了一个安装包/压缩包」，量级与含义都不同。
 * 实测 star≥500 名单里 PicGo 的 171 万、open-design 的 79 万全来自 Release 资产，
 * 混加会让桌面应用碾压所有真插件。合并展示的口径留给徽章那层自己定。
 */

/**
 * point 接口单次查询的区间上限，按 host 分别取——**两家不一样**：
 * npm 官方 18 个月；npmmirror 只有 12 个月，超了直接 422
 * （`range(...) beyond the processable range, max up to "..."`）。
 * 早期按 18 个月一刀切，导致所有存在超过一年的包在镜像侧整段失败、累计判成「没测到」。
 */
export const MAX_POINT_MONTHS = 18;
export const MIRROR_MAX_POINT_MONTHS = 12;

/** 各 host 的窗口长度；未知 host 用最保守的 12 个月。 */
export function maxPointMonths(host) {
  if (host === "api.npmjs.org") return MAX_POINT_MONTHS;
  return MIRROR_MAX_POINT_MONTHS;
}

/** npm 的下载统计从 2015 起才有；包元数据缺 time.created 时用它兜底。 */
export const NPM_STATS_EPOCH = "2015-01-10";

function toUtcDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  if (typeof value !== "string") return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ISO 日期串（UTC）。 */
export function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

function addDays(date, days) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

/**
 * 把 [since, today] 切成若干个不超过 18 个月的查询窗口。
 *
 * 相邻窗口首尾相接不重叠（上一窗结束的次日是下一窗开始），所以各窗结果直接相加
 * 就是生命周期累计，不会重复计数。since 晚于 today（包元数据脏）时返回空数组，
 * 调用方据此判定「没测到」而不是「下载量为 0」。
 */
export function downloadWindows(since, today, maxMonths = MAX_POINT_MONTHS) {
  const start = toUtcDate(since);
  const end = toUtcDate(today);
  if (!start || !end || start > end) return [];

  const windows = [];
  let cursor = start;
  while (cursor <= end) {
    const limit = addDays(addMonths(cursor, maxMonths), -1);
    const winEnd = limit < end ? limit : end;
    windows.push({ start: isoDay(cursor), end: isoDay(winEnd) });
    cursor = addDays(winEnd, 1);
  }
  return windows;
}

/**
 * scoped 包名要整体转义（`@a/b` → `%40a%2Fb`），否则斜杠会被当成路径分隔。
 * npm 与 npmmirror 两边都吃转义后的形式，所以两个 host 共用一套编码。
 */
export function encodePackage(pkg) {
  return encodeURIComponent(pkg);
}

/** 某个窗口的查询地址；host 传 api.npmjs.org 或 registry.npmmirror.com。 */
export function downloadsPointUrl(host, pkg, window) {
  return `https://${host}/downloads/point/${window.start}:${window.end}/${encodePackage(pkg)}`;
}

/**
 * Release 资产下载数合计。
 *
 * 只认非负有限整数，脏字段跳过而不是让整仓失败——GitHub 偶尔会给出
 * assets 为 null 的草稿 release。注意这是**累计值**：GitHub 不提供时间序列，
 * 想要增量只能自己按日快照差分，本脚本刻意不做。
 */
export function sumAssetDownloads(releases) {
  if (!Array.isArray(releases)) return 0;
  let total = 0;
  for (const release of releases) {
    const assets = release && Array.isArray(release.assets) ? release.assets : [];
    for (const asset of assets) {
      const count = asset?.download_count;
      if (typeof count === "number" && Number.isFinite(count) && count >= 0) {
        total += Math.floor(count);
      }
    }
  }
  return total;
}

/**
 * 这一行数据「是哪来的」，存进 plugins.dl_status 供前台按渠道决定文案。
 *
 * 先看拿到了什么数据，再看没拿到的原因：包名被别人占（name-taken）的仓库
 * 仍可能有 Release 资产可数，此时状态是 release，占名的事实记在 dl_note 里。
 */
export function downloadStatus({ npmTotal, releaseTotal, nameTaken, unpublished }) {
  const hasNpm = typeof npmTotal === "number";
  const hasRelease = typeof releaseTotal === "number" && releaseTotal > 0;
  if (hasNpm && hasRelease) return "npm+release";
  if (hasNpm) return "npm";
  if (hasRelease) return "release";
  if (nameTaken) return "name-taken";
  if (unpublished) return "unpublished";
  return "none";
}
