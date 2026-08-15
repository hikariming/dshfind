/**
 * 炫耀卡/小标的共享逻辑：决定「主推什么信息」，以及 SVG 里要用到的文案与配色。
 *
 * 只被 /api/badge 与 /api/card 两个 route handler 使用（都跑在服务端），
 * 但刻意不 import 任何数据源——传进来的是已经取好的插件字段。
 */

/** 等级线与 scripts/lib/scoring.mjs 的 GRADE_BANDS 保持一致（同 components/score-badge.tsx）。 */
function gradeOf(score: number): string {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  return "C";
}

/** 卡片/小标支持的语言。默认英文：README 的读者不一定看得懂中文，也避开中文字体缺失。 */
export const BADGE_LOCALES = ["en", "zh", "ja", "ko"] as const;
export type BadgeLocale = (typeof BADGE_LOCALES)[number];
export const DEFAULT_BADGE_LOCALE: BadgeLocale = "en";

export function toBadgeLocale(raw: string | null): BadgeLocale {
  return (BADGE_LOCALES as readonly string[]).includes(raw ?? "")
    ? (raw as BadgeLocale)
    : DEFAULT_BADGE_LOCALE;
}

/** 决定主推信息用的插件字段子集。 */
export interface BadgeInput {
  isFeatured: boolean;
  isInsider: boolean;
  isOfficial: boolean;
  score: number | null;
  stars: number;
}

export type HighlightKind =
  | "official"
  | "featured"
  | "insider"
  | "score"
  | "stars"
  | "plugin";

export interface Highlight {
  kind: HighlightKind;
  /** 右半区文案，如 "✦ Featured"、"S 92"、"★ 338"。 */
  text: string;
  /** 右半区底色。 */
  color: string;
}

const L = {
  official: { en: "Official", zh: "官方出品", ja: "公式", ko: "공식" },
  featured: { en: "Featured", zh: "编辑推荐", ja: "編集おすすめ", ko: "에디터 추천" },
  insider: { en: "Insider", zh: "内测用户", ja: "インサイダー", ko: "인사이더" },
  onDshfind: {
    en: "on dshfind",
    zh: "收录于 dshfind",
    ja: "dshfind 掲載",
    ko: "dshfind 등재",
  },
  plugin: { en: "DSH plugin", zh: "DSH 插件", ja: "DSH プラグイン", ko: "DSH 플러그인" },
} as const;

/** 等级配色，与站内 ScoreBadge 的观感对齐（S 用品牌色，越低越灰）。 */
const GRADE_COLOR: Record<string, string> = {
  S: "#4d6bfe",
  A: "#10b981",
  B: "#0ea5e9",
  C: "#71717a",
};

/**
 * 主推哪一条，按用户定的优先级：官方 > 编辑推荐 > 内测用户 > 评分 > star 数。
 *
 * 官方排在最前是因为它比编辑推荐更强——运营标了官方却显示「编辑推荐」会降级表述。
 * 一路兜到 star：GitHub 仓库一定有 star 数，所以小标永远有东西可展示。
 */
export function pickHighlight(p: BadgeInput, locale: BadgeLocale): Highlight {
  if (p.isOfficial) {
    return { kind: "official", text: `◆ ${L.official[locale]}`, color: "#4d6bfe" };
  }
  if (p.isFeatured) {
    return { kind: "featured", text: `✦ ${L.featured[locale]}`, color: "#4d6bfe" };
  }
  if (p.isInsider) {
    return { kind: "insider", text: `◉ ${L.insider[locale]}`, color: "#8b5cf6" };
  }
  if (p.score != null) {
    const grade = gradeOf(p.score);
    return { kind: "score", text: `${grade} ${p.score}`, color: GRADE_COLOR[grade] };
  }
  return { kind: "stars", text: `★ ${formatStars(p.stars)}`, color: "#71717a" };
}

/**
 * 大卡上并列展示的所有标记（官方/推荐/内测可同时成立）。
 * 与 pickHighlight 不同：小标只能放一条，大卡放得下就都放。
 *
 * 刻意不放 star 数：卡片挂在别人的 README 里长期可见，而我们的 star 是每日同步的快照，
 * 和 GitHub 当下的数字对不上——写死一个过时数字比不写更糟。评分留着，那是站内自己的口径。
 * 都不成立时兜一条中性的「DSH 插件」，免得标记行空着。
 */
export function allChips(p: BadgeInput, locale: BadgeLocale): Highlight[] {
  const chips: Highlight[] = [];
  if (p.isOfficial) chips.push({ kind: "official", text: `◆ ${L.official[locale]}`, color: "#4d6bfe" });
  if (p.isFeatured) chips.push({ kind: "featured", text: `✦ ${L.featured[locale]}`, color: "#4d6bfe" });
  if (p.isInsider) chips.push({ kind: "insider", text: `◉ ${L.insider[locale]}`, color: "#8b5cf6" });
  if (p.score != null) {
    const grade = gradeOf(p.score);
    chips.push({ kind: "score", text: `${grade} ${p.score}`, color: GRADE_COLOR[grade] });
  }
  if (chips.length === 0) {
    chips.push({ kind: "plugin", text: L.plugin[locale], color: "#71717a" });
  }
  return chips;
}

export function subtitleFor(locale: BadgeLocale): string {
  return L.plugin[locale];
}

export function footerFor(locale: BadgeLocale): string {
  return L.onDshfind[locale];
}

/** 1234 -> 1.2k；README 里 star 数不需要精确到个位。 */
export function formatStars(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
}

/**
 * SVG 文本必须转义：插件名/描述/owner 全部来自 GitHub，
 * 里面出现 & < > 会直接把 SVG 解析破坏掉（引号则会破坏属性值）。
 */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 控制字符会让某些 SVG 渲染器直接罢工，统一剔掉。 */
export function sanitize(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * 估算文本像素宽度。SVG 里没有排版引擎，只能按字符类别估：
 * CJK/全角约等于 1em，其余按 Verdana 的经验值 0.6em。宁可估宽一点，免得文字顶出底框。
 */
export function textWidth(s: string, fontSize: number): number {
  let units = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    const wide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6);
    units += wide ? 1 : 0.6;
  }
  return Math.ceil(units * fontSize);
}

/** 按估算宽度截断并补省略号，避免长描述撑破卡片。 */
export function truncateToWidth(s: string, fontSize: number, maxWidth: number): string {
  if (textWidth(s, fontSize) <= maxWidth) return s;
  const chars = [...s];
  let out = "";
  for (const ch of chars) {
    if (textWidth(out + ch + "…", fontSize) > maxWidth) break;
    out += ch;
  }
  return out.trimEnd() + "…";
}
