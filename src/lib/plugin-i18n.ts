import type { Locale } from "@/i18n/config";

/**
 * 热门/精选插件描述的人工多语言翻译。
 * 插件描述来自 GitHub 原文（中英混杂），这里按 fullName 覆盖；
 * 某语言没翻译或插件不在表里时回退 GitHub 原文。
 * 维护口径：新精选一个插件（flag-plugin.mjs --featured=1）就顺手来这里补四语。
 */
const descriptions: Record<string, Partial<Record<Locale, string>>> = {
  "deepseek-ai/deepseek-harness": {
    zh: "DeepSeek Harness：万物皆插件。",
    ja: "DeepSeek Harness：すべてはプラグイン。",
    ko: "DeepSeek Harness: 모든 것이 플러그인.",
  },
  "zhu1090093659/dsh-web-ui": {
    zh: "DSH Web UI 插件与皮肤合集——任务看板、Git 图谱、右侧面板、远程移动端 UI、桌宠、实时 token 统计与皮肤中心。",
    ja: "DSH Web UI のプラグイン＆スキン集——タスクボード、Git グラフ、右サイドパネル、モバイル遠隔 UI、ペット、リアルタイム token 統計、スキンセンター。",
    ko: "DSH Web UI 플러그인·스킨 모음 — 작업 보드, Git 그래프, 오른쪽 패널, 원격 모바일 UI, 펫, 실시간 token 통계, 스킨 센터.",
  },
  "ccch1mneyyy/dsh-TUI": {
    en: "Fills the gap of an official DSH terminal TUI — a Claude Code-style full-screen interactive terminal plugin for CLI lovers: pixel-whale top bar, live status line, streaming thoughts, double-Esc rollback, context progress bar + TPS gauge. One npm command to install.",
    ja: "DSH 公式にまだない端末 TUI を埋める一作。CLI 派に贈る Claude Code 風フルスクリーン対話端末プラグイン——ピクセルクジラのトップバー、リアルタイム状態行、思考のストリーム表示、Esc 二連打で巻き戻し、コンテキスト進捗バー + TPS メーター。npm 一発インストール。",
    ko: "DSH 공식 터미널 TUI의 공백을 메우는 플러그인. CLI 애호가를 위한 Claude Code 스타일 전체 화면 인터랙티브 터미널 — 픽셀 고래 상단 바, 실시간 상태 줄, 사고 스트리밍, Esc 두 번으로 롤백, 컨텍스트 진행 바 + TPS 게이지. npm 한 줄로 설치.",
  },
  "omdsh-dev/DSH-better-sidebar": {
    en: "A complete workbench inside the sidebar: third-party extensions can register new tabs; file rendering & editing, terminal, Git, and subagents built in.",
    ja: "サイドバーに収まるフル装備のワークベンチ。サードパーティ拡張が新しいタブを登録でき、ファイル表示・編集／ターミナル／Git／サブエージェントを内蔵。",
    ko: "사이드바 하나에 담긴 완전한 워크벤치. 서드파티 확장이 새 탭을 등록할 수 있으며 파일 렌더링·편집/터미널/Git/서브에이전트 내장.",
  },
  "Anionex/dsh-vision-toolkit": {
    zh: "让纯文本模型更好地做视觉任务的 DeepSeek Harness 插件：带意图的图片问答、长截图 OCR、UI 还原等。",
    en: "DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, long-screenshot OCR, UI restoration, grounding, pixel diff, Artifacts, and Web UI.",
    ja: "テキスト専用モデルに視覚タスクをこなさせる DeepSeek Harness プラグイン：意図つき画像 Q&A、長尺スクリーンショット OCR、UI 復元など。",
    ko: "텍스트 전용 모델이 비전 작업을 잘하게 해 주는 DeepSeek Harness 플러그인: 의도 기반 이미지 Q&A, 긴 스크린샷 OCR, UI 복원 등.",
  },
  "huiliyi37/dsh-tianshu-tui": {
    zh: "DeepSeek Harness 终端 UI + harness 工作流插件。渲染核心由自研 harness agent Tianshu-Tui 演进而来，在官方基础上增加 TDD 与证据门等工作流。",
    en: "Interactive terminal UI + harness workflow plugin for DeepSeek Harness. Its rendering core evolved from the self-built Tianshu-Tui harness agent, adding TDD and evidence-gate workflows on top of the official base.",
    ja: "DeepSeek Harness の対話式端末 UI + harness ワークフロープラグイン。描画コアは自作 harness agent「Tianshu-Tui」から発展し、公式ベースに TDD やエビデンスゲートなどのワークフローを追加。",
    ko: "DeepSeek Harness의 인터랙티브 터미널 UI + harness 워크플로 플러그인. 렌더링 코어는 자체 개발 harness agent Tianshu-Tui에서 발전했으며, 공식 기반 위에 TDD·증거 게이트 워크플로를 더했다.",
  },
  "0xsline/dsh-spotlight": {
    zh: "DSH Web 的键盘优先命令面板：一个快捷键唤起，搜索并直达会话、命令与操作，双手不离键盘。",
    ja: "DSH Web のキーボードファースト・コマンドパレット。ショートカット一発で呼び出し、セッションやコマンドを検索してそのまま実行、手はキーボードから離れない。",
    ko: "DSH Web의 키보드 우선 커맨드 팔레트. 단축키 하나로 불러와 세션·명령을 검색하고 바로 실행, 손이 키보드를 떠나지 않는다.",
  },
  "AdamPlatin123/awesome-dsh-plugins": {
    en: "Front-stage index repo (Radar): every dsh plugin candidate discovered by automated scanning; entries that pass testing graduate into the curated directory repo.",
    ja: "前段のインデックスリポジトリ（Radar）。自動スキャンで発見したすべての dsh プラグイン候補を収録し、テストに合格したものは後段の厳選ディレクトリへ移す。",
    ko: "전단 인덱스 저장소(Radar). 자동 스캔으로 발견한 모든 dsh 플러그인 후보를 모으고, 테스트를 통과한 항목은 후단의 엄선 디렉터리 저장소로 옮긴다.",
  },
  "Alex-Yanggg/awesome-DSH-plugin": {
    zh: "精心整理的 DSH 插件、扩展、工具与开发资源清单，覆盖效率提升、功能扩展、调试工具与自定义开发模块。",
    ja: "DSH 向けプラグイン・拡張・ツール・開発リソースの厳選リスト。生産性向上、機能拡張、デバッグツール、カスタム開発モジュールを網羅。",
    ko: "DSH용 플러그인·확장·도구·개발 리소스를 꼼꼼히 엄선한 목록. 생산성 향상, 기능 확장, 디버깅 도구, 커스텀 개발 모듈까지 아우른다.",
  },
  "whiteguo233/OpenBiliClaw": {
    zh: "本地私有、开源的跨平台 AI 内容发现 Agent：先理解你，再主动从 B站、小红书、抖音、YouTube、X、知乎、Reddit、微博等平台与开放 Web 寻找内容（支持 DeepSeek Harness 插件）。",
    en: "Local-first, open-source, cross-platform AI content-discovery agent: understands you first, then proactively finds content across Bilibili, Xiaohongshu, Douyin, YouTube, X, Zhihu, Reddit, Weibo and the open web (DeepSeek Harness plugin supported).",
    ja: "ローカル・プライベートかつオープンソースのクロスプラットフォーム AI コンテンツ発見 Agent。まずあなたを理解し、bilibili・小紅書・抖音・YouTube・X・知乎・Reddit・微博などのプラットフォームとオープン Web からコンテンツを能動的に探し出す（DeepSeek Harness プラグイン対応）。",
    ko: "로컬 프라이빗 오픈소스 크로스플랫폼 AI 콘텐츠 발견 Agent. 먼저 당신을 이해한 뒤 bilibili·샤오홍슈·더우인·YouTube·X·즈후·Reddit·웨이보 등 플랫폼과 오픈 웹에서 콘텐츠를 능동적으로 찾아낸다(DeepSeek Harness 플러그인 지원).",
  },
  "whiteguo233/dsh-openbiliclaw": {
    en: "OpenBiliClaw is a local, cross-platform personalized content-discovery agent that keeps learning your interests and proactively finds content. This repo is its DeepSeek Harness plugin: a persistent fourth panel in the DSH UI (feed / library / chat / profile / settings) plus 22 Agent Bridge tools so the agent can read recommendations, answer probes, and close the learning loop.",
    ja: "OpenBiliClaw はローカルで動くクロスプラットフォームのパーソナライズ・コンテンツ発見 Agent。本リポジトリはその DeepSeek Harness プラグインで、DSH 画面に常駐する第 4 カラム（おすすめ／ライブラリ／対話／プロファイル／設定）と 22 個の Agent Bridge ツールを提供し、Agent がおすすめを読み、プローブに答え、学習ループを回せるようにする。",
    ko: "OpenBiliClaw는 로컬에서 실행되는 크로스플랫폼 개인화 콘텐츠 발견 Agent. 이 저장소는 그 DeepSeek Harness 플러그인으로, DSH 화면에 상주하는 네 번째 패널(추천/라이브러리/대화/프로필/설정)과 22개의 Agent Bridge 도구를 등록해 Agent가 추천을 읽고 프로브에 답하며 학습 루프를 완성하게 한다.",
  },
  "vibeinging/dsh-work": {
    zh: "面向 DSH 插件的本地优先 AI 工作台：把 Agent 会话、项目文件、数据分析、网络调研、MCP 与 Office 产物整合进一个 Electron 桌面应用。",
    ja: "DSH プラグインのためのローカルファースト AI ワークベンチ。Agent セッション、プロジェクトファイル、データ分析、Web リサーチ、MCP、Office 成果物を 1 つの Electron デスクトップアプリに統合。",
    ko: "DSH 플러그인을 위한 로컬 우선 AI 워크벤치. Agent 세션, 프로젝트 파일, 데이터 분석, 웹 리서치, MCP, Office 산출물을 하나의 Electron 데스크톱 앱에 통합.",
  },
  "omdsh-dev/dsh-data-agent": {
    en: "Ships a dedicated Data Agent preset so the AI can query, update, and analyze your data for you.",
    ja: "専用の Data Agent プリセットを定義し、AI にデータの照会・更新・分析を任せられる。",
    ko: "전용 Data Agent 프리셋을 정의해 AI가 데이터 조회·업데이트·분석을 대신하게 한다.",
  },
  "hellodigua/dsh-emoji": {
    en: "Adds custom inline emojis to DSH replies.",
    ja: "DSH の返信にカスタムのインライン絵文字を追加。",
    ko: "DSH 답변에 커스텀 인라인 이모지를 더한다.",
  },
  "bocha-ai/dsh-web-search-bocha": {
    zh: "博查官方出品的 Web Search 插件：安装后将博查搜索接入 Harness 统一的 web_search 工具，为智能体提供实时联网搜索能力。",
    en: "Official Bocha web-search plugin: plugs Bocha Web Search into Harness's unified web_search tool, giving agents real-time internet search.",
    ja: "博査（Bocha）公式の Web 検索プラグイン。Bocha Web Search を Harness 統一の web_search ツールに接続し、エージェントにリアルタイムのネット検索能力を提供。",
    ko: "Bocha 공식 웹 검색 플러그인. Bocha Web Search를 Harness 통합 web_search 도구에 연결해 에이전트에 실시간 인터넷 검색 능력을 제공한다.",
  },
  "omdsh-dev/dsh-lark": {
    zh: "飞书/Lark 机器人通道插件（官方出品）：在飞书对话里直接驱动 DSH Agent，回复与审批以消息和卡片形式回到飞书。",
    en: "Official Lark/Feishu IM bot channel for DeepSeek Harness: chats drive agents, replies and approvals return as messages and cards.",
    ja: "公式の Lark（飛書）ボットチャンネルプラグイン。チャットから DSH Agent を駆動し、返信や承認はメッセージ・カードとして Lark に戻る。",
    ko: "공식 Lark(페이슈) 봇 채널 플러그인. 채팅으로 DSH Agent를 구동하고, 답변과 승인은 메시지·카드로 Lark에 돌아온다.",
  },
  "omdsh-dev/fabric": {
    en: "A hook processor in the spirit of Minecraft Fabric.",
    ja: "MC Fabric ライクなフックプロセッサ。",
    ko: "MC Fabric 스타일의 후크 프로세서.",
  },
  "lehhair/dsh-diff-viewer": {
    zh: "DSH Web GUI 的 PiUI 风格 diff 查看器插件：通过 ui-tool diff-card 链式插槽替换 write/edit 工具调用的原生 DiffBlock（附宿主补丁）。",
    ja: "DSH Web GUI の PiUI 風 diff ビューアプラグイン。ui-tool diff-card チェーンスロット経由で write/edit ツール呼び出しの標準 DiffBlock を置き換える（ホストパッチ同梱）。",
    ko: "DSH Web GUI의 PiUI 스타일 diff 뷰어 플러그인. ui-tool diff-card 체인 슬롯으로 write/edit 도구 호출의 기본 DiffBlock을 대체한다(호스트 패치 포함).",
  },
};

