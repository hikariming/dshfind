# dshfind API(Go)

dshfind.com 的独立后端服务:首页搜索建议、对外插件数据 API、GitHub OAuth 和访问审计。部署于 Railway,数据源是与 Next.js 前端共用的 Turso 库。服务会幂等补齐读取插件所需的表/列与审计表；插件内容仍由每日同步脚本写入。

## 本地运行

```bash
cd server
export TURSO_DATABASE_URL=libsql://...   # 或直接 source ../.env.local
export TURSO_AUTH_TOKEN=...
export ADMIN_TOKEN=$(openssl rand -hex 32)
go run ./cmd/api                          # 默认 :8080,PORT 可改
```

## 环境变量

| 变量 | 必需 | 默认 | 说明 |
|---|---|---|---|
| `TURSO_DATABASE_URL` | ✅ | — | `libsql://` 自动改写为 `https://` 走无状态 HTTP |
| `TURSO_AUTH_TOKEN` | ✅ | — | 需要写权限(审计表);建议单独签一枚便于轮换 |
| `ADMIN_TOKEN` | — | 空 | 空则 `/v1/admin/*` 整体 503 |
| `PORT` | — | 8080 | Railway 自动注入 |
| `RAILWAY_GIT_COMMIT_SHA` | Railway Git 部署时自动注入 | 空 | `/healthz.commit_sha`；生产 Gate 用它确认 API 正在服务目标 commit |
| `RAILWAY_DEPLOYMENT_ID` | Railway 自动注入 | 空 | `/healthz.deployment_id`；生产 Gate 用它将真实流量与精确回滚锚点关联 |
| `CACHE_REFRESH_MINUTES` | — | 10 | 插件快照 / key 表内存刷新周期 |
| `LOG_RETENTION_DAYS` | — | 30 | `api_requests` 明细保留天数(聚合表永久保留) |
| `GLOBAL_RATE_PER_MIN` / `GLOBAL_RATE_BURST` | — | 6000 / 500 | 当前 Go 服务进程内的全部公开请求共享的总量 token bucket（100 RPS 持续、500 突发） |
| `IP_RATE_PER_MIN` / `IP_RATE_BURST` | — | 240 / 60 | 当前 Go 服务进程内的单 IP 总量 bucket；IP 仅以 SHA-256 哈希留在内存 |
| `ANON_RATE_PER_MIN` / `ANON_RATE_BURST` | — | 30 / 10 | 匿名数据请求的额外 IP bucket |
| `SUGGEST_RATE_PER_MIN` / `SUGGEST_RATE_BURST` | — | 60 / 20 | suggest 的额外 IP bucket，允许输入联想突发 |
| `GRAPHQL_RATE_PER_MIN` / `GRAPHQL_RATE_BURST` | — | 60 / 20 | GraphQL 的额外单 IP bucket；带 key 的 GraphQL 请求也受它约束 |
| `GRAPHQL_RATE_COST` | — | 10 | 每个 GraphQL 请求在全局 bucket 中消耗的令牌数；默认等价于 10 个普通请求（约 10 GraphQL RPS 持续、50 突发） |
| `KEY_RATE_PER_MIN` / `KEY_RATE_BURST` | — | 120 / 30 | 带 key 的额外 bucket；`api_keys.rate_per_min` 可覆盖前者 |
| `AUTH_RATE_PER_MIN` / `AUTH_RATE_BURST` | — | 60 / 20 | OAuth / 会话端点的单 IP bucket |
| `AUTH_GLOBAL_RATE_PER_MIN` / `AUTH_GLOBAL_RATE_BURST` | — | 1800 / 100 | OAuth / 会话端点的独立进程内全局 bucket（30 RPS 持续） |
| `RATE_LIMIT_MAX_BUCKETS` | — | 65536 | 进程内活跃非全局 bucket 的硬上限；容量耗尽时新的未知身份暂时返回 429，已存在身份与全局保护不受驱逐 |
| `GITHUB_CLIENT_ID` | OAuth 启用时 ✅ | — | GitHub OAuth App 的 Client ID；与下三项必须同时设置 |
| `GITHUB_CLIENT_SECRET` | OAuth 启用时 ✅ | — | GitHub OAuth App 的 Client secret；仅保存在 Railway |
| `AUTH_SECRET` | OAuth 启用时 ✅ | — | 至少 32 字符的随机值；Railway 与 Vercel 必须相同，用于签发/校验 HS256 会话 JWT |
| `WEB_URL` | OAuth 启用时 ✅ | `http://localhost:3100` | 前端唯一回跳 Origin，如 `https://dshfind.com` |
| `API_PUBLIC_URL` | OAuth 启用时 ✅ | `http://localhost:8080` | API 公开 Origin，如 `https://api.dshfind.com`；也是 GitHub callback 基址 |
| `AUTH_COOKIE_DOMAIN` | 生产环境 ✅ | 空 | 共享登录态的父域，如 `dshfind.com`；本地 `localhost` 留空 |

