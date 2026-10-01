# dshfind 前端重写方案（Next → Astro，绞杀式分段切换）

> 制定于 2026-09-30。决策：**框架 Astro 7，只部署在 Cloudflare（不做国内备案/双线）**。
> 代码彻底重写，上线按路由分段接管——老站全程在线，每段都能一键切回。

## 0. 为什么重写、要达成什么

现状实测（2026-09-30）：

| 项 | 现状 | 问题 |
| --- | --- | --- |
| 最大客户端 chunk | 245KB（未压缩） | `plugins-browser.tsx` 静态 import `plugin-i18n.ts`（586KB 源），全量译文进了浏览器 |
| 服务端产物 | `.open-next/server-functions` 66MB | `plugins-real.ts` 11.7MB 被编进 Worker，冷启动慢、构建慢 |
| 客户端组件 | 29 个 `"use client"` | 大部分页面是纯内容，却要背 React runtime + hydration |
| 插件详情页 | `revalidate = 0`，每次按需 SSR | 全靠边缘缓存兜底；缓存键 `Vary: Cookie`，带任意 Cookie 即穿透 |

**目标（验收用的硬指标）**

1. **SEO 零回退**：sitemap 里每个 URL 在新站 200，`<head>` 关键字段（title / description / canonical / hreflang / robots / og / JSON-LD 类型）与老站一致或有意改进。
2. **性能预算**：内容页（教程/文档/分类/详情）首屏 JS ≤ 30KB gzip；插件超市等交互页 ≤ 80KB gzip；移动端 LCP ≤ 2.0s（CrUX p75）。
3. **降本**：能静态的全部进 Assets（静态资源请求不跑 Worker、不计 CPU）；Worker 产物 < 3MB gzip；动态路由命中缓存率 > 90%。

**非目标**：不改 URL 结构、不改数据管线（`scripts/` 的同步/评分/下载量照旧）、不改 `api.dshfind.com` 与桌面端市场契约、不做国内 CDN。

## 1. 目标架构

```
             dshfind.com（现有 custom domain，指向 dshfind Worker）
                              │
                  custom-worker.mjs（迁移期充当路由器）
                 ┌────────────┴────────────┐
      已迁移路径 → service binding    其余路径 → OpenNext（老 Next）
                 │
         dshfind-web（新 Astro Worker）
          ├─ Assets：预渲染 HTML + /_astro/* 静态资源（不进 Worker）
          ├─ 按需渲染：长尾插件详情 / 论坛 / 登录态页面（读 D1，Workers Cache）
          └─ Islands：搜索框、插件筛选、论坛编辑器、测验、主题/语言切换
```

终局切换后，路由器与 OpenNext 退役，dshfind-web 直接挂域名。

### 1.1 技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | Astro 7（Vite 8、Rust 编译器） | 默认零 JS；`prerender` 按页控制静态/按需 |
| 适配器 | `@astrojs/cloudflare` 14 | 入口 `@astrojs/cloudflare/entrypoints/server`；绑定用 `import { env } from 'cloudflare:workers'`；dev 跑 workerd |
| 交互组件 | Preact 岛（`@astrojs/preact`，compat 模式） | 比 React 小一个数量级；现有 shadcn/radix 组件不直接复用，按需重写成轻量版 |
| 样式 | Tailwind v4 | 沿用现有设计 token 与 class，视觉保持一致 |
| 内容 | Content Collections + MDX | 教程 38 篇 × 4 语言；Astro 7 默认 Markdown 管线换成 Sätteri，需评估 remark-gfm 等是否要装 `@astrojs/markdown-remark` 保留 unified |
| i18n | Astro 内置 i18n 路由，`prefixDefaultLocale: true` | 与现在 `/zh /en /ja /ko` 前缀一致；文案沿用 `messages/*.json` |
| 搜索 | Pagefind 分片静态索引 + 保留 `/api/suggest` | 全文搜索零 Worker 开销 |
| 边缘 API | 页面外的 API（badge / card / readme-img / suggest / plugins-data）先留在老站，第 6 阶段迁入 Hono 或 Astro endpoint | |
| 图片 | `imageService: 'passthrough'` 起步 | 避免默认 `cloudflare-binding` 带来 Images 计费，按需再开 |

### 1.2 数据层原则

