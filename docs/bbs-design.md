# dshfind 社区功能设计（插件反馈 + BBS）

> 状态：Phase 1（插件投票 + 评论）已实施 2026-08-18；Phase 2/3 待实施 ｜ 2026-08-18
> 关联：`server/`（Go API，Railway）、Turso、Vercel 前端（全站 SSG/ISR）

## 0. 背景与铁律

2026-08-17 全站刚完成静态化改造（见 git log `b882892`）：Vercel 上除 login/search 外全部页面走 SSG/ISR，费用靠"零函数调用"压下来。社区功能天然是动态 + 每用户不同 + 要读会话——正好是之前把账单打爆的模式。

因此本设计的铁律：

1. **所有动态请求打到 Railway 的 Go API**（`api.dshfind.com`，固定月费），Vercel 只出静态壳；
2. **Vercel 侧任何页面不得在服务端读 cookies()/headers()**，登录态一律客户端 fetch（沿用 `user-chip.tsx` 模式）；
3. 不引入新的付费组件（无 Redis、无第三方评论服务、无 Discourse）。

## 1. 功能范围

| # | 功能 | 说明 |
|---|------|------|
| 1 | 插件点赞 / 点踩 | 每插件 up/down 计数，登录用户每人一票，可改可撤 |
| 2 | 插件"反馈有问题" | 带理由的负面反馈，本质是打了 `issue` 标记的评论；后续可喂给插件评分体系 |
| 3 | 插件评论 | 每个插件详情页下方的讨论流 |
| 4 | 板块 BBS | 发帖/回帖，Markdown 格式 |
| 5 | 总板块聚合页 | `/bbs` 默认混排全部板块（含插件讨论），冷启动期内容少也不显得空 |

## 2. 数据模型（统一，一套表两个出口）

插件评论不单独建表：每个插件首条评论时自动创建一个隐式帖子（`board='plugin'`、`plugin_full_name` 非空），评论即其回复。"插件讨论"因此天然是 BBS 的一个板块。

迁移追加到 `server/internal/store/migrate.go` 的 `migrations` 数组：

```sql
CREATE TABLE IF NOT EXISTS forum_threads (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,        -- URL 标识（标题转写 + 短随机后缀）
  board            TEXT NOT NULL,               -- general/help/dev/announce/plugin
  title            TEXT NOT NULL,
  body_md          TEXT NOT NULL DEFAULT '',    -- Markdown 原文，服务端不产 HTML
  author_login     TEXT NOT NULL,               -- 以下三列从会话快照，不建 users 表
  author_name      TEXT,
  author_avatar    TEXT,
  locale           TEXT NOT NULL DEFAULT 'zh',
  plugin_full_name TEXT,                        -- 非空 = 插件讨论
  reply_count      INTEGER NOT NULL DEFAULT 0,  -- 冗余计数，列表免 JOIN
  last_post_at     TEXT,
  is_pinned        INTEGER NOT NULL DEFAULT 0,
  is_locked        INTEGER NOT NULL DEFAULT 0,
  deleted_at       TEXT,                        -- 软删除，审计走 audit 包
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_threads_board  ON forum_threads(board, last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_plugin ON forum_threads(plugin_full_name);

CREATE TABLE IF NOT EXISTS forum_posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id     INTEGER NOT NULL,
  body_md       TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'comment', -- comment | issue（"反馈有问题"）
  author_login  TEXT NOT NULL,
  author_name   TEXT,
  author_avatar TEXT,
  deleted_at    TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_thread ON forum_posts(thread_id, created_at);

CREATE TABLE IF NOT EXISTS plugin_votes (
  full_name  TEXT NOT NULL,
  user_login TEXT NOT NULL,
  verdict    TEXT NOT NULL,                     -- up | down
  created_at TEXT NOT NULL,
  PRIMARY KEY (full_name, user_login)           -- 每人一票
);
```

设计取舍：

- **投票必须登录**（GitHub OAuth 已有）。匿名投票 = 机器人刷票，数字立刻失去意义。
- **"有问题"= 带 `kind='issue'` 的评论**：必须附理由才有信息量；未来可作为评分体系的负面信号源。
- **作者信息快照**进行存储，不建 users 表——会话 JWT 里有 login/name/avatar，v1 够用。
- **软删除**（`deleted_at`），配合现有 `audit` 包留痕。

## 3. Go API（挂在 `server.go`，沿用现有中间件）

### 读（CORS `*`，无凭据；`public` 限流档；响应带短 s-maxage）

```
GET /v1/plugins/{owner}/{repo}/discussion
    → { up, down, myVote?, comments: [...] }   // myVote 仅带 cookie 时返回
GET /v1/forum/threads?board=&locale=&page=      // 不传 board = 总板块混排
GET /v1/forum/threads/{slug}                    // 帖子 + 回复
```

### 写（带凭据 CORS——照抄 `/auth/me` 的 Origin 白名单模式；`authLimited` + 新增写入限流档）

```
POST   /v1/plugins/{owner}/{repo}/comments   { body_md, kind }
PUT    /v1/plugins/{owner}/{repo}/vote       { verdict }；DELETE 撤票
POST   /v1/forum/threads                     { board, title, body_md, locale }
POST   /v1/forum/threads/{slug}/posts        { body_md }
DELETE /v1/forum/posts/{id}                  // 仅本人
```

