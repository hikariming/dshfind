# dshfind 数据库迁移方案 v3（两段式：先迁稳，后全切 CF）

> 制定于 2026-08-26，v3。战略定调：**终局是全 Cloudflare**（单平台、单库 D1、
> 退役 Railway 与 Turso），但分两段走——阶段一先把数据和 80% 流量迁稳，
> 用量化闸门验收；阶段二用绞杀式（strangler）逐端点把 Go 的剩余职责移进
> Worker。**GraphQL 是对外契约（配合 GitHub 上的热门项目），必须移植保留，
> 不能砍。**
>
> v3 相对 v2 的两个修正：
> 1. **Go 全程一行不改**。v2 的 P5（cache 换源）取消——既然 Go 终将退役，
>    没必要为过渡期动它；脚本双写（Turso + D1）就是过渡桥，直到 Go 退役。
> 2. **GraphQL 的移植路径**：不逐行翻译 1,783 行 Go（其中 573 行是手写
>    parser），改用 graphql-js——parser/校验白拿，真正要写的只有 schema
>    绑定 + resolver，且 resolver 的数据源就是阶段一已经建好的
>    静态产物 + D1。
>
> 全部实测数据（dbstat、响应头、9 天请求日志、Go 逐文件行数）见 §0，
> 与 v1/v2 相同，未变。

## 0. 诊断结论（实测数据）

### 0.1 库的真实构成

| 对象 | 占用 | 行数 | 说明 |
| --- | --- | --- | --- |
| **`api_requests` + 2 个索引** | **64.96 MB（72%）** | 277,250 | 9 天访问日志（约 7.2 MB/天增长） |
| `plugins` | 7.49 MB | 12,155 | 67 列（D1 上限 100 列/表） |
| `plugin_snapshots` + 索引 | 11.29 MB | 82,384 | star 历史 |
| `docs_pages` / `plugin_images` / `plugin_i18n` 等 | ~7 MB | | |
| **合计** | **90.43 MB** | | 业务数据仅约 **25 MB** |

### 0.2 流量的真实构成（近 9 天）

| 项 | 实测 |
| --- | --- |
| 日均请求 | 34,511 → 约 104 万/月；**全站仅 76 个不同 IP** |
| `/v1/plugins` 占比 | **80%**（221,324 次），其中桌面端 UA 182,585 次 |
| 最高频单一 query | `page=1&per_page=100` **96,178 次完全相同** |
| `/v1/plugins` 耗时 | 服务端 5 ms；从中国大陆端到端实测 **1.3–1.9 s**（全是网络） |
| `/discussion` 系列 | avg 240 ms = Railway→Turso 往返 |

桌面端只要前 200 条（`desktopFirstWaveMaxItems`），每天变一次——本质是文件。

### 0.3 `api.dshfind.com` 未接入 Cloudflare

`server: railway-hikari`、无 `cf-ray` → 直连源站，`s-maxage` 白写。
`vary: User-Agent` 有意且必需（同 URL 按 UA 返回不同响应体），而 CF CDN
不按 UA 分桶缓存 → **边缘缓存走不通，Worker 内做 UA 分流是唯一解**。

### 0.4 Go 服务体量

非测试 7,463 行 + 测试 3,130 行。关键构成：GraphQL 引擎 1,783（含手写
parser 573）、store 层 1,433（36 处 `database/sql` 调用点）、forum 1,067、
auth 435（无状态 HS256 JWT Cookie）、compress 239（CF 边缘自带压缩，
移植时直接删）、限流已接 Upstash Redis REST（Workers 里同样能用）。

### 0.5 平台事实

- D1：Worker binding（快）+ REST API（谁都能调但慢、吃 CF API 限速），
  **没有 SQL wire protocol** → Go 的 `database/sql` 连不上，这是"Go 不改
  就留在 Turso"的根因
- Workers：无常驻 Go 运行时；$5/月含 1,000 万请求 + 3,000 万 CPU-ms，
  只计 CPU 不计 I/O；isolate 上限 128 MB
- Analytics Engine：**只能从 Worker binding 写入**（Railway 够不着）——
  所以日志分流要等阶段二 Go 退役后才做

---

## 1. 总体路线

```
阶段一（3.25–4.25 天）：数据迁 D1 + Worker 接管 80% 读流量，Go 零改动
   ↓  闸门：2–4 周浸泡，量化验收（§4）
阶段二（7–10 天，可拆散慢做）：绞杀式移植 Go 剩余职责 → 退役 Railway + Turso
```

### 阶段一期间的数据所有权（过渡态）

