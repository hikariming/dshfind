import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, getOrg } from "@/lib/auth";

/**
 * GET /api/auth/github
 * 发起 GitHub OAuth：带上 state 防 CSRF，跳转到 GitHub 授权页。
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "服务端未配置 GITHUB_CLIENT_ID，请联系管理员。" },
      { status: 500 }
    );
  }

  // 生成 state 并存到短时 cookie，回调时校验
  const state =
    Math.random().toString(36).slice(2) + Date.now().toString(36);
  const res = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      `${getAppUrl()}/api/auth/github/callback`
    )}&scope=read:org&state=${state}`
  );
  res.cookies.set("dshfind_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
