# Vercel + Railway 生产部署手册

English: [Vercel + Railway Production Deployment Guide](./deployment-railway-vercel.md)

本文档描述 dshfind 当前的目标生产拓扑、首次接入顺序、配置项、验收、发布 Gate 和故障恢复。它以仓库中的 [`railway.json`](../railway.json)、[`server/Dockerfile`](../server/Dockerfile) 与 GitHub Actions 工作流为准；不要把它理解为 Railway 或 Vercel 的通用教程。

## 1. 目标拓扑与职责边界

```text
访问者
  ├─ https://dshfind.com      → Vercel / Next.js 16（页面、静态内容、UI）
  └─ https://api.dshfind.com  → Railway / Go API（公开目录、GraphQL、OAuth、审计）
                                      │
                                      └→ Turso / libSQL（插件数据、i18n、快照、API key、审计）

GitHub Actions
  ├─ 每日同步 GitHub topic → Turso
  ├─ CI（前端、Go、Docker、工作流）
  └─ Production Gate（观察两端 Git 自动发布、验收、失败时共同恢复）
```

| 组件 | 责任 | 不应承担的责任 |
| --- | --- | --- |
| Vercel | `dshfind.com` 前端、Next.js 运行时、会话 JWT 验签、静态回退数据 | GitHub OAuth client secret、Turso 访问、公开 API 的审计/限流 |
| Railway | `api.dshfind.com`、Go HTTP API、GitHub OAuth、请求审计、进程内限流 | 前端 HTML、跨副本的持久化令牌余额 |
| Turso | 插件目录、翻译、历史快照、API key 策略、审计记录 | 高频令牌桶计数；每个请求写数据库会降低可用性 |
| GitHub Actions | 同步、测试、发布观察/回滚 | 直接替代 Vercel/Railway 的 Git 自动部署 |

前后端通过公开 HTTPS API 通信。浏览器查询可直接访问 API；Vercel 的服务端搜索请求使用专用 `BACKEND_API_KEY`，避免多个 Vercel 出口 IP 被当作同一个匿名访问者。GitHub 登录只在 Go API 完成，Vercel 只使用相同的 `AUTH_SECRET` 验签 API 签发的会话。

## 2. 首次部署前的准备

### 2.1 账户、项目与域名

准备下列资源：

1. 一个 Vercel Project，连接本仓库并仅对 `main` 进行生产发布。
2. 一个 Railway Project（建议名为 `dshfind`），production 环境下有一个 Go 服务（建议名为 `dshfind-api`）。
3. 一个具备读写权限的 Turso 数据库与单独、可轮换的 auth token。
4. DNS 对 `dshfind.com` 的控制权。
5. 一个 GitHub OAuth App；其 callback 在第 5 节设置。
6. GitHub 仓库的 Actions `production` Environment，供生产 Gate 使用。

本仓库当前可用的 Railway 项目/服务标识应写入 GitHub Environment Variables，而不应写入代码或文档中的固定 ID。项目创建并不等于服务已可用：必须完成变量、数据源、部署和域名验收。

### 2.2 Turso 数据库

Go 服务启动时只会幂等创建/补齐读取插件、API key 与审计所需的最小 schema；**插件内容不由 API 生成**。首次上线前运行一次同步工作流，或在有相同凭据的本地环境执行：

```bash
pnpm install --frozen-lockfile
pnpm sync:db
pnpm probe:install
```

生产环境推荐由 [`.github/workflows/sync-plugins.yml`](../.github/workflows/sync-plugins.yml) 每日执行。它使用 GitHub repository secrets 中的 `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN` 及 `GITHUB_TOKEN`；不要把它们提交到仓库。

### 2.3 先确认仓库根目录

Railway 服务的 Root Directory 必须是**仓库根目录**，不能是 `server`：

- 根目录 [`railway.json`](../railway.json) 选择 `server/Dockerfile`；
- Docker build context 必须包含 `server/go.mod`、`server/go.sum` 与 `server/`；
- Watch Paths 只监听 `server/**`、`railway.json`；
- `/healthz` 是健康检查，等待上限 60 秒；
- `drainingSeconds: 30` 与 Go 进程的审计排空配合，避免重部署丢失最后一批审计事件。

