import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { PluginFacetNav } from "@/components/plugin-facet-nav";
import { PluginHubShell } from "@/components/plugin-hub-shell";
import { isLocale, type Locale } from "@/i18n/config";
import { HUB_LIST_LIMIT, listTags, tagHub } from "@/lib/plugin-hubs";
import { pageAlternates } from "@/lib/site";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/structured-data";

type Params = Promise<{ locale: string; tag: string }>;

export const revalidate = 86400;

/** facet 导航里露出的标签数——272 个全列出来会让每页多几 KB 且没人扫得完。 */
const NAV_TAGS = 60;

/**
 * 只预渲染热门标签，其余按需渲染后进 ISR 缓存。
 * 与详情页同一取舍：标签 hub 有 272 个 × 4 语言 ≈ 1,100 页，
 * 全量预渲染会显著拉长 CF 构建（那边已经有过构建超时回滚的前科）。
 */
export function generateStaticParams() {
  return listTags()
    .slice(0, NAV_TAGS)
    .map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  if (!isLocale(locale)) return {};
  const hub = tagHub(tag);
  if (!hub) return { robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "Meta" });
  const title = t("hubTagTitle", { name: hub.name, count: hub.total });
  const description = t("hubTagDescription", {
    name: hub.name,
    count: hub.total,
  });

  return {
    title,
    description,
    alternates: pageAlternates(locale, `/plugins/t/${tag}`),
    openGraph: { title, description },
  };
}

export default async function TagHubPage({ params }: { params: Params }) {
  const { locale, tag } = await params;
  setRequestLocale(locale);
  const hub = tagHub(tag);
  if (!hub || !isLocale(locale)) notFound();

  const t = await getTranslations("Plugins");
  const loc = locale as Locale;
  const heading = t("hub.tagHeading", { name: hub.name });

  const crumbs = [
    { name: "dshfind", path: "" },
    { name: t("title"), path: "/plugins" },
    { name: `#${hub.name}`, path: `/plugins/t/${tag}` },
  ];

  // 当前标签不在前 NAV_TAGS 时补进导航，否则用户在本页看不到自己所处的位置
  const navTags = listTags().slice(0, NAV_TAGS);
  if (!navTags.some((x) => x.slug === tag)) {
    const self = listTags().find((x) => x.slug === tag);
    if (self) navTags.unshift(self);
  }

  return (
    <PluginHubShell
      locale={locale}
      crumbs={crumbs}
      heading={heading}
      countLine={
        hub.total > HUB_LIST_LIMIT
          ? t("hub.showingTop", { shown: hub.plugins.length, total: hub.total })
          : t("hub.showingAll", { total: hub.total })
      }
      plugins={hub.plugins}
      jsonLd={[
        breadcrumbJsonLd(loc, crumbs),
        itemListJsonLd(loc, heading, hub.plugins),
      ]}
    >
      {hub.total > HUB_LIST_LIMIT && (
        <p className="mt-6 text-sm">
          <Link
            href="/plugins/all/1"
            className="underline underline-offset-4 hover:text-brand-500"
          >
            {t("hub.viewAllIndex")} →
          </Link>
        </p>
      )}
      <PluginFacetNav
        title={t("hub.browseTags")}
        base="/plugins/t"
        facets={navTags}
        activeSlug={tag}
        prefix="#"
      />
    </PluginHubShell>
  );
}
