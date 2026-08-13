/**
 * 一节课对当前用户的状态——由本机学习进度推导，不是内容自带的属性。
 * `in_progress` 指「下一节该学的」，即第一节尚未标记已学会的课。
 */
export type LessonStatus = "completed" | "in_progress" | "locked";

export interface Lesson {
  id: string;
  slug: string;
  index: number;
  title: string;
  summary: string;
  duration: string;
}

/** 一个教程章节的对外形态；由 src/lib/courses.ts 从真实导航结构与课程元数据推导。 */
export interface Course {
  id: string;
  slug: string;
  /** 对应 learnChapters 的章节 id（ch1…ch5）。 */
  chapterId: string;
  title: string;
  description: string;
  tag: string;
  level: "入门" | "进阶" | "实战";
  /** 实际存在正文的课时数。 */
  lessons: number;
  /** 各课时长之和，没有逐课时长时为空串。 */
  duration: string;
  /** 章节首课链接；筹备中的章节没有。 */
  href?: string;
  featured: boolean;
  gradient: string;
}

/**
 * 排行榜上的一名贡献者。
 * 全部字段来自 dsh-external/dsh-club 的每日快照，积分口径与该站的「综合积分榜」一致；
 * `initial` / `color` 只是头像加载失败时的兜底展示，不是数据。
 */
export interface RankingUser {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
  /** 头衔：卷王 / 卷神 / 卷师 / 卷民 / 潜水员。 */
  title: string;
  points: number;
  contributions: number;
  plugins: number;
  stars: number;
  repos: number;
  followers: number;
  rank: number;
  /** 相对上一个快照的名次变化，正=上升；新入榜为 null。 */
  rankDelta: number | null;
  badges: string[];
  initial: string;
  color: string;
  trend: "up" | "down" | "flat";
}

export interface LearnChapterItem {
  id: string;
  label: string;
  href?: string;
  index?: number;
  note?: string;
}

export interface LearnChapter {
  id: string;
  title: string;
  description: string;
  items: LearnChapterItem[];
}

export interface PluginCategory {
  id: string;
  title: string;
  emoji: string;
}

export interface RealPlugin {
  name: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  language: string;
  isSkill: boolean;
  isBundle: boolean;
  /** 仓库星标数，来自 dsh-club 快照；未匹配到仓库时为 0。 */
  stars: number;
  /** 最后一次推送时间（ISO），未知时为空串。 */
  pushedAt: string;
  /** 插件清单里声明的版本号，未声明时为空串。 */
  version: string;
}