## 公开 API

Base URL:`https://api.dshfind.com`。REST 端点均为只读 GET；GraphQL 支持只读 `GET` 与 `POST /graphql`。CORS `*`，匿名可用；带 API key 限流更宽、审计可精确归属。key 通过 `Authorization: Bearer dshf_...` 或 `X-Api-Key: dshf_...` 传递,无效 key 返回 401(不会静默降级为匿名)。

所有成功的公开数据响应均有强 `ETag`；GET 可携带 `If-None-Match` 获得 `304 Not Modified`。suggest 的共享 CDN TTL 为 1 小时；列表、详情与 GraphQL 为 5 分钟，并允许一天 `stale-while-revalidate`。需要共享 CDN 缓存或条件请求 GraphQL 时请使用 GET（`query` / `variables` 参数）；POST 同样有 ETag，是否缓存由中间代理决定。响应不因 API key 改变，因此可安全作为公共表示缓存。

限流规则由 Railway 持久化环境变量提供，API key 的定制额度由 Turso 的 `api_keys.rate_per_min` 持久化；令牌余额只在 Go 内存中，重启会有意清零，因而公开请求不会产生 Turso 限流写入。所有限流变量必须是正整数，错误配置会使实例启动失败，避免静默使用不符合预期的默认值。匿名请求原子地消耗业务身份、IP 与服务进程全局 bucket；有效 key 消耗其专属持久化额度与全局 bucket（GraphQL 仍有 IP 保护），避免 Vercel 的共享出口 IP 误伤用户。无效 key 也会先消耗匿名/IP/全局额度再返回 401。非全局 bucket 闲置 5 分钟后回收，并受 `RATE_LIMIT_MAX_BUCKETS` 硬上限保护；429 会返回 `Retry-After`。

当前 Railway 服务以单副本运行时，`global` 就是完整服务全局额度；默认 100 RPS 公共数据预算适合日十万 PV 的常规峰值（还应以真实 API RPS 和 429 比例调优）。**在启用多个 Railway replica 之前**，必须将限流切换到 Redis/Valkey 的易失共享 bucket 或边缘 WAF/限流服务；不能通过 Turso 持久化令牌余额来获得跨副本全局限流。

`/auth/*` 不属于公开数据 API：它只允许 `WEB_URL` 这个 Origin 携带 Cookie，不能使用 `CORS: *`；OAuth start、callback、session 读取和 logout 另受单 IP 60/min（20 突发）与独立全局 30 RPS（100 突发）保护。

### `GET /v1/suggest?q=`

搜索建议,与站内 `/api/suggest` 完全同构。`q` 少于 2 字符返回空;最多 10 条,featured 优先、star 降序。

```json
{ "items": [ { "type": "plugin", "id": "owner/repo", "label": "name",
  "sub": "description", "href": "/plugins/owner/repo", "stars": 321, "featured": true } ] }
```

`href` 是 dshfind.com 站内相对路径,消费方自行拼 `https://dshfind.com` 前缀。

### `GET /v1/plugins`

插件列表。参数:

- `page`(默认 1)、`per_page`(默认 20,最大 100)
- `category`:skin / ui / agent / memory / client / channel / tools / fun / resource
- `language`(如 `TypeScript`,大小写不敏感)、`grade`(S/A/B/C)
- `q`:关键词(匹配 full_name + description + tags)
- `owner`、`tag`、`min_score`(0–100)
- `featured` / `official` / `archived` / `insider` / `has_install`:`true` / `false`
- `sort`:stars / updated / score / name(默认按 featured → stars 的运营序);`order`:asc / desc
- `data_version`:把首响应的 `data_version` 原样带到后续 page 请求；目录在翻页中更新时返回 409 `stale_data`，客户端应从 page 1 重新同步。

