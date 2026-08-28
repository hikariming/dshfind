/**
 * GitHub OAuth + HS256 会话，逐项复刻 server/internal/httpapi/auth.go。
 *
 * 无缝切换的三个硬前提（都已实测线上 Go 的行为核对）：
 *   1. AUTH_SECRET 与 Go 完全相同——已登录用户的 JWT 两边都能验；
 *   2. Cookie 属性完全相同（Domain=dshfind.com、Path=/、Secure、SameSite=Lax、
 *      HttpOnly）——浏览器才会把旧 cookie 继续发来、新 cookie 正确覆盖；
 *   3. GitHub OAuth 的 callback URL 不变（api.dshfind.com/auth/github/callback）。
 *
 * JWT 载荷字段序照 Go struct：{login,name,avatar,iat,exp}，name/avatar 是
 * 指针无 omitempty——null 也要输出。签名对 Go 签发的 token 双向兼容。
 */
import { rateAllow, hashedIPKey, rateConfig } from "./ratelimit.mjs";

export const SESSION_COOKIE = "dshfind_session";
const SIGNED_IN_COOKIE = "dshfind_signed_in";
const OAUTH_STATE_COOKIE = "dshfind_oauth_state";
const OAUTH_RETURN_COOKIE = "dshfind_oauth_return_to";
const OAUTH_VERIFIER_COOKIE = "dshfind_oauth_verifier";
const OAUTH_STATE_LIFETIME_SEC = 600;
const SESSION_LIFETIME_SEC = 7 * 24 * 3600;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const goEscape = (s) =>
  s
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

// ── base64url（对齐 Go 的 RawURLEncoding：无填充、严格字符集）────────────────

const b64urlEncodeBytes = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function b64urlDecodeBytes(s) {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null;
  try {
    const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

// ── HS256 ────────────────────────────────────────────────────────────────────

async function hmacKey(secret, usages) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
}

/** 复刻 signSession：header/payload 各自 json.Marshal（带 HTML 转义）。 */
export async function signSession(env, user) {
  const secret = env.AUTH_SECRET ?? "";
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlEncodeBytes(encoder.encode(goEscape(JSON.stringify({ alg: "HS256", typ: "JWT" }))));
  const payload = b64urlEncodeBytes(
    encoder.encode(
      goEscape(
        JSON.stringify({
          login: user.login,
          name: user.name ?? null,
          avatar: user.avatar ?? null,
          iat: now,
          exp: now + SESSION_LIFETIME_SEC,
        }),
      ),
    ),
  );
  const input = `${header}.${payload}`;
  const key = await hmacKey(secret, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(input)));
  return `${input}.${b64urlEncodeBytes(sig)}`;
}

/** 复刻 verifySession：alg 必须 HS256、签名恒定时间校验、login 非空、未过期。 */
export async function verifySession(env, token) {
  const secret = env.AUTH_SECRET ?? "";
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const headerBytes = b64urlDecodeBytes(parts[0]);
  if (!headerBytes) return null;
  let header;
  try {
    header = JSON.parse(decoder.decode(headerBytes));
  } catch {
    return null;
  }
  if (header?.alg !== "HS256") return null;
  const sig = b64urlDecodeBytes(parts[2]);
  if (!sig) return null;
  const key = await hmacKey(secret, ["verify"]);
  const ok = await crypto.subtle.verify("HMAC", key, sig, encoder.encode(`${parts[0]}.${parts[1]}`));
  if (!ok) return null;
  const payloadBytes = b64urlDecodeBytes(parts[1]);
  if (!payloadBytes) return null;
  let claims;
  try {
    claims = JSON.parse(decoder.decode(payloadBytes));
  } catch {
    return null;
  }
  if (typeof claims?.login !== "string" || claims.login === "") return null;
  if (!Number.isFinite(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000)) return null;
  return { login: claims.login, name: claims.name ?? null, avatar: claims.avatar ?? null };
}

// ── Cookie 读写（属性与顺序照 net/http 的输出）───────────────────────────────

export function cookieValue(request, name) {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return "";
}

const httpDate = (ms) => new Date(ms).toUTCString();

