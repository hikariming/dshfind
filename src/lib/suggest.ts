/**
 * 搜索建议的共享契约：客户端搜索框与 /api/suggest 各取所需。
 *
 * 这个文件会被 client component 引用——务必保持零数据依赖。
 * 一旦在这里 import plugins-real，1203 条插件（约 580KB）会立刻回到客户端 bundle。
 */

export interface Suggestion {
  type: "plugin";
  id: string;
  label: string;
  sub: string;
  /** 站内详情页路径（不含 locale 前缀，由 next-intl 的 router 补齐）。 */
  href: string;
  stars: number;
  /** 优质项目（运营标记），下拉里挂一枚徽章。 */
  featured: boolean;
}

/** 少于这个长度不检索：单个字母（含输入法敲下的第一个拼音字母）会命中几乎全表。 */
export const MIN_QUERY_LENGTH = 2;

/** 下拉最多展示的条数。 */
export const MAX_SUGGESTIONS = 10;

/** 超过这个长度的查询直接截断，挡住超长 query 刷接口。 */
export const MAX_QUERY_LENGTH = 64;
