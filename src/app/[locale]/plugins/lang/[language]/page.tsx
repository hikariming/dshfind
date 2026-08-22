import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { PluginFacetNav } from "@/components/plugin-facet-nav";
import { PluginHubShell } from "@/components/plugin-hub-shell";
import { isLocale, type Locale } from "@/i18n/config";
import { HUB_LIST_LIMIT, languageHub, listLanguages } from "@/lib/plugin-hubs";
import { pageAlternates } from "@/lib/site";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/structured-data";

type Params = Promise<{ locale: string; language: string }>;

export const revalidate = 86400;

/** 语言 facet 只有十几个（阈值 MIN_LANGUAGE_PLUGINS），全部预渲染。 */
export function generateStaticParams() {
  return listLanguages().map((l) => ({ language: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, language } = await params;
  if (!isLocale(locale)) return {};
  const hub = languageHub(language);
  if (!hub) return { robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "Meta" });
  const title = t("hubLanguageTitle", { name: hub.name, count: hub.total });
  const description = t("hubLanguageDescription", {
    name: hub.name,
    count: hub.total,
  });

  return {
    title,
    description,
    alternates: pageAlternates(locale, `/plugins/lang/${language}`),
    openGraph: { title, description },
  };
}

export default async function LanguageHubPage({ params }: { params: Params }) {
  const { locale, language } = await params;
  setRequestLocale(locale);
  const hub = languageHub(language);
  if (!hub || !isLocale(locale)) notFound();

  const t = await getTranslations("Plugins");
  const loc = locale as Locale;
  const heading = t("hub.languageHeading", { name: hub.name });

  const crumbs = [
    { name: "dshfind", path: "" },
    { name: t("title"), path: "/plugins" },
    { name: hub.name, path: `/plugins/lang/${language}` },
  ];

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
        title={t("hub.browseLanguages")}
        base="/plugins/lang"
        facets={listLanguages()}
        activeSlug={language}
      />
    </PluginHubShell>
  );
}
