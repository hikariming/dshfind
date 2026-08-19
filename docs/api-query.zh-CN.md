# dshfind 外部数据 API 与查询指南

此文档面向把 dshfind 作为插件目录数据源的开发者。它覆盖当前实际提供的公开 REST 与 GraphQL 查询契约、字段含义和来源、缓存/版本一致性、限流、错误处理与集成示例。

English: [Public Data API and Query Guide](./api-query.md)

> Base URL：`https://api.dshfind.com`。生产域名切换完成前，可用 Railway 分配的 `*.up.railway.app` 域名进行预发布验证，但不得把该临时域名写入第三方客户端。

## 1. 范围、稳定性与访问方式

### 1.1 公开与非公开边界

| 范围 | 对外开放 | 用途 |
| --- | --- | --- |
| `GET /v1/suggest`、`GET /v1/plugins*`、`GET /v1/catalog` | 是 | 搜索建议、插件目录、整包目录、详情 |
| `GET /market/manifest.json`、`GET /market/v1/plugins` | 是 | DSH 桌面端社区市场的标准目录源 manifest 与契约分页目录 |
| `GET` / `POST /graphql`、`GET /graphql/schema` | 是 | 只读、按字段查询的目录数据 |
| `GET /healthz` | 是 | 可用性与部署观测；不应当作目录同步接口 |
| `/auth/*` | 非数据 API | GitHub 登录和会话，仅前端 origin 可携带 Cookie |
| `/v1/admin/*` | 否 | API key、用量、含 IP/UA 的审计，需要 `ADMIN_TOKEN` |

公开 schema 和 REST 响应不会暴露 API key、请求 IP、User-Agent、Origin、Referer、审计明细、GitHub OAuth token 或评分明细。外部消费者应只依赖本文档列出的公开字段。

### 1.2 HTTP、CORS 与 API key

- 公开 REST 只支持 `GET`；GraphQL 支持 `GET` 和 `POST`，且只支持 `query` operation。
- 公开数据端点返回 `Access-Control-Allow-Origin: *`，可在浏览器直接请求；不带 Cookie，因此不存在公开数据 API 的跨站凭据暴露。
- API key 不是使用公开查询的前提，但能让调用方获得独立配额和归属审计。两种传法等价：

  ```http
  Authorization: Bearer dshf_...
  X-Api-Key: dshf_...
  ```

- 提供了无效或已吊销 key 时，服务不会静默降级为匿名请求，而是返回 `401 unauthorized`；该请求仍会先计入匿名/IP/全局防护额度。
- key 只用于公开只读 API 的限流与归属，不会开放 Admin、数据库写入或未公开字段。

## 2. 数据新鲜度、缓存与增量同步

### 2.1 数据源与更新节奏

| 数据组 | 读取路径 | 真正来源 | 更新方式 |
| --- | --- | --- | --- |
| 基础插件目录 | Go 内存快照 | Turso `plugins` | GitHub Actions 每日同步；API 默认每 10 分钟刷新内存快照 |
| 翻译文案 | REST 详情 / GraphQL 按需批量读取 | Turso `plugin_i18n` | 运营维护脚本写入 |
| 指标快照 | REST 详情 / GraphQL 按需批量读取 | Turso `plugin_snapshots` | 同步时每日幂等写入 |
| 评分、运营标记 | 基础插件快照 | Turso `plugins` | dshfind 自有评分/运营工作流写入 |
| 安装探测 | 基础插件快照 | Turso `plugins` | `probe:install` 探测或人工覆盖 |

因此，列表/建议适合高频读取且不逐请求访问 Turso；详情中的 `i18n`、`snapshots` 和 GraphQL 中选中的相应嵌套字段会读取 Turso。GraphQL connection 对一个页面批量预取，避免 N 个节点形成 N 次数据库请求。

`url` / `repositoryUrl` 均指 **GitHub 仓库页面**（如 `https://github.com/owner/repo`），不是 git clone URL、raw 文件 URL 或下载链接。`repositoryUrl` 是语义明确的新字段；REST 的 `url` 与其值相同并为兼容保留。

### 2.2 `data_version` / `dataVersion`

基础插件目录有一个由公开基础数据计算的内容哈希：

```text
sha256:<hex>
```

同样内容反复刷新不会改变版本。外部同步器应：

1. 先读取 `dataset.dataVersion`（GraphQL）或列表响应 `data_version`（REST）；
2. 保存该版本与完整拉取结果；
3. 之后先检查版本，未变则无需重新拉取；
4. 版本变化才启动新的完整同步。

`as_of` / `asOf` 是基础快照中最新的可追溯写入时间（同步、评分或安装探测时间），而非 HTTP 响应生成时间。`generated_at` 是 REST 兼容字段，当前等同于 `as_of`。

### 2.3 HTTP 缓存语义

成功的公开数据响应带有内容强校验 `ETag`。对 `GET`，可使用 `If-None-Match` 获取 `304 Not Modified`；POST GraphQL 也带 ETag，但 HTTP 条件 304 只适用于 GET/HEAD。

