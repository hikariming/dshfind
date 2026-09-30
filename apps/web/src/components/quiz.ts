// 课程 MDX 写的是 `import { Quiz } from "@/components/quiz"`（老站 next-intl 组件）。
// astro.config.mjs 把这个路径别名到这里，换成按需水合的 Astro 岛；MDX 原文一字不改。
export { default as Quiz } from "./QuizIsland.astro";
