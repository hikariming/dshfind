import { NextResponse } from "next/server";

import { WHALE_DATA_URI } from "@/lib/brand-logo";
import { getPluginDetail } from "@/lib/plugins-db";
import {
  allChips,
  esc,
  footerFor,
  sanitize,
  textWidth,
  toBadgeLocale,
  truncateToWidth,
  type BadgeLocale,
  type Highlight,
} from "@/lib/share-badge";

/**
 * GET /api/card/[owner]/[repo]?lang=en|zh|ja|ko —— 440×132 的展示卡。
 *
 * 与小标同源同数据，只是放得下更多标记：官方/推荐/内测可以并列展示。
 * 只放 logo、插件名、作者与标记——描述交给 README 正文，卡片保持紧凑。
 * 纯 SVG，深浅色跟随读者系统主题（<img> 引用的 SVG 会自己响应 prefers-color-scheme）。
 */

const W = 440;
const H = 122;
const PAD = 20;
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
  const textLeft = PAD + LOGO + 14;
  const name = truncateToWidth(sanitize(plugin.name), 21, W - textLeft - PAD);
  const owner = truncateToWidth(`@${sanitize(plugin.owner)}`, 12.5, W - textLeft - PAD);

  // 依次排开，排不下的直接丢——卡片宁可少两个标记也不能溢出
  let x = PAD;
  const parts: string[] = [];
  for (const c of chips) {
    const { svg, width } = chip(c, x, 72);
    if (x + width > W - PAD) break;
    parts.push(svg);
    x += width + 7;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}">
<title>${esc(alt)}</title>
<style>
:root{--bg:#0a0a0b;--fg:#fafafa;--muted:#a1a1aa;--line:#3f3f46}
@media (prefers-color-scheme:light){:root{--bg:#ffffff;--fg:#18181b;--muted:#52525b;--line:#d4d4d8}}
text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
</style>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="var(--bg,#0a0a0b)" stroke="var(--line,#3f3f46)" stroke-opacity="0.6"/>
<image x="${PAD}" y="${PAD}" width="${LOGO}" height="${LOGO}" href="${WHALE_DATA_URI}" preserveAspectRatio="xMidYMid meet"/>
<text x="${textLeft}" y="${PAD + 20}" font-size="21" font-weight="800" fill="var(--fg,#fafafa)">${esc(name)}</text>
<text x="${textLeft}" y="${PAD + 39}" font-size="12.5" font-weight="600" fill="var(--muted,#a1a1aa)">${esc(owner)}</text>
${parts.join("\n")}
<text x="${W - PAD}" y="${H - 13}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--muted,#a1a1aa)" opacity="0.75">${esc(footerFor(locale))}</text>
</svg>`;
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/card/[owner]/[repo]">
) {
  const { owner, repo } = await ctx.params;
  const locale = toBadgeLocale(new URL(request.url).searchParams.get("lang"));
  const plugin = await getPluginDetail(`${owner}/${repo}`);

  if (!plugin) {
    const svg = renderCard(
      { name: repo, owner },
      [],
      locale,
      "not listed on dshfind"
    );
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  }

  const chips = allChips(plugin, locale);
  const svg = renderCard(
    plugin,
    chips,
    locale,
    `${plugin.name} by @${plugin.owner} — ${chips.map((c) => c.text).join(" · ")}`
  );

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
