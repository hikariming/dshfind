import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

import { ThemeProvider } from "@/components/theme-provider";
import { LessonProgressProvider } from "@/components/lesson-progress";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SponsorBanner } from "@/components/sponsor-banner";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localeUrl, ogLocales, SITE_URL } from "@/lib/site";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    metadataBase: new URL(SITE_URL),
    applicationName: "dshfind",
    title: {
      default: t("siteTitle"),
      template: "%s · dshfind",
    },
    description: t("siteDescription"),
    keywords: [
      "DeepSeek Harness plugin",
      "dsh-plugin",
      "DSH plugin",
      "DeepSeek Harness",
      "DSH",
      "Cordis",
    ],
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

// 这是全站唯一的根 layout（<html> 在 [locale] 段内，next-intl 静态渲染的标准结构）。
// 之前独立的 app/layout.tsx 里 getLocale() 走 headers()，把全站所有页面拖成动态渲染。
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

  // 搜索框直连 Go 后端(api.dshfind.com)时提前握手，摊平首次搜索的 TLS 延迟；
  // React 19 会把 <link> 自动提升进 <head>。
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          {apiBase && <link rel="preconnect" href={apiBase} />}
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
        <Analytics />
      </body>
    </html>
  );
}
