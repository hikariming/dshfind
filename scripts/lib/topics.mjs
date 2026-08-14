/** 抓取插件清单的 GitHub topic。 */
export const TOPIC = "dsh-plugin";

/** 每个仓库都带的生态标记，对区分插件没有信息量，不进标签。 */
export const MARKER_TOPICS = new Set([
  TOPIC,
  "dsh",
  "dshx",
  "deepseek",
  "deepseek-harness",
  "deepseekharness",
  "deepseek-harness-plugin",
  "deepseek-harness-plugins",
  "dsh-plugins",
  "dshtopic",
]);

/** 仓库 topic 去掉生态标记后剩下的，最多 8 个。 */
export function pluginTags(topics) {
  return (topics ?? []).filter((t) => !MARKER_TOPICS.has(t)).slice(0, 8);
}
