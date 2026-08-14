<div align="center">

# dshfind

**DeepSeek Harness (DSH) 学习与分享社区**

原理学习 · 插件市场 · 最佳实践

🌐 **[dshfind.com](https://dshfind.com)**

[English](./README.md) | 简体中文 | [日本語](./README.ja.md) | [한국어](./README.ko.md)

</div>

---

## dshfind 是什么?

dshfind 是一个围绕 DeepSeek Harness (DSH) 构建的社区站点:

- **📖 DSH 原理学习** — 从入门到 Cordis 论文逐章精读的体系化课程:单子(Monad)、余效应(Coeffect)、可回滚效应、效应组合、时空可组合性等。
- **🧩 插件市场** — DSH 插件实时索引,自动聚合自 GitHub topic [`dsh-plugin`](https://github.com/topics/dsh-plugin)。
- **🏆 最佳实践** — 插件开发指南、术语表,以及作者与项目的社区排行榜。

## 技术栈

- [Next.js 16](https://nextjs.org)(App Router)+ React 19
- [next-intl](https://next-intl.dev) 实现站点国际化(中英文界面)
- 课程内容使用 MDX([`src/content/lessons`](./src/content/lessons))
- Tailwind CSS · 部署在 Vercel

## 快速开始

```bash
pnpm install
pnpm dev
```

然后打开 http://localhost:3000。

### 重新生成插件与排行数据

插件与排行数据由 GitHub topic `dsh-plugin` 生成(需要 [GitHub CLI](https://cli.github.com)):

```bash
pnpm gen:data
```

## 提交你的插件

给你的**公开** GitHub 仓库加上 `dsh-plugin` topic,下次数据刷新时就会出现在插件市场中。

## 参与贡献

欢迎 Issue 和 PR:

- 课程内容在 [`src/content/lessons`](./src/content/lessons),使用 MDX 编写。
- 界面文案在 [`messages/`](./messages)。
