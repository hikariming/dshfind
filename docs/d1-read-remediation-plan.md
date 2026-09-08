# D1 读取放大修复计划（2026-09-09）

## 目标与发布约束

生产账户为 Beiming1201@gmail.com（`8f19bebe359e4ec1a24c68c5f49c1584`），数据库为 dshfind（`47f4c8d2-a9d7-41c3-b142-f8693b20a89d`）。

修复必须让公开请求在缓存未命中时也有可验证的读取上限。推送前完成真实 workerd/D1 与 HTTP E2E；提交按问题拆分，PR 用 rebase 合入 main，禁止 squash。远端验证使用独立预览 Worker；生产先应用向后兼容的索引迁移，再发布通过验证的应用。

## 已取得的生产证据

2026-09-08 17:27 UTC 左右通过 Wrangler D1 Insights 查询最近 7 天，按总 rows_read 排序（此窗口不等于发票账期）：

| 查询 | 次数 | 平均扫描行数 | 总扫描行数 |
| --- | ---: | ---: | ---: |
| Next 插件详情 `lower(full_name) = lower(?)` | 911,428 | 14,621 | 13,326,875,068 |
| Next 目录 GROWTH_SQL | 6,305 | 320,973 | 2,023,737,025 |
| Next 单插件全部历史 | 889,918 | 16 | 14,920,564 |
| Next 全量翻译 | 6,017 | 1,032 | 6,210,780 |

生产 sqlite_schema 确认 plugins 只有普通主键索引，没有 lower(full_name) 表达式索引；plugin_snapshots 已有 `(full_name, snapshot_date)` 主键，不能把问题误判成所有历史查询都缺索引。详情主查询、全量目录查询是当前明确的大头；单插件历史虽然现在较短，仍需消除随年份增长的无界读取。

发票 IN-78371486 的 D1 超额读取 17,098,005,580 行收费 $17.10，整单 $52.66 还包含 R2、DO、CPU 和套餐费。不能把这个最近 7 天的统计直接当作整张历史账单的归因比例。

Git blame：`43a56ad`（8/14）引入详情 lower 查询；`1f2e6a3`（8/14）引入全量增长 CTE；`b8191fe`（8/26）将原 SQL 原样切到 D1 binding；`4f3e935`（8/19）引入 R2 ISR/DO。`270c99b`（9/8）晚于账期，不能解释旧账单，但其语言 Cookie 导致 plugins-data 缓存 bypass 已本地复现。

## 分步实施与提交

1. **索引迁移与有界查询**：一次性创建 lower(full_name) 表达式索引；详情明确依赖该索引，缺失时不得悄悄全表扫。利用历史复合主键直接定位最新和增长基线；保留空历史、单条历史、稀疏历史、大小写与隐藏仓库语义。
2. **目录离线计算**：每日生成物携带贡献者、7 天增长和翻译；首屏与 plugins-data 共用生成物，运行时零 D1。生成任务可以遍历目录，但用每个插件的索引定位，避免全历史 GROUP BY。更新现有同步/生成入口，保持排序和下载量语义。
3. **API 历史有界化**：REST 和 GraphQL 按请求天数限制历史窗口（现有上限 90 天），增长基线单独定位；仅请求 growth 不得加载全部历史。保留 GraphQL 多别名、不同 days 参数和空/过期历史契约。
4. **缓存与观测**：公共目录客户端请求不携带 Cookie；仅明确公共数据允许语言偏好 Cookie，鉴权隔离保持。为 D1 读取保留具名查询与 rows_read 指标，预览能逐请求核对，生产异常能定位；不记录令牌或 SQL 绑定参数。
5. **防回归门禁**：真实 workerd/D1 的大规模夹具（多仓库、数年历史），检查执行计划、扫描行数、结果正确性；HTTP 覆盖四语言目录/详情、徽章/分享卡、404、大小写、Cookie、HTML/RSC、REST、GraphQL。删除索引或恢复旧 SQL 时门禁必须失败。接入 CI。
6. **发布与记录**：推送前本地全部检查和远端预览 E2E 通过；详细 PR 记录事故、证据、修复、验证、回滚边界；CI 通过后 rebase merge，确认 main 与两套生产 Worker 已发布目标版本，再跑生产只读冒烟。

## 验收标准