| 资源 | `Cache-Control` | 适合的客户端策略 |
| --- | --- | --- |
| `/v1/suggest`（有效 q） | `public, max-age=60, s-maxage=3600, stale-while-revalidate=86400` | CDN 可缓存一小时；浏览器短缓存 |
| `/v1/plugins*`、成功 GraphQL | `public, max-age=60, s-maxage=300, stale-while-revalidate=86400` | 五分钟共享缓存；强 ETag 重验证 |
| `/graphql/schema` | `public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` | 适合每日拉取 SDL |
| `/v1/suggest?q=<2 字符` | `no-store` | 空提示不缓存 |
| 错误与 GraphQL 执行错误 | `no-store` | 不缓存错误 |

API key 不改变公开数据表示，因此带 key 的成功响应也可以安全被公共缓存复用。对于 GraphQL CDN 缓存和条件重验证，优先使用 GET 形式。

## 3. 公共插件对象

REST 返回 snake_case；GraphQL 返回 camelCase。除非特别说明，数值 `0` 和布尔 `false` 均是有效值，不等于未知。表中的 `null` 表示源数据尚无结论，不应擅自转换为空字符串或零。

| 语义 | REST | GraphQL | 类型/可空性 | 数据来源与解释 |
| --- | --- | --- | --- | --- |
| 稳定 ID | `full_name` | `id`、`fullName` | 非空字符串 | `owner/repo`，所有插件主键；`id === fullName` |
| 显示名称 | `name` | `name` | 非空字符串 | GitHub 仓库名 |
| 所有者 | `owner` | `owner` | 非空字符串 | GitHub owner/org 名称 |
| 仓库页 | `repository_url` | `repositoryUrl` | 非空 URL | GitHub repository page URL |
| 旧仓库页字段 | `url` | `url`（deprecated） | 非空 URL | 与仓库页相同；新代码应使用 `repositoryUrl` |
| 描述 | `description` | `description` | 非空字符串，可为空值 `""` | GitHub repository description；缺失时为空字符串 |
| 标签 | `tags` | `tags` | 非空字符串数组 | 同步的 topic/分类标签；空时 `[]` |
| 主语言 | `language` | `language` | 非空字符串，可为空值 `""` | GitHub 主语言 |
| stars | `stars` | `stars` | 非空整数 | 当前同步到的 GitHub star 数 |
| contributors | `contributors` | `contributors` | 可空整数 | 同步到的 contributor 数；未知则 `null` |
| 最近推送 | `pushed_at` | `pushedAt` | 可空 RFC 3339 `DateTime` | GitHub 最近 push 时间；未知则 `null` |
| 已归档 | `archived` | `archived` | 非空布尔 | GitHub archived 状态 |
| 目录分类 | `category` | `category` | 非空字符串，可为空值 `""` | dshfind 分类；不是 GitHub 原生字段 |
| 首次发现 | `first_seen_at` | `firstSeenAt` | 可空 `DateTime` | dshfind 首次写入目录的时间 |
| 最近同步 | `last_synced_at` | `lastSyncedAt` | 可空 `DateTime` | dshfind 最近同步基础 GitHub 数据的时间 |
| 是否精选 | `is_featured` | `isFeatured` | 非空布尔 | dshfind 运营标记 |
| 是否官方 | `is_official` | `isOfficial` | 非空布尔 | dshfind 运营标记，不等同于 GitHub verified |
| 是否 insider | `is_insider` | `isInsider` | 非空布尔 | dshfind 运营标记 |
| 插件归属 | `is_plugin` | `isPlugin` | 可空布尔（三态） | `true` = 确认是 DSH 插件（package.json 声明 `dsh.bundle`）；`false` = 确认非插件（探测判定不可安装或运营标记）；`null` = 未探测/未知。过滤见 4.2 |

### 3.1 自有评分（不是 GitHub 评分）

`score`、`grade`、`rating` 是 **dshfind 自有综合评分**，不是 GitHub stars、GitHub topic、第三方市场评分，也不会取代 GitHub 的任何官方评价。评分算法的明细输入 `score_detail` 不对外暴露，以避免把内部策略误当成稳定外部契约。

| REST 字段 | GraphQL 字段 | 含义 |
| --- | --- | --- |
| `score` | `score` | 0–100 的自有分数；未评为 `null` |
| `grade` | `grade` | 由当前分数映射的等级 `S/A/B/C`；未评为 `null` |
| `scored_at` | `rating.calculatedAt` | 该次评分写入时间；历史记录可能为 `null` |
| `score_version` | `rating.version` | 评分算法和输入口径版本；历史记录可能为 `null` |
| — | `rating { score grade calculatedAt version }` | 聚合对象；未评时整个 `rating` 为 `null` |

当前等级线为：S ≥ 85，A ≥ 70，B ≥ 55，其余已评分插件为 C。外部消费者若保存评分，应同时保存 `score_version` 与 `scored_at`；跨版本比较分数时不可假设算法口径不变。

### 3.2 安装信息

