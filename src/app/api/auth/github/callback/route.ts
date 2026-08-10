import { NextRequest, NextResponse } from "next/server";
import {
  getAppUrl,
  getOrg,
  sessionCookieOptions,
  signSession,
  type SessionUser,
} from "@/lib/auth";

/**
 * GET /api/auth/github/callback
 * GitHub 授权回调：校验 state → 换 access_token → 校验组织成员 → 签发会话。
 */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const code = search.get("code");
  const state = search.get("state");
  const savedState = request.cookies.get("dshfind_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      new URL(`/login?error=invalid_state`, getAppUrl())
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/login?error=not_configured`, getAppUrl())
    );
  }

  // 1) 用 code 换 access_token
  let tokenRes: Response;
  try {
    tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${getAppUrl()}/api/auth/github/callback`,
      }),
    });
  } catch {
    return NextResponse.redirect(
      new URL(`/login?error=token_exchange_failed`, getAppUrl())
    );
  }
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error_description?: string;
  };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(tokenData.error_description ?? "no_token")}`, getAppUrl())
    );
  }

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // 2) 取用户信息
  let user: { login: string; name?: string | null; avatar_url?: string | null };
  try {
    const r = await fetch("https://api.github.com/user", {
      headers: authHeaders,
    });
    if (!r.ok) {
      return NextResponse.redirect(new URL(`/login?error=user_fetch_failed`, getAppUrl()));
    }
    user = (await r.json()) as typeof user;
  } catch {
    return NextResponse.redirect(new URL(`/login?error=user_fetch_failed`, getAppUrl()));
  }

  // 3) 校验组织成员（需要 read:org 权限）
  let isMember = false;
  try {
    const org = getOrg();
    const r = await fetch(
      `https://api.github.com/user/memberships/orgs/${org}`,
      { headers: authHeaders }
    );
    if (r.ok) {
      const data = (await r.json()) as { state?: string };
      isMember = data.state === "active";
    }
  } catch {
    isMember = false;
  }

  // 4) 签发会话（无论是否成员都登录，但带上 isMember 标记）
  const sessionUser: SessionUser = {
    login: user.login,
    name: user.name ?? null,
    avatar: user.avatar_url ?? null,
    isMember,
  };

  const response = NextResponse.redirect(
    new URL(isMember ? "/" : "/unauthorized", getAppUrl())
  );
  response.cookies.set(
    sessionCookieOptions().name,
    await signSession(sessionUser),
    sessionCookieOptions()
  );
  // 清理 state cookie
  response.cookies.set("dshfind_oauth_state", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
