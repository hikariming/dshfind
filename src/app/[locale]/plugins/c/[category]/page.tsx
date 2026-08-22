import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { PluginFacetNav } from "@/components/plugin-facet-nav";
import { PluginHubShell } from "@/components/plugin-hub-shell";
import { isLocale, type Locale } from "@/i18n/config";
import { categoryHub, HUB_LIST_LIMIT, listCategories } from "@/lib/plugin-hubs";
import { pageAlternates } from "@/lib/site";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/structured-data";

type Params = Promise<{ locale: string; category: string }>;

/**
 * 数据全部来自构建期快照 realPlugins，内容只在部署时变化，
 * 所以 revalidate 取和详情页一致的 24 小时即可——纯粹是给按需渲染的页面兜底。
 */
export const revalidate = 86400;

/** 分类只有 9 个，全部预渲染，运行时不会有函数调用。 */
export function generateStaticParams() {
  return listCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isLocale(locale)) return {};
  const hub = categoryHub(category);
  if (!hub) return { robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "Meta" });
  const tp = await getTranslations({ locale, namespace: "Plugins" });
  const name = tp(`categories.${category}`);
  const title = t("hubCategoryTitle", { name, count: hub.total });
  const description = t("hubCategoryDescription", { name, count: hub.total });

  return {
    title,
    description,
    alternates: pageAlternates(locale, `/plugins/c/${category}`),
    openGraph: { title, description },
  };
}

export default async function CategoryHubPage({ params }: { params: Params }) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const hub = categoryHub(category);
  if (!hub || !isLocale(locale)) notFound();

  const t = await getTranslations("Plugins");
  const loc = locale as Locale;
  const name = t(`categories.${category}`);
  const heading = t("hub.categoryHeading", { name });

  const crumbs = [
    { name: "dshfind", path: "" },
    { name: t("title"), path: "/plugins" },
    { name, path: `/plugins/c/${category}` },
  ];

  const categories = listCategories();
  const labels: Record<string, string> = {};
  for (const c of categories) labels[c.slug] = t(`categories.${c.slug}`);

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
        title={t("hub.browseCategories")}
        base="/plugins/c"
        facets={categories}
        activeSlug={category}
        labels={labels}
      />
    </PluginHubShell>
  );
}