```json
{ "data": [ { "full_name": "owner/repo", "name": "repo", "owner": "owner",
    "url": "https://github.com/owner/repo", "repository_url": "https://github.com/owner/repo", "description": "…", "tags": ["memory"],
    "language": "TypeScript", "stars": 321, "contributors": 4,
    "pushed_at": "2026-08-10T02:00:00Z", "archived": false, "category": "memory",
    "score": 87, "grade": "S", "scored_at": "…", "score_version": "2026-08-17.1",
    "is_featured": true, "is_official": false, "is_insider": false,
    "install": { "cmd": "…", "source": "auto", "kind": "npm", "pkg_name": "…",
      "npm_published": true, "probed_at": "…" }, "first_seen_at": "…", "last_synced_at": "…" } ],
  "page": 1, "per_page": 20, "total": 4093, "total_pages": 205,
  "data_version": "sha256:…", "as_of": "…", "generated_at": "…" }
```

`repository_url` 是语义明确的 GitHub 仓库页面地址；旧 `url` 保留兼容，二者均不是 clone/raw/download 地址。`install.cmd` 为生效安装命令(运营手工核对优先于自动探测,`source` 标注 manual/auto);`kind` ∈ release / npm / git / build-required / not-installable,null 表示尚未探测。`scored_at` / `score_version` 与 `install.probed_at` 分别说明评分和安装结论的新鲜度；未知值是 `null`。

### `GET /v1/plugins/{owner}/{repo}`

单插件详情 = 列表字段 + 三块实时数据(路径大小写不敏感):

- `i18n`:zh / en / ja / ko 的人工文案(description / intro / highlights)
- `snapshots`:每日 star 快照,`?snapshot_days=30`(最大 90)
- `growth`:7 天窗口的 star / contributor 增长

### `GET` / `POST /graphql`

公开只读 GraphQL 查询入口，字段来自与 REST 相同的缓存快照 / Turso 实时详情数据，也走同一套 CORS、API key、限流和审计。SDL 可从 `GET /graphql/schema` 取得。GET 使用 `query`、可选 `operationName` 和 JSON 编码的 `variables`；它适合 CDN 缓存，不支持 mutation（本服务也没有 mutation）。

```json
{
  "query": "query ($q: String!) { dataset { dataVersion asOf } plugins(first: 12, filter: { q: $q }) { dataVersion asOf totalCount nodes { fullName repositoryUrl rating { score grade calculatedAt version } install { cmd kind probedAt } } pageInfo { hasNextPage endCursor } } }",
  "variables": { "q": "memory" }
}
```

- `plugin(fullName: ID!)`：单插件；可按需取 `i18n(locale)`、`snapshots(days)`、`growth`。
- `dataset` 与 `plugins.dataVersion/asOf`：用于增量同步。`after` cursor 已绑定数据版本、filter 和排序；任一变化都会得到“重新分页”的 GraphQL error，不能跨查询复用 cursor。
- `plugins`：cursor connection，使用 `first`(默认 20，最大 50) / `after`，支持 `filter`、`sort`、`order`；filter 还支持 `owner`、`tag`、`minScore`、`archived`、`insider`、`hasInstall`；不可将 REST 的 `page` 直接映射过来。
- `pluginFacets`：返回 category、language、tag、grade 的可用筛选值及数量。
- `repositoryUrl` 是明确的 GitHub 仓库页面字段；`url` 为兼容旧客户端保留的 deprecated alias。`tags` 与 `highlights` 是 GraphQL 列表；未知的 `contributors`、`score`、`rating`、安装探测和时间字段为 nullable。日期使用 `Date`，时间使用 RFC 3339 的 `DateTime` scalar。
- 只接受 query operation（支持 variables、alias、named/inline fragment）；不提供 mutation、subscription、directive 或 introspection。请求体最大 16 KiB、query 最大 8 KiB、嵌套深度最大 8；单次最多 8 个根字段，且插件数据根解析器只能有一个（`plugins` connection 或 `plugin` detail 二选一）。GraphQL 另受单 IP 60/min（20 突发）与全局成本 10 token 的保护。
- `api_keys`、审计请求的 IP/UA/Origin/Referer 只留在 admin REST，绝不进入公开 GraphQL schema。

### `GET /healthz`

`{ status, plugins_loaded, commit_sha, deployment_id, cache_loaded_at, audit_queue, audit_dropped }`;插件快照未加载成功时 503。Git 自动部署时 `commit_sha`、`deployment_id` 分别必须等于 Railway 注入的 `RAILWAY_GIT_COMMIT_SHA`、`RAILWAY_DEPLOYMENT_ID`；生产 Gate 会据此验证真实流量已切到预期版本，并把活跃实例与其精确回滚锚点关联。

## GitHub 登录 API

