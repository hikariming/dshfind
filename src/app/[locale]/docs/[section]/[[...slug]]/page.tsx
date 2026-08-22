import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DocsAttribution } from "@/components/docs-attribution";
import { Markdown } from "@/components/markdown";
import { PluginHubList } from "@/components/plugin-hub-list";
import { isLocale, type Locale } from "@/i18n/config";
import { getDocPage } from "@/lib/docs-db";
import { docNavFor } from "@/lib/docs-manifest";
import { rewriteDocLinks } from "@/lib/docs-links";
import { isIndexable, sectionById, sourceUrl } from "@/lib/docs-sections";
import { jsonLdSafe } from "@/lib/json-ld";
import { docRelatedLessons, docRelatedPlugins } from "@/lib/docs-related";
import { pageAlternates, SITE_URL } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/structured-data";

type Params = Promise<{ locale: string; section: string; slug?: string[] }>;

/**
 * 正文在 Turso，改一篇译文不必重新部署——ISR 重验证时自然拿到新内容。
 * 24 小时与插件详情页同一口径。
 */
export const revalidate = 86400;

/**
 * 不预渲染具体文档：路径来自数据库，构建期查一次 DB 只为拿到几十个 slug，
 * 却会把整份语料塞进构建。首次访问按需渲染后进 ISR 缓存，之后都是静态命中。
 */
export function generateStaticParams(): { section: string; slug?: string[] }[] {
  return [];
}

/** slug 段还原成库里的 slug：空数组（板块根）对应 "index"。 */
function toSlug(parts: string[] | undefined): string {
  return parts && parts.length > 0 ? parts.join("/") : "index";
}

/** 库里的 slug 还原成 URL 路径。 */
function toPath(section: string, slug: string): string {
  return slug === "index" ? `/docs/${section}` : `/docs/${section}/${slug}`;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, section, slug } = await params;
  if (!isLocale(locale)) return {};
  const cfg = sectionById(section);
  if (!cfg) return { robots: { index: false } };

  const doc = await getDocPage(section, toSlug(slug), locale);
  if (!doc) return { robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "Meta" });
  const title = t("docPageTitle", { title: doc.title });
  const description = doc.summary ?? undefined;

  return {
    title,
    description,
    alternates: pageAlternates(locale, toPath(section, doc.slug)),
    openGraph: { title, description },
    // 官方已发布板块的 zh/en 与官方逐字相同，收录只会稀释自己的抓取预算
    robots: isIndexable(cfg, locale) ? undefined : { index: false, follow: true },
  };
}

export default async function DocPage({ params }: { params: Params }) {
  const { locale, section, slug } = await params;
  setRequestLocale(locale);
  if (!isLocale(locale)) notFound();
  const cfg = sectionById(section);
  if (!cfg) notFound();

  const key = toSlug(slug);
  const doc = await getDocPage(section, key, locale);
  if (!doc) notFound();

  const t = await getTranslations("Docs");
  const loc = locale as Locale;

  // 同板块的其余文档：给每篇文档一条横向通路，避免只有「索引 → 文档」一棵树
  const nav = docNavFor(locale).filter((n) => n.section === section);
  const related = docRelatedPlugins(section, key);
  const relatedLessons = docRelatedLessons(section, key, locale);

  const crumbs = [
    { name: "dshfind", path: "" },
    { name: t("title"), path: "/docs" },
    { name: t(`sections.${section}`), path: `/docs/${section}` },
    ...(key === "index"
      ? []
      : [{ name: doc.title, path: toPath(section, key) }]),
  ];

  // TechArticle 而不是 Article：这是技术文档，且标注 isBasedOn 指回上游原文，
  // 明确表达「翻译自」而非「原创」，避免被判成抄袭型聚合。
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: doc.title,
    description: doc.summary || undefined,
    inLanguage: locale,
    dateModified: doc.updatedAt,
    isBasedOn: sourceUrl(doc.sourcePath),
    license: "https://opensource.org/licenses/MIT",
    url: `${SITE_URL}/${locale}${toPath(section, key)}`,
    isPartOf: {
      "@type": "WebSite",
      name: "dshfind",
      url: SITE_URL,
    },
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSafe(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe(breadcrumbJsonLd(loc, crumbs)),
        }}
      />

      <BreadcrumbNav crumbs={crumbs} />
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{doc.title}</h1>

      <DocsAttribution
        sourcePath={doc.sourcePath}
        isTranslated={doc.isTranslated}
        updatedAt={doc.updatedAt}
      />

      <article className="mt-6">
        <Markdown>{rewriteDocLinks(doc.body, locale, doc.sourcePath)}</Markdown>
      </article>

      {/* 同板块导航 */}
      {nav.length > 1 && (
        <section className="mt-10 border-t border-border/60 pt-6">
          <h2 className="text-sm font-semibold">{t("onThisSection")}</h2>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {nav.map((n) => (
              <li key={n.slug}>
                <Link
                  href={toPath(n.section, n.slug)}
                  className={`text-sm underline-offset-4 hover:underline ${
                    n.slug === key
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 三角内链的一条边：文档 → 插件。竞品目录站没有文档，
          散装文档博客没有插件目录，这条边只有本站连得起来。 */}
      {related.length > 0 && (
        <section className="mt-10 border-t border-border/60 pt-6">
          <h2 className="text-base font-semibold">{t("relatedPlugins")}</h2>
          <PluginHubList plugins={related} locale={locale} />
        </section>
      )}

      {/* 另一条边：文档 → 课程。官方文档讲「接口长什么样」，
          课程讲「为什么这么设计」，互补而不重复。 */}
      {relatedLessons.length > 0 && (
        <section className="mt-10 border-t border-border/60 pt-6">
          <h2 className="text-base font-semibold">{t("relatedLessons")}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {relatedLessons.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block rounded-xl border border-border/60 bg-card px-4 py-3 text-sm transition-colors hover:border-brand-500/60"
                >
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-sm">
        <Link
          href="/docs"
          className="underline underline-offset-4 hover:text-brand-500"
        >
          ← {t("backToDocs")}
        </Link>
      </p>
    </div>
  );
}
