import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import { ThemeProvider } from "@/components/theme-provider";
import { LessonProgressProvider } from "@/components/lesson-progress";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SponsorBanner } from "@/components/sponsor-banner";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localeUrl, ogLocales } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });

  // canonical/hreflang 是页面级信息，由各页面自己声明，避免子页继承错误的 canonical。
  return {
    title: {
      default: t("siteTitle"),
      template: "%s · dshfind",
    },
    description: t("siteDescription"),
    openGraph: {
      type: "website",
      siteName: "dshfind",
      url: localeUrl(locale as Locale),
      title: t("siteTitle"),
      description: t("siteDescription"),
      locale: ogLocales[locale as Locale],
    },
    twitter: {
      card: "summary",
      title: t("siteTitle"),
      description: t("siteDescription"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SponsorBanner />
        <SiteHeader />
        <main className="flex-1">
          <LessonProgressProvider>{children}</LessonProgressProvider>
        </main>
        <SiteFooter />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
