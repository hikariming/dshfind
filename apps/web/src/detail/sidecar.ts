/**
 * 插件详情页的「构建期旁车数据」：相关插件、相关文档、站内有 hub 的标签。
 *
 * 这几块的算法依赖全量插件快照（plugins-real.ts，11.7MB）——老站把整份快照编进 Worker，
 * 冷启动慢、产物 5.6MB。新站改为构建期算好，按名字哈希分成 SHARDS 片静态 JSON（每片约 100KB），
 * 详情页运行时只读自己那一片，快照不进任何运行时代码。
 */

export const SHARDS = 64;

/** 构建端写、运行端读的单插件条目。键是小写 fullName（详情路由大小写不敏感）。 */
export interface SidecarEntry {
  /** 相关插件 fullName（已排好序，≤ RELATED_LIMIT）；展示字段运行时从 D1 取 */
  r: string[];
  /** 相关文档 [section, slug] */
  d: [string, string][];
  /** 站内有 hub 页的标签 slug */
  t: string[];
  /** 运营在 plugin-i18n 编辑稿里核对过的安装命令（优先级仅次于库里的 install_cmd） */
  c?: string;
}

export type SidecarShard = Record<string, SidecarEntry>;

/** FNV-1a 32 位：构建与运行两端必须算出同一片 */
export function shardOf(fullName: string): number {
  let h = 0x811c9dc5;
  const s = fullName.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % SHARDS;
}

export const shardPath = (n: number) => `/sidecar/detail/${String(n).padStart(2, "0")}.json`;
