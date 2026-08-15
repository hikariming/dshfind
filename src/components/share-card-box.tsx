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

type Variant = "badge" | "card";

export function ShareCardBox({
  siteUrl,
  fullName,
}: {
  siteUrl: string;
  fullName: string;
}) {
  const t = useTranslations("Plugins");
  const locale = useLocale();
  const [copied, setCopied] = React.useState<Variant | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  // 详情页链接带 ref=badge，便于在分析里把外链来量单独拆出来
  const target = `${siteUrl}/${locale}/plugins/${fullName}?ref=badge`;
  // 英文是默认语言，省掉 ?lang= 让复制出来的 URL 短一点
  const query = locale === "en" ? "" : `?lang=${locale}`;
  const markdown = (v: Variant) =>
    `[![dshfind](${siteUrl}/api/${v}/${fullName}${query})](${target})`;
  // 预览走当前站点的相对路径：本地开发和 preview 部署上正式域名还没有这张图
  const previewSrc = (v: Variant) => `/api/${v}/${fullName}${query}`;

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
      {(["badge", "card"] as const).map((v) => (
        <div key={v} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {v === "badge" ? t("shareBadgeLabel") : t("shareCardLabel")}
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
              alt={t(v === "badge" ? "shareBadgeLabel" : "shareCardLabel")}
              className={v === "badge" ? "h-5" : "w-full max-w-[440px] rounded-xl"}
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
