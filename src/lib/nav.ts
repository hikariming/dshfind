import type { LearnChapter } from "./types";
import { cordisLessons } from "./mock";

/**
 * 学习导航的章节结构。
 * 第二章「论文研读」直接引用 Cordis 精读的 13 课；
 * 其余章节为占位内容（href 为空时渲染为「筹备中」）。
 */
export const learnChapters: LearnChapter[] = [
  {
    id: "ch1",
    description: "从零认识 DSH：智能体框架的基本思想，以及为什么需要动态组合",
    title: "第一章 · DSH 初识",
    items: [
      { id: "ch1-1", label: "DSH 是什么", href: "/learn/intro/what-is-dsh" },
      {
        id: "ch1-2",
        label: "智能体框架的基本思想",
        href: "/learn/intro/agent-basics",
      },
      {
        id: "ch1-3",
        label: "为什么需要动态组合",
        href: "/learn/intro/why-dynamic",
      },
    ],
  },
  {
    id: "ch2",
    description: "精读《一种面向时空可组合性的编程范式》：可回退效应与反应式余效应",
    title: "第二章 · 论文研读",
    items: cordisLessons.map((lesson) => ({
      id: lesson.id,
      label: lesson.title,
      href: `/learn/cordis/lessons/${lesson.slug}`,
      index: lesson.index,
      status: lesson.status,
    })),
  },
  {
    id: "ch3",
    description: "认识 ctx、事件系统与项目结构——看懂 DSH 是怎么搭起来的",
    title: "第三章 · DSH 核心概念",
    items: [
      {
        id: "ch3-1",
        label: "启动与配置：一行配置改变整个智能体",
        href: "/learn/core/01-boot-config",
      },
      {
        id: "ch3-2",
        label: "认识 ctx：一切能力的入口",
        href: "/learn/core/02-ctx-basics",
      },
      {
        id: "ch3-3",
        label: "智能体循环与会话：一切有据可查",
        href: "/learn/core/03-agent-loop-session",
      },
      {
        id: "ch3-4",
        label: "工具与执行：让智能体真正动手",
        href: "/learn/core/04-tools-execution",
      },
      {
        id: "ch3-5",
        label: "安全边界：能碰什么、不能碰什么",
        href: "/learn/core/05-sandbox-security",
      },
      {
        id: "ch3-6",
        label: "感知世界：技能、搜索与上下文",
        href: "/learn/core/06-senses-context",
      },
      {
        id: "ch3-7",
        label: "目标、计划与协作：单兵到军团",
        href: "/learn/core/07-goals-collab",
      },
      {
        id: "ch3-8",
        label: "自我演化：智能体改造自己",
        href: "/learn/core/08-self-evolution",
      },
      {
        id: "ch3-9",
        label: "事件系统：一切皆事件",
        href: "/learn/core/09-event-system",
      },
      {
        id: "ch3-10",
        label: "代码地图：项目结构导航",
        href: "/learn/core/10-code-map",
      },
      {
        id: "ch3-11",
        label: "插件代码解剖：一个 DSH 包长什么样",
        href: "/learn/core/11-plugin-anatomy",
      },
      {
        id: "ch3-12",
        label: "前端与 Web UI：会话如何变成界面",
        href: "/learn/core/12-web-ui",
      },
    ],
  },
  {
    id: "ch4",
    description: "从 Hello 插件到 LLM 适配器，动手写出你自己的 DSH 插件",
    title: "第四章 · 插件开发实战",
    items: [
      {
        id: "ch4-1",
        label: "第一个插件：Hello, DSH!",
        href: "/learn/dev/01-hello-plugin",
      },
      {
        id: "ch4-2",
        label: "写一个工具：给智能体加技能",
        href: "/learn/dev/02-write-tool",
      },
      {
        id: "ch4-3",
        label: "写一个服务：Service 三角色",
        href: "/learn/dev/03-write-service",
      },
      {
        id: "ch4-4",
        label: "监听事件：在正确的时机插入逻辑",
        href: "/learn/dev/04-listen-events",
      },
      {
        id: "ch4-5",
        label: "配置与发布：可配置、可分发",
        href: "/learn/dev/05-config-publish",
      },
      {
        id: "ch4-6",
        label: "实战进阶：LLM 适配器与自指工具",
        href: "/learn/dev/06-advanced",
      },
    ],
  },
  {
    id: "ch5",
    description: "最佳实践、常见问题与贡献指南（筹备中）",
    title: "第五章 · 社区与进阶",
    items: [
      { id: "ch5-1", label: "最佳实践", note: "筹备中" },
      { id: "ch5-2", label: "常见问题", note: "筹备中" },
      { id: "ch5-3", label: "贡献指南", note: "筹备中" },
    ],
  },
];
