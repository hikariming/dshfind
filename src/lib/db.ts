import { createClient, type Client } from "@libsql/client/web";

let client: Client | null = null;

/**
 * Turso 客户端惰性单例。
 * libsql:// 改写成 https://：强制走无状态 HTTP 而不是 WebSocket——
 * serverless 函数里连接不复用，握手成本只会白付。
 */
export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      throw new Error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 环境变量");
    }
    client = createClient({
      url: url.replace(/^libsql:\/\//, "https://"),
      authToken,
    });
  }
  return client;
}