不要把 root directory 设为 `server`，否则 `dockerfilePath: server/Dockerfile` 会指向错误路径，且 Dockerfile 的 `COPY server/...` 也找不到文件。

## 3. Railway 服务配置

### 3.1 创建并连接 Git 源

在 Railway 中创建空服务后，将其连接到本 GitHub 仓库，并将 production branch 设为 `main`。Railway 应保留 Git 自动发布；不要让 GitHub Actions 主动上传一份不同来源的构建产物。

首次发布前检查服务配置：

| 设置 | 应有值 | 目的 |
| --- | --- | --- |
| Build | Dockerfile | 使用仓库的 `railway.json` |
| Dockerfile path | `server/Dockerfile` | 由 `railway.json` 固化 |
| Root Directory | 空/仓库根目录 | 维持正确 Docker context |
| Healthcheck path | `/healthz` | 只有插件快照加载成功才返回 200 |
| Healthcheck timeout | 60 秒 | 容纳冷启动和短暂 Turso 网络波动 |
| Draining seconds | 30 秒 | 让 SIGTERM 后的审计队列有时间落库 |
| Watch paths | `server/**`, `railway.json` | 前端纯改动不触发 API 重建 |

### 3.2 Railway Variables

以下值配置在 Railway production service。带“必须”的变量不应依赖默认值。

| 变量 | 必须 | 建议生产值/来源 | 说明 |
| --- | --- | --- | --- |
| `TURSO_DATABASE_URL` | 是 | Turso database URL | `libsql://` 会在程序内改写成 HTTPS；token 要有 API 迁移和审计写入权限 |
| `TURSO_AUTH_TOKEN` | 是 | Turso token | 不提交、不放到 Vercel |
| `WEB_URL` | OAuth 时是 | `https://dshfind.com` | 唯一前端回跳 origin |
| `API_PUBLIC_URL` | OAuth 时是 | `https://api.dshfind.com` | 对外 API 基址与 GitHub callback 基址 |
| `AUTH_COOKIE_DOMAIN` | 生产 OAuth 时是 | `dshfind.com` | 使会话 Cookie 被前端和 API 子域共享 |
| `GITHUB_CLIENT_ID` | OAuth 时是 | GitHub OAuth App | 仅 Railway |
| `GITHUB_CLIENT_SECRET` | OAuth 时是 | GitHub OAuth App secret | 仅 Railway |
| `AUTH_SECRET` | OAuth 时是 | 32+ 字符随机值 | 必须和 Vercel 完全相同；轮换会令现有会话失效 |
| `GITHUB_ORG` | 否 | `dsh-external` | 可登录组织；默认即该值 |
| `ADMIN_TOKEN` | 强烈建议 | 随机高熵 token | 为空时 `/v1/admin/*` 整体禁用（503） |
| `CACHE_REFRESH_MINUTES` | 否 | `10` | 插件快照/API key 内存刷新周期 |
| `LOG_RETENTION_DAYS` | 否 | `30` | 原始审计记录保留天数；按日聚合永久保留 |

Railway 会自动注入 `PORT`。在 Git 部署中还会注入 `RAILWAY_GIT_COMMIT_SHA` 和 `RAILWAY_DEPLOYMENT_ID`；不要手工伪造它们，生产 Gate 用 `/healthz` 的对应值验证真实流量所在版本。

### 3.3 限流运行参数

