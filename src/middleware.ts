import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { defaultLocale, locales } from "@/i18n/config";
import { isGateEnabled, verifySession } from "@/lib/auth";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

function getLocaleFromPath(pathname: string): string {
  const first = pathname.split("/")[1];
  return (locales as readonly string[]).includes(first)
    ? first
    : defaultLocale;
}

/**
 * 语言路由（/ → /zh、非法前缀重定向、内部重写）+ 可选登录门禁。
 */
export async function middleware(request: NextRequest) {
  // 登录门禁（可选）：仅 AUTH_GATE=1 且配置了 OAuth 时启用。
  // 门槛只有「有没有登录」——任何 GitHub 账号都算数，不存在被拒之门外的人。
  if (isGateEnabled()) {
    const pathname = request.nextUrl.pathname;
    const locale = getLocaleFromPath(pathname);
    const user = await verifySession(
      request.cookies.get("dshfind_session")?.value
    );

    if (!user) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      const from = pathname.replace(/^\/(zh|en|ja|ko)/, "") || "/";
      loginUrl.searchParams.set("from", from);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 语言路由处理（含 / → 默认语言重定向、前缀校验）
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // robots.txt / sitemap.xml 必须放行，否则会被语言重定向（或登录门禁）拦下，谷歌抓不到
    "/((?!api|_next|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js|txt|xml|webmanifest|woff2?)$).*)",
  ],
};
