# dshfind SEO 完整方案

> 制定于 2026-08-22。基于对线上站点、sitemap、竞品 SERP、官方文档仓库的实测数据。
> 执行顺序按 P0→P4，P0/P1 与 P2 可并行。

## 0. 诊断结论（实测数据）

| 项 | 现状 |
| --- | --- |
| sitemap | 38,848 URL / 27.2MB 单文件，99.6% 是插件详情页 |
| 插件详情页独有内容 | 约 65 字符（一句 GitHub description），四语言完全雷同 |
| 有译文的插件 | 71 / 9,672（**0.73%**，Turso 实查，比 grep 初测更低） |
| 内链 | 目录页 SSR 仅 24 条详情链接；**详情页之间零内链** → 9,590+ 孤儿页 |
| 分类路由 | 无。9 个分类只是前端筛选参数 |
| 课程页 | 4,400–14,700 字符/页 × 38 篇 × 4 语言，**真资产但只占 sitemap 0.4%** |
| `/learn` 结构化数据 | 空 |
| SERP | "DSH plugins directory" 首页 20+ 个 EMD 竞品，dshfind 未上榜；流量来自社区（徽章/X/nodeseek）而非搜索 |

**战略判断：不在"插件目录"词上与 20 个 EMD 站硬拼。护城河 = 课程 + 官方文档翻译 + 插件目录三者的交叉引用网——竞品没有任何一家同时拥有三样。**

## 1. P0 · 内链止血（1–2 天，纯前端）

孤儿页问题的修复，也是后面一切内容工程的地基。

### 1.1 分类/标签/语言聚合页
- 新路由：
  - `/[locale]/plugins/c/[category]` — 9 个分类（agent/channel/client/fun/memory/resource/skin/tools/ui）
  - `/[locale]/plugins/t/[tag]` — 只收插件数 ≥ 5 的标签，避免薄页；预估 40–80 个
  - `/[locale]/plugins/lang/[language]` — TypeScript/JavaScript/Python/Go 等
- 每页 SSR 渲染全部所属插件的 `<a>` 链接（纯 HTML 列表，不走客户端加载），配 1–2 段该分类的介绍文案。
- metadata：独立 title/description（"DSH memory 插件大全 · N 款"），`pageAlternates` 四语言 hreflang，`ItemList` JSON-LD。
- 数据源用现成的 `realPlugins` 静态快照 + `generateStaticParams` 全量预渲染 → 产物进 assets，不增 Worker 体积。
- 目录页 `/plugins` 与首页页脚挂全部分类页入口；详情页的分类徽标改成指向分类页的链接。

### 1.2 详情页"相关插件"
- 同分类 + 共享标签加权取 6–12 条，SSR 输出。
- 排序保证确定性（按 score/stars），避免每次 ISR 重验证都换一批导致链接图抖动。

### 1.3 面包屑
- 详情页：超市 → 分类 → 插件，配 `BreadcrumbList` JSON-LD。

**验收**：任意详情页从首页 ≤3 跳可达；`curl` 目录/分类页可数出全量 `<a href>`。

## 2. P1 · 插件页增厚（2–4 天，含一次批量翻译）

### 2.1 批量补译 9,672 条 description（治本方案）
- 用现有管线：Turso `plugin_i18n` 表 + `scripts/set-plugin-i18n.mjs` + `pnpm gen:plugins`。
- Haiku 级模型翻译单句 description → zh/ja/ko，预估成本 $10–20。
- **体积约束**：全量译文进 `plugin-i18n.ts` 会让 gzip 从 0.17MB 涨到约 1.75MB（Worker 现用 4.15/10MB）。撑得住但不优雅——**首选改为详情页 ISR 渲染时从 Turso 取译文**，构建快照只保留 top 插件的译文兜底。
- 译完后四语言页面的 title/description/正文首段真正分化，3.7 万个重复页变成真内容页。

### 2.2 评分理由上页（差异化王牌）
- `score-plugins` 已产出 S/A/B/C 评分；把**评分维度与理由**渲染进详情页（工程规范/活跃度/文档质量各一句）。
- 全网独一份原创内容，正好回答"这插件靠不靠谱"的真实搜索意图。理由文案也过一遍 i18n 管线。

### 2.3 README 结构化抽取（可后置）
- 每日同步时抽取：安装命令、功能列表（前 N 条）、依赖要求。存 Turso，ISR 渲染。
- **不整篇转载**（与 GitHub 重复），只做结构化摘录 + "查看完整 README" 外链。
- ⚠️ 严禁进构建快照：9,672 × 1KB ≈ 9.7MB，会打爆 Worker。
- 首图部分已单独落地并跑完实测，见 §2.4。

