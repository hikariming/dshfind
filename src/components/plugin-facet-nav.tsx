import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import type { HubFacet } from "@/lib/plugin-hubs";

/**
 * facet 之间的横向导航（分类↔分类、语言↔语言、标签↔标签）。
 *
 * 除了给用户换个维度浏览，更重要的作用是把 hub 页之间也连成网：
 * 单靠「目录页 → hub → 详情页」是一棵树，权重只能自上而下流一次；
 * hub 互链之后爬虫从任何一个 hub 进来都能横向走遍其余 hub。
 */
export function PluginFacetNav({
  title,
  base,
  facets,
  activeSlug,
  labels,
  prefix = "",
}: {
  title: string;
  /** 链接前缀，如 "/plugins/c"。 */
  base: string;
  facets: HubFacet[];
  activeSlug?: string;
  /** slug → 展示名；不传则用 facet.name。 */
  labels?: Record<string, string>;
  /** 展示名前缀，标签页用 "#"。 */
  prefix?: string;
}) {
  if (facets.length === 0) return null;
  return (
    <section className="mt-10 border-t border-border/60 pt-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {facets.map((f) => {
          const active = f.slug === activeSlug;
          return (
            <Link key={f.slug} href={`${base}/${f.slug}`}>
              <Badge
                variant={active ? "secondary" : "outline"}
                className="text-[11px] font-normal hover:border-brand-500/60"
              >
                {prefix}
                {labels?.[f.slug] ?? f.name}
                <span className="ml-1 opacity-60 tabular-nums">{f.count}</span>
              </Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
