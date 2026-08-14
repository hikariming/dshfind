// 由 scripts/gen-plugins-real.mjs 从 Turso plugin_i18n 表生成——请勿手改。
// 文案唯一事实源在 Turso，用 scripts/set-plugin-i18n.mjs 维护；改完跑 pnpm gen:plugins 刷新本文件。
// 生成时间：2026-08-14T16:24:37.868Z
import type { Locale } from "@/i18n/config";

/** 详情页富文案：intro 长介绍 / highlights 亮点 / installCmd 安装命令覆盖。 */
export interface PluginEditorial {
  intro?: Partial<Record<Locale, string>>;
  highlights?: Partial<Record<Locale, string[]>>;
  installCmd?: string;
}

const descriptions: Record<string, Partial<Record<Locale, string>>> = {
  "0xsline/dsh-spotlight": {
    "en": "Keyboard-first command palette for DSH Web: one shortcut to search and jump to sessions, commands and actions — hands never leave the keyboard.",
    "ja": "DSH Web のキーボードファースト・コマンドパレット。ショートカット一発で呼び出し、セッションやコマンドを検索してそのまま実行、手はキーボードから離れない。",
    "ko": "DSH Web의 키보드 우선 커맨드 팔레트. 단축키 하나로 불러와 세션·명령을 검색하고 바로 실행, 손이 키보드를 떠나지 않는다.",
    "zh": "DSH Web 的键盘优先命令面板：一个快捷键唤起，搜索并直达会话、命令与操作，双手不离键盘。"
  },
  "AdamPlatin123/awesome-dsh-plugins": {
    "en": "Front-stage index repo (Radar): every dsh plugin candidate discovered by automated scanning; entries that pass testing graduate into the curated directory repo.",
    "ja": "前段のインデックスリポジトリ（Radar）。自動スキャンで発見したすべての dsh プラグイン候補を収録し、テストに合格したものは後段の厳選ディレクトリへ移す。",
    "ko": "전단 인덱스 저장소(Radar). 자동 스캔으로 발견한 모든 dsh 플러그인 후보를 모으고, 테스트를 통과한 항목은 후단의 엄선 디렉터리 저장소로 옮긴다."
  },
  "Alex-Yanggg/awesome-DSH-plugin": {
    "ja": "DSH 向けプラグイン・拡張・ツール・開発リソースの厳選リスト。生産性向上、機能拡張、デバッグツール、カスタム開発モジュールを網羅。",
    "ko": "DSH용 플러그인·확장·도구·개발 리소스를 꼼꼼히 엄선한 목록. 생산성 향상, 기능 확장, 디버깅 도구, 커스텀 개발 모듈까지 아우른다.",
    "zh": "精心整理的 DSH 插件、扩展、工具与开发资源清单，覆盖效率提升、功能扩展、调试工具与自定义开发模块。"
  },
  "Anionex/dsh-vision-toolkit": {
    "en": "DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, long-screenshot OCR, UI restoration, grounding, pixel diff, Artifacts, and Web UI.",
    "ja": "テキスト専用モデルに視覚タスクをこなさせる DeepSeek Harness プラグイン：意図つき画像 Q&A、長尺スクリーンショット OCR、UI 復元など。",
    "ko": "텍스트 전용 모델이 비전 작업을 잘하게 해 주는 DeepSeek Harness 플러그인: 의도 기반 이미지 Q&A, 긴 스크린샷 OCR, UI 복원 등.",
    "zh": "让纯文本模型更好地做视觉任务的 DeepSeek Harness 插件：带意图的图片问答、长截图 OCR、UI 还原等。"
  },
  "CocoSgt/dsh-attachments": {
    "en": "Third-party attachment plugin for DSH: bring any file into the conversation, zero type rejection. Paperclip button, full-window drag & drop, and paste all stage files into the session workspace as cards above the composer; images are read by path via read_image, so non-vision models are never blocked.",
    "ja": "DSH のサードパーティ添付プラグイン。どんなファイルも会話に持ち込め、形式での拒否はゼロ。クリップボタン・全画面ドラッグ＆ドロップ・貼り付けの 3 経路で取り込み、ファイルはセッション作業領域に一時保存され入力欄の上にカードで並ぶ。画像は read_image のパス読みなので非ビジョンモデルでも詰まらない。",
    "ko": "DSH 서드파티 첨부 플러그인. 어떤 파일이든 대화로 가져오고 형식 거부는 없다. 클립 버튼·전체 창 드래그&드롭·붙여넣기 세 경로로 받아 세션 작업 공간에 스테이징하고 입력창 위에 카드로 띄운다. 이미지는 read_image 경로 읽기라 비전 미지원 모델도 막히지 않는다.",
    "zh": "DSH 第三方附件插件：任何文件都能带进对话，零格式拒收。回形针、全窗口拖拽、粘贴三路入口，文件暂存进会话工作区并以卡片挂在输入框上方；图片由模型经 read_image 按路径读取，非视觉模型也不受阻。"
  },
  "CocoSgt/dsh-inspector": {
    "en": "An \"Instruction Files\" panel for the DSH Web UI: shows and manages the instruction chain actually in effect for the current session, in the harness's real load order (global AGENTS.md → project root → cwd), plus skill-root status — what you see is what the model gets.",
    "ja": "DSH Web UI 右側の「指示ファイル」パネル。harness の実際の読み込み順（グローバル AGENTS.md → プロジェクトルート → cwd）で、現在のセッションに効いている指示チェーンとスキルルートの状態を表示・管理。見えるものがそのままモデルに渡る。",
    "ko": "DSH Web UI 오른쪽의 '지시 파일' 패널. harness의 실제 로드 순서(전역 AGENTS.md → 프로젝트 루트 → cwd)대로 현재 세션에 적용 중인 지시 체인과 스킬 루트 상태를 표시·관리한다. 보이는 그대로 모델에 전달된다.",
    "zh": "DSH Web UI 右侧的「指令文件」面板：按 harness 真实加载顺序展示并管理当前会话实际生效的指令链（全局 AGENTS.md → 项目根 → cwd）与四个技能根状态——所见即模型所得。"
  },
  "CocoSgt/dsh-skills": {
    "en": "Third-party skill hub for DSH: aggregates skills scattered everywhere — Claude Code's ~/.claude/skills, project directories, .skill packages — into the global ~/.dsh/skills library via symlink or copy; imported skills show up in the \"/\" slash menu, with a new Skills page in Settings.",
    "ja": "DSH のサードパーティ・スキルハブ。Claude Code の ~/.claude/skills、プロジェクトディレクトリ、.skill パッケージなど各所に散らばるスキルを、リンクまたはコピーでグローバルライブラリ ~/.dsh/skills に集約。取り込んだスキルは入力欄の「/」メニューに現れ、設定に「スキル」管理ページが加わる。",
    "ko": "DSH 서드파티 스킬 허브. Claude Code의 ~/.claude/skills, 프로젝트 디렉터리, .skill 패키지 등 흩어진 스킬을 링크 또는 복사로 전역 라이브러리 ~/.dsh/skills에 모은다. 가져온 스킬은 입력창 '/' 메뉴에 나타나고, 설정에 '스킬' 관리 페이지가 추가된다.",
    "zh": "DSH 第三方技能中枢：把散落各处的技能——Claude Code 的 ~/.claude/skills、项目目录、.skill 包——以链接或复制聚合进全局技能库 ~/.dsh/skills，导入即出现在输入框「/」菜单，设置页新增「技能」管理页。"
  },
  "ayuanwong/deepseek-harness-ux": {
    "en": "A community Web UX edition of the DSH source tree (not a plugin — you run it from source): long tasks keep only the current stage and a short trail of finished ones in view, reasoning and tool calls fold into \"Run details\" on demand, and the process auto-collapses when the task ends so the result leads. Session recovery and produced-file opening are reworked too; the agent loop, tools and permissions stay aligned with upstream.",
    "ja": "DSH ソースをベースにしたコミュニティ製 Web UX 版（プラグインではなく、ソースから起動）。長時間タスクでは現在の段階と完了済み段階の短い履歴だけを残し、推論とツール呼び出しは「実行詳細」に畳んで必要な時だけ展開。完了すると過程は自動的に折りたたまれ、結果が前面に出る。セッション復旧と成果物の open も刷新。エージェントループ・ツール・権限は上流と同一。",
    "ko": "DSH 소스를 기반으로 한 커뮤니티 Web UX 에디션(플러그인이 아니라 소스에서 직접 실행). 긴 작업에서는 현재 단계와 완료된 단계의 짧은 이력만 남기고, 추론과 도구 호출은 '실행 세부'로 접어 두었다가 필요할 때만 펼친다. 작업이 끝나면 과정이 자동으로 접히고 결과가 앞으로 나온다. 세션 복구와 산출물 열기도 새로 손봤으며, 에이전트 루프·도구·권한은 업스트림과 동일하다.",
    "zh": "基于 DSH 源码的社区 Web UX 版本（非插件，需自行从源码运行）：长任务只留当前阶段与已完成阶段的简短轨迹，推理与工具调用收进「运行详情」按需展开，任务结束自动折叠过程、结果上浮；会话恢复与产物文件打开一并重做，Agent 循环、工具与权限保持与上游一致。"
  },
  "bocha-ai/dsh-web-search-bocha": {
    "en": "Official Bocha web-search plugin: plugs Bocha Web Search into Harness's unified web_search tool, giving agents real-time internet search.",
    "ja": "博査（Bocha）公式の Web 検索プラグイン。Bocha Web Search を Harness 統一の web_search ツールに接続し、エージェントにリアルタイムのネット検索能力を提供。",
    "ko": "Bocha 공식 웹 검색 플러그인. Bocha Web Search를 Harness 통합 web_search 도구에 연결해 에이전트에 실시간 인터넷 검색 능력을 제공한다.",
    "zh": "博查官方出品的 Web Search 插件：安装后将博查搜索接入 Harness 统一的 web_search 工具，为智能体提供实时联网搜索能力。"
  },
  "ccch1mneyyy/dsh-TUI": {
    "en": "Fills the gap of an official DSH terminal TUI — a Claude Code-style full-screen interactive terminal plugin for CLI lovers: pixel-whale top bar, live status line, streaming thoughts, double-Esc rollback, context progress bar + TPS gauge. One npm command to install.",
    "ja": "DSH 公式にまだない端末 TUI を埋める一作。CLI 派に贈る Claude Code 風フルスクリーン対話端末プラグイン——ピクセルクジラのトップバー、リアルタイム状態行、思考のストリーム表示、Esc 二連打で巻き戻し、コンテキスト進捗バー + TPS メーター。npm 一発インストール。",
    "ko": "DSH 공식 터미널 TUI의 공백을 메우는 플러그인. CLI 애호가를 위한 Claude Code 스타일 전체 화면 인터랙티브 터미널 — 픽셀 고래 상단 바, 실시간 상태 줄, 사고 스트리밍, Esc 두 번으로 롤백, 컨텍스트 진행 바 + TPS 게이지. npm 한 줄로 설치."
  },
  "crazywoola/dsh-balance": {
    "en": "A DSH Settings plugin for checking DeepSeek API balance (total / topped-up / granted) and the models available to your key, with cached results and manual refresh; the API key stays host-side and never reaches the browser.",
    "ja": "DSH 設定ページのプラグイン。DeepSeek API の残高（合計／チャージ／付与）と現在のキーで使えるモデルを照会。結果はキャッシュされ手動更新も可能。API キーはローカル Host のみが使い、ブラウザには送られない。",
    "ko": "DSH 설정 페이지 플러그인. DeepSeek API 잔액(총액/충전/증정)과 현재 키로 사용 가능한 모델을 조회한다. 결과는 캐시되고 수동 새로고침을 지원한다. API 키는 로컬 Host에서만 쓰이며 브라우저로 전송되지 않는다.",
    "zh": "DSH 设置页插件：查询 DeepSeek API 总余额/充值/赠送余额与当前 Key 可用模型，结果带缓存可手动刷新；API Key 只在本机 Host 使用，不发送到浏览器。"
  },
  "deepseek-ai/deepseek-harness": {
    "ja": "DeepSeek Harness：すべてはプラグイン。",
    "ko": "DeepSeek Harness: 모든 것이 플러그인.",
    "zh": "DeepSeek Harness：万物皆插件。"
  },
  "hellodigua/dsh-emoji": {
    "en": "Adds custom inline emojis to DSH replies.",
    "ja": "DSH の返信にカスタムのインライン絵文字を追加。",
    "ko": "DSH 답변에 커스텀 인라인 이모지를 더한다."
  },
  "hellodigua/dsh-share": {
    "en": "Export one or many DSH turns as a long PNG or Markdown: enter selection mode from the top-right, tick the turns you want, and everything — code blocks, tables, images, tool-call summaries — comes out intact, with adjustable width and font size.",
    "ja": "DSH の 1 ターンまたは複数ターンの問答を PNG 長画像や Markdown に書き出すプラグイン。右上から選択モードに入って必要な問答だけを選び、コードブロック・表・画像・ツール呼び出しの要約はそのまま保持。画像の幅と文字サイズも調整可能。",
    "ko": "DSH의 한 턴 또는 여러 턴 대화를 PNG 긴 이미지나 Markdown으로 내보내는 플러그인. 오른쪽 위에서 선택 모드로 들어가 원하는 문답만 고르고, 코드 블록·표·이미지·도구 호출 요약을 그대로 보존한다. 이미지 너비와 글자 크기도 조절할 수 있다.",
    "zh": "把 DSH 的一轮或多轮问答导出成 PNG 长图或 Markdown：右上角进入选择模式勾选问答，代码块、表格、图片与工具调用摘要原样保留，图片宽度与字号可调。"
  },
  "huiliyi37/dsh-tianshu-tui": {
    "en": "Interactive terminal UI + harness workflow plugin for DeepSeek Harness. Its rendering core evolved from the self-built Tianshu-Tui harness agent, adding TDD and evidence-gate workflows on top of the official base.",
    "ja": "DeepSeek Harness の対話式端末 UI + harness ワークフロープラグイン。描画コアは自作 harness agent「Tianshu-Tui」から発展し、公式ベースに TDD やエビデンスゲートなどのワークフローを追加。",
    "ko": "DeepSeek Harness의 인터랙티브 터미널 UI + harness 워크플로 플러그인. 렌더링 코어는 자체 개발 harness agent Tianshu-Tui에서 발전했으며, 공식 기반 위에 TDD·증거 게이트 워크플로를 더했다.",
    "zh": "DeepSeek Harness 终端 UI + harness 工作流插件。渲染核心由自研 harness agent Tianshu-Tui 演进而来，在官方基础上增加 TDD 与证据门等工作流。"
  },
  "lehhair/dsh-diff-viewer": {
    "ja": "DSH Web GUI の PiUI 風 diff ビューアプラグイン。ui-tool diff-card チェーンスロット経由で write/edit ツール呼び出しの標準 DiffBlock を置き換える（ホストパッチ同梱）。",
    "ko": "DSH Web GUI의 PiUI 스타일 diff 뷰어 플러그인. ui-tool diff-card 체인 슬롯으로 write/edit 도구 호출의 기본 DiffBlock을 대체한다(호스트 패치 포함).",
    "zh": "DSH Web GUI 的 PiUI 风格 diff 查看器插件：通过 ui-tool diff-card 链式插槽替换 write/edit 工具调用的原生 DiffBlock（附宿主补丁）。"
  },
  "omdsh-dev/DSH-better-sidebar": {
    "en": "A complete workbench inside the sidebar: third-party extensions can register new tabs; file rendering & editing, terminal, Git, and subagents built in.",
    "ja": "サイドバーに収まるフル装備のワークベンチ。サードパーティ拡張が新しいタブを登録でき、ファイル表示・編集／ターミナル／Git／サブエージェントを内蔵。",
    "ko": "사이드바 하나에 담긴 완전한 워크벤치. 서드파티 확장이 새 탭을 등록할 수 있으며 파일 렌더링·편집/터미널/Git/서브에이전트 내장."
  },
  "omdsh-dev/dsh-data-agent": {
    "en": "Ships a dedicated Data Agent preset so the AI can query, update, and analyze your data for you.",
    "ja": "専用の Data Agent プリセットを定義し、AI にデータの照会・更新・分析を任せられる。",
    "ko": "전용 Data Agent 프리셋을 정의해 AI가 데이터 조회·업데이트·분석을 대신하게 한다."
  },
  "omdsh-dev/dsh-lark": {
    "en": "Official Lark/Feishu IM bot channel for DeepSeek Harness: chats drive agents, replies and approvals return as messages and cards.",
    "ja": "公式の Lark（飛書）ボットチャンネルプラグイン。チャットから DSH Agent を駆動し、返信や承認はメッセージ・カードとして Lark に戻る。",
    "ko": "공식 Lark(페이슈) 봇 채널 플러그인. 채팅으로 DSH Agent를 구동하고, 답변과 승인은 메시지·카드로 Lark에 돌아온다.",
    "zh": "飞书/Lark 机器人通道插件（官方出品）：在飞书对话里直接驱动 DSH Agent，回复与审批以消息和卡片形式回到飞书。"
  },
  "omdsh-dev/fabric": {
    "en": "A hook processor in the spirit of Minecraft Fabric.",
    "ja": "MC Fabric ライクなフックプロセッサ。",
    "ko": "MC Fabric 스타일의 후크 프로세서."
  },
  "vibeinging/dsh-work": {
    "ja": "DSH プラグインのためのローカルファースト AI ワークベンチ。Agent セッション、プロジェクトファイル、データ分析、Web リサーチ、MCP、Office 成果物を 1 つの Electron デスクトップアプリに統合。",
    "ko": "DSH 플러그인을 위한 로컬 우선 AI 워크벤치. Agent 세션, 프로젝트 파일, 데이터 분석, 웹 리서치, MCP, Office 산출물을 하나의 Electron 데스크톱 앱에 통합.",
    "zh": "面向 DSH 插件的本地优先 AI 工作台：把 Agent 会话、项目文件、数据分析、网络调研、MCP 与 Office 产物整合进一个 Electron 桌面应用。"
  },
  "whiteguo233/OpenBiliClaw": {
    "en": "Local-first, open-source, cross-platform AI content-discovery agent: understands you first, then proactively finds content across Bilibili, Xiaohongshu, Douyin, YouTube, X, Zhihu, Reddit, Weibo and the open web (DeepSeek Harness plugin supported).",
    "ja": "ローカル・プライベートかつオープンソースのクロスプラットフォーム AI コンテンツ発見 Agent。まずあなたを理解し、bilibili・小紅書・抖音・YouTube・X・知乎・Reddit・微博などのプラットフォームとオープン Web からコンテンツを能動的に探し出す（DeepSeek Harness プラグイン対応）。",
    "ko": "로컬 프라이빗 오픈소스 크로스플랫폼 AI 콘텐츠 발견 Agent. 먼저 당신을 이해한 뒤 bilibili·샤오홍슈·더우인·YouTube·X·즈후·Reddit·웨이보 등 플랫폼과 오픈 웹에서 콘텐츠를 능동적으로 찾아낸다(DeepSeek Harness 플러그인 지원).",
    "zh": "本地私有、开源的跨平台 AI 内容发现 Agent：先理解你，再主动从 B站、小红书、抖音、YouTube、X、知乎、Reddit、微博等平台与开放 Web 寻找内容（支持 DeepSeek Harness 插件）。"
  },
  "whiteguo233/dsh-openbiliclaw": {
    "en": "OpenBiliClaw is a local, cross-platform personalized content-discovery agent that keeps learning your interests and proactively finds content. This repo is its DeepSeek Harness plugin: a persistent fourth panel in the DSH UI (feed / library / chat / profile / settings) plus 22 Agent Bridge tools so the agent can read recommendations, answer probes, and close the learning loop.",
    "ja": "OpenBiliClaw はローカルで動くクロスプラットフォームのパーソナライズ・コンテンツ発見 Agent。本リポジトリはその DeepSeek Harness プラグインで、DSH 画面に常駐する第 4 カラム（おすすめ／ライブラリ／対話／プロファイル／設定）と 22 個の Agent Bridge ツールを提供し、Agent がおすすめを読み、プローブに答え、学習ループを回せるようにする。",
    "ko": "OpenBiliClaw는 로컬에서 실행되는 크로스플랫폼 개인화 콘텐츠 발견 Agent. 이 저장소는 그 DeepSeek Harness 플러그인으로, DSH 화면에 상주하는 네 번째 패널(추천/라이브러리/대화/프로필/설정)과 22개의 Agent Bridge 도구를 등록해 Agent가 추천을 읽고 프로브에 답하며 학습 루프를 완성하게 한다."
  },
  "zhu1090093659/dsh-web-ui": {
    "ja": "DSH Web UI のプラグイン＆スキン集——タスクボード、Git グラフ、右サイドパネル、モバイル遠隔 UI、ペット、リアルタイム token 統計、スキンセンター。",
    "ko": "DSH Web UI 플러그인·스킨 모음 — 작업 보드, Git 그래프, 오른쪽 패널, 원격 모바일 UI, 펫, 실시간 token 통계, 스킨 센터.",
    "zh": "DSH Web UI 插件与皮肤合集——任务看板、Git 图谱、右侧面板、远程移动端 UI、桌宠、实时 token 统计与皮肤中心。"
  }
};