### 2.4 插件配图（管线已就绪，见 §7.5）

竞品参考的结论是反的：dsh-market 的"图文并茂"只存在于**皮肤（18 个）和宠物（2 个）**——那两类天生就是图像，且人工策展得过来。它的 `manifest/plugins.json` 39 条里**没有任何图片字段**。所以没有可照搬的路径，但也说明这块是空位。

**2026-08-23 全量实测（9,672 个仓库，`plugin_images` 表）：26.6% 有可用图。**
平均数没有意义，分层才是真相：

| star 区间 | 仓库数 | 有图 | 有图率 |
|---|---:|---:|---:|
| ≥ 100 | 103 | 88 | **85.4%** |
| 20–99 | 219 | 146 | 66.7% |
| 5–19 | 864 | 484 | 56.0% |
| 1–4 | 3,922 | 1,256 | 32.0% |
| 0 | 4,564 | 601 | **13.2%** |

图源构成 **README 2,535 / GitHub 自定义社交预览图 40**。社交图只占 1.6%，说明要提覆盖率，投入应继续放在 README 解析上，那条线不用管。

产物体积实测（60 张样本）：缩略图均 10KB、大图均 46KB。2,575 张合计约 **144MB**，R2 出网免费，成本可忽略。

**决定：抽取全做，显示分层。** 两者标准不同——抽取一次 144MB / 半小时，现在做和只做头部几乎没有成本差；只抽头部的话，以后想给某个 hub 补图就得重跑探测+抽取。而"只给头部上图"该落在**显示**侧，且不该是一个全局 star 阈值：同一个阈值在不同页面上效果天差地别（首页/榜单填充率 73–85%，`/plugins/all/[page]` 靠后的页只有 13%）。规则是「有图就显示、没有就留白」＋「图少的页面干脆不开图片模式」。

⚠️ 上前端时的硬约束：`/plugins` 首屏 SSR 100 条，每条一张缩略图 = 1MB+，必须 `loading="lazy"` ＋ **外层固定 `aspect-ratio` 盒子**，否则 100 张图陆续到达会把 CLS 打爆。**没图的插件不要塞占位图**——那会稀释「有图 = 有内容」的信号，整个列表看起来像批量生成的。

## 3. P2 · 官方文档中心（核心新支柱，2–4 周）

### 3.1 机会盘点（2026-08-22 实测 deepseek-ai/deepseek-harness@HEAD）

| 板块 | 独立主题数 | 官网是否发布 | 现有语言 |
| --- | --- | --- | --- |
| `user/`（入门/开发/指南） | ~20 | ✅ 已发布 | zh + en |
| `cordis-tutorial/` | ~12 | ✅ 已发布 | zh + en |
| `cordis-api/` | ~8 | 部分 | zh + en |
| **`subsystems/`** | **47** | **❌ 仅 GitHub blob** | ✅ zh + en + ja + ko（已完成）|
| `cookbook/` | **9**（上游实际） | ❌ 仅 GitHub blob | ✅ zh + en + ja + ko（已完成）|
| `postmortem/` | **5**（上游实际） | ❌ 仅 GitHub blob | ✅ zh + en + ja + ko（已完成）|

- 许可：整仓 **MIT**，docs 含在内。翻译/转载合法，须保留版权声明并注明来源。
- **官方 ja/ko 为零**。日韩开发者搜 "DeepSeek Harness プラグイン開発" / "DSH 플러그인 개발" 目前没有任何成体系结果。
- 约 109 主题 × 4 语言 ≈ **430 个新 URL**。

### 3.2 价值分层（决定翻译顺序）

1. **ja/ko 全量**（所有板块）——100% 全网独有，零重复风险。**最高优先。**
2. **subsystems/cookbook/postmortem 的 zh/en 网页化**——内容与 GitHub blob 重复，但 blob 无 hreflang、无站内导航、排名极弱；靠"注解 + 关联插件"做增值即可安全胜出。
3. 官网已发布页面的 zh/en —— **不做原样转载**（零价值 + 重复风险）。只在我们的注解版有实质增量时才发布，否则仅作为 ja/ko 的翻译源。

### 3.3 架构

