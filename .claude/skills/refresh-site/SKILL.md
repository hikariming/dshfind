---
name: refresh-site
description: 跑一整轮站点数据刷新并上线：GitHub 同步（新插件/star）→ 头部插件下载量 → 静态快照（首页三条 rail、插件库、排名）→ 构建验证 → 只提交生成物 → 推送触发 Cloudflare 部署。用于「好几天没更新了，把数据刷一遍」，也用于排查某一步为什么没生效。
---

# 站点数据刷新

一条命令：`pnpm refresh`（脚本 `scripts/refresh-site.mjs`）。四步串起来，任一步失败即中止，
工作区不会留下半截状态。

```sh
pnpm refresh                      # 同步 + 下载量 + 重生成 + 构建 + 提交（不推）
pnpm refresh --push               # 再加一步 push origin main（= 上生产）
pnpm refresh --dry-run            # 只打印将要执行的步骤
pnpm refresh --with-contributors  # 连贡献者数一起同步（约 3 小时）
pnpm refresh --skip-sync          # GitHub 那步刚跑过，只想重生成静态数据
pnpm refresh --min-stars 200      # 下载量探测的 star 门槛（默认 100）
```

## 四步各自在做什么

| 步骤 | 命令 | 产出 | 耗时 |
|---|---|---|---|
| 1 同步 | `sync-plugins-db.mjs --skip-contributors` | Turso：新仓库、star、每日快照 | 5-10 分钟 |
| 2 下载量 | `probe-downloads.mjs --min-stars 100 --include-offtopic` | Turso：`dl_*` 五列（增量，只探没探过或超 7 天的） | 1-5 分钟 |
| 3 重生成 | `pnpm gen:data` | `plugins-real.ts` / `home-picks.ts`（**首页三条 rail**）/ `ranking-real.ts` / `plugin-i18n.ts` / 文档课程清单 | 1 分钟 |
| 4 构建 | `pnpm build` | 验证；顺带确认详情页仍是 SSG 而不是 ƒ | 2-4 分钟 |

首页的「编辑推荐 / 本周飙升 / 新面孔」全部来自第 3 步的 `home-picks.ts`——**不跑第 3 步，首页就不会换人**。
脚本跑完会打印这三条 rail 的进出名单，一眼能看出首页变了谁。

## 三个容易踩的坑（脚本已经处理，但要知道为什么）

1. **只提交生成物，不要 `git add -A`。** 工作区经常有在途的功能代码（未提交的新模块），
   一把梭会把没验证过的东西推上生产；更糟的是漏掉它依赖的未跟踪文件，线上构建直接
   module not found。脚本里的 `GENERATED` 白名单只有 6 个文件。
2. **push 必须推 `origin`。** 本仓库有两个远端：`origin` = `hikariming/dshfind`（驱动生产），
   `dsh-external` = 镜像仓。推错的结果是「以为部署了，其实生产纹丝不动」。
   脚本把远端写死成 origin。
3. **贡献者数默认跳过。** 它要逐仓库打 core API（限额 5000/时），一万多个仓库要跨 3 个
   限额窗口、约 3 小时。跳过时沿用上一轮的值（upsert 里是 `COALESCE`）。
   想补就 `--with-contributors`，建议单独挂后台跑。

## 上线与验证

推送后 Cloudflare Workers Builds 自动构建，**约 6 分钟**生效。验证：

```sh
curl -s "https://dshfind.com/api/badge/omdsh-dev/DSH-better-sidebar?metric=downloads" | grep -o 'aria-label="[^"]*"'
curl -s "https://dshfind.com/zh/plugins/omdsh-dev/DSH-better-sidebar" | grep -o '下载量.\{0,40\}'
```

看响应头 `x-nextjs-prerender` 能区分两类页面：`1,1` 是构建期预渲染的头部 24 个，
`1` 是按需渲染的其余一万多个。两类的数据来源不同——见下。

## 数据为什么可能「看起来没更新」

按可能性排序：

1. **第 3 步没跑**：数据在 Turso 里是新的，但首页/插件库读的是构建期快照。`pnpm refresh` 一定会跑。
2. **推错远端**（见坑 2）：commit 有了、生产没动。
3. **ISR 缓存**：详情页 24h 缓存（`revalidate = 86400`），改动要等过期或重新部署。
4. **构建期读不到 Turso**：Workers Builds 的构建环境没有 Turso 凭据，预渲染的 24 个头部页会落到
   `realPlugins` 静态兜底。所以凡是要在头部页显示的字段，都必须进构建期快照——
   下载量已经进了（`gen-plugins-real.mjs` 里的 `downloadsOf`），**贡献者数还没有**，
   那一栏在头部页恒显示 `-`。要修就照下载量的样子把它也写进快照。

## 相关

- 下载量的采集口径与档位：`.claude/skills/track-downloads/SKILL.md`
- 评分批次：`.claude/skills/score-plugins/SKILL.md`（评分不在本流程里，需要单独跑）
