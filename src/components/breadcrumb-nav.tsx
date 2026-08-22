import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Crumb } from "@/lib/structured-data";

/**
 * 可见面包屑。最后一项是当前页，不出链。
 * 与 breadcrumbJsonLd 用同一份 crumbs，保证展示与结构化数据不会漂移。
 */
export function BreadcrumbNav({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3 opacity-60" />}
              {last ? (
                <span aria-current="page" className="text-foreground">
                  {c.name}
                </span>
              ) : (
                <Link
                  href={c.path || "/"}
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
