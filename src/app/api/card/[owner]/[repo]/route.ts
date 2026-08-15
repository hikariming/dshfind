import { NextResponse } from "next/server";

import { getPluginDetail } from "@/lib/plugins-db";
import {
  allChips,
  esc,
  footerFor,
  sanitize,
  subtitleFor,
  textWidth,
  toBadgeLocale,
  truncateToWidth,
  type BadgeLocale,
  type Highlight,
} from "@/lib/share-badge";

/**
 * GET /api/card/[owner]/[repo]?lang=en|zh|ja|ko —— 440×200 的展示卡。
 *
 * 与小标同源同数据，只是放得下更多信息：官方/推荐/内测可以并列展示。
 * 纯 SVG，深浅色跟随读者系统主题（<img> 引用的 SVG 会自己响应 prefers-color-scheme）。
 */

const W = 440;
const H = 200;
const PAD = 24;

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
  plugin: { name: string; owner: string; description: string },
  chips: Highlight[],
  locale: BadgeLocale,
  alt: string
): string {
  const name = truncateToWidth(sanitize(plugin.name), 20, W - PAD * 2 - 20);
  const desc = truncateToWidth(sanitize(plugin.description || ""), 12.5, W - PAD * 2);

  // 依次排开，排不下的直接丢——卡片宁可少两个标记也不能溢出
  let x = PAD;
  const parts: string[] = [];
  for (const c of chips) {
    const { svg, width } = chip(c, x, 138);
    if (x + width > W - PAD) break;
    parts.push(svg);
    x += width + 8;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}">
<title>${esc(alt)}</title>
<style>
:root{--bg:#0a0a0b;--fg:#fafafa;--muted:#a1a1aa;--line:#3f3f46}
@media (prefers-color-scheme:light){:root{--bg:#ffffff;--fg:#18181b;--muted:#52525b;--line:#d4d4d8}}
text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
</style>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="var(--bg,#0a0a0b)" stroke="var(--line,#3f3f46)" stroke-opacity="0.6"/>
<circle cx="${PAD + 9}" cy="${PAD + 12}" r="9" fill="#4d6bfe"/>
<text x="${PAD + 9}" y="${PAD + 16}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">d</text>
<text x="${PAD + 26}" y="${PAD + 16}" font-size="11.5" font-weight="700" fill="var(--muted,#a1a1aa)">${esc(subtitleFor(locale))}</text>
<text x="${PAD}" y="86" font-size="20" font-weight="800" fill="var(--fg,#fafafa)">${esc(name)}</text>
<text x="${PAD}" y="107" font-size="12" font-weight="600" fill="var(--muted,#a1a1aa)">@${esc(sanitize(plugin.owner))}</text>
<text x="${PAD}" y="128" font-size="12.5" fill="var(--muted,#a1a1aa)">${esc(desc)}</text>
${parts.join("\n")}
<text x="${W - PAD}" y="${H - 16}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--muted,#a1a1aa)" opacity="0.8">${esc(footerFor(locale))}</text>
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
      { name: `${owner}/${repo}`, owner, description: "" },
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
