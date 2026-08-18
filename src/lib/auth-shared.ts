/**
 * 会话里客户端也要用的部分（类型 + cookie 名）。
 * 单独成文件：user-chip 等 client component 不能 import auth.ts——
 * 会把 jose 整个拖进客户端 bundle。
 */

export const SESSION_COOKIE = "dshfind_session";

export interface SessionUser {
  login: string;
  name: string | null;
  avatar: string | null;
}
