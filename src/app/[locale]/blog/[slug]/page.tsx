import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { Badge } from "@/components/ui/badge";
import {
  getAllPosts,
  getPost,
  getPostContent,
  localizedText,
} from "@/lib/blog";
import { localeUrl, ogLocales, pageAlternates } from "@/lib/site";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = getPost(slug);
  if (!post) return {};
  const loc = locale as Locale;
  const title = localizedText(post.title, loc);
  const description = localizedText(post.summary, loc);
  const path = `/blog/${slug}`;
  return {
    title,
    description,
    alternates: pageAlternates(loc, path),
    openGraph: {
      type: "article",
      title,
      description,
      url: localeUrl(loc, path),
      locale: ogLocales[loc],
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: { card: "summary", title, description },
  };
}

function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const loc = (isLocale(locale) ? locale : "zh") as Locale;
  const t = await getTranslations("Blog");
  const Content = getPostContent(slug, loc).default;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-8 lg:py-14">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>

      <article className="mt-6">
        <header className="border-b border-border/60 pb-8">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge asChild key={tag} variant="secondary">
                <Link href={{ pathname: "/blog", query: { tag } }}>
                  {t(`tags.${tag}`)}
                </Link>
              </Badge>
            ))}
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {localizedText(post.title, loc)}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <time dateTime={post.date}>{formatDate(post.date, loc)}</time>
            <span aria-hidden>·</span>
            <span>{post.author}</span>
          </div>
        </header>

        <div className="mt-2">
          <Content />
        </div>
      </article>

      <div className="mt-12 border-t border-border/60 pt-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 transition-colors hover:underline dark:text-brand-400"
        >
          <ArrowLeft className="size-4" />
          {t("backToList")}
        </Link>
      </div>
    </div>
  );
}
