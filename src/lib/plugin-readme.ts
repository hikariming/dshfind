import { cache } from "react";

import { getDb } from "./db";

/**
 * 详情页 README：由 scripts/fetch-readmes.mjs 在同步时抓取、渲染并净化，存在
 * D1 plugin_readmes 表。页面只读、不渲染 Markdown——详情页的 CPU 预算见
 * docs/native-page-cache.md。
 */
export interface PluginReadme {
  /** ok：html 可直接展示；too_large：只给 GitHub 链接。 */
  status: "ok" | "too_large";
  /** 已净化的 HTML（脚本、事件属性、javascript: 链接在入库前剥掉）。 */
  html: string | null;
  truncated: boolean;
  /** README 在仓库内的路径，拼「在 GitHub 查看」的链接用。 */
  path: string | null;
  fetchedAt: string;
}

/** 超时就当没有：README 是锦上添花，不能拖慢或拖垮详情页。 */
const README_TIMEOUT_MS = 5_000;

export const getPluginReadme = cache(
  async (fullName: string): Promise<PluginReadme | null> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const rs = await Promise.race([
        getDb().execute({
          sql: `SELECT status, html, truncated, path, fetched_at
                FROM plugin_readmes
                WHERE full_name = ? AND status IN ('ok', 'too_large')
                LIMIT 1`,
          args: [fullName],
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("README 查询超时")), README_TIMEOUT_MS);
        }),
      ]);
      const r = rs.rows[0];
      if (!r) return null;
      const status = String(r.status) as PluginReadme["status"];
      const html = r.html == null ? null : String(r.html);
      if (status === "ok" && !html) return null;
      return {
        status,
        html,
        truncated: Boolean(r.truncated),
        path: r.path == null ? null : String(r.path),
        fetchedAt: String(r.fetched_at ?? ""),
      };
    } catch {
      // 表还没建（首轮抓取前）、构建期无库、查询超时：一律不展示 README
      return null;
    } finally {
      clearTimeout(timer);
    }
  },
);
