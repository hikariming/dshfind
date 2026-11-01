/**
 * 详情页 README：由 scripts/fetch-readmes.mjs 在同步时抓取、渲染并净化，存在
 * D1 plugin_readmes 表，由新站 apps/web/src/detail/data.ts 读取。页面只读、
 * 不渲染 Markdown——详情页的 CPU 预算见 docs/native-page-cache.md。
 */
export interface PluginReadme {
  /** ok：html 可直接展示；too_large：只给 GitHub 链接。 */
  status: "ok" | "too_large";
  /** 已净化的 HTML（脚本、事件属性、javascript: 链接在入库前剥掉）。 */
  html: string | null;
  truncated: boolean;
  /** README 在仓库内的路径，拼「在 GitHub 查看」的链接用。 */
  path: string | null;
  fetchedAt: string;
}
