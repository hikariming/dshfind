/**
 * 仓库改名映射：旧 full_name → 新 full_name。
 *
 * GitHub 改名后旧 URL 会 404——同步管道以 full_name 为主键，认不出改名，
 * 旧名被当成「消失」软删（详见 scripts/rename-plugin.mjs）。数据那半边由迁移脚本
 * 搬走，剩下的半边是外部世界还攥着的旧链接：搜索引擎的索引、插件作者 README 里的
 * 徽标、我们四语 README 的友链。这张表就是给它们的 301。
 *
 * 为什么放在代码里而不是建一张表：
 *   1. 改名是极低频、需要人工核对的事（至今 22 条），一条 diff 就能 review；
 *   2. 重定向在 DB 抖动时也必须能工作，读库反而多一个失败点；
 *   3. 双写期（Turso + D1）新建表要两边同步，为 22 行数据不值当。
 *
 * 由 scripts/rename-plugin.mjs 迁移成功后自动追加，也可以手工加——
 * 唯一的要求是「旧名确实曾经是新名这个仓库」，脚本会打 GitHub 校验确认。
 */

/**
 * 旧名 → 新名。键按 GitHub 上的原始大小写写入，查表时不区分大小写。
 * 链式改名（A → B → C）在写入时就被拍平成 A → C，读取永远只需一跳。
 */
const renames: Record<string, string> = {
  "anywhere-labs/deepseek-harness-desktop": "anywhere-labs/dsh-desktop",
  "ayuanwong/deepseek-harness-ux": "ayuanwong/dsh-ux",
  "cyijun/surfing-plugin": "cyijun/dsh-surfing-plugin",
  "Fisfzy/ego-browser": "Fisfzy/dsh-ego-browser",
  "Fishquito7/dsh-skill-viewer": "Fishquito7/dsh-skill-mcp-panel",
  "forrestchang/dsh-multica-runtime": "multica-ai/dsh-multica-runtime",
  "Francis-Xavier-code/dsh-balance-plugin": "yxxbc/dsh-balance-plugin",
  "hairyf/deepseek-harness-desktop": "dsh-tauri-desk/deepseek-harness-desktop",
  "icetomoyo/dsh_workflow": "omdsh-dev/dsh_workflow",
  "KitDoesIt/dsh-compaction-instant": "TsFreddie/dsh-compaction-instant",
  "Komeiji-Shiki/graycode-for-dsh": "GrayCodeTeam/graycode-for-dsh",
  "lire1131/dsh-undo-plugin": "lire1131/dsh-undo-savepoint",
  "omdsh-dev/dsh-at-file": "FSMargoo/dsh-at-file",
  "omdsh-dev/fabric": "omdsh-dev/stent",
  "openma-ai/deepseek-harness-tui": "openma-ai/Martty",
  "Tabbit-Browser/dsh-plugin": "Tabbit-Browser/dsh-tabbit",
  "titanwings/colleague-skill": "titanwings/distilly",
  "vibeinging/deepseek-harness-desktop-app": "vibeinging/dsh-desktop",
  "worldwonderer/oh-story-dsh": "zenstory-ai/oh-story-dsh",
  "yanglongyun/dsh-ramify": "yanglongyun/ramify-dsh",
  "zhu1090093659/dsh-web-ui": "zhu1090093659/dsh-web",
};

/** 小写索引：URL 里的 owner/repo 大小写不保证与 GitHub 一致。 */
const byLower = new Map(
  Object.entries(renames).map(([from, to]) => [from.toLowerCase(), to]),
);

/**
 * 查这个 full_name 是不是改过名；是则返回新名，否则 undefined。
 * 只在详情页/徽标查不到插件时才调用——正常路径一次也不会走这里。
 */
export function renamedTo(fullName: string): string | undefined {
  return byLower.get(fullName.toLowerCase());
}

/** 映射条数，给测试和运维核对用。 */
export const renameCount = Object.keys(renames).length;
