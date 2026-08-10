import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

/**
 * GET /api/auth/me —— 返回当前会话用户（供客户端组件读取）。
 */
export async function GET(request: NextRequest) {
  const user = await verifySession(
    request.cookies.get("dshfind_session")?.value
  );
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user });
}