- **构建期**：从 D1 / 现有快照读数据，**按插件拆成独立 JSON**（`dist/data/p/<owner>/<repo>.json` 或直接渲染进 HTML），不再把 11.7MB 编进任何 bundle。
- **运行期**：长尾详情页按需查 D1（沿用 `x-dshfind-d1-*` 读预算观测），Workers Cache 缓存 1h。
- **客户端**：插件超市首屏 SSR 前 100 条；全量数据走 `/api/plugins-data` 懒加载，**译文随数据下发，不 import 进 bundle**。
- 新建 `packages/data`（纯 TS，无框架依赖）承载类型、分类、install、downloads 等纯函数，新老站共用，避免两套逻辑漂移。

### 1.3 缓存口径（修正现有问题）

- 预渲染页面：Assets 直出，`_headers` 设 `Cache-Control`；HTML `max-age=0, s-maxage=3600`，`/_astro/*` immutable。
- 按需页面：**只在存在 `dshfind_session` 时绕过缓存**，其余 Cookie 一律视为匿名——不再 `Vary: Cookie`。

## 2. 路由迁移表

| 路由 | 老实现 | 新渲染方式 | 阶段 |
| --- | --- | --- | --- |
| `/[l]/learn/**`（教程 38 篇） | MDX 页面 | 全量预渲染 | 2 |
| `/[l]/docs/[section]/[[...slug]]` | `revalidate=0` | 全量预渲染（manifest 驱动） | 2 |
| `/[l]/plugins/c|t|lang/*` | SSG / `revalidate=0` | 全量预渲染 | 3 |
| `/[l]/plugins/all/[page]` | SSG | 全量预渲染 | 3 |
| `/[l]/plugins`、`/plugins/browse` | SSR + 懒加载 | 预渲染 + 筛选岛 | 3 |
| `/[l]/plugins/[owner]/[repo]` | `revalidate=0` | Top ~1000 预渲染；其余按需 + 缓存 | 4 |
| `/[l]`（首页） | SSR | 预渲染（数据刷新时重建） | 5 |
| `/[l]/search` | SSR | 预渲染壳 + Pagefind 岛 | 5 |
| `/[l]/bbs/**`、`/[l]/login` | SSR / 客户端 | 按需渲染 + 岛 | 6 |
| `/api/*`、`/sitemap*.xml` | route handler | Astro endpoint | 6 |
| `/`、非法前缀、`[...rest]` 404 | middleware | Astro middleware | 7 |

## 3. 分阶段执行

每阶段统一验收闸门（下称 **Gate**）：

1. `scripts/rewrite/seo-parity.mjs` 对该阶段路由抽样比对，零非预期差异；
2. 该阶段 URL 在新站全部 200；
3. 性能预算达标（Lighthouse CI 移动端 + JS 体积脚本）；
4. 路由器里删掉该段前缀即可回滚，已演练一次。

### 第 0 阶段 · 基线与护栏（不写新页面）

- [x] 本方案
- [x] `scripts/rewrite/url-inventory.mjs`：从线上 sitemap 拉全量 URL，按路由类型分桶统计，另补 sitemap 之外的路由（search / login / bbs/new / plugins/browse / api）
- [x] `scripts/rewrite/seo-parity.mjs`：抓取两个站点同一路径，抽取 head 关键字段 + h1 + 内链数并 diff；支持 `--snapshot` 把老站基线存盘
- [ ] 记录基线：Search Console 收录/点击、CrUX 指标、CF 当月账单与请求/CPU 构成（手动填入 §5）
- [x] 在老站先修 `plugin-i18n` 进客户端 bundle 的问题：`plugins-browser.tsx` 改为只从 props 取译文

### 第 1 阶段 · 新站骨架

- `apps/web`（Astro）+ `packages/data`；pnpm workspace
- Base layout：head 组件（title/description/canonical/hreflang/og/JSON-LD 统一出口）、页头页脚、无闪烁主题（内联脚本读 localStorage）、语言切换
- Tailwind v4 token 迁移，与老站视觉逐像素对照首页页头
- 部署 `dshfind-web` Worker 到 `*.workers.dev`，全站 `noindex`
- 老站 `custom-worker.mjs` 加路由器：`MIGRATED_PREFIXES` 为空，service binding 已接好但不转发
- 确认项：Astro 7 route caching 在 CF 适配器上的实现；Sätteri 与 MDX/remark-gfm 的兼容方式

