# dshfind API(Go)

dshfind.com 的独立后端服务:首页搜索建议、对外插件数据 API、访问审计。部署于 Railway,数据源是与 Next.js 前端共用的 Turso 库(只新增审计三张表,不动既有表)。

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
| `CACHE_REFRESH_MINUTES` | — | 10 | 插件快照 / key 表内存刷新周期 |
| `LOG_RETENTION_DAYS` | — | 30 | `api_requests` 明细保留天数(聚合表永久保留) |
| `ANON_RATE_PER_MIN` | — | 30 | 匿名限流(按 IP) |
| `SUGGEST_RATE_PER_MIN` | — | 60 | suggest 匿名单独放宽 |
| `KEY_RATE_PER_MIN` | — | 120 | 带 key 的默认额度(可被 `api_keys.rate_per_min` 覆盖) |

## 公开 API

Base URL:`https://api.dshfind.com`。全部只读 GET,CORS `*`。匿名可用;带 API key 限流更宽、审计可精确归属。key 通过 `Authorization: Bearer dshf_...` 或 `X-Api-Key: dshf_...` 传递,无效 key 返回 401(不会静默降级为匿名)。

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
- `featured` / `official`:`true` / `false`
- `sort`:stars / updated / score / name(默认按 featured → stars 的运营序);`order`:asc / desc

```json
{ "data": [ { "full_name": "owner/repo", "name": "repo", "owner": "owner",
    "url": "https://github.com/owner/repo", "description": "…", "tags": ["memory"],
    "language": "TypeScript", "stars": 321, "contributors": 4,
    "pushed_at": "2026-08-10T02:00:00Z", "archived": false, "category": "memory",
    "score": 87, "grade": "S", "is_featured": true, "is_official": false, "is_insider": false,
    "install": { "cmd": "…", "source": "auto", "kind": "npm", "pkg_name": "…",
      "npm_published": true }, "first_seen_at": "…", "last_synced_at": "…" } ],
  "page": 1, "per_page": 20, "total": 4093, "total_pages": 205, "generated_at": "…" }
```

`install.cmd` 为生效安装命令(运营手工核对优先于自动探测,`source` 标注 manual/auto);`kind` ∈ release / npm / git / build-required / not-installable,null 表示尚未探测。

### `GET /v1/plugins/{owner}/{repo}`

单插件详情 = 列表字段 + 三块实时数据(路径大小写不敏感):

- `i18n`:zh / en / ja / ko 的人工文案(description / intro / highlights)
- `snapshots`:每日 star 快照,`?snapshot_days=30`(最大 90)
- `growth`:7 天窗口的 star / contributor 增长

### `GET /healthz`

`{ status, plugins_loaded, cache_loaded_at, audit_queue, audit_dropped }`;插件快照未加载成功时 503。

### 错误结构(统一)

```json
{ "error": { "code": "rate_limited", "message": "too many requests", "retry_after": 12 } }
```

`code` ∈ bad_request / unauthorized / not_found / rate_limited / internal。429 附带 `Retry-After` 头。

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

1. Railway → New Service → GitHub Repo 选本仓库;Settings 里 **Root Directory = `server`**,Watch Paths = `server/**`(前端提交不触发重建)。
2. Variables 填上表四个必需/常用变量;`PORT` 不用配。
3. 部署后先用 `*.up.railway.app` 验证 `/healthz`。
4. Settings → Custom Domain 绑 `api.dshfind.com`,DNS 侧按提示加 CNAME。
5. Vercel(前端)加 env `NEXT_PUBLIC_API_BASE_URL=https://api.dshfind.com` 并 redeploy——搜索框即直连本服务,后端不可用时自动降级回 `/api/suggest`。
