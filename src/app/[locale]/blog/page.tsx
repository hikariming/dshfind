import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { Badge } from "@/components/ui/badge";
import { getAllPosts, getAllTags, localizedText } from "@/lib/blog";
import { pageAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    alternates: pageAlternates(locale, "/blog"),
  };
}

function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { locale } = await params;
  const { tag: activeTag } = await searchParams;
  const loc = (isLocale(locale) ? locale : "zh") as Locale;
  const t = await getTranslations("Blog");

  const tags = getAllTags();
  const posts = getAllPosts().filter(
    (p) => !activeTag || p.tags.includes(activeTag),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Badge asChild variant={activeTag ? "outline" : "default"}>
            <Link href="/blog">{t("allPosts")}</Link>
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag}
              asChild
              variant={activeTag === tag ? "default" : "outline"}
            >
              <Link href={{ pathname: "/blog", query: { tag } }}>
                {t(`tags.${tag}`)}
              </Link>
            </Badge>
          ))}
        </div>
      )}

      {/* 文章卡片流 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-2xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-brand-500/50 hover:bg-muted/40"
          >
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {t(`tags.${tag}`)}
                </Badge>
              ))}
            </div>
            <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400">
              {localizedText(post.title, loc)}
            </h2>
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {localizedText(post.summary, loc)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              <time dateTime={post.date}>{formatDate(post.date, loc)}</time>
              <span aria-hidden>·</span>
              <span>{post.author}</span>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
