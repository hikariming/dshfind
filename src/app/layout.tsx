import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 各语言的 title/description 在 [locale]/layout.tsx 里生成；这里只放全站兜底。
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "dshfind",
  title: {
    default: "dshfind — DeepSeek Harness (DSH) Plugin Marketplace",
    template: "%s · dshfind",
  },
  keywords: [
    "DeepSeek Harness plugin",
    "dsh-plugin",
    "DSH plugin",
    "DeepSeek Harness",
    "DSH",
    "Cordis",
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
