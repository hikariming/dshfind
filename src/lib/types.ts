import type { DownloadSnapshot } from "./downloads";
import type { InstallSnapshot } from "./install";

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
 * 除 `category`/`score` 与三个运营标记外，全部字段直接来自 GitHub search API。
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
  /**
   * 分类 slug（枚举见 src/lib/categories.ts），'' = 未分类。
   * 每日同步按关键词自动分类，运营可手工覆盖（scripts/flag-plugin.mjs --category）。
   */
  category: string;
  /** 综合评分 0-100（scripts/lib/scoring.mjs 口径），null = 未评分。 */
  score: number | null;
  /** 优质项目（运营标记），插件页置顶展示。 */
  isFeatured: boolean;
  /**
   * 编辑推荐是否参与置顶加权。省略 = 参与（默认）。
   *
   * false 表示运营降权：标记与徽标全部保留（作者那边毫无变化），但列表不再把它
   * 顶到全站之前，按 star 走正常位次。用于「当初推荐了、后来没跑起来」的项目——
   * 摘标会得罪人，一直置顶又会把几千 star 的项目压在几个 star 的下面。
   * 打标见 scripts/flag-plugin.mjs --boost=0。
   */
  featuredBoost?: boolean;
  /** 作者是内测用户（运营标记）。 */
  isInsider: boolean;
  /** 官方出品（DeepSeek 官方或官方生态组织，运营标记）。 */
  isOfficial: boolean;
  /** 风险/可疑（假冒官方仓库等，运营标记）：仍收录展示，但列表沉底并挂警示。 */
  isRisky: boolean;
  /** 风险说明（如被假冒的官方仓库链接），null = 无。 */
  riskNote: string | null;
  /**
   * 累计下载量（渠道 + 总数），省略 = 没有可报的数字。
   *
   * 详情页首选实时读 Turso，这里是构建期快照——预渲染跑在没有 Turso 凭据的构建
   * 环境里，只能靠它，否则最该显示数字的头部插件页反而永远是空的。
   * 口径见 src/lib/downloads.ts：npm 渠道是包安装数，release 渠道是安装包下载数。
   */
  downloads?: DownloadSnapshot;
  /**
   * 安装方式（结论 + 命令 + 包名版本），省略 = 没探到任何可说的。
   *
   * 同 downloads，这是给构建期预渲染兜底用的；插件超市列表用不到它，
   * staticFallback() 会把它剥掉，别让几千行命令白白进懒加载的响应体。
   */
  install?: InstallSnapshot;
}

/**
 * 首页三条 rail 的卡片数据。
 *
 * 刻意不复用 RealPlugin：rail 只需要卡片上露出的那几个字段，带上 description/tags
 * 会让「编辑推荐」的候选池白白撑大一圈——那个池子是要随 HTML 一起发给浏览器的
 * （换一批按钮纯客户端切片，不发请求）。短评由服务端解析好再传，见 nav-section。
 */
export interface HomePick {
  fullName: string;
  name: string;
  owner: string;
  stars: number;
  score: number | null;
  isFeatured: boolean;
  isOfficial: boolean;
  isInsider: boolean;
  /** 近 7 天 star 增长；只有「本周飙升」那条 rail 带。 */
  starGrowth?: number;
  /** 收录日期 YYYY-MM-DD；只有「新面孔」那条 rail 带。 */
  firstSeenAt?: string;
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
}
