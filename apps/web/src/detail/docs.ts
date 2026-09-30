/**
 * 文档页的运行时数据（按需渲染，仅在 Worker 里执行）。正文存 D1 docs_pages（四语言全量 3-4MB，
 * 进不了产物；重译一篇也不必重新部署），与老站 src/lib/docs-db.ts 同一条 SQL。
 * 读库失败直接抛 → 页面 5xx → 老站路由器回落 Next。
 */
import { env } from "cloudflare:workers";

import type { DocPage } from "@/lib/docs-db";
import type { CardPlugin } from "~/components/PluginCardList.astro";
import { query } from "~/detail/data";

export async function getDocPage(section: string, slug: string, locale: string): Promise<DocPage | null> {
  const r = (
    await query(
      `SELECT section, slug, locale, title, summary, body, source_path,
              source_sha, is_translated, nav_order, updated_at
       FROM docs_pages WHERE section = ? AND slug = ? AND locale = ?`,
      section,
      slug,
      locale,
    )
  )[0];
  if (!r) return null;
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

/** 键：`${locale}:${section}/${slug}`；没有相关内容的文档不出现 */
export type DocsSidecar = Record<string, { p: CardPlugin[]; l: { href: string; title: string }[] }>;

let sidecar: Promise<DocsSidecar> | null = null;

/** 读构建期旁车（按 isolate 缓存）；读不到就当没有相关内容，不影响正文 */
export async function getDocRelated(locale: string, section: string, slug: string, base: URL) {
  sidecar ??= (env as unknown as { ASSETS: { fetch(u: URL): Promise<Response> } }).ASSETS.fetch(new URL("/sidecar/docs.json", base))
    .then((r) => (r.ok ? (r.json() as Promise<DocsSidecar>) : {}))
    .catch(() => ({}));
  return (await sidecar)[`${locale}:${section}/${slug}`] ?? { p: [], l: [] };
}
