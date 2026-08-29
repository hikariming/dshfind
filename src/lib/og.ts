/**
 * 分享预览图（og:image）。
 *
 * 此前全站没有这个标签：`layout.tsx` 只声明了 `twitter.card: "summary"`，
 * 没有任何 `images`。于是把 dshfind 的链接贴到 X / Telegram / 飞书 / Slack，
 * 渲染出来的是一行裸链接。而站点自己的诊断结论是「流量来自社区分享而非搜索」——
 * 也就是说唯一在跑的那个渠道，一直在以最差的形态呈现。
 *
 * 注意不要拿 `/api/card` 顶这个位置：那条路由输出 `image/svg+xml`，
 * 而社交平台一律不渲染 SVG 的 og:image，必须是 PNG/JPEG。
 */

import type { Metadata } from "next";

import { SITE_URL } from "./site";

/** og:image 的标准尺寸；小于 600×315 的图会被降级成小卡。 */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * 插件详情页的预览图 —— 直接用 GitHub 给每个仓库出的那张 1200×630 PNG。
 *
 * 仓库主在 GitHub 设置里传过 social preview 时，这个地址返回的就是那张图，
 * 也就是插件作者自己放的运行效果图；没传则由 GitHub 合成（仓库名 + 作者头像 +
 * 描述 + star/fork）。两种情况都比我们自己画的模板卡更有信息量，且零生成成本。
 *
 * 路径里的第一段是 GitHub 用的缓存键，取值不限。这里放 pushedAt 的日期部分：
 * 固定值会让社交平台永远缓存第一次抓到的图（作者后来补传的效果图再也刷不出来），
 * 而带上时间戳则每次仓库有推送就换一个 URL，各平台自然重抓。只取到「日」是为了
 * 不让同一天的多次推送反复击穿缓存。
 */
export function pluginOgImage(fullName: string, pushedAt: string): string {
  const key = pushedAt ? pushedAt.slice(0, 10).replace(/-/g, "") : "1";
  return `https://opengraph.githubassets.com/${key}/${fullName}`;
}

/**
 * 拼出 `openGraph.images` 与 `twitter` 两块 metadata。
 *
 * 必须同时给 `twitter.card: "summary_large_image"`：X 的默认卡型是 summary
 * （小方图），只给 images 不改 card，图会被压成一个缩略角标。
 */
export function ogImageMeta(
  url: string,
  alt: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      images: [{ url, width: OG_WIDTH, height: OG_HEIGHT, alt }],
    },
    twitter: {
      card: "summary_large_image",
      images: [url],
    },
  };
}
