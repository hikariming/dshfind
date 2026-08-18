/**
 * 会话里客户端也要用的部分（类型 + cookie 名）。
 * 单独成文件：user-chip 等 client component 不能 import auth.ts——
 * 会把 jose 整个拖进客户端 bundle。
 */

export const SESSION_COOKIE = "dshfind_session";

/**
 * 非 httpOnly 的登录标记，由 Go API 与会话 cookie 成对设置/清除。
 * 会话 cookie 浏览器 JS 读不到，登录态只能问 /api/auth/me 并缓存；这面旗是
 * 客户端唯一能直接看见的信号，用来判断"缓存里的未登录是不是登录前的旧答案"。
 */
export const SIGNED_IN_COOKIE = "dshfind_signed_in";

/** 标签页级的 /api/auth/me 结果缓存键；登录跳转前要清掉它。 */
export const SESSION_CACHE_KEY = "dshfind:me";

export interface SessionUser {
  login: string;
  name: string | null;
  avatar: string | null;
}
