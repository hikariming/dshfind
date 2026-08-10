export type LessonStatus = "completed" | "in_progress" | "locked";

export interface Lesson {
  id: string;
  slug: string;
  index: number;
  title: string;
  summary: string;
  duration: string;
  status: LessonStatus;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  tag: string;
  level: "入门" | "进阶" | "实战";
  lessons: number;
  progress: number;
  duration: string;
  status: "进行中" | "未开始" | "已完成";
  featured: boolean;
  gradient: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  installs: string;
  rating: number;
  version: string;
  tags: string[];
  downloads: number;
}

export interface User {
  id: string;
  name: string;
  level: string;
  points: number;
  contributions: number;
  badges: string[];
  initial: string;
  color: string;
  trend: "up" | "down";
}

export interface LearnChapterItem {
  id: string;
  label: string;
  href?: string;
  index?: number;
  status?: LessonStatus;
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
}
