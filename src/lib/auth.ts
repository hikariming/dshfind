import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "dshfind_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export interface SessionUser {
  login: string;
  name: string | null;
  avatar: string | null;
  isMember: boolean;
}

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ?? process.env.GITHUB_CLIENT_SECRET ?? "";
  if (!secret) {
    throw new Error(
      "缺少 AUTH_SECRET 或 GITHUB_CLIENT_SECRET，无法签发会话。"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.login !== "string" ||
      typeof payload.isMember !== "boolean"
    ) {
      return null;
    }
    return {
      login: payload.login,
      name: typeof payload.name === "string" ? payload.name : null,
      avatar: typeof payload.avatar === "string" ? payload.avatar : null,
      isMember: payload.isMember,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function getAppUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3100").replace(/\/$/, "");
}

export function getOrg(): string {
  return process.env.GITHUB_ORG ?? "dsh-external";
}

/**
 * 登录门禁是否生效：默认关闭（任何人可访问网站，登录功能仍可用）。
 * 部署时设置 AUTH_GATE=1 并配置好 GITHUB_CLIENT_ID/SECRET 后，门禁才开启：
 * 仅 GITHUB_ORG 组织成员可访问，其余跳转 /login 或 /unauthorized。
 */
export function isGateEnabled(): boolean {
  return process.env.AUTH_GATE === "1" && Boolean(process.env.GITHUB_CLIENT_ID);
}