const editorial: Record<string, PluginEditorial> = {
  "AdamPlatin123/awesome-dsh-plugins": {
    "intro": {
      "en": "A plugin radar that scans the whole ecosystem every 8 hours: candidates are auto-discovered from GitHub topics and orgs, confirmed by clone + package.json validation, then runtime-tested by an agent — know which plugins actually work before you install.",
      "ja": "8 時間ごとにエコシステム全体をスキャンするプラグインレーダー。GitHub topic と組織リポジトリから候補を自動発見し、clone + package.json 検証で確認、さらに agent がランタイム実測。インストール前にどれが本当に動くか分かる。",
      "ko": "8시간마다 생태계 전체를 스캔하는 플러그인 레이더. GitHub topic과 조직 저장소에서 후보를 자동 발견하고 clone + package.json 검증으로 확인한 뒤 agent가 런타임 실측까지 한다 — 설치 전에 어떤 플러그인이 진짜 작동하는지 알 수 있다.",
      "zh": "每 8 小时自动扫描全生态的插件雷达：从 GitHub topic 与组织仓自动发现候选，clone + package.json 验证确认插件身份，再由 agent 做运行时实测——装之前就知道哪些插件真的能用。"
    },
    "highlights": {
      "en": [
        "1300+ candidates scanned, 255 confirmed plugins, 242 runtime-tested",
        "4-dimension compatibility checks: Patch / Seam / peerDeps / Compile",
        "Evidence reports archived by date — fully traceable",
        "Maintained by 32 contributors"
      ],
      "ja": [
        "1300+ 候補をスキャン、255 個を確認、242 個をランタイム実測",
        "Patch / Seam / peerDeps / Compile の 4 次元互換性チェック",
        "証拠レポートを日付別にアーカイブ、全過程を追跡可能",
        "32 名のコントリビューターが共同メンテ"
      ],
      "ko": [
        "1300+ 후보 스캔, 255개 확인, 242개 런타임 실측",
        "Patch / Seam / peerDeps / Compile 4차원 호환성 검사",
        "증거 리포트를 날짜별로 보관, 전 과정 추적 가능",
        "32명 기여자가 공동 유지보수"
      ],
      "zh": [
        "1300+ 候选扫描、255 确认插件、242 运行时实测",
        "四维兼容性检查：Patch / Seam / peerDeps / Compile",
        "证据报告按日期归档，全程可追溯",
        "32 位贡献者共同维护"
      ]
    }
  },
  "Anionex/dsh-vision-toolkit": {
    "intro": {
      "en": "A native Profile Bundle that gives text-only models eyes: intent-aware image Q&A, long-screenshot OCR, original-pixel grounding, UI restoration, pixel verification, managed Artifacts and Web settings. Ten independent tools replace shell glue with structured schemas.",
      "ja": "テキスト専用モデルに「目」を与えるネイティブ Profile Bundle。意図を汲む画像 Q&A、長尺スクリーンショット OCR、原寸ピクセル位置特定、UI 復元、ピクセル検証、管理された Artifacts と Web 設定。10 個の独立ツールがシェルの糊付けを構造化スキーマで置き換える。",
      "ko": "텍스트 전용 모델에 '눈'을 달아주는 네이티브 Profile Bundle. 의도 인식 이미지 Q&A, 긴 스크린샷 OCR, 원본 픽셀 그라운딩, UI 복원, 픽셀 검증, 관리형 Artifacts와 웹 설정. 10개 독립 도구가 셸 글루를 구조화 스키마로 대체한다.",
      "zh": "给纯文本模型「装上眼睛」的原生 Profile Bundle：意图感知的图片问答、长截图 OCR、原始像素定位、UI 还原、像素级校验、受管 Artifacts 与 Web 设置。十个独立工具用结构化 schema 取代 shell 胶水。"
    },
    "highlights": {
      "en": [
        "Published on npm — one command installs it into the web profile",
        "Backed by 136 tests; supports both Web and Headless profiles",
        "The author's upstream agent-vision-toolkit has 15k+ stars",
        "Agent-scoped progressive tool exposure"
      ],
      "ja": [
        "npm 公開済み、一行コマンドで web profile に導入",
        "136 個のテストが品質を担保、Web + Headless 両対応",
        "作者の上流 agent-vision-toolkit は 1.5 万スター",
        "Agent スコープの段階的ツール公開"
      ],
      "ko": [
        "npm 배포됨, 한 줄 명령으로 web profile에 설치",
        "136개 테스트 검증, Web + Headless 프로필 지원",
        "저자의 업스트림 agent-vision-toolkit은 1.5만 스타",
        "Agent 범위의 점진적 도구 노출"
      ],
      "zh": [
        "npm 已发布，一条命令装进 web profile",
        "136 个测试背书，Web + Headless 双 profile 支持",
        "作者另有 1.5 万星的上游 agent-vision-toolkit",
        "Agent 作用域的渐进式工具暴露"
      ]
    },
    "installCmd": "dsh plugin --profile web add @dsh-external/dsh-vision-toolkit"
  },
  "bocha-ai/dsh-web-search-bocha": {
    "intro": {
      "en": "Bocha's official web-search plugin: it plugs Bocha Web Search into Harness's unified web_search tool for real-time internet search. API keys work via environment variable or the DSH credentials file, and key rotation needs no restart.",
      "ja": "博査（Bocha）公式の Web 検索プラグイン。Bocha Web Search を Harness 統一の web_search ツールに接続し、リアルタイムのネット検索を提供。API キーは環境変数または DSH credentials ファイルで設定でき、ローテーションに再起動不要。",
      "ko": "Bocha 공식 웹 검색 플러그인. Bocha Web Search를 Harness 통합 web_search 도구에 연결해 실시간 인터넷 검색을 제공한다. API 키는 환경 변수 또는 DSH credentials 파일로 설정하며 키 교체 시 재시작이 필요 없다.",
      "zh": "博查官方出品的 Web Search 插件：把博查搜索接入 Harness 统一的 web_search 工具，为智能体提供实时联网搜索。API 密钥支持环境变量或 DSH credentials 文档两种配置，轮换密钥无需重启。"
    },
    "highlights": {
      "en": [
        "One npm command installs it into the web profile",
        "Keys resolve through the Harness credentials service — rotate without restarting",
        "Redeem code dsh-web-search-bocha on the Bocha platform for 1,000 free searches"
      ],
      "ja": [
        "npm 一行で web profile に導入",
        "キーは Harness credentials サービス経由で解決、ローテーション時も再起動不要",
        "Bocha プラットフォームでコード dsh-web-search-bocha を入力すると 1000 回分の無料検索"
      ],
      "ko": [
        "npm 한 줄로 web profile에 설치",
        "키는 Harness credentials 서비스로 해석되어 교체 시 재시작 불필요",
        "Bocha 플랫폼에서 코드 dsh-web-search-bocha 입력 시 1000회 무료 검색 제공"
      ],
      "zh": [
        "npm 一条命令装进 web profile",
        "密钥经 Harness credentials 服务解析，轮换免重启",
        "开放平台使用口令 dsh-web-search-bocha 可兑换 1000 次免费调用"
      ]
    },
    "installCmd": "dsh plugin --profile web add @bocha-ai/dsh-web-search-bocha"
  },
  "ccch1mneyyy/dsh-TUI": {
    "intro": {
      "en": "Fills the gap of an official DSH terminal TUI: a Claude Code-style full-screen interactive terminal mounted as a Cordis plugin. It keeps using the official agent, models, tools and session services — no core patches, uninstall and it's gone.",
      "ja": "DSH 公式にまだない端末 TUI の空白を埋める、Claude Code 風フルスクリーン対話端末。Cordis プラグインとしてマウントし、公式の Agent・モデル・ツール・セッションサービスをそのまま利用。コア無改造、アンインストールで元通り。",
      "ko": "DSH 공식 터미널 TUI의 공백을 메우는 Claude Code 스타일 전체 화면 인터랙티브 터미널. Cordis 플러그인으로 마운트되어 공식 Agent·모델·도구·세션 서비스를 그대로 사용한다. 코어 무수정, 제거하면 원상복구.",
      "zh": "补上 DSH 官方尚无终端 TUI 的空缺：Claude Code 风格的全屏交互终端，通过 Cordis 插件挂载，继续使用官方的 Agent、模型、工具与会话服务，不改核心代码，卸载即还原。"
    },
    "highlights": {
      "en": [
        "Pixel-whale top bar, live status line and TPS gauge",
        "Streaming Markdown, @file references, history search, double-Esc session rewind",
        "14 versions on npm, CI and architecture docs in place",
        "Built for long sessions: diff rendering and message virtualization"
      ],
      "ja": [
        "ピクセルクジラのトップバー + リアルタイム状態行 + TPS メーター",
        "ストリーミング Markdown、@ファイル参照、履歴検索、Esc 二連打の巻き戻し",
        "npm に 14 バージョン公開、CI・アーキテクチャ文書完備",
        "長時間セッション向け設計：差分描画とメッセージ仮想化"
      ],
      "ko": [
        "픽셀 고래 상단 바 + 실시간 상태 줄 + TPS 게이지",
        "스트리밍 Markdown, @파일 참조, 히스토리 검색, Esc 두 번 세션 롤백",
        "npm 14개 버전 배포, CI·아키텍처 문서 완비",
        "긴 세션을 위한 설계: 차분 렌더링과 메시지 가상화"
      ],
      "zh": [
        "像素鲸鱼顶栏 + 实时工作状态行 + TPS 仪表",
        "流式 Markdown、@文件引用、历史搜索、双击 Esc 会话回滚",
        "npm 已发 14 个版本，CI 与架构文档齐全",
        "为长会话设计：差分渲染与消息虚拟化"
      ]
    },
    "installCmd": "npm i -g dsh-cc-tui"
  },
  "deepseek-ai/deepseek-harness": {
    "intro": {
      "en": "DeepSeek's official open-source agent harness and runtime — the foundation of this entire ecosystem. Its core idea is 'Everything is a Plugin': models, tools, sandboxes, session storage, the UI, and even the agent loop itself are replaceable Cordis plugins.",
      "ja": "DeepSeek 公式のオープンソース Agent ホスト＆ランタイムで、エコシステム全体の土台。コア思想は「すべてはプラグイン」：モデル、ツール、サンドボックス、セッション保存、UI、さらには agent loop 自体までもが差し替え可能な Cordis プラグイン。",
      "ko": "DeepSeek 공식 오픈소스 Agent 호스트이자 런타임으로, 생태계 전체의 기반. 핵심 철학은 '모든 것이 플러그인' — 모델, 도구, 샌드박스, 세션 저장소, UI, 심지어 agent loop 자체까지 교체 가능한 Cordis 플러그인이다.",
      "zh": "DeepSeek 官方开源的 Agent 宿主与运行时，整个生态的地基。核心理念「万物皆插件」：模型、工具、沙箱、会话存储、UI 乃至 agent loop 本身都是可替换的 Cordis 插件——本站收录的所有插件都运行在它之上。"
    },
    "highlights": {
      "en": [
        "One npx command starts the Web UI — zero config",
        "Models, tools, sandboxes, UI and the agent loop are all swappable plugins",
        "MIT-licensed, developer preview, iterating fast",
        "Complete official docs, architecture guide and contributing guide"
      ],
      "ja": [
        "npx 一行で Web UI が起動、設定不要",
        "モデル／ツール／サンドボックス／UI／agent loop まで全てプラグインとして交換可能",
        "MIT ライセンス、developer preview で高速イテレーション",
        "公式ドキュメント・アーキテクチャ解説・貢献ガイド完備"
      ],
      "ko": [
        "npx 한 줄로 Web UI 실행, 설정 불필요",
        "모델/도구/샌드박스/UI/agent loop까지 전부 플러그인으로 교체 가능",
        "MIT 라이선스, developer preview 단계로 빠른 이터레이션",
        "공식 문서·아키텍처 해설·기여 가이드 완비"
      ],
      "zh": [
        "npx 一行命令启动 Web UI，零配置上手",
        "模型 / 工具 / 沙箱 / UI / agent loop 全部插件化，可自由替换",
        "MIT 开源，开发者预览阶段，迭代极快",
        "官方文档、架构说明与贡献指南齐全"
      ]
    },
    "installCmd": "npx @deepseek-ai/dsh web"
  },
  "hellodigua/dsh-share": {
    "intro": {
      "en": "Turns a DSH conversation into something you can actually send. Enter selection mode from the top-right (everything selected by default), or hit the share button on a single turn to preselect just that one. Question and answer each get linked checkboxes that stick to the viewport while you scroll long content, and selection doesn't have to be contiguous. From there you can copy the image, download a PNG, or download Markdown — code blocks, tables, images and tool-call summaries all survive the export. Image width and font size are adjustable, long images get a scrollable preview, and a \"hide the process\" toggle keeps only the question and the final answer. The entry points mount on the official conversation.chat.assistant-actions and conversation.session.header.utilities slots using official Client types — no scanning or patching of the action-bar DOM.",
      "ja": "DSH の会話を、そのまま共有できる形に変えるプラグイン。右上から問答の選択モードに入り（既定は全選択）、あるいは各ターンの共有ボタンを押せばそのターンだけが選択される。質問と回答の両側に連動するチェックボックスが付き、長い内容をスクロールしても画面に吸着し、飛び飛びの選択もできる。選んだあとは画像のコピー、PNG のダウンロード、Markdown のダウンロードが可能で、コードブロック・表・画像・ツール呼び出しの要約はそのまま残る。画像の幅と文字サイズは調整でき、長い画像はスクロールプレビュー付き。「過程を表示しない」を選べば質問と最終回答だけを残せる。入口は公式の conversation.chat.assistant-actions と conversation.session.header.utilities スロットに、公式 Client 型を使って接続しており、ボタンバーの DOM を走査したり書き換えたりしない。",
      "ko": "DSH의 대화를 그대로 공유할 수 있는 형태로 바꿔 주는 플러그인. 오른쪽 위에서 문답 선택 모드로 들어가거나(기본은 전체 선택), 각 턴의 공유 버튼을 누르면 그 턴만 선택된다. 질문과 답변 양쪽에 연동되는 체크박스가 붙고, 긴 내용을 스크롤하는 동안에도 화면에 붙어 있으며 띄엄띄엄 고르는 것도 가능하다. 선택한 뒤에는 이미지 복사, PNG 다운로드, Markdown 다운로드를 할 수 있고 코드 블록·표·이미지·도구 호출 요약이 그대로 남는다. 이미지 너비와 글자 크기를 조절할 수 있고 긴 이미지는 스크롤 미리보기를 지원하며, '과정 숨기기'를 켜면 질문과 최종 답변만 남는다. 진입점은 공식 conversation.chat.assistant-actions와 conversation.session.header.utilities 슬롯에 공식 Client 타입으로 붙으며, 버튼 바 DOM을 스캔하거나 고치지 않는다.",
      "zh": "把 DSH 里的对话变成能直接发出去的东西。从右上角进入问答选择模式（默认全选），或用某一轮自带的分享按钮只选中这一组；问题与回答两侧有联动勾选框，长内容滚动时会吸附在页面上，支持不连续挑选。选好后可复制图片、下载 PNG 或 Markdown，Markdown、代码块、表格、图片与工具调用摘要原样保留，图片宽度与字号可调、长图带滚动预览，还能勾选「不展示过程」只留提问与最终回答。入口挂在官方 conversation.chat.assistant-actions 与 conversation.session.header.utilities 插槽上，直接用官方 Client 类型，不扫描也不修改按钮栏 DOM。"
    },
    "highlights": {
      "en": [
        "Pick one turn or many, non-contiguous allowed; checkboxes stick while long content scrolls",
        "Export to PNG or Markdown with code blocks, tables, images and tool-call summaries intact",
        "\"Hide the process\" keeps only question and final answer; width and font size adjustable, settings persisted",
        "Mounts on official slots with official Client types — no action-bar DOM scanning or patching"
      ],
      "ja": [
        "1 ターンでも複数ターンでも自由に選択、飛び飛びも可。長文スクロール中もチェックボックスが吸着",
        "PNG / Markdown 書き出しでコードブロック・表・画像・ツール呼び出し要約をそのまま保持",
        "「過程を表示しない」で質問と最終回答だけに。幅・文字サイズも調整でき設定はブラウザに保存",
        "公式スロットと公式 Client 型で接続、ボタンバーの DOM を走査も改変もしない"
      ],
      "ko": [
        "한 턴이든 여러 턴이든 자유롭게 선택, 비연속 선택 가능. 긴 내용 스크롤 중에도 체크박스가 따라붙음",
        "PNG·Markdown으로 내보내도 코드 블록·표·이미지·도구 호출 요약이 그대로 보존",
        "'과정 숨기기'로 질문과 최종 답변만 남기기. 너비·글자 크기 조절 가능, 설정은 브라우저에 저장",
        "공식 슬롯과 공식 Client 타입으로 마운트 — 버튼 바 DOM을 스캔하거나 패치하지 않음"
      ],
      "zh": [
        "一轮或多轮自由勾选，支持不连续选择，勾选框随长内容吸附",
        "导出 PNG 或 Markdown，代码块、表格、图片与工具调用摘要原样保留",
        "可勾选「不展示过程」，只留提问与最终回答；宽度字号可调，设置存浏览器",
        "走官方插槽与 Client 类型挂载，不扫描也不改按钮栏 DOM"
      ]
    },
    "installCmd": "dsh plugin --profile web add \\\n  --ignore-scripts --config.auto-install-peers=false \\\n  'github:hellodigua/dsh-share#7e4ea6f'"
  },
  "huiliyi37/dsh-tianshu-tui": {
    "intro": {
      "en": "An interactive terminal UI plugin for the official DeepSeek Harness. Its rendering core evolved from the self-built Tianshu-Tui harness agent (per-file provenance in SOURCE-MAP); the UI is a pure presentation layer driven by the session event stream, adding TDD-driven workflows and evidence gates on top.",
      "ja": "公式 DeepSeek Harness 上の対話式端末 UI プラグイン。描画コアは自作 harness agent「天枢 Tianshu-Tui」から発展（ファイル単位の出自は SOURCE-MAP 参照）。UI は純粋な表示層で、状態は全てセッションイベントストリーム由来。TDD 駆動ワークフローとエビデンスゲートを追加。",
      "ko": "공식 DeepSeek Harness의 인터랙티브 터미널 UI 플러그인. 렌더링 코어는 자체 개발 harness agent '천추 Tianshu-Tui'에서 발전했고(파일별 출처는 SOURCE-MAP 참조), UI는 세션 이벤트 스트림으로 구동되는 순수 표시 계층이다. 그 위에 TDD 워크플로와 증거 게이트를 더했다.",
      "zh": "官方 DeepSeek Harness 上的交互式终端 UI 插件。渲染核心从自研 harness agent「天枢 Tianshu-Tui」演进而来（逐文件来源见 SOURCE-MAP），UI 是纯展示层，所有状态来自会话事件流；并加入 TDD 驱动工作流与证据门等 harness 工程层改造。"
    },
    "highlights": {
      "en": [
        "Published on npm with strict rc versioning discipline",
        "TDD workflows + evidence gates — strong engineering culture",
        "Apache-2.0 with per-file provenance",
        "Refreshingly honest, detailed install caveats"
      ],
      "ja": [
        "npm 公開済み、rc バージョン管理が厳格",
        "TDD ワークフロー + エビデンスゲートの強いエンジニアリング色",
        "Apache-2.0、出自はファイル単位で追跡可能",
        "インストール時の注意点が誠実で細かい"
      ],
      "ko": [
        "npm 배포, 엄격한 rc 버전 관리",
        "TDD 워크플로 + 증거 게이트의 강한 엔지니어링 문화",
        "Apache-2.0, 파일별 출처 추적 가능",
        "설치 주의사항이 솔직하고 자세함"
      ],
      "zh": [
        "npm 已发布，rc 版本纪律严格",
        "TDD 工作流 + 证据门，工程化气质浓",
        "Apache-2.0，来源归属逐文件可查",
        "安装注意事项写得坦诚细致"
      ]
    },
    "installCmd": "npx -y @deepseek-ai/dsh plugin --profile tui add @huiliyi37/dsh-tianshu-tui"
  },
  "omdsh-dev/DSH-better-sidebar": {
    "intro": {
      "en": "One plugin, a complete workbench: dual workspaces (right sidebar + bottom panel) with file management, CodeMirror editing & preview, a sandboxed embedded browser, a real xterm terminal, a Git panel and a background-task page. Third-party plugins can register their own tabs.",
      "ja": "プラグイン一つでフル装備のワークベンチ。右サイドバー + 下部パネルの二つの作業空間に、ファイル管理、CodeMirror 編集プレビュー、サンドボックス内蔵ブラウザ、xterm 実ターミナル、Git パネル、バックグラウンドタスクページを内蔵。サードパーティは独自タブを登録できる。",
      "ko": "플러그인 하나로 완전한 워크벤치: 오른쪽 사이드바 + 하단 패널 이중 작업 공간에 파일 관리, CodeMirror 편집·미리보기, 샌드박스 내장 브라우저, xterm 실제 터미널, Git 패널, 백그라운드 작업 페이지 내장. 서드파티가 자체 탭을 등록할 수 있다.",
      "zh": "一个插件装出一套完整工作台：右侧栏 + 底部面板双工作区，内置文件管理、CodeMirror 编辑预览、沙箱内嵌浏览器、xterm 真终端、Git 面板与后台任务页，三方插件还能注册自己的 Tab。"
    },
    "highlights": {
      "en": [
        "Inline preview for Office files, PDF, images and Markdown",
        "Heavy deps load on demand — startup pulls only ~325KB core",
        "Published on npm, one-command official bundle install",
        "Embedded browser runs in a sandboxed iframe with clear security boundaries"
      ],
      "ja": [
        "Office 三点セット／PDF／画像／Markdown のインラインプレビュー",
        "重い依存はオンデマンド分割読み込み——起動時は約 325KB のコアのみ",
        "npm 公開済み、公式 bundle をワンコマンド導入",
        "内蔵ブラウザはサンドボックス iframe で動作、安全境界が明確"
      ],
      "ko": [
        "Office 3종/PDF/이미지/Markdown 인라인 미리보기",
        "무거운 의존성은 온디맨드 분할 로드 — 시작 시 약 325KB 코어만",
        "npm 배포됨, 공식 bundle 원커맨드 설치",
        "내장 브라우저는 샌드박스 iframe에서 실행, 보안 경계 명확"
      ],
      "zh": [
        "Office 三件套 / PDF / 图片 / Markdown 内联预览",
        "重依赖按需分块：启动只拉 ~325KB 核心",
        "npm 已发布，官方 bundle 一键安装",
        "内嵌浏览器跑在沙箱 iframe，安全边界清晰"
      ]
    },
    "installCmd": "dsh plugin --profile web add dsh-better-sidebar"
  },
  "omdsh-dev/dsh-lark": {
    "intro": {
      "en": "The official Lark/Feishu channel plugin: drive DSH agents straight from Lark chats, with replies and approvals returning as messages and cards — turning Harness into an always-on teammate inside your team IM.",
      "ja": "公式の Lark（飛書）チャンネルプラグイン。Lark のチャットから DSH Agent を直接駆動し、返信や承認はメッセージ・カードとして Lark に戻る——Harness をチーム IM の中の頼れる同僚に変える。",
      "ko": "공식 Lark(페이슈) 채널 플러그인. Lark 채팅에서 DSH Agent를 직접 구동하고 답변과 승인이 메시지·카드로 돌아온다 — Harness를 팀 IM 속 상시 대기 동료로 만들어준다.",
      "zh": "官方出品的飞书 / Lark 通道插件：在飞书对话里直接驱动 DSH Agent，回复与审批以消息和卡片的形式回到飞书——把 Harness 变成团队 IM 里随叫随到的同事。"
    },
    "highlights": {
      "en": [
        "Officially maintained — one of the main homes of ongoing DSH ecosystem work",
        "Chats drive agents; approval flows come back as Lark cards",
        "Great for team collaboration and mobile use"
      ],
      "ja": [
        "公式メンテナンス、今後の DSH エコシステム維持の主要拠点の一つ",
        "チャットで Agent を駆動、承認フローは Lark カードで返る",
        "チーム協働・モバイル用途に最適"
      ],
      "ko": [
        "공식 유지보수 — 향후 DSH 생태계 유지의 주요 거점 중 하나",
        "채팅으로 Agent 구동, 승인 플로는 Lark 카드로 회신",
        "팀 협업과 모바일 시나리오에 적합"
      ],
      "zh": [
        "官方维护，后续 DSH 生态维护的主阵地之一",
        "对话驱动 Agent，审批流回飞书卡片",
        "适合团队协作与移动场景"
      ]
    },
    "installCmd": "dsh plugin --profile web add github:omdsh-dev/dsh-lark"
  },
  "whiteguo233/OpenBiliClaw": {
    "intro": {
      "en": "A local-first, open-source, cross-platform content-discovery agent: it keeps learning your interest profile, then proactively finds content across Bilibili, Xiaohongshu, Douyin, YouTube, X, Zhihu, Reddit, Weibo and the open web. Its companion DSH plugin brings the feed, library and interest dialogue right into the DSH UI.",
      "ja": "ローカル実行・オープンソースのクロスプラットフォーム・コンテンツ発見 Agent。あなたの興味プロファイルを学習し続け、bilibili・小紅書・抖音・YouTube・X・知乎・Reddit・微博などから能動的にコンテンツを探す。付属の DSH プラグインでおすすめフィードを DSH 画面に統合。",
      "ko": "로컬 실행 오픈소스 크로스플랫폼 콘텐츠 발견 Agent. 관심 프로필을 계속 학습하며 bilibili·샤오홍슈·더우인·YouTube·X·즈후·Reddit·웨이보와 오픈 웹에서 능동적으로 콘텐츠를 찾아준다. 전용 DSH 플러그인으로 추천 피드를 DSH 화면에 통합.",
      "zh": "本地运行、开源的跨平台个性化内容发现 Agent：先持续理解你的兴趣画像，再主动去 B 站、小红书、抖音、YouTube、X、知乎、Reddit、微博等平台与开放 Web 找内容。配套 DSH 插件把推荐流、内容库与兴趣对话直接搬进 DSH 界面。"
    },
    "highlights": {
      "en": [
        "Local & private: your profile and data never leave your machine",
        "Covers 11+ content platforms plus the open web",
        "DSH panel plugin + 22 Agent Bridge tools close the feed→feedback→profile loop",
        "Chrome Web Store extension, CI and releases all in place"
      ],
      "ja": [
        "ローカル＆プライベート：プロファイルとデータは端末外に出ない",
        "11+ のコンテンツプラットフォームとオープン Web をカバー",
        "DSH パネルプラグイン + 22 個の Agent Bridge ツールで推薦→フィードバック→プロファイルのループを完成",
        "Chrome ストア拡張・CI・Release 完備"
      ],
      "ko": [
        "로컬·프라이빗: 프로필과 데이터가 기기 밖으로 나가지 않음",
        "11개 이상 플랫폼과 오픈 웹 커버",
        "DSH 패널 플러그인 + 22개 Agent Bridge 도구로 추천→피드백→프로필 루프 완성",
        "Chrome 스토어 확장·CI·Release 완비"
      ],
      "zh": [
        "本地私有：画像与数据不出你的机器",
        "覆盖 11+ 内容平台与开放 Web",
        "DSH 第四栏插件 + 22 个 Agent Bridge 工具，推荐→反馈→画像闭环",
        "Chrome 商店扩展、CI 与 Release 链路完备"
      ]
    }
  },
  "zhu1090093659/dsh-web-ui": {
    "intro": {
      "en": "A plugin & skin collection for the DSH Web UI: task board (with cron scheduling), Git graph, right-side file/preview/SCM panels, mobile remote via QR pairing, whale-girl pet, live token stats and a skin center. Install plugins individually or all at once via the aggregate bundle.",
      "ja": "DSH Web UI のプラグイン＆スキン集：タスクボード（cron 定期実行対応）、Git グラフ、右側のファイル／プレビュー／SCM パネル、QR ペアリングのモバイル遠隔、クジラ娘ペット、リアルタイム token 統計、スキンセンター。個別にも、集約バンドルで一括にもインストール可能。",
      "ko": "DSH Web UI 플러그인·스킨 모음: 작업 보드(cron 예약 실행), Git 그래프, 오른쪽 파일/미리보기/SCM 패널, QR 페어링 모바일 원격, 고래소녀 펫, 실시간 token 통계, 스킨 센터. 개별 설치도, 통합 번들 일괄 설치도 가능.",
      "zh": "DSH Web UI 的插件与皮肤合集：任务看板（支持 cron 定时执行）、Git 图谱、右侧文件/预览/SCM 面板、移动端扫码远程、鲸鱼娘宠物、实时 token 统计与皮肤中心。所有插件既可独立安装，也可通过聚合包一次装齐。"
    },
    "highlights": {
      "en": [
        "Task board runs on real DSH agent sessions with status write-back",
        "Scan a QR code to control the desktop workspace from your phone",
        "8 skins fully adapted to the right-side panels",
        "Active issue triage — community feedback lands fast"
      ],
      "ja": [
        "タスクボードは実際の DSH セッションが実行し、状態を自動反映",
        "QR コードを読むだけでスマホから作業空間を遠隔操作",
        "8 種のスキンが右側パネルに完全対応",
        "issue 対応が活発でフィードバック反映が速い"
      ],
      "ko": [
        "작업 보드는 실제 DSH 세션이 실행하고 상태를 자동 반영",
        "QR 스캔으로 폰에서 데스크톱 워크스페이스 원격 제어",
        "8종 스킨이 오른쪽 패널까지 완전 대응",
        "이슈 대응이 활발해 피드백 반영이 빠름"
      ],
      "zh": [
        "任务看板由真实 DSH 会话执行，状态自动回写",
        "手机扫码即可远程控制桌面工作区",
        "8 款皮肤全面适配右侧面板",
        "issue 响应活跃，社区反馈落地快"
      ]
    }
  },
  "ayuanwong/deepseek-harness-ux": {
    "installCmd": "git clone https://github.com/ayuanwong/deepseek-harness-ux.git\ncd deepseek-harness-ux && pnpm install && pnpm run build\npnpm run dsh -- web --port 3081"
  },
  "crazywoola/dsh-balance": {
    "installCmd": "dsh plugin --profile web add dsh-balance"
  },
  "CocoSgt/dsh-inspector": {
    "installCmd": "dsh plugin --profile web add dsh-inspector"
  },
  "CocoSgt/dsh-skills": {
    "installCmd": "dsh plugin --profile web add dsh-skills"
  },
  "CocoSgt/dsh-attachments": {
    "installCmd": "dsh plugin --profile web add dsh-attachments"
  }
};

/** 取某插件在当前语言下的描述；没有人工翻译时回退 GitHub 原文。 */
export function localizePluginDescription(
  fullName: string,
  locale: string,
  fallback: string,
): string {
  return descriptions[fullName]?.[locale as Locale] ?? fallback;
}

/** 详情页富文案；没有的插件返回 undefined，页面自动降级为基础形态。 */
export function getPluginEditorial(fullName: string): PluginEditorial | undefined {
  return editorial[fullName];
}