| 库 | 表 | 写入方 | 读取方 |
| --- | --- | --- | --- |
| **D1** | `plugins` `plugin_i18n` `plugin_snapshots` `plugin_images` `docs_pages` `sync_runs` | 脚本 | Next（binding）、API Worker（静态产物） |
| **Turso** | 同上 6 表的**双写副本** + `forum_*` `plugin_votes` `api_keys` `api_requests` `api_usage_daily` | 脚本（双写）+ Go | Go |

双写收敛在 `scripts/lib/db.mjs` 一个文件里，是有意保留的过渡桥：
它让 Go 的内存快照照常从 Turso 加载，**Go 因此全程零改动**。
阶段二 Go 退役时双写随之停止，Turso 注销。

---

## 2. 阶段一：迁稳（P0–P5）

### P0 · `api.dshfind.com` 挂橙云代理（0.25 天）

DNS 改 Proxied，源站仍指 Railway。**不加任何 Cache Rule**——"Cache
Everything"会忽略 Vary 把桌面端截断响应串给网站用户。此步是 P4 挂
Worker 路由的前置条件。

### P1 · D1 建库 + 导入 6 张业务表（0.5 天）

```bash
turso db dump dshfind-hikariming > dump.sql
# 只保留 6 张业务表；删 BEGIN TRANSACTION / COMMIT;；确认无 _cf_KV
wrangler d1 create dshfind
wrangler d1 execute dshfind --remote --file=dump.sql
```

- 约 25 MB ≪ 5 GiB 上限；"Statement too long" 就拆 INSERT；逐表核对行数
- schema 权威从 `migrate.go` 转移到新的 `scripts/migrate-d1.mjs`
  （阶段一期间 Turso 副本的 schema 也由双写脚本保持同步），写进 AGENTS.md
- ⚠️ `plugins` 67/100 列，加列前看一眼余量

### P2 · Next 前端切 D1 binding（0.5–1 天，净删代码）

- `wrangler.jsonc` 加 `d1_databases`；删 `src/lib/db.ts` 那 160 行手写
  Turso HTTP 协议，按同一 `Db` 接口用 `prepare().bind().all()` 重写
- 上游 `plugins-db.ts`（6 处）/`docs-db.ts`（1 处）一行不改；
  移除 `@libsql/client`
- 回滚：留旧 `db.ts` 一个版本，环境变量切回

### P3 · 脚本收口 + 双写（1 天）

1. 17 个脚本各自 `createClient()` → 收敛到 `scripts/lib/db.mjs`
2. 写入通道：推荐 Next Worker 上加带 secret 的内部写入路由（binding 速度、
   不吃 CF API 限速）；图省事可先走 D1 REST
3. `db.mjs` 同时写 Turso 与 D1（双写期贯穿整个阶段一与闸门期）
4. 9 处 `client.batch(slice(i, i+100))` 核算 D1 的 100 绑定参数 / 100 KB 上限
5. 验收：`refresh-site.mjs` 完整跑通，两库行数一致

### P4 · API Worker 接管读路径（1–1.5 天，阶段一的关键）

新建轻量 Worker（同仓库），路由挂 `api.dshfind.com/v1/plugins*` 与
`/market/*`：

- **产物预渲染**：`refresh-site.mjs` 把 API 响应逐页预渲染成静态 JSON
  （完整目录版 + 桌面首屏 200 条版），作为 Worker Assets 随部署发布——
  与现有"生成物进 git → 推送触发 CF 部署"同一条流水线
- **Worker 只做三件事**：按 UA 选产物集（忠实复刻 `plugins.go:65`）；
  `data_version` 不符返 409；吐预渲染字节。零解析、零内存驻留、~1 ms CPU
- **兜底直通**：不认识的路径（详情页、discussion）`fetch(request)` 原样
  透传 Railway（需 `global_fetch_strictly_public`）
- 不做内存过滤（12.8 MB JSON 解析进堆 30–50 MB，顶 128 MB isolate 上限）；
  不用 DO（每请求穿 DO 的常驻 duration ≈ 33 万 GB-s/月，贴 40 万含量）
- 产物生成逻辑从 `writeDesktopFirstWave` 移植（桌面可安装过滤 + 截断 200），
  以 `plugins_test.go` 为对照基准，上线前 Go vs Worker 响应逐字节比对
- 切换瞬间桌面端收到一次 409 → 自动从第 1 页重新同步（409 语义的设计用途，
  零配合）

`/v1/suggest`、`/v1/catalog`、GraphQL、论坛、鉴权此阶段**全留 Go**。

