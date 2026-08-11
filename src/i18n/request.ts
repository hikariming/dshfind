import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { getLocaleFromCookie } from "./config";

export default getRequestConfig(async () => {
  // 从 cookie 读取语言（NEXT_LOCALE，由语言切换器写入）
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = getLocaleFromCookie(cookieLocale);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
