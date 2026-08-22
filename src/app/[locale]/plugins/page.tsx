import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { PluginsBrowser } from "@/components/plugins-browser";
import { PluginFacetNav } from "@/components/plugin-facet-nav";
import { gradeOf } from "@/components/score-badge";
import { getPluginsPageData } from "@/lib/plugins-db";
import { listCategories, listLanguages, listTags } from "@/lib/plugin-hubs";
import { isLocale } from "@/i18n/config";
import { pageAlternates } from "@/lib/site";

/** 目录页 facet 导航里露出的热门标签数；其余标签走 /plugins/browse。 */
const TOP_TAGS = 40;

/**
 * ISR：整页（含 Turso 查询结果）静态缓存 30 分钟。
 * 之前 await searchParams 让本页每个请求都动态渲染——5646 个插件的
 * props 序列化成几 MB 的 RSC 载荷，每次访问都从源站重新传一遍，
 * 是 Fast Origin Transfer / Fluid CPU 账单的最大单项。
 * ?category= 深链改由 PluginsBrowser 在客户端读 location.search。
 */
export const revalidate = 1800;

/**
 * 首屏直出的插件数（行序 featured 优先、star 降序，前 100 覆盖默认视图首屏）。
 * 其余数据由客户端空闲时从 /api/plugins-data 懒加载——全量直出时
 * 单页 HTML 有 3.6MB，首屏和传输都吃不消。
 */
const FIRST_PAGE = 100;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("pluginsTitle"),
    description: t("pluginsDescription"),
    alternates: pageAlternates(locale, "/plugins"),
  };
}

export default async function PluginsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { plugins, languages, authorCount, i18nDescriptions } =
    await getPluginsPageData();

  const initialPlugins = plugins.slice(0, FIRST_PAGE);
  const initialI18n: Record<string, Record<string, string>> = {};
  for (const p of initialPlugins) {
    const m = i18nDescriptions[p.fullName];
    if (m) initialI18n[p.fullName] = m;
  }

  // 筛选器上的计数基于全量数据，在服务端算好传下去——
  // 客户端首屏只有前 100 个插件，自己算会把数字算错。
  const categoryCounts: Record<string, number> = {};
  const gradeCounts: Record<string, number> = {};
  for (const p of plugins) {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
    }
    if (p.score != null) {
      const g = gradeOf(p.score);
      gradeCounts[g] = (gradeCounts[g] ?? 0) + 1;
    }
  }

  const t = await getTranslations("Plugins");
  const categories = listCategories();
  const categoryLabels: Record<string, string> = {};
  for (const c of categories) categoryLabels[c.slug] = t(`categories.${c.slug}`);

  const browser = (
    <PluginsBrowser
      initialPlugins={initialPlugins}
      totalCount={plugins.length}
      languages={languages}
      authorCount={authorCount}
      categoryCounts={categoryCounts}
      gradeCounts={gradeCounts}
      i18nDescriptions={initialI18n}
    />
  );

  return (
    <>
      {browser}
      {/*
        SSR 的 hub 导航。PluginsBrowser 是客户端组件，它的筛选器只改内存状态、
        不产生任何 <a href>——本页此前只有 24 条详情页链接进 HTML，其余 9,600
        个详情页对爬虫不可见。这一段是它们进入站内链接图的入口。
      */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
        <PluginFacetNav
          title={t("hub.browseCategories")}
          base="/plugins/c"
          facets={categories}
          labels={categoryLabels}
        />
        <PluginFacetNav
          title={t("hub.browseLanguages")}
          base="/plugins/lang"
          facets={listLanguages()}
        />
        <PluginFacetNav
          title={t("hub.browseTags")}
          base="/plugins/t"
          facets={listTags().slice(0, TOP_TAGS)}
          prefix="#"
        />
        <p className="mt-6 text-sm">
          <Link
            href="/plugins/browse"
            className="underline underline-offset-4 hover:text-brand-500"
          >
            {t("hub.indexHeading")} →
          </Link>
        </p>
      </div>
    </>
  );
}
