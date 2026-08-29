---
name: desktop-market
description: 维护发给 DSH 桌面端插件市场的安装契约（/market/v1/plugins）——探测插件的安装方式与 npm 最新版本、排查某个插件为什么在桌面端市场里装不了或装到旧版本、核对某个包是否满足桌面端 preview 的七项复核。
---

# DSH 桌面端插件市场契约

deepseek-harness-desktop 的社区市场把 dshfind 当**标准目录源**接进去，桌面端用户
在市场里点「安装」，装的就是我们发过去的包名和版本号。所以 `plugins` 表里那几列
不是展示字段，是**安装契约**——填错等于让用户装错东西，不填等于这个插件在市场里
根本不存在。

## 两个端点

| 端点 | 内容 |
|---|---|
| `GET https://api.dshfind.com/market/manifest.json` | 静态 manifest，内容恒定 |
| `GET https://api.dshfind.com/market/v1/plugins` | 契约分页，`?q=` `?category=` `?cursor=` `?limit=` |

实现在 `server/internal/httpapi/market.go`，schema 逐条对齐
`dsh-community-market/docs/catalog-provider-contract.md`（`additionalProperties: false`，
所以那边用的是独立白名单响应类型，**不要复用** `/v1/plugins` 的形状）。

一条 item 长这样，`package` + `latestVersion` 是能不能一键安装的分水岭：

```jsonc
{
  "id": "bowenliang123/dsh-context",
  "repository": { "url": "https://github.com/bowenliang123/dsh-context" },
  "package": { "registry": "npm", "name": "dsh-context" },  // 有它才装得了
  "latestVersion": "0.30.2"                                  // 桌面端照着它装
}
```

## 三道闸门

一个插件要在桌面端市场里可安装，得同时满足：

1. **`is_plugin = 1`** —— `p.IsPlugin == nil || !*p.IsPlugin` 的条目 market 端点直接跳过。
   未探测（NULL）也算不满足：契约端点不做猜测。所以**从没跑过 probe:install 的仓库
   一个都进不了市场**。
2. **`npm_desktop_installable = 1`** —— 探测侧预演了桌面端安装前的七项复核
   （`scripts/lib/install.mjs` `desktopPreviewVerdict`），全过才发安装证据。
3. **`npm_latest_version` 非空** —— 必须是精确稳定 semver（`x.y.z`），prerelease 与
   deprecated 一律不采信。

差一条就只剩 `repository`，桌面端只能引导用户去 GitHub 自己装。

## 七项复核（desktopPreviewVerdict）

**桌面端复核在 v2.0.3（2026-08-26 发布，提交 `7ec8213e`）大幅简化**：
`createNpmRegistryVerifier` 现在只验包名合法、npm `latest` 精确稳定版本、名称一致、
`dsh.bundle.patch` 安全——repository 比对、deprecated、生命周期脚本、运行时 range、
`engines.node`、dist 完整性**全部删掉**了。

但 v2.0.1/v2.0.2 的存量客户端还在跑老版全量复核，所以我们的
`desktopPreviewVerdict` 按**新旧两代的交集**发证据（即保留全部七条，只把第 4 条的
monorepo 处理改聪明了）。等 v2.0.1/v2.0.2 存量消失后，2/3/6/7 可以整体放宽。

| # | 复核 | 现状 | 不过的典型原因 |
|---|---|---|---|
| 1 | `name` / `version` 存在且是非空字符串 | 两代都要 | 几乎不会踩 |
| 2 | 无 `deprecated` 字段 | 仅旧版 | 作者废弃了旧包名 |
| 3 | 无 `preinstall` / `install` / `postinstall` / `prepare` 生命周期脚本 | 仅旧版 | **最常见**：留了 `prepare: husky` |
| 4 | `repository` 剥掉 `git+` 后是 `https://` 且回链到本仓库；monorepo 子包的 `directory` 合规即放行（见下） | 仅旧版 | scp 式 `git@github.com:` 直接拒；`directory: "."` 仍拒 |
| 5 | `dsh.bundle.patch` 存在且是安全相对路径 | 两代都要 | 不是组合包，或写了 `../` 逃逸 |
| 6 | `cordis` 不能出现（legacy）；`@deepseek-ai/cordis` 与 `@deepseek-ai/dsh*` 的 range 要覆盖桌面端运行时 | 仅旧版 | 锁死了老版本 range |
| 7 | `engines.node` 覆盖桌面端 Node；`dist.integrity` 是 sha512、`dist.tarball` 是官方源无凭据 | 仅旧版 | `engines.node: "20.x"` 把自己挡在外面 |

### monorepo 子包（repository.directory / subdirectory）

manifest 带 `repository.directory` 的 npm 包（monorepo 子包）不再一票否决：

- `directory` 能过 `catalogSubdirectory`（`scripts/lib/install.mjs`，逐字镜像桌面端
  `contracts/identity.ts` `normalizeSubdirectory` + wire schema）→ 放行，探测把它写进
  `npm_repo_directory` 列，契约条目随安装证据发 `repository.subdirectory`
  （`market.go` / `gen-api-artifacts.mjs`，两侧逐字节对齐）。v2.0.1/v2.0.2 的旧复核
  要求「manifest directory ↔ 目录 subdirectory 相等」，发出去正好两代通吃。
- 不合规（最常见是发布工具写的 `directory: "."`，2026-08-28 全库 9 个带 directory
  的被挡包里占 6 个）→ 继续拒：那个值我们发不出去——桌面端
  `normalizeRepositoryIdentity` 对不合规 subdirectory **抛异常且整页拒收**，
  发错一个值等于把整个 dshfind 源在桌面端搞挂。这也是改这条链路时最大的稳定性红线。