管理（现有 `adminOnly`）：删/恢复任意帖、置顶、锁帖。v1 不做管理 UI，curl 即可。

### 安全与反垃圾

- 写接口校验 `Origin` ∈ 白名单（SameSite=Lax + 同注册域已挡大半 CSRF，此为双保险）；
- 正文 ≤ 10KB、标题 ≤ 200 字符、单帖链接数 ≤ 5；
- 写入限流：每用户 5 帖/小时、投票 30 次/小时（复用 `ratelimit` 包，加 profile）;
- Markdown **只存原文**，服务端一个字节 HTML 都不生成；
- 后续（Phase 3）：GitHub 账号注册满 N 天才能发帖、信任等级。

## 4. 前端（Vercel 侧，零费用增量）

| 位置 | 渲染方式 | 说明 |
|------|---------|------|
| 插件详情页底部 | 客户端组件 `<PluginDiscussion>` | 投票按钮 + 评论流 + 编辑器；未登录显示"用 GitHub 登录参与"（`githubLoginURL`）。详情页本身仍是 ISR 静态，不动 |
| `/[locale]/bbs` | 静态壳 + 客户端拉取 | **总板块聚合页**：默认全部板块混排，顶部板块 chips 过滤（交互抄插件超市）；列表变动频繁、SEO 价值低，不值得 ISR |
| `/[locale]/bbs/t/[slug]` | **ISR（revalidate 长）+ 按需刷新** | SEO 主战场。Go 在发帖/回帖成功后回调 Next `POST /api/revalidate`（带 secret）主动刷新——读永远命中 CDN，只有写触发重渲染 |

- 板块 v1 硬编码：`general` 综合讨论 / `help` 求助问答 / `dev` 插件开发 / `announce` 公告（仅 admin 发帖）+ 自动的 `plugin` 插件讨论。不做板块管理界面。
- **语言不拆版块**：帖子带 `locale` 标签，列表默认按当前语言过滤、可一键看全部。低流量社区拆四份 = 四个都死。
- **Markdown 渲染**：`react-markdown` + `remark-gfm`，禁 raw HTML（react-markdown 默认行为），XSS 从根上断掉。
- 登录态沿用 `useSessionUser()`（sessionStorage 缓存 + `/api/auth/me`）。

## 5. 分期

**Phase 1 — 插件投票 + 评论（先做，1~2 天）**
表 + 4 个接口 + `<PluginDiscussion>` 组件。理由：5900+ 插件页每天在吃搜索流量，这是唯一"用户已经在场"的地方；BBS 空着没人看。

**Phase 2 — 板块 BBS（2~3 天）**
threads/posts 接口、`/bbs` 聚合页、帖子页 ISR + Go 回调 revalidate、发帖回帖 UI、Markdown 渲染。

**Phase 3 — 有人聊了再做**
帖子进 sitemap、站内搜索纳入帖子、审核 UI、通知/邮件、热门评论烤进插件页 ISR HTML（SEO）、信任等级。

## 5.1 Phase 1 实施记录（2026-08-18）

已落地：三张表（`server/internal/store/migrate.go`）、`store/forum.go`、`httpapi/forum.go` + `sessionWrite` 中间件、`<PluginDiscussion>` 挂在插件详情页底部（详情页仍是 ISR ●，`pnpm build` 已确认没有回到动态渲染）。端点与限流变量见 `server/README.md`。

与本文档的四处偏差，都是实施时发现原方案做不到或不划算：

1. **`myVote` 拆成独立端点** `GET /v1/me/plugin-votes/{owner}/{repo}`。原设想是 discussion 带 Cookie 时顺便返回，但公开读要 `Access-Control-Allow-Origin: *`，而浏览器不会给 `*` 的响应发 Cookie。拆开之后公开读还能整份进缓存，只有登录用户多发一个请求。
2. **Markdown 渲染推迟到 Phase 2**。正文照旧只存原文（`body_md`），Phase 1 按纯文本渲染（保留换行）。react-markdown 是要进每个插件详情页的包体的，等 BBS 一起上、两个地方共用一套渲染更划算。
3. **小时额度映射到分钟制令牌桶**：`ratelimit` 是按分钟补令牌的，一次写入记 60 个令牌，于是 `FORUM_*_RATE_PER_HOUR` 的数值正好等于每小时次数。
4. **插件讨论帖 slug 带 8 位 hash 后缀**：可读部分把 `/` 和 `.` 都压成 `-`，只靠它 `a/b-c` 与 `a-b/c` 会撞成同一个 slug，两个插件的评论就混进一个帖子了。

尚未验证的一环：`store/forum.go` 的 SQL 只跑过编译与 HTTP 层的假实现测试，真正对 Turso 的读写要等第一次部署（或接一个 scratch 库）才算验过。

## 6. 成本影响评估

- Vercel：新增 = 帖子页 ISR（写触发才重渲染）+ `/api/revalidate`（每次写一跳，可忽略）。读全部走 CDN 缓存或直连 Go。**静态化架构零回退**。
- Railway：Go 加几个 handler，同一实例，边际成本 0。
- Turso：读多写少，两张平表，量级远够。浏览量计数等写多场景（如未来要做）再评估，仍不需要 Redis。

## 7. 迁移退路

如果社区火了（日发帖上百、垃圾治理开始吃时间），threads + posts 两张平表可常规导入 Discourse。现在自建不是焊死，是低成本验证。
