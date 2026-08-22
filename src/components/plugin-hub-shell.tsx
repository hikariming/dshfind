import type { ReactNode } from "react";

import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PluginHubList } from "@/components/plugin-hub-list";
import { jsonLdSafe } from "@/lib/json-ld";
import type { HubPlugin } from "@/lib/plugin-hubs";
import type { Crumb } from "@/lib/structured-data";

/**
 * 全部插件聚合页共用的外壳：面包屑 + 标题 + 计数行 + 列表 + 结构化数据。
 * 分类/标签/语言/全量索引四种页面只在文案、crumbs 与页尾附加区块上有差异。
 */
export function PluginHubShell({
  locale,
  crumbs,
  heading,
  countLine,
  plugins,
  jsonLd,
  intro,
  children,
}: {
  locale: string;
  crumbs: Crumb[];
  heading: string;
  countLine: string;
  plugins: HubPlugin[];
  /** 逐条渲染成独立 <script>，便于搜索引擎分别解析 BreadcrumbList 与 ItemList。 */
  jsonLd: unknown[];
  /** 标题下的一段说明文字，给聚合页一点自有正文而不只是链接堆。 */
  intro?: ReactNode;
  /** 列表之后的附加区块（分页、facet 导航等）。 */
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdSafe(data) }}
        />
      ))}

      <BreadcrumbNav crumbs={crumbs} />

      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{heading}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
        {countLine}
      </p>
      {intro && (
        <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}

      <PluginHubList plugins={plugins} locale={locale} />

      {children}
    </div>
  );
}
