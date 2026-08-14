/**
 * 插件分类枚举（展示顺序）。
 * 与 scripts/lib/categories.mjs 的 CATEGORIES 保持一致——slug 存在 Turso，
 * 分类规则在脚本侧，前端只消费 slug；文案走 i18n 的 Plugins.categories.<slug>。
 */
export const PLUGIN_CATEGORIES = [
  "skin",
  "ui",
  "agent",
  "memory",
  "client",
  "channel",
  "tools",
  "fun",
  "resource",
] as const;

export type PluginCategory = (typeof PLUGIN_CATEGORIES)[number];