| REST | GraphQL | 类型/可空性 | 含义 |
| --- | --- | --- | --- |
| `install.cmd` | `install.cmd` | 可空字符串 | 当前生效的安装命令。人工确认的 `install_cmd` 优先于自动推导 `install_cmd_auto` |
| `install.source` | `install.source` | 非空字符串 | `manual`、`auto` 或 `""`（没有可用命令） |
| `install.kind` | `install.kind` | 可空字符串 | `release`、`npm`、`git`、`build-required`、`not-installable`；`null` 是尚未探测 |
| `install.pkg_name` | `install.pkgName` | 可空字符串 | 探测到的 npm 包名 |
| `install.pkg_version` | — | 可空字符串，可能省略 | 仓库 HEAD package.json 的精确版本 |
| `install.npm_published` | `install.npmPublished` | 非空布尔 | 是否已发布到 npm |
| `install.methods` | — | 数组，可能省略 | 可执行安装方式证据，形状对齐桌面端 `installMethods[]` 契约：仅当插件同时通过 npm 发布/回链/稳定版本**以及桌面端 npm preview 的全部复核**（无生命周期脚本、运行时范围兼容、含 `dsh.bundle.patch` 等）时，输出恰好一条 `{kind:"npm", verification:"verified", code:"repository_backlink", requiresBuildAllowance:false, spec, revision}` |
| `install.release_tgz_url` | `install.releaseTgzUrl` | REST 可能省略；GraphQL 可空 | release tarball URL，不是仓库页面 URL |
| `install.release_tag` | `install.releaseTag` | REST 可能省略；GraphQL 可空 | 对应 GitHub Release tag |
| `install.probed_at` | `install.probedAt` | 可空 `DateTime` | 安装结论最后一次成功写入的时间 |

安装结论来自 dshfind 探测和运营维护，不保证在所有平台或本地环境可执行。消费者应显示 `kind`、`probedAt`，并把 `cmd: null` 当作“暂无可用安装命令”，而不是尝试根据 Git URL 自行拼命令。

### 3.3 翻译、快照与增长

| REST（详情） | GraphQL | 含义 |
| --- | --- | --- |
| `i18n` 对象（以 locale 为 key） | `i18n(locale: String)` 数组 | `description`、`intro`、`highlights`、`updatedAt`；缺失局部文案可为 `null`，`highlights` 为空时为 `[]` |
| `snapshots` | `snapshots(days: Int = 30)` | 日粒度 GitHub 指标：`date`（`YYYY-MM-DD`）、`stars`、可空 `contributors`、可空 `pushedAt` |
| `growth` | `growth` | 固定 7 天窗口的 `stars` 与可空 `contributors` 增量。少于两条快照返回 star `0`、contributors `null` |

REST 详情使用 `snapshot_days`（默认 30，最大 90）；GraphQL 使用 `snapshots(days:)`（默认 30，最大 90）。增长计算使用全部可用快照以找到距最新快照 7 天或更早的最近基线，因此不受响应中截取天数影响。

## 4. REST API

### 4.1 搜索建议：`GET /v1/suggest`

```bash
curl --get 'https://api.dshfind.com/v1/suggest' \
  --data-urlencode 'q=memory'
```

参数：

| 参数 | 必须 | 规则 |
| --- | --- | --- |
| `q` | 否 | trim、最多 64 个 Unicode 字符、转小写；不足 2 个字符直接返回空 items |

查询在 `full_name + description + tags` 中作子串匹配，不包含 `language`。最多返回 10 条，顺序为精选优先、stars 降序、名称稳定排序。

```json
{
  "items": [
    {
      "type": "plugin",
      "id": "owner/repo",
      "label": "repo",
      "sub": "插件描述或 @owner",
      "href": "/plugins/owner/repo",
      "stars": 321,
      "featured": true
    }
  ]
}
```

`href` 是 dshfind 网站内相对路径；外部站点要跳转时请显式拼接 `https://dshfind.com`。没有匹配时仍返回 `200 {"items":[]}`，不是 404。

### 4.2 插件列表：`GET /v1/plugins`

```bash
curl --get 'https://api.dshfind.com/v1/plugins' \
  --data-urlencode 'q=memory' \
  --data-urlencode 'language=TypeScript' \
  --data-urlencode 'min_score=70' \
  --data-urlencode 'sort=stars' \
  --data-urlencode 'order=desc' \
  --data-urlencode 'page=1' \
  --data-urlencode 'per_page=20'
```

#### 参数

