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
  // 登录门禁（可选）：仅 AUTH_GATE=1 且配置了 OAuth 时启用
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
    if (!user.isMember) {
      return NextResponse.redirect(
        new URL(`/${locale}/unauthorized`, request.url)
      );
    }
  }

  // 语言路由处理（含 / → 默认语言重定向、前缀校验）
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff2?)$).*)",
  ],
};