**进展（2026-09-30）**：骨架 + 学习区打样完成，本地 workerd（`wrangler dev`）验证通过，尚未部署。

- [x] `apps/web` 骨架：Base layout、统一 SEO 出口（`Seo.astro`）、页头、防闪烁主题（沿用 next-themes 的 localStorage 键）、Geist 自托管（Astro Fonts）
- [x] 学习区：37 课 × 4 语言 + Cordis 课程页，共 152 个 URL **全量 SEO parity 152/152**
- [x] 课程 MDX **一字未改**：图示组件经 Preact compat 服务端渲染（零 JS）；`@/components/quiz` 被别名替换成 `client:visible` 岛
- [ ] 路由器 + service binding（需先部署 `dshfind-web`）
- [ ] 课程进度（已学会打勾 / 继续学习卡片）小岛——第 2 阶段

实测（课时页 `/zh/learn/intro/what-is-dsh`）：

| | 老站 | 新站 |
| --- | --- | --- |
| HTML（gzip） | 39KB | 13KB |
| 首屏 JS（gzip） | 254KB | **0**（测验滚动到可见才加载，约 8.6KB） |
| 全量构建 153 页 | — | 约 3–9 秒 |

打样结论（原「确认项」）：

- **Sätteri 默认开 GFM**，课程里的表格无需 unified/remark-gfm，直接用默认处理器。
- **SmartyPants 默认开启**，会把直引号改成弯引号（parity 抓到 4 页标题不一致），已 `markdown.smartypants: false`。
- 纯静态输出时适配器把部署配置 `wrangler.json` 生成在资产目录里，已用 `public/.assetsignore` 排除，否则会被公开访问。
- 老站 `globals.css` 的 `--font-sans` 引用自身，靠 next/font 在 `<html>` 上补值；新站需显式接上，否则英文回落为衬线体。
- i18n `redirectToDefaultLocale` 必须有 `src/pages/index.astro`，构建时的 route 冲突警告属预期。
- 预渲染期能否读 D1 仍未验证——学习区不需要，留到第 3/4 阶段（插件数据）再定。
- `seo-parity.mjs` 修正：属性名大小写（React 输出 `hrefLang`）；新增「og 取自本页标题/描述」视为有意改进。

### 第 2 阶段 · 教程 + 文档

**进展（2026-09-30）**：学习区（`/[l]/learn/**`）先行切换，文档随后。

- [x] 课程进度：与老站同一 localStorage 键（`dshfind.learned.lessons`），用户进度不丢；
  侧栏打勾/进度条、课时底部「上一节 / 标记已学会 / 下一节」、课程页「继续学习」与目录状态。
  原生脚本改 `data-*` 属性 + Tailwind data 变体，**全部进度逻辑约 1.1KB JS**，不引入框架
- [x] `/[l]/learn` → `/[l]/learn/cordis` 307 走 `_redirects`（与老站一致，不跑 Worker）；站内 404 页
- [x] 路由器：`scripts/lib/rewrite-router.mjs`（带测试）+ `custom-worker.mjs` + 老站 `WEB` service binding
  - `/_astro/*` 原样透传（老站缓存口径会把未知路径标成 no-store，不能经过它）
  - 新站页面**摘掉预览域的 `X-Robots-Tag: noindex`** 后再走老站页面缓存口径（1h 边缘缓存、Cookie 规则不变）
  - 新站 5xx / 调用失败时回落老站 Next 渲染——迁移期老站路由仍在，最坏情况是看到老页面
- 本地联调限制：wrangler dev 同一会话跑两个都带静态资源的 Worker 时，被绑定方的资源请求返回 500
  （单独转发壳 Worker 正常）；分进程跑则 dev registry 报 `Network connection lost`。
  改用 `wrangler versions upload` 生成不接流量的预览版本，在真实环境验证后再部署

- Content Collections 接管 `src/content/lessons` 与 docs manifest
- 测验、课程进度、上一篇/下一篇做成小岛
- 路由器加入 `/*/learn`、`/*/docs`；观察 1–2 周 Search Console

### 第 3 阶段 · 插件列表与聚合页

