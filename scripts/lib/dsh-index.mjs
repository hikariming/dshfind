/**
 * DSH「自定义插件索引源」format 1 的生成器（dsh-v0.2.1-alpha.4 起）。
 *
 * 用户在 DSH 插件页 → Discover → 添加索引源，填 https://api.dshfind.com/market/dsh-index.json，
 * 就能在 DSH 里直接浏览、安装 dshfind 收录的插件。
 *
 * 格式口径：deepseek-harness packages/util/plugin-market-index/src/index.ts（parseMarketIndex）。
 * ⚠️ 读端遇到**任何一条**违规就整份拒收，所以这里对每个字段先按读端规则自检，
 * 过不了的字段省略、过不了的条目整条跳过——宁可少收一个插件，也不能让全部用户的源挂掉。
 *
 * 收录口径对齐上游参考生成器（apps/plugin-market-generator）：声明了 dsh.bundle 的
 * npm 包就收，**不做运行时版本门控**——兼容性由 DSH 安装时自己判（engines.dsh，
 * 没有就看 @deepseek-ai/dsh-* 的 peer 范围）。所以这里不能用 npm_desktop_installable：
 * 那是老的独立桌面端市场的复核结论，钉死在它的运行时常量上（DSH 0.1.1-rc.2），
 * 跟进 0.2.x 的头部插件（dsh-context、DSH-better-sidebar……）会全部被它挡掉。
 *
 * 具体条件：is_plugin=1、非风险、has_bundle=1、npm 已发布且最新版是精确 semver、
 * npm_repo_backlink=1（npm 包的 repository 指回本仓库——防止把别人的包挂到这个
 * 仓库名下）。@deepseek-ai/* 是 DSH 自带的包，从市场重装会和内置那份冲突，不收。
 * 只发 npm 源——git 源要求 40 位 commit SHA，我们不入库这个。
 *
 * publishTimestamp：库里没有逐版本的 npm 发布时间，取仓库 pushed_at 近似
 * （发版通常伴随推送），缺失时退回 install_probed_at，再退回生成时刻。
 */

export const DSH_INDEX_URL = "https://api.dshfind.com/market/dsh-index.json";
const SITE_URL = "https://dshfind.com";

// 与读端逐字一致的几条正则。
const LANGUAGE_ID = /^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/u;
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/u;
const PACKAGE_NAME_MAX_LENGTH = 214;
const NUMERIC = "(?:0|[1-9]\\d*)";
const PRERELEASE_PART = `(?:${NUMERIC}|\\d*[a-zA-Z-][0-9a-zA-Z-]*)`;
const SEMVER = new RegExp(
  `^${NUMERIC}\\.${NUMERIC}\\.${NUMERIC}(?:-${PRERELEASE_PART}(?:\\.${PRERELEASE_PART})*)?(?:\\+[0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*)?$`,
  "u",
);
const PATH_SEGMENT = /^[A-Za-z0-9._@+-]+$/u;
const MAX_PUBLISH_TIMESTAMP = 1e11;
/** 描述截断长度：读端不设上限，但两千多条长描述会把索引撑大，卡片也只显示两三行。 */
const DESCRIPTION_MAX = 400;

/** 分类 id 与 src/lib/categories.ts 同一套；标题取 messages/*.json 的 Plugins.categories。 */
const CATEGORIES = {
  skin: { en: "Skins & Themes", zh: "皮肤主题", ja: "スキン・テーマ", ko: "스킨·테마" },
  ui: { en: "Panels & Views", zh: "面板增强", ja: "パネル・ビュー", ko: "패널·뷰" },
  agent: { en: "Agent Boosters", zh: "Agent 增强", ja: "Agent 強化", ko: "Agent 강화" },
  memory: { en: "Memory & Context", zh: "记忆上下文", ja: "メモリ・コンテキスト", ko: "메모리·컨텍스트" },
  client: { en: "Clients", zh: "客户端", ja: "クライアント", ko: "클라이언트" },
  channel: { en: "Channels & Notify", zh: "通道通知", ja: "チャネル・通知", ko: "채널·알림" },
  tools: { en: "Tools & Integrations", zh: "工具集成", ja: "ツール連携", ko: "도구·연동" },
  fun: { en: "Fun", zh: "趣味互动", ja: "おもしろ", ko: "재미" },
  resource: { en: "Resources", zh: "资源导航", ja: "リソース", ko: "리소스" },
};

