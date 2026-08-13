import type { Lesson } from "./types";

/**
 * 第二章「Cordis 论文精读」13 课的元数据。
 * 每条都对应 src/content/lessons/cordis/<slug>/{zh,en}.mdx 的真实正文；
 * 学习进度不在这里——那是每个用户自己的状态，见 components/lesson-progress.tsx。
 */
export const cordisLessons: Lesson[] = [
  {
    id: "cordis-01",
    slug: "01-intro",
    index: 1,
    title: "摘要与引言：动态组合与两个维度",
    summary: "时间可组合性、空间可组合性到底是什么",
    duration: "20 分钟",
  },
  {
    id: "cordis-02",
    slug: "02-motivation",
    index: 2,
    title: "动机示例：VSCode 插件与 AI 智能体",
    summary: "为什么现在的软件做不到运行时卸载",
    duration: "15 分钟",
  },
  {
    id: "cordis-03",
    slug: "03-contributions-types",
    index: 3,
    title: "贡献回顾与类型判断 Γ ⊢ t : T",
    summary: "效应标注：类型不只记录返回值，还记录副作用",
    duration: "15 分钟",
  },
  {
    id: "cordis-04",
    slug: "04-monad",
    index: 4,
    title: "单子与代数效应：副作用装进盒子",
    summary: "Promise 就是单子：η 装值、flatMap 压平",
    duration: "25 分钟",
  },
  {
    id: "cordis-05",
    slug: "05-coeffect",
    index: 5,
    title: "余效应：计算需要环境给什么",
    summary: "效应问『我改了什么』，余效应问『我需要什么』",
    duration: "20 分钟",
  },
  {
    id: "cordis-06",
    slug: "06-revertible-effects",
    index: 6,
    title: "可回退效应：装得上去，拆得下来",
    summary: "每个上下文变换都配一个显式逆变换",
    duration: "30 分钟",
  },
  {
    id: "cordis-07",
    slug: "07-effect-composition",
    index: 7,
    title: "效应函数与组合：逆变换自动组合",
    summary: "⋄ 运算：复合效应的逆由组合自然得到",
    duration: "30 分钟",
  },
  {
    id: "cordis-08",
    slug: "08-reactive-coeffects",
    index: 8,
    title: "反应式余效应：依赖齐了自动启动",
    summary: "满足性、激活 / 停用 / 中性迁移分类",
    duration: "25 分钟",
  },
  {
    id: "cordis-09",
    slug: "09-lifecycle",
    index: 9,
    title: "组件生命周期：幂等、迭代、纪元、异步",
    summary: "惯性状态机：转换一旦开始就运行至完成",
    duration: "35 分钟",
  },
  {
    id: "cordis-10",
    slug: "10-context-paradigm",
    index: 10,
    title: "上下文范式：统一上下文类型 Γ∞",
    summary: "效应上下文与余效应上下文整合为一个实体",
    duration: "20 分钟",
  },
  {
    id: "cordis-11",
    slug: "11-core-library",
    index: 11,
    title: "Cordis 核心库：效应跟踪与余效应解析",
    summary: "ctx.effect、ctx.set、纤程与惯性状态机",
    duration: "30 分钟",
  },
  {
    id: "cordis-12",
    slug: "12-loader-koishi",
    index: 12,
    title: "组件加载器与 Koishi 案例",
    summary: "声明式配置、热模块替换、4000+ 插件生态",
    duration: "25 分钟",
  },
  {
    id: "cordis-13",
    slug: "13-discussion",
    index: 13,
    title: "讨论、相关工作与总结",
    summary: "服务多路复用、访问控制、版本管理",
    duration: "20 分钟",
  },
];