**验收**：Railway 日志中 `/v1/plugins` 归零；大陆端到端 < 200 ms。

### P5 · 阶段一收尾（0.25 天，不动 Go）

- 给 `api_requests` 加清理：Turso 侧跑一个每日 `DELETE ... WHERE ts <
  date('now','-30 day')`（用现有脚本定时跑，不改 Go），Turso 稳定在免费档
- 固化监控：D1 错误率、双写一致性抽查（两库行数 diff）进 `refresh-site`
  的部署门禁

---

## 3. 阶段二：绞杀式移植，退役 Go（7–10 天，可拆散慢做）

原则：**同一个 P4 Worker 逐步扩大接管的路由面，每接管一组端点独立发布、
独立回滚（摘路由即回退 Go）**。Go 在此期间继续跑，是活的对照组。
顺序按"风险从低到高、依赖从少到多"：

### S1 · 剩余只读端点（0.5–1 天）
`/v1/suggest`（6.4 千次/14 天）、`/v1/catalog`、`/v1/plugins/{owner}/{repo}`
详情。数据源：P4 的静态产物（suggest 可预构建一个精简检索索引产物，
避免整目录进内存）。Next 端已有同口径的 suggest 实现可参考（`src/lib/suggest.ts`
的历史契约，cache/plugins.go 注释里明确两端逐字段对齐）。

**拆成三步做，各自独立发布**（执行状态见 §7.1.3）：

| | 端点 | 数据源 | 状态 |
| --- | --- | --- | --- |
| S1-a | `/v1/suggest`、`/v1/catalog` | 静态产物 | ✅ |
| S1-b | `/v1/plugins` 的过滤与排序（去掉现有透传） | 新增 `list-facets.json` | ✅ |
| S1-c | `/v1/plugins/{owner}/{repo}` 详情 | 产物 + **D1 binding**（i18n / snapshots 实时查库） | ✅ |

### S2 · GraphQL 移植（3–5 天，最大单项）

> **2026-08-27 修正：不用 graphql-js，parser 也手抄。** v3 当初的理由是
> 「573 行手写 parser 可以白拿」，但录完契约语料后发现两条硬约束让它不成立：
>
> 1. **响应键按字母序，不是选择顺序。** Go 的 `Data` 是 `map[string]any`，
>    `encoding/json` 序列化 map 会排序。实测 `{stars fullName owner archived name}`
>    回来的是 `archived, fullName, name, owner, stars`。这在 spec 上是违规的，
>    但已经是既成契约；graphql-js 的执行器返回选择顺序，**每一条响应都会对不上**。
> 2. **解析错误带字节偏移且文案自定义**，如
>    `GraphQL parse error near byte 12: unterminated selection set`、
>    `directives are not supported`、`block strings are not supported`。
>    graphql-js 给的是 spec 文案加 line/column。
>
> 加上文档（api-query.md §5.1）明确承诺**不支持** directive / introspection /
> block string——引 graphql-js 进来还得把这些逐个关掉。这个语法很小（4 个根字段、
> 一层受限的值语法），手抄反而更省、更准，还省掉一个依赖。
>
> 另外两处移植时必须照抄的既有行为：
> - `graphConnectionSignature` 的签名 payload **漏了 `risky`**，所以游标其实
>   没绑定这个过滤条件。是 Go 的 bug，但改了游标就不兼容，照抄。
> - 该 payload 是匿名 struct 的 `json.Marshal`，键名即字段名、顺序即声明顺序
>   （struct 不排序，只有 map 排序），要逐字节复现才能让两边游标互通。
- **用 graphql-js，不逐行翻译**：Go 那 1,783 行里 573 行是 parser——
  graphql-js 白送 parser + 校验 + 执行器。真正要写的是 schema 定义
  （`/graphql/schema` 端点就是现成契约）+ resolver
- resolver 数据源：目录字段 ← 静态产物；live 嵌套字段（票数等）← D1
  binding（论坛表届时已随 S3 迁入，若 S2 先做则临时子请求透传 Go）
- **契约保真**：`graphql_test.go` 的用例导出为 fixture，同一批查询打
  Go 与 Worker 逐字节 diff；ETag/Cache-Control 行为照 `cache_headers.go` 移植
- GET 查询形式的 ETag 304 语义保留（对外文档 `docs/api-query.md` 承诺过的
  行为都要过一遍）

