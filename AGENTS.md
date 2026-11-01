# dshfind

- 主站是 `apps/web` 下的 Astro 7 站（Worker `dshfind-web`，Cloudflare Workers + D1）。改页面前先读 `node_modules/astro` 附带的文档，别按旧版 Astro 或 Next.js 的习惯写。
- 根目录 `src/` 不是独立的站：它是新站通过 `@/*` 别名复用的课程 MDX、图示、lib、数据快照，以及几个论坛 / 登录 React 组件（`next-intl`、`next/navigation` 由 `apps/web/src/compat/` 替身接管）。
- `scripts/` 是数据管线（GitHub / npm → D1 → 静态快照），`workers/api-edge` 是 `api.dshfind.com`。
- 验证：`pnpm ci:frontend`（astro check + eslint + 单元测试 + 新站构建）。