- schema 从 v2.0.1（dshfind 源首次出现的版本）起就认 `repository.subdirectory`，
  发这个字段对所有能浏览我们目录的桌面端版本都是 wire 安全的。

### 运行时常量：值冻结于 v2.0.2，HEAD 上已经没有了

第 6 条依赖的三个常量在 `scripts/lib/install.mjs` 顶部。桌面端 v2.0.3 把它们
**连同整段复核一起删了**——对 HEAD `grep RUNTIME_VERSION` 会查空，别被误导。
现在的抄本对齐的是最后一个还执行该复核的版本：

```sh
# v2.0.2（最后一个带运行时复核的版本）里的原值
curl -s https://raw.githubusercontent.com/anywhere-labs/deepseek-harness-desktop/v2.0.2/\
dsh-community-market/src/install/service.ts | grep RUNTIME_VERSION
```

这三个值不会再漂（v2.0.2 已定格）；整段第 6/7 条什么时候删，取决于
v2.0.1/v2.0.2 存量客户端何时可以忽略。

历史事故记录（2026-08-25，当时 HEAD 还带复核）：我们停在 `0.1.0-rc.7`，桌面端已是
`0.1.1-rc.2`，生态普遍升到 `^0.1.0-rc.8`，`satisfies` 全线为 false，★2778 的
`DSH-better-sidebar`（全站第 3）14 个依赖集体误判、掉出一键安装。改复核规则后必须
**联网重探**，`--rederive` 不行（复核要的 npm 版本文档没有入库）：

```sh
pnpm probe:install --all --npm-bundles   # 只重探已发 npm 的组合包，受影响的只有这批
```

一眼自查：头部插件里若成片出现 `runtime-range:@deepseek-ai/dsh-*`，先怀疑常量，
而不是怀疑几十个作者同时写错了范围。

## 日常维护

```sh
# 头部全量重探（一百多个仓库，一两分钟）——pnpm refresh 已经内置这一步
pnpm probe:install --all --min-stars 100

# 全库补探：从没探过的仓库进不了市场，新收录的批次要补
pnpm probe:install                    # 默认只探没探过 / 超 7 天没探的
pnpm probe:install --stale-days 3     # 头部发版快，缩短新鲜度阈值

# 排查单个插件（不写库），会打印契约变化
pnpm probe:install --only owner/repo --dry-run

# 改了桌面端运行时常量后，定向重探可能受影响的行（已发 npm 的组合包，约 2200 个）
pnpm probe:install --all --npm-bundles

# 改了推导规则后离线重算，不联网（注意：不会重算桌面端复核结论）
pnpm probe:install --rederive
pnpm test
```

给作者的答复模板：`--only <仓库> --dry-run` 拿到结论，再照「七项复核」那张表说明是哪一条不过。
最常见的三条是**生命周期脚本**、**scp 式 `git@` repository**、**最新版是预发布**。

跑完看这段输出，它就是这轮契约变了什么：

```
桌面端市场契约变化：
  + 6 个开始可一键安装
  - 2 个不再可一键安装（包被撤、版本转预发布或复核不过）
  ↑ 15 个的安装版本更新
      bowenliang123/dsh-context: 0.15.0 → 0.30.2
```

## 三条不能忘的规矩

1. **版本号必须勤探。** `npm_latest_version` 是发给桌面端的**精确 revision**，桌面端照着装。
   头部插件一周能发十几个版本（实测 `dsh-context` 五天走了 0.15.0 → 0.30.2，
   `dsh-im` 走了 0.11.0 → 2.1.0）。这一列放着不动，市场里的人就一直在装几周前的旧版。
2. **抓不到 ≠ 没有。** 429 / 5xx / 超时一律判 `unknown`，事实沿用上一轮、探测时间不刷新，
   下轮立刻重探（`fetchOutcome` / `mergeManifestProbe` / `mergeNpmProbe`）。
   只有 404 / 410 才是「确认不存在」。这条线不守住，一次限流就能把一个正常插件
   从市场里除名，而且下一轮还会把这个错误结论当既成事实留着。
   跑完那句「⚠️ N 个仓库这轮没问全」就是这个机制在工作，不是错误。
3. **包名归属必须回链。** 全库两千多个「已发布」里有一千多个的包名在 npm 上属于别人。
   回链不通过就不发安装证据——否则桌面端会去装一个陌生人的包。

全库一轮要跑几小时，脚本按 400 行一片探完就写库（`SLICE`），中途被打断只损失当前这片，
已完成的部分连探测时间一起落库，下轮 stale 自然跳过。别改回「攒到最后一把写」——
踩过一次：跑到 6700/10923 卡住，整轮一行都没落库。

## 页面侧

详情页的安装命令与版本号来自同一批列，但**版本号的口径和契约一致、和仓库不一致**：

- `pkgVersion` = 仓库 package.json 的版本（作者可能已提交但没发布）
- `installVersion` = 这条命令实际会装到的版本，npm 装法取 `npm_latest_version`
  （见 `src/lib/install.ts` `installVersionOf`）

两者经常差一截（`dsh-context` 仓库里是 0.30.3，npm 上是 0.30.2）。页面标的是后者。

构建期预渲染的头部 24 个详情页读不到 Turso，走 `realPlugins` 静态快照兜底，
所以安装方式也写进了快照（`gen-plugins-real.mjs` 的 `installOf`）。
插件超市列表用不上它，`staticFallback()` 会剥掉，别让几千条命令进懒加载响应体。

## 相关

- 下载量口径：`.claude/skills/track-downloads/SKILL.md`
- 整轮数据刷新：`.claude/skills/refresh-site/SKILL.md`