### S3 · 论坛 + 投票 + 鉴权（2.5–3.5 天）
- 论坛表迁 D1：全部数据个位数到两位数行，选低峰**写冻结几分钟**导过去即可
- forum/votes CRUD（Go 1,067 行）→ TS on D1 binding，逻辑直译
- 鉴权 435 行 → Web Crypto 重写：**HS256 用同一个签名密钥、同一个 Cookie
  域名，切换时已登录用户的会话无缝存活**，GitHub OAuth 回调 URL 不变
- 限流：Upstash Redis REST 原样复用（Workers 里同协议）

### S4 · API key / 用量 / 管理面（1–2 天）
- `api_keys` `api_usage_daily` 迁 D1；admin 端点移植
- **`api_requests` 原始日志改写 Workers Analytics Engine**——v1 里放弃的
  方案在这里复活（现在是 Worker binding，够得着了）：12 个字段落在
  20 blob / 20 double / 1 index 额度内，保留 3 个月，长周期聚合有
  `api_usage_daily` 在 D1
- OTel 遥测：Workers 自带 observability 顶上；如需保留 OTLP 管线，
  Workers 里可用 fetch 导出，但不作为退役门槛

### S5 · 退役（0.5 天）
1. Railway 服务停机观察一周（路由已全部指向 Worker，随时可重启回滚）
2. 停 `db.mjs` 双写 → Turso 只剩已无人读写的副本 → 注销 Turso
3. 删除 `server/` 目录择日再说（git 历史都在，不急）

**终局：单平台（CF）、单库（D1）、单部署流水线，Railway 与 Turso 账单归零，
双写与两库并存的过渡态全部消失。**

---

## 4. 闸门：阶段一 → 阶段二的量化验收（浸泡 2–4 周）

| 指标 | 通过线 |
| --- | --- |
| P4 Worker 服务 `/v1/plugins` | ≥ 2 周无事故；桌面端 409 重同步行为正常 |
| D1 查询错误率（Next + Worker） | 与 Turso 基线持平或更好 |
| 双写一致性抽查 | 连续 N 轮 `refresh-site` 后两库行数 diff = 0 |
| 产物流水线 | 连续 ≥ 10 次日常刷新零人工干预 |
| 大陆端到端延迟 | `/v1/plugins` < 200 ms 稳定 |

闸门不过就停在阶段一——那已经是一个自洽的稳定态（Go 零改动、双写有单点
开关、随时可整体回滚），**不欠债**。

## 5. 回滚

| 步骤 | 回滚方式 | 风险 |
| --- | --- | --- |
| P0 | DNS 取消代理 | 极低 |
| P1 | Turso 原库不动，D1 只是副本 | 无 |
| P2 | 环境变量切回旧 `db.ts` | 低 |
| P3 | `db.mjs` 单点切回 | 低 |
| P4 / S1 / S2 / S3 / S4 | 摘 Worker 路由，流量落回 Go（Go 全程未改，永远是热备） | 低 |
| S5 | Railway 重启 + 重开双写 | 低（停机观察期内） |

**Turso 在 S5 第 2 步前不注销；`server/` 代码永远在 git 里。**

## 6. 工时汇总

| | 工时 | 备注 |
| --- | --- | --- |
| 阶段一 P0–P5 | **3.25–4.25 天** | Go 零改动 |
| 闸门浸泡 | 2–4 周 | 无人工投入，只看指标 |
| 阶段二 S1–S5 | **7–10 天** | 可拆成多个独立发布，穿插日常做 |

## 7. 执行状态（2026-08-26）

阶段一的代码与数据工作已全部完成，等待上线动作（见 §7.1）：

| 项 | 状态 | 证据 |
| --- | --- | --- |
| P1 D1 建库导入 | ✅ | 库 `dshfind`（47f4c8d2，WNAM）；6 表 105,570 行，行数与聚合校验和与 Turso 全部一致 |
| P2 前端切 binding | ✅ | `src/lib/db.ts` 重写（binding 优先，Turso 兜底）；cf:preview 实测 binding 读路径生效；build 页面分类无回归 |
| P3 脚本双写 | ✅ | 19 个脚本收敛到 `scripts/lib/db.mjs`；内部路由 `/api/internal/db`（secret 已设，`INTERNAL_DB_TOKEN`）；execute/batch/DELETE 双写 E2E 验证通过；`check-db-consistency.mjs` 已挂进 refresh-site |
| P4 边缘 Worker | ✅ | `workers/api-edge/`；产物生成器 data_version 与线上 Go **sha256 完全一致**（= 11,337 条逐字节相同）；13/13 parity 用例全过（含桌面 UA、409、304、透传）；refresh-site 已接产物生成 + `API_EDGE_DEPLOY=1` 部署步骤 |
| P0 橙云代理 | ✅ | `api.dshfind.com` 已 Proxied；`/v1/plugins` 响应无 Railway 头即 Worker 在服务 |
| P4 补：`/market/*` | ✅ | 路由与产物已补齐（§7.1.2），parity 26 项全绿 |

