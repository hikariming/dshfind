"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

/**
 * 详情页的「炫耀卡」区块：预览 + 一键复制 Markdown。
 *
 * 图片与链接都指向正式域名（不是当前 origin）——作者会把这段贴进 GitHub README，
 * 相对路径和 localhost 在那边都不成立。
 */

/**
 * downloads 是 badge 的 `?metric=downloads` 变体：报累计下载档位（`↓ 20k+`）。
 * 只在插件确实攒够量时才出现（页面传 showDownloads），否则复制出去的是一张
 * 自动回落成默认小标的图，作者会以为坏了。
 */
type Variant = "badge" | "downloads" | "card";

const LABEL_KEY = {
  badge: "shareBadgeLabel",
  downloads: "shareDownloadsLabel",
  card: "shareCardLabel",
} as const;

export function ShareCardBox({
  siteUrl,
  fullName,
  showDownloads = false,
}: {
  siteUrl: string;
  fullName: string;
  showDownloads?: boolean;
}) {
  const t = useTranslations("Plugins");
  const locale = useLocale();
  const [copied, setCopied] = React.useState<Variant | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  // 详情页链接带 ref=badge，便于在分析里把外链来量单独拆出来
  const target = `${siteUrl}/${locale}/plugins/${fullName}?ref=badge`;
  // 英文是默认语言，省掉 ?lang= 让复制出来的 URL 短一点
  const params = [
    ...(locale === "en" ? [] : [`lang=${locale}`]),
  ];
  /** downloads 走的还是 /api/badge，只是多带一个 metric 参数。 */
  const path = (v: Variant) => {
    const query = [...(v === "downloads" ? ["metric=downloads"] : []), ...params];
    return `/api/${v === "downloads" ? "badge" : v}/${fullName}${
      query.length ? `?${query.join("&")}` : ""
    }`;
  };
  const markdown = (v: Variant) => `[![dshfind](${siteUrl}${path(v)})](${target})`;
  // 预览走当前站点的相对路径：本地开发和 preview 部署上正式域名还没有这张图
  const previewSrc = (v: Variant) => path(v);

  const copy = async (v: Variant) => {
    try {
      await navigator.clipboard.writeText(markdown(v));
      setCopied(v);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1800);
    } catch {
      // 剪贴板被拒（非 HTTPS / 无权限）：代码框本身可选中，用户手动复制即可
    }
  };

  return (
    <div className="space-y-5">
      {(["badge", ...(showDownloads ? (["downloads"] as const) : []), "card"] as const).map((v) => (
        <div key={v} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {t(LABEL_KEY[v])}
            </span>
            <button
              type="button"
              onClick={() => copy(v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              {copied === v ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  {t("shareCopied")}
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  {t("shareCopy")}
                </>
              )}
            </button>
          </div>

          <a href={target} target="_blank" rel="noopener noreferrer" className="block">
            {/* 预览用原生 img：这是外部 SVG 接口，不该走 next/image 的优化管线 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc(v)}
              alt={t(LABEL_KEY[v])}
              className={v === "card" ? "w-full max-w-[440px] rounded-xl" : "h-5"}
            />
          </a>

          <pre className="overflow-x-auto rounded-lg bg-muted/60 px-3 py-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap">
            {markdown(v)}
          </pre>
        </div>
      ))}
    </div>
  );
}