| 参数 | 默认/范围 | 说明 |
| --- | --- | --- |
| `page` | 1，最小 1 | 页码；极大值会得到空 `data`，不会报错 |
| `per_page` | 20，1–100 | 单页条数，超出范围会被钳制到范围内 |
| `category` | — | 精确匹配 dshfind 分类，如 `memory`、`tools` |
| `language` | — | 大小写不敏感精确匹配，如 `TypeScript` |
| `grade` | — | `S` / `A` / `B` / `C`，未评分插件不匹配任何等级 |
| `q` | — | 不超过 64 字符后，匹配 `full_name + description + tags + language` |
| `owner` | — | owner 大小写不敏感匹配 |
| `tag` | — | tag 大小写不敏感匹配 |
| `min_score` | 0–100 | 包含等于阈值的已评分插件；未评分不匹配 |
| `featured` / `official` / `archived` / `insider` / `has_install` | `true`/`false`/`1`/`0` | 仅在传入可识别布尔值时过滤；其他值等同未传入 |
| `is_plugin` | `true`/`false`/`1`/`0` | 三态过滤：`1` 只保留确认是插件的条目，`0` 只保留确认非插件的；未知（`null`）两侧都不匹配，未传入不过滤 |
| `sort` | 未传入保留运营默认序 | `stars`、`updated`、`score`、`name` |
| `order` | 数值/时间/评分默认 `desc`；`name` 默认 `asc` | `asc` 或 `desc`；仅 `sort` 生效时使用 |
| `data_version` | — | 将首页的版本原样带到后续页，保证分页不能悄悄跨数据集 |

未传 `sort` 时，返回基础快照的运营顺序：`is_featured DESC, stars DESC, full_name ASC`。`updated` 使用 `pushed_at`；没有值的记录按空字符串参与排序。`score` 视未评分为小于已评分的值。

响应外形：

```json
{
  "data": [
    {
      "full_name": "owner/repo",
      "name": "repo",
      "owner": "owner",
      "url": "https://github.com/owner/repo",
      "repository_url": "https://github.com/owner/repo",
      "description": "...",
      "tags": ["memory"],
      "language": "TypeScript",
      "stars": 321,
      "contributors": 4,
      "pushed_at": "2026-08-10T02:00:00Z",
      "archived": false,
      "category": "memory",
      "score": 87,
      "grade": "S",
      "scored_at": "2026-08-17T00:00:00Z",
      "score_version": "2026-08-17.1",
      "is_featured": true,
      "is_official": false,
      "is_insider": false,
      "is_plugin": true,
      "install": {
        "cmd": "...",
        "source": "auto",
        "kind": "npm",
        "pkg_name": "...",
        "npm_published": true,
        "probed_at": "2026-08-17T00:00:00Z"
      },
      "first_seen_at": "2026-07-01T00:00:00Z",
      "last_synced_at": "2026-08-17T00:00:00Z"
    }
  ],
  "page": 1,
  "per_page": 20,
  "total": 4093,
  "total_pages": 205,
  "data_version": "sha256:...",
  "as_of": "2026-08-17T00:00:00Z",
  "generated_at": "2026-08-17T00:00:00Z"
}
```

数字仅为示意，不能用于断言生产数据量。

#### REST 一致分页

对超过一页的同步，必须固定 `data_version`：

```text
GET /v1/plugins?per_page=100&page=1
  → 保存 data_version = sha256:abc
GET /v1/plugins?per_page=100&page=2&data_version=sha256:abc
```

如果基础数据在中途改变，第二类请求返回 `409` 和错误码 `stale_data`。丢弃本轮已收集页面并从 page 1 重新开始；不要混用两个版本的页面。

#### 桌面端社区市场的特殊响应

请求头 `User-Agent` 恰为 `dsh-community-market/0.1` 时，列表端点只返回首屏子集：先剔除确认非插件（`is_plugin=false`）的条目，再截断到运营默认序的前 200 条，然后按客户端请求的 `page`/`per_page` 正常分页。这让该客户端两次请求即可拿完首屏，而不必翻完整个目录。响应带 `Vary: User-Agent`，共享缓存按 UA 分桶，其他客户端不受影响。需要完整目录的桌面端版本应改用 `GET /v1/catalog`（见 4.3）。

### 4.3 整包目录：`GET /v1/catalog`

一次性返回整份公开目录（数千条、数 MB 的单次 JSON 响应），供批量消费者单请求下载，取代逐页翻 `/v1/plugins`：

```bash
curl 'https://api.dshfind.com/v1/catalog'
```

响应外形：

```json
{
  "data": [ /* 完整的插件对象数组，字段同第 3 节 */ ],
  "total": 6662,
  "data_version": "sha256:...",
  "as_of": "2026-08-17T00:00:00Z",
  "generated_at": "2026-08-17T00:00:00Z"
}
```

数据按 `data_version` 不可变。推荐用法：先请求 `/v1/plugins?per_page=1` 拿到当前 `data_version`，再带版本请求整包：

```text
GET /v1/catalog?data_version=sha256:abc
  → Cache-Control: public, max-age=60, s-maxage=86400, immutable
```

带匹配版本时响应按内容寻址，边缘缓存可长期持有；不带版本或版本已过期时退回与列表一致的短缓存（`s-maxage=300`）。版本不匹配不会返回 409——直接按当前快照返回，调用方比对响应里的 `data_version` 自行判断是否需要重取。支持 ETag/`If-None-Match` 条件请求。

### 4.4 插件详情：`GET /v1/plugins/{owner}/{repo}`

```bash
curl --get 'https://api.dshfind.com/v1/plugins/owner/repo' \
  --data-urlencode 'snapshot_days=60'
```

