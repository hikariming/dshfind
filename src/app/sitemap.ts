import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { learnChapters } from "@/lib/nav";
import { getAllPosts } from "@/lib/blog";
import { realPlugins } from "@/lib/plugins-real";
import { languageAlternates, localeUrl } from "@/lib/site";

/**
 * 全站 sitemap：静态页 + 课程页 + 插件详情页 × 4 种语言。
 * 数据全部来自构建期静态快照（plugins-real / nav），不依赖数据库；
 * 每日同步脚本重新生成 plugins-real.ts 后，随下一次部署自动更新。
 */
export default function sitemap(): MetadataRoute.Sitemap {
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
  addForAllLocales("/ranking", { priority: 0.6, changeFrequency: "daily" });
  addForAllLocales("/blog", { priority: 0.7, changeFrequency: "weekly" });

  // 博客文章
  for (const post of getAllPosts()) {
    addForAllLocales(`/blog/${post.slug}`, {
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: post.date,
    });
  }

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

  // 插件详情页：构建期收录的全部仓库，lastModified 用仓库最近推送时间
  for (const plugin of realPlugins) {
    addForAllLocales(`/plugins/${plugin.fullName}`, {
      priority: 0.6,
      changeFrequency: "weekly",
      lastModified: plugin.pushedAt || undefined,
    });
  }

  return entries;
}