function config(env) {
  return {
    webURL: (env.WEB_URL ?? "https://dshfind.com").replace(/\/+$/, ""),
    apiPublicURL: (env.API_PUBLIC_URL ?? "https://api.dshfind.com").replace(/\/+$/, ""),
    cookieDomain: (env.AUTH_COOKIE_DOMAIN ?? "dshfind.com").replace(/^\./, ""),
    clientID: env.GITHUB_CLIENT_ID ?? "",
    clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
    authSecret: env.AUTH_SECRET ?? "",
    forumAdmins: (env.FORUM_ADMIN_LOGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

const secureCookies = (cfg) => cfg.apiPublicURL.startsWith("https://");

/** oauth 三兄弟：Path=/auth/github、10 分钟、HttpOnly。 */
function oauthCookie(cfg, name, value, lifetimeSec) {
  let s = `${name}=${value}; Path=/auth/github`;
  if (lifetimeSec > 0) s += `; Expires=${httpDate(Date.now() + lifetimeSec * 1000)}; Max-Age=${lifetimeSec}`;
  else s += `; Expires=${httpDate(1000)}; Max-Age=0`;
  s += "; HttpOnly";
  if (secureCookies(cfg)) s += "; Secure";
  s += "; SameSite=Lax";
  return s;
}

function sessionCookieStr(cfg, name, value, maxAge, httpOnly) {
  let s = `${name}=${value}; Path=/`;
  if (cfg.cookieDomain) s += `; Domain=${cfg.cookieDomain}`;
  if (maxAge > 0) s += `; Expires=${httpDate(Date.now() + maxAge * 1000)}; Max-Age=${maxAge}`;
  else s += `; Expires=${httpDate(1000)}; Max-Age=0`;
  if (httpOnly) s += "; HttpOnly";
  if (secureCookies(cfg)) s += "; Secure";
  s += "; SameSite=Lax";
  return s;
}

function clearOAuthCookies(cfg, headers) {
  for (const name of [OAUTH_STATE_COOKIE, OAUTH_RETURN_COOKIE, OAUTH_VERIFIER_COOKIE]) {
    headers.append("Set-Cookie", oauthCookie(cfg, name, "", 0));
  }
}

// ── returnTo / locale（validReturnTo / localeFromReturnTo 直译）──────────────

export function validReturnTo(raw) {
  if (!raw) return "/";
  let u;
  try {
    u = new URL(raw, "http://placeholder.local");
  } catch {
    return "/";
  }
  // Go 的 url.Parse 是相对解析；u.IsAbs()/Host 检查这里换成手工判定
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return "/"; // 绝对 URL
  if (raw.startsWith("//") || raw.includes("\\")) return "/";
  if (!u.pathname.startsWith("/")) return "/";
  return raw;
}

function localeFromReturnTo(returnTo) {
  const path = validReturnTo(returnTo);
  const part = path.replace(/^\//, "").split("/")[0].split("?")[0].split("#")[0];
  return ["zh", "en", "ja", "ko"].includes(part) ? part : "zh";
}

const frontendURL = (cfg, returnTo) => new URL(validReturnTo(returnTo), cfg.webURL + "/").toString();

function loginErrorRedirect(cfg, returnTo, code, extraHeaders) {
  const headers = new Headers(extraHeaders);
  headers.set("Location", `${cfg.webURL}/${localeFromReturnTo(returnTo)}/login?error=${encodeURIComponent(code)}`);
  return new Response(null, { status: 302, headers });
}

// ── CORS（setAuthCORS / setCredentialedCORS 直译）────────────────────────────

/** /auth/me 专用：无 Origin 放行（非浏览器只读），有 Origin 必须是本站。 */
function setAuthCORS(cfg, request, headers) {
  const origin = request.headers.get("Origin") ?? "";
  if (origin === "") return true;
  if (origin !== cfg.webURL) return false;
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.append("Vary", "Origin");
  return true;
}

/** 带 Cookie 的写端点专用：必须有 Origin 且正好等于本站。 */
export function setCredentialedCORS(env, request, headers) {
  const cfg = config(env);
  const origin = request.headers.get("Origin") ?? "";
  if (origin === "" || origin !== cfg.webURL) return false;
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.append("Vary", "Origin");
  return true;
}

export function credentialedPreflight(env, request, methods) {
  const headers = new Headers();
  if (!setCredentialedCORS(env, request, headers)) {
    return jsonError(403, "forbidden", "origin is not allowed", new Headers());
  }
  headers.set("Access-Control-Allow-Methods", methods);
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}

/** 复刻 writeError：{"error":{code,message,retry_after?}} + 尾换行。 */
export function jsonError(status, code, message, headers, retryAfterSec) {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json; charset=utf-8");
  const body = { code, message };
  if (retryAfterSec > 0) {
    h.set("Retry-After", String(retryAfterSec));
    body.retry_after = retryAfterSec;
  }
  return new Response(goEscape(JSON.stringify({ error: body })) + "\n", { status, headers: h });
}

/** 复刻 writeJSON 的尾换行 + HTML 转义。 */
export function writeJSON(status, value, headers) {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json; charset=utf-8");
  return new Response(goEscape(JSON.stringify(value)) + "\n", { status, headers: h });
}

// ── 限流（authLimited 直译）──────────────────────────────────────────────────

async function authLimited(env, request) {
  const rc = rateConfig(env);
  const ipKey = await hashedIPKey(request);
  return rateAllow(env, [
    { key: `auth:${ipKey}`, perMinute: rc.authPerMin, burst: rc.authBurst },
    { key: "global:auth", perMinute: rc.authGlobalPerMin, burst: rc.authGlobalBurst, pinned: true },
  ]);
}

const randomState = () => b64urlEncodeBytes(crypto.getRandomValues(new Uint8Array(32)));

async function pkceChallenge(verifier) {
  const sum = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  return b64urlEncodeBytes(new Uint8Array(sum));
}

// ── HTTP handlers ────────────────────────────────────────────────────────────

/** GET /auth/github —— 开始 OAuth。 */
export async function handleGitHubLogin(request, env, url) {
  const cfg = config(env);
  const gate = await authLimited(env, request);
  if (!gate.allowed) {
    return jsonError(429, "rate_limited", "too many requests", new Headers(), gate.retryAfterSec + 1);
  }
  const returnTo = validReturnTo(url.searchParams.get("return_to") ?? "");
  if (!cfg.clientID || !cfg.clientSecret || !cfg.authSecret) {
    return loginErrorRedirect(cfg, returnTo, "not_configured");
  }
  const state = randomState();
  const verifier = randomState();
  const headers = new Headers();
  headers.append("Set-Cookie", oauthCookie(cfg, OAUTH_STATE_COOKIE, state, OAUTH_STATE_LIFETIME_SEC));
  headers.append("Set-Cookie", oauthCookie(cfg, OAUTH_RETURN_COOKIE, returnTo, OAUTH_STATE_LIFETIME_SEC));
  headers.append("Set-Cookie", oauthCookie(cfg, OAUTH_VERIFIER_COOKIE, verifier, OAUTH_STATE_LIFETIME_SEC));
  // 参数按字母序拼（Go url.Values.Encode 的行为）；不申请任何 scope
  const q = new URLSearchParams();
  q.set("client_id", cfg.clientID);
  q.set("code_challenge", await pkceChallenge(verifier));
  q.set("code_challenge_method", "S256");
  q.set("redirect_uri", `${cfg.apiPublicURL}/auth/github/callback`);
  q.set("state", state);
  headers.set("Location", `https://github.com/login/oauth/authorize?${q}`);
  return new Response(null, { status: 302, headers });
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** GET /auth/github/callback —— code 换 token、读身份、签 JWT。 */
export async function handleGitHubCallback(request, env, url) {
  const cfg = config(env);
  const gate = await authLimited(env, request);
  if (!gate.allowed) {
    return jsonError(429, "rate_limited", "too many requests", new Headers(), gate.retryAfterSec + 1);
  }
  const returnTo = validReturnTo(cookieValue(request, OAUTH_RETURN_COOKIE));
  const fail = (code) => {
    const headers = new Headers();
    clearOAuthCookies(cfg, headers);
    return loginErrorRedirect(cfg, returnTo, code, headers);
  };

  if (!cfg.clientID || !cfg.clientSecret || !cfg.authSecret) return fail("not_configured");
  const state = url.searchParams.get("state") ?? "";
  const verifier = cookieValue(request, OAUTH_VERIFIER_COOKIE);
  if (!state || !verifier || !constantTimeEqual(state, cookieValue(request, OAUTH_STATE_COOKIE))) {
    return fail("invalid_state");
  }
  if (url.searchParams.get("error")) return fail("oauth_denied");
  const code = url.searchParams.get("code") ?? "";
  if (!code) return fail("invalid_callback");

  let accessToken;
  try {
    const form = new URLSearchParams({
      client_id: cfg.clientID,
      client_secret: cfg.clientSecret,
      code,
      code_verifier: verifier,
      redirect_uri: `${cfg.apiPublicURL}/auth/github/callback`,
    });
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`token endpoint ${res.status}`);
    const body = await res.json();
    accessToken = body?.access_token;
    if (!accessToken) throw new Error("no access_token");
  } catch {
    return fail("token_exchange_failed");
  }

  let user;
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "dshfind-api",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`user endpoint ${res.status}`);
    user = await res.json();
    if (!user?.login) throw new Error("no login");
  } catch {
    return fail("user_fetch_failed");
  }

  let token;
  try {
    token = await signSession(env, { login: user.login, name: user.name ?? null, avatar: user.avatar_url ?? null });
  } catch {
    return fail("oauth_unavailable");
  }
  const headers = new Headers();
  clearOAuthCookies(cfg, headers);
  headers.append("Set-Cookie", sessionCookieStr(cfg, SESSION_COOKIE, token, SESSION_LIFETIME_SEC, true));
  headers.append("Set-Cookie", sessionCookieStr(cfg, SIGNED_IN_COOKIE, "1", SESSION_LIFETIME_SEC, false));
  headers.set("Location", frontendURL(cfg, returnTo));
  return new Response(null, { status: 302, headers });
}

/** GET /auth/me —— 读当前会话；未登录回 {"user":null} 而不是 401。 */
export async function handleAuthMe(request, env) {
  const cfg = config(env);
  const gate = await authLimited(env, request);
  if (!gate.allowed) {
    return jsonError(429, "rate_limited", "too many requests", new Headers(), gate.retryAfterSec + 1);
  }
  const headers = new Headers();
  if (!setAuthCORS(cfg, request, headers)) {
    return jsonError(403, "forbidden", "origin is not allowed", new Headers());
  }
  const user = await verifySession(env, cookieValue(request, SESSION_COOKIE));
  return writeJSON(200, { user }, headers);
}

/** OPTIONS /auth/me。 */
export async function handleAuthMePreflight(request, env) {
  const cfg = config(env);
  const headers = new Headers();
  if (!setAuthCORS(cfg, request, headers)) {
    return jsonError(403, "forbidden", "origin is not allowed", new Headers());
  }
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}

/** POST /auth/logout —— 只允许本站 Origin，清 cookie 后 303 回站内。 */
export async function handleLogout(request, env, url) {
  const cfg = config(env);
  const gate = await authLimited(env, request);
  if (!gate.allowed) {
    return jsonError(429, "rate_limited", "too many requests", new Headers(), gate.retryAfterSec + 1);
  }
  if ((request.headers.get("Origin") ?? "") !== cfg.webURL) {
    return jsonError(403, "forbidden", "origin is not allowed", new Headers());
  }
  const returnTo = validReturnTo(url.searchParams.get("return_to") ?? "");
  const headers = new Headers();
  headers.append("Set-Cookie", sessionCookieStr(cfg, SESSION_COOKIE, "", 0, true));
  headers.append("Set-Cookie", sessionCookieStr(cfg, SIGNED_IN_COOKIE, "", 0, false));
  headers.set("Location", frontendURL(cfg, returnTo));
  return new Response(null, { status: 303, headers });
}

/** 论坛管理员判定（announce 板准入）。 */
export function isForumAdmin(env, login) {
  return config(env).forumAdmins.some((admin) => admin.toLowerCase() === login.toLowerCase());
}