路径中的 owner/repo 大小写不敏感。响应包含第 3 节的完整 REST 插件对象，并附加：

```json
{
  "i18n": {
    "zh": {
      "description": "...",
      "intro": "...",
      "highlights": ["..."],
      "updated_at": "2026-08-17T00:00:00Z"
    }
  },
  "snapshots": [
    { "date": "2026-08-16", "stars": 321, "contributors": 4, "pushed_at": "..." }
  ],
  "growth": { "window_days": 7, "stars": 12, "contributors": 1 },
  "data_version": "sha256:...",
  "as_of": "..."
}
```

`snapshot_days` 默认 30，范围 1–90；超出范围被钳制。不存在的插件返回 `404 not_found`。详情的基础对象仍来自同一内存快照，而 i18n/快照是当次从 Turso 读取的实时详情数据，所以其 ETag 来自完整响应字节，而不是只来自 `data_version`。

### 4.5 标准目录源 manifest：`GET /market/manifest.json`

面向 DSH 桌面端社区市场的静态目录源 manifest，符合 `catalog-source` schema（`manifestVersion: "1.0.0"`）。它声明本目录的身份、署名、传输方式与查询能力，使桌面端无需审查适配器即可把 dshfind 作为标准目录源消费：

```bash
curl 'https://api.dshfind.com/market/manifest.json'
```

```json
{
  "manifestVersion": "1.0.0",
  "providerId": "com.dshfind.catalog",
  "name": "dshfind Plugin Catalog",
  "description": "Community catalog of DeepSeek Harness plugins indexed by dshfind.",
  "homepage": "https://dshfind.com",
  "attribution": { "name": "dshfind", "url": "https://dshfind.com" },
  "transport": {
    "kind": "https-json",
    "endpoint": "https://api.dshfind.com/market/v1/plugins",
    "method": "GET"
  },
  "query": {
    "supported": ["q", "category", "cursor", "limit"],
    "defaultLimit": 50,
    "maxLimit": 100,
    "sorts": []
  }
}
```

在桌面端注册 dshfind：打开社区市场的来源管理，选择"添加标准源"，注册 manifest URL `https://api.dshfind.com/market/manifest.json`。Host 校验 manifest 后将其保存为用户本地来源，并仅在用户选中该来源后从 `transport.endpoint` 拉取目录页。

### 4.6 标准目录分页：`GET /market/v1/plugins`

manifest 所声明的契约分页目录端点，符合 `catalog-provider-page` schema（`schemaVersion: "1.0.0"`）。

| 参数 | 默认 / 范围 | 含义 |
| --- | --- | --- |
| `q` | — | 目录关键词匹配 |
| `category` | — | 分类过滤 |
| `limit` | 50；1–100 | 每页条数 |
| `cursor` | — | 上一页 `page.nextCursor` 返回的不透明游标；首页省略 |

响应形状：

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-08-17T00:00:00Z",
  "revision": "...",
  "items": [
    {
      "id": "owner/repo",
      "name": "repo",
      "displayName": "Repo",
      "summary": "...",
      "homepage": "https://...",
      "latestVersion": "1.2.3",
      "license": "MIT",
      "categories": ["memory"],
      "keywords": ["..."],
      "repository": { "url": "https://github.com/owner/repo" },
      "package": { "registry": "npm", "name": "..." },
      "publisher": { "name": "..." },
      "updatedAt": "2026-08-17T00:00:00Z"
    }
  ],
  "page": { "nextCursor": "...", "total": 123 }
}
```

item 字段是固定白名单（`additionalProperties: false`）：`id`、`name`、`displayName`、`summary`、`homepage`、`latestVersion`、`license`、`categories`、`keywords`、`repository`、`package`、`publisher`、`media`、`capabilities`、`compatibility`、`updatedAt`。`id`、`name`、`displayName`、`summary` 始终存在且非空；`repository` 与 `package` 至少出现其一。`package` 只与精确稳定 semver 的 `latestVersion`（`x.y.z`）和 https 的 `repository.url` 同时出现，其 `registry` 为 `npm`。分页方式：携带返回的 `page.nextCursor` 重复请求，直到它不再出现；累计条数此时等于 `page.total`。

### 4.7 健康：`GET /healthz`

```json
{
  "status": "ok",
  "plugins_loaded": 4093,
  "commit_sha": "<Git SHA>",
  "deployment_id": "<Railway deployment ID>",
  "cache_loaded_at": "2026-08-17T00:00:00Z",
  "audit_queue": 0,
  "audit_dropped": 0,
  "rate_limit_backend": "memory",
  "rate_limit_redis_fallbacks": 0
}
```

仅当首次插件快照成功加载后才返回 200；未加载时为 503。`commit_sha` 和 `deployment_id` 用于生产 Gate 验证实际承载流量的实例，不保证在本地/非 Git 部署中存在。`audit_dropped > 0` 表示审计队列曾满，应该告警和评估流量/数据库写入能力，但不会改变目录响应正确性。`rate_limit_backend` 为 `redis`（配置了 `UPSTASH_REDIS_REST_URL/TOKEN`）或 `memory`；`rate_limit_redis_fallbacks > 0` 表示 Redis 故障期间曾降级到进程内限流。

## 5. GraphQL API

### 5.1 端点和请求格式

- `GET /graphql?query=<URL encoded>&variables=<JSON encoded>&operationName=<optional>`：适合 CDN、ETag 和书签式查询。
- `POST /graphql`：`Content-Type: application/json`，body 为 `{ "query", "variables", "operationName" }`。
- `GET /graphql/schema`：返回当前 SDL，`Content-Type: application/graphql; charset=utf-8`。该服务不提供 GraphQL introspection，因此客户端生成代码应下载 SDL，而不是依赖 `__schema` 查询。

POST 示例：

```bash
curl https://api.dshfind.com/graphql \
  -H 'Content-Type: application/json' \
  --data '{
    "query": "query Plugin($name: ID!) { plugin(fullName: $name) { fullName repositoryUrl stars rating { score grade version } } }",
    "variables": { "name": "owner/repo" }
  }'
