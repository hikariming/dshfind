import { jwtVerify } from "jose";
import { SESSION_COOKIE, type SessionUser } from "./auth-shared";

export { SESSION_COOKIE, type SessionUser };

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "";
  if (!secret) {
    throw new Error("缺少 AUTH_SECRET，无法校验会话。");
  }
  return new TextEncoder().encode(secret);
}

export async function verifySession(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.login !== "string") return null;
    return {
      login: payload.login,
      name: typeof payload.name === "string" ? payload.name : null,
      avatar: typeof payload.avatar === "string" ? payload.avatar : null,
    };
  } catch {
    return null;
  }
}

/**
 * 登录门禁是否生效：默认关闭（任何人可匿名浏览，登录功能仍可用）。
 * 部署时设置 AUTH_GATE=1、AUTH_SECRET 和 NEXT_PUBLIC_API_BASE_URL 后，门禁才开启，
 * 但门槛只有「登录」这一条——任何 GitHub 账号登录后都能访问，不再校验组织成员。
 * GitHub OAuth 在 Go API 处理；Next 仅校验其签发的共享会话。
 */
export function isGateEnabled(): boolean {
  return (
    process.env.AUTH_GATE === "1" &&
    Boolean(process.env.AUTH_SECRET) &&
    Boolean(process.env.NEXT_PUBLIC_API_BASE_URL)
  );
}
