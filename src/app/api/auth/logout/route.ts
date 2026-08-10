import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, sessionCookieOptions } from "@/lib/auth";

/**
 * POST /api/auth/logout —— 清除会话并回到登录页。
 */
export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", getAppUrl()));
  res.cookies.set(sessionCookieOptions().name, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}

/** 兼容直接访问链接的退出方式 */
export async function GET(request: NextRequest) {
  return POST(request);
}