**进展（2026-09-30）**：四类聚合页（`/plugins/c|t|lang|all/*`，2,464 URL）已迁，插件超市（`/plugins`、`/plugins/browse`）下一步。

- [x] 分类/标签/语言/全量索引全部预渲染：**2,618 页构建 17 秒、峰值内存 2.35GB**；
  老站标签页是按需渲染（revalidate=0），现在也是静态资源，不再占 Worker CPU
- [x] **全量 parity 2464/2464**；聚合页 HTML（gzip）96KB → 37KB，JS 247KB → 0
- [x] 「预渲染期能否读 D1」：聚合页不需要——直接读与老站同一份构建期快照 `plugins-real.ts`
  （只在构建时加载，不进任何产物）
- [x] 发布自动化：`.github/workflows/deploy-web.yml`（人推 main 且改到新站依赖的文件时）；
  `sync-plugins.yml` 每日数据提交后在同一 job 里直接发布新站——GITHUB_TOKEN 推的提交不会触发其他 workflow
- [x] `gradeOf` 抽到 `src/lib/grade.ts`（老站 score-badge 带 next-intl，新站没法直接 import）
- 发布顺序：**先发新站、再推路由器**。反过来会有几分钟聚合页被转给还没有这些页的新站（404 不触发回落）
- [x] 插件超市 `/plugins`：`plugins-browser.tsx` 移植为 Preact 岛（client:load；`@tanstack/react-virtual` 经 preact/compat 复用），
  交互逐项对齐（搜索、排序、分类/评级/语言筛选、计数联动与零结果禁用、懒加载、虚拟滚动）。
  **页面 JS 259KB → 21KB**，HTML（gzip）76KB → 42KB；parity 8/8（含 `/plugins/browse`）
- [x] `/api/plugins-data` 构建期生成静态 JSON（与老接口字节数一致），`_headers` 补 Content-Type
- [x] 路由器支持精确匹配（`MIGRATED_EXACT_PAGES`）：`/plugins` 不能按前缀接管，否则会吞掉 `/plugins/<owner>/<repo>` 详情页
- 分两次推送：先切四类 hub（新站已在线）并让 CI 首次发布含插件超市的新站；CI 发布完、线上验证后再把
  `/plugins`、`/plugins/browse` 加进路由器。本机经代理全量上传 2,618 个文件需 36 分钟，之后一律交给 CI

- 分类/标签/语言/分页页全量预渲染
- 插件超市：虚拟列表 + 筛选岛（Preact + `@tanstack/virtual-core`）

### 第 4 阶段 · 插件详情页

**已上线（2026-09-30）**：`/[l]/plugins/<owner>/<repo>`（约 6.5 万 URL）由新站提供。

- **全部按需渲染**（未采纳原计划的「Top ~1000 预渲染」）：页面含 star 增长、下载量、评分明细等实时字段，
  预渲染会把它们冻结到下一次构建；老站路由器已给详情页套 1h 边缘缓存，预渲染的收益只剩首个未命中请求
- 数据：D1 binding（`import { env } from "cloudflare:workers"`），与老站同一套 SQL；**读库失败直接 5xx → 路由器回落 Next**，
  不带静态快照兜底（那意味着把 11.7MB 快照编进 Worker）
- 构建期旁车：相关插件 / 相关文档 / 站内标签 / 编辑稿安装命令按名字哈希分 64 片 JSON（6.2MB，单片 ≤125KB），
  运行时经 `ASSETS` binding 读取、按 isolate 缓存。构建时间 17s → 52s（相关插件算 1.6 万次）
- **Worker 产物压缩后 389KB**（老站 5.6MB）；详情页 HTML（gzip）33KB → 25KB，首屏 JS 253KB → 8.7KB
  （搜索框 client:idle、讨论区 client:visible，讨论区有评论才加载 Markdown 渲染器）
- parity：200 个详情页 200/200（本地、workers.dev 真实环境、正式域名三次）
- **踩坑：`assets.not_found_handling: "404-page"` 与按需渲染不兼容**——浏览器导航请求带 `Sec-Fetch-Mode: navigate`
  时资源层直接回 404 页、不调用 Worker，所有详情页在浏览器里都是 404；curl 不带这个头所以测不出。
  已去掉，站内 404 改由 Worker 经 ASSETS 取对应语言的静态 404 页；`seo-parity.mjs` 默认带浏览器导航请求头
