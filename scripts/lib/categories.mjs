/**
 * 插件分类：固定枚举 + 关键词自动分类器。
 *
 * 分类是运营视角的「用途」维度，不是技术栈——slug 存 Turso plugins.category，
 * 前端文案走 i18n（messages/*.json 的 Plugins.categories.<slug>）。
 * 自动分类只是打底：每日同步对 category_manual=0 的行重算，手动标注永远优先。
 */

/** 展示顺序即数组顺序；'' 表示未分类（不在此列表里）。 */
export const CATEGORIES = [
  "skin", // 皮肤主题
  "ui", // 面板增强（面板/侧栏/输入框/导航等界面功能件；纯外观美化归 skin）
  "agent", // Agent 增强（视觉/浏览器/搜索/编排）
  "memory", // 记忆与上下文
  "client", // 客户端（桌面壳/TUI/启动器/移动端）
  "channel", // 通道与通知（IM 桥接/桌面通知）
  "tools", // 工具与集成（MCP/数据/诊断/插件开发）
  "fun", // 趣味互动（游戏/桌宠/整活）
  "resource", // 资源导航（awesome 列表/教程/目录）
];

/**
 * 规则表：分两遍匹配——先看 tag（整个 topic 精确相等，信号强），
 * 全部规则的 tag 都没命中才看文本（英文词边界正则、中文子串）。
 * 两遍内都按数组顺序先命中先得，所以 agent 必须排在 ui 前（视觉类描述常含「UI 还原」）。
 */
const RULES = [
  {
    category: "resource",
    text: [
      "awesome",
      "curated",
      "精选",
      "手册",
      "教程",
      "leaderboard",
      "handbook",
      "tutorial",
      "插件市场",
      "marketplace",
      "插件生态",
      "插件聚合",
      "插件目录",
    ],
    tags: ["awesome", "awesome-list", "curated-list", "guide", "plugin-directory", "plugin-marketplace"],
  },
  {
    category: "skin",
    // 英文 background 不能进正文关键词——「background task」会误伤；视觉背景类靠 wallpaper/主题词或手动标
    text: ["skin", "皮肤", "主题", "壁纸", "换肤", "配色", "theme", "themes", "wallpaper", "背景", "美化", "外观", "appearance"],
    tags: ["skin", "theme", "themes", "ui-theme", "ui-themes", "dsh-skin", "dark-mode", "css", "wallpaper", "background"],
  },
  {
    category: "memory",
    text: ["memory", "记忆", "mnemon", "compaction", "长期记忆", "knowledge base", "知识库", "上下文管理", "context management"],
    tags: ["memory", "agent-memory", "llm-memory", "external-memory", "knowledge-base", "knowledge-graph", "context-management", "context-compression", "compaction"],
  },
  {
    category: "fun",
    text: [
      "game",
      "游戏",
      "桌宠",
      "宠物",
      "desktop pet",
      "五子棋",
      "gomoku",
      "整活",
      "trolling",
      "广告",
      "表情",
      "sticker",
      "合影",
    ],
    tags: ["pet", "game", "games", "minigames", "trolling"],
  },
  {
    category: "channel",
    text: [
      "telegram",
      "微信",
      "wechat",
      "wecom",
      "企业微信",
      "飞书",
      "feishu",
      "lark",
      "qq bot",
      "qqbot",
      "dingtalk",
      "钉钉",
      "slack",
      "discord",
      "通知",
      "notification",
      "notify",
      "im gateway",
    ],
    tags: ["qqbot", "chatbot", "bot", "feishu", "lark", "wechat", "wecom", "wework", "telegram", "messaging", "notifications", "notify"],
  },
  {
    category: "client",
    text: [
      "desktop",
      "桌面",
      "tui",
      "terminal ui",
      "终端 ui",
      "launcher",
      "启动器",
      "electron",
      "webview2",
      "wails",
      "mobile client",
      "移动端",
      "docker",
      "kubernetes",
    ],
    tags: ["tui", "terminal", "desktop", "desktop-app", "desktop-application", "launcher", "electron", "windows", "macos", "docker-image"],
  },
  {
    category: "agent",
    text: [
      "vision",
      "视觉",
      "识图",
      "看图",
      "多模态",
      "multimodal",
      "vlm",
      "ocr",
      "browser",
      "浏览器",
      "search",
      "搜索",
      "multi-agent",
      "多 agent",
      "subagent",
      "子代理",
      "orchestr",
      "编排",
      "workflow",
      "工作流",
      "computer use",
      "computer-use",
      "电脑控制",
      "deep research",
      "deep-research",
      "agentteams",
      "agent teams",
      "自动化",
      "automation",
      "调度",
    ],
    tags: [
      "vision",
      "computer-vision",
      "multimodal",
      "ocr",
      "vlm",
      "browser",
      "browser-automation",
      "agent-browser",
      "web-search",
      "multi-agent",
      "subagent",
      "agent-orchestration",
      "workflow",
      "agentic-workflow",
      "computer-use",
      "gui-automation",
      "automation",
      "agent-collaboration",
      "agent-communication",
    ],
  },
  {
    category: "ui",
    text: [
      "ui",
      "sidebar",
      "侧边栏",
      "侧栏",
      "输入",
      "批注",
      "会话视图",
      "对话分享",
      "进度条",
      "状态行",
      "状态栏",
      "导航条",
      "消息编辑",
      "撤回",
      "折叠",
      "web ui",
      "webui",
      "web gui",
      "界面",
    ],
    tags: ["ui", "sidebar", "sidebar-widget", "status-line", "navigation", "web-plugin", "genui"],
  },
  {
    category: "tools",
    text: [
      "mcp",
      "工具",
      "tool",
      "toolkit",
      "诊断",
      "diagnostic",
      "健康检查",
      "审计",
      "audit",
      "安全",
      "security",
      "git",
      "sql",
      "数据库",
      "database",
      "文献",
      "zotero",
      "pdf",
      "成本",
      "cost",
      "额度",
      "quota",
      "token",
      "脚手架",
      "scaffold",
      "模板",
      "template",
      "插件开发",
      "plugin dev",
      "运维",
      "回退",
      "rewind",
    ],
    tags: ["mcp", "model-context-protocol", "toolkit", "diagnostics", "security", "audit", "cost-tracking", "cost-tracker", "developer-tools", "data-analysis", "plugin-health", "linting"],
  },
];

const WORD_RE = new Map();
/** 英文关键词按词边界匹配（避免 search 命中 research）；含中文/连字符的直接子串匹配。 */
function textHit(haystack, keyword) {
  if (/^[a-z0-9 ]+$/.test(keyword)) {
    let re = WORD_RE.get(keyword);
    if (!re) {
      re = new RegExp(`\\b${keyword.replace(/ /g, "\\s+")}\\b`);
      WORD_RE.set(keyword, re);
    }
    return re.test(haystack);
  }
  return haystack.includes(keyword);
}

/**
 * 自动分类：命不中任何规则返回 ''（未分类）。
 * @param {{name: string, description: string, tags: string[]}} plugin
 */
export function classifyPlugin({ name, description, tags }) {
  const text = `${name} ${description}`.toLowerCase();
  const tagSet = new Set((tags ?? []).map((t) => t.toLowerCase()));
  for (const rule of RULES) {
    if (rule.tags?.some((t) => tagSet.has(t))) return rule.category;
  }
  for (const rule of RULES) {
    if (rule.text?.some((k) => textHit(text, k))) return rule.category;
  }
  return "";
}