const INDEX_META = {
  format: 1,
  title: { en: "dshfind · DSH Plugin Directory", zh: "dshfind · DSH 插件目录", ja: "dshfind · DSH プラグインディレクトリ", ko: "dshfind · DSH 플러그인 디렉터리" },
  description: {
    en: "Community plugins indexed and scored daily by dshfind.com — npm packages whose repository links back to their GitHub project.",
    zh: "dshfind.com 每日收录与评分的社区插件——只收已发布到 npm、且与 GitHub 仓库互相对应的包。",
    ja: "dshfind.com が毎日収集・評価するコミュニティプラグイン。npm で公開され、GitHub リポジトリと対応が確認できたパッケージのみ。",
    ko: "dshfind.com이 매일 수집·평가하는 커뮤니티 플러그인 — npm에 게시되고 GitHub 저장소와 연결이 확인된 패키지만 수록.",
  },
  metadata: {
    categories: Object.fromEntries(Object.entries(CATEGORIES).map(([id, title]) => [id, { title }])),
    labels: {
      featured: { title: { en: "Editor's pick", zh: "编辑推荐", ja: "編集部おすすめ", ko: "에디터 추천" } },
    },
    sortKeys: {
      stars: { title: { en: "GitHub stars", zh: "GitHub Star", ja: "GitHub スター", ko: "GitHub 스타" }, order: "desc" },
      score: { title: { en: "dshfind score", zh: "dshfind 评分", ja: "dshfind スコア", ko: "dshfind 점수" }, order: "desc" },
    },
  },
};

const toBool = (v) => Number(v) !== 0;
const nonBlank = (s) => typeof s === "string" && /\S/u.test(s);

/** 剔除控制字符与 bidi 控制符，折叠空白；结果可能为空串。 */
function plainText(s) {
  return String(s ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function truncate(s, max) {
  const chars = [...s];
  return chars.length <= max ? s : chars.slice(0, max - 1).join("") + "…";
}

/** 读端 httpUrl 口径：http(s)、无凭据、无 query/fragment。 */
function cleanRepoUrl(raw) {
  if (typeof raw !== "string") return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username !== "" || url.password !== "") return null;
  if (url.href.includes("?") || url.href.includes("#")) return null;
  return url.href;
}

function cleanDirectory(raw) {
  if (typeof raw !== "string" || raw === "") return null;
  const segments = raw.split("/");
  return segments.every((s) => s !== "." && s !== ".." && PATH_SEGMENT.test(s)) ? raw : null;
}

function unixSeconds(...candidates) {
  for (const raw of candidates) {
    if (!raw) continue;
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) {
      const s = Math.floor(t / 1000);
      if (s >= 0 && s < MAX_PUBLISH_TIMESTAMP) return s;
    }
  }
  return null;
}