**切流实测（口径为 Go 侧 `api_requests`）**：Go 日请求从切流前七日均值
**34,500** 降到 **~3,900/天（-89%）**。两步：`/v1/plugins`（2026-08-26 06:14 UTC）
拿走大头，`/market/*`（2026-08-27 02:38 UTC）拿走剩余的 3,239 次/天。
Go 现在只剩：

| 端点 | 折算/天 | 服务端耗时 | 归属 |
| --- | --- | --- | --- |
| 详情 `/discussion` | ~2,020 | 229 ms | S3（依赖论坛表） |
| `/v1/plugins?q=` 搜索透传 | ~600 | 5 ms | S1 |
| `/v1/forum/*` | ~580 | 334 ms | S3 |
| `/v1/suggest` | ~470 | 1 ms | S1 |
| `/graphql` | ~180 | 72 ms | S2（最大单项） |
| `/v1/catalog` + 详情本体 | ~100 | ~250 ms | S1 |

社区写接口（发帖/投票/OAuth）**不进 `api_requests` 审计**
（`middleware.go:215` 有意为之），上表只覆盖公开读；实际写量从论坛表看约
1 次/天（累计 4 帖 7 回 11 票）。

⚠️ **查这张表时注意时间边界的坑**：`ts` 存成 `2026-08-27T01:07:22Z`，而
`datetime('now','-3 hour')` 返回空格分隔格式，字符串比较时 `'T' > ' '`，
会把**整天**的数据都放进窗口。边界一律用同格式的字面量。

**schema 所有权（P1.4 落地）**：6 张已迁表的新增列，入口是双写期的
`scripts/lib/db.mjs`（DDL 会双落两库）；双写停止后另建 `scripts/migrate-d1.mjs`。
`migrate.go` 对这 6 张表的 DDL 自阶段二 S5 起失效。

### 7.1 切流 runbook（按序执行）

1. **提交并推送本次改动**（触发主站部署，内部路由 `/api/internal/db` 上线，
   前端开始读 D1）。前端有 Turso 兜底 + 静态兜底，任何一层失败都不白屏。
2. **验证双写**：`node --env-file=.env.local scripts/check-db-consistency.mjs`
   （需要第 1 步部署完成）；随后正常跑一轮 `pnpm refresh`，确认「双写一致性核对」步通过。
3. **Cloudflare dashboard**：SSL/TLS 模式确认为 **Full (strict)** 或 Full；
   DNS 里把 `api` 记录切为 **Proxied（橙云）**。不加任何 Cache Rule。
   验证：`curl -sI https://api.dshfind.com/healthz` 出现 `cf-ray` 且 200。
4. **切流**：`pnpm exec wrangler deploy --config workers/api-edge/wrangler.jsonc`
   （routes 随部署挂上，即刻生效）。桌面端会收到一次 409 后自动重同步。
   验证：`node scripts/check-api-parity.mjs https://api.dshfind.com`
   （此时 LIVE 侧应改比 Railway 直连地址，或看 Worker analytics 请求数上涨）。
5. **.env.local 置 `API_EDGE_DEPLOY=1`**：此后每轮 refresh 自动重发产物。
6. **回滚**：任何异常 → `wrangler delete --config workers/api-edge/wrangler.jsonc`
   摘掉路由（流量落回 Go）；或 dashboard 里把 DNS 切回 DNS-only。

### 7.1.1 CI 适配（2026-08-26 追加）

- **夜间同步（sync-plugins.yml）**：已补 `D1_INTERNAL_URL/TOKEN`（双写）、一致性
  核对步、api-edge 产物重发。排查中发现该任务 **8/16 起连续 10 天超时停摆**
  （Actions token 1000 次/时抓 1.2 万仓库贡献者数必然限流）——已改
  `--skip-contributors`（健康时长 ~3.4 分钟），全量贡献者重抓走本地
  `pnpm refresh --with-contributors`
- **api-edge 发布三件套**：`scripts/deploy-api-edge.mjs` 部署 → 生产验收
  （data_version 一致 + 桌面截断契约）→ 失败自动回滚锚点版本；refresh-site
  与夜间同步共用；`--verify-only` 供排查
