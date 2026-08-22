import {
  categoryHub,
  tagHub,
  type HubPlugin,
} from "./plugin-hubs";

/**
 * 文档 → 插件的关联表。
 *
 * 这是「三角内链」里最难自动化的一条边：文档讲的是机制（事件系统、LLM 适配器），
 * 插件带的是 GitHub topic，两边词表对不上，纯关键词匹配会给出一堆噪音。
 * 所以用一张人工维护的小表：改动成本低、结果可预期，也不会因为上游文档
 * 措辞变化就把关联全部打乱。
 *
 * key 是 `<section>/<slug>`，value 按优先级排列的标签或分类 slug。
 * 没登记的文档就不显示关联插件——宁可空着，也不放不相关的链接。
 */
const DOC_PLUGIN_HINTS: Record<string, { tags?: string[]; categories?: string[] }> = {
  // 使用指南
  "guide/index": { categories: ["ui", "client"] },
  "guide/providers": { tags: ["llm", "openai", "provider"], categories: ["agent"] },
  "guide/python-sdk": { tags: ["python"] },

  // 插件开发
  "develop/index": { tags: ["dsh-plugin-market", "plugin"] },
  "develop/basic": { tags: ["plugin", "cordis"] },
  "develop/basic/config": { tags: ["plugin", "cordis"] },
  "develop/basic/tool": { tags: ["mcp", "developer-tools"], categories: ["tools"] },
  "develop/basic/publish": { tags: ["dsh-plugin-market", "plugin"] },
  "develop/framework": { tags: ["cordis", "plugin"] },
  "develop/framework/service": { tags: ["cordis"] },
  "develop/framework/events": { tags: ["cordis"] },
  "develop/practice": { tags: ["cordis", "agent"] },
  "develop/practice/llm-adapter": { tags: ["llm", "openai"], categories: ["agent"] },

  // 子系统（官方站没有网页版，是本站独有的收录）
  "subsystems/compaction": { tags: ["memory", "context"], categories: ["memory"] },
  "subsystems/memory": { categories: ["memory"] },
  "subsystems/skills": { tags: ["skills", "agent-skills", "skill"] },
  "subsystems/sandbox": { tags: ["sandbox", "security"] },
  "subsystems/commands": { tags: ["cli", "terminal"], categories: ["client"] },
  "subsystems/agent-team": { tags: ["multi-agent"], categories: ["agent"] },
  "subsystems/approval": { tags: ["security", "permissions"] },
  "subsystems/credentials": { tags: ["oauth", "security"] },
  "subsystems/extensions": { tags: ["plugin", "cordis"] },
  "subsystems/client-modules": { categories: ["ui", "client"] },
};

/** 一篇文档最多挂几个插件。多了会喧宾夺主，也稀释每条链接的权重。 */
const LIMIT = 6;

/**
 * 某篇文档的关联插件。
 * 先按标签取，不够再用分类补；跨来源去重并保持稳定顺序（realPlugins 行序）。
 */
export function docRelatedPlugins(section: string, slug: string): HubPlugin[] {
  const hint = DOC_PLUGIN_HINTS[`${section}/${slug}`];
  if (!hint) return [];

  const seen = new Set<string>();
  const out: HubPlugin[] = [];

  const take = (plugins: HubPlugin[] | undefined) => {
    for (const p of plugins ?? []) {
      if (out.length >= LIMIT) return;
      if (seen.has(p.fullName)) continue;
      seen.add(p.fullName);
      out.push(p);
    }
  };

  for (const tag of hint.tags ?? []) {
    take(tagHub(tag)?.plugins);
    if (out.length >= LIMIT) return out;
  }
  for (const cat of hint.categories ?? []) {
    take(categoryHub(cat)?.plugins);
    if (out.length >= LIMIT) return out;
  }
  return out;
}

/** 反向：某个分类/标签下是否有对应文档，供插件页挂「相关文档」。 */
export function pluginRelatedDocs(
  category: string,
  tagSlugs: Set<string>,
): { section: string; slug: string }[] {
  const out: { section: string; slug: string }[] = [];
  for (const [key, hint] of Object.entries(DOC_PLUGIN_HINTS)) {
    const hitTag = (hint.tags ?? []).some((t) => tagSlugs.has(t));
    const hitCat = category && (hint.categories ?? []).includes(category);
    if (hitTag || hitCat) {
      const i = key.indexOf("/");
      out.push({ section: key.slice(0, i), slug: key.slice(i + 1) });
    }
    if (out.length >= 4) break;
  }
  return out;
}
