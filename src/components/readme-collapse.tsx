"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

/** 折叠态的可见高度；约等于一屏，足够露出头图、简介与安装段落。 */
const COLLAPSED_PX = 560;

/**
 * README 默认折叠，只露出开头。
 *
 * 正文由服务端输出在 HTML 里（折叠只是 max-height，搜索引擎拿到的是全文）。
 * 首帧按折叠渲染避免跳动；挂载后量一次高度，短 README 直接去掉折叠和按钮。
 */
export function ReadmeCollapse({
  html,
  expandLabel,
  collapseLabel,
}: {
  html: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 图片懒加载后高度会变，用 ResizeObserver 而不是只量一次
    const measure = () => setOverflows(el.scrollHeight > COLLAPSED_PX + 80);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const collapsed = overflows && !expanded;

  return (
    <div className="relative">
      <div
        ref={ref}
        className={cn("readme-body overflow-hidden", collapsed && "max-h-[560px]")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {collapsed && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
      )}
      {overflows && (
        <div className={cn("flex justify-center", collapsed ? "relative -mt-2" : "mt-4")}>
          <button
            type="button"
            onClick={() => {
              setExpanded((v) => !v);
              // 收起时回到 README 开头，否则人停在一片空白里
              if (expanded) ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {expanded ? collapseLabel : expandLabel}
          </button>
        </div>
      )}
    </div>
  );
}