- 路由：`/[locale]/docs/[section]/[slug]`（实际实现 5 个 section：guide/develop/subsystems/cookbook/postmortem；cordis-* 官方已发布网页版，按 §3.2 第 3 条不转载）。
- **内容存 Turso（新表 `docs_pages`），页面走 ISR**（`revalidate` 86400）。理由：
  - 全量四语言语料估计 raw 3–4MB / gzip 1MB+，不该进 Worker bundle（现 4.15/10MB）；
  - 重译/修订不需要重新部署，与 plugins-db 现有模式一致。
- 表结构：`(section, slug, locale, title, html, source_path, source_sha, content_hash, updated_at)`。
- 板块索引页 `/[locale]/docs` + 每 section 目录页，SSR 全量链接（同 P0 原则）。

### 3.4 同步与翻译管线

`scripts/sync-official-docs.mjs`：

1. 按 **pinned commit SHA** 拉取 `deepseek-ai/deepseek-harness` 的 docs 树（不追 HEAD，人工升版）;
2. 逐文件 `content_hash` 比对，只重译变更文件；
3. 翻译走模型 API——文档用 Sonnet 级（质量是护城河，别省），带**术语表**（waterfall/coeffect/副作用回收/harness 等固定译法，四语言各一份）；
4. 写入 Turso，ISR 自然生效；
5. 成本估算：全量 ja + ko + 增补 ≈ 数百美元一次性，增量同步每月忽略不计。

### 3.5 合规与去重护栏

- 每页顶部固定声明栏：**"非官方翻译"** + 源文件链接（含 commit SHA）+ MIT 声明 + "以官方英文/中文版为准"。
- canonical 指向自身（翻译是独立内容，这样做是正确且安全的）。
- zh/en 网页化的 subsystems 页必须带增值模块才发布：**"实现了本子系统的插件"**（从目录按标签/关键词关联）、相关课程链接。

### 3.6 三角内链（真正的护城河）

```
docs/subsystems/compaction  ←→  /plugins/t/context-compaction 相关插件
        ↕                              ↕
/learn/core/06-senses-context 课程互相引用
```

每篇文档页挂关联插件；每个插件详情页挂关联文档；课程页引用文档页。20 个竞品目录站没有文档，散装博客没有目录——只有 dshfind 能织这张网。

## 4. P3 · 课程与长尾（持续）

- `/learn/*` 补 `Course`/`LearningResource` + `BreadcrumbList` JSON-LD（现在是空的）。
- 首页与插件详情页给 `/learn` 导流位。
- BBS SEO 文章（管线已就绪，sitemap 已支持每小时收录）：瞄准问句型长尾——"dsh 插件怎么写"、"cordis 是什么"、"dsh 和 claude code 区别"、"dsh プラグイン 作り方"。每篇文内链 2–3 个文档页 + 相关插件。
- 徽章推广运动：给未挂徽章的 top 500 插件仓库开 issue/PR 邀请（这是外链引擎，ROI 高于一切站内优化）。

## 5. P4 · 技术收尾

### 5.1 sitemap 拆分 ✅ 已完成（2026-08-22, commit a00e2fb）

`/sitemap.xml` 改为 sitemapindex + 18 个分片（pages/hubs/docs/all-index/threads + plugins-0..12），
插件每片 800 个 × 4 语言 = 3,200 条 URL、约 2.25MB。原始记录如下：
- 上次失败教训（2026-08-21）：**不能用 `generateSitemaps()`**——不产索引文件且会丢 `/sitemap.xml` 入口；必须手写 route handler 保住入口 URL。
- CF 构建失败疑因分片文件过大（7.4MB/片）；重试时每片 ≤800 插件（约 2.4MB），分片数无所谓。
- 新增分片：`sitemap-docs.xml`、`sitemap-learn.xml`、`sitemap-hubs.xml`（分类页）——小而稳定的分片让 Google 对高价值板块的抓取与索引状态单独可见。
- 涉及删文件的提交，push 后必查 `git show --stat`（上次 git add 静默失败导致线上 404 40 分钟）。

### 5.2 度量（每周看一次 GSC）
| 指标 | 基线（先记录） | 目标（3 个月） |
| --- | --- | --- |
| 已索引页数 / 已提交 | GSC 查 | 索引率 >50% |
| "已抓取-尚未编入索引" | GSC 查 | 持续下降 |
| 非品牌点击 | ~0 | 有意义的曲线 |
| ja/ko 展示次数 | ~0 | 文档中心上线后 4–6 周起量 |

- GSC 按 `/docs`、`/learn`、`/plugins` 分目录看 impressions——验证"文档是护城河"假设，不灵及时止损。

