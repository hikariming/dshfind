import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * GET /api/auth/me —— 客户端顶栏读取当前会话。
 *
 * 会话 cookie 由 Go API 签发（httpOnly），浏览器 JS 读不到，只能问这里。
 * 客户端用 sessionStorage 把结果缓存到标签页级（见 user-chip.tsx），
 * 每个访客最多来一次；这是全站页面能保持静态渲染的代价里最小的一种。
 */
export async function GET(request: NextRequest) {
  const user = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value
  );
  return NextResponse.json({ user });
}
