import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { isLocale, type Locale } from "@/i18n/config";
import { docNavFor } from "@/lib/docs-manifest";
import { DOC_SECTIONS } from "@/lib/docs-sections";
import { jsonLdSafe } from "@/lib/json-ld";
import { pageAlternates } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  const title = t("docsTitle");
  const description = t("docsDescription");
  return {
    title,
    description,
    alternates: pageAlternates(locale, "/docs"),
    openGraph: { title, description },
  };
}

export default async function DocsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isLocale(locale)) notFound();

  const t = await getTranslations("Docs");
  const loc = locale as Locale;
  // 用构建期快照而不是查库：本页是预渲染的（revalidate 86400），而 CF 构建机
  // 拿不到 Worker 的运行时 secret，构建期查库会把这一页烤成空壳，最长空 24 小时。
  const nav = docNavFor(locale);

  const crumbs = [
    { name: "dshfind", path: "" },
    { name: t("title"), path: "/docs" },
  ];

  // 只列出真正有内容的板块——同步是分板块跑的，没跑过的板块不该露出空壳
  const sections = DOC_SECTIONS.filter((s) =>
    nav.some((n) => n.section === s.id),
  ).sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe(breadcrumbJsonLd(loc, crumbs)),
        }}
      />
      <BreadcrumbNav crumbs={crumbs} />
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
        {t("indexHeading")}
      </h1>
      <p className="mt-3 max-w-[70ch] leading-relaxed text-muted-foreground">
        {t("indexIntro")}
      </p>

      {sections.map((s) => {
        const items = nav
          .filter((n) => n.section === s.id)
          .sort((a, b) => a.navOrder - b.navOrder);
        return (
          <section key={s.id} className="mt-8">
            <h2 className="text-lg font-semibold">{t(`sections.${s.id}`)}</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {items.map((n) => (
                <li key={`${n.section}/${n.slug}`}>
                  <Link
                    href={
                      n.slug === "index"
                        ? `/docs/${n.section}`
                        : `/docs/${n.section}/${n.slug}`
                    }
                    className="block rounded-xl border border-border/60 bg-card px-4 py-3 text-sm transition-colors hover:border-brand-500/60"
                  >
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {sections.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          {t("indexIntro")}
        </p>
      )}
    </div>
  );
}
