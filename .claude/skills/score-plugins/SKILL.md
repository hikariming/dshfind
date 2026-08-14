---
name: score-plugins
description: 对 DSH 插件生态跑一轮综合评分（0-100 + S/A/B/C）。流程：同步 Turso → 采集证据 → AI 按量表评工程规范 → 合成入库 → 重生成静态数据并推送。用于批量评新插件、按 star 阈值扩大覆盖或定期重评。
---

# DSH 插件综合评分

一轮评分 = **硬指标程序算 + 工程规范 AI 评**，最终 0-100 分与 S/A/B/C 等级
写入 Turso `plugins.score / score_detail / scored_at`，前台徽标与筛选自动生效。

## 总分结构（算法在 scripts/lib/scoring.mjs，权重随生态年龄 0→90 天自动过渡）

| 维度 | 早期权重 | 成熟权重 | 谁算 |
|---|---|---|---|
| 活跃度（push 新鲜度/commit 密度/issue 响应） | 25 | 45 | 程序 |
| Star 热度（早期看增速，成熟看存量+持续性） | 30 | 30 | 程序 |
| 工程规范（manifest/发布/文档/DSH 集成度） | 25 | 15 | **AI 评审** |
| 维护者靠谱度（账号年龄/既往作品/内测/协作） | 20 | 10 | 程序 |

刷量守卫：star 增速高但 commit 与 issue 几乎为零 → 程序自动砍半并标 ⚠️；AI 也可判 `suspicious`。
`archived` 总分 ×0.3。运营钦定分在 `scripts/apply-scores.mjs` 顶部 `PINNED`
（如 deepseek-ai/deepseek-harness = 100，重评不覆盖）。

## 流程

```sh
# 1. 先同步，保证 star/描述是最新的
pnpm sync:db

# 2. 选批次：查未评分名单（阈值按需调，历史批次：featured 全量 → star≥20 → star≥8 → star≥4）
node --env-file=.env.local --input-type=module -e "…SELECT full_name FROM plugins
  WHERE is_present=1 AND is_offtopic=0 AND score IS NULL AND stars >= <N> ORDER BY stars DESC…"

# 3. 采集证据（每仓约 7 个 GitHub/npm 请求；量大时分片并行跑多个实例）
node --env-file=.env.local scripts/collect-score-evidence.mjs <evidence.json> owner/repo …

# 4. AI 评审（见下方量表）→ 产出 verdicts.json：
#    { "owner/repo": { "manifest": 0-8, "release": 0-4, "docs": 0-6,
#                      "dshIntegration": 0-7, "suspicious": bool, "comment": "一句话点评" } }
#    批量时按 evidence 分片派 subagent 并行评，各自返回 JSON 后合并。

# 5. 合成入库
node --env-file=.env.local scripts/apply-scores.mjs <evidence.json> <verdicts.json>

# 6. 前台生效：重生成静态数据 → 构建验证 → 提交推送（Vercel 自动部署）
pnpm gen:plugins && pnpm build
git add src/lib/plugins-real.ts && git commit && git push origin main
```

## AI 评审量表（工程规范 25 分制）

**manifest 0-8** —— 是否是真正可安装的 DSH 插件包
- 8：npm 规范包 + `dsh` 字段 + 真实 `@deepseek-ai/dsh-*` 依赖
- 6：有 `dsh.bundle`/清单、可 `dsh plugin add` 安装（private 或仅 git 装扣一点）
- 4：有 package.json 但非插件形态（桌面壳/发行版/上游仓）
- 2：纯清单/文档/技能目录仓，无打包
- 0：无 package.json 且无任何工程载体

**release 0-4** —— 发布纪律
- 4：npm 多版本 + git tag/Release（或桌面应用有安装包产物）
- 3：npm 已发或 Release 产物齐全（二选一）
- 2：只有 git tag
- 1：什么都没有，永远 main 裸奔

**docs 0-6** —— 文档诚意
- 6：README 有安装步骤 + 截图/演示 + 双语或多语；LICENSE 齐
- 5：内容完整但缺其一（常见：缺 LICENSE）
- 4：能看懂但单薄
- 0-2：空 README 或几行了事

**dshIntegration 0-7** —— DSH 真实集成度（早期最值钱的信号，也是蹭热度探测器）
- 7：纯 DSH 插件，深用槽位/工具/服务/预设等机制
- 5-6：DSH 生态专属但形态外围（桌面壳、发行版、目录仓、教程）
- 3-4：通用工具/上游仓，DSH 集成放在配套仓或只是目标之一
- 1-2：与 DSH 无实际集成（**≤2 分的写进报告，作为蹭热度候选交运营裁决**）

**校准锚点**（对齐历史批次）：dsh-TUI=8/4/6/7；awesome 类目录仓≈2/1/5-6/5-6；
桌面壳≈3-4/2-3/5/5；colleague-skill（通用技能）=1/2/5/2。

## 运营惯例

- 新精选（`--featured=1`）的插件要顺手补中英日韩四语文案——写 Turso（即时生效）：
  `node --env-file=.env.local scripts/set-plugin-i18n.mjs <owner/repo> --locale=zh --description="…"`
  （或 --from-json 批量；详情富文案用 --intro / --highlights / --install-cmd）。
  `src/lib/plugin-i18n.ts` 是生成物请勿手改，跑 `pnpm gen:plugins` 从库刷新。
- 评审发现的异常（README 缺失、内测保密声明未删、借用官方 scope 命名、疑似刷量）写进汇报。
- 每批做完在提交信息里记录累计覆盖数；star≤3 长尾不评，靠活跃度衰减自然区分。
