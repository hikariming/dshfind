import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";

import { ThemeProvider } from "@/components/theme-provider";
import { NotFoundContent } from "@/components/not-found-content";
import {
  getLocaleFromCookie,
  isLocale,
  type Locale,
} from "@/i18n/config";

/**
 * 全局 404：未匹配任何路由的 URL 都落到这里（包括 /zh/不存在的路径）。
 *
 * 与 segment 级 not-found 不同，这里**不**经过 [locale]/layout.tsx——
 * 因此 ThemeProvider / NextIntlClientProvider / 站点头尾都要自己包。
 * locale 从 next-intl 中间件写入的 `X-NEXT-INTL-LOCALE` 头读取，
 * 回退到 NEXT_LOCALE cookie，再回退到默认语言。
 */
export default async function RootNotFound() {
  const h = await headers();
  const c = await cookies();

  const headerLocale = h.get("X-NEXT-INTL-LOCALE");
  const locale: Locale = isLocale(headerLocale ?? "")
    ? (headerLocale as Locale)
    : getLocaleFromCookie(c.get("NEXT_LOCALE")?.value);

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <NotFoundContent />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