令牌余额是**单进程、易失的内存状态**；重启清零是有意的。持久化的是 Railway Variables 中的规则，以及 Turso `api_keys.rate_per_min` 中的每 key 策略。默认值针对单副本、日十万 PV 量级的常规峰值：

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `GLOBAL_RATE_PER_MIN` / `GLOBAL_RATE_BURST` | 6000 / 500 | 全部公开请求的进程总预算（100 RPS 持续） |
| `IP_RATE_PER_MIN` / `IP_RATE_BURST` | 240 / 60 | 匿名来源 IP 的总保护 |
| `ANON_RATE_PER_MIN` / `ANON_RATE_BURST` | 30 / 10 | 普通公开查询的额外匿名额度 |
| `SUGGEST_RATE_PER_MIN` / `SUGGEST_RATE_BURST` | 60 / 20 | 输入联想的额外额度 |
| `GRAPHQL_RATE_PER_MIN` / `GRAPHQL_RATE_BURST` | 60 / 20 | GraphQL 的额外 IP 额度 |
| `GRAPHQL_RATE_COST` | 10 | 一次 GraphQL 在全局桶中等价于 10 次普通请求 |
| `KEY_RATE_PER_MIN` / `KEY_RATE_BURST` | 120 / 30 | API key 默认额度；表内设置可覆盖每分钟值 |
| `AUTH_RATE_PER_MIN` / `AUTH_RATE_BURST` | 60 / 20 | OAuth/会话单 IP 额度 |
| `AUTH_GLOBAL_RATE_PER_MIN` / `AUTH_GLOBAL_RATE_BURST` | 1800 / 100 | OAuth/会话独立全局额度 |
| `RATE_LIMIT_MAX_BUCKETS` | 65536 | 非全局活跃 bucket 的内存硬上限 |

所有上述变量必须为正整数；非法值会使实例启动失败。当前 `global` 只在**一个 Railway replica** 内成立。扩容到多副本前，先把全局限流迁移到 Redis/Valkey 等易失共享限流器或边缘 WAF；不要把每个 token 的扣减持久化到 Turso。

### 3.4 首次部署与健康检查

推送 `main`，等待 Railway 部署进入 `SUCCESS`，然后先用 Railway 提供的 `*.up.railway.app` 域名验证：

```bash
curl --fail --show-error https://<railway-domain>/healthz
curl --fail --show-error 'https://<railway-domain>/v1/plugins?per_page=1'
curl --fail --show-error --get 'https://<railway-domain>/graphql' \
  --data-urlencode 'query={ dataset { dataVersion asOf } }'
```

健康响应中 `status` 必须为 `ok`，`plugins_loaded` 应符合数据库数据量，且 Git 集成部署应包含非空的 `commit_sha` 和 `deployment_id`。启动初期 Turso 不可用时进程仍会监听端口，但 `/healthz` 返回 503 并每 5 秒重试初始化；这是为了防止健康流量被“空缓存实例”接走。

## 4. Vercel 配置

Vercel Project 同样连接本仓库并以 `main` 作为 production branch。设置 production 环境变量后重新部署：

| 变量 | 必须 | 值 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | 是 | `https://api.dshfind.com` |
| `BACKEND_API_KEY` | 建议 | 在 Go Admin API 创建的 server-only key；绝不能用 `NEXT_PUBLIC_` 前缀 |
| `AUTH_SECRET` | OAuth 时是 | 与 Railway 相同的值，用于验证 API 签发的 HS256 会话 |
| `AUTH_GATE` | 否 | `1` 时启用组织成员门禁；未设置时登录仍可用但不强制门禁 |