/** 一行 D1 plugins → 索引条目；不满足收录口径或读端规则时返回 null。 */
export function buildIndexPlugin(r, fallbackSeconds) {
  if (!toBool(r.is_plugin) || toBool(r.is_risky) || !toBool(r.has_bundle)) return null;
  if (!toBool(r.npm_published) || !toBool(r.npm_repo_backlink)) return null;
  const name = r.pkg_name == null ? "" : String(r.pkg_name);
  if (name.startsWith("@deepseek-ai/")) return null;
  if (name.length > PACKAGE_NAME_MAX_LENGTH || !PACKAGE_NAME.test(name)) return null;
  const version = r.npm_latest_version ?? r.npm_index_prerelease ?? "";
  if (!SEMVER.test(version)) return null;

  const plugin = { name };
  const title = plainText(r.name);
  if (nonBlank(title)) plugin.title = title;
  const description = truncate(plainText(r.description), DESCRIPTION_MAX);
  if (nonBlank(description)) plugin.description = description;
  const owner = plainText(r.owner);
  if (/^[A-Za-z0-9-]+$/u.test(owner)) {
    plugin.icon = `https://avatars.githubusercontent.com/${owner}?s=96`;
    plugin.author = owner;
  }
  // 插件页链回 dshfind 详情页：评分、README、讨论都在那里。
  if (typeof r.full_name === "string" && /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/u.test(r.full_name)) {
    plugin.homepage = `${SITE_URL}/en/plugins/${r.full_name}`;
  }
  const repoUrl = cleanRepoUrl(r.url);
  if (repoUrl !== null) {
    plugin.repository = { url: repoUrl };
    const directory = cleanDirectory(r.npm_repo_directory);
    if (directory !== null) plugin.repository.directory = directory;
  }

  const metadata = {};
  if (Object.hasOwn(CATEGORIES, r.category ?? "")) metadata.category = r.category;
  if (toBool(r.is_featured)) metadata.labels = ["featured"];
  const sortKeys = {};
  const stars = Number(r.stars);
  if (Number.isFinite(stars)) sortKeys.stars = stars;
  if (r.score !== null && r.score !== undefined && Number.isFinite(Number(r.score))) sortKeys.score = Number(r.score);
  if (Object.keys(sortKeys).length > 0) metadata.sortKeys = sortKeys;
  if (Object.keys(metadata).length > 0) plugin.metadata = metadata;

  plugin.versions = [
    {
      version,
      publishTimestamp: unixSeconds(r.pushed_at, r.install_probed_at) ?? fallbackSeconds,
      source: { type: "npm" },
    },
  ];
  return plugin;
}

/**
 * rows 按快照序传入（featured 优先、star 降序），索引的默认顺序沿用它。
 * 同一个 npm 包被多个仓库（fork、改名）认领时只留第一条：读端要求 name 唯一。
 */
export function buildDshIndex(rows, now = new Date()) {
  const fallbackSeconds = Math.floor(now.getTime() / 1000);
  const seen = new Set();
  const plugins = [];
  for (const r of rows) {
    const plugin = buildIndexPlugin(r, fallbackSeconds);
    if (plugin === null || seen.has(plugin.name)) continue;
    seen.add(plugin.name);
    plugins.push(plugin);
  }
  return { ...INDEX_META, plugins };
}

/** 生成后的自检：只查最容易被数据带坏的那几条，任何一条不过就让生成直接失败。 */
export function assertDshIndex(index) {
  const fail = (path, reason) => {
    throw new Error(`dsh-index ${path}: ${reason}`);
  };
  for (const [path, text] of [["$.title", index.title], ["$.description", index.description]]) {
    for (const [lang, s] of Object.entries(text)) {
      if (!LANGUAGE_ID.test(lang) || !nonBlank(s)) fail(`${path}.${lang}`, "bad localized text");
    }
  }
  const names = new Set();
  index.plugins.forEach((p, i) => {
    const at = `$.plugins[${i}]`;
    if (!PACKAGE_NAME.test(p.name) || p.name.length > PACKAGE_NAME_MAX_LENGTH) fail(`${at}.name`, p.name);
    if (names.has(p.name)) fail(`${at}.name`, `duplicate ${p.name}`);
    names.add(p.name);
    for (const key of ["title", "description", "author"]) {
      if (key in p && !nonBlank(p[key])) fail(`${at}.${key}`, "blank");
    }
    if (p.metadata?.category && !Object.hasOwn(index.metadata.categories, p.metadata.category)) {
      fail(`${at}.metadata.category`, p.metadata.category);
    }
    for (const v of p.versions) {
      if (!SEMVER.test(v.version)) fail(`${at}.versions`, v.version);
      if (!Number.isInteger(v.publishTimestamp) || v.publishTimestamp < 0 || v.publishTimestamp >= MAX_PUBLISH_TIMESTAMP) {
        fail(`${at}.versions`, `publishTimestamp ${v.publishTimestamp}`);
      }
    }
  });
}
