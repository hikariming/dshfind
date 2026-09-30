/**
 * 分享小标（/api/badge）与展示卡（/api/card）的渲染与取数逻辑。
 *
 * 老站 Next 路由与 Astro 新站（apps/web）共用这一份——出图的字节必须一致，作者 README 里的图不能因为
 * 换了一边渲染就变样。取插件详情的方式由调用方注入（两边的数据层不同），这里保持零框架依赖。
 */
import { WHALE_DATA_URI } from "./brand-logo";
import { renamedTo } from "./plugin-renames";
import {
  allChips,
  esc,
  footerFor,
  pickHighlight,
  sanitize,
  textWidth,
  toBadgeLocale,
  toBadgeMetric,
  truncateToWidth,
  type BadgeLocale,
  type Highlight,
} from "./share-badge";

/** 取插件详情：找不到返回 null（与 plugins-db.getPluginDetail 同签名的子集） */
type Detail = Parameters<typeof pickHighlight>[0] & Parameters<typeof allChips>[0] & { name: string; owner: string };
export type GetDetail = (fullName: string) => Promise<Detail | null>;

/** README 里的小标被 camo 缓存，站内数据一天一同步，缓存 1 小时足够新鲜；未收录的短缓存 */
export const SHARE_CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
export const SHARE_CACHE_SHORT = "public, max-age=60, s-maxage=300";

/** 仓库改过名的话，作者 README 里还指着旧地址——直接按新名出图（不 301：camo 缓存的是字节，少一跳） */
async function resolve(owner: string, repo: string, getDetail: GetDetail) {
  let plugin = await getDetail(`${owner}/${repo}`);
  if (!plugin) {
    const moved = renamedTo(`${owner}/${repo}`);
    if (moved) plugin = await getDetail(moved);
  }
  return plugin;
}

// ---------------- 小标 ----------------

const H = 20;
const FONT = 11;
const PAD = 7;
const LABEL = "dshfind";

