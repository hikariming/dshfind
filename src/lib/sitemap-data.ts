/**
 * Sitemap 各分片的内容组装。渲染与分片数学在 lib/sitemap.ts。
 *
 * 分片划分：
 *   pages     —— 静态页 + 课程页 + BBS 帖子页（数百条，含唯一的实时数据源）
 *   plugins-N —— 插件详情页，每片 PLUGINS_PER_SHARD 个插件 × 4 语言
 *
 * 这样切的理由是「变化频率」而非平均大小：pages 每小时要重新拉帖子，
 * plugins-* 只在部署刷新 plugins-real.ts 时变。爬虫按 lastmod 决定重抓哪片，
 * 混在一起会让三万条插件 URL 跟着帖子每小时"变新"一次。
 */
import { threadPageFromBackend } from "@/lib/backend";
import { threadLocale, threadPath } from "@/lib/forum";
import { learnChapters } from "@/lib/nav";
import { realPlugins } from "@/lib/plugins-real";
import { localeUrl } from "@/lib/site";
import {
  entriesForAllLocales,
  PLUGINS_PER_SHARD,
  type SitemapEntry,
} from "@/lib/sitemap";

/** 进 sitemap 的帖子上限。超出的靠站内链接被发现，不让 sitemap 无限膨胀。 */
const SITEMAP_THREAD_LIMIT = 50;

/** 风险项目（假冒仓库等）不进 sitemap——详情页同时 noindex，不给假冒者送 SEO。 */
function indexablePlugins() {
  return realPlugins.filter((plugin) => !plugin.isRisky);
}

export function pluginShardCount(): number {
  return Math.max(1, Math.ceil(indexablePlugins().length / PLUGINS_PER_SHARD));
}

/** 全部分片名，顺序即索引里的顺序。 */
export function allShardNames(): string[] {
  return [
    "pages",
    ...Array.from({ length: pluginShardCount() }, (_, i) => `plugins-${i}`),
  ];
}

/** 静态页 + 课程页 + 帖子。唯一依赖实时后端的分片。 */
export async function pagesShard(revalidate: number): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [
    ...entriesForAllLocales("", { priority: 1, changeFrequency: "daily" }),
    ...entriesForAllLocales("/plugins", { priority: 0.9, changeFrequency: "daily" }),
    ...entriesForAllLocales("/learn/cordis", { priority: 0.8, changeFrequency: "weekly" }),
    ...entriesForAllLocales("/ranking", { priority: 0.6, changeFrequency: "daily" }),
    ...entriesForAllLocales("/bbs", { priority: 0.7, changeFrequency: "daily" }),
  ];

  for (const chapter of learnChapters) {
    for (const item of chapter.items) {
      if (item.href) {
        entries.push(
          ...entriesForAllLocales(item.href, {
            priority: 0.7,
            changeFrequency: "monthly",
          }),
        );
      }
    }
  }

  // BBS 帖子。后端不可用时 threadPageFromBackend 回 null——少几十条帖子 URL
  // 远好过整片渲染失败，插件那片占 99%，绝不能用同样的降级方式。
  // 插件讨论帖排除在外：正文是空的、标题只是仓库名，帖子页本身也是 noindex。
  //
  // 与其他条目不同，帖子只登记它自己那个语言的 URL：一篇中文帖在 /en /ja /ko
  // 下渲染的是同一份正文，四条都收录就是自造重复内容。帖子页的 canonical
  // 同样指向作者写作时的语言（见 bbs/t/[slug]/page.tsx）。
  const threads = await threadPageFromBackend(
    { perPage: SITEMAP_THREAD_LIMIT },
    revalidate,
  );
  for (const thread of threads?.items ?? []) {
    if (thread.plugin_full_name) continue;
    entries.push({
      url: localeUrl(threadLocale(thread.locale), threadPath(thread.slug)),
      lastModified: thread.last_post_at || thread.created_at,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}

/** 第 index 片插件详情页；越界返回 null 供路由 404。 */
export function pluginsShard(index: number): SitemapEntry[] | null {
  if (!Number.isInteger(index) || index < 0 || index >= pluginShardCount()) {
    return null;
  }
  const slice = indexablePlugins().slice(
    index * PLUGINS_PER_SHARD,
    (index + 1) * PLUGINS_PER_SHARD,
  );
  return slice.flatMap((plugin) =>
    entriesForAllLocales(`/plugins/${plugin.fullName}`, {
      priority: 0.6,
      changeFrequency: "weekly",
      lastModified: plugin.pushedAt || undefined,
    }),
  );
}