- 本地 wrangler dev 连线上 D1（`"remote": true`）经本机代理偶发 `Network connection lost`，线上原生 binding 无此问题

- 构建期取 Top ~1000（按 star/评分）预渲染；其余 `prerender = false` 读 D1
- README 在同步脚本阶段渲染成安全 HTML 入库（复用 `scripts/lib/readme-render.mjs`），页面不带 markdown 解析器
- 相关插件、面包屑、评分理由、JSON-LD 与老站对齐

### 第 5 阶段 · 首页 + 搜索

**已上线（2026-09-30）**：`/[l]`（语言首页）与 `/[l]/search` 由新站提供。

- 首页全量预渲染，交互（打字机、换一批、淡入）全是原生脚本；HTML（gzip）61KB → 31KB。
  编辑推荐整池（54 张卡、9 批）随 HTML 下发，非首批 `hidden`
- **有意改进**：老站打字机首帧为空串，服务端输出的首页 h1 是空的；新站服务端直接输出第一句
- 搜索页未按原计划上 Pagefind：搜索本来就走公开的 `/v1/plugins?q=`（与桌面端同一接口、CORS 放行、边缘缓存 5 分钟），
  改为静态外壳 + 结果岛在浏览器里直连，不再每请求占 Worker；Pagefind 要为 1.6 万插件建索引、每日重建，收益不抵成本。
  结果页补 `noindex`、去掉 canonical
- 导航栏 logo 裂图的教训：迁移期正式域名只把 `/_astro/*` 与已迁移页面转给新站，新站 `public/` 下的新文件会落到老站 → 404。
  图片一律资源导入；迁移期曾用 `scripts/rewrite/check-public-assets.mjs` 在 deploy-web 挡住这类发布（切换后已删）
- 路由器：`MIGRATED_EXACT_PAGES` 加 `''`（语言首页）与 `/search`；根路径 `/` 仍由老站按偏好重定向

- 首页三条 rail 预渲染，`pnpm refresh` 触发重建
- Pagefind 构建索引；搜索页为岛

### 第 6 阶段 · 论坛、登录、API、sitemap

**进展（2026-10-01）**：文档、论坛、登录、分享接口、README 图片代理、搜索建议、sitemap 已迁。

- **文档**：`/[l]/docs` 预渲染；文档页按需渲染读 D1、服务端渲染 Markdown（零客户端 JS）；相关插件/课程构建期旁车。
  parity 272/272。踩坑：`.astro` 里 `<Markdown>{text}</Markdown>` 会把内容当插槽传给框架组件，react-markdown 拿不到字符串，
  正文空白而 head 全对——seo-parity 因此新增 `mainTextLength`（`<main>` 可见文字量，少 30% 以上报错）
- **论坛 / 登录**：交互组件**原样复用老站 React 组件**，经 Preact compat 运行；`next-intl`、`@/i18n/navigation`、`next/navigation`
  别名到 `apps/web/src/compat/` 的最小替身，外包 `IntlProvider` 按命名空间注入文案——不重写，避免与老站漂移。
  列表与帖子页按需渲染（服务端取公开论坛 API），发帖 / 登录为静态外壳。parity 10/10
- **分享徽章 / 展示卡 / README 图片代理**：核心逻辑抽成 `src/lib/share-render.ts`、`src/lib/readme-img-proxy.ts`，老站路由与新站共用；
  24 份线上 SVG 基准逐字节一致
- **sitemap**：XML 渲染与帖子分片拆到零快照依赖的 `src/lib/sitemap-xml.ts`；其余分片构建期预渲染（25 片与线上逐字节一致），
  索引与帖子分片按需渲染
- 构建期关闭 `remoteBindings`（预渲染不查 D1，不必建远程会话，那条连接一抖整个构建失败）
- 老站 Workers Builds 是**串行排队**的，每次提交约 15 分钟，连续推送时路由切换会滞后一小时以上
- [x] `/api/auth/me`（改为转发 api.dshfind.com，不再需要 `AUTH_SECRET`）与 `/api/internal/db`（新站已设 `D1_INTERNAL_TOKEN`）已迁

