import { lessonFromHref } from "./lessons-manifest";
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

/**
 * 文档 → 站内课程的关联表。
 *
 * 这是「三角内链」的最后一条边。官方文档讲的是"接口长什么样"，课程讲的是
 * "为什么这么设计"——两者天然互补，而竞品既没有翻译好的官方文档、也没有课程，
 * 这条边只有本站连得起来。
 *
 * 同样人工维护：文档标题与课程标题的词表对不上，自动匹配只会产出噪音。
 * value 是 nav.ts 里的 href，直接可用。
 */
const DOC_LESSON_HINTS: Record<string, string[]> = {
  "guide/index": ["/learn/intro/what-is-dsh", "/learn/core/12-web-ui"],
  "guide/providers": ["/learn/core/01-boot-config"],
  "guide/python-sdk": ["/learn/intro/agent-basics"],

  "develop/index": ["/learn/plugin/01-what-is-plugin"],
  "develop/basic": [
    "/learn/dev/01-hello-plugin",
    "/learn/plugin/01-what-is-plugin",
  ],
  "develop/basic/config": [
    "/learn/dev/05-config-publish",
    "/learn/core/01-boot-config",
  ],
  "develop/basic/tool": [
    "/learn/dev/02-write-tool",
    "/learn/core/04-tools-execution",
  ],
  "develop/basic/publish": ["/learn/dev/05-config-publish"],
  "develop/framework": [
    "/learn/core/11-plugin-anatomy",
    "/learn/core/02-ctx-basics",
  ],
  "develop/framework/service": ["/learn/dev/03-write-service"],
  "develop/framework/events": [
    "/learn/dev/04-listen-events",
    "/learn/core/09-event-system",
  ],
  "develop/practice": ["/learn/core/11-plugin-anatomy", "/learn/dev/06-advanced"],
  "develop/practice/llm-adapter": ["/learn/dev/06-advanced"],

  "subsystems/compaction": ["/learn/core/06-senses-context"],
  "subsystems/skills": ["/learn/core/08-self-evolution"],
  "subsystems/sandbox": ["/learn/core/05-sandbox-security"],
  "subsystems/agent-team": ["/learn/core/07-goals-collab"],
  "subsystems/extensions": ["/learn/core/11-plugin-anatomy"],
  "subsystems/core": ["/learn/core/02-ctx-basics"],
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

export interface RelatedLesson {
  href: string;
  title: string;
}

/**
 * 某篇文档的关联课程。
 * 只返回**该语言确实有正文**的课时——课程 registry 缺语言时会回落到中文，
 * 把那种页面当作关联推给日韩读者是误导。
 */
export function docRelatedLessons(
  section: string,
  slug: string,
  locale: string,
): RelatedLesson[] {
  const hrefs = DOC_LESSON_HINTS[`${section}/${slug}`];
  if (!hrefs) return [];

  const out: RelatedLesson[] = [];
  for (const href of hrefs) {
    const lesson = lessonFromHref(href);
    const title = lesson?.titles[locale];
    if (title) out.push({ href, title });
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
