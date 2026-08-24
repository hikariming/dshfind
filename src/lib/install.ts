/**
 * 安装方式的展示契约。
 *
 * 事实源是 Turso 的 plugins.install_* 五列（scripts/probe-install.mjs 探测、
 * scripts/lib/install.mjs 推导）。这里只放「页面与构建期快照共用」的形状，
 * 推导规则一概不重复实现——两边算出不同的命令比没有命令更糟。
 */

/**
 * 安装方式结论：
 * release 有唯一的版本匹配 tarball / npm 已发布用包名装 / git 未发布但源码能跑 /
 * build-required 需自行构建 / not-installable 压根不是插件包。
 */
export type InstallKind =
  | "release"
  | "npm"
  | "git"
  | "build-required"
  | "not-installable";

/**
 * 构建期快照里的安装方式。
 *
 * 为什么要有它：详情页首选实时读 Turso，但 generateStaticParams 预渲染的头部
 * 24 个页面跑在**没有 Turso 凭据的构建环境**里，只能走 realPlugins 兜底。
 * 不进快照的字段在那 24 个页面上永远是空的——也就是全站最热门的那批插件，
 * 详情页反而只写着「请查看仓库 README」，而它们的 README 里写的正是这条命令。
 *
 * 只带有话可说的行：not-installable 且没有包名的仓库整个字段省略，
 * 不写 null 进另外几千行去撑大生成物。
 */
export interface InstallSnapshot {
  kind: InstallKind;
  /** 推导出的命令；not-installable 时没有。build-required 是多行。 */
  cmd?: string;
  /** package.json 里的包名；用于区分「没有 manifest」和「有包但不是组合包」。 */
  pkgName?: string;
  /** package.json 里的精确版本号。 */
  pkgVersion?: string;
  /** npm 上的 dist-tags.latest；npm 装法下这才是命令实际会装到的版本。 */
  npmVersion?: string;
}

/**
 * 标在安装命令旁边的版本号：这条命令实际会装到的那个。
 *
 * npm 装法看 npm 的 dist-tags.latest，其余装法看仓库 package.json。
 * 两者经常差一截——作者提交了 0.30.3 却还没发布，npm 上最新仍是 0.30.2。
 * 这个差值同样是发给 DSH 桌面端市场的 revision（server/internal/httpapi/market.go），
 * 桌面端照着它装，所以口径必须是 npm 侧的事实，而不是仓库里的意向。
 */
export function installVersionOf(
  kind: string | null,
  npmVersion: string | null,
  pkgVersion: string | null,
): string | null {
  if (kind === "npm") return npmVersion ?? pkgVersion;
  return pkgVersion;
}