- GitHub OAuth / session 逻辑迁入 Astro middleware + endpoint（沿用 `jose`、`dshfind_session`）
- badge / card / readme-img / suggest / plugins-data / sitemap 迁为 endpoint，保持响应头与缓存口径

### 第 7 阶段 · 切换与退役

- `dshfind-web` 直接挂 `dshfind.com`；全量 URL parity 跑一遍
- 观察 2 周后删除 Next / OpenNext / `DOQueueHandler` 迁移 / `.open-next`

**进度（2026-10-01 已切换）**

- `dshfind.com`、`www.dshfind.com` 两个 Workers 自定义域名从 `dshfind` 改挂到 `dshfind-web`（先 www、后主域名，
  用 `PUT /accounts/:id/workers/scripts/dshfind-web/domains/records` + `override_existing_origin`，无中断），
  随后写进 `apps/web/wrangler.jsonc` 的 `routes`（`custom_domain: true`），并关闭 workers.dev / 预览域
- `dev.dshfind.com` 仍挂老站 `dshfind`
- 切换后正式域名 parity：learn 152/152、details 200/200、docs 272/272、首页+搜索 5/5、论坛 10/10、index 8/8 全部一致；
  hubs 2464 页全部由 Astro 提供，差异均为基线后插件数增长（标题/描述里的计数），`lang/c` 因 C 插件跌破 `MIN_LANGUAGE_PLUGINS` 正常下线
- 根路径 / 缺语言前缀的 307、`/api/auth/me`、内部 D1 通道（只读查询经正式域名通过；错误 token 404）、Workers 缓存命中、无 noindex 均已验证
- deploy-web 冒烟改测正式域名；迁移期的 `check-public-assets.mjs` 已删
- **回滚**：把两个域名改挂回 `dshfind`（Dashboard → Workers → dshfind → Domains，或同一接口），它的路由器仍会把已迁移路径转发到新站；
  同时把 `apps/web/wrangler.jsonc` 的 `routes` 去掉，否则下次新站发布会再抢回域名
- [ ] 观察约一周后删除 Next / OpenNext 代码与老 Worker（含 `dev.dshfind.com`）；在此之前建议断开老站 Workers Builds，
  或把它的监听路径排除 `apps/**`、`docs/**`，免得每次提交白排 15 分钟队

## 4. 风险与对策

| 风险 | 对策 |
| --- | --- |
| 迁移期两套代码漂移（数据刷新改了老站没改新站） | `packages/data` 共用；生成脚本产物同时服务两边 |
| 路由器转发增加延迟/费用 | service binding 同机房调用；迁移期短，第 7 阶段拆掉 |
| hreflang / canonical 细节回退导致排名波动 | 每阶段 parity Gate + 分段上线、Search Console 观察期 |
| Astro 7 较新（Vite 8、Rust 编译器、Sätteri） | 第 1 阶段先打样验证 MDX、CF 适配器、构建时长，不行再定版 |
| 构建时间（1.6 万插件 × 4 语言） | 只预渲染 Top ~1000 详情；其余按需 |

## 5. 基线记录（第 0 阶段填写）

| 指标 | 老站 | 新站目标 |
| --- | --- | --- |
| sitemap URL 数 | 68,484（详情页 65,580 / 标签 2,024 / 分页 328 / 文档 272 / 教程 152） | 相同 |
| Search Console 收录 / 28 天点击 | 待填（手动） | 不下降 |
| CrUX 移动端 LCP / INP / CLS p75 | 待填（手动） | ≤ 2.0s / ≤ 200ms / ≤ 0.1 |
| 首屏 JS（gzip，2026-09-30 线上） | 首页 248KB / 教程 254KB / 详情 253KB / 插件超市 350KB | 内容页 ≤ 30KB，超市 ≤ 80KB |
| HTML（gzip） | 首页 61KB / 教程 39KB / 详情 33KB / 插件超市 76KB | |
| Worker 产物（`handler.mjs` gzip） | 5.6MB（上限 10MB） | < 1MB |
| CF Workers 请求 / CPU / 月费用 | 待填（手动） | 明显下降 |

复现：`node scripts/rewrite/url-inventory.mjs` → `node scripts/rewrite/seo-parity.mjs --snapshot`（产物在 `output/rewrite/`，不入库）。
