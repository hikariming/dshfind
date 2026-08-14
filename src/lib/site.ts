import { defaultLocale, locales, type Locale } from "@/i18n/config";

/** 站点正式域名，sitemap / canonical / OG 全部以它为准。 */
export const SITE_URL = "https://dshfind.com";

/** OpenGraph 用的地区化 locale 标识。 */
export const ogLocales: Record<Locale, string> = {
  zh: "zh_CN",
  en: "en_US",
  ja: "ja_JP",
  ko: "ko_KR",
};

/** 拼出某语言下某路径的完整 URL；path 需以 / 开头或为空。 */
export function localeUrl(locale: Locale, path = ""): string {
  return `${SITE_URL}/${locale}${path}`;
}

/** 同一路径在全部语言下的 hreflang 映射；x-default 指向默认语言（/ 会重定向过去）。 */
export function languageAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = localeUrl(locale, path);
  }
  languages["x-default"] = localeUrl(defaultLocale, path);
  return languages;
}

/** 页面 metadata.alternates：canonical 指向当前语言版本 + 全语言 hreflang。 */
export function pageAlternates(locale: Locale, path = "") {
  return {
    canonical: localeUrl(locale, path),
    languages: languageAlternates(path),
  };
}
