import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PluginsBrowser } from "@/components/plugins-browser";
import { gradeOf } from "@/components/score-badge";
import { getPluginsPageData } from "@/lib/plugins-db";
import { isLocale } from "@/i18n/config";
import { pageAlternates } from "@/lib/site";

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

  return (
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
}
