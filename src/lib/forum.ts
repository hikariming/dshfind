/**
 * BBS 的共享类型与板块常量（docs/bbs-design.md Phase 2）。
 *
 * 这里两端都会 import，所以不放任何 server-only 的东西：服务端取数在
 * lib/backend.ts（带 BACKEND_API_KEY），浏览器直连的 fetch 在各组件里。
 * 字段名沿用 Go 端的 snake_case，省掉一层没意义的转换。
 */
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

/** 可发帖的板块，顺序即 UI 上 chips 的顺序。plugin 不在其中——插件讨论帖
 *  只由插件详情页的首条评论自动建出来，列表里能看到、但不能往里发主题。 */
export const BOARDS = ["general", "help", "dev", "announce"] as const;

export type PostableBoard = (typeof BOARDS)[number];
export type Board = PostableBoard | "plugin";

export interface ForumAuthor {
  login: string;
  name: string | null;
  avatar: string | null;
}

export interface ForumPost {
  id: number;
  body_md: string;
  kind: string;
  author: ForumAuthor;
  created_at: string;
}

export interface ThreadSummary {
  slug: string;
  board: string;
  title: string;
  excerpt: string;
  author: ForumAuthor;
  locale: string;
  plugin_full_name: string | null;
  reply_count: number;
  last_post_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
}

export interface Thread extends Omit<ThreadSummary, "excerpt"> {
  body_md: string;
  posts: ForumPost[];
}

export interface ThreadPage {
  items: ThreadSummary[];
  total: number;
  page: number;
  per_page: number;
  board_counts: Record<string, number>;
  boards: string[];
}

/** 浏览器直连 Go API 的基址；未配置（本地开发默认如此）时为空串。 */
export const FORUM_API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(
  /\/+$/,
  ""
);

/** 与 Go 端 maxThreadBodyBytes / maxCommentBytes 对齐，编辑器里就先拦住。 */
export const MAX_THREAD_BODY = 64 * 1024;
export const MAX_REPLY_BODY = 10 * 1024;
export const MAX_THREAD_TITLE = 200;

/** 帖子页路径。slug 可能含中文，交给 Link/URL 各自去编码。 */
export function threadPath(slug: string): string {
  return `/bbs/t/${slug}`;
}

/**
 * 帖子的写作语言。同一个帖子在四种语言前缀下渲染的是同一份正文，所以
 * canonical 与 sitemap 都认这一个——否则一篇文章会变成四条重复内容。
 */
export function threadLocale(raw: string): Locale {
  return isLocale(raw) ? raw : defaultLocale;
}

/**
 * 从 Markdown 原文里抠一段纯文本，用于 meta description 与列表摘要。
 * 只做粗剥离：标题号、强调符、链接语法、代码围栏。留下的多余符号不影响可读性，
 * 上一版试过用完整解析器，为一段 160 字的摘要拉进一个 parser 不划算。
 */
export function plainExcerpt(markdown: string, limit = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}
