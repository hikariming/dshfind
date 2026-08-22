/**
 * 官方文档中心的板块配置：上游目录 → 站内 section 的映射。
 *
 * 与 src/lib/docs-sections.ts 保持一致（那边是前端消费的同一份表，
 * 因为脚本是 .mjs、前端是 TS，两边各留一份而不是互相 import）。
 */

/**
 * 固定的上游 commit。刻意不追 HEAD：
 * 文档随时会改，追 HEAD 会让站内译文与源文不断错位且无法复现；
 * 升版是人工动作——改这个常量、重跑同步、只重译 hash 变了的文件。
 */
export const PINNED_SHA = "b150a551b8d465e31e418e1b2eaf5e79bbb7d28e";

export const UPSTREAM_REPO = "deepseek-ai/deepseek-harness";

/**
 * publishedUpstream：该板块在官方文档站已经发布。
 *
 * 为 true 时，我们的 zh/en 页面与官方是同一份内容，属于重复内容，
 * 因此只作为翻译源与站内导航存在，不进 sitemap 也不给索引；
 * ja/ko 官方完全没有，是我们独有的内容，照常收录。
 * 为 false 的板块（subsystems/cookbook/postmortem）在官方站上没有网页版，
 * 只存在于 GitHub blob，四语言都收录。
 */
export const DOC_SECTIONS = [
  {
    id: "guide",
    upstream: "docs/user/guide",
    publishedUpstream: true,
    order: 1,
  },
  {
    id: "develop",
    upstream: "docs/user/develop",
    publishedUpstream: true,
    order: 2,
  },
  {
    id: "subsystems",
    upstream: "docs/subsystems",
    publishedUpstream: false,
    order: 3,
  },
  {
    id: "cookbook",
    upstream: "docs/cookbook",
    publishedUpstream: false,
    order: 4,
  },
  {
    id: "postmortem",
    upstream: "docs/postmortem",
    publishedUpstream: false,
    order: 5,
  },
];

export function sectionById(id) {
  return DOC_SECTIONS.find((s) => s.id === id) ?? null;
}
