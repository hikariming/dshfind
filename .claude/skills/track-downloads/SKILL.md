---
name: track-downloads
description: 采集头部 DSH 插件的累计下载量（npm + npmmirror 镜像 + GitHub Release 三渠道）写入 Turso。用于定期刷新下载数据、按 star 阈值扩大覆盖、排查某个仓库为什么没有下载数，或在做下载量徽章/排序前确认数据口径。
---

# 插件下载量采集

一轮采集 = `pnpm probe:downloads`，把**累计下载量**分三个渠道写进 Turso `plugins` 表。
取数规则在 `scripts/lib/downloads.mjs`（纯函数，有测试），抓取与入库在 `scripts/probe-downloads.mjs`。

## 口径（先看这段，改之前必须理解）

| 字段 | 含义 | 来源 |
|---|---|---|
| `dl_pkg` | 归属校验**通过**的 npm 包名，没通过就是 NULL | 仓库根 package.json + npm registry |
| `dl_npm_total` | npm 官方生命周期累计 | `api.npmjs.org/downloads/point/<区间>/<包>` |
| `dl_mirror_total` | npmmirror（淘宝镜像）累计 | `registry.npmmirror.com` 同路径 |
| `dl_release_total` | 该仓库所有 Release 资产 `download_count` 合计 | GitHub API |
| `dl_status` | `npm` / `npm+release` / `release` / `name-taken` / `unpublished` / `none` | 推导 |
| `dl_note` | 占名说明，如 `name-taken:aegis→killdream/aegis` | 推导 |
| `dl_probed_at` | 本轮探测时间，增量与新鲜度都看它 | — |
| `dl_manual_total` | **运营手工填的全渠道总数，优先级最高**，探测永不覆盖 | 人工 |
| `dl_manual_note` | 手工数的出处，前台挂进 tooltip | 人工 |

```sh
# 官网自建分发这类我们测不到的渠道，用手工数覆盖
node --env-file=.env.local scripts/flag-plugin.mjs owner/repo \
  --downloads=200000 --downloads-note="官网统计 20 万"
node --env-file=.env.local scripts/flag-plugin.mjs owner/repo --downloads=auto   # 撤回
```

手工数**必须带出处**：那是一个我们没有量过的数字，前台会标成「全渠道累计（含官网，运营核实）」
并把出处挂 tooltip，不能让读者以为是我们测的。已用于 `anywhere-labs/deepseek-harness-desktop`
（官网 20 万，GitHub Release 只有 4 万——只报 4 万等于把人家的量说少了五分之四）。

四条不能忘的规矩：

1. **只有累计值，没有周/日**。累计值单调、一次请求拿全，不需要日快照差分，一周跑一次够。
   代价是对新插件不利（发得早的天然高）——做徽章无所谓，若要做「下载量榜」排序得另补近 30 天口径。
2. **三个渠道分开存，不要合并成一个数**。npm 的一次下载是「装了一个包」，Release 的一次下载是
   「下了个安装包」。实测 PicGo 的 171 万、open-design 的 79 万全来自 Release 资产，
   混加会让桌面应用碾压所有真插件。合并口径留给展示层自己定。
3. **包名归属必须校验**。全库 2,531 个「已发布」里 1,072 个的包名在 npm 上属于别人
   （`voyager→wieden-kennedy`、`aegis→killdream`、`ruflo→claude-flow`）。回链不等于本仓库
   一律不采信，事实记进 `dl_note`。绝不能把陌生人的下载量安在作者头上。
4. **两家 registry 的区间上限不一样**：npm 18 个月，npmmirror **只有 12 个月**（超了 422）。
   分窗长度按 host 取，见 `maxPointMonths()`。踩过一次：按 18 个月一刀切，
   所有存在超过一年的包在镜像侧整段失败，PicGo-Core 的 3.1 万镜像下载凭空消失。

## 流程

```sh
# 1. 想让 star 门槛准确就先同步（可选，star 变动不大时可跳过）
pnpm sync:db --skip-contributors

# 2. 采集（默认 star≥500、排除蹭热度仓、只探超过 7 天没探的）
pnpm probe:downloads
pnpm probe:downloads --include-offtopic    # 蹭热度仓也要数字时补一轮
pnpm probe:downloads --min-stars 200       # 扩大覆盖，每仓约 3-5 个请求
pnpm probe:downloads --all                 # 无视新鲜度全部重探（改了取数规则后跑）
pnpm probe:downloads --only owner/repo --dry-run   # 排查单个仓库，不写库

# 3. 规则改动后先跑测试
pnpm test
```

前台目前**尚未接入**这几列（下载量徽章待做）。做展示时直接读 `plugins.dl_*`，
不需要新表；静态数据侧要露出的话在 `scripts/gen-plugins-real.mjs` 里补字段。

## 看汇报时关注什么

- **`name-taken` 名单**：这是运营线索。作者要么该改包名，要么该在 README 澄清，
  高星仓（ruflo ★68.8k、voyager ★19.8k）值得单独找作者。
- **「累计从 X 掉到 Y」告警**：累计值只应该涨。掉了意味着包被 unpublish、Release 资产被删，
  或接口抽风——先用 `--only <仓库> --dry-run` 复现再判断。
- **「N 个网络失败，未写库」**：设计如此，失败的仓库保持原值等下轮 stale 重探，
  绝不把网络抖动写成「下载量归零」。连续几轮都失败才需要人工看。
- **`none` 的比例**：纯 skills/prompt 仓、索引站、没有 Release 的 GUI 项目天然拿不到数字，
  不是 bug。star≥500 里有 21 个属于这种。

## 覆盖现状（2026-08-24 首轮，star≥500 全 81 个仓库）

| 状态 | 数量 | 说明 |
|---|---|---|
| `npm` / `npm+release` | 16 | 可比性最好，镜像普遍占 npm 的 35%~50% |
| `release` | 36 | 只有安装包下载数，含桌面端与非插件类大仓 |
| `name-taken` | 2 | 另有 6 个占名仓因为有 Release 数据被记成 `release`，看 `dl_note` |
| `unpublished` | 6 | 有 package.json 但没发 npm |
| `none` | 21 | 三个渠道都没有 |

npm 渠道头部（npm+镜像）：dshmarket 26.1 万、DSH-better-sidebar 18.1 万、modlens 16.0 万、
dsh-vision-router 5.4 万、dsh-TUI 4.5 万、dsh-vision-toolkit 4.1 万。

star≥500 天然避开了低星包的刷量问题——探周下载时发现过 `dsh-vault`（★3、4 天发 142 个版本、
周下载 8,142）这类发版循环造出来的数字。门槛降到 200 以下时要重新警惕这件事。