## 6. 明确不做

- ❌ 不在 "DSH plugin directory" 主词上堆资源与 EMD 站硬拼。
- ❌ 不整篇转载 README / 官方已发布 zh/en 文档原文。
- ❌ 不把文档语料 / README 摘录塞进 Worker bundle。
- ❌ 不动 robots.txt 的 AI 爬虫配置（训练爬虫已屏、检索爬虫已放行，是对的）。
- ❌ 未翻译前不给 ja/ko 重复页做任何"临时 noindex"骚操作——直接按 P1 补译，一步到位。

## 7. 已完成（2026-08-22）

P0 全部、P1（2% 抽样）、P2 全部已落地并通过构建验证。实测结果：

- 插件详情页站内可达率 **9,671 / 9,671 = 100%**（改造前约 80 个）
- 插件 i18n 覆盖 **0.73% → 2.68%**（259 个四语言齐全，既有人工文案未被覆盖）
- 官方文档中心 **12 篇 × 4 语言 = 48 行**，ja/ko 为全网独有
- 新增预渲染页 540 个（hub 536 + docs 索引 4），**无新增 ƒ 动态路由**，Worker 体积未超标
- sitemap **38,848 → 40,264 条 / 28.1MB**（Google 上限的 80.5%）

sitemap 拆分（原 P4-5.1）已随后完成，见 §5.1。

### 7.1 subsystems 47 篇（已完成）

官方 subsystems 只有 GitHub blob、没有网页版，因此 **zh/en/ja/ko 四语言全部可收录**（`isIndexable` 对 `publishedUpstream: false` 的 section 放行全部语言；guide/develop 仍只索引 ja/ko）。

- 文档中心 **12 → 59 篇主题**，四语言各 59 行，共 **236 行**（`docs_pages`）
- docs sitemap 分片 **28 → 216 条**：47×4（subsystems）+ 12×2（guide/develop 的 ja/ko）+ 4（/docs 索引）
- 站点总 URL **40,264 → 40,446**（构建产物实测；此前写的 40,452 是估算笔误）
- 译文里的 `<!-- BEGIN GENERATED cordis-surface -->` 代码块用 `<!-- KEEP-GENERATED -->` 占位、由 `apply-docs-translations.mjs` 从中文原文回填，省掉约 42% 的重复翻译量（632k → 366k 字符）
- `pnpm build`（清空 TURSO 变量）与 `pnpm cf:build` 均通过；最大分片 2.3MB，远低于 CF 的 25MiB 单资源上限

### 7.2 cookbook + postmortem（已完成）

上游实际篇目比原估的 22 少：cookbook 9 篇 + postmortem 5 篇 = **14 主题**，散文 61.9k 字符，且**都没有生成块**（不需要 KEEP-GENERATED 那套）。

- 文档中心 **59 → 73 主题**，四语言各 73 行，共 **292 行**
- docs sitemap 分片 **216 → 272 条**（+14×4，两个 section 均 `publishedUpstream: false`，四语言全收录）
- 站点总 URL **40,446 → 40,502**
- `assemble.mjs` 加了 `section` 字段与 KEEP-GENERATED 双向告警（源文没有生成块却带占位符也会报），避免再犯 subsystems/schedule 那次的错

### 7.3 CF build variables：核实后确认不需要

原列为「下一步第 1 项」，实测推翻。本地**清空 TURSO 变量**构建的分片，与线上（CF 同样无 build variables）逐个比对：

| 分片 | 本地无 DB | 线上 |
|---|---|---|
| pages / hubs / docs / all-index / plugins-* | 162 / 1188 / 216 / 196 / 3200 | 完全一致 |
| threads | 0 | 0 |

一条不差。原因是 docs 早已靠 `docs-manifest.ts` 构建期快照解耦，插件页有 `plugins-real.ts` 兜底。`threads` 为 0 与 TURSO 无关——论坛零帖子，且它走的是 `BACKEND_API_KEY` 那套后端变量。**加 TURSO build variables 不会改变任何产物，不必做。**

### 7.4 分享预览图 og:image（2026-08-22，代码就绪待部署）

此前**全站没有 og:image**：`layout.tsx` 只声明 `twitter.card: "summary"`，没有任何 `images`。而 §0 的诊断结论是"流量来自社区分享而非搜索"——也就是唯一在跑的渠道一直以裸链接形态呈现。

