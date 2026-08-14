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
  "Alex-Yanggg/awesome-DSH-plugin": {
    zh: "精心整理的 DSH 插件、扩展、工具与开发资源清单，覆盖效率提升、功能扩展、调试工具与自定义开发模块。",
    ja: "DSH 向けプラグイン・拡張・ツール・開発リソースの厳選リスト。生産性向上、機能拡張、デバッグツール、カスタム開発モジュールを網羅。",
    ko: "DSH용 플러그인·확장·도구·개발 리소스를 꼼꼼히 엄선한 목록. 생산성 향상, 기능 확장, 디버깅 도구, 커스텀 개발 모듈까지 아우른다.",
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
