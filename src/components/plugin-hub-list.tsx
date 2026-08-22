import { Star } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { ScoreBadge } from "@/components/score-badge";
import { localizePluginDescription } from "@/lib/plugin-i18n";
import type { HubPlugin } from "@/lib/plugin-hubs";

/**
 * hub 页的插件列表。
 *
 * 刻意做成服务端组件、每条都是真 <a href>：hub 页存在的全部意义就是让爬虫
 * 顺着链接走到详情页。任何形式的客户端懒加载都会让这些链接从 SSR HTML 里消失，
 * 等于白做——目录页 /plugins 就是这么把 9,600 个详情页变成孤儿页的。
 *
 * 卡片刻意比 plugins-browser 的轻：一页 200 条，重卡片会把 HTML 撑到几百 KB。
 */
export function PluginHubList({
  plugins,
  locale,
}: {
  plugins: HubPlugin[];
  locale: string;
}) {
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {plugins.map((p) => {
        const desc = localizePluginDescription(
          p.fullName,
          locale,
          p.description,
        );
        return (
          <li key={p.fullName}>
            <Link
              href={`/plugins/${p.fullName}`}
              className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-brand-500/60"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 font-mono text-sm font-semibold break-all">
                  {p.name}
                </span>
                <ScoreBadge score={p.score} />
              </div>
              <span className="mt-0.5 truncate text-xs text-muted-foreground">
                @{p.owner}
              </span>
              {desc && (
                <span className="mt-2 line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {desc}
                </span>
              )}
              <span className="mt-3 flex items-center gap-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Star className="size-3" />
                  {p.stars.toLocaleString("en-US")}
                </span>
                {p.language && <span>{p.language}</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
