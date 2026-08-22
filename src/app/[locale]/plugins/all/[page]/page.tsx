import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { PluginHubShell } from "@/components/plugin-hub-shell";
import { isLocale, type Locale } from "@/i18n/config";
import { allIndexPage, allIndexPageCount } from "@/lib/plugin-hubs";
import { pageAlternates } from "@/lib/site";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/structured-data";

type Params = Promise<{ locale: string; page: string }>;

export const revalidate = 86400;

/**
 * 全量分页索引：唯一保证「每个插件详情页都有站内链接指进去」的机制。
 *
 * 分类/标签/语言 hub 各自只列前 HUB_LIST_LIMIT 条（它们的职责是排名），
 * 剩下的长尾插件全靠这里。所以这些页必须全部预渲染——它们是爬虫的通路，
 * 按需渲染意味着爬虫第一次来就得等函数冷启动。
 */
export function generateStaticParams() {
  return Array.from({ length: allIndexPageCount() }, (_, i) => ({
    page: String(i + 1),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await params;
  if (!isLocale(locale)) return {};
  const data = allIndexPage(Number(page));
  if (!data) return { robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "Meta" });
  const title = t("hubAllTitle", {
    page: data.page,
    pageCount: data.pageCount,
  });
  const description = t("hubAllDescription", {
    total: data.total,
    page: data.page,
    pageCount: data.pageCount,
  });

  return {
    title,
    description,
    alternates: pageAlternates(locale, `/plugins/all/${data.page}`),
    openGraph: { title, description },
  };
}

export default async function AllPluginsIndexPage({
  params,
}: {
  params: Params;
}) {
  const { locale, page } = await params;
  setRequestLocale(locale);
  const data = allIndexPage(Number(page));
  if (!data || !isLocale(locale)) notFound();

  const t = await getTranslations("Plugins");
  const loc = locale as Locale;
  const heading = t("hub.allHeading");

  const crumbs = [
    { name: "dshfind", path: "" },
    { name: t("title"), path: "/plugins" },
    { name: heading, path: `/plugins/all/${data.page}` },
  ];

  // 页码窗口：当前页前后各两页，两端始终保留首末页，中间用省略号
  const window = new Set<number>([1, data.pageCount]);
  for (let p = data.page - 2; p <= data.page + 2; p++) {
    if (p >= 1 && p <= data.pageCount) window.add(p);
  }
  const pages = [...window].sort((a, b) => a - b);

  return (
    <PluginHubShell
      locale={locale}
      crumbs={crumbs}
      heading={heading}
      countLine={t("hub.pageOf", {
        page: data.page,
        pageCount: data.pageCount,
      })}
      plugins={data.plugins}
      jsonLd={[
        breadcrumbJsonLd(loc, crumbs),
        itemListJsonLd(loc, heading, data.plugins),
      ]}
    >
      <nav
        aria-label="Pagination"
        className="mt-8 flex flex-wrap items-center justify-center gap-1.5 border-t border-border/60 pt-6 text-sm"
      >
        {data.page > 1 && (
          <Link
            href={`/plugins/all/${data.page - 1}`}
            className="rounded-lg border border-border/60 px-3 py-1.5 hover:border-brand-500/60"
            rel="prev"
          >
            {t("hub.prev")}
          </Link>
        )}
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1.5">
            {i > 0 && pages[i - 1] !== p - 1 && (
              <span className="px-1 text-muted-foreground">…</span>
            )}
            {p === data.page ? (
              <span
                aria-current="page"
                className="rounded-lg bg-muted px-3 py-1.5 font-semibold tabular-nums"
              >
                {p}
              </span>
            ) : (
              <Link
                href={`/plugins/all/${p}`}
                className="rounded-lg border border-border/60 px-3 py-1.5 tabular-nums hover:border-brand-500/60"
              >
                {p}
              </Link>
            )}
          </span>
        ))}
        {data.page < data.pageCount && (
          <Link
            href={`/plugins/all/${data.page + 1}`}
            className="rounded-lg border border-border/60 px-3 py-1.5 hover:border-brand-500/60"
            rel="next"
          >
            {t("hub.next")}
          </Link>
        )}
      </nav>
    </PluginHubShell>
  );
}
