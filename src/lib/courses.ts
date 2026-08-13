import type { Course } from "./types";
import { cordisLessons } from "./lessons";
import { learnChapters } from "./nav";

/**
 * 章节的展示属性——课时数与链接一律从 learnChapters 推导，不在这里写死。
 * `title` / `description` 是章节页用的完整标题文案，缺省时回落到导航里的短标签。
 */
const chapterMeta: Record<
  string,
  {
    slug: string;
    tag: string;
    level: Course["level"];
    gradient: string;
    featured?: boolean;
    title?: string;
    description?: string;
  }
> = {
  ch1: { slug: "intro", tag: "入门课程", level: "入门", gradient: "from-accent-cyan to-brand-500" },
  ch2: {
    slug: "cordis",
    tag: "论文精读",
    level: "入门",
    gradient: "from-brand-500 via-brand-600 to-accent-violet",
    featured: true,
    title: "Cordis 论文精读：时空可组合性编程范式",
    description:
      "从零读懂《一种面向时空可组合性的编程范式》：不需要类型理论背景，用代码直觉理解可回退效应与反应式余效应。",
  },
  ch3: { slug: "core", tag: "核心概念", level: "进阶", gradient: "from-brand-400 to-accent-cyan" },
  ch4: { slug: "dev", tag: "实战", level: "实战", gradient: "from-accent-violet to-brand-500" },
  ch5: { slug: "plugin", tag: "插件入门", level: "入门", gradient: "from-brand-500 to-accent-violet" },
};

/** 把「20 分钟」「约 1 小时」这类时长加总成分钟；解析不出来的按 0 计。 */
function minutesOf(duration: string): number {
  const hours = /([\d.]+)\s*小时/.exec(duration);
  const mins = /([\d.]+)\s*分钟/.exec(duration);
  return (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
}

function formatMinutes(total: number): string {
  if (total === 0) return "";
  if (total < 60) return `约 ${total} 分钟`;
  return `约 ${Math.round((total / 60) * 10) / 10} 小时`;
}

/** 各章节的总时长——目前只有第二章逐课标了时长，其余章节留空。 */
const durationByChapter: Record<string, string> = {
  ch2: formatMinutes(cordisLessons.reduce((sum, l) => sum + minutesOf(l.duration), 0)),
};

/**
 * 教程章节列表。
 * 标题、描述沿用导航结构；课时数是真实存在正文的课数；没有正文的章节 `href` 为 undefined。
 * 学习进度不是课程的属性——它是每个用户自己的状态，由 components/lesson-progress.tsx 提供。
 */
export const courses: Course[] = learnChapters.map((chapter) => {
  const items = chapter.items.filter((item) => item.href);
  const meta = chapterMeta[chapter.id];
  return {
    id: chapter.id,
    slug: meta.slug,
    chapterId: chapter.id,
    title: meta.title ?? chapter.title.replace(/^第[一二三四五]章 · /, ""),
    description: meta.description ?? chapter.description,
    tag: meta.tag,
    level: meta.level,
    lessons: items.length,
    duration: durationByChapter[chapter.id] ?? "",
    href: items[0]?.href,
    featured: Boolean(meta.featured),
    gradient: meta.gradient,
  };
});

export const featuredCourse = courses.find((c) => c.featured)!;