/** 取某插件在当前语言下的描述；没有人工翻译时回退 GitHub 原文。 */
export function localizePluginDescription(
  fullName: string,
  locale: string,
  fallback: string,
): string {
  return descriptions[fullName]?.[locale as Locale] ?? fallback;
}

/**
 * 详情页的人工编辑富文案（热门插件专供）。
 * intro：长介绍段落；highlights：亮点列表；installCmd：覆盖默认安装命令。
 * 没写文案的插件详情页自动降级为「描述 + 指标 + 评分」的基础形态。
 */
export interface PluginEditorial {
  intro?: Partial<Record<Locale, string>>;
  highlights?: Partial<Record<Locale, string[]>>;
  installCmd?: string;
}

const editorial: Record<string, PluginEditorial> = {
  "deepseek-ai/deepseek-harness": {
    installCmd: "npx @deepseek-ai/dsh web",
    intro: {
      zh: "DeepSeek 官方开源的 Agent 宿主与运行时，整个生态的地基。核心理念「万物皆插件」：模型、工具、沙箱、会话存储、UI 乃至 agent loop 本身都是可替换的 Cordis 插件——本站收录的所有插件都运行在它之上。",
      en: "DeepSeek's official open-source agent harness and runtime — the foundation of this entire ecosystem. Its core idea is 'Everything is a Plugin': models, tools, sandboxes, session storage, the UI, and even the agent loop itself are replaceable Cordis plugins.",
      ja: "DeepSeek 公式のオープンソース Agent ホスト＆ランタイムで、エコシステム全体の土台。コア思想は「すべてはプラグイン」：モデル、ツール、サンドボックス、セッション保存、UI、さらには agent loop 自体までもが差し替え可能な Cordis プラグイン。",
      ko: "DeepSeek 공식 오픈소스 Agent 호스트이자 런타임으로, 생태계 전체의 기반. 핵심 철학은 '모든 것이 플러그인' — 모델, 도구, 샌드박스, 세션 저장소, UI, 심지어 agent loop 자체까지 교체 가능한 Cordis 플러그인이다.",
    },
    highlights: {
      zh: ["npx 一行命令启动 Web UI，零配置上手", "模型 / 工具 / 沙箱 / UI / agent loop 全部插件化，可自由替换", "MIT 开源，开发者预览阶段，迭代极快", "官方文档、架构说明与贡献指南齐全"],
      en: ["One npx command starts the Web UI — zero config", "Models, tools, sandboxes, UI and the agent loop are all swappable plugins", "MIT-licensed, developer preview, iterating fast", "Complete official docs, architecture guide and contributing guide"],
      ja: ["npx 一行で Web UI が起動、設定不要", "モデル／ツール／サンドボックス／UI／agent loop まで全てプラグインとして交換可能", "MIT ライセンス、developer preview で高速イテレーション", "公式ドキュメント・アーキテクチャ解説・貢献ガイド完備"],
      ko: ["npx 한 줄로 Web UI 실행, 설정 불필요", "모델/도구/샌드박스/UI/agent loop까지 전부 플러그인으로 교체 가능", "MIT 라이선스, developer preview 단계로 빠른 이터레이션", "공식 문서·아키텍처 해설·기여 가이드 완비"],
    },
  },
  "whiteguo233/OpenBiliClaw": {
    intro: {
      zh: "本地运行、开源的跨平台个性化内容发现 Agent：先持续理解你的兴趣画像，再主动去 B 站、小红书、抖音、YouTube、X、知乎、Reddit、微博等平台与开放 Web 找内容。配套 DSH 插件把推荐流、内容库与兴趣对话直接搬进 DSH 界面。",
      en: "A local-first, open-source, cross-platform content-discovery agent: it keeps learning your interest profile, then proactively finds content across Bilibili, Xiaohongshu, Douyin, YouTube, X, Zhihu, Reddit, Weibo and the open web. Its companion DSH plugin brings the feed, library and interest dialogue right into the DSH UI.",
      ja: "ローカル実行・オープンソースのクロスプラットフォーム・コンテンツ発見 Agent。あなたの興味プロファイルを学習し続け、bilibili・小紅書・抖音・YouTube・X・知乎・Reddit・微博などから能動的にコンテンツを探す。付属の DSH プラグインでおすすめフィードを DSH 画面に統合。",
      ko: "로컬 실행 오픈소스 크로스플랫폼 콘텐츠 발견 Agent. 관심 프로필을 계속 학습하며 bilibili·샤오홍슈·더우인·YouTube·X·즈후·Reddit·웨이보와 오픈 웹에서 능동적으로 콘텐츠를 찾아준다. 전용 DSH 플러그인으로 추천 피드를 DSH 화면에 통합.",
    },
    highlights: {
      zh: ["本地私有：画像与数据不出你的机器", "覆盖 11+ 内容平台与开放 Web", "DSH 第四栏插件 + 22 个 Agent Bridge 工具，推荐→反馈→画像闭环", "Chrome 商店扩展、CI 与 Release 链路完备"],
      en: ["Local & private: your profile and data never leave your machine", "Covers 11+ content platforms plus the open web", "DSH panel plugin + 22 Agent Bridge tools close the feed→feedback→profile loop", "Chrome Web Store extension, CI and releases all in place"],
      ja: ["ローカル＆プライベート：プロファイルとデータは端末外に出ない", "11+ のコンテンツプラットフォームとオープン Web をカバー", "DSH パネルプラグイン + 22 個の Agent Bridge ツールで推薦→フィードバック→プロファイルのループを完成", "Chrome ストア拡張・CI・Release 完備"],
      ko: ["로컬·프라이빗: 프로필과 데이터가 기기 밖으로 나가지 않음", "11개 이상 플랫폼과 오픈 웹 커버", "DSH 패널 플러그인 + 22개 Agent Bridge 도구로 추천→피드백→프로필 루프 완성", "Chrome 스토어 확장·CI·Release 완비"],
    },
  },
  "zhu1090093659/dsh-web-ui": {
    intro: {
      zh: "DSH Web UI 的插件与皮肤合集：任务看板（支持 cron 定时执行）、Git 图谱、右侧文件/预览/SCM 面板、移动端扫码远程、鲸鱼娘宠物、实时 token 统计与皮肤中心。所有插件既可独立安装，也可通过聚合包一次装齐。",
      en: "A plugin & skin collection for the DSH Web UI: task board (with cron scheduling), Git graph, right-side file/preview/SCM panels, mobile remote via QR pairing, whale-girl pet, live token stats and a skin center. Install plugins individually or all at once via the aggregate bundle.",
      ja: "DSH Web UI のプラグイン＆スキン集：タスクボード（cron 定期実行対応）、Git グラフ、右側のファイル／プレビュー／SCM パネル、QR ペアリングのモバイル遠隔、クジラ娘ペット、リアルタイム token 統計、スキンセンター。個別にも、集約バンドルで一括にもインストール可能。",
      ko: "DSH Web UI 플러그인·스킨 모음: 작업 보드(cron 예약 실행), Git 그래프, 오른쪽 파일/미리보기/SCM 패널, QR 페어링 모바일 원격, 고래소녀 펫, 실시간 token 통계, 스킨 센터. 개별 설치도, 통합 번들 일괄 설치도 가능.",
    },
    highlights: {
      zh: ["任务看板由真实 DSH 会话执行，状态自动回写", "手机扫码即可远程控制桌面工作区", "8 款皮肤全面适配右侧面板", "issue 响应活跃，社区反馈落地快"],
      en: ["Task board runs on real DSH agent sessions with status write-back", "Scan a QR code to control the desktop workspace from your phone", "8 skins fully adapted to the right-side panels", "Active issue triage — community feedback lands fast"],
      ja: ["タスクボードは実際の DSH セッションが実行し、状態を自動反映", "QR コードを読むだけでスマホから作業空間を遠隔操作", "8 種のスキンが右側パネルに完全対応", "issue 対応が活発でフィードバック反映が速い"],
      ko: ["작업 보드는 실제 DSH 세션이 실행하고 상태를 자동 반영", "QR 스캔으로 폰에서 데스크톱 워크스페이스 원격 제어", "8종 스킨이 오른쪽 패널까지 완전 대응", "이슈 대응이 활발해 피드백 반영이 빠름"],
    },
  },
  "ccch1mneyyy/dsh-TUI": {
    installCmd: "npm i -g dsh-cc-tui",
    intro: {
      zh: "补上 DSH 官方尚无终端 TUI 的空缺：Claude Code 风格的全屏交互终端，通过 Cordis 插件挂载，继续使用官方的 Agent、模型、工具与会话服务，不改核心代码，卸载即还原。",
      en: "Fills the gap of an official DSH terminal TUI: a Claude Code-style full-screen interactive terminal mounted as a Cordis plugin. It keeps using the official agent, models, tools and session services — no core patches, uninstall and it's gone.",
      ja: "DSH 公式にまだない端末 TUI の空白を埋める、Claude Code 風フルスクリーン対話端末。Cordis プラグインとしてマウントし、公式の Agent・モデル・ツール・セッションサービスをそのまま利用。コア無改造、アンインストールで元通り。",
      ko: "DSH 공식 터미널 TUI의 공백을 메우는 Claude Code 스타일 전체 화면 인터랙티브 터미널. Cordis 플러그인으로 마운트되어 공식 Agent·모델·도구·세션 서비스를 그대로 사용한다. 코어 무수정, 제거하면 원상복구.",
    },
    highlights: {
      zh: ["像素鲸鱼顶栏 + 实时工作状态行 + TPS 仪表", "流式 Markdown、@文件引用、历史搜索、双击 Esc 会话回滚", "npm 已发 14 个版本，CI 与架构文档齐全", "为长会话设计：差分渲染与消息虚拟化"],
      en: ["Pixel-whale top bar, live status line and TPS gauge", "Streaming Markdown, @file references, history search, double-Esc session rewind", "14 versions on npm, CI and architecture docs in place", "Built for long sessions: diff rendering and message virtualization"],
      ja: ["ピクセルクジラのトップバー + リアルタイム状態行 + TPS メーター", "ストリーミング Markdown、@ファイル参照、履歴検索、Esc 二連打の巻き戻し", "npm に 14 バージョン公開、CI・アーキテクチャ文書完備", "長時間セッション向け設計：差分描画とメッセージ仮想化"],
      ko: ["픽셀 고래 상단 바 + 실시간 상태 줄 + TPS 게이지", "스트리밍 Markdown, @파일 참조, 히스토리 검색, Esc 두 번 세션 롤백", "npm 14개 버전 배포, CI·아키텍처 문서 완비", "긴 세션을 위한 설계: 차분 렌더링과 메시지 가상화"],
    },
  },
  "Anionex/dsh-vision-toolkit": {
    installCmd: "dsh plugin --profile web add @dsh-external/dsh-vision-toolkit",
    intro: {
      zh: "给纯文本模型「装上眼睛」的原生 Profile Bundle：意图感知的图片问答、长截图 OCR、原始像素定位、UI 还原、像素级校验、受管 Artifacts 与 Web 设置。十个独立工具用结构化 schema 取代 shell 胶水。",
      en: "A native Profile Bundle that gives text-only models eyes: intent-aware image Q&A, long-screenshot OCR, original-pixel grounding, UI restoration, pixel verification, managed Artifacts and Web settings. Ten independent tools replace shell glue with structured schemas.",
      ja: "テキスト専用モデルに「目」を与えるネイティブ Profile Bundle。意図を汲む画像 Q&A、長尺スクリーンショット OCR、原寸ピクセル位置特定、UI 復元、ピクセル検証、管理された Artifacts と Web 設定。10 個の独立ツールがシェルの糊付けを構造化スキーマで置き換える。",
      ko: "텍스트 전용 모델에 '눈'을 달아주는 네이티브 Profile Bundle. 의도 인식 이미지 Q&A, 긴 스크린샷 OCR, 원본 픽셀 그라운딩, UI 복원, 픽셀 검증, 관리형 Artifacts와 웹 설정. 10개 독립 도구가 셸 글루를 구조화 스키마로 대체한다.",
    },
    highlights: {
      zh: ["npm 已发布，一条命令装进 web profile", "136 个测试背书，Web + Headless 双 profile 支持", "作者另有 1.5 万星的上游 agent-vision-toolkit", "Agent 作用域的渐进式工具暴露"],
      en: ["Published on npm — one command installs it into the web profile", "Backed by 136 tests; supports both Web and Headless profiles", "The author's upstream agent-vision-toolkit has 15k+ stars", "Agent-scoped progressive tool exposure"],
      ja: ["npm 公開済み、一行コマンドで web profile に導入", "136 個のテストが品質を担保、Web + Headless 両対応", "作者の上流 agent-vision-toolkit は 1.5 万スター", "Agent スコープの段階的ツール公開"],
      ko: ["npm 배포됨, 한 줄 명령으로 web profile에 설치", "136개 테스트 검증, Web + Headless 프로필 지원", "저자의 업스트림 agent-vision-toolkit은 1.5만 스타", "Agent 범위의 점진적 도구 노출"],
    },
  },
  "AdamPlatin123/awesome-dsh-plugins": {
    intro: {
      zh: "每 8 小时自动扫描全生态的插件雷达：从 GitHub topic 与组织仓自动发现候选，clone + package.json 验证确认插件身份，再由 agent 做运行时实测——装之前就知道哪些插件真的能用。",
      en: "A plugin radar that scans the whole ecosystem every 8 hours: candidates are auto-discovered from GitHub topics and orgs, confirmed by clone + package.json validation, then runtime-tested by an agent — know which plugins actually work before you install.",
      ja: "8 時間ごとにエコシステム全体をスキャンするプラグインレーダー。GitHub topic と組織リポジトリから候補を自動発見し、clone + package.json 検証で確認、さらに agent がランタイム実測。インストール前にどれが本当に動くか分かる。",
      ko: "8시간마다 생태계 전체를 스캔하는 플러그인 레이더. GitHub topic과 조직 저장소에서 후보를 자동 발견하고 clone + package.json 검증으로 확인한 뒤 agent가 런타임 실측까지 한다 — 설치 전에 어떤 플러그인이 진짜 작동하는지 알 수 있다.",
    },
    highlights: {
      zh: ["1300+ 候选扫描、255 确认插件、242 运行时实测", "四维兼容性检查：Patch / Seam / peerDeps / Compile", "证据报告按日期归档，全程可追溯", "32 位贡献者共同维护"],
      en: ["1300+ candidates scanned, 255 confirmed plugins, 242 runtime-tested", "4-dimension compatibility checks: Patch / Seam / peerDeps / Compile", "Evidence reports archived by date — fully traceable", "Maintained by 32 contributors"],
      ja: ["1300+ 候補をスキャン、255 個を確認、242 個をランタイム実測", "Patch / Seam / peerDeps / Compile の 4 次元互換性チェック", "証拠レポートを日付別にアーカイブ、全過程を追跡可能", "32 名のコントリビューターが共同メンテ"],
      ko: ["1300+ 후보 스캔, 255개 확인, 242개 런타임 실측", "Patch / Seam / peerDeps / Compile 4차원 호환성 검사", "증거 리포트를 날짜별로 보관, 전 과정 추적 가능", "32명 기여자가 공동 유지보수"],
    },
  },
  "omdsh-dev/DSH-better-sidebar": {
    installCmd: "dsh plugin --profile web add dsh-better-sidebar",
    intro: {
      zh: "一个插件装出一套完整工作台：右侧栏 + 底部面板双工作区，内置文件管理、CodeMirror 编辑预览、沙箱内嵌浏览器、xterm 真终端、Git 面板与后台任务页，三方插件还能注册自己的 Tab。",
      en: "One plugin, a complete workbench: dual workspaces (right sidebar + bottom panel) with file management, CodeMirror editing & preview, a sandboxed embedded browser, a real xterm terminal, a Git panel and a background-task page. Third-party plugins can register their own tabs.",
      ja: "プラグイン一つでフル装備のワークベンチ。右サイドバー + 下部パネルの二つの作業空間に、ファイル管理、CodeMirror 編集プレビュー、サンドボックス内蔵ブラウザ、xterm 実ターミナル、Git パネル、バックグラウンドタスクページを内蔵。サードパーティは独自タブを登録できる。",
      ko: "플러그인 하나로 완전한 워크벤치: 오른쪽 사이드바 + 하단 패널 이중 작업 공간에 파일 관리, CodeMirror 편집·미리보기, 샌드박스 내장 브라우저, xterm 실제 터미널, Git 패널, 백그라운드 작업 페이지 내장. 서드파티가 자체 탭을 등록할 수 있다.",
    },
    highlights: {
      zh: ["Office 三件套 / PDF / 图片 / Markdown 内联预览", "重依赖按需分块：启动只拉 ~325KB 核心", "npm 已发布，官方 bundle 一键安装", "内嵌浏览器跑在沙箱 iframe，安全边界清晰"],
      en: ["Inline preview for Office files, PDF, images and Markdown", "Heavy deps load on demand — startup pulls only ~325KB core", "Published on npm, one-command official bundle install", "Embedded browser runs in a sandboxed iframe with clear security boundaries"],
      ja: ["Office 三点セット／PDF／画像／Markdown のインラインプレビュー", "重い依存はオンデマンド分割読み込み——起動時は約 325KB のコアのみ", "npm 公開済み、公式 bundle をワンコマンド導入", "内蔵ブラウザはサンドボックス iframe で動作、安全境界が明確"],
      ko: ["Office 3종/PDF/이미지/Markdown 인라인 미리보기", "무거운 의존성은 온디맨드 분할 로드 — 시작 시 약 325KB 코어만", "npm 배포됨, 공식 bundle 원커맨드 설치", "내장 브라우저는 샌드박스 iframe에서 실행, 보안 경계 명확"],
    },
  },
  "huiliyi37/dsh-tianshu-tui": {
    installCmd: "npx -y @deepseek-ai/dsh plugin --profile tui add @huiliyi37/dsh-tianshu-tui",
    intro: {
      zh: "官方 DeepSeek Harness 上的交互式终端 UI 插件。渲染核心从自研 harness agent「天枢 Tianshu-Tui」演进而来（逐文件来源见 SOURCE-MAP），UI 是纯展示层，所有状态来自会话事件流；并加入 TDD 驱动工作流与证据门等 harness 工程层改造。",
      en: "An interactive terminal UI plugin for the official DeepSeek Harness. Its rendering core evolved from the self-built Tianshu-Tui harness agent (per-file provenance in SOURCE-MAP); the UI is a pure presentation layer driven by the session event stream, adding TDD-driven workflows and evidence gates on top.",
      ja: "公式 DeepSeek Harness 上の対話式端末 UI プラグイン。描画コアは自作 harness agent「天枢 Tianshu-Tui」から発展（ファイル単位の出自は SOURCE-MAP 参照）。UI は純粋な表示層で、状態は全てセッションイベントストリーム由来。TDD 駆動ワークフローとエビデンスゲートを追加。",
      ko: "공식 DeepSeek Harness의 인터랙티브 터미널 UI 플러그인. 렌더링 코어는 자체 개발 harness agent '천추 Tianshu-Tui'에서 발전했고(파일별 출처는 SOURCE-MAP 참조), UI는 세션 이벤트 스트림으로 구동되는 순수 표시 계층이다. 그 위에 TDD 워크플로와 증거 게이트를 더했다.",
    },
    highlights: {
      zh: ["npm 已发布，rc 版本纪律严格", "TDD 工作流 + 证据门，工程化气质浓", "Apache-2.0，来源归属逐文件可查", "安装注意事项写得坦诚细致"],
      en: ["Published on npm with strict rc versioning discipline", "TDD workflows + evidence gates — strong engineering culture", "Apache-2.0 with per-file provenance", "Refreshingly honest, detailed install caveats"],
      ja: ["npm 公開済み、rc バージョン管理が厳格", "TDD ワークフロー + エビデンスゲートの強いエンジニアリング色", "Apache-2.0、出自はファイル単位で追跡可能", "インストール時の注意点が誠実で細かい"],
      ko: ["npm 배포, 엄격한 rc 버전 관리", "TDD 워크플로 + 증거 게이트의 강한 엔지니어링 문화", "Apache-2.0, 파일별 출처 추적 가능", "설치 주의사항이 솔직하고 자세함"],
    },
  },
  "omdsh-dev/dsh-lark": {
    installCmd: "dsh plugin --profile web add github:omdsh-dev/dsh-lark",
    intro: {
      zh: "官方出品的飞书 / Lark 通道插件：在飞书对话里直接驱动 DSH Agent，回复与审批以消息和卡片的形式回到飞书——把 Harness 变成团队 IM 里随叫随到的同事。",
      en: "The official Lark/Feishu channel plugin: drive DSH agents straight from Lark chats, with replies and approvals returning as messages and cards — turning Harness into an always-on teammate inside your team IM.",
      ja: "公式の Lark（飛書）チャンネルプラグイン。Lark のチャットから DSH Agent を直接駆動し、返信や承認はメッセージ・カードとして Lark に戻る——Harness をチーム IM の中の頼れる同僚に変える。",
      ko: "공식 Lark(페이슈) 채널 플러그인. Lark 채팅에서 DSH Agent를 직접 구동하고 답변과 승인이 메시지·카드로 돌아온다 — Harness를 팀 IM 속 상시 대기 동료로 만들어준다.",
    },
    highlights: {
      zh: ["官方维护，后续 DSH 生态维护的主阵地之一", "对话驱动 Agent，审批流回飞书卡片", "适合团队协作与移动场景"],
      en: ["Officially maintained — one of the main homes of ongoing DSH ecosystem work", "Chats drive agents; approval flows come back as Lark cards", "Great for team collaboration and mobile use"],
      ja: ["公式メンテナンス、今後の DSH エコシステム維持の主要拠点の一つ", "チャットで Agent を駆動、承認フローは Lark カードで返る", "チーム協働・モバイル用途に最適"],
      ko: ["공식 유지보수 — 향후 DSH 생태계 유지의 주요 거점 중 하나", "채팅으로 Agent 구동, 승인 플로는 Lark 카드로 회신", "팀 협업과 모바일 시나리오에 적합"],
    },
  },
  "bocha-ai/dsh-web-search-bocha": {
    installCmd: "dsh plugin --profile web add @bocha-ai/dsh-web-search-bocha",
    intro: {
      zh: "博查官方出品的 Web Search 插件：把博查搜索接入 Harness 统一的 web_search 工具，为智能体提供实时联网搜索。API 密钥支持环境变量或 DSH credentials 文档两种配置，轮换密钥无需重启。",
      en: "Bocha's official web-search plugin: it plugs Bocha Web Search into Harness's unified web_search tool for real-time internet search. API keys work via environment variable or the DSH credentials file, and key rotation needs no restart.",
      ja: "博査（Bocha）公式の Web 検索プラグイン。Bocha Web Search を Harness 統一の web_search ツールに接続し、リアルタイムのネット検索を提供。API キーは環境変数または DSH credentials ファイルで設定でき、ローテーションに再起動不要。",
      ko: "Bocha 공식 웹 검색 플러그인. Bocha Web Search를 Harness 통합 web_search 도구에 연결해 실시간 인터넷 검색을 제공한다. API 키는 환경 변수 또는 DSH credentials 파일로 설정하며 키 교체 시 재시작이 필요 없다.",
    },
    highlights: {
      zh: ["npm 一条命令装进 web profile", "密钥经 Harness credentials 服务解析，轮换免重启", "开放平台使用口令 dsh-web-search-bocha 可兑换 1000 次免费调用"],
      en: ["One npm command installs it into the web profile", "Keys resolve through the Harness credentials service — rotate without restarting", "Redeem code dsh-web-search-bocha on the Bocha platform for 1,000 free searches"],
      ja: ["npm 一行で web profile に導入", "キーは Harness credentials サービス経由で解決、ローテーション時も再起動不要", "Bocha プラットフォームでコード dsh-web-search-bocha を入力すると 1000 回分の無料検索"],
      ko: ["npm 한 줄로 web profile에 설치", "키는 Harness credentials 서비스로 해석되어 교체 시 재시작 불필요", "Bocha 플랫폼에서 코드 dsh-web-search-bocha 입력 시 1000회 무료 검색 제공"],
    },
  },
};

/** 详情页富文案；没有的插件返回 undefined，页面自动降级为基础形态。 */
export function getPluginEditorial(fullName: string): PluginEditorial | undefined {
  return editorial[fullName];
}