插件详情页（9,672 × 4 语言）改为直接引用 GitHub 给每个仓库出的 1200×630 PNG。仓库主传过 social preview 时返回的就是那张（往往是运行效果图），没传则 GitHub 合成一张。**零生成成本、Worker 体积零增长。**

三个易错点，见 `src/lib/og.ts` 的注释：
- URL 里的缓存键取 `pushedAt` 的日期部分。固定值会让社交平台永远缓存首次抓到的图，作者后来补传的效果图再也刷不出来。
- 必须同时给 `twitter.card: "summary_large_image"`。X 默认卡型是小方图，只给 `images` 不改 card，图会被压成缩略角标——这是最常见的白干。
- 风险插件（假冒仓库）**不给图**。那张图正是它冒充官方的门面，而分享卡片比页面正文先被看到，页面上的警示语来不及出场。

⚠️ **不能拿 `/api/card` 顶这个位置**：那条路由输出 `image/svg+xml`，社交平台一律不渲染 SVG 的 og:image。

文档页/课程页/首页没有对应仓库，仍无预览图。要给它们做"带标题的卡"，**只能构建期生成**：`next/og` 自带的字体只有 `Geist-Regular.ttf`（纯拉丁），中日韩标题会渲染成豆腐块；而任何 CJK 字体（22–53MB）都比整个 Worker 预算（10MB，现用 4.15）还大数倍。放到构建机的 Node 里跑就没这个限制，视觉结果一致、Worker 体积零增长。尚未动工。

### 7.5 插件配图抽取管线（2026-08-23，待 R2 凭据）

数据与决定见 §2.4。已落地：

| 文件 | 作用 |
|---|---|
| `scripts/lib/plugin-images.mjs` | 纯逻辑：徽章过滤、相对路径解析、候选打分。28 个单测 |
| `scripts/init-plugin-images-schema.mjs` | 建 `plugin_images` 表，幂等（`pnpm images:init`） |
| `scripts/extract-plugin-images.mjs` | README → 挑图 → 下载 → sharp 转两档 webp → R2 → 写库（`pnpm images:extract`） |

`sharp` / `@aws-sdk/client-s3` 是 devDependency，只在脚本里用，不进 Worker bundle。R2 桶 `dshfind-plugin-images` 已建（未加 wrangler binding——不走 Worker 代理，加了是多余绑定）。

两处不显然的设计：
- **徽章过滤是必需的，不是优化**：实测 README 的 530 条图片引用里 **41% 是徽章**。不过滤就取"第一张图"，卡片上会铺满绿色 `build passing` 小条。`.svg` 一律当徽章排除——徽章几乎清一色是 svg，剩下的多是 logo，当卡图同样糟。
- **尺寸闸门是第二道**：黑名单挡不住自建域名上的徽章。头部 60 个里拦下 4 个（`130×20`、`220×124`、`128×128`、`256×256`）。

途中修掉的一个静默 bug：`--probe-only` 会写 `probed_at`，于是接着跑真正的抽取时全部被判"还新鲜"而跳过——**什么都不做且不报错**。修法是让 `status='found'` 在非探测模式下无条件重取。

**剩余阻塞**：R2 的 S3 Access Key 只能在 dashboard 建（wrangler 的 OAuth 生成不了），需要 `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` 进 `.env.local`。另外 `img.dshfind.com` 自定义域未配——那会在生产 zone 上加 DNS 记录并把桶设为公开可读，留给人工决定。用 `wrangler r2 object put` 绕过 S3 凭据的路子实测 **3 秒一个对象**，9,000 个对象要开 9,000 个进程，已否决。

**下一步优先级**：
1. GSC 记基线，按 §5.2 的四个指标每周看
2. 配 R2 凭据 → 跑 `pnpm images:extract` → 详情页大图 → 列表缩略图（按 §2.4 的显示分层规则）
3. 官方文档中心已无剩余可收录存量（`publishedUpstream: false` 的三个 section 全部完工）。再要扩就得转向 §2.1 的插件批量补译，或 §4 的 BBS 长尾文与徽章推广

## 8. 排期总览

| 周 | 事项 |
| --- | --- |
| W1 | P0 全部（分类页/相关插件/面包屑）+ 记录 GSC 基线 |
| W1–W2 | P1 批量补译 + 评分理由上页；docs 管线开工 |
| W2–W4 | 文档中心 MVP：subsystems ja/ko/zh/en 47 篇先行（价值最高），后补 cookbook/user |
| W4+ | sitemap 拆分、README 抽取、BBS 长尾文、徽章推广、每周 GSC 复盘 |