Vercel **不应**再保存 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_ORG` 或 Turso 写 token。Go API 是 OAuth owner；泄露到 Vercel 会扩大 secret 的运行时暴露面。

在 Railway `ADMIN_TOKEN` 已配置后，为 Vercel 创建服务端 key（明文仅返回一次）：

```bash
curl -X POST https://api.dshfind.com/v1/admin/keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"name":"vercel-production","contact":"ops","rate_per_min":3600}'
```

把返回的 `key` 保存为 Vercel 的 `BACKEND_API_KEY`。它只授权公开只读 API，不授予 Admin 或数据库访问权。

## 5. 域名、DNS 与 GitHub OAuth

### 5.1 API 域名切换

1. Railway service → Settings → Custom Domain，添加 `api.dshfind.com`。
2. Railway 会给出 CNAME target。只使用控制台**当次显示**的 target，不要从旧文档复制。
3. 在 DNS 中把 `api.dshfind.com` 的记录改成该 CNAME，移除/解绑把该子域交给 Vercel 的旧记录与 Vercel domain assignment。
4. 等 DNS 与 Railway domain 状态均生效后，确认：

   ```bash
   curl -i https://api.dshfind.com/healthz
   ```

   响应必须来自 Railway 且为 200；若仍有 `x-vercel-error: DEPLOYMENT_NOT_FOUND`，说明 DNS/Vercel 域名归属尚未切换完成，不能继续前端发布。
5. 在 Vercel 填入 `NEXT_PUBLIC_API_BASE_URL` 并重新部署。浏览器直连公开数据 API 使用 `Access-Control-Allow-Origin: *`；认证端点只接受 `WEB_URL` 的带凭据请求。

### 5.2 GitHub OAuth App

在 GitHub OAuth App 中把 Authorization callback URL 设为：

```text
https://api.dshfind.com/auth/github/callback
```

它不能指向已拆除的 Vercel `/api/auth/...` 路径。Go API 在 callback 中执行 PKCE/state 校验、用临时 access token 查询 GitHub 用户和 `GITHUB_ORG` 成员资格，然后签发 `dshfind_session`。GitHub access token 不落库、不写 Cookie。

生产 Cookie 的关键属性为 `HttpOnly; Secure; SameSite=Lax; Domain=dshfind.com`。`AUTH_SECRET` 变化会让所有会话立即失效，因此应在低峰期轮换，并同步更新 Railway 与 Vercel 后再发布。

## 6. CI 与双平台生产 Gate

### 6.1 合并前 CI

`.github/workflows/ci.yml` 在 `dev`、`main` 的 push 与 PR 上运行：

- 前端：锁定依赖安装、`next typegen`/TypeScript、ESLint、Node 测试、`next build`；
- 后端：`go test -race ./...`、`go vet ./...`、Linux 静态构建、仓库根目录作为 Docker context 的 `server/Dockerfile` 构建；
- 部署资产：Gate Node 语法/测试、GitHub Actions workflow 校验、Railway schema 校验。

为 `main` 启用分支保护，并要求 `CI / Frontend checks` 与 `CI / Go API and Docker checks` 成功后才可合并。

### 6.2 生产 Gate 配置

创建 GitHub `production` Environment，并设置：

| 类型 | 名称 |
| --- | --- |
| Secrets | `VERCEL_TOKEN`, `RAILWAY_TOKEN` |
| Variables | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_SERVICE_ID`, `PROD_WEB_URL=https://dshfind.com`, `PROD_API_URL=https://api.dshfind.com` |

`RAILWAY_TOKEN` 应为只覆盖该 production API 服务的 project token。Gate 首先检查变量完整性；缺失时直接失败，不会执行不安全的回滚。

每次 `main` push 时，Vercel/Railway 仍各自自动部署。Gate 不主动发布，而是：

1. 记录旧的健康 Vercel production deployment 与 Railway deployment（锚点）；
2. 确认本次工作流仍对应 `main` HEAD，过期任务跳过；
3. 重跑前端/Go/Docker 校验；
4. 等待 Vercel 的当前 SHA 变为 `READY`；仅当 `server/**` 或 `railway.json` 有变化时，等待 Railway 健康端点实际服务当前 SHA；
5. 对网站首页、`/healthz`、suggest 和公开 GraphQL 做冒烟检查；
6. 任一校验、部署、超时或冒烟失败时：Vercel 将记录的 deployment **promote** 回 production，Railway 回滚到可回滚锚点，再重新检查健康与冒烟；
7. 回滚或其验证失败均使工作流失败并输出锚点 ID。

这保证失败后的共同恢复，不是原子切流：两家平台完成自动部署的时间不同，仍可能出现很短的前后端版本不一致窗口。Turso 是共享数据，不会随应用回滚；所有数据库变更必须向后兼容至少前一个应用版本。

