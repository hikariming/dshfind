import { NextResponse } from "next/server";

import { getPluginDetail } from "@/lib/plugins-db";
import { renamedTo } from "@/lib/plugin-renames";
import {
  esc,
  pickHighlight,
  textWidth,
  toBadgeLocale,
  toBadgeMetric,
  type Highlight,
} from "@/lib/share-badge";

/**
 * GET /api/badge/[owner]/[repo]?lang=en|zh|ja|ko&metric=auto|downloads
 * —— shields 风格的一行小标。
 *
 * 给插件作者贴进 README 用，点击跳回 dshfind 详情页，顺带给站点带外链。
 * 纯 SVG、无外部字体与图片：GitHub 的 camo 代理只透传字节，引用任何外部资源都会失效。
 *
 * metric 默认 auto（官方 > 推荐 > 内测 > 评分 > star）。metric=downloads 是作者
 * 显式选的炫耀变体，报累计下载档位（`↓ 20k+`）；没攒够量时自动落回 auto，
 * 不会挂出一张空徽章。
 */

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

function svgResponse(svg: string, cacheable: boolean) {
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // README 里的小标被 camo 缓存，站内数据一天一同步，缓存 1 小时足够新鲜
      "Cache-Control": cacheable
        ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
        : "public, max-age=60, s-maxage=300",
    },
  });
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/badge/[owner]/[repo]">
) {
  const { owner, repo } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const locale = toBadgeLocale(params.get("lang"));
  const metric = toBadgeMetric(params.get("metric"));
  let plugin = await getPluginDetail(`${owner}/${repo}`);

  // 仓库改过名的话，作者 README 里的徽标还指着旧地址——直接按新名出图，
  // 不 301：camo 缓存的是字节，少一跳；作者什么时候改 README 都不影响。
  if (!plugin) {
    const moved = renamedTo(`${owner}/${repo}`);
    if (moved) plugin = await getPluginDetail(moved);
  }

  // 未收录也要回一张图：README 里挂个坏图比显示「未收录」更难看，
  // 而且仓库刚被收录时不用等作者改 README。
  if (!plugin) {
    const fallback: Highlight = { kind: "stars", text: "not listed", color: "#71717a" };
    return svgResponse(renderBadge(fallback, `dshfind: not listed`), false);
  }

  const highlight = pickHighlight(plugin, locale, metric);
  return svgResponse(
    renderBadge(highlight, `dshfind: ${plugin.name} — ${highlight.text}`),
    true
  );
}
