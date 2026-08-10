import { NextRequest, NextResponse } from "next/server";
import { isGateEnabled, verifySession } from "@/lib/auth";

/**
 * 全站门禁（默认关闭）：设置 AUTH_GATE=1 并配置 GitHub OAuth 后启用，
 * 届时仅 dsh-external 组织成员可访问。
 * - 未登录 → 重定向 /login
 * - 已登录但不是组织成员 → 重定向 /unauthorized
 */
export async function middleware(request: NextRequest) {
  if (!isGateEnabled()) {
    return NextResponse.next();
  }

  const user = await verifySession(
    request.cookies.get("dshfind_session")?.value
  );

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user.isMember) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|login|unauthorized|_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff2?)$).*)",
  ],
};
