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

/**
 * 一个挂了 `dsh-plugin` topic 的公开仓库。
 * 全部字段直接来自 GitHub search API，没有推断出来的值——
 * topic 数据里没有可靠的分类信号（约半数仓库只挂了生态标记 topic），所以不设分类。
 */
export interface RealPlugin {
  name: string;
  /** 仓库所有者的 GitHub 账号；同名仓库靠它区分。 */
  owner: string;
  /** `owner/name`，全局唯一。 */
  fullName: string;
  url: string;
  description: string;
  /** 仓库 topic 去掉 dsh-plugin / dsh 这类生态标记后剩下的，最多 8 个。 */
  tags: string[];
  language: string;
  stars: number;
  /** 最后一次推送时间（ISO），未知时为空串。 */
  pushedAt: string;
  archived: boolean;
}

/**
 * 插件页展示用：RealPlugin + Turso 快照推导出的增长量。
 * 增长窗口为 7 天；历史不足 7 天时以最早一张快照为基线。
 */
export interface PluginWithGrowth extends RealPlugin {
  /** 贡献者数；null = 尚未成功抓到过。 */
  contributors: number | null;
  starGrowth: number;
  /** null = 当前或基线快照缺贡献者数据，算不出增量。 */
  contributorGrowth: number | null;
  /** 优质项目（运营标记），插件页置顶展示。 */
  isFeatured: boolean;
  /** 作者是内测用户（运营标记）。 */
  isInsider: boolean;
}