- **gate 金丝雀**：deploy-production 冒烟新增 edge `/v1/plugins`（完整 + 桌面
  两信封）。独立于 Railway 回滚判定——Worker 坏了只标红 release，恢复动作是
  `wrangler rollback --config workers/api-edge/wrangler.jsonc`
- **待办**：`CLOUDFLARE_API_TOKEN`（Workers Scripts:Edit 权限）配进 GH secrets
  后夜间产物部署才生效；未配置期间任务会告警跳过部署，桌面端目录靠本地 refresh
- **注意**：主站 `wrangler rollback` 到 b8191fe 之前的版本会把内部写入路由一起
  滚掉，双写降级单写开始漂移——一致性核对会红，重新部署即恢复

### 7.1.2 `/market/*` 补接管（2026-08-27）

切流后复盘 Go 的 `api_requests` 发现 **P4 漏了一半**：方案写的是"路由挂
`/v1/plugins*` 与 `/market/*`"，实际 `wrangler.jsonc` 只挂了前者。后果是
桌面端市场契约整条留在 Go 上，而且 8/26 13:00 起从 ~20 次/天涨到 1,881 次/天，
一举成为 Go 的头号负载。已补齐：

| 项 | 内容 |
| --- | --- |
| 产物 | `market-items.ndjson`（is_plugin=1、full_name 字节序、4,977 条）+ `market-filters.json`（category / 小写 name / 小写 description 三条平行数组） |
| 覆盖面 | `limit` / `cursor` / `q` / `category` **全部在边缘实现**，不留透传——Go 对未知参数是忽略而非报错，所以这条路径没有"必须回源"的形状 |
| manifest | `/market/manifest.json` 作为常量内嵌 Worker，字节与 Go 逐字节相同（532B） |
| 验收 | parity 26 项全绿（含游标翻页、category+游标、中文关键词、400/409、304、Vary 口径） |

**上线结果（2026-08-27T02:38:23Z 部署）**：Go 侧最后一条 `/market` 请求是
`02:38:26Z`，3 秒传播窗口后归零，全程无非 2xx/3xx 响应。**桌面端零 409**——
产物的 `data_version` 与 Go 当时的快照完全相同，Go 发出去的游标在边缘直接认，
换手对客户端完全无感（`/v1/plugins` 那边会有一次 409，因为顺带把陈了两天的
产物一起刷新了，这是 409 的设计用途）。生产验收 40 项全过：全量同步走完
50 页游标链、去重 4,977 条与 `total` 相等、产物无法被公网直接拉取、
warm TTFB 210–260ms 且与请求形状无关（带 `q` 要扫 4,977 条也一样）。

三个复刻时最容易踩的坑，都已写进代码注释：

1. **`total` 数的是过滤后、`buildMarketItem` 之前的条目数**。过不了 schema 的
   条目在产物里写 `"null"` 占位而不是删行，否则 total 与游标偏移会一起偏。
2. **`q` 要对 name 与 description 分别 `Contains`**，拼成一条再搜会让跨边界的
   关键词假命中。
3. **Go 的 `len(string)` 是字节数**（id/pkg_name/category/url 的上限），
   `truncateRunes` 才是码点——两种口径混用会在长中文描述上炸。

另外两处口径修正（都不是契约差异，是比对方法本身的坑）：

- 橙云代理后 CF 重压缩会把强 ETag 降级成 `W/"..."`，`check-api-parity.mjs`
  的 `normEtag` 要连 `W/` 一起抹平，不然全员假红
- **已切流的路径不能拿 `api.dshfind.com` 当对照组**——那是 Worker 自己。脚本
  现在按 `x-railway-request-id` 判断对照组是不是 Go，不是就跳过并提示传
  Railway 直连域名

### 7.1.3 S1-a：`/v1/suggest` 与 `/v1/catalog`（2026-08-27）

| 端点 | 做法 |
| --- | --- |
| `/v1/suggest` | 新增 `suggest-items.ndjson`（预渲染 Suggestion 字节）+ `suggest-hay.json`（小写检索串）。hay 口径是 `full_name + description + tags`，**不含 language**——那是列表用的 `ListHay`，混了会让搜 "python" 也命中 |
| `/v1/catalog` | 就是 `catalog-full.ndjson` 加个信封，零新增产物。ETag 在生成期预算进 `meta.json`：对 11MB 做 sha256 要几十毫秒 CPU，Go 每次都付，我们没必要跟 |

两个坑：

