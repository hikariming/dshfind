import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { threadPageFromBackend } from "@/lib/backend";
import { threadLocale, threadPath } from "@/lib/forum";
import { learnChapters } from "@/lib/nav";
import { realPlugins } from "@/lib/plugins-real";
import { languageAlternates, localeUrl } from "@/lib/site";

/**
 * 全站 sitemap：静态页 + 课程页 + 插件详情页 + BBS 帖子页 × 4 种语言。
 * 除帖子外的数据全部来自构建期静态快照（plugins-real / nav），不依赖数据库；
 * 每日同步脚本重新生成 plugins-real.ts 后，随下一次部署自动更新。
 *
 * 帖子是唯一不靠部署更新的部分——BBS 现在要发 SEO 文章，等到下一次部署才进
 * sitemap 太慢。所以这份 sitemap 自己也走 ISR，每小时重新拉一次帖子列表。
 */
export const revalidate = 3600;

/** 进 sitemap 的帖子上限。超出的靠站内链接被发现，不让 sitemap 无限膨胀。 */
const SITEMAP_THREAD_LIMIT = 50;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  const addForAllLocales = (
    path: string,
    opts: {
      priority: number;
      changeFrequency: "daily" | "weekly" | "monthly";
      lastModified?: string | Date;
    },
  ) => {
    const alternates = { languages: languageAlternates(path) };
    for (const locale of locales) {
      entries.push({
        url: localeUrl(locale, path),
        lastModified: opts.lastModified ?? new Date(),
        changeFrequency: opts.changeFrequency,
        priority: opts.priority,
        alternates,
      });
    }
  };

  // 核心静态页
  addForAllLocales("", { priority: 1, changeFrequency: "daily" });
  addForAllLocales("/plugins", { priority: 0.9, changeFrequency: "daily" });
  addForAllLocales("/learn/cordis", { priority: 0.8, changeFrequency: "weekly" });
  addForAllLocales("/bbs", { priority: 0.7, changeFrequency: "daily" });

  // 课程页：导航结构里所有已上线的课时
  for (const chapter of learnChapters) {
    for (const item of chapter.items) {
      if (item.href) {
        addForAllLocales(item.href, {
          priority: 0.7,
          changeFrequency: "monthly",
        });
      }
    }
  }

  // 插件详情页：构建期收录的全部仓库，lastModified 用仓库最近推送时间。
  // 风险项目（假冒仓库等）不进 sitemap——详情页同时 noindex，不给假冒者送 SEO。
  for (const plugin of realPlugins) {
    if (plugin.isRisky) continue;
    addForAllLocales(`/plugins/${plugin.fullName}`, {
      priority: 0.6,
      changeFrequency: "weekly",
      lastModified: plugin.pushedAt || undefined,
    });
  }

  // BBS 帖子。后端不可用时 threadPageFromBackend 回 null——sitemap 少几个
  // URL 也比整份构建失败强，帖子下一小时的重验证会补上。
  // 插件讨论帖排除在外：正文是空的、标题只是仓库名，帖子页本身也是 noindex。
  //
  // 与上面所有条目不同，帖子只登记它自己那个语言的 URL：一篇中文帖在 /en /ja /ko
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
