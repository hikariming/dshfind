import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PluginFacetNav } from "@/components/plugin-facet-nav";
import { isLocale, type Locale } from "@/i18n/config";
import { jsonLdSafe } from "@/lib/json-ld";
import {
  allIndexPageCount,
  listCategories,
  listLanguages,
  listTags,
} from "@/lib/plugin-hubs";
import { pageAlternates } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const revalidate = 86400;

/**
 * 聚合页总索引。
 *
 * 这一页的职责是让**全部** hub 可被发现——尤其是 272 个标签 hub：
 * 各个标签页的 facet 导航只互相露出前 60 个，剩下的两百多个若没有这一页
 * 就又是一批孤儿。全量索引的分页入口也挂在这里。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  const title = t("hubIndexTitle");
  const description = t("hubIndexDescription");
  return {
    title,
    description,
    alternates: pageAlternates(locale, "/plugins/browse"),
    openGraph: { title, description },
  };
}

export default async function BrowseIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isLocale(locale)) notFound();

  const t = await getTranslations("Plugins");
  const loc = locale as Locale;
  const heading = t("hub.indexHeading");

  const crumbs = [
    { name: "dshfind", path: "" },
    { name: t("title"), path: "/plugins" },
    { name: heading, path: "/plugins/browse" },
  ];

  const categories = listCategories();
  const labels: Record<string, string> = {};
  for (const c of categories) labels[c.slug] = t(`categories.${c.slug}`);

  const pageCount = allIndexPageCount();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe(breadcrumbJsonLd(loc, crumbs)),
        }}
      />
      <BreadcrumbNav crumbs={crumbs} />
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{heading}</h1>

      <PluginFacetNav
        title={t("hub.browseCategories")}
        base="/plugins/c"
        facets={categories}
        labels={labels}
      />
      <PluginFacetNav
        title={t("hub.browseLanguages")}
        base="/plugins/lang"
        facets={listLanguages()}
      />
      {/* 全部标签都列出来——这是 272 个标签 hub 唯一的完整入口 */}
      <PluginFacetNav
        title={t("hub.browseTags")}
        base="/plugins/t"
        facets={listTags()}
        prefix="#"
      />

      <section className="mt-10 border-t border-border/60 pt-6">
        <h2 className="text-sm font-semibold">{t("hub.browseAll")}</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/plugins/all/${p}`}
              className="rounded-lg border border-border/60 px-2.5 py-1 text-xs tabular-nums hover:border-brand-500/60"
            >
              {p}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