1. **suggest 的短 query 分支走的是 `writeJSON` 而非 `writeCacheableJSON`**——
   `no-store`、无 ETag，且 `json.NewEncoder` 带一个末尾换行（13 字节）。
   照着长 query 那条抄会少一个字节。
2. **归一化顺序是 trim → 截 64 码点 → lower，长度判定在 lower 之后**。
   个别字符小写后码点数会变，顺序反了结果不同。

**验收**：suggest 20 个关键词横扫（含中文「插件/工具/翻译/图片/语音」）逐字节
一致；catalog 整包 10.89 MB 逐字节一致，版本匹配时确实换成 immutable 缓存头。

**顺手堵了一个隐患**：产物缺失时 Worker 的兜底是**透传回 Go**，响应仍然 200，
只验信封的验收根本发现不了这种静默回退。发布验收与 gate 金丝雀现在都会检查
响应里有没有 `x-railway-request-id`（只有 Railway 会带），把「悄悄退回 Go」
判成失败。

#### 事故记录：一次误判把生产滚回了初版

S1-a 首次发布时 `deploy-api-edge.mjs` 同时踩到两个 bug，连锁把生产滚回
2026-08-26 的初版（`/market/*` 接管一并丢掉，目录退回 8/25）。**没有中断**
——被摘掉的路径都优雅退回了 Go——但两个 bug 都必须记下来：

1. **`wrangler deployments list --json` 是按时间升序返回的**，脚本取 `[0]`
   当回滚锚点，那是**最早**那次部署。也就是说此前任何一次验收失败，都会把
   生产滚回初版而不是上一个好版本。已抽成 `currentDeploymentVersion()`
   并加回归测试锁住方向。
2. **CF 重压缩把强 ETag 降级成 `W/"..."`**，验收拿它跟产物里预算的强 ETag
   直接比 → 值一样但字符串不等 → 假失败 → 触发上面那个回滚。`normEtag`
   抹平（parity 脚本早先修过同一处，发布脚本漏了——**同一个坑要两处一起改**）。

教训：自动回滚的锚点选取本身必须有测试。它平时不执行，只在出事那一刻执行，
错了就是「救火时浇的是汽油」。

### 7.1.4 S1-b：`/v1/plugins` 的过滤与排序（2026-08-27）

新增 `list-facets.json`（3.7 MB）承载 14 个过滤条件与 4 种排序，`/v1/plugins`
**不再有任何透传形状**——Go 的 `handlePluginList` 对不认识的参数是忽略而非
报错，所以全量接管是安全的。产物用平行数组而不是对象数组：11,633 行每行重复
一遍键名，光键名就要几 MB；六个二值标记压成一个位掩码。Worker 只在请求真带了
过滤/排序参数时才加载解析它，裸分页仍走「切连续区间」的快路径。

线上实际用法只有 `q=<关键词>&per_page=12`（我们自己的 `/search` 页），但
`docs/api-query.md` 是对外承诺过的契约，按全量实现而不是按观测子集。

三个必须照抄的口径：

1. **桌面 UA 是在解析过滤参数之前短路的**（`plugins.go:65`）。带 `category`
   或 `sort` 的桌面请求照样只拿首屏 200 条，过滤被整个忽略。
2. **`sort=name` 独自默认升序**，其余三种默认降序；不认识的 `sort` 值保持
   快照原序（`sort.SliceStable`，JS 的 `Array#sort` 规范上同样稳定）。
   `sort=score` 时无分条目记 -1 而不是排除。
3. **`ListHay` 比 suggest 的 hay 多一段 language**，所以列表搜 "typescript"
   能按语言命中，suggest 不能——两个索引不能互相复用。

**验收**：36 项过滤/排序用例逐字节一致（含中文关键词、三态 `is_plugin`、
`min_score` 非法/越界/负数的 400、桌面 UA 短路、组合查询）。

### 7.1.5 S1-c：插件详情（2026-08-27）

api-edge 第一次挂 **D1 binding**（只读，与主站同库）。条目主体仍来自产物，
`i18n` 与 star 历史实时查库——快照 9.4 万行，预渲染既放不下也没必要，
而详情只有约 44 次/天。新增 `detail-index.json`（小写 `full_name` → 行号，
397 KB），命中后**只解析那一行**取 `full_name`/`stars`/`contributors` 供
growth 计算，响应体仍然复用原始字节。

路由不用加：`/v1/plugins*` 本来就匹配到详情路径，之前是走透传分支。

四个照抄点：

1. **`i18n` 的键必须按 locale 排序**。Go 序列化 map 时会排序，JS 对象走插入序，
   不显式排就按数据库返回顺序输出，字节直接对不上。