首次真实 API rollout 完成后，手动运行 `Production deployment gate` 的 `mode=preflight`。它仅读取当前锚点；当且仅当 `/healthz` 的 `commit_sha`、`deployment_id` 与 Railway 控制面相符时，才可启用自动 Gate。

## 7. 发布验收清单

按此顺序执行可避免“前端已切到 API、API 域名尚未可用”的故障：

1. [ ] Turso 已存在插件数据，日同步 workflow 成功。
2. [ ] Railway service 的必需 Variables 已设置，`AUTH_SECRET` 已与 Vercel 对齐。
3. [ ] Railway `*.up.railway.app/healthz`、`/v1/plugins`、`/graphql` 都通过。
4. [ ] `api.dshfind.com` 已只指向 Railway，`/healthz` 不再返回 Vercel 404。
5. [ ] GitHub OAuth callback 已改为 API 子域，`/auth/github` 能跳到 GitHub 且 callback 最终回到前端。
6. [ ] Vercel production 已设置 API base、server-only key 与同一会话 secret，并重新部署。
7. [ ] 浏览器搜索、Vercel 服务端搜索、REST、GraphQL 与健康端点通过。
8. [ ] CI 已在 `main` 通过；GitHub `production` Environment 的 Gate 凭据/变量齐全。
9. [ ] 手动 `preflight` 成功，再观察一次正常 `main` 发布的 Gate。

建议使用以下最小冒烟集：

```bash
curl --fail --show-error https://dshfind.com/zh
curl --fail --show-error https://api.dshfind.com/healthz
curl --fail --show-error 'https://api.dshfind.com/v1/suggest?q=memory'
curl --fail --show-error --get https://api.dshfind.com/graphql \
  --data-urlencode 'query={ plugins(first: 1) { totalCount nodes { fullName repositoryUrl } } }'
```

## 8. 故障定位与恢复

| 现象 | 首先检查 | 常见根因/处理 |
| --- | --- | --- |
| `api.dshfind.com` 是 Vercel `DEPLOYMENT_NOT_FOUND` | DNS 与 Vercel Domains | 子域仍被 Vercel 接管；移除旧 assignment，按 Railway CNAME 绑定 |
| Railway build 找不到 `server/go.mod` 或 Dockerfile | Root Directory、build logs | Root Directory 误设为 `server`；恢复到仓库根目录 |
| Railway 健康检查 503 | `/healthz` 与 runtime logs | Turso URL/token 不可用或首次快照未加载；检查 Variables、数据库连通性与同步表 |
| API 200 但列表为空 | `/v1/plugins?per_page=1` | 只有最小迁移表，没有同步插件内容；运行/修复同步 workflow |
| 登录跳转后失败 | OAuth App callback、`WEB_URL`、`API_PUBLIC_URL`、Cookie domain | 仍指向旧 Vercel callback，或两端 secret/domain 不一致 |
| Gate 没有锚点/拒绝执行 | GitHub Environment、`/healthz` | Variables/secret 缺失，或 API 没有报告当前 commit/deployment ID |
| Gate 失败并触发恢复 | Gate 日志的 Vercel/Railway anchor ID | 先确认双端恢复后的冒烟；不要通过 Instant Rollback 代替 Vercel promote |
| 多副本后出现实际额度放大 | Railway replica 数、429 指标 | 进程内桶按副本独立；切换到 Redis/Valkey 或边缘全局限流 |

手动恢复优先走 GitHub `Production deployment gate` 的日志和记录锚点，而不是直接重建服务。若数据库 schema 变更与旧应用不兼容，应用回滚无法保证安全，应先停止发布并通过向后兼容迁移恢复。

## 9. 关联文档

- [公开数据接口与查询指南](./api-query.zh-CN.md)
- [Public Data API and Query Guide](./api-query.md)
- [`server/README.md`](../server/README.md)：本地运行、内部 Admin API 与实现细节
- [`railway.json`](../railway.json)：受版本控制的 Railway build/deploy 配置
- [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml)：生产 Gate 的可执行定义