- 目录首屏与全量 JSON：包括 Cookie/cache bypass，D1 查询数、读取行数均为 0。
- 详情身份查找：EXPLAIN 是 expression-index SEARCH，不得出现 plugins 全表 SCAN；未收录查找同样有界。
- 增长读取：只读最新与基线，增加旧历史不增加扫描行数。
- REST/GraphQL：读取上限跟返回窗口和请求插件数相关，不跟全库大小或历史总长度相关。
- 真实预览请求能看到查询计量，缓存 HIT 不产生新读取；不能仅凭 HTTP 200 或单元测试宣称 E2E 通过。
- 内容与旧逻辑一致，D1 不可用的 fallback 必须能被验证识别，不能把 fallback 误报成查询修复成功。

## 回滚边界

索引是增量、向后兼容变更，可留在生产保护旧版本；不删除业务历史或 R2 数据。应用回滚需保留新的索引。目录更新改为同步生成/部署后生效，运营紧急更新需运行同一生成发布流程。R2 历史对象清理不属于本次 D1 修复。

## 推送前验收结果

已在 Beiming 生产库应用 `0001_plugin_lookup_index.sql`，旧版本即可受益。生产样本确认 `SEARCH plugins USING INDEX idx_plugins_full_name_lower`，读取 2 行；不需要清空历史或回滚数据库。

| 验证层 | 结果 |
| --- | --- |
| 真实 workerd/D1 大数据量 E2E | 15,000 插件、365,001 历史记录；旧详情 15,000 行 → 新详情 1 行；旧单插件历史 3,652 行 → 增长 8 行 |
| API Worker 同夹具 E2E | REST 90 天 99 行；GraphQL 50 插件仅增长 400 行；50 插件增长+90 天 4,950 行；稀疏/不足 7 天/空/单条/过期历史及变量、多别名通过 |
| 远端 HTTP 28 项 | 四语言目录和全量 JSON（含 Cookie/Authorization bypass）0 查询/0 行；详情/徽章/分享卡各 3 查询/9 行；未知插件 1 查询/0 行 |
| 生产数据 GraphQL | 50 插件仅增长 400 行；增长+90 天 1,586 行；71 条固定契约及动态游标、ETag、schema 用例与原生产逐字节一致 |
| 原生缓存 | HTML/RSC 各自 MISS→HIT、render-id 不变且变体隔离；HIT 响应计数头是原始渲染数据，不代表命中时又执行 SQL |
| Chromium 浏览器 | zh/en/ja/ko 全部完成 hydration、零 Cookie 全量 JSON 请求、真实点击/RSC 详情导航；目录 0 行，实际导航详情 14 行；无 pageerror |
| 全目录内容核对 | 13,796 条的顺序、stars、contributors、starGrowth、contributorGrowth 与旧实时 SQL 完全一致 |
| 常规门禁 | 125 单测通过；typecheck、lint（0 error，15 warning）、完整 OpenNext Cloudflare 构建通过 |

浏览器 E2E 还捕获 Wrangler 默认 keep_names 破坏 next-themes 序列化脚本的问题；按 [OpenNext 官方说明](https://opennext.js.org/cloudflare/howtos/keep_names) 设置 `keep_names: false` 后重新部署、HTTP 与浏览器复验通过。此项单独提交，不归入 D1 费用根因。

复现命令（Node 24，先 `pnpm install --frozen-lockfile`）：

```sh
pnpm test:e2e:d1
pnpm cf:build
pnpm exec wrangler deploy --config wrangler.read-preview.jsonc
pnpm exec wrangler deploy --config workers/api-edge/wrangler.read-preview.jsonc
pnpm test:e2e:reads <web-preview-url> <api-preview-url>
E2E_PLAYWRIGHT_MODULE=<playwright/index.mjs> node scripts/e2e/browser-read-navigation.mjs <web-preview-url>
node scripts/check-graphql-parity.mjs <api-preview-url> https://api.dshfind.com
```

API 预览部署前需生成 assets；操作员可设置明确的 `CLOUDFLARE_ACCOUNT_ID`，运行 `node scripts/gen-api-artifacts.mjs --wrangler`，复用已有 Wrangler OAuth。日常 CI 仍走原来的内部 D1 路由。Playwright 是可选浏览器验收运行时；CI 必跑的 `test:e2e:d1` 不需要账号、生产数据或密钥。

预览诊断只开放公开只读路由，不带生产鉴权密钥；测试核验数据库错误与 missing-meta 均为 0，已知详情必须真实执行 SQL，避免静态 fallback 假通过。检查 SQL 预算包含旧查询及缺失索引的负向对照。生产正常请求不暴露诊断响应头，仅对单条 >1,000 行读取记录查询名和计数。

验收覆盖本次事故涉及的公开插件读取路径；离线生成仍需遍历目录，管理查询和未来新功能仍须各自检查执行计划。账单及 7 天 Insights 有历史窗口，不能把刚发布后的累计读数当成修复后的读速率。