2. `description` / `intro` 是**指针 + omitempty**：SQL NULL 才省略，空串照样输出；
   `highlights` 是切片 + omitempty，NULL / 空串 / 解析成空数组都省略。
3. `snapshots` 里的 `contributors` 与 `pushed_at` 是指针但**没有** omitempty，
   缺失要输出 `null` 而不是省略。
4. 详情响应**不带** `Vary: User-Agent`（列表才按 UA 分流）。

**验收**：15 项逐字节一致，含 i18n 文本里的 `&`/`<` HTML 转义、无 i18n 的空对象、
只有 1 张快照时 growth 记 0/null、快照 `contributors` 为 null、大小写不敏感查找、
404 形状、`snapshot_days` 的 clamp 与非法回退。

**`/discussion` 明确不接管**：它依赖论坛表，那还在 Turso 且只有 Go 在写。
读切到 D1 而写留在 Go，用户刚发的评论就读不出来——比不接管更糟。parity 里
加了一条断言锁住「它必须仍然透传」，防止以后手滑把整个 `/v1/plugins/*`
一并接管。要动它得整个 S3 一起走。

### 7.1.6 S2：GraphQL 全量接管（2026-08-28）

`/graphql`（GET/POST/HEAD）与 `/graphql/schema` 都在边缘实现，零透传形状
（OPTIONS 预检仍透传）。构成：

| 文件 | 内容 |
| --- | --- |
| `workers/api-edge/graphql-parse.mjs` | lexer + parser，逐行复刻 `graphql_parse.go`。**在 Uint8Array 上跑**——Go 的 lexer 按字节工作、错误位置是字节偏移、`unicode.IsLetter(rune(byte))` 会把 UTF-8 中文首字节按 Latin-1 当字母 |
| `workers/api-edge/graphql.mjs` | 传输层 + 执行器。响应键按字母序（marshalSorted）、三种错误头形态、游标签名逐字节复现（含漏 Risky 的既有 bug）、Go json 解码器错误文案的常见形态仿真 |
| `workers/api-edge/graphql-static.mjs` | SDL 常量，与 Go 的 go:embed 文件逐字节一致 |
| `graphql-facets.json` 产物 | pluginFacets 预算（count 降序、value 字节序升序），省掉每请求全表扫描 |

**验收（全部对着线上 Go 现打现比，前置 dataVersion 一致闸）**：

- 71 条固定用例逐字节一致（含响应头三态、55 条错误文案、字节偏移）
- 38 条对抗性用例逐字节一致（`__proto__`/`constructor` 当 alias、深度 8/9 边界、
  9 个根字段、递归/重复 fragment、中文后的字节偏移、Go json 解码器边角、
  整型溢出、重复键后者赢、参数显式 null）
- 游标**双向互通**：Go 发的游标边缘直接可用，两边发出的游标逐字符相同
- GET 304 / POST 不 304（Go 只对 GET/HEAD 做条件请求；顺手修了
  `cacheableResponse` 对 POST 也会 304 的潜伏 bug）
- REST 八条路径回归逐字节一致；`pnpm test` 全绿

**已知的尽力而为**：对**深层**畸形 JSON 的 400 文案（Go json 扫描器有十几种
措辞）只对齐了常见形态——首字符、字面量、截断、类型不符都逐字对上了，
合法客户端根本走不到这些路径。

**执行器里必须用 `Object.create(null)`**：alias 是合法 GraphQL name，
`__proto__` 也是。普通对象上 `result["__proto__"] = …` 会改原型链、键从
JSON 里消失，Go 却正常输出——对抗性用例里有这条，真实 Go 的输出就是键照发。

### 7.2 闸门期观察（§4 的落地）

- 每轮 refresh 的「双写一致性核对」必须绿
- Workers dashboard 看 api-edge 的请求量与错误率；Railway 日志确认
  `/v1/plugins` 流量归零
- 2–4 周后按 §4 指标决定是否启动阶段二

## 8. 待确认事项

1. **闸门浸泡期取 2 周还是 4 周**？桌面端装机增速快的话建议 4 周。
2. **S2 与 S3 的顺序**：先 GraphQL（live 字段临时透传 Go）还是先论坛
   （GraphQL 直接读 D1）？推荐**先 S3 后 S2**，S2 少一个临时透传的脏补丁。
3. P3 写入通道：Worker 内部路由（推荐）还是 D1 REST？
4. `docs/api-query.md` 对外承诺的行为清单需要在 S2 前整理成 parity
   测试用例集——这份文档当前是否与线上行为一致？
