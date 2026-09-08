# 页面缓存迁移与观察

2026-09-08：保留 Next.js/OpenNext，改用 Workers Cache + 只读 Static Assets。

## 当前设计

- 首页、课程、分类、语言、分页目录、浏览页和文档目录：构建快照，只读静态资产，不定时重建。
- 插件详情、插件目录、标签、文档正文：缓存未命中时请求渲染，公开 HTML/RSC 边缘缓存一小时。
- 论坛列表和帖子：SSR 保留可索引正文，公开响应缓存 60 秒，浏览器继续刷新回复。
- 全量插件 JSON：边缘缓存 30 分钟；sitemap 一小时。徽标、分享卡和搜索建议保留原有公开响应 TTL。
- 登录、会话、带凭据、未知 Cookie、修改请求、Set-Cookie 与错误响应不进入共享缓存。只有显式语言 URL 上单个有效 NEXT_LOCALE 偏好 Cookie 可缓存。
- HTML/RSC、路由导航请求、Host、Cookie 等通过 Vary 隔离；部署版本间不共享缓存。
- 新应用不再绑定 R2，不使用 ISR 队列。历史 DO 类迁移与导出保留，便于回滚。

`dshfind-isr-cache` 桶及已有对象全部保留。此次迁移不包含删除对象、删除桶、设置生命周期或删除 DO 数据。

## 验证记录

三页面试点版本：`0426a95b-e220-4d04-ac25-c75b437e0ba0`。

- 55 次低流量请求验证公开 HTML 命中、相同渲染 ID/内容复用，以及 session/Authorization 绕过。
- 浏览器英文到中文导航成功；重放真实 RSC 请求得到 200 text/x-component，MISS 后 HIT，ID 和内容一致。
- 同一连接上的缓存 HIT：11 个暖样本，TTFB P50 **205 ms**、P95 **254 ms**。
- 同条件现网对照：11 个暖样本，TTFB P50 **360 ms**、P95 **2181 ms**。
- 连续未缓存暖渲染：24 个样本，Cloudflare 日志实际 CPU P50 **33 ms**、P95 **64 ms**、最大 **94 ms**；服务端 wall-time P95 **613 ms**。
- 以上来自本次测试网络的欧洲出口，不代表所有地区。每次新建连接的数据含显著 TLS/网络延迟，不与复用连接混算。
- 冷/混合实例请求的 CPU 最高 **1639 ms**；本地 CPU 采样主要指向模块初始化。暖渲染结果不能代表首次冷启动。
- 全量构建：562 个预渲染页面，定时 ISR 条目为 0；617 个静态资产文件，总约 751 MiB、单文件最大 2.39 MiB。资产由 Cloudflare 管理，不写入 R2。
- 单元测试 124/124 通过；类型检查通过；Lint 0 错误（已有 warning 保留）。

## 48 小时观察

观察窗口从正式版本发布完成开始。需要结合实际页面请求数与爬虫量判断，1000 用户不等于 1000 请求。

1. 正式站首页、插件详情、目录、论坛、文档及语言切换是否正常；错误率是否升高。
2. Worker 的 Cache 命中率、CPU 分位数与 CPU 总量；单独注意冷启动和大量不同 URL 的爬虫。
3. R2 对象数和容量是否停止随日常访问、后续部署持续增长。平台统计有延迟；旧数据仍然占用存储。
4. 内容刷新：公开内容通常最多滞后一小时，论坛 60 秒；部署会隔离新旧缓存。
5. 观察通过后，再单独决定是否删除旧 R2 数据。删除后，依赖该桶的旧版本将不再具有完整回滚条件。

## 回滚

迁移前正式 Worker 版本：`070cfdce-aa1b-4e02-93e0-bfc886381f66`（2026-09-08 08:58 UTC）。

```sh
CLOUDFLARE_ACCOUNT_ID=8f19bebe359e4ec1a24c68c5f49c1584 pnpm exec wrangler rollback 070cfdce-aa1b-4e02-93e0-bfc886381f66 --name dshfind -y
```

回滚需要同时恢复仓库中的旧缓存配置，否则下一次 Workers Builds 会再次部署新配置。不要删除桶后再尝试这个旧版本。

## 构建与费用边界

常规 `pnpm cf:deploy` 会让 OpenNext 将预渲染数据复制到静态资产再部署，不能省略 populateCache 步骤后直接部署一个刚构建的目录。独立验证配置为 `wrangler.canary.jsonc`，诊断响应带 noindex。

原生 Workers Cache 命中跳过 Worker 代码执行，但请求仍按 Workers 请求计费，包括启用该缓存后的静态资产请求。Standard 套餐每月含 1000 万请求、3000 万 CPU ms，超额 CPU 为 $0.02/百万 ms；实际额度与账号其他 Worker 共用。缓存不会保证零费用。

官方依据：[Workers Cache](https://developers.cloudflare.com/workers/cache/)、[Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)、[OpenNext 缓存](https://opennext.js.org/cloudflare/caching)。