```

GET 示例：

```bash
curl --get https://api.dshfind.com/graphql \
  --data-urlencode 'query={ dataset { dataVersion asOf } pluginFacets { categories { value count } } }'
```

当前解析器支持 variables、operation name、alias、named fragment 与 inline fragment，但不支持 mutation、subscription、directive、introspection 或 block string。服务不是任意 GraphQL 网关；SDL 中存在的字段才可选择。

### 5.2 根查询

| Query | 参数 | 返回 | 适用场景 |
| --- | --- | --- | --- |
| `dataset` | 无 | `Dataset!` | 轻量检查基础目录版本/时间 |
| `plugin` | `fullName: ID!` | `Plugin` | 单插件精确读取；找不到时为 `null` |
| `plugins` | `first`、`after`、`filter`、`sort`、`order` | `PluginConnection!` | 游标分页列表或完整镜像 |
| `pluginFacets` | 无 | `PluginFacets!` | 构建筛选器和每个候选值的当前数量 |

一个请求至多选择 8 个根字段，但 `plugin` 和 `plugins` 这两种“插件数据根解析器”合计最多只能选择一个（包含 alias）。例如可同时选择 `dataset`、`pluginFacets`、一个 `plugins` connection；不能在同一个请求中同时查询多个 plugins connection，或同时查询 `plugin` 与 `plugins`。这避免 alias 扩大一次请求的 Turso 读取量。

### 5.3 `PluginFilter`

GraphQL 的过滤口径与 REST 列表完全一致；使用 camelCase：

```graphql
input PluginFilter {
  category: String
  language: String
  grade: PluginGrade
  q: String
  owner: String
  tag: String
  minScore: Int
  featured: Boolean
  official: Boolean
  archived: Boolean
  insider: Boolean
  risky: Boolean
  hasInstall: Boolean
  "三态插件归属：true 只保留确认插件，false 只保留确认非插件；不传不过滤"
  isPlugin: Boolean
}
```

- `minScore` 必须是 0–100 的整数；超出范围属于 GraphQL execution error。
- `q` 会 trim、转小写并截断到 64 个 Unicode 字符。
- `grade` 使用 `S/A/B/C`；无 `rating` 的插件不匹配。
- `sort` 为 `DEFAULT`、`STARS`、`UPDATED`、`SCORE`、`NAME`；`order` 为 `ASC` 或 `DESC`。`DEFAULT` 保留运营默认序，`order` 对其不重排。

### 5.4 Connection 与游标分页

`plugins` 使用 cursor connection，而不是 REST 的 page/per_page：

```graphql
query ListPlugins($after: String, $filter: PluginFilter) {
  plugins(first: 50, after: $after, filter: $filter, sort: STARS, order: DESC) {
    totalCount
    dataVersion
    asOf
    nodes {
      fullName
      repositoryUrl
      stars
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

约束与正确用法：

- `first` 默认 20，范围 1–50；范围外是 execution error。
- 首页传 `after: null` 或省略；下一页只传上一页 `endCursor`。
- cursor 是不透明值，已绑定 `dataVersion`、完整 filter、sort 和 order。不要解码、修改、跨查询复用，不能用 REST 页码代替。
- 基础目录、过滤或排序变化时，后续 cursor 会产生 GraphQL error；应丢弃本轮结果，从头请求。
- `endCursor` 在空页时为 `null`；`hasNextPage: false` 时不要再请求下一页。

变量化示例：

```json
{
  "query": "query List($after: String, $filter: PluginFilter) { plugins(first: 50, after: $after, filter: $filter, sort: SCORE) { dataVersion nodes { fullName rating { score grade calculatedAt version } } pageInfo { hasNextPage endCursor } } }",
  "variables": {
    "after": null,
    "filter": { "category": "memory", "minScore": 70, "hasInstall": true }
  }
}
```

### 5.5 GraphQL 字段参考

#### `Dataset`、`PluginConnection` 与 facets

| 类型 | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| `Dataset` | `dataVersion` | `ID!` | 基础快照内容版本 |
| `Dataset` | `asOf` | `DateTime!` | 基础快照最新可追溯写入时间 |
| `PluginConnection` | `nodes` | `[Plugin!]!` | 当前 cursor 页 |
| `PluginConnection` | `pageInfo` | `PageInfo!` | `hasNextPage`、可空 `endCursor` |
| `PluginConnection` | `totalCount` | `Int!` | filter 后总数 |
| `PluginConnection` | `dataVersion` / `asOf` | 非空 | 与 `dataset` 含义相同，方便同步器单请求读取 |
| `PluginFacets` | `categories` / `languages` / `tags` / `grades` | `[PluginFacet!]!` | `{ value, count }`，按 count 降序、value 升序；只统计当前全部基础目录，不继承某个 `plugins.filter` |

#### `Plugin`

`Plugin` 的基础字段与第 3 节 REST 对照完全一致，唯一命名差异是 camelCase。完整 SDL 可通过 `/graphql/schema` 拉取。常用字段分组如下：

```graphql
type Plugin {
  id: ID!
  fullName: String!
  name: String!
  owner: String!
  repositoryUrl: String!
  url: String! # deprecated: Use repositoryUrl

  description: String!
  tags: [String!]!
  language: String!
  stars: Int!
  contributors: Int
  pushedAt: DateTime
  archived: Boolean!
  category: String!

  score: Int
  grade: PluginGrade
  rating: PluginRating
  isFeatured: Boolean!
  isOfficial: Boolean!
  isInsider: Boolean!
  isRisky: Boolean!
  riskNote: String
  isPlugin: Boolean

  install: Install!
  firstSeenAt: DateTime
  lastSyncedAt: DateTime
  i18n(locale: String): [PluginI18n!]!
  snapshots(days: Int = 30): [PluginSnapshot!]!
  growth: PluginGrowth!
}
```

`Install`、`PluginI18n`、`PluginSnapshot` 与 `PluginGrowth` 的语义和 null 规则见第 3.2–3.3 节。`Date` 是 `YYYY-MM-DD` 日粒度字符串；`DateTime` 是 RFC 3339 时间字符串。客户端应把两者解析为不同的领域类型，不能把每日快照日期当作瞬时 UTC 时间。

单插件的按需字段示例：

```graphql
query Detail($fullName: ID!, $locale: String!) {
  plugin(fullName: $fullName) {
    fullName
    repositoryUrl
    description
    rating { score grade calculatedAt version }
    install { cmd source kind npmPublished releaseTag probedAt }
    i18n(locale: $locale) { locale description intro highlights updatedAt }
    snapshots(days: 30) { date stars contributors pushedAt }
    growth { windowDays stars contributors }
  }
}
```

### 5.6 查询资源限制

| 限制 | 当前值 | 影响 |
| --- | --- | --- |
| POST 请求体 | 16 KiB | 更大 body 返回 HTTP 400 |
| query 文本 | 8 KiB | 超过返回 HTTP 400 |
| 选择集深度 | 8 | 更深为 GraphQL error |
| 根字段 | 8 | 超过为 GraphQL error |
| 插件数据根解析器 | 1 | `plugin` / `plugins` 及其 alias 合计最多一个 |
| `plugins.first` | 50 | 使用 cursor 继续翻页 |
| `snapshots.days` | 90 | 使用更小窗口或在客户端保存历史 |

GraphQL 读取基础快照的同时，选择 `i18n`、`snapshots` 或 `growth` 时最多增加两次批量 Turso 查询。接口不会按节点数线性新增数据库请求，但外部客户端仍应只选择实际需要的字段。

## 6. 错误、重试与限流

### 6.1 REST 错误外形

```json
{
  "error": {
    "code": "rate_limited",
    "message": "too many requests",
    "retry_after": 12
  }
}
```

| HTTP | `error.code` | 常见原因 | 客户端动作 |
| --- | --- | --- | --- |
| 400 | `bad_request` | `min_score` 非 0–100 整数、Admin 请求体错误 | 修正请求，不要盲目重试 |
| 401 | `unauthorized` | API key 无效/已吊销 | 移除错误 key 或轮换有效 key |
| 403 | `forbidden` | 认证端点 origin 不允许 | 仅从配置的前端 origin 发起带 Cookie 请求 |
| 404 | `not_found` | 插件不存在、Admin key 不存在/已吊销 | 检查 ID，不重试 |
| 409 | `stale_data` | REST 多页请求跨了 `data_version` | 从第一页重新同步 |
| 429 | `rate_limited` | 某个 token bucket 已耗尽 | 读取 `Retry-After`，带随机抖动后重试 |
| 500 | `internal` | Turso 详情读取或编码失败 | 指数退避；不要缓存 |
| 503 | `internal` | 首次插件缓存未加载，或 Admin 未启用 | 公共读取稍后重试；Admin 检查配置 |

### 6.2 GraphQL 错误语义

GraphQL 区分 HTTP 传输错误与 query 执行错误：

| 类别 | HTTP | 响应 |
| --- | --- | --- |
| 非法 JSON、GET `variables` 非 JSON object、空 query、body/query 超限 | 400 | `{ "errors": [{ "message": "..." }] }` |
| GraphQL 语法、未知字段、无效参数、mutation、深度/根字段/游标限制、Turso resolver 失败 | 200 | `{ "errors": [{ "message": "..." }] }`，无 `data` |
| 成功 | 200 | `{ "data": { ... } }` |
| 缓存尚未加载 | 503 | REST 统一 `error` 外形 |
| 限流/API key | 401/429 | REST 统一 `error` 外形 |

因此 GraphQL 客户端必须同时检查 HTTP 状态和顶层 `errors`，不能把 HTTP 200 自动当作查询成功。

### 6.3 默认限流与扩容注意事项

当前生产设计针对 **单 Railway replica**。有效 API key 的默认策略是 120/min、30 突发（可由管理员为该 key 设置不同 `rate_per_min`）；匿名普通查询另有 30/min、10 突发，suggest 为 60/min、20 突发，GraphQL 为 60/min、20 突发。

所有公开请求还共享 6000/min、500 突发的进程总桶；每个 GraphQL 请求在总桶中消耗 10 个 token，因此默认约允许 10 GraphQL RPS 持续、50 个突发。OAuth/会话使用与数据 API 分离的 60/min 单 IP、1800/min 全局额度。

令牌余额不会写入 Turso。若把 Railway 扩到两个以上 replica，实际总额度会按副本数放大；在扩容前必须使用 Redis/Valkey 或边缘 WAF 提供共享限流。

## 7. 外部消费者集成建议

### 7.1 目录镜像器

优先用 GraphQL 的 `dataset` 和 cursor connection：

1. `query { dataset { dataVersion asOf } }`；版本未变则结束；
2. `plugins(first: 50)` 拉第一页，保存 `dataVersion`；
3. 仅用上一页返回的 `endCursor` 继续；
4. 在任何 `errors`（特别是 cursor 失效）时丢弃本轮，从第 1 步重新开始；
5. 只在确有需求时选择 `i18n` 与 `snapshots`，否则先镜像基础字段再按详情补齐。

REST 同样可用于镜像，但必须在每个后续页传 `data_version`。不要通过比较 `generated_at` 判断数据是否改变，应该比较内容版本。

### 7.2 浏览器搜索

浏览器输入时应在客户端做 150–250ms debounce，并且仅在至少两个字符时调用建议接口：

```ts
const response = await fetch(
  `https://api.dshfind.com/v1/suggest?q=${encodeURIComponent(query)}`,
  { signal: AbortSignal.timeout(1500) },
);
if (!response.ok) throw new Error(`suggest failed: ${response.status}`);
const { items } = await response.json();
```

不要把管理 key 或 Vercel 的 `BACKEND_API_KEY` 放到浏览器；匿名 quota 专为直接浏览器查询保留。

### 7.3 条件请求

```bash
etag=$(curl -sD - -o /dev/null 'https://api.dshfind.com/v1/plugins?per_page=1' \
  | awk 'tolower($1) == "etag:" {print $2}' | tr -d '\r')

curl -i 'https://api.dshfind.com/v1/plugins?per_page=1' \
  -H "If-None-Match: $etag"
```

得到 `304` 时必须复用本地已验证的响应体；304 本身没有新的 JSON body。缓存键必须包含完整 URL（尤其是 filter、pagination、GraphQL query/variables），不能仅按 `dataVersion` 共用不同表示的 ETag。

## 8. 版本演进规则

- `fullName` 是外部主键，使用其保存和去重；不要依赖显示名或 GitHub URL 的字符串拆分。
- 所有标注 deprecated 的字段（当前是 GraphQL `Plugin.url`）只为迁移期兼容，新实现使用替代字段。
- 新字段可能出现；JSON 消费端应忽略未知字段，GraphQL 客户端应按 SDL 版本生成代码。
- nullable 变为有值属于正常数据补全；不要把 null 当作错误，也不要以空字符串替代 null。
- dshfind 评分、运营标记、分类和安装结论是本服务的衍生/运营数据，可能随着规则和审核运营更新；保存时带上相应时间和版本字段。
- 管理、审计、OAuth 接口不属于公开数据 schema。不要通过探测未文档化路径来建立集成。

## 9. 快速检查

```bash
# 基础版本
curl --fail --show-error --get https://api.dshfind.com/graphql \
  --data-urlencode 'query={ dataset { dataVersion asOf } }'

# 列表（REST）
curl --fail --show-error 'https://api.dshfind.com/v1/plugins?category=memory&per_page=5'

# 单插件（GraphQL）
curl --fail --show-error https://api.dshfind.com/graphql \
  -H 'Content-Type: application/json' \
  --data '{"query":"query($n: ID!){plugin(fullName:$n){fullName repositoryUrl install{cmd kind}}}","variables":{"n":"owner/repo"}}'

# 获取当前可生成代码的 SDL
curl --fail --show-error https://api.dshfind.com/graphql/schema
```

接口实现和部署检查见 [Vercel + Railway 生产部署手册](./deployment-railway-vercel.zh-CN.md)。