function renderBadge(highlight: Highlight, alt: string): string {
  const labelW = textWidth(LABEL, FONT) + PAD * 2;
  const valueW = textWidth(highlight.text, FONT) + PAD * 2;
  const total = labelW + valueW;
  // 文本锚点放在各自区块中心；×10 再 scale(.1) 是 shields 的老做法，能拿到亚像素精度
  const labelX = (labelW / 2) * 10;
  const valueX = (labelW + valueW / 2) * 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${H}" role="img" aria-label="${esc(alt)}">
<title>${esc(alt)}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${total}" height="${H}" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)">
<rect width="${labelW}" height="${H}" fill="#3f3f46"/>
<rect x="${labelW}" width="${valueW}" height="${H}" fill="${highlight.color}"/>
<rect width="${total}" height="${H}" fill="url(#s)"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',DejaVu Sans,sans-serif" font-size="${FONT * 10}" transform="scale(.1)">
<text x="${labelX}" y="${(H / 2 + 4) * 10}" fill="#000" fill-opacity=".3">${esc(LABEL)}</text>
<text x="${labelX}" y="${(H / 2 + 3) * 10}">${esc(LABEL)}</text>
<text x="${valueX}" y="${(H / 2 + 4) * 10}" fill="#000" fill-opacity=".3">${esc(highlight.text)}</text>
<text x="${valueX}" y="${(H / 2 + 3) * 10}">${esc(highlight.text)}</text>
</g>
</svg>`;
}


/** GET /api/badge/[owner]/[repo]?lang=&metric= 的全部逻辑；返回 SVG 与是否可长缓存 */
export async function badgeSvg(owner: string, repo: string, params: URLSearchParams, getDetail: GetDetail) {
  const locale = toBadgeLocale(params.get("lang"));
  const metric = toBadgeMetric(params.get("metric"));
  const plugin = await resolve(owner, repo, getDetail);
  // 未收录也要回一张图：README 里挂个坏图比显示「未收录」更难看
  if (!plugin) {
    const fallback: Highlight = { kind: "stars", text: "not listed", color: "#71717a" };
    return { svg: renderBadge(fallback, `dshfind: not listed`), cacheable: false };
  }
  const highlight = pickHighlight(plugin, locale, metric);
  return { svg: renderBadge(highlight, `dshfind: ${plugin.name} — ${highlight.text}`), cacheable: true };
}

// ---------------- 展示卡 ----------------

const CARD_W = 440;
const CARD_H = 122;
const CARD_PAD = 20;
const LOGO = 40;

function chip(c: Highlight, x: number, y: number): { svg: string; width: number } {
  const w = textWidth(c.text, 11) + 18;
  return {
    width: w,
    svg: `<g transform="translate(${x} ${y})">
<rect width="${w}" height="24" rx="12" fill="${c.color}" fill-opacity="0.14" stroke="${c.color}" stroke-opacity="0.45"/>
<text x="${w / 2}" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="${c.color}">${esc(c.text)}</text>
</g>`,
  };
}

function renderCard(
  plugin: { name: string; owner: string },
  chips: Highlight[],
  locale: BadgeLocale,
  alt: string
): string {
  const textLeft = CARD_PAD + LOGO + 14;
  const name = truncateToWidth(sanitize(plugin.name), 21, CARD_W - textLeft - CARD_PAD);
  const owner = truncateToWidth(`@${sanitize(plugin.owner)}`, 12.5, CARD_W - textLeft - CARD_PAD);

  // 依次排开，排不下的直接丢——卡片宁可少两个标记也不能溢出
  let x = CARD_PAD;
  const parts: string[] = [];
  for (const c of chips) {
    const { svg, width } = chip(c, x, 72);
    if (x + width > CARD_W - CARD_PAD) break;
    parts.push(svg);
    x += width + 7;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" role="img" aria-label="${esc(alt)}">
<title>${esc(alt)}</title>
<style>
:root{--bg:#0a0a0b;--fg:#fafafa;--muted:#a1a1aa;--line:#3f3f46}
@media (prefers-color-scheme:light){:root{--bg:#ffffff;--fg:#18181b;--muted:#52525b;--line:#d4d4d8}}
text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
</style>
<rect x="0.5" y="0.5" width="${CARD_W - 1}" height="${CARD_H - 1}" rx="14" fill="var(--bg,#0a0a0b)" stroke="var(--line,#3f3f46)" stroke-opacity="0.6"/>
<image x="${CARD_PAD}" y="${CARD_PAD}" width="${LOGO}" height="${LOGO}" href="${WHALE_DATA_URI}" preserveAspectRatio="xMidYMid meet"/>
<text x="${textLeft}" y="${CARD_PAD + 20}" font-size="21" font-weight="800" fill="var(--fg,#fafafa)">${esc(name)}</text>
<text x="${textLeft}" y="${CARD_PAD + 39}" font-size="12.5" font-weight="600" fill="var(--muted,#a1a1aa)">${esc(owner)}</text>
${parts.join("\n")}
<text x="${CARD_W - CARD_PAD}" y="${CARD_H - 13}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--muted,#a1a1aa)" opacity="0.75">${esc(footerFor(locale))}</text>
</svg>`;
}


/** GET /api/card/[owner]/[repo]?lang= 的全部逻辑 */
export async function cardSvg(owner: string, repo: string, params: URLSearchParams, getDetail: GetDetail) {
  const locale = toBadgeLocale(params.get("lang"));
  const plugin = await resolve(owner, repo, getDetail);
  if (!plugin) {
    return { svg: renderCard({ name: repo, owner }, [], locale, "not listed on dshfind"), cacheable: false };
  }
  const chips = allChips(plugin, locale);
  const alt = `${plugin.name} by @${plugin.owner} — ${chips.map((c) => c.text).join(" · ")}`;
  return { svg: renderCard(plugin, chips, locale, alt), cacheable: true };
}