OAuth 的 client secret、`code` 换 token、PKCE/state 校验和会话签发都在此服务完成。登录对所有 GitHub 账号开放，授权时不申请任何 scope（只拿公开资料），服务端不做组织或名单校验；GitHub access token 不存库、不写 Cookie。Next.js 仅用相同的 `AUTH_SECRET` 验签会话，不能拿到 OAuth secret。

| 端点 | 说明 |
|---|---|
| `GET /auth/github?return_to=/zh/...` | 发起 GitHub OAuth；`return_to` 只接受本站相对路径 |
| `GET /auth/github/callback` | GitHub 唯一 callback；校验 state、换 token、签发会话，再跳回 `WEB_URL` |
| `GET /auth/me` | 返回 `{ user }`；跨域读取时仅允许 `WEB_URL` 且需 `credentials: include` |
| `POST /auth/logout?return_to=/zh/login` | 清除共享会话 Cookie；请求 `Origin` 必须等于 `WEB_URL` |

会话 Cookie 为 `HttpOnly; Secure; SameSite=Lax`，生产环境以 `Domain=dshfind.com` 共享给 `dshfind.com` 和 `api.dshfind.com`。若更换 `AUTH_SECRET`，所有现有登录会话都会立即失效。

### 错误结构(统一)

```json
{ "error": { "code": "rate_limited", "message": "too many requests", "retry_after": 12 } }
```

`code` ∈ bad_request / unauthorized / forbidden / not_found / rate_limited / stale_data / internal。429 附带 `Retry-After` 头。

## Admin API(`Authorization: Bearer $ADMIN_TOKEN`)

| 端点 | 说明 |
|---|---|
| `GET /v1/admin/usage?from=&to=&group_by=day\|key\|endpoint&key_id=` | 每日聚合(默认最近 7 天) |
| `GET /v1/admin/usage/recent?limit=&key_id=&anon=1` | 请求明细:IP / UA / Origin / Referer |
| `GET /v1/admin/keys` | key 列表(含吊销的) |
| `POST /v1/admin/keys` `{"name","contact","rate_per_min"}` | 创建 key,明文只在响应出现一次 |
| `DELETE /v1/admin/keys/{id}` | 吊销 |

「昨天谁在查、查了几次、从哪来」直接 SQL 也行:

```sql
SELECT api_key_id, key_prefix, origin, COUNT(*) n, COUNT(DISTINCT ip) ips
FROM api_requests WHERE ts >= datetime('now','-1 day')
GROUP BY 1,2,3 ORDER BY n DESC;
```

## 审计实现要点

- 请求路径上只做一次非阻塞入队(channel 容量 4096,满了丢弃并计数,见 healthz 的 `audit_dropped`)。
- 后台每 5s 或攒满 200 条批量落库:明细进 `api_requests`,同时累加 `api_usage_daily`(天 × key × endpoint)。
- 明细默认保留 30 天,每 24h 清理;聚合表永久保留。
- 优雅退出:SIGTERM 后先关 http server,再清空审计队列落库,redeploy 不丢日志。

## Railway 部署

1. Railway → New Service → GitHub Repo 选本仓库，**Root Directory 保持为空（仓库根目录）**。根目录的 `railway.json` 已固定 Go Dockerfile、`server/**` Watch Paths 和 30 秒优雅排空，无需在控制台重复配置。
2. Variables 填上 Turso 配置；若启用登录，再完整设置 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`AUTH_SECRET`、`WEB_URL=https://dshfind.com`、`API_PUBLIC_URL=https://api.dshfind.com` 与 `AUTH_COOKIE_DOMAIN=dshfind.com`。`PORT` 不用配。已有服务若此前 Root Directory 设为 `server`，先清空它再部署。
3. 部署后先用 `*.up.railway.app` 验证 `/healthz`。
4. Settings → Custom Domain 绑 `api.dshfind.com`,DNS 侧按提示加 CNAME。
5. GitHub OAuth App 的 Authorization callback URL 必须设为 `https://api.dshfind.com/auth/github/callback`（不可保留旧的 Vercel `/api/auth/...` callback）。
6. Vercel(前端)加 `NEXT_PUBLIC_API_BASE_URL=https://api.dshfind.com`、相同的 `AUTH_SECRET`，需要「必须登录才能浏览」时再加 `AUTH_GATE=1`（门槛只有登录本身，任何 GitHub 账号都放行），然后 redeploy。Vercel 不再设置 `GITHUB_CLIENT_ID` 或 `GITHUB_CLIENT_SECRET`；搜索框即直连本服务,后端不可用时自动降级回 `/api/suggest`。
