import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, getLocaleFromCookie, isLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  // URL 前缀语言优先；无前缀时回退到 cookie（如 API 场景）
  let locale = await requestLocale;
  if (!locale) {
    locale = getLocaleFromCookie((await cookies()).get("NEXT_LOCALE")?.value);
  }
  if (!isLocale(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
