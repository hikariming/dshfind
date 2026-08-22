import { cache } from "react";

import { getDb } from "./db";

/**
 * 文档中心的数据访问。
 *
 * 语料存 Turso 而非构建期快照：四语言全量估算 raw 3-4MB，进 Worker bundle
 * 会吃掉 10MB 上限的一大截（当前已用 4MB+），而且重译一篇就要重新部署。
 * 页面走 ISR，重验证时自然拿到新译文。
 */

/** 与 plugins-db 同一口径：Turso 抖动时按查询失败处理，页面走 notFound 或空列表。 */
const DB_TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}超时`)), DB_TIMEOUT_MS),
    ),
  ]);
}

export interface DocPage {
  section: string;
  slug: string;
  locale: string;
  title: string;
  summary: string | null;
  body: string;
  sourcePath: string;
  sourceSha: string;
  /** true = 本站翻译，false = 上游原文。决定页面上声明栏的措辞。 */
  isTranslated: boolean;
  navOrder: number;
  updatedAt: string;
}


function toPage(r: Record<string, string | number | null>): DocPage {
  return {
    section: String(r.section),
    slug: String(r.slug),
    locale: String(r.locale),
    title: String(r.title),
    summary: r.summary == null ? null : String(r.summary),
    body: String(r.body),
    sourcePath: String(r.source_path),
    sourceSha: String(r.source_sha),
    isTranslated: Boolean(r.is_translated),
    navOrder: Number(r.nav_order ?? 0),
    updatedAt: String(r.updated_at),
  };
}

/** 取一篇文档；不存在返回 null（页面 notFound）。 */
export const getDocPage = cache(
  async (
    section: string,
    slug: string,
    locale: string,
  ): Promise<DocPage | null> => {
    try {
      const rs = await withTimeout(
        getDb().execute({
          sql: `SELECT section, slug, locale, title, summary, body, source_path,
                       source_sha, is_translated, nav_order, updated_at
                FROM docs_pages
                WHERE section = ? AND slug = ? AND locale = ?`,
          args: [section, slug, locale],
        }),
        "文档查询",
      );
      return rs.rows[0] ? toPage(rs.rows[0]) : null;
    } catch (e) {
      console.error("getDocPage 失败", e);
      return null;
    }
  },
);
