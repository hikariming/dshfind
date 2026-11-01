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
- **📚 文档与社区** — 四语翻译的 DSH 官方文档,以及论坛和每个插件的讨论区。

## 技术栈

- [Astro 7](https://astro.build) + Preact 岛([`apps/web`](./apps/web))
- 站点国际化(中、英、日、韩四语界面)
- 课程内容使用 MDX([`src/content/lessons`](./src/content/lessons))
- Tailwind CSS · 部署在 Cloudflare Workers + D1

## 文档

**简体中文**

- [公开 API 与查询指南](./docs/api-query.zh-CN.md)

**English**

- [Public API and query guide](./docs/api-query.md)

## 快速开始

```bash
pnpm install
pnpm dev
```

然后打开 http://localhost:4321。

### 重新生成插件数据

带 GitHub topic `dsh-plugin` 的仓库每天同步进项目数据库,插件库与首页推荐栏的静态快照由它生成。只重新生成快照(需要 `.env.local` 里的数据库凭据):

```bash
pnpm gen:data
```

一条命令跑完整刷新——GitHub 同步、下载量、安装方式、静态快照、构建验证——并只提交生成物:

```bash
pnpm refresh
```

## 提交你的插件

给你的**公开** GitHub 仓库加上 `dsh-plugin` topic,下次数据刷新时就会出现在插件市场中。

## 参与贡献

欢迎 Issue 和 PR:

- 课程内容在 [`src/content/lessons`](./src/content/lessons),使用 MDX 编写。
- 界面文案在 [`messages/`](./messages)。

## 友情链接

- [DSH Desktop](https://dshdesktop.cn) — 为 DeepSeek Harness (DSH) 插件生态打造的现代化桌面端([GitHub](https://github.com/anywhere-labs/deepseek-harness-desktop))
- [妙智云 GEO](https://www.mzyai.com) — 开源 GEO 平台,让官网在 DeepSeek/Kimi/豆包/GLM/混元 等 AI 回答中被准确引用与推荐([GitHub](https://github.com/045mzyai/dsh-geo))
