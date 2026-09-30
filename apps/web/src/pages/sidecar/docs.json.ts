/**
 * 文档页的构建期旁车：每种语言、每篇文档的「相关插件」（描述已按语言取好）与「相关课程」。
 * 这两块依赖全量插件快照（docs-related → plugin-hubs → plugins-real），文档页按需渲染，
 * 不能在 Worker 里算，所以在构建期算好成一份静态 JSON，运行时经 ASSETS binding 读取。
 */
import type { APIRoute } from "astro";

import { docRelatedLessons, docRelatedPlugins } from "@/lib/docs-related";
import { docManifest } from "@/lib/docs-manifest";
import { localizePluginDescription } from "@/lib/plugin-i18n";
import { locales } from "~/i18n";
import type { DocsSidecar } from "~/detail/docs";

export const GET: APIRoute = () => {
  const out: DocsSidecar = {};
  const keys = [...new Set(docManifest.map((d) => `${d.section}/${d.slug}`))];
  for (const locale of locales) {
    for (const key of keys) {
      const i = key.indexOf("/");
      const [section, slug] = [key.slice(0, i), key.slice(i + 1)];
      const plugins = docRelatedPlugins(section, slug).map((p) => ({
        fullName: p.fullName,
        name: p.name,
        owner: p.owner,
        description: localizePluginDescription(p.fullName, locale, p.description),
        stars: p.stars,
        score: p.score,
        language: p.language,
      }));
      const lessons = docRelatedLessons(section, slug, locale);
      if (plugins.length || lessons.length) out[`${locale}:${key}`] = { p: plugins, l: lessons };
    }
  }
  return new Response(JSON.stringify(out), { headers: { "content-type": "application/json" } });
};
