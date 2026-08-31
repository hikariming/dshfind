// 由 scripts/gen-plugins-real.mjs 从 Turso plugin_i18n 表生成——请勿手改。
// 文案唯一事实源在 Turso，用 scripts/set-plugin-i18n.mjs 维护；改完跑 pnpm gen:plugins 刷新本文件。
// 生成时间：2026-08-31T07:57:20.641Z
import type { Locale } from "@/i18n/config";

/** 详情页富文案：intro 长介绍 / highlights 亮点 / installCmd 安装命令覆盖。 */
export interface PluginEditorial {
  intro?: Partial<Record<Locale, string>>;
  highlights?: Partial<Record<Locale, string[]>>;
  installCmd?: string;
}

const descriptions: Record<string, Partial<Record<Locale, string>>> = {
  "0xsline/awesome-deepseek-harness": {
    "en": "A curated list of the DSH ecosystem: plugins, tools and infrastructure, sourced from the dsh-external/hub catalog and the public GitHub dsh-plugin topic.",
    "ja": "DSH エコシステムの厳選リスト：プラグイン、ツール、インフラ。データ元は dsh-external/hub のカタログと公開の GitHub dsh-plugin topic の 2 系統。",
    "ko": "DSH 생태계 엄선 목록: 플러그인, 도구, 인프라. 데이터는 dsh-external/hub 카탈로그와 공개된 GitHub dsh-plugin topic 두 곳에서 온다.",
    "zh": "DSH 生态的精选清单：插件、工具与基础设施。数据来自 dsh-external/hub 目录与公开的 GitHub dsh-plugin topic 两个来源。"
  },
  "0xsline/dsh-spotlight": {
    "en": "Keyboard-first command palette for DSH Web: one shortcut to search and jump to sessions, commands and actions — hands never leave the keyboard.",
    "ja": "DSH Web のキーボードファースト・コマンドパレット。ショートカット一発で呼び出し、セッションやコマンドを検索してそのまま実行、手はキーボードから離れない。",
    "ko": "DSH Web의 키보드 우선 커맨드 팔레트. 단축키 하나로 불러와 세션·명령을 검색하고 바로 실행, 손이 키보드를 떠나지 않는다.",
    "zh": "DSH Web 的键盘优先命令面板：一个快捷键唤起，搜索并直达会话、命令与操作，双手不离键盘。"
  },
  "2BingLing/dsh-market": {
    "en": "A plugin marketplace for DeepSeek Harness with 1,500+ plugins — Chinese-language search, a five-dimension practicality score and one-click install, available both as a website and a DSH sidebar plugin.",
    "ja": "DeepSeek Harness のプラグインマーケット。1,500 超を収録し、中国語検索・5 軸の実用スコア・ワンクリック導入に対応。Web 版と DSH サイドバー版の 2 形態で提供。",
    "ko": "DeepSeek Harness 플러그인 마켓. 1,500개 이상을 수록하고 중국어 검색, 5차원 실용 점수, 원클릭 설치를 지원하며 웹 버전과 DSH 사이드바 플러그인 두 형태로 제공.",
    "zh": "DeepSeek Harness 插件市场：持续收录 1500+ 插件，支持中文搜索、五维实用评分与一键安装，提供 Web 版与 DSH 侧边栏插件两种形态。"
  },
  "AITabby/dockyard-dsh": {
    "en": "A macOS-only native account-pool and provider plugin for DeepSeek Harness, letting you manage multiple accounts centrally and route requests across them.",
    "ja": "macOS 専用の DSH ネイティブなアカウントプール兼プロバイダ・プラグイン。複数アカウントを一元管理し、リクエストを振り分けられる。",
    "ko": "macOS 전용 DSH 네이티브 계정 풀 겸 프로바이더 플러그인. 여러 계정을 중앙에서 관리하고 요청을 분배할 수 있다.",
    "zh": "仅限 macOS 的 DSH 原生账号池与 provider 插件：集中管理多个账号并按策略分配请求。"
  },
  "AX1202/ax-feishu-bridge": {
    "en": "A Feishu/Lark bot bridge supporting both Pi and DeepSeek Harness, letting you talk to your coding assistant remotely from anywhere.",
    "ja": "Feishu / Lark ボットのブリッジ・プラグイン。Pi と DeepSeek Harness の両プラットフォームに対応し、どこからでもコーディングアシスタントと対話できる。",
    "ko": "Feishu/Lark 봇 브리지 플러그인. Pi와 DeepSeek Harness 양쪽을 지원해 어디서든 원격으로 코딩 어시스턴트와 대화할 수 있다.",
    "zh": "飞书 / Lark 机器人桥接插件：同时支持 Pi 与 DeepSeek Harness 双平台，随时随地远程与编程助手对话。"
  },
  "AdamPlatin123/awesome-dsh-plugins": {
    "en": "Front-stage index repo (Radar): every dsh plugin candidate discovered by automated scanning; entries that pass testing graduate into the curated directory repo.",
    "ja": "前段のインデックスリポジトリ（Radar）。自動スキャンで発見したすべての dsh プラグイン候補を収録し、テストに合格したものは後段の厳選ディレクトリへ移す。",
    "ko": "전단 인덱스 저장소(Radar). 자동 스캔으로 발견한 모든 dsh 플러그인 후보를 모으고, 테스트를 통과한 항목은 후단의 엄선 디렉터리 저장소로 옮긴다.",
    "zh": "DSH 插件雷达与精选榜：自动发现 9000+ 候选，容器内真实安装路径运行级实测并分四档判定，精选 Top 50 与 11 类人工策展，附全量索引。"
  },
  "Alex-Yanggg/awesome-DSH-plugin": {
    "en": "A meticulously curated list of DSH plugins, extensions, tools and development resources spanning productivity, functional expansion, debugging utilities and custom development modules.",
    "ja": "DSH 向けプラグイン・拡張・ツール・開発リソースの厳選リスト。生産性向上、機能拡張、デバッグツール、カスタム開発モジュールを網羅。",
    "ko": "DSH용 플러그인·확장·도구·개발 리소스를 꼼꼼히 엄선한 목록. 생산성 향상, 기능 확장, 디버깅 도구, 커스텀 개발 모듈까지 아우른다.",
    "zh": "精心整理的 DSH 插件、扩展、工具与开发资源清单，覆盖效率提升、功能扩展、调试工具与自定义开发模块。"
  },
  "AlliotTech/deepseek-harness-docker": {
    "en": "Docker deployment for deepseek-harness — run DSH in a container and skip local environment setup.",
    "ja": "deepseek-harness の Docker デプロイ構成。コンテナで DSH を動かし、ローカル環境の構築を省ける。",
    "ko": "deepseek-harness의 Docker 배포 구성. 컨테이너로 DSH를 실행해 로컬 환경 설정을 생략할 수 있다.",
    "zh": "deepseek-harness 的 Docker 部署方案：容器化跑起 DSH，省去本机环境配置。"
  },
  "AnacondaKC/dsh-stock-market": {
    "en": "A stock market plugin for DeepSeek Harness — finally fixes the bug where your portfolio can't lose money while you're busy writing code.",
    "ja": "DSH で株価を眺めるプラグイン。コードを書いている間は口座が損をできない、という不具合をついに解消する。",
    "ko": "DSH에서 주식 시세를 보는 플러그인. 코드를 쓰는 동안 계좌가 손실을 낼 수 없다는 버그를 마침내 해결한다.",
    "zh": "在 DSH 里看股票行情的插件——有效解决了写代码时账户不能同时亏钱的问题。"
  },
  "Anionex/agent-vision-toolkit": {
    "en": "The upstream toolkit that lets text-only models handle vision tasks. On DSH it arrives through its independently maintained dsh-vision-toolkit package, bringing 10 structured visual tools into Web and Headless profiles.",
    "ja": "テキスト専用モデルに視覚タスクをこなさせる上流ツールボックス。DSH へは独立管理の dsh-vision-toolkit パッケージ経由で入り、10 の構造化ビジュアルツールを Web と Headless の profile にもたらす。",
    "ko": "텍스트 전용 모델이 비전 작업을 하게 해 주는 상류 툴박스. DSH에는 독립 관리되는 dsh-vision-toolkit 패키지를 통해 들어가며, 10개의 구조화된 시각 도구를 Web과 Headless profile에 가져온다.",
    "zh": "让纯文本模型做视觉任务的上游工具箱。进 DSH 走它独立维护的 dsh-vision-toolkit 包，把 10 个结构化视觉工具带进 Web 与 Headless profile。"
  },
  "Anionex/dsh-computer-use": {
    "en": "An accessibility-first macOS computer-use bundle for DeepSeek Harness with fresh observations, stale-state rejection, scoped permissions and safe input handling.",
    "ja": "macOS 向け Computer Use バンドル。Accessibility ベースの新鮮な観測、古い状態の拒否、スコープ付き権限、安全な入力処理で操作の安全境界を固めている。",
    "ko": "macOS용 컴퓨터 제어 번들. 접근성 기반의 최신 관측, 오래된 상태 거부, 범위 지정 권한, 안전한 입력 처리로 조작의 안전 경계를 확보.",
    "zh": "macOS 电脑控制 Bundle：基于 Accessibility 的新鲜观测、过期状态拒绝、作用域权限与安全输入，把 Computer Use 的安全边界做扎实。"
  },
  "Anionex/dsh-turn-rewind": {
    "en": "Message-anchored project-file recovery for DSH: open Rewind under any user message, preview path-level drift, review a full or selective restore plan, then choose between restoring the files alone or restoring and restarting from before that message. Underneath sits the Change Ledger durable restore engine.",
    "ja": "メッセージを起点にした DSH のプロジェクトファイル復旧プラグイン。任意のユーザーメッセージの下から Rewind を開き、パス単位の差分をプレビューし、完全または選択的な復元プランを確認してから、ファイルだけ戻すか、そのメッセージの前から再開するかを選べる。下層には Change Ledger という永続復元エンジンがある。",
    "ko": "메시지를 기준점으로 삼는 DSH 프로젝트 파일 복구 플러그인. 아무 사용자 메시지 아래에서 Rewind를 열어 경로 단위 변동을 미리 보고, 전체 또는 선택적 복원 계획을 검토한 뒤, 파일만 되돌릴지 그 메시지 이전 지점부터 다시 시작할지 고른다. 그 아래에는 Change Ledger라는 지속 복원 엔진이 있다.",
    "zh": "以消息为锚点的 DSH 项目文件恢复插件：在任意用户消息下点开 Rewind，预览路径级改动，审阅完整或选择性恢复方案，再决定是只还原文件还是连带从这条消息之前重新开始。底层是 Change Ledger 持久恢复引擎。"
  },
  "Anionex/dsh-vision-toolkit": {
    "en": "DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, long-screenshot OCR, UI restoration, grounding, pixel diff, Artifacts, and Web UI.",
    "ja": "テキスト専用モデルに視覚タスクをこなさせる DeepSeek Harness プラグイン：意図つき画像 Q&A、長尺スクリーンショット OCR、UI 復元など。",
    "ko": "텍스트 전용 모델이 비전 작업을 잘하게 해 주는 DeepSeek Harness 플러그인: 의도 기반 이미지 Q&A, 긴 스크린샷 OCR, UI 복원 등.",
    "zh": "让纯文本模型更好地做视觉任务的 DeepSeek Harness 插件：带意图的图片问答、长截图 OCR、UI 还原等。"
  },
  "Areium/dsh-fail-logger": {
    "en": "Automatically logs why tools failed across every execution mode — native tools, PTC run_code and inline tool calls — then dedupes, counts and deterministically sorts them into a machine-maintained section of a skill so the agent repeats fewer mistakes over time.",
    "ja": "あらゆる実行モード（ネイティブツール / PTC run_code / コード内蔵の呼び出し）でのツール失敗原因を自動記録。重複排除・集計・確定的な並べ替えを経てスキルの機械管理領域に蓄積し、同じ失敗を繰り返させない。",
    "ko": "모든 실행 모드(네이티브 도구, PTC run_code, 코드 내장 호출)의 도구 실패 원인을 자동 기록. 중복 제거·집계·결정적 정렬을 거쳐 스킬의 기계 관리 구역에 축적해 같은 실수를 줄인다.",
    "zh": "自动记录各种执行模式下的工具失败原因：去重、计数、确定性排序后沉淀进技能的机器维护实录区段，让 Agent 越用越少犯同样的错。"
  },
  "AwesomeHou/dsh-plugin-marketplace": {
    "en": "A plugin marketplace for DeepSeek Harness that live-syncs the 1,800+ repos under the GitHub dsh-plugin topic into a searchable, paginated settings tab with one-click install and market_search / market_install agent tools.",
    "ja": "DSH プラグインマーケット。GitHub の dsh-plugin トピック配下 1,800 超のリポジトリをリアルタイム同期し、検索・ページング可能な設定タブとワンクリック導入、market_search / market_install ツールを提供。",
    "ko": "DSH 플러그인 마켓. GitHub dsh-plugin 토픽의 1,800개 이상 저장소를 실시간 동기화해 검색·페이지네이션 가능한 설정 탭으로 만들고 원클릭 설치와 market_search / market_install 도구를 제공.",
    "zh": "DSH 插件市场：实时同步 GitHub dsh-plugin 主题下 1800+ 仓库，做成可搜索分页的设置页标签，支持一键安装与 market_search / market_install 两个 Agent 工具。"
  },
  "Awu12277/dsh-stock-watch": {
    "en": "A real-time A-share watchlist plugin for DeepSeek Harness, showing live quotes in a collapsible popup at the top-right of the DSH web UI.",
    "ja": "中国 A 株のウォッチリスト・リアルタイム相場プラグイン。DSH Web の右上に折りたためる相場ポップアップを表示する。",
    "ko": "중국 A주 관심 종목 실시간 시세 플러그인. DSH 웹 우측 상단에 접을 수 있는 시세 팝업을 표시한다.",
    "zh": "A 股自选股实时行情盯盘插件：在 DSH Web 右上角提供可折叠的行情弹窗。"
  },
  "Ayase34/gal-view": {
    "en": "Switches the DeepSeek Harness conversation view into a galgame-style interface, presenting the chat as a visual-novel scene.",
    "ja": "dsh の会話画面をギャルゲー風に切り替えるプラグイン。チャットをビジュアルノベル風の演出画面として表示する。",
    "ko": "dsh 대화 화면을 갤게임 스타일로 전환하는 플러그인. 채팅을 비주얼 노벨 연출 화면으로 보여준다.",
    "zh": "把 dsh 会话界面切换成 galgame 风格：对话变成视觉小说式的演出界面。"
  },
  "CanglongCl/dsh-web-review": {
    "en": "Web preview and element annotation for the DSH web GUI — mark up a live preview and let the agent edit the frontend source directly from your visual feedback.",
    "ja": "DSH Web GUI の Web プレビュー＆要素注釈プラグイン。プレビュー上で直接印を付けると、AI がその視覚的フィードバックを元にフロントエンドのソースを修正する。",
    "ko": "DSH 웹 GUI의 웹 미리보기·요소 주석 플러그인. 미리보기 위에 바로 표시하면 AI가 그 시각적 피드백을 근거로 프런트엔드 소스를 수정한다.",
    "zh": "DSH Web GUI 的网页预览与元素批注插件：在预览界面直接圈注，让 AI 依据可视化反馈修改前端源码。"
  },
  "ChangedenCZD/dsh-minimal-turbo": {
    "en": "Windows adaptation for DeepSeek Harness minimal and wish modes, so Windows users can run the full DeepSeek-V4 model family smoothly.",
    "ja": "DeepSeek Harness のミニマルモード／ウィッシュモードの Windows 対応。Windows でもフル性能の DeepSeek-V4 系モデルを快適に使えるようにする。",
    "ko": "DeepSeek Harness 미니멀 모드·위시 모드의 Windows 대응. Windows에서도 풀 성능 DeepSeek-V4 계열 모델을 원활히 쓸 수 있게 한다.",
    "zh": "DeepSeek Harness 极简模式 / 许愿模式的 Windows 适配：让 Windows 用户也能顺畅用上满血 DeepSeek-V4 系列模型。"
  },
  "ChenRuoT/dsh-sidebar-qa": {
    "en": "A sidebar Q&A tab built on DSH-better-sidebar, bringing a Codex-style side query or Claude Code /btw experience into DeepSeek Harness.",
    "ja": "DSH-better-sidebar を土台にしたサイドバー質問タブ。Codex のサイド質問や Claude Code の /btw のような気軽な問い合わせを実現する。",
    "ko": "DSH-better-sidebar를 기반으로 한 사이드바 질문 탭. Codex의 사이드 질문이나 Claude Code의 /btw 같은 가벼운 문의 경험을 제공.",
    "zh": "基于 DSH-better-sidebar 的侧边栏提问标签页：实现类似 Codex 侧边提问或 Claude Code /btw 的随手发问体验。"
  },
  "Chinesezjc/dsh-interconnect": {
    "en": "Cross-instance message and event handoff for DeepSeek Harness — an interconnect service plus tools that let multiple Harness instances pass tasks and state between each other.",
    "ja": "DSH のインスタンス間メッセージ／イベント受け渡しプラグイン。interconnect サービスと専用ツールで複数の Harness 間にタスクや状態を引き継げる。",
    "ko": "DSH 인스턴스 간 메시지·이벤트 전달 플러그인. interconnect 서비스와 전용 도구로 여러 Harness 인스턴스 사이에 작업과 상태를 주고받을 수 있다.",
    "zh": "DSH 跨实例消息与事件交接插件：提供 interconnect 服务与配套工具，让多个 Harness 实例之间互相传递任务与状态。"
  },
  "ChisaAlter/Deepseek-Harness-Desktop": {
    "en": "An Electron desktop shell around the official DeepSeek Harness web UI: it doesn't rebuild the chat interface, only handling windows, tray, workspaces, API keys and launch orchestration — plus reasoning-effort levels for third-party models, a vision-model fallback, custom themes and backgrounds, and a plugin market.",
    "ja": "DeepSeek Harness 公式 Web UI をベースにした Electron デスクトップシェル。チャット画面は作り直さず、ウィンドウ・トレイ・ワークスペース・API Key・起動オーケストレーションだけを担当し、加えてサードパーティモデルの思考強度、画像認識モデルのフォールバック、カスタムテーマと背景画像、プラグインマーケットを補っている。",
    "ko": "DeepSeek Harness 공식 Web UI를 감싼 Electron 데스크톱 셸. 채팅 화면을 다시 만들지 않고 창·트레이·워크스페이스·API Key·시작 오케스트레이션만 담당하며, 여기에 서드파티 모델 사고 강도, 이미지 인식 모델 폴백, 커스텀 테마와 배경 이미지, 플러그인 마켓을 더했다.",
    "zh": "基于 DeepSeek Harness 官方 Web UI 的 Electron 桌面壳：不重做聊天界面，只负责窗口、托盘、工作区、API Key 和启动编排，另补了第三方模型思考强度、识图模型兜底、自定义主题背景图和插件市场。"
  },
  "Clizo1209/dsh-playwright-browser": {
    "en": "Playwright browser automation for DeepSeek Harness, letting the agent drive a real browser to carry out web tasks.",
    "ja": "DeepSeek Harness 向けの Playwright ブラウザ自動化プラグイン。エージェントが実ブラウザを直接操作して Web タスクを実行できる。",
    "ko": "DeepSeek Harness용 Playwright 브라우저 자동화 플러그인. 에이전트가 실제 브라우저를 직접 조작해 웹 작업을 수행한다.",
    "zh": "面向 DeepSeek Harness 的 Playwright 浏览器自动化插件：让 Agent 直接驱动真实浏览器完成网页操作。"
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
  "DDDMUC/dsh-free-search": {
    "en": "A free web search provider for DeepSeek Harness backed by DuckDuckGo — no API key required.",
    "ja": "無料の DSH 用 Web 検索プロバイダ。DuckDuckGo をバックエンドに使い、API キーは不要。",
    "ko": "무료 DSH 웹 검색 프로바이더. DuckDuckGo를 백엔드로 사용하며 API 키가 필요 없다.",
    "zh": "免费的 DSH 网页搜索 provider：以 DuckDuckGo 为后端，不需要任何 API key。"
  },
  "Devin-AXIS/iPolloWork": {
    "en": "A local-first visual AI workbench that turns one goal into editable code, documents, presentations, websites, designs and videos. Its DSH subagent collaboration is still in development and not in the stable release yet.",
    "ja": "ローカルファーストのビジュアル AI ワークベンチ。一つのゴールを、編集を続けられるコード・ドキュメント・プレゼン・ウェブサイト・デザイン・動画に変える。DSH とのサブエージェント連携は開発中で、安定版には未搭載。",
    "ko": "로컬 우선 비주얼 AI 작업대. 하나의 목표를 계속 편집할 수 있는 코드·문서·프레젠테이션·웹사이트·디자인·영상으로 바꾼다. DSH 서브에이전트 협업은 아직 개발 중이며 안정 릴리스에 없다.",
    "zh": "本地优先的可视化 AI 工作台，把一个目标变成可继续编辑的代码、文档、演示、网站、设计与视频。与 DSH 的子代理协作仍在开发中，尚未进入稳定版。"
  },
  "DietCokewithSugar/dsh-user-experience": {
    "en": "A persona-driven UX walkthrough plugin for DeepSeek Harness — scans React and TypeScript source for UX issues, pinpoints where they are and suggests fixes.",
    "ja": "ペルソナ主導の UX ウォークスルー・プラグイン。React + TypeScript のソースを走査して UX の問題を見つけ、該当箇所を特定して修正案を提示する。",
    "ko": "페르소나 기반 UX 워크스루 플러그인. React와 TypeScript 소스를 스캔해 UX 문제를 찾아 위치를 짚어주고 수정안을 제안한다.",
    "zh": "以人物角色驱动的 UX 走查插件：扫描 React + TypeScript 源码找出体验问题，定位到具体位置并给出修改建议。"
  },
  "Dominic789654/awesome-deepseek-harness": {
    "en": "A curated list of DeepSeek Harness plugins, skills, MCP servers, patch/profile layers, orchestrators and UIs — spanning visualisation, slide decks, coding, agents and auto-research loops.",
    "ja": "DSH エコシステムの厳選リスト。プラグイン、スキル、MCP サーバー、patch/profile 層、オーケストレータ、UI を収録し、可視化・スライド・コーディング・エージェント・自動リサーチまで網羅。",
    "ko": "DSH 생태계 엄선 목록. 플러그인, 스킬, MCP 서버, patch/profile 계층, 오케스트레이터, UI를 수록하며 시각화·슬라이드·코딩·에이전트·자동 리서치를 아우른다.",
    "zh": "DSH 生态精选清单：插件、技能、MCP 服务器、patch/profile 层、编排器与界面，覆盖可视化、PPT、编码、Agent 与自动研究循环。"
  },
  "Electricitysheep/dsh-handbook": {
    "en": "The DeepSeek Harness handbook: a 14-chapter Chinese-language guide from zero to one, with every chapter's commands actually tested, readable online or as a PDF.",
    "ja": "DeepSeek Harness ホワイトペーパー。ゼロからイチまでの中国語入門書 14 章で、各章のコマンドはすべて実測済み。オンライン閲覧と PDF の両方に対応。",
    "ko": "DeepSeek Harness 백서. 0에서 1까지 다루는 중국어 입문서 14장으로, 각 장의 명령을 모두 실측했다. 온라인 열람과 PDF 모두 제공.",
    "zh": "DeepSeek Harness 白皮书：14 章从 0 到 1 的中文新手百科，每章命令都实测过，可在线读也可下 PDF。"
  },
  "Ephemeral-AI-Lab/dsh-plugins": {
    "en": "A collection of DeepSeek Harness plugins from Ephemeral AI Lab, aimed at making DSH better to work with.",
    "ja": "Ephemeral AI Lab による DSH プラグイン集。DeepSeek Harness の使い勝手を高めることを目的としている。",
    "ko": "Ephemeral AI Lab이 만든 DSH 플러그인 모음. DeepSeek Harness 사용 경험을 개선하는 데 초점을 맞춘다.",
    "zh": "Ephemeral AI Lab 出品的 DSH 插件集合，围绕增强 DeepSeek Harness 使用体验展开。"
  },
  "Ericwong5021/deepseek-plugin-store": {
    "en": "An independent community plugin store for DeepSeek Harness — discover, install and submit verified plugins, tools and extensions.",
    "ja": "独立した DSH コミュニティ・プラグインストア。検証済みのプラグイン、ツール、拡張を発見・導入・投稿できる。",
    "ko": "독립적인 DSH 커뮤니티 플러그인 스토어. 검증된 플러그인, 도구, 확장을 발견하고 설치하며 제출할 수 있다.",
    "zh": "独立的 DSH 社区插件商店：发现、安装并提交经过验证的插件、工具与扩展。"
  },
  "EthanYoQ/AI-Novel-Writer": {
    "en": "A local-first AI novel writing workspace with characters, outlines, chapter blueprints, review-and-revise flows and local model support — available as Windows/macOS desktop apps and a DeepSeek Harness plugin preview.",
    "ja": "ローカルファーストの AI 小説執筆ワークスペース。キャラクター、プロット、章立て、校閲・改稿、ローカルモデルに対応し、Windows/macOS デスクトップ版と DSH プラグインのプレビューを提供。",
    "ko": "로컬 우선 AI 소설 창작 워크스페이스. 캐릭터, 개요, 챕터 청사진, 검토·수정 흐름과 로컬 모델을 지원하며 Windows/macOS 데스크톱 버전과 DSH 플러그인 프리뷰를 제공.",
    "zh": "本地优先的 AI 小说创作工作台：支持角色、大纲、章节蓝图、审稿修稿与本地模型，提供 Windows / macOS 桌面版与 DSH 插件开发预览。"
  },
  "FSMargoo/dsh-at-file": {
    "en": "Type @ in the DSH composer to search the current workspace and insert a file or directory path. The plugin passes the path only — never the contents — leaving it to the agent to decide whether to open it.",
    "ja": "DSH の入力欄で @ を打つと現在のワークスペースを検索し、ファイルやディレクトリのパスを挿入できる。プラグインが渡すのはパスのみで内容は読まず、開くかどうかは agent が判断する。",
    "ko": "DSH 입력창에서 @를 입력하면 현재 워크스페이스를 검색해 파일이나 디렉터리 경로를 삽입한다. 플러그인은 경로만 전달하고 내용은 읽지 않으며, 열지 여부는 agent가 정한다.",
    "zh": "在 DSH 输入框里打 @ 就能搜当前工作区、插入文件或目录路径。插件只递路径不读内容，要不要打开由 agent 自己决定。"
  },
  "Favio8/dsh-plugin-deepeye": {
    "en": "The DeepEye vision plugin for DeepSeek Harness — image description, OCR, visual question answering, UI layout recognition and clipboard image analysis.",
    "ja": "DeepEye ビジョンプラグイン。画像説明、OCR、視覚質問応答、UI レイアウト認識、クリップボード画像の解析を DSH に提供する。",
    "ko": "DeepEye 비전 플러그인. 이미지 설명, OCR, 시각 질의응답, UI 레이아웃 인식, 클립보드 이미지 분석을 DSH에 제공.",
    "zh": "DeepEye 视觉插件：为 DSH 提供图像描述、OCR、视觉问答、UI 布局识别与剪贴板图片分析。"
  },
  "Fishquito7/dsh-skill-mcp-panel": {
    "en": "A skill and MCP management panel for the DSH web UI, letting you view, toggle and configure skills and MCP servers from one place in the browser.",
    "ja": "DSH Web UI 用のスキル／MCP 管理パネル。ブラウザ上で skill と MCP サーバーを一元的に確認・オンオフ・設定できる。",
    "ko": "DSH 웹 UI용 스킬·MCP 관리 패널. 브라우저에서 스킬과 MCP 서버를 한곳에서 확인·전환·설정할 수 있다.",
    "zh": "DSH Web UI 的技能与 MCP 管理面板：在网页界面里集中查看、启停与配置 skill 和 MCP 服务。"
  },
  "Fishsb/dsh-prompt-enhancer": {
    "en": "One-click prompt enhancement for DeepSeek Harness, bundled with a one-click restart for when the DSH service misbehaves.",
    "ja": "プロンプトをワンクリックで強化するプラグイン。DSH サービスに異常が出たときのワンクリック再起動機能も備える。",
    "ko": "프롬프트를 원클릭으로 강화하는 플러그인. DSH 서비스에 이상이 생겼을 때 원클릭 재시작 기능도 함께 제공.",
    "zh": "提示词一键增强插件，并附 DSH 服务异常时的一键重启能力。"
  },
  "Flyvhidbwo/dsh-vision-proxy": {
    "en": "Keeps DeepSeek as the brain while adding automatic image reading — attached images are transcribed by any OpenAI-compatible VLM before reaching DeepSeek, with automatic local Ollama detection when no key is set so images never leave your machine.",
    "ja": "DeepSeek を頭脳に据えたまま画像認識を追加。添付画像を OpenAI 互換 VLM でテキスト化してから DeepSeek に渡し、キー未設定時はローカルの Ollama を自動検出するため画像は端末外に出ない。",
    "ko": "DeepSeek를 두뇌로 두면서 자동 이미지 인식을 추가. 첨부 이미지를 OpenAI 호환 VLM으로 텍스트화한 뒤 DeepSeek에 넘기며 키가 없으면 로컬 Ollama를 자동 탐지해 이미지가 기기를 벗어나지 않는다.",
    "zh": "DeepSeek 大脑 + 自动识图：界面附加的图片先经 OpenAI 兼容视觉模型转成文字再交给 DeepSeek 作答，无 key 时自动探测本地 Ollama，图片不出本机。"
  },
  "GanyuanRan/Aegis": {
    "en": "A method pack that makes AI coding agents trustworthy: they align with your project's real baseline — owners, contracts, boundaries — before editing, and ship completion claims with fresh verification evidence. On a frozen A/B benchmark, contract pass rate went 61.67% → 93.33% and unsafe outcomes 13.33% → 0%.",
    "ja": "AI コーディング Agent を信頼できるものにするメソッドパック。コードに触れる前にプロジェクトの実際のベースライン（所有者・契約・境界）と整合し、「完了」の主張には新鮮な検証証拠を添える。凍結 A/B ベンチマークで契約合格率 61.67%→93.33%、危険な結果 13.33%→0%。",
    "ko": "AI 코딩 에이전트를 신뢰할 수 있게 만드는 메서드 팩. 코드를 건드리기 전에 프로젝트의 실제 기준선(소유자·계약·경계)과 정렬하고, '완료' 주장에는 신선한 검증 증거를 붙인다. 동결 A/B 벤치마크에서 계약 통과율 61.67%→93.33%, 위험한 결과 13.33%→0%.",
    "zh": "让 AI 编程 Agent 变得可信的方法包：动手前先对齐项目真实基线（归属、契约、边界），完工时必须交出新鲜的验证证据，简单任务仍走快车道。冻结 A/B 基准上契约通过率 61.67%→93.33%，不安全结果 13.33%→0%。"
  },
  "Ghost011118/dsh-balance-meter": {
    "en": "A DeepSeek account balance and session cost readout embedded in the DeepSeek Harness web GUI.",
    "ja": "DSH Web GUI 上で DeepSeek のアカウント残高と当該セッションのコストを直接確認できる。",
    "ko": "DSH 웹 GUI에서 DeepSeek 계정 잔액과 현재 세션 비용을 바로 확인할 수 있다.",
    "zh": "在 DSH Web GUI 里直接查看 DeepSeek 账户余额与本次会话成本。"
  },
  "Han-1413141/dsh-cost-meter": {
    "en": "A session cost meter for DeepSeek Harness — per-session and daily cost, budgets, history, official and custom-provider balances, a Codex-like token heatmap, plus peak/off-peak pricing with pre-switch popups and system notifications.",
    "ja": "DSH のセッションコスト計測プラグイン。セッション別・日次コスト、予算、履歴、公式および独自プロバイダの残高、Codex 風 token ヒートマップ、ピーク/オフピーク料金と切替前ポップアップ通知を備える。",
    "ko": "DSH 세션 비용 측정 플러그인. 세션별·일별 비용, 예산, 이력, 공식 및 커스텀 프로바이더 잔액, Codex 스타일 토큰 히트맵, 피크/오프피크 요금과 전환 전 팝업 알림을 제공.",
    "zh": "DSH 会话成本计量插件：会话与每日成本、预算、历史、官方与自定义 provider 余额、Codex 风格 token 热力图，还有峰谷计价与切换前弹窗提醒。"
  },
  "HanaAyane/dsh-reasoning-effort": {
    "en": "A Codex-style model and reasoning-effort slider for DeepSeek Harness, giving you direct control over thinking depth — plus a running BigFish variant.",
    "ja": "Codex 風のモデル／推論強度スライダー。DSH で思考の深さを直感的に調整でき、走るビッグフィッシュ版スライダーも用意。",
    "ko": "Codex 스타일의 모델·추론 강도 슬라이더. DSH에서 사고 깊이를 직관적으로 조절할 수 있고 달리는 빅피시 버전 슬라이더도 제공.",
    "zh": "Codex 风格的模型与推理强度滑块：为 DSH 提供直观的思考强度调节，另附大肥鱼跑步动画滑块。"
  },
  "HeiGeAi/deepseek-harness-skin": {
    "en": "A skin system for DeepSeek Harness with 21 built-in themes plus custom palettes generated from a single image — data-source driven, contrast-preserving and readability-validated at build time.",
    "ja": "DSH の着せ替えシステム。21 種の内蔵スキンに加え、画像 1 枚から配色一式を生成できる。データ駆動でコントラストを保ち、ビルド時に可読性を検証する。",
    "ko": "DSH 스킨 시스템. 21종 내장 스킨에 더해 이미지 한 장으로 전체 배색을 생성할 수 있다. 데이터 기반으로 대비를 유지하며 빌드 시점에 가독성을 검증한다.",
    "zh": "DSH 换肤系统：21 套内置皮肤，还能用一张图生成整套配色，数据源驱动、保对比度推导、构建期校验可读性。"
  },
  "Hilbert-beinghappy/seektty": {
    "en": "A pluggable, DeepSeek-coloured TUI for DeepSeek Harness — a terminal interface themed to match the official visual language.",
    "ja": "差し替え可能な DeepSeek カラーの TUI。公式のビジュアルに合わせたターミナル UI を DSH に提供する。",
    "ko": "교체 가능한 DeepSeek 색상 TUI. 공식 비주얼에 맞춘 터미널 인터페이스를 DSH에 제공.",
    "zh": "可插拔的 DeepSeek 配色终端界面：为 DSH 提供一套贴合官方视觉的 TUI 主题与交互。"
  },
  "HsiangNianian/dsh-auto-continue": {
    "en": "Auto-resumes requests interrupted by non-human causes in the DSH web UI — error classification, adaptive backoff, pause, idempotency and loop guards, templated resume text, all configurable from a settings card.",
    "ja": "人為以外の理由で中断されたリクエストを自動再開。エラー分類、適応的バックオフ、一時停止、冪等性とループのガード、テンプレート化された再開文言をすべて設定カードから調整できる。",
    "ko": "사람이 아닌 원인으로 중단된 요청을 자동으로 이어간다. 오류 분류, 적응형 백오프, 일시정지, 멱등성·루프 가드, 템플릿 재개 문구를 모두 설정 카드에서 조정할 수 있다.",
    "zh": "自动续跑被非人为原因打断的请求：错误分类、自适应退避、暂停、幂等与循环守卫、可模板化的续跑文案，全部可在设置卡片里配置。"
  },
  "HuanLinOTO/dsh-plugin-d399": {
    "en": "Pops up a mini-game menu while the model is generating — Wordle, match-3 and 192 parametric mini-games behind an extensible registry.",
    "ja": "モデルの生成中に右下でミニゲームメニューを表示。Wordle、マッチ 3、192 種のパラメトリックなミニゲームを拡張可能なレジストリで提供。",
    "ko": "모델이 생성하는 동안 우측 하단에 미니게임 메뉴를 띄운다. Wordle, 매치3, 192종 파라메트릭 미니게임을 확장 가능한 레지스트리로 제공.",
    "zh": "模型生成时在右下角弹出小游戏菜单：Wordle、消消乐与 192 款参数化小游戏，注册表可扩展。"
  },
  "HuanLinOTO/dsh-plugin-mineru": {
    "en": "Exposes MinerU document-parsing tools to the model, converting PDF, images, DOCX, PPTX and XLSX into structured Markdown or JSON.",
    "ja": "MinerU の文書解析ツールをモデルに公開。PDF・画像・DOCX・PPTX・XLSX を構造化された Markdown / JSON に変換する。",
    "ko": "MinerU 문서 파싱 도구를 모델에 노출. PDF, 이미지, DOCX, PPTX, XLSX를 구조화된 Markdown 또는 JSON으로 변환한다.",
    "zh": "向模型暴露 MinerU 文档解析工具：把 PDF、图片、DOCX、PPTX、XLSX 转成结构化 Markdown 或 JSON。"
  },
  "HuanLinOTO/dsh-plugin-pet-rs": {
    "en": "A Rust-built desktop pet for DeepSeek Harness — a five-state whale with dual SSE real-time push, a transparent always-on-top window and tray integration, running cross-platform.",
    "ja": "Rust 製の DSH デスクトップペット。5 状態のクジラ、二重 SSE のリアルタイム更新、透明な最前面ウィンドウ、システムトレイに対応し、3 プラットフォームで動く。",
    "ko": "Rust로 만든 DSH 데스크톱 펫. 5가지 상태의 고래, 이중 SSE 실시간 푸시, 투명 항상 위 창, 시스템 트레이를 지원하며 3개 플랫폼에서 동작.",
    "zh": "Rust 版 DSH 桌宠：5 态鲸鱼、双 SSE 实时推送、透明置顶窗口与系统托盘，支持三端。"
  },
  "HuanLinOTO/dsh-plugin-yet-another-subagent": {
    "en": "A configurable subagent profile system for DeepSeek Harness — one subagent tool plus a profile parameter, with web UI settings, real-time progress and a subagent tree view.",
    "ja": "設定可能なサブエージェント profile システム。単一の subagent ツールと profile パラメータの組み合わせで、Web UI 設定・リアルタイム進捗・サブエージェントツリーを備える。",
    "ko": "설정 가능한 서브에이전트 profile 시스템. 단일 subagent 도구와 profile 파라미터 조합으로 웹 UI 설정, 실시간 진행률, 서브에이전트 트리를 제공.",
    "zh": "可配置的子代理 profile 系统：单一 subagent 工具搭配 profile 参数，附 Web UI 设置、实时进度与子代理树视图。"
  },
  "JingbiaoMei/Tokdash": {
    "en": "A local token and cost dashboard for AI coding tools: exact input/output/cache token breakdowns, a contribution calendar with 2D heatmap and 3D isometric views, per-session drill-down, and subscription quota windows with reset countdowns. Day-one DeepSeek Harness support, read locally from `~/.dsh` with nothing to configure.",
    "ja": "AI コーディングツール向けのローカル token / コストダッシュボード。入力・出力・キャッシュに分解した正確な token 数、2D ヒートマップと 3D アイソメトリック表示のコントリビューションカレンダー、セッション単位のドリルダウン、サブスク枠のウィンドウとリセットカウントダウンを備える。DeepSeek Harness は初日から対応し、`~/.dsh` からローカルに読み取るので設定は不要。",
    "ko": "AI 코딩 도구용 로컬 토큰·비용 대시보드. 입력·출력·캐시로 나눈 정확한 토큰 수, 2D 히트맵과 3D 아이소메트릭 뷰를 갖춘 기여 캘린더, 세션별 드릴다운, 구독 할당량 창과 리셋 카운트다운을 제공한다. DeepSeek Harness는 첫날부터 지원되며 `~/.dsh`에서 로컬로 읽어 설정이 필요 없다.",
    "zh": "本地运行的 AI 编程工具 token 与成本仪表盘：精确的输入/输出/缓存 token 拆分、贡献日历热力图（含 3D 等距视图）、按会话下钻、订阅额度窗口与重置倒计时。DeepSeek Harness 首日支持，从 `~/.dsh` 本地读取，零配置。"
  },
  "JustGenius-s/DSH-Desktop": {
    "en": "DSH-Desktop — a desktop client wrapper for DeepSeek Harness that turns the web UI into a standalone application.",
    "ja": "DSH-Desktop。DeepSeek Harness のデスクトップクライアント・ラッパーで、Web UI を単体アプリとして扱える。",
    "ko": "DSH-Desktop. DeepSeek Harness의 데스크톱 클라이언트 래퍼로 웹 UI를 독립 애플리케이션으로 만든다.",
    "zh": "DSH-Desktop：DeepSeek Harness 的桌面客户端封装，把 Web UI 变成独立应用。"
  },
  "Khorsheed/dsh-ankh-guard": {
    "en": "A guard plugin that stops self-modifying agents from breaking your service — green-build credentials bound to git HEAD block restarts after a bad change, with a seamless watchdog restart and automatic canary rollback.",
    "ja": "エージェントの自己改変でサービスを壊さないための保護プラグイン。グリーンビルドの証跡を git HEAD に紐付け、壊れた変更では再起動を許さない。watchdog による無停止再起動と canary 自動ロールバックつき。",
    "ko": "에이전트의 자기 수정으로 서비스가 망가지는 것을 막는 보호 플러그인. 그린 빌드 자격 증명을 git HEAD에 묶어 잘못된 변경 후에는 재시작을 막고, 워치독 무중단 재시작과 카나리 자동 롤백을 제공.",
    "zh": "防止 Agent 自我修改把服务改崩的守护插件：绿色构建凭证绑定 git HEAD，改坏就不许重启；watchdog 无感重启并支持 canary 自动回滚。"
  },
  "LX2000WASD/dsh-web-plugin-manager": {
    "en": "A full plugin manager inside the DSH web UI — browse, toggle live, install/uninstall, detect updates, run dependency and conflict health checks, manage environments and browse a marketplace.",
    "ja": "DSH Web UI 上のフル機能プラグイン管理ツール。一覧・即時オン/オフ・インストール/削除・更新検知・依存と競合のヘルスチェック・環境管理・マーケットまで網羅。",
    "ko": "DSH 웹 UI 안의 완전한 플러그인 관리자. 조회, 실시간 활성화, 설치·삭제, 업데이트 감지, 의존성·충돌 헬스 체크, 환경 관리, 마켓까지 포괄.",
    "zh": "Web UI 里的 DSH 插件全功能管理器：查看、实时启停、安装卸载、更新检测、依赖与冲突健康检查、环境管理与插件市场，bundle 与非 bundle 全覆盖。"
  },
  "Laplace-bit/dsh-smooth-stream": {
    "en": "A DeepSeek Harness web UI plugin for fluid streaming rendering and silky scrolling, smoothing out the jitter of long token-by-token replies.",
    "ja": "DSH Web UI のストリーミング描画を滑らかにするプラグイン。逐次出力とスクロールをなめらかにし、長い応答時のガタつきを抑える。",
    "ko": "DSH 웹 UI의 스트리밍 렌더링을 부드럽게 하는 플러그인. 토큰 단위 출력과 스크롤을 매끄럽게 만들어 긴 응답의 흔들림을 줄인다.",
    "zh": "DSH Web UI 的流式渲染优化插件：让逐字输出更流畅、滚动更丝滑，减少长回复时的跳动感。"
  },
  "LaplaceYoung/oh-my-dsh": {
    "en": "A plugin capability library for DSH: it works through opencode, oh-my-pi, Codex CLI, Claude Code, Goose, Aider, LangGraph and other mature harnesses item by item, rewriting the useful capabilities as plugins adapted to DSH's seams and conventions — registering only through extension seams, never modifying the agent-loop skeleton or adding hot-path overhead.",
    "ja": "DSH 向けのプラグイン能力ライブラリ。opencode、oh-my-pi、Codex CLI、Claude Code、Goose、Aider、LangGraph などの成熟した harness を一項目ずつ突き合わせ、有用な能力を DSH の接ぎ目と規約に合わせたプラグインとして書き直す。登録は拡張の接ぎ目経由のみで、agent-loop の骨格は変えず、ホットパスにオーバーヘッドを持ち込まない。",
    "ko": "DSH를 위한 플러그인 능력 라이브러리. opencode, oh-my-pi, Codex CLI, Claude Code, Goose, Aider, LangGraph 같은 성숙한 하네스를 하나씩 대조해, 유용한 능력을 DSH의 이음매와 관례에 맞춘 플러그인으로 다시 쓴다. 등록은 확장 이음매를 통해서만 하고 agent-loop 골격은 건드리지 않으며 핫패스 오버헤드도 만들지 않는다.",
    "zh": "面向 DSH 的插件能力库：逐项对照 opencode、oh-my-pi、Codex CLI、Claude Code、Goose、Aider、LangGraph 等成熟 harness，把其中有用的能力以插件形态重写并适配 DSH 的接缝与约定——只通过扩展接缝注册，不改 agent-loop 骨架、不引入热路径开销。"
  },
  "LayneChai/superpowers-dsh": {
    "en": "Superpowers skills adapted for DeepSeek Harness — TDD, debugging, planning and collaboration workflows ported from obra/superpowers.",
    "ja": "obra/superpowers から移植した DSH 用スキル集。TDD、デバッグ、計画立案、協働の 4 分野の作業手法を提供する。",
    "ko": "obra/superpowers에서 이식한 DSH용 스킬 모음. TDD, 디버깅, 계획 수립, 협업 네 가지 작업 방식을 제공.",
    "zh": "移植自 obra/superpowers 的 DSH 技能包：涵盖测试驱动开发、调试、规划与协作四类工作方法。"
  },
  "LiangYin233/dsh-provider-model-configurator": {
    "en": "A model configurator for the DSH web UI — apply context length, output limits, reasoning tiers and compatibility switches from a pi-ai preset or any configured provider onto a target provider in one click, and manage every provider's model entries in one place.",
    "ja": "DSH WebUI 向けモデル設定ツール。pi-ai プリセットや任意の設定済みプロバイダから、コンテキスト長・出力上限・推論段階・互換スイッチを対象プロバイダへ一括適用でき、各プロバイダのモデル項目を一元的に管理できる。",
    "ko": "DSH 웹 UI용 모델 구성 도구. pi-ai 프리셋이나 이미 설정된 프로바이더의 컨텍스트 길이, 출력 상한, 추론 등급, 호환 스위치를 대상 프로바이더에 한 번에 적용하고 모델 항목을 한곳에서 관리한다.",
    "zh": "DSH 模型配置器：把 pi-ai 预设或任意已配置 provider 的上下文长度、输出上限、推理档位与兼容开关一键套用到目标 provider，并集中查看、新建、编辑、复制与删除模型条目。"
  },
  "LoserFox/distill": {
    "en": "Automatic conversation distillation for DeepSeek Harness — a background subagent reflects on the session and creates or updates skills from what it learned.",
    "ja": "会話の自動蒸留プラグイン。バックグラウンドのサブエージェントがセッションを振り返り、スキルを自動で作成・更新する。",
    "ko": "대화 자동 증류 플러그인. 백그라운드 서브에이전트가 세션을 되짚어 스킬을 자동으로 만들거나 갱신한다.",
    "zh": "自动对话蒸馏插件：后台子代理反省整段会话，自动创建或更新对应的技能。"
  },
  "Lum1104/dsh-browser": {
    "en": "Connects DSH to the Chrome tab you are already using: read pages, click controls, fill forms, scroll and navigate while login state, session and cookies are preserved, with a side panel as the conversation UI.",
    "ja": "すでに使っている Chrome タブに DSH をつなぐ。ページの読み取り、コントロールのクリック、フォーム入力、スクロール、遷移を、ログイン状態・セッション・cookie を保ったまま実行。サイドパネルが会話 UI になる。",
    "ko": "이미 쓰고 있는 Chrome 탭에 DSH를 연결한다. 페이지 읽기, 컨트롤 클릭, 폼 입력, 스크롤, 이동을 로그인 상태·세션·쿠키를 유지한 채 수행하며, 사이드 패널이 대화 UI가 된다.",
    "zh": "把 DSH 接到你正在用的那个 Chrome 标签页：读页面、点控件、填表单、滚动、跳转，登录态、会话和 cookie 全保留，侧边栏就是对话界面。"
  },
  "Make0209/dsh-usage-stats": {
    "en": "A GitHub-style usage heatmap for DeepSeek Harness, paired with token, cache-hit and account balance dashboards plus workspace alias management.",
    "ja": "GitHub 風の使用量ヒートマップ・プラグイン。token、キャッシュヒット、アカウント残高のダッシュボードとワークスペース別名管理を備える。",
    "ko": "GitHub 스타일 사용량 히트맵 플러그인. 토큰, 캐시 적중, 계정 잔액 대시보드와 워크스페이스 별칭 관리를 함께 제공.",
    "zh": "GitHub 风格的用量热力图插件：附 token、缓存命中与账户余额看板，以及工作区别名管理。"
  },
  "Mars-Sea/dsh-commandcode-provider": {
    "en": "An unofficial DeepSeek Harness LLM provider for Command Code, with a live model catalog, reasoning-effort support and a Models-page card. Ported from pi-commandcode-provider (MIT).",
    "ja": "Command Code 向けの非公式 DSH プロバイダ・プラグイン。ライブモデルカタログ、推論強度、モデルページのカード表示に対応。pi-commandcode-provider からの移植。",
    "ko": "Command Code용 비공식 DSH 프로바이더 플러그인. 실시간 모델 카탈로그, 추론 강도 지원, 모델 페이지 카드를 제공. pi-commandcode-provider에서 이식.",
    "zh": "Command Code 的非官方 DSH provider 插件：实时模型目录、推理强度支持与模型页卡片，移植自 pi-commandcode-provider。"
  },
  "Moeblack/dsh-message-edit": {
    "en": "Branch-based message editing for DeepSeek Harness — rewrite, reroll, retry and browse a version timeline so one conversation can fork into several branches.",
    "ja": "分岐型のメッセージ編集プラグイン。書き換え・リロール・リトライ・バージョンタイムラインに対応し、一つの会話から複数の分岐を作れる。",
    "ko": "분기형 메시지 편집 플러그인. 다시 쓰기, 리롤, 재시도, 버전 타임라인을 지원해 하나의 대화에서 여러 분기를 만들 수 있다.",
    "zh": "分支式消息编辑插件：支持改写、重掷、重试与版本时间线，让一次对话可以长出多条分支。"
  },
  "MuziIsabel/dsh-win-notify": {
    "en": "Pops a Windows toast notification with sound when an agent task finishes — click it to switch straight back and bring the DSH tab to the foreground.",
    "ja": "エージェントのタスク完了時に音つきの Windows トースト通知を表示。クリックすると DSH のタブへ切り替わり前面に出る。",
    "ko": "에이전트 작업이 끝나면 소리와 함께 Windows 토스트 알림을 띄운다. 클릭하면 바로 DSH 탭으로 전환되어 전면에 표시된다.",
    "zh": "代理任务完成时弹出带声音的 Windows Toast 通知，点击即可直接切回并前台显示 DSH 标签页。"
  },
  "Nagi-ovo/dsh-ads": {
    "en": "Turns DeepSeek Harness into a 2005 web portal — even inference gets ad breaks. The ads are fake, the plugin is real, and the repos in the recommendation slots are genuine links.",
    "ja": "DeepSeek Harness を 2005 年のポータルサイトに変える。inference すら広告から逃れられない。広告は偽物だがプラグインは本物で、推薦枠のリポジトリは実在のリンク。",
    "ko": "DeepSeek Harness를 2005년 포털 사이트로 바꾼다. inference조차 광고를 피하지 못한다. 광고는 가짜지만 플러그인은 진짜이고, 추천 자리의 저장소는 실제 링크다.",
    "zh": "把 DeepSeek Harness 变成 2005 年的门户网站，连 inference 都逃不过广告。广告是假的，插件是真的——推荐位里的插件仓库点开都是真链接。"
  },
  "Nagi-ovo/dsh-find-plugins": {
    "en": "Ask DSH \"is there a plugin that…\" and this skill finds candidates across GitHub's `dsh-plugin` topic, explains the differences, and installs and verifies only after you pick. It works out whether a repo installs as a bundle, a Cordis plugin or a skill, and stops for confirmation on lifecycle scripts or suspicious writes.",
    "ja": "DSH に「〜できるプラグインある？」と一言聞けば、GitHub 全体の `dsh-plugin` topic から候補を探し、違いを説明し、あなたが選んでからインストールと検証を行う Skill。bundle・Cordis プラグイン・skill のどれで入れるべきかを自分で判断し、lifecycle スクリプトや不審な書き込みがあれば手を止めて確認する。",
    "ko": "DSH에 \"이런 거 되는 플러그인 있어?\"라고 물으면 GitHub 전체의 `dsh-plugin` topic에서 후보를 찾아 차이를 설명하고, 사용자가 고른 뒤에야 설치하고 검증하는 Skill. bundle·Cordis 플러그인·skill 중 무엇으로 설치할지 스스로 판단하며, lifecycle 스크립트나 수상한 쓰기가 있으면 멈추고 확인한다.",
    "zh": "对 DSH 说一句「有没有插件能……」，它就从全 GitHub 的 `dsh-plugin` topic 里找出候选、解释差别，等你选好再安装并验证。会自行判断该按 bundle、Cordis 插件还是 skill 安装，遇到 lifecycle 脚本或可疑写入就停下来问你。"
  },
  "Nagi-ovo/dsh-visualize": {
    "en": "DSH no longer has to answer with text alone: when the model calls visualize, the Web UI renders an interactive card inside the conversation — simulators, charts, comparison panels, UI mockups.",
    "ja": "DSH の回答はテキストだけである必要はない。モデルが visualize を呼ぶと、Web UI が会話内にインタラクティブなカードを描画する——シミュレータ、グラフ、比較パネル、UI モックアップ。",
    "ko": "DSH가 텍스트로만 답할 필요는 없다. 모델이 visualize를 호출하면 Web UI가 대화 안에 상호작용 카드를 렌더링한다——시뮬레이터, 차트, 비교 패널, UI 목업.",
    "zh": "让 DSH 不必只用文字回答：模型调用 visualize，Web UI 就在对话里渲染一张可交互的卡片——模拟器、图表、对比面板、界面草样。"
  },
  "NanmiCoder/dsh-agent-teams": {
    "en": "Ports Claude Code's AgentTeams into DSH: one sentence spins up a multi-agent team, the captain splits the work, members message each other directly, and a live activity panel sits in the top-right of the Web GUI.",
    "ja": "Claude Code の AgentTeams を DSH に移植。一言でマルチエージェントのチームが立ち上がり、キャプテンがタスクを分割、メンバー同士が直接やり取りし、Web GUI 右上でチーム活動をリアルタイムに確認できる。",
    "ko": "Claude Code의 AgentTeams를 DSH로 이식. 한마디로 멀티에이전트 팀이 꾸려지고, 캡틴이 작업을 나누며, 멤버끼리 직접 메시지를 주고받고, Web GUI 우상단에서 팀 활동을 실시간으로 본다.",
    "zh": "把 Claude Code 的 AgentTeams 搬进 DSH：一句自然语言拉起一个多智能体团队，队长拆任务、成员之间直接收发消息，Web GUI 右上角实时看团队活动。"
  },
  "NanmiCoder/dsh-auto-mode": {
    "en": "Safe automatic permissions for DeepSeek Harness — a fail-closed policy layer on ctx.tools that separates allow, classify, ask and deny so automation never quietly widens your permission boundary.",
    "ja": "DSH の安全な自動許可プラグイン。ctx.tools 上に fail-closed のポリシー階層を敷き、許可・分類・確認・拒否を分離して自動化と権限境界を両立させる。",
    "ko": "DSH의 안전한 자동 권한 플러그인. ctx.tools에 fail-closed 정책 계층을 두어 허용·분류·확인·거부를 분리하고 자동화와 권한 경계를 동시에 지킨다.",
    "zh": "DSH 安全自动授权插件：在工具层做 fail-closed 分级策略，把放行、分类、询问与拒绝拆开，自动化的同时守住权限边界。"
  },
  "Noob-stupid/dsh-plugin-hub": {
    "en": "A plugin manager and marketplace for DeepSeek Harness — toggle plugins on and off in one click, browse the GitHub dsh-plugin market with plugin details and one-click install.",
    "ja": "DSH のプラグイン管理パネル。ワンクリックで有効／無効を切り替えられ、GitHub の dsh-plugin マーケットを内蔵し、詳細表示とワンクリック導入に対応。",
    "ko": "DSH 플러그인 관리 패널. 원클릭으로 활성·비활성을 전환하고 GitHub dsh-plugin 마켓을 내장해 상세 정보와 원클릭 설치를 제공.",
    "zh": "DSH 插件管理面板：一键启用停用插件，内置 GitHub dsh-plugin 插件市场，带插件详情与一键安装。"
  },
  "Nwflower/dsh-chat-import": {
    "en": "Import chat histories from 14+ external agents — Claude Code, Codex, ChatGPT, Cursor, Gemini, opencode, Pi, Kimi CLI and more — into DeepSeek Harness as resumable sessions, with reverse export, sync and bundle backup.",
    "ja": "14 種類以上の外部エージェントの会話履歴を DSH に再開可能なセッションとして取り込む。Claude Code、Codex、ChatGPT、Cursor、Gemini、opencode、Pi、Kimi CLI などに対応し、逆エクスポートとバックアップも可能。",
    "ko": "14개 이상 외부 에이전트의 대화 기록을 DSH의 이어하기 가능한 세션으로 가져온다. Claude Code, Codex, ChatGPT, Cursor, Gemini, opencode, Pi, Kimi CLI 등을 지원하며 역방향 내보내기와 백업도 가능.",
    "zh": "把 14+ 个外部 Agent 的对话历史导入 DSH 成为可续聊会话：涵盖 Claude Code、Codex、ChatGPT、Cursor、Gemini、opencode、Pi、Kimi CLI 等，支持反向导出与备份。"
  },
  "PerryLink/dsh-auto-review": {
    "en": "Second-model auto-review for DeepSeek Harness approval requests — a read-only reviewer subagent returns structured allow/deny verdicts with reasons, fail-closed by default and fully auditable from the session log.",
    "ja": "DSH の承認リクエストをセカンドモデルで自動レビュー。読み取り専用のレビュー用サブエージェントが理由付きの許可/拒否を返し、既定は fail-closed、セッションログから全過程を監査できる。",
    "ko": "DSH 승인 요청을 두 번째 모델로 자동 검토. 읽기 전용 리뷰어 서브에이전트가 이유가 담긴 허용/거부 판정을 반환하며 기본은 fail-closed, 세션 로그로 전 과정을 감사할 수 있다.",
    "zh": "用第二个模型自动复核 DSH 授权请求：只读审查子代理返回带理由的允许/拒绝结论，默认 fail-closed，全过程可从会话日志审计。"
  },
  "PerryLink/dsh-memento": {
    "en": "Bounded, layered, approval-gated and auditable cross-session memory for DeepSeek Harness — a ctx.memory seam with a SQLite provider, a memory tool and frozen snapshot injection.",
    "ja": "境界付き・階層化・承認ゲート付きで監査可能なセッション横断メモリ。ctx.memory の接続点に SQLite プロバイダ、メモリツール、凍結スナップショット注入を実装。",
    "ko": "경계가 있고 계층화되었으며 승인 게이트와 감사가 가능한 세션 간 메모리. ctx.memory 심에 SQLite 프로바이더, 메모리 도구, 고정 스냅샷 주입을 구현.",
    "zh": "跨会话记忆插件：有界、分层、带审批门且可审计，通过 ctx.memory 接缝挂 SQLite provider、记忆工具与冻结快照注入。"
  },
  "PlutoKeating/dsh-lark-bot": {
    "en": "Puts DeepSeek Harness inside Feishu/Lark: drive your local dsh from DMs, group chats and threads with live streaming cards showing thinking and tool calls; parallel tasks, multi-role agents, cross-session notifications, plus a safety-net guardian that keeps the channel answering even after dsh crashes.",
    "ja": "DeepSeek Harness を飛書/Lark の中へ：DM・グループ・スレッドからローカルの dsh を操り、思考とツール呼び出しをストリーミングカードで実況。並列タスク、マルチロール Agent、セッション跨ぎ通知に加え、dsh が落ちてもチャンネルが応答し続けるセーフティネット守護を搭載。",
    "ko": "DeepSeek Harness를 Feishu/Lark 안으로: DM·그룹·스레드에서 로컬 dsh를 직접 부리고 사고 과정과 도구 호출을 스트리밍 카드로 실시간 확인한다. 병렬 작업, 멀티 롤 Agent, 세션 간 알림에 더해 dsh가 죽어도 채널이 응답하는 안전망 가디언을 갖췄다.",
    "zh": "把 DeepSeek Harness 装进飞书/Lark：私聊、群聊、话题里直接指挥本机 dsh，流式卡片实时看思考与工具调用；并行多任务、多角色 Agent、跨会话主动通知，外加独立于 dsh 进程的安全网守护——dsh 崩了飞书里依然叫得应。"
  },
  "Q00/ouroboros": {
    "en": "A self-improving agent OS with interview-gated onboarding, staged evaluation and a budgeted evolution loop — grading commands never leak into the success contract. MCP server, 13 runtimes including DSH.",
    "ja": "自己進化型 Agent OS。面接式の受け入れ、段階的評価、予算付き進化ループを備え、採点コマンドは成功契約に混入しない。MCP サーバー、DSH を含む 13 ランタイム対応。",
    "ko": "자기 진화형 Agent OS. 인터뷰 기반 승인, 단계별 평가, 예산이 정해진 진화 루프를 갖추고 채점 명령은 성공 계약에 포함되지 않는다. MCP 서버, DSH 포함 13개 런타임 지원.",
    "zh": "自进化 Agent OS：面试式准入、分阶段评估与预算化进化循环，评分命令与预期结果不进入交付契约。MCP 服务端，支持含 DSH 在内的 13 种运行时。"
  },
  "QCYTSN/dsh-dafeiyu": {
    "en": "A desktop-native BigFish companion for DeepSeek Harness that reacts to real agent events to show live working status, with always-on-top support on Windows.",
    "ja": "デスクトップ常駐のビッグフィッシュ・コンパニオン。DSH の実際のエージェントイベントに反応して作業状況を表示し、Windows では最前面表示にも対応。",
    "ko": "데스크톱 상주형 빅피시 컴패니언. DSH의 실제 에이전트 이벤트에 반응해 작업 상태를 표시하고 Windows에서는 항상 위 표시를 지원.",
    "zh": "桌面级大肥鱼伴侣插件：由 DSH 真实 Agent 事件驱动展示工作状态，Windows 下支持窗口置顶。"
  },
  "RevolutionLA/dsh-dream-skin": {
    "en": "A skin, wallpaper and theme-pack plugin for DeepSeek Harness — 8 Mirage themes, per-user accent colours, Wallpaper 2.0, theme pack import/export with share links, all built on the native token system.",
    "ja": "DSH のスキン／壁紙／テーマパック・プラグイン。8 種の Mirage テーマ、ユーザーごとのアクセントカラー、壁紙 2.0、テーマパックの入出力と共有リンクを、純正 token システムで実現。",
    "ko": "DSH 스킨·배경화면·테마팩 플러그인. 8종 Mirage 테마, 사용자별 강조색, 배경화면 2.0, 테마팩 가져오기·내보내기와 공유 링크를 네이티브 토큰 시스템으로 구현.",
    "zh": "DSH 换肤 / 壁纸 / 主题包插件：8 套 Mirage 主题、每用户强调色、壁纸 2.0、主题包导入导出与分享链接，纯原生 token 系统实现。"
  },
  "Ruler4396/dsh-launcher": {
    "en": "A lightweight Windows launcher for DeepSeek Harness: it starts the dsh service silently at logon and opens a ~50–150MB standalone WebView2 window instead of a full browser — double-click and go, no commands. Missing Node.js, slow downloads and port conflicts all raise an explicit dialog.",
    "ja": "DeepSeek Harness 向けの軽量 Windows ランチャー。ログオン後に dsh サービスを静かに起動し、ブラウザ全体の代わりに約 50〜150MB の独立した WebView2 ウィンドウを開く。ダブルクリックだけでコマンド入力は不要。Node.js 不足・ダウンロード失敗・ポート競合はすべて明示的なダイアログで通知する。",
    "ko": "DeepSeek Harness용 경량 Windows 런처. 로그온 후 dsh 서비스를 조용히 띄우고, 브라우저 전체 대신 약 50~150MB짜리 독립 WebView2 창을 연다. 더블클릭만 하면 되고 명령어는 필요 없다. Node.js 누락·다운로드 실패·포트 충돌은 모두 명확한 대화상자로 알린다.",
    "zh": "DeepSeek Harness 的 Windows 轻量启动器：登录后静默拉起 dsh 服务，用一个约 50–150MB 的 WebView2 独立小窗口代替整个浏览器，双击即用不用敲命令。缺 Node.js、下载失败、端口占用都会明确弹窗说明。"
  },
  "Sanqi-normal/dsh-webui-market-plugin": {
    "en": "A community plugin market for the DeepSeek Harness web GUI — browse the awesome-dsh-plugin.com catalog and install or uninstall plugins into a profile in one click.",
    "ja": "dsh Web GUI 向けのコミュニティ・プラグインマーケット。awesome-dsh-plugin.com のカタログを閲覧し、profile へワンクリックで導入・削除できる。",
    "ko": "dsh 웹 GUI용 커뮤니티 플러그인 마켓. awesome-dsh-plugin.com 카탈로그를 둘러보고 프로필에 원클릭으로 설치·삭제할 수 있다.",
    "zh": "dsh Web GUI 的社区插件市场：浏览 awesome-dsh-plugin.com 的插件目录，一键安装或卸载到指定 profile。"
  },
  "SenmuuuuW/dsh-whale-report": {
    "en": "DeepTrace turns DeepSeek Harness session event logs into daily, weekly, monthly, yearly and custom-range reports — deterministic insights for retrospectives, read-only and never rewriting history.",
    "ja": "DeepTrace はセッションのイベントログから日報・週報・月報・年報・任意期間のレポートを生成する。読み取り専用で履歴を書き換えず、振り返りに使える確定的な洞察を出す。",
    "ko": "DeepTrace는 세션 이벤트 로그로 일간·주간·월간·연간 및 사용자 지정 기간 보고서를 생성한다. 읽기 전용으로 이력을 바꾸지 않으며 회고에 쓸 결정적 인사이트를 제공.",
    "zh": "深迹 DeepTrace：从会话事件日志生成日报、周报、月报、年报与自定义区间报告，只读不改写历史，给出确定性洞察便于复盘。"
  },
  "Small-tailqwq/dsh-deep-whale": {
    "en": "A whale-girl themed skin series for the DSH Web GUI, shipped from its own distribution repo. Current resident: maid-atelier — a deep-sea maid atelier with twin-maid backdrop, deep-blue lace interface and chibi sidebar.",
    "ja": "DSH Web GUI 向けクジラ娘テーマのスキンシリーズ（独立配布リポジトリ）。現在の住人は maid-atelier——深海メイド工房、双子メイドの背景・深海ブルーのレース調 UI・デフォルメ版サイドバー。",
    "ko": "DSH Web GUI용 고래소녀 테마 스킨 시리즈(독립 배포 저장소). 현재 입주자는 maid-atelier——심해 메이드 공방, 쌍둥이 메이드 배경과 심해 블루 레이스 인터페이스, 데포르메 사이드바.",
    "zh": "DSH Web GUI 的鲸鱼娘主题皮肤系列，独立分发仓库。当前住户 maid-atelier：深海女仆工坊，双女仆背景、深海蓝蕾丝界面与 Q 版侧栏。"
  },
  "Small-tailqwq/dsh-deepcel": {
    "en": "An Excel-lookalike skin for DeepSeek Harness that disguises the conversation view as a spreadsheet.",
    "ja": "Excel を模した dsh スキン。会話画面を表計算ソフト風に見せかける。",
    "ko": "Excel을 흉내 낸 dsh 스킨. 대화 화면을 스프레드시트처럼 위장한다.",
    "zh": "一款模仿 Excel 的 dsh 皮肤：把对话界面伪装成电子表格。"
  },
  "SnowCrescenter-tech/dsh-milestone": {
    "en": "A Git-style milestone timeline for DeepSeek Harness — spot every question at a glance, hover for timestamp, turn count, duration and TTFT, and click to jump to any message.",
    "ja": "Git のコミットグラフ風のセッション・マイルストーン・ナビ。各質問を一目で見つけ、ホバーで時刻・ターン数・所要時間・TTFT を確認、クリックでその位置へ飛べる。",
    "ko": "Git 커밋 그래프 스타일의 세션 마일스톤 내비게이션. 각 질문을 한눈에 찾고 호버로 시각·턴 수·소요 시간·TTFT를 확인하며 클릭하면 해당 위치로 이동한다.",
    "zh": "Git 提交图风格的会话里程碑导航条：一眼定位每条提问，悬停看时间、轮次、耗时与 TTFT，点击直接跳转。"
  },
  "THEWOLFWALKER/dsh-notifier": {
    "en": "Unified notification push for DeepSeek Harness — one minimal notify() API across eight channel adapters (Telegram, DingTalk, Feishu, WxPusher, PushPlus, ServerChan, Bark, webhook), triggered by session events or called directly by the agent.",
    "ja": "DSH の統一通知プッシュ。最小限の notify() API で 8 チャネル（Telegram/DingTalk/Feishu/WxPusher/PushPlus/ServerChan/Bark/Webhook）に対応し、セッションイベント自動発火とエージェント呼び出しの両方をサポート。",
    "ko": "DSH 통합 알림 푸시. 최소한의 notify() API로 8개 채널(Telegram, DingTalk, Feishu, WxPusher, PushPlus, ServerChan, Bark, 웹훅)을 지원하며 세션 이벤트 자동 발화와 에이전트 직접 호출을 모두 제공.",
    "zh": "DSH 统一通知推送插件：一个极简 notify() API 接 8 个渠道（Telegram / 钉钉 / 飞书 / WxPusher / PushPlus / Server 酱 / Bark / Webhook），支持会话事件自动触发与 Agent 主动调用。"
  },
  "THU-MAIC/dsh-openmaic": {
    "en": "OpenMAIC for DeepSeek Harness — brings classrooms, slides, interactive widgets and Socratic teaching into DSH.",
    "ja": "OpenMAIC for DeepSeek Harness。教室、スライド、対話型ウィジェット、ソクラテス式の教授法を DSH に持ち込む。",
    "ko": "OpenMAIC for DeepSeek Harness. 교실, 슬라이드, 인터랙티브 위젯, 소크라테스식 교수법을 DSH에 도입한다.",
    "zh": "OpenMAIC for DeepSeek Harness：把课堂、幻灯片、交互式组件与苏格拉底式教学引入 DSH。"
  },
  "Tabbit-Browser/dsh-tabbit": {
    "en": "The Tabbit Browser plugin for DeepSeek Harness, exposing browser capability to DSH agents.",
    "ja": "Tabbit ブラウザの DeepSeek Harness 用プラグイン。ブラウザの機能を DSH のエージェントから使えるようにする。",
    "ko": "Tabbit 브라우저의 DeepSeek Harness 플러그인. 브라우저 기능을 DSH 에이전트가 사용할 수 있게 노출한다.",
    "zh": "Tabbit 浏览器的 DeepSeek Harness 插件：把浏览器能力接进 DSH 供 Agent 调用。"
  },
  "Toukaiteio/dsh-plugin-installer": {
    "en": "A marketplace plugin that quickly wires your DeepSeek Harness into the GitHub plugin ecosystem.",
    "ja": "マーケット型のインストーラ・プラグイン。DeepSeek Harness を GitHub のプラグイン生態へ手早く接続する。",
    "ko": "마켓형 설치 플러그인. DeepSeek Harness를 GitHub 플러그인 생태계에 빠르게 연결한다.",
    "zh": "市场型安装器插件：把你的 DeepSeek Harness 快速接入 GitHub 上的插件生态。"
  },
  "TsFreddie/dsh-compaction-instant": {
    "en": "An LLM-free, near-lossless compaction engine for DeepSeek Harness that shrinks long sessions without spending any tokens.",
    "ja": "LLM を呼ばないほぼ可逆のコンパクション・エンジン。token を消費せずに長いセッションを圧縮できる。",
    "ko": "LLM을 호출하지 않는 거의 무손실 압축 엔진. 토큰을 쓰지 않고 긴 세션을 줄일 수 있다.",
    "zh": "无需调用 LLM 的近乎无损上下文压缩引擎：不花 token 也能把长会话压下来。"
  },
  "Tyan66666/billion-context-dsh": {
    "en": "Model-driven context management (Active Context Pruning) for DeepSeek Harness — the model decides when and what to compress, backed by a CompactionEngine with compress and decompress support.",
    "ja": "モデル主導のコンテキスト管理（Active Context Pruning）。いつ何を圧縮するかをモデル自身が判断し、CompactionEngine を backend に圧縮と復元を行う。",
    "ko": "모델 주도 컨텍스트 관리(Active Context Pruning). 언제 무엇을 압축할지 모델이 직접 결정하며 CompactionEngine을 백엔드로 압축과 복원을 수행.",
    "zh": "模型驱动的上下文管理（主动上下文剪枝 ACP）：由模型自己决定何时压缩、压缩什么，以 CompactionEngine 为后端提供压缩与还原。"
  },
  "UNLINEARITY/dsh-code": {
    "en": "A Claude Code-style TUI bundle for DeepSeek Harness that composes the official dsh-base out of tree and reuses the full agent, session, tool, skill and sandbox stack, with plugin and model management built in.",
    "ja": "Claude Code 風の DSH 用 TUI バンドル。公式 dsh-base をツリー外で組み合わせ、Agent・セッション・ツール・スキル・サンドボックス一式を再利用。プラグインとモデル管理も内蔵。",
    "ko": "Claude Code 스타일의 DSH TUI 번들. 공식 dsh-base를 트리 외부에서 조합하고 에이전트·세션·도구·스킬·샌드박스 전체를 재사용하며 플러그인과 모델 관리를 내장.",
    "zh": "Claude Code 风格的 DSH 终端 bundle：树外组合官方 dsh-base，复用 Agent、会话、工具、技能与沙箱全套机制，支持特殊模式、插件系统与模型管理。"
  },
  "V1ki/dsh-plugin-subscriptions": {
    "en": "Use your existing ChatGPT (Codex), Claude and Grok (X Premium) subscriptions as DeepSeek Harness LLM providers — OAuth sign-in from the web UI, no API keys required.",
    "ja": "ChatGPT（Codex）・Claude・Grok（X Premium）のサブスクを DSH の LLM プロバイダとして利用。Web UI から OAuth ログインするだけで API キー不要。",
    "ko": "ChatGPT(Codex), Claude, Grok(X Premium) 구독을 DSH의 LLM 프로바이더로 사용. 웹 UI에서 OAuth 로그인만 하면 API 키가 필요 없다.",
    "zh": "把 ChatGPT（Codex）、Claude 与 Grok（X Premium）订阅接成 DSH 的 LLM provider：网页端 OAuth 登录，无需 API key。"
  },
  "Vladimir-Human/ru-marketplace-mcp": {
    "en": "Eleven marketplaces exposed as MCP servers — Wildberries, Ozon, Yandex Market, Detsky Mir, Avito, AliExpress, Taobao, Megamarket, Lamoda, DNS and Citilink — with cross-marketplace price comparison. Read-only.",
    "ja": "11 のマーケットプレイスを MCP サーバーとして公開。Wildberries、Ozon、Yandex Market、AliExpress、Taobao、Lamoda、DNS などを横断して一括価格比較ができる。読み取り専用。",
    "ko": "11개 마켓플레이스를 MCP 서버로 제공. Wildberries, Ozon, Yandex Market, AliExpress, 타오바오, Lamoda, DNS 등을 아울러 한 번에 가격을 비교할 수 있다. 읽기 전용.",
    "zh": "把 11 个电商平台做成 MCP 服务器：Wildberries、Ozon、Yandex Market、AliExpress、淘宝、Lamoda、DNS 等，支持跨平台一次比价，只读访问。"
  },
  "WEP-56/DSH-Launcher": {
    "en": "A launcher for DeepSeek Harness that embeds the web UI rather than repackaging it, so every web UI enhancement plugin still works — plus dsh package management, config management, plugin management, browser tabs and multi-window support.",
    "ja": "DeepSeek Harness のランチャー。WebUI を再パッケージせず内蔵するため、あらゆる WebUI 強化プラグインが動作する。dsh のパッケージ／設定／プラグイン管理、ブラウザタブ、マルチウィンドウにも対応。",
    "ko": "DeepSeek Harness 런처. 웹 UI를 재포장하지 않고 내장해 모든 웹 UI 강화 플러그인이 그대로 동작한다. dsh 패키지·설정·플러그인 관리, 브라우저 탭, 다중 창도 지원.",
    "zh": "DeepSeek Harness 启动器：不是 WebUI 二次打包而是内嵌 WebUI，兼容所有 WebUI 增强插件，另提供 dsh 包管理、配置管理、插件管理、浏览器标签页与多窗口。"
  },
  "WYH66666666/DSH-Transparent-UI-Plugin": {
    "en": "A high-freedom glass-morphism theme for the DSH web UI — frosts the top bar, sidebar, input box, stats line and trace view, with adjustable blur, frost level and background wallpaper. Toggle off to return to the native look.",
    "ja": "DSH Web UI 向けのガラス質感テーマ。トップバー・サイドバー・入力欄・統計行・トレース表示をすりガラス化し、ぼかし・すりガラス度・背景壁紙を設定カードから自由に調整できる。",
    "ko": "DSH 웹 UI용 글래스모피즘 테마. 상단바, 사이드바, 입력창, 통계 줄, 트레이스 뷰를 반투명 처리하고 블러·프로스트 정도·배경화면을 설정 카드에서 조절할 수 있다.",
    "zh": "DSH 网页端玻璃质感主题：顶栏、侧边栏、输入框、统计行与轨迹视图全部磨砂化，模糊度、磨砂度与背景壁纸均可在设置卡片里调节，关掉即回原生界面。"
  },
  "YELEBAI/dsh-plugin-marketplace": {
    "en": "A verified plugin marketplace and autonomous registry for DeepSeek Harness, auto-indexing and validating plugins to provide a trustworthy install source.",
    "ja": "検証済みの DSH プラグインマーケット兼自律型レジストリ。プラグインを自動収録・検証し、信頼できる導入元を提供する。",
    "ko": "검증된 DSH 플러그인 마켓 겸 자율 레지스트리. 플러그인을 자동 수록·검증해 신뢰할 수 있는 설치 출처를 제공.",
    "zh": "经过验证的 DSH 插件市场与自治注册中心：自动收录并校验插件，提供可信的安装来源。"
  },
  "Yan-Zero/dsh-codex": {
    "en": "Use your ChatGPT subscription inside DeepSeek Harness through OpenAI's Codex sign-in flow.",
    "ja": "OpenAI の Codex サインインフローを利用して、ChatGPT のサブスクリプションを DeepSeek Harness からそのまま使える。",
    "ko": "OpenAI의 Codex 로그인 흐름을 통해 ChatGPT 구독을 DeepSeek Harness에서 그대로 사용할 수 있다.",
    "zh": "通过 OpenAI 的 Codex 登录流程，在 DeepSeek Harness 里直接使用你的 ChatGPT 订阅。"
  },
  "Ychris12138/dsh-usage-stats": {
    "en": "Provider balances, subscription quotas and token-usage analytics for the DeepSeek Harness web GUI.",
    "ja": "DSH Web GUI 向けに、プロバイダ残高・サブスク枠・token 使用量の分析ダッシュボードを提供する。",
    "ko": "DSH 웹 GUI에 프로바이더 잔액, 구독 할당량, 토큰 사용량 분석 대시보드를 제공.",
    "zh": "为 DSH Web GUI 提供 provider 余额、订阅额度与 token 用量分析看板。"
  },
  "ZSeven-W/dsh-crew": {
    "en": "Dispatch work to DeepSeek Harness agents from Claude Code or Codex — native subagent progress, in-host worker sessions with per-tier presets and a multimodal bridge.",
    "ja": "Claude Code や Codex から DSH のエージェントへ作業を委譲。ネイティブなサブエージェント進捗、ティア別プリセット付きのホスト内ワーカーセッション、マルチモーダル橋渡しを備える。",
    "ko": "Claude Code나 Codex에서 DSH 에이전트로 작업을 위임. 네이티브 서브에이전트 진행률, 등급별 프리셋을 갖춘 호스트 내 워커 세션, 멀티모달 브리지를 제공.",
    "zh": "从 Claude Code 或 Codex 把任务派给 DSH Agent：原生子代理进度、按档位预设的宿主内工作会话，以及多模态桥接。"
  },
  "ZSeven-W/dsh-noema": {
    "en": "The Noema long-term memory plugin for DeepSeek Harness — durable, inspectable agent memory with recall tools and a dedicated settings page.",
    "ja": "Noema 長期記憶プラグイン。DSH に永続的で中身を確認できるエージェント記憶を提供し、想起ツールと専用設定ページを備える。",
    "ko": "Noema 장기 기억 플러그인. DSH에 지속적이고 들여다볼 수 있는 에이전트 기억을 제공하며 회상 도구와 전용 설정 페이지를 갖췄다.",
    "zh": "Noema 长期记忆插件：为 DSH 提供持久且可检视的 Agent 记忆，配召回工具与独立设置页。"
  },
  "ZSeven-W/dsh-openpencil": {
    "en": "The DeepSeek Harness plugin for OpenPencil: instead of returning a generated image, the agent drives a real, editable, interactive design canvas. Exact multi-frame previews, a pannable read-only canvas, a managed editor with layers and properties, and five agent-native design tools.",
    "ja": "DeepSeek Harness と OpenPencil をつなぐプラグイン。Agent が動かすのは生成画像ではなく、本物の編集可能でインタラクティブなデザインキャンバスだ。多フレームの正確なプレビュー、パン・ズーム可能な読み取り専用キャンバス、レイヤーとプロパティを備えたマネージドエディタ、そして 5 つのデザインツールを提供する。",
    "ko": "DeepSeek Harness와 OpenPencil을 잇는 플러그인. 에이전트가 다루는 것은 생성 이미지가 아니라 실제로 편집 가능하고 상호작용하는 디자인 캔버스다. 다중 프레임 정확 미리보기, 팬·줌 가능한 읽기 전용 캔버스, 레이어와 속성을 갖춘 관리형 에디터, 그리고 다섯 개의 디자인 도구를 제공한다.",
    "zh": "把 DeepSeek Harness 接到 OpenPencil 的插件：Agent 驱动的不是生成图片，而是一张真实、可编辑、可交互的设计画布。多帧精确预览、可平移缩放的只读画布、带图层与属性的托管编辑器，外加五个设计工具。"
  },
  "Zhiyuan-Fan/Awesome-DeepSeek-Harness-Plugins": {
    "en": "A curated bilingual list of DeepSeek Harness plugins, extensions, tools, skills, clients, runtimes, integrations and verified references.",
    "ja": "英中バイリンガルの DSH 厳選リスト。プラグイン、拡張、ツール、スキル、クライアント、ランタイム、連携、検証済み参考資料を収録。",
    "ko": "영중 이중 언어 DSH 엄선 목록. 플러그인, 확장, 도구, 스킬, 클라이언트, 런타임, 통합, 검증된 참고 자료를 수록.",
    "zh": "中英双语的 DSH 精选清单：插件、扩展、工具、技能、客户端、运行时、集成方案与已验证参考资料。"
  },
  "adoresever/graph-memory": {
    "en": "A knowledge-graph memory engine for DSH that extracts structured triples from conversations, compresses context by roughly 75% and enables cross-session experience reuse. Also works with OpenClaw.",
    "ja": "ナレッジグラフ型メモリ・プラグイン。会話から構造化トリプルを抽出してコンテキストを約 75% 圧縮し、セッションを跨いだ経験の再利用を可能にする。OpenClaw にも対応。",
    "ko": "지식 그래프 메모리 플러그인. 대화에서 구조화된 트리플을 추출해 컨텍스트를 약 75% 압축하고 세션 간 경험 재사용을 가능하게 한다. OpenClaw도 지원.",
    "zh": "知识图谱记忆插件：从对话中抽取结构化三元组，压缩上下文约 75%，实现跨会话经验复用，同时兼容 OpenClaw。"
  },
  "agentrq/agentrq": {
    "en": "AgentRQ — a self-hosted, human-in-the-loop realtime conversational task manager for AI agents, letting you control your own agents from mobile, web or desktop.",
    "ja": "AgentRQ は AI エージェント向けの人間参加型リアルタイム対話タスク管理ツール。セルフホストでき、モバイル・Web・デスクトップのどこからでも自分のエージェントを操作できる。",
    "ko": "AgentRQ는 AI 에이전트를 위한 사람 참여형 실시간 대화 작업 관리자. 셀프 호스팅이 가능하며 모바일, 웹, 데스크톱 어디서든 자신의 에이전트를 제어할 수 있다.",
    "zh": "AgentRQ：面向 AI Agent 的人机协同实时任务管理器，可自托管，从手机、网页或桌面随处控制自己的 Agent。"
  },
  "alingalingling/ui-status-label": {
    "en": "Customise the thinking status label in DeepSeek Harness — swap the default deep diving text for whatever wording you like.",
    "ja": "思考中に表示されるステータス文言をカスタマイズ。既定の deep diving を好きな文字列に差し替えられる。",
    "ko": "생각 중일 때 표시되는 상태 문구를 커스터마이즈. 기본 deep diving 문구를 원하는 문구로 바꿀 수 있다.",
    "zh": "自定义鲸鱼娘思考时的状态文案：把默认的 deep diving 换成任意你想显示的字样。"
  },
  "anywhere-labs/dsh-desktop": {
    "en": "A desktop client for the DSH ecosystem: service startup, process management and a desktop window folded into one out-of-the-box experience, with no Node.js setup and no commands to type.",
    "ja": "DSH エコシステム向けのデスクトップクライアント。サービス起動・実行管理・デスクトップウィンドウを一つの箱として統合し、Node.js の設定もコマンド入力も不要。",
    "ko": "DSH 생태계를 위한 데스크톱 클라이언트. 서비스 시작·실행 관리·데스크톱 창을 하나의 즉시 사용 가능한 경험으로 묶어, Node.js 설정도 명령 입력도 필요 없다.",
    "zh": "为 DSH 生态做的桌面端：把服务启动、运行管理和桌面窗口整合成开箱即用的体验，不用配置 Node.js 或敲命令。"
  },
  "awesome-dsh-plugin/awesome-dsh-plugin": {
    "en": "An awesome list of DSH plugins with an explicit admission bar: only community plugins installable via dsh plugin add that declare a dsh.bundle manifest.",
    "ja": "DSH プラグインの awesome リスト。収録基準が明確で、dsh plugin add で導入でき、かつ dsh.bundle を宣言しているコミュニティプラグインだけを収める。",
    "ko": "DSH 플러그인 awesome 목록. 수록 기준이 명확해 dsh plugin add로 설치 가능하고 dsh.bundle을 선언한 커뮤니티 플러그인만 담는다.",
    "zh": "DSH 插件的 awesome 清单，收录标准明确：只收能用 dsh plugin add 装、且声明了 dsh.bundle 的社区插件。"
  },
  "awesome-dsh-plugin/dsh-find-plugin": {
    "en": "Find DSH plugins from inside the agent — live search across the GitHub dsh-plugin topic, ranked by stars.",
    "ja": "会話内から DSH プラグインを検索・発見。GitHub の dsh-plugin トピックをリアルタイムに検索し、star 順に並べる。",
    "ko": "대화 안에서 DSH 플러그인을 검색·발견. GitHub dsh-plugin 토픽을 실시간 검색해 star 순으로 정렬한다.",
    "zh": "在会话内直接搜索发现 DSH 插件：实时检索 GitHub dsh-plugin 主题并按 star 排序。"
  },
  "ayuanwong/dsh-ux": {
    "en": "A community Web UX edition of the DSH source tree (not a plugin — you run it from source): long tasks keep only the current stage and a short trail of finished ones in view, reasoning and tool calls fold into \"Run details\" on demand, and the process auto-collapses when the task ends so the result leads. Session recovery and produced-file opening are reworked too; the agent loop, tools and permissions stay aligned with upstream.",
    "ja": "DSH ソースをベースにしたコミュニティ製 Web UX 版（プラグインではなく、ソースから起動）。長時間タスクでは現在の段階と完了済み段階の短い履歴だけを残し、推論とツール呼び出しは「実行詳細」に畳んで必要な時だけ展開。完了すると過程は自動的に折りたたまれ、結果が前面に出る。セッション復旧と成果物の open も刷新。エージェントループ・ツール・権限は上流と同一。",
    "ko": "DSH 소스를 기반으로 한 커뮤니티 Web UX 에디션(플러그인이 아니라 소스에서 직접 실행). 긴 작업에서는 현재 단계와 완료된 단계의 짧은 이력만 남기고, 추론과 도구 호출은 '실행 세부'로 접어 두었다가 필요할 때만 펼친다. 작업이 끝나면 과정이 자동으로 접히고 결과가 앞으로 나온다. 세션 복구와 산출물 열기도 새로 손봤으며, 에이전트 루프·도구·권한은 업스트림과 동일하다.",
    "zh": "基于 DSH 源码的社区 Web UX 版本（非插件，需自行从源码运行）：长任务只留当前阶段与已完成阶段的简短轨迹，推理与工具调用收进「运行详情」按需展开，任务结束自动折叠过程、结果上浮；会话恢复与产物文件打开一并重做，Agent 循环、工具与权限保持与上游一致。"
  },
  "beancookie/awesome-dsh-plugin": {
    "en": "A curated list of DeepSeek Harness plugins, organising community extensions and development resources so you can find usable plugins quickly.",
    "ja": "DeepSeek Harness プラグインの厳選リスト。コミュニティの拡張と開発リソースを用途別に整理し、使えるプラグインを素早く探せる。",
    "ko": "DeepSeek Harness 플러그인 엄선 목록. 커뮤니티 확장과 개발 리소스를 용도별로 정리해 쓸 만한 플러그인을 빠르게 찾을 수 있다.",
    "zh": "DeepSeek Harness 插件精选清单：按用途整理社区插件与开发资源，方便快速找到可用的扩展。"
  },
  "bill9109/dsh-web-ui-notify": {
    "en": "Adds desktop notifications to DeepSeek Harness so you get alerted when a task finishes or needs confirmation, without watching the window.",
    "ja": "DSH にデスクトップ通知を追加。タスク完了時や確認が必要なときに通知が届くので、画面を見張り続ける必要がない。",
    "ko": "DSH에 데스크톱 알림을 추가. 작업이 끝나거나 확인이 필요할 때 알림이 떠서 창을 계속 지켜볼 필요가 없다.",
    "zh": "为 DSH 增加桌面通知提醒：任务完成或需要确认时主动弹出提示，不用一直盯着窗口。"
  },
  "bobleer/dsh-acp-for-bitfun": {
    "en": "An ACP integration plugin bridging BitFun and DeepSeek Harness, connecting the agent communication protocols on both sides.",
    "ja": "BitFun と DSH を ACP で接続する連携プラグイン。両者のエージェント通信プロトコルを橋渡しする。",
    "ko": "BitFun과 DSH를 ACP로 연결하는 연동 플러그인. 양쪽 에이전트 통신 프로토콜을 이어준다.",
    "zh": "BitFun 与 DSH 的 ACP 交互对接插件：把两边的 Agent 通信协议打通。"
  },
  "bocha-ai/dsh-web-search-bocha": {
    "en": "Official Bocha web-search plugin: plugs Bocha Web Search into Harness's unified web_search tool, giving agents real-time internet search.",
    "ja": "博査（Bocha）公式の Web 検索プラグイン。Bocha Web Search を Harness 統一の web_search ツールに接続し、エージェントにリアルタイムのネット検索能力を提供。",
    "ko": "Bocha 공식 웹 검색 플러그인. Bocha Web Search를 Harness 통합 web_search 도구에 연결해 에이전트에 실시간 인터넷 검색 능력을 제공한다.",
    "zh": "博查官方出品的 Web Search 插件：安装后将博查搜索接入 Harness 统一的 web_search 工具，为智能体提供实时联网搜索能力。"
  },
  "bowenliang123/dsh-context": {
    "en": "See what the model's context window is made of and how it evolves — a Context tab plus a /context command covering composition, compactions and injections.",
    "ja": "モデルのコンテキストウィンドウの中身と推移を可視化。Context タブと /context コマンドで、構成・圧縮・注入がひと目でわかります。",
    "ko": "모델 컨텍스트 윈도우의 구성과 변화를 시각화 — Context 탭과 /context 명령으로 구성·압축·주입을 한눈에 파악합니다.",
    "zh": "看清模型上下文窗口的组成与演化：Context 面板 + /context 命令，系统提示、工具 schema、注入与压缩一目了然。"
  },
  "bradeGithub/DSH-Plugins-Marketplace": {
    "en": "A DSH plugin marketplace that lets you browse, install and update every plugin under the GitHub dsh-plugin topic from inside the DeepSeek Harness web GUI.",
    "ja": "DSH プラグインマーケット。GitHub の dsh-plugin トピック配下のプラグインを Web GUI からワンクリックで閲覧・導入・更新できる。",
    "ko": "DSH 플러그인 마켓. GitHub dsh-plugin 토픽의 모든 플러그인을 웹 GUI에서 원클릭으로 탐색·설치·업데이트할 수 있다.",
    "zh": "DSH 插件市场：在 Web GUI 中一键浏览、安装与更新 GitHub topic:dsh-plugin 下的全部插件。"
  },
  "bruc3van/awesome-dsh-plugin": {
    "en": "Sifts the 2000+ repos tagged dsh-plugin down to the ones that solve a real problem, explain themselves clearly and are still maintained — then tells you who each plugin is for and where to start.",
    "ja": "dsh-plugin タグの付いた 2000 以上のリポジトリから「実際の問題を解決し、説明が明快で、今も保守されている」ものだけを選び出し、各プラグインが誰に向いていてどこから始めるべきかまで示す。",
    "ko": "dsh-plugin 태그가 달린 2000개 넘는 저장소에서 「실제 문제를 풀고, 설명이 분명하며, 아직 유지보수되는」 것만 골라내고, 각 플러그인이 누구에게 맞는지와 어디서 시작할지까지 알려 준다.",
    "zh": "从 2000+ 个挂着 dsh-plugin 标签的仓库里筛出「解决真实问题、说得清楚、还在维护」的那部分，并告诉你每个插件适合谁、从哪开始。"
  },
  "bruc3van/dsh-desktop": {
    "en": "An independent dsh desktop client that keeps your agent safely resident — the official web UI untouched, long tasks alive in the tray, and curated plugins reviewed before install.",
    "ja": "エージェントを安全にデスクトップ常駐させる独立 dsh クライアント。公式 Web UI はそのまま、長時間タスクはトレイで生かし、厳選プラグインは審査してから導入する。",
    "ko": "에이전트를 안전하게 데스크톱에 상주시키는 독립 dsh 클라이언트. 공식 웹 UI는 그대로 두고 장시간 작업은 트레이에 유지하며 엄선 플러그인은 검토 후 설치한다.",
    "zh": "让 Agent 安全常驻桌面的独立 dsh 客户端：官方 Web UI 原封不动，长任务常驻托盘，精选插件先审查再安装。"
  },
  "btspoony/mstar-harness": {
    "en": "Morning Star: an agent plugin for harness engineering workflows. A TypeScript Harness Workflow Engine (`@mstar-harness/engine`) enforces deterministic workflow gates in code, while `mstar-*` judgment skills drive multi-agent code delivery — and the same engine plus skills run on dsh, omp, OpenCode, Cursor, Kimi Code, ZCode and Codex.",
    "ja": "Morning Star：harness エンジニアリングのワークフロー向け Agent プラグイン。TypeScript 製の Harness Workflow Engine（`@mstar-harness/engine`）が決定的なワークフローゲートをコードとして強制し、`mstar-*` 判断スキルがマルチ Agent のコード納品を駆動する。同じエンジンとスキルが dsh・omp・OpenCode・Cursor・Kimi Code・ZCode・Codex で動く。",
    "ko": "Morning Star: 하네스 엔지니어링 워크플로를 위한 에이전트 플러그인. TypeScript로 만든 Harness Workflow Engine(`@mstar-harness/engine`)이 결정적 워크플로 게이트를 코드로 강제하고, `mstar-*` 판단 스킬이 다중 에이전트 코드 인도를 이끈다. 같은 엔진과 스킬이 dsh, omp, OpenCode, Cursor, Kimi Code, ZCode, Codex에서 동작한다.",
    "zh": "Morning Star：harness 工程化工作流的 Agent 插件。TypeScript 写的 Harness Workflow Engine（`@mstar-harness/engine`）以代码强制执行确定性工作流关卡，`mstar-*` 判断技能负责多 Agent 代码交付；同一套引擎加技能可跑在 dsh、omp、OpenCode、Cursor、Kimi Code、ZCode 和 Codex 上。"
  },
  "bugmaker2/dsh-plugin-template": {
    "en": "A project template for deepseek-harness plugin development, giving new plugins a ready-to-build scaffold.",
    "ja": "deepseek-harness プラグイン開発用テンプレート。新しいプラグインをすぐ書き始められる雛形を提供する。",
    "ko": "deepseek-harness 플러그인 개발용 템플릿. 새 플러그인을 바로 시작할 수 있는 골격을 제공.",
    "zh": "DeepSeek Harness 插件开发模板：给新插件一个可直接开工的工程骨架。"
  },
  "c3ll256/dsh-toy": {
    "en": "A toy control protocol for DeepSeek Harness, bridging external toy devices into the harness so agent events can drive control commands.",
    "ja": "DSH 向けのトイ制御プロトコル。外部のトイデバイスを Harness に接続し、エージェントのイベントで制御コマンドを駆動する。",
    "ko": "DSH용 토이 제어 프로토콜. 외부 토이 기기를 Harness에 연결해 에이전트 이벤트로 제어 명령을 구동한다.",
    "zh": "DSH 的玩具控制协议：把外部玩具设备接入 Harness，由 Agent 事件驱动控制指令。"
  },
  "ccch1mneyyy/dsh-TUI": {
    "en": "Fills the gap of an official DSH terminal TUI — a Claude Code-style full-screen interactive terminal plugin for CLI lovers: pixel-whale top bar, live status line, streaming thoughts, double-Esc rollback, context progress bar + TPS gauge. One npm command to install.",
    "ja": "DSH 公式にまだない端末 TUI を埋める一作。CLI 派に贈る Claude Code 風フルスクリーン対話端末プラグイン——ピクセルクジラのトップバー、リアルタイム状態行、思考のストリーム表示、Esc 二連打で巻き戻し、コンテキスト進捗バー + TPS メーター。npm 一発インストール。",
    "ko": "DSH 공식 터미널 TUI의 공백을 메우는 플러그인. CLI 애호가를 위한 Claude Code 스타일 전체 화면 인터랙티브 터미널 — 픽셀 고래 상단 바, 실시간 상태 줄, 사고 스트리밍, Esc 두 번으로 롤백, 컨텍스트 진행 바 + TPS 게이지. npm 한 줄로 설치.",
    "zh": "Claude Code 风格的 DSH 终端界面插件：鲸鱼顶栏、实时状态、流式思考、双击 Esc 回滚、上下文进度条与 TPS，npm 一键安装。"
  },
  "ccch1mneyyy/working-activity": {
    "en": "Brings the agent working line to life with animation driven by real tool-execution events, shipping as separate packages for both the pi CLI and DeepSeek Harness.",
    "ja": "エージェントの作業ステータス行をアニメーションで動かすプラグイン。実際のツール実行イベントで駆動し、pi CLI 版と DSH 版の両方を提供。",
    "ko": "에이전트 작업 상태 줄을 애니메이션으로 살아 움직이게 하는 플러그인. 실제 도구 실행 이벤트로 구동되며 pi CLI 버전과 DSH 버전을 모두 제공.",
    "zh": "让 Agent 工作状态行动起来的动效插件：由真实工具执行事件驱动，同时提供 pi CLI 与 DSH 两个版本。"
  },
  "ccq1/dsh-side-panel": {
    "en": "A DeepSeek Harness sidebar that bundles a file browser, a terminal and Git review so you can preview files without leaving the conversation.",
    "ja": "DSH のサイドバー・プラグイン。ファイルブラウザ、ターミナル、Git レビューを統合し、会話を離れずにファイルを確認できる。",
    "ko": "DSH 사이드바 플러그인. 파일 브라우저, 터미널, Git 리뷰를 통합해 대화를 벗어나지 않고 파일을 미리 볼 수 있다.",
    "zh": "DSH 侧边栏插件：集成文件浏览器、终端与 Git 审查，方便随时预览文件。"
  },
  "chen-001/dsh-grok-tui": {
    "en": "Use DeepSeek Harness through grok-build's TUI, wiring DSH sessions into the Grok terminal interface.",
    "ja": "grok-build の TUI から dsh を利用。DSH のセッションを Grok のターミナル UI に接続して操作できる。",
    "ko": "grok-build의 TUI로 dsh를 사용. DSH 세션을 Grok 터미널 인터페이스에 연결해 조작할 수 있다.",
    "zh": "通过 grok-build 的终端界面使用 dsh：把 DSH 会话接进 Grok TUI 里操作。"
  },
  "cocofhu/anime-find": {
    "en": "Anime search plugin for DeepSeek Harness — query multiple sources straight from a conversation, view Bangumi ratings and details as cards, and copy magnet links in one click.",
    "ja": "DSH 用アニメ検索プラグイン。会話内で複数ソースを横断検索し、Bangumi の評価と詳細をカード表示、マグネットリンクをワンクリックでコピーできる。",
    "ko": "DSH용 애니메이션 검색 플러그인. 대화 안에서 여러 소스를 검색하고 Bangumi 평점과 상세 정보를 카드로 보여주며 마그넷 링크를 한 번에 복사할 수 있다.",
    "zh": "DSH 搜番插件：在对话里多源检索番剧，卡片展示 Bangumi 评分与详情，支持一键复制磁力链接。"
  },
  "crazywoola/dsh-balance": {
    "en": "A DSH Settings plugin for checking DeepSeek API balance (total / topped-up / granted) and the models available to your key, with cached results and manual refresh; the API key stays host-side and never reaches the browser.",
    "ja": "DSH 設定ページのプラグイン。DeepSeek API の残高（合計／チャージ／付与）と現在のキーで使えるモデルを照会。結果はキャッシュされ手動更新も可能。API キーはローカル Host のみが使い、ブラウザには送られない。",
    "ko": "DSH 설정 페이지 플러그인. DeepSeek API 잔액(총액/충전/증정)과 현재 키로 사용 가능한 모델을 조회한다. 결과는 캐시되고 수동 새로고침을 지원한다. API 키는 로컬 Host에서만 쓰이며 브라우저로 전송되지 않는다.",
    "zh": "DSH 设置页插件：查询 DeepSeek API 总余额/充值/赠送余额与当前 Key 可用模型，结果带缓存可手动刷新；API Key 只在本机 Host 使用，不发送到浏览器。"
  },
  "csyangwen/dsh-memory-evolve": {
    "en": "A pure-plugin implementation that brings cross-session long-term memory and background self-evolution to DSH: five memory tracks, git-branch awareness, in-turn self-review, skill self-evolution with a skill manager, four to-do tracks, COI scheduling, session broadcast and search, and a prompt manager — zero core changes, zero runtime dependencies.",
    "ja": "DSH に「セッションをまたぐ長期記憶」と「バックグラウンドの自己進化」をもたらす純プラグイン実装。5 軌の記憶、git ブランチ認識、ターン内自己レビュー、スキルの自己進化とスキルマネージャ、4 軌の ToDo、COI スケジューリング、セッションブロードキャストと検索、プロンプトマネージャを備え、コア改変ゼロ・ランタイム依存ゼロ。",
    "ko": "DSH에 세션을 넘나드는 장기 기억과 백그라운드 자기 진화를 더하는 순수 플러그인 구현. 5개 기억 트랙, git 브랜치 인식, 턴 내 자기 검토, 스킬 자기 진화와 스킬 관리자, 4개 할 일 트랙, COI 스케줄링, 세션 브로드캐스트와 검색, 프롬프트 관리자를 갖췄고 코어 수정 제로, 런타임 의존성 제로.",
    "zh": "给 DSH 带来跨会话长期记忆与后台自我进化的纯插件实现：五轨记忆、git 分支感知、回合内自我审查、技能自我进化与技能管理器、四轨待办、COI 调度、会话广播与搜索、提示词管理器——零核心修改、零运行时依赖。"
  },
  "dancingmemory/dskin": {
    "en": "DSKIN, a cartoon pixel skin for the DSH web GUI — leaves the original interface untouched while living pixel pets stroll, blink and hop across it.",
    "ja": "DSKIN はカートゥーン風ピクセルスキン。元の画面はそのままに、ピクセルのペットが DSH Web GUI 上を歩き、まばたきし、跳ねる。",
    "ko": "DSKIN은 카툰 픽셀 스킨. 원래 화면은 그대로 두고 픽셀 펫이 DSH 웹 GUI 위를 걷고 눈을 깜빡이며 뛰어다닌다.",
    "zh": "DSKIN 卡通像素皮肤插件：原始界面保持不动，像素宠物会在 DSH Web GUI 上散步、眨眼与跳跃。"
  },
  "deepseek-ai/deepseek-harness": {
    "en": "The official DeepSeek Harness runtime — an agent host where everything is a plugin: models, tools, sessions, sandboxes and even the agent loop itself are composable Cordis plugins.",
    "ja": "DeepSeek Harness：すべてはプラグイン。",
    "ko": "DeepSeek Harness: 모든 것이 플러그인.",
    "zh": "DeepSeek Harness：万物皆插件。"
  },
  "dhicoc/dsh-reverse-skill": {
    "en": "The complete reverse-skill pack (85 SKILL.md files) wrapped as a DeepSeek Harness Cordis plugin — reverse engineering, authorised penetration testing and security research skills.",
    "ja": "reverse-skill の全 85 個の SKILL.md を DSH の Cordis プラグインとしてパッケージ化。リバースエンジニアリング、認可されたペネトレーションテスト、セキュリティ研究のスキル集。",
    "ko": "reverse-skill 전체 85개 SKILL.md를 DSH Cordis 플러그인으로 패키징. 리버스 엔지니어링, 승인된 침투 테스트, 보안 연구 스킬 모음.",
    "zh": "把完整的 reverse-skill 技能包（85 个 SKILL.md）封装成 DSH Cordis 插件：逆向工程、授权渗透测试与安全研究技能集。"
  },
  "dingyi222666/dsh-focus-chat": {
    "en": "A focused-conversation view for DeepSeek Harness that strips process noise and keeps only the final output, making long sessions far easier to read.",
    "ja": "dsh 向けの「フォーカス会話」簡易ビュー。途中のノイズを隠して最終成果だけを残し、長いセッションを読みやすくする。",
    "ko": "dsh를 위한 '집중 대화' 간결 뷰. 과정의 잡음을 숨기고 최종 산출물만 남겨 긴 세션을 훨씬 읽기 쉽게 만든다.",
    "zh": "为 dsh 提供「聚焦会话」精简视图：隐去过程噪音，只留最终产出，长会话读起来更轻松。"
  },
  "drewnekota/cetus": {
    "en": "Turns your favourite agent runtime into an always-on desktop assistant. DSH is one of its supported runtimes — it reuses the dsh CLI you have already installed and signed into, with no second account to configure.",
    "ja": "使い慣れた agent ランタイムを常駐のデスクトップアシスタントに変える。DSH は対応ランタイムの一つで、すでにインストール・ログイン済みの dsh CLI をそのまま再利用でき、アカウントの再設定は不要。",
    "ko": "즐겨 쓰는 agent 런타임을 상시 대기 데스크톱 어시스턴트로 바꾼다. DSH는 지원 런타임 중 하나로, 이미 설치하고 로그인해 둔 dsh CLI를 그대로 재사용하므로 계정을 다시 설정할 필요가 없다.",
    "zh": "把你惯用的 agent 运行时变成常驻桌面助手。DSH 是它支持的运行时之一——复用你已经装好、登录好的 dsh CLI，不需要再配一套账号。"
  },
  "dsh-market/dsh-market": {
    "en": "A plugin market that lives inside DeepSeek Harness: open Settings → Plugin Market to browse, search and one-click install from a 300+ plugin community catalog, with category filters, star counts, sorting and bilingual descriptions that follow your UI language — plus a dedicated Themes tab for live skin switching.",
    "ja": "DeepSeek Harness の中に開くプラグインマーケット。設定 → プラグインマーケットから、300 以上のコミュニティプラグインカタログを閲覧・検索・ワンクリック導入できる。カテゴリ絞り込み、スター数、並べ替え、UI 言語に追従するバイリンガル説明に加え、即時スキン切替のための専用テーマタブも備える。",
    "ko": "DeepSeek Harness 안에 열리는 플러그인 마켓. 설정 → 플러그인 마켓에서 300개가 넘는 커뮤니티 플러그인 카탈로그를 둘러보고 검색하고 원클릭으로 설치한다. 분류 필터, 스타 수, 정렬, UI 언어를 따라가는 이중 언어 설명에 더해, 즉시 스킨을 바꿀 수 있는 전용 테마 탭도 있다.",
    "zh": "开在 DeepSeek Harness 里的插件市场：设置 → 插件市场，浏览、搜索、一键安装 300+ 社区插件目录，带分类筛选、星数、排序和跟随界面语言的双语描述，还有专门的主题标签页可即时换肤。"
  },
  "dsh-tauri-desk/deepseek-harness-desktop": {
    "en": "A Tauri desktop build of DeepSeek Harness — a 5 MB installer with zero environment setup, preset plugins and support for Windows, macOS and Linux.",
    "ja": "DeepSeek Harness の Tauri デスクトップ版。インストーラはわずか 5MB、環境構築不要でプリセットプラグイン同梱、Windows / macOS / Linux 対応。",
    "ko": "DeepSeek Harness의 Tauri 데스크톱 버전. 설치 파일이 5MB에 불과하고 환경 설정이 필요 없으며 플러그인이 사전 탑재되어 Windows·macOS·Linux를 지원.",
    "zh": "DeepSeek Harness 的 Tauri 桌面版：安装包仅 5MB，零环境配置，预置插件，支持 Windows / macOS / Linux。"
  },
  "dsh-tui/dsh-tui": {
    "en": "A Claude Code-style terminal UI for DeepSeek Harness agents, shipped as an out-of-tree dsh plugin bundle so you can swap the whole interaction layer without touching the core.",
    "ja": "Claude Code 風の DSH 用ターミナル UI。ツリー外の dsh プラグイン bundle として提供され、コアに手を入れずに操作体系を丸ごと差し替えられる。",
    "ko": "Claude Code 스타일의 DSH 터미널 UI. 트리 외부 dsh 플러그인 번들로 제공되어 코어를 건드리지 않고 상호작용 계층 전체를 교체할 수 있다.",
    "zh": "Claude Code 风格的 DSH 终端界面：以树外 dsh 插件 bundle 形式提供，不改动核心即可换掉整套交互。"
  },
  "elysia395/dsh-wallpaper-engine": {
    "en": "Turns your local Wallpaper Engine wallpapers into the DSH web UI background — video playback, iframe-loaded web wallpapers, static frames from Scene wallpapers, plus a glassy settings panel and auto-rotation.",
    "ja": "ローカルの Wallpaper Engine の壁紙を DSH Web UI の背景に。動画再生、Web 壁紙の iframe 読み込み、Scene からの静止フレーム抽出に対応し、ガラス調設定パネルと自動切替も備える。",
    "ko": "로컬 Wallpaper Engine 배경화면을 DSH 웹 UI 배경으로. 동영상 재생, 웹 배경화면 iframe 로딩, Scene 정적 프레임 추출을 지원하며 글래스 설정 패널과 자동 전환도 제공.",
    "zh": "把本机 Wallpaper Engine 的壁纸变成 DSH 网页界面背景：视频动态播放、Web 壁纸 iframe 加载、Scene 提取静态帧，配液态玻璃设置面板与自动轮播。"
  },
  "fakechris/dsh-harness-ops": {
    "en": "An ops toolkit for DeepSeek Harness — A/B slot rotation of daily official snapshots with atomic switchover only after migration, build and acceptance pass, a 10-second watchdog that revives web and resumes the agent, plus a dsh-doctor command with nine diagnostics for full-outage recovery.",
    "ja": "DSH の運用ツールボックス。公式日次スナップショットを A/B 二枠でローテーションし、移行・ビルド・受け入れ通過後にのみ原子的に切替、ワンクリックでロールバック。10 秒ごとの watchdog が web を復帰させ、全停止時は dsh-doctor が九項目診断で自己修復する。",
    "ko": "DSH 운영 툴박스. 공식 일일 스냅샷을 A/B 두 슬롯으로 순환하고 마이그레이션·빌드·검수를 모두 통과해야 원자적으로 전환하며 원클릭 롤백을 지원. 10초 워치독이 web을 되살리고 전면 장애 시 dsh-doctor가 9개 진단으로 자가 복구한다.",
    "zh": "DSH 运维工具箱：官方每日快照 A/B 双槽轮换，迁移构建验收全过才原子切换并可一键回滚；守护进程 10 秒自动拉起 web 与断点续接；全挂时用 dsh-doctor 一条命令九项诊断自救。"
  },
  "feibi-mochi/deepseek-harness-control-center": {
    "en": "A control centre for DeepSeek Harness — account monitoring, usage accounting, completion alerts, official top-up, flexible layout and agent-assisted session controls.",
    "ja": "DSH のコントロールセンター。アカウント監視、使用量の記帳、完了通知、公式チャージ、柔軟なレイアウト、エージェント支援のセッション制御を提供。",
    "ko": "DSH 컨트롤 센터. 계정 모니터링, 사용량 정산, 완료 알림, 공식 충전, 유연한 레이아웃, 에이전트 보조 세션 제어를 제공.",
    "zh": "DSH 控制中心：账户监控、用量记账、完成提醒、官方充值入口、灵活布局与 Agent 辅助的会话控制。"
  },
  "feiyang-dev/dsh-usage-plugin": {
    "en": "A usage and spend plugin for DeepSeek Harness — per-call token usage and cache-hit stats, peak/off-peak pricing, balance lookup and CSV, JSON or PNG export.",
    "ja": "DSH の使用量・消費プラグイン。呼び出しごとの token 使用量とキャッシュヒットを集計し、ピーク／オフピーク料金、残高照会、CSV / JSON / PNG 出力に対応。",
    "ko": "DSH 사용량·소비 플러그인. 호출별 토큰 사용량과 캐시 적중을 집계하고 피크/오프피크 요금, 잔액 조회, CSV·JSON·PNG 내보내기를 지원.",
    "zh": "DSH 用量与消耗插件：统计每次调用的 token 用量与缓存命中，支持峰谷计费、余额查询与 CSV / JSON / PNG 导出。"
  },
  "flymysql/dsh-remote": {
    "en": "A remote-work assistant for DeepSeek Harness — connect over SSH with a key or password, pick a remote workspace, operate it with rw_* tools and SFTP-mirror it into a real local DSH workspace.",
    "ja": "DSH のリモートワーク支援プラグイン。鍵かパスワードで SSH 接続し、リモート作業ディレクトリを選んで rw_* ツールで操作、SFTP でローカルの DSH ワークスペースにミラーできる。",
    "ko": "DSH 원격 작업 도우미. 키나 비밀번호로 SSH에 접속해 원격 워크스페이스를 고르고 rw_* 도구로 조작하며 SFTP로 실제 로컬 DSH 워크스페이스에 미러링한다.",
    "zh": "DSH 远程办公助手：用密钥或密码连接 SSH，选定远端工作区后以 rw_* 工具操作，并通过 SFTP 镜像成真正的本地 DSH 工作区。"
  },
  "franksong2702/dsh-codex-connect": {
    "en": "Use openai-codex models and image generation inside DeepSeek Harness through ChatGPT OAuth, with self-check scripts covering the install and publish flow.",
    "ja": "ChatGPT の OAuth 経由で openai-codex モデルと画像生成を DSH から利用。インストールと公開フローの自己診断スクリプトも同梱。",
    "ko": "ChatGPT OAuth를 통해 openai-codex 모델과 이미지 생성을 DSH에서 사용. 설치·배포 흐름 자가 점검 스크립트를 포함.",
    "zh": "通过 ChatGPT OAuth 在 DSH 里使用 openai-codex 模型与图像生成，附安装与发布流程自检脚本。"
  },
  "freehul/sgme": {
    "en": "dsh adapter for SGME (ShiGuang Memory Engine): captures sessions into traceable long-term memory, injects the scenario-relevant parts back on the next turn, and exposes memory_search / wiki_search. ⚠️ Requires a self-hosted SGME server — the plugin alone is an empty shell.",
    "ja": "SGME（拾光メモリエンジン）の dsh アダプタ：会話を追跡可能な長期記憶として蓄積し、次の対話でシーンに応じて注入、memory_search / wiki_search も提供。⚠️ SGME 本体サーバーの自前構築が前提——プラグイン単体では空の器。",
    "ko": "SGME(스광 메모리 엔진)의 dsh 어댑터: 세션을 추적 가능한 장기 기억으로 쌓고 다음 대화에 상황별로 주입하며 memory_search / wiki_search를 제공한다. ⚠️ SGME 본체 서버를 직접 띄워야 하며, 플러그인만으로는 빈 껍데기다.",
    "zh": "SGME 拾光记忆引擎的 dsh 接入插件：自动把会话沉淀成可溯源的长期记忆，下次对话按场景注入回来，并提供 memory_search / wiki_search 检索。⚠️ 需先自建并运行 SGME 本体服务，否则插件是空壳。"
  },
  "fuhefei/dsh-sentinel": {
    "en": "Condition-driven wakeup for DeepSeek Harness — durable file, command, HTTP, process and webhook watches that wake the agent, with a dock, sidebar branch and global dashboard.",
    "ja": "条件駆動のウェイクアップ・プラグイン。ファイル・コマンド・HTTP・プロセス・webhook の永続的な監視でエージェントを起こし、dock、サイドバー分岐、全体ダッシュボードを備える。",
    "ko": "조건 기반 웨이크업 플러그인. 파일, 명령, HTTP, 프로세스, 웹훅을 지속적으로 감시해 에이전트를 깨우고 독, 사이드바 분기, 전역 대시보드를 제공.",
    "zh": "条件驱动的唤醒插件：持久化监听文件、命令、HTTP、进程与 webhook 变化并唤醒 Agent，配 dock、侧边栏分支与全局看板。"
  },
  "fwerkor/local-shell-mcp": {
    "en": "An MCP server that gives an LLM access to a CLI environment, exposing local shell capability to agents over the standard protocol.",
    "ja": "LLM に CLI 環境を使わせる MCP サーバー。ローカルシェルの機能を標準プロトコル経由でエージェントに公開する。",
    "ko": "LLM이 CLI 환경을 사용하게 해주는 MCP 서버. 로컬 셸 기능을 표준 프로토콜로 에이전트에 노출한다.",
    "zh": "让 LLM 使用命令行环境的 MCP 服务端：把本地 shell 能力以标准协议暴露给 Agent。"
  },
  "happyren/dsh-agent-messaging": {
    "en": "Cross-session verification, claims and a decision ledger for DeepSeek Harness — so two agent sessions don't repeat, contradict or deadlock each other.",
    "ja": "セッションを跨いだ検証、主張、意思決定台帳。二つのエージェントセッションが作業を重複させたり、矛盾したり、デッドロックしたりしないようにする。",
    "ko": "세션 간 검증, 주장, 의사결정 원장. 두 에이전트 세션이 작업을 중복하거나 서로 모순되거나 교착에 빠지지 않게 한다.",
    "zh": "跨会话验证、断言与决策台账：让两个 Agent 会话不再重复劳动、互相矛盾或彼此死锁。"
  },
  "hellodigua/dsh-emoji": {
    "en": "Adds custom inline emojis to DSH replies.",
    "ja": "DSH の返信にカスタムのインライン絵文字を追加。",
    "ko": "DSH 답변에 커스텀 인라인 이모지를 더한다.",
    "zh": "让 AI 回复带上自定义表情：支持 Bilibili、小红书、贴吧、知乎等多平台表情包，也可自行导入。"
  },
  "hellodigua/dsh-share": {
    "en": "Export one or many DSH turns as a long PNG or Markdown: enter selection mode from the top-right, tick the turns you want, and everything — code blocks, tables, images, tool-call summaries — comes out intact, with adjustable width and font size.",
    "ja": "DSH の 1 ターンまたは複数ターンの問答を PNG 長画像や Markdown に書き出すプラグイン。右上から選択モードに入って必要な問答だけを選び、コードブロック・表・画像・ツール呼び出しの要約はそのまま保持。画像の幅と文字サイズも調整可能。",
    "ko": "DSH의 한 턴 또는 여러 턴 대화를 PNG 긴 이미지나 Markdown으로 내보내는 플러그인. 오른쪽 위에서 선택 모드로 들어가 원하는 문답만 고르고, 코드 블록·표·이미지·도구 호출 요약을 그대로 보존한다. 이미지 너비와 글자 크기도 조절할 수 있다.",
    "zh": "把 DSH 的一轮或多轮问答导出成 PNG 长图或 Markdown：右上角进入选择模式勾选问答，代码块、表格、图片与工具调用摘要原样保留，图片宽度与字号可调。"
  },
  "hikariming/dshfind": {
    "en": "A learning and sharing community site built around DeepSeek Harness: structured lessons running from the basics to a chapter-by-chapter dive into the Cordis paper, a live plugin marketplace aggregated from the GitHub `dsh-plugin` topic, plus development guides, a glossary and community rankings.",
    "ja": "DeepSeek Harness を中心に据えた学習・共有コミュニティサイト。入門から Cordis 論文の章ごとの読み解きまで続く体系的な講座、GitHub の `dsh-plugin` トピックから自動集約されるプラグインマーケット、そしてプラグイン開発ガイド・用語集・作者とプロジェクトのランキングを揃える。",
    "ko": "DeepSeek Harness를 중심으로 만든 학습·공유 커뮤니티 사이트. 입문부터 Cordis 논문 장별 해설까지 이어지는 체계적인 강의, GitHub `dsh-plugin` 토픽에서 자동 집계되는 플러그인 마켓, 그리고 플러그인 개발 가이드와 용어집, 작성자·프로젝트 랭킹을 갖췄다.",
    "zh": "围绕 DeepSeek Harness 建的学习与分享社区站：从入门到 Cordis 论文逐章拆解的系统课程、按 GitHub `dsh-plugin` topic 自动聚合的插件市场，以及插件开发指南、术语表和作者项目排行榜。"
  },
  "howmp/dsh-pentest": {
    "en": "A penetration testing mode for DeepSeek Harness from CloverSecLabs, providing workflow support for authorised security testing.",
    "ja": "CloverSecLabs による DeepSeek Harness 向けペネトレーションテスト・モード。認可されたセキュリティテストのワークフローを支援する。",
    "ko": "CloverSecLabs가 만든 DeepSeek Harness용 침투 테스트 모드. 승인된 보안 테스트 워크플로를 지원.",
    "zh": "面向 DeepSeek Harness 的渗透测试模式插件，由 CloverSecLabs 出品，为授权安全测试提供工作流支持。"
  },
  "huiliyi37/dsh-tianshu-tui": {
    "en": "Interactive terminal UI + harness workflow plugin for DeepSeek Harness. Its rendering core evolved from the self-built Tianshu-Tui harness agent, adding TDD and evidence-gate workflows on top of the official base.",
    "ja": "DeepSeek Harness の対話式端末 UI + harness ワークフロープラグイン。描画コアは自作 harness agent「Tianshu-Tui」から発展し、公式ベースに TDD やエビデンスゲートなどのワークフローを追加。",
    "ko": "DeepSeek Harness의 인터랙티브 터미널 UI + harness 워크플로 플러그인. 렌더링 코어는 자체 개발 harness agent Tianshu-Tui에서 발전했으며, 공식 기반 위에 TDD·증거 게이트 워크플로를 더했다.",
    "zh": "DeepSeek Harness 终端 UI + harness 工作流插件。渲染核心由自研 harness agent Tianshu-Tui 演进而来，在官方基础上增加 TDD 与证据门等工作流。"
  },
  "humblebanana/dsh-record-replay": {
    "en": "Record macOS desktop workflows by demonstration and turn them into agent skills for DeepSeek Harness, producing an open-record-replay skill plus orr_* tools.",
    "ja": "macOS のデスクトップ操作を実演で録画し、エージェントのスキルに変換する。open-record-replay スキルと orr_* ツールを生成。",
    "ko": "macOS 데스크톱 작업 흐름을 시연으로 녹화해 에이전트 스킬로 변환. open-record-replay 스킬과 orr_* 도구를 생성한다.",
    "zh": "在 macOS 上录制桌面操作流程并转成 Agent 技能：以演示代替编写，产出 open-record-replay 技能与 orr_* 工具。"
  },
  "hust-open-atom-club/oh-dsh": {
    "en": "One DSH runtime, three developer experiences — Desktop, Web and TUI. A single `ohdsh` command launches any of them, with sessions, credentials, skins and plugin cache shared across all three.",
    "ja": "ひとつの DSH ランタイムで、Desktop・Web・TUI の三つの開発体験。同じ `ohdsh` コマンドで三つとも起動でき、セッション・認証情報・スキン・プラグインキャッシュを共有します。",
    "ko": "하나의 DSH 런타임으로 Desktop, Web, TUI 세 가지 개발 경험. 같은 `ohdsh` 명령으로 셋 다 실행되며 세션·자격 증명·스킨·플러그인 캐시를 공유합니다.",
    "zh": "一套 DSH runtime，Desktop、Web 与 TUI 三种开发体验：同一个 ohdsh 命令启动三端，会话、凭据、皮肤与插件缓存全部互通。"
  },
  "hyhmrright/brooks-lint": {
    "en": "An AI code-review skill grounded in twelve classic engineering books: it diagnoses your code against six production decay risks (plus six test-suite decay risks), returning every finding with a book citation, a severity label, a concrete remedy, and a 0–100 health score.",
    "ja": "12 冊のソフトウェア工学の古典を AI コードレビューの基準に変える Skill。認知負荷・変更伝播など 6 つの本番コード劣化リスク（さらにテスト劣化リスク 6 つ）で診断し、各指摘に書籍の出典・深刻度・具体的な修正案を添え、0〜100 の健全性スコアを算出する。",
    "ko": "12권의 소프트웨어 공학 고전을 AI 코드 리뷰 기준으로 바꾸는 Skill. 인지 부하·변경 전파 등 6가지 프로덕션 코드 부패 위험(그리고 테스트 부패 위험 6가지)으로 진단하고, 모든 지적에 출처 서적·심각도·구체적 수정안을 붙여 0~100 건강 점수를 낸다.",
    "zh": "把十二本软件工程经典变成 AI 代码审查基准的 Skill：从认知负荷、变更扩散、知识重复等六个生产代码腐化风险（外加六个测试腐化风险）逐项体检，每条结论都带书目出处、严重级别和具体改法，并给出 0–100 健康分。"
  },
  "hyqhyq3/dsh-mcp-manager": {
    "en": "An MCP server manager for DeepSeek Harness — adds a Settings → MCP page with OAuth (PKCE plus dynamic client registration) or static-token auth, registering tools as mcp__<name>__*.",
    "ja": "DSH の MCP サーバー管理プラグイン。設定に MCP ページを追加し、OAuth（PKCE + 動的クライアント登録）または静的トークン認証に対応、ツールを mcp__<name>__* として登録する。",
    "ko": "DSH의 MCP 서버 관리 플러그인. 설정에 MCP 페이지를 추가하고 OAuth(PKCE + 동적 클라이언트 등록) 또는 정적 토큰 인증을 지원하며 도구를 mcp__<name>__*로 등록한다.",
    "zh": "DSH 的 MCP 服务器管理插件：设置页新增 MCP 标签，支持 OAuth（PKCE + 动态客户端注册）或静态令牌鉴权，工具以 mcp__<name>__* 注册。"
  },
  "icodesign/orbis": {
    "en": "Orbis — a mobile client for remotely controlling DeepSeek Harness, letting you monitor and drive your agent from a phone.",
    "ja": "Orbis は DeepSeek Harness のモバイル遠隔操作クライアント。スマホから遠隔のエージェントを確認し操作できる。",
    "ko": "Orbis는 DeepSeek Harness 모바일 원격 제어 클라이언트. 휴대폰에서 원격 에이전트를 확인하고 조작할 수 있다.",
    "zh": "Orbis：DeepSeek Harness 的移动端远程控制客户端，在手机上查看并操作远端 Agent。"
  },
  "imsai-sh/awesome-deepseek-harness-plugins": {
    "en": "A DeepSeek Harness plugin store and hub with 3,100+ plugins — search, rankings, install commands and a free public API, all auto-collected and format-validated.",
    "ja": "DSH のプラグインストア兼ハブ。3,100 超のプラグインを収録し、検索・ランキング・インストールコマンド・無料の公開 API を提供。自動収集とフォーマット検証つき。",
    "ko": "DSH 플러그인 스토어 겸 허브. 3,100개 이상 플러그인을 수록하고 검색, 랭킹, 설치 명령, 무료 공개 API를 제공하며 자동 수집과 형식 검증을 거친다.",
    "zh": "DSH 插件市场与聚合站：收录 3,100+ 插件，提供搜索、排行、安装命令与免费公开 API，自动采集并做格式校验。"
  },
  "iuikj/dsh-desktop": {
    "en": "A visually polished desktop client for DeepSeek Harness, open to community plugin contributions.",
    "ja": "見た目を丁寧に調整した DeepSeek Harness デスクトップクライアント。コミュニティプラグインの参加も歓迎している。",
    "ko": "화면을 세심하게 다듬은 DeepSeek Harness 데스크톱 클라이언트. 커뮤니티 플러그인 참여를 환영한다.",
    "zh": "一个界面经过微调打磨的 DeepSeek Harness 桌面客户端，欢迎社区插件接入。"
  },
  "jing-hy/picturereader": {
    "en": "Pixel-to-text image reading for text-only models — image_scan, image_ocr and image_sample tools plus an image-reading skill built on a 34-image trained methodology. Runs fully locally.",
    "ja": "テキスト専用モデルにピクセル単位の画像読解を提供。image_scan / image_ocr / image_sample ツールと読図スキルを備え、完全ローカルで動作する。",
    "ko": "텍스트 전용 모델에 픽셀 단위 이미지 판독을 제공. image_scan, image_ocr, image_sample 도구와 이미지 판독 스킬을 갖췄으며 완전히 로컬에서 동작한다.",
    "zh": "为纯文本模型提供逐像素读图能力：提供 image_scan / image_ocr / image_sample 工具与配套读图技能，纯本地运行。"
  },
  "joejojoking-cloud/dsh-file-explorer": {
    "en": "A file explorer for DeepSeek Harness — file tree, preview, Markdown rendering, syntax highlighting, in-panel editing and VS Code integration.",
    "ja": "DSH のグローバルなファイルエクスプローラ・プラグイン。ファイルツリー、プレビュー、Markdown 表示、シンタックスハイライト、パネル内編集、VS Code 連携に対応。",
    "ko": "DSH 전역 파일 탐색기 플러그인. 파일 트리, 미리보기, Markdown 렌더링, 구문 강조, 패널 내 편집, VS Code 연동을 지원.",
    "zh": "DSH 全局文件资源管理器插件：文件树、预览、Markdown 渲染、语法高亮、面板内编辑与 VS Code 集成。"
  },
  "kejixiaoliang/awesome-dsh-plugins": {
    "en": "A curated directory of DeepSeek Harness plugins — 280+ community plugins across 14 categories covering MCP, skills, TUI, multi-agent, context memory and UI skins, each linking straight to its repo.",
    "ja": "DSH プラグインの厳選ディレクトリ。14 分類 280 超のコミュニティプラグインを収録し、MCP・Skill・TUI・マルチエージェント・文脈記憶・UI スキンを網羅、リンクから直接リポジトリへ飛べる。",
    "ko": "DSH 플러그인 엄선 디렉터리. 14개 분류 280개 이상 커뮤니티 플러그인을 수록하며 MCP, 스킬, TUI, 멀티 에이전트, 컨텍스트 메모리, UI 스킨을 아우르고 링크로 저장소에 바로 갈 수 있다.",
    "zh": "DSH 插件精选目录：14 类 280+ 个社区插件，覆盖 MCP、Skill、TUI、多 Agent、上下文记忆与 UI 皮肤，点链接直达仓库。"
  },
  "keleus/deepseek-pet": {
    "en": "Keep a freeloading blue whale on your deepseek-harness — a desktop companion plugin that is pure company and does no work at all.",
    "ja": "deepseek-harness の上で、ごはんを食べるだけのシロナガスクジラを飼うプラグイン。仕事はしない、純粋な相棒。",
    "ko": "deepseek-harness 위에서 밥만 축내는 흰긴수염고래를 키우는 플러그인. 일은 하지 않는 순수한 동반자.",
    "zh": "在你的 deepseek-harness 上养一只吃白饭的大蓝鲸：桌面伴侣插件，纯陪伴不干活。"
  },
  "kingOfSoySauce/dsh-liang-skin": {
    "en": "A rheostat-style skin for DeepSeek Harness that turns reasoning effort into a draggable slider, wired directly into reasoning.efforts and the model directory.",
    "ja": "DeepSeek Harness 用スライダー式スキン。推論の強度をドラッグ可能なスライダーとして表現し、reasoning.efforts とモデルディレクトリに直結している。",
    "ko": "DeepSeek Harness용 슬라이더형 스킨. 추론 강도를 드래그 가능한 슬라이더로 표현하고 reasoning.efforts와 모델 디렉터리에 직접 연결된다.",
    "zh": "DeepSeek Harness 滑动变阻器皮肤：把推理强度做成可拖动的滑杆，深度挂接 reasoning.efforts 与模型目录。"
  },
  "kingOfSoySauce/dsh-skin-market": {
    "en": "A skin marketplace for DeepSeek Harness with 100+ curated skins, a rating system backed by human review, an online preview site and in-app management of locally installed skins.",
    "ja": "DSH のスキンマーケット。100 種類超を収録し、評価システムと人手審査、オンラインプレビュー、ローカル導入済みスキンの管理までカバー。",
    "ko": "DSH 스킨 마켓. 100종 이상을 수록하고 평점 시스템과 수동 심사, 온라인 미리보기, 로컬 설치 스킨 관리까지 제공.",
    "zh": "DSH 皮肤市场：已收录 100+ 皮肤，带评分系统与人工审核，可在线预览，也可用插件管理本地已装皮肤。"
  },
  "knqiufan/powercontext-dsh": {
    "en": "A DeepSeek Harness plugin that connects to a PowerContext server over HTTP for recall, memory, handoff, experience reuse and skills.",
    "ja": "HTTP で PowerContext サーバーに接続する DSH プラグイン。想起、記憶、引き継ぎ、経験の再利用、スキルの各機能を提供する。",
    "ko": "HTTP로 PowerContext 서버에 연결하는 DSH 플러그인. 회상, 기억, 인계, 경험 재사용, 스킬 기능을 제공.",
    "zh": "通过 HTTP 连接 PowerContext 服务端的 DSH 插件：提供召回、记忆、任务交接、经验复用与技能能力。"
  },
  "left0ver/dsh-file-review": {
    "en": "Review the files an agent just changed, right inside DeepSeek Harness — see the diff of this turn's edits the moment they land.",
    "ja": "エージェントが変更したファイルをその場でレビュー。DSH 内で今回の編集の diff をすぐ確認できる。",
    "ko": "에이전트가 방금 수정한 파일을 즉시 검토. DSH 안에서 이번 턴 변경의 diff를 바로 확인할 수 있다.",
    "zh": "立刻审查 Agent 对文件的修改：在 DSH 里直接查看本轮改动的 diff，改完就能核对。"
  },
  "lehhair/dsh-diff-viewer": {
    "en": "A PiUI-style diff viewer for the DSH web GUI that replaces the stock DiffBlock for write and edit tool calls via ui-tool diff-card chain slots.",
    "ja": "DSH Web GUI の PiUI 風 diff ビューアプラグイン。ui-tool diff-card チェーンスロット経由で write/edit ツール呼び出しの標準 DiffBlock を置き換える（ホストパッチ同梱）。",
    "ko": "DSH Web GUI의 PiUI 스타일 diff 뷰어 플러그인. ui-tool diff-card 체인 슬롯으로 write/edit 도구 호출의 기본 DiffBlock을 대체한다(호스트 패치 포함).",
    "zh": "DSH Web GUI 的 PiUI 风格 diff 查看器插件：通过 ui-tool diff-card 链式插槽替换 write/edit 工具调用的原生 DiffBlock（附宿主补丁）。"
  },
  "lencx/Minke": {
    "en": "A native desktop workspace for DeepSeek Harness — an Electron client that wraps the full DSH session and project experience in a standalone app.",
    "ja": "DeepSeek Harness 用デスクトップ・ワークスペース。Electron 製のネイティブクライアントで、DSH のセッションとプロジェクト管理を単体アプリとして提供。",
    "ko": "DeepSeek Harness용 데스크톱 워크스페이스. Electron 기반 네이티브 클라이언트로 DSH 세션과 프로젝트 관리를 독립 앱으로 제공.",
    "zh": "DeepSeek Harness 桌面工作台：基于 Electron 的原生客户端，提供完整的 DSH 会话与项目管理界面。"
  },
  "lhh010/dsh-minigames": {
    "en": "A mini-game panel on the right of the DSH web UI with 18 offline games — endless runner, Tetris, tank battle, minesweeper, 2048, sudoku, Pac-Man and more — behind an extensible game registry.",
    "ja": "DSH Web UI の右側ミニゲームパネル。18 種のオフラインゲーム（ジャンプ、テトリス、戦車、マインスイーパ、2048、数独、パックマンなど）を収録し、レジストリで拡張できる。",
    "ko": "DSH 웹 UI 우측 미니게임 패널. 18종 오프라인 게임(점프, 테트리스, 탱크, 지뢰찾기, 2048, 스도쿠, 팩맨 등)을 담았고 게임 레지스트리로 확장할 수 있다.",
    "zh": "DSH Web UI 右侧小游戏面板：18 款离线小游戏（跳一跳、俄罗斯方块、坦克大战、扫雷、2048、数独、吃豆人等），游戏注册表可扩展。"
  },
  "lhh010/dsh-paste-input": {
    "en": "File input enhancements for the DSH web UI — Ctrl+V paste with a first-run notice, drag-and-drop and file picking, copying files into the session workspace temp directory on send.",
    "ja": "DSH WebUI のファイル入力強化。Ctrl+V の貼り付け、ドラッグ＆ドロップ、ファイル選択に対応し、送信時にセッション作業ディレクトリの一時領域へコピーする。",
    "ko": "DSH 웹 UI 파일 입력 강화. Ctrl+V 붙여넣기, 드래그 앤 드롭, 파일 선택을 지원하며 전송 시 세션 워크스페이스 임시 디렉터리로 복사한다.",
    "zh": "DSH WebUI 文件输入增强：支持 Ctrl+V 粘贴、拖拽与选择文件，发送时自动复制进会话工作区的临时目录。"
  },
  "lhh010/dsh-ui-progress": {
    "en": "A session progress bar docked by the DSH input box showing real todo progress, live token generation rate, an orange interrupted state and pending-task reminders. No core changes.",
    "ja": "会話の進捗プラグイン。入力欄のドック領域に進捗バーを常駐させ、todos の実進捗、リアルタイムの token 生成速度、中断時のオレンジ表示、未処理タスクの通知を出す。コア改変ゼロ。",
    "ko": "세션 진행률 플러그인. 입력창 도크 영역에 진행 바를 상주시켜 todos 실제 진행률, 실시간 토큰 생성 속도, 중단 시 주황 상태, 대기 작업 알림을 보여준다. 코어 변경 없음.",
    "zh": "会话进度插件：输入框停靠区常驻进度条，显示 todos 真实进度、实时 token 生成速率、中断橘红态与待办提醒，零核心改动。"
  },
  "lhh010/dsh-ui-whale": {
    "en": "A hand-drawn pixel whale companion that lives in the DSH conversation title bar — blinks and flicks its tail idle, animates while thinking, spouts water when a turn completes and hearts when clicked. No core changes.",
    "ja": "手描きピクセルのクジラ相棒プラグイン。会話タイトルバーに常駐し、普段はまばたきや尾ひれを動かし、思考中は動き続け、ターン完了で潮を吹き、クリックでハートが出る。コア改変ゼロ。",
    "ko": "손그림 픽셀 고래 동반자 플러그인. 대화 제목 표시줄에 상주하며 평소엔 눈을 깜빡이고 꼬리를 흔들며, 생각할 땐 계속 움직이고 턴이 끝나면 물을 뿜고 클릭하면 하트가 나온다. 코어 변경 없음.",
    "zh": "全手绘像素鲸鱼伙伴插件：常驻会话标题栏，平时眨眼摆尾，思考时持续动作，回合完成头顶喷水，点击冒爱心，零核心改动。"
  },
  "lhmd/dsh-director-toolkit": {
    "en": "A DeepSeek Harness plugin for 3D artists, technical designers and creative coders — paste a half-formed idea, reference note or portfolio caption and get compact directional guidance back.",
    "ja": "3D アーティスト、テクニカルデザイナー、クリエイティブコーダー向けの DSH ディレクターツールキット。半端なアイデアや参考メモを貼るだけで、簡潔な方向性の指針が返ってくる。",
    "ko": "3D 아티스트, 테크니컬 디자이너, 크리에이티브 코더를 위한 DSH 디렉터 툴킷. 덜 다듬어진 아이디어나 참고 메모를 붙여 넣으면 간결한 방향성 지침을 돌려준다.",
    "zh": "面向 3D 艺术家、技术设计师与创意程序员的 DSH 导演工具箱：贴进半成型的想法或参考笔记，得到紧凑可执行的创作指导。"
  },
  "lhmd/dsh-promotion-toolkit": {
    "en": "Turns any idea into platform-native publicity content, rewriting your message to match each platform's tone from a single input.",
    "ja": "どんなアイデアも各プラットフォームに馴染む宣伝コンテンツに変換。一度の入力から、媒体ごとのトーンに合わせて書き分ける。",
    "ko": "어떤 아이디어든 각 플랫폼에 어울리는 홍보 콘텐츠로 변환. 한 번의 입력으로 플랫폼별 톤에 맞춰 다시 쓴다.",
    "zh": "把任意想法变成各平台原生的宣发内容：按平台调性改写文案，一次输入多处产出。"
  },
  "libukai/awesome-deepseek-harness": {
    "en": "The ultimate guide to DeepSeek Harness, curated on a less-is-more principle: quick start (web UI, running from source, the Python SDK, installing plugins), official and community resources, third-party clients across desktop, terminal, mobile and web, curated plugins by category, external integrations and developer tools.",
    "ja": "DeepSeek Harness の究極ガイド。「少なく、良いものを」という原則で厳選された資料集——クイックスタート（Web UI、ソースからの実行、Python SDK、プラグイン導入）、公式・コミュニティ資料、デスクトップ/ターミナル/モバイル/Web のサードパーティクライアント、分野別の厳選プラグイン、外部連携と開発ツール。",
    "ko": "DeepSeek Harness 최종 가이드. '적지만 좋은 것' 원칙으로 엄선한 자료 모음 — 빠른 시작(웹 UI, 소스 실행, Python SDK, 플러그인 설치), 공식·커뮤니티 자료, 데스크톱/터미널/모바일/웹 서드파티 클라이언트, 분야별 엄선 플러그인, 외부 연동과 개발 도구.",
    "zh": "DeepSeek Harness 终极指南：遵循少而精的原则收集精选资源——快速开始（Web UI、源码运行、Python SDK、装插件）、官方与社区资源、第三方客户端（桌面/终端/移动/Web）、按场景分类的精选插件、外部集成与开发工具。"
  },
  "liceses/dsh-gitbash-preset": {
    "en": "One-click install of a Git Bash agent preset for DeepSeek Harness — maps the bash calls in DSH minimal mode onto Git for Windows MSYS bash so minimal mode actually works on Windows.",
    "ja": "「ミニマルモード（Git Bash）」プリセットをワンクリック導入。DSH ミニマルモードの bash 呼び出しを Git for Windows の MSYS bash に対応付け、Windows でも実用可能にする。",
    "ko": "'미니멀 모드(Git Bash)' 프리셋을 원클릭 설치. DSH 미니멀 모드의 bash 호출을 Git for Windows의 MSYS bash로 매핑해 Windows에서도 실제로 동작하게 한다.",
    "zh": "一键安装「极简模式 (Git Bash)」预设：把 DSH 极简模式里的 bash 调用映射到 Git for Windows 的 MSYS bash，让 Windows 上的极简模式真正可用。"
  },
  "liguobao/deepseek-harness-remote": {
    "en": "A multi-device remote access solution built on the DeepSeek Harness plugin system, letting desktop and Android clients securely connect to and operate a remote Harness.",
    "ja": "DSH のプラグイン機構を用いたマルチデバイス遠隔アクセス。デスクトップと Android から遠隔の Harness に安全に接続して操作できる。",
    "ko": "DSH 플러그인 메커니즘을 활용한 멀티 디바이스 원격 접속. 데스크톱과 Android에서 원격 Harness에 안전하게 연결해 조작할 수 있다.",
    "zh": "基于 DSH 插件机制的多端远程访问方案：让桌面端与 Android 端安全连接并操作远程 Harness。"
  },
  "liguobao/dsh-desktop": {
    "en": "An independent, open-source desktop wrapper for DeepSeek Harness — starts the bundled @deepseek-ai/dsh web UI locally and loads it in a hardened Electron window on Linux, macOS and Windows.",
    "ja": "独立したオープンソースの DSH デスクトップラッパー。同梱の @deepseek-ai/dsh Web UI をローカル起動し、堅牢化した Electron ウィンドウで読み込む。Linux・macOS・Windows 対応。",
    "ko": "독립적인 오픈소스 DSH 데스크톱 래퍼. 내장된 @deepseek-ai/dsh 웹 UI를 로컬에서 실행해 보안 강화된 Electron 창에 로드한다. Linux, macOS, Windows 지원.",
    "zh": "独立开源的 DSH 桌面外壳：本地启动内置的 @deepseek-ai/dsh Web UI，并在加固过的 Electron 窗口中加载，支持 Linux、macOS 与 Windows。"
  },
  "liustack/modlens": {
    "en": "Gives a text-only model sight: paste an image straight into the composer and it reads it — no saving to a file and passing a path first. The first vision plugin in the DSH ecosystem.",
    "ja": "テキスト専用モデルに視覚を与える。画像を入力欄に貼るだけで読み取り、ファイル保存やパス受け渡しは不要。DSH エコシステム初のビジョンプラグイン。",
    "ko": "텍스트 전용 모델에 눈을 달아 준다. 이미지를 입력창에 붙여넣기만 하면 읽으며, 파일로 저장해 경로를 넘길 필요가 없다. DSH 생태계 최초의 비전 플러그인.",
    "zh": "给纯文本模型装上眼睛：图片直接粘进对话框就能读，不用先存成文件再传路径。DSH 生态的第一个视觉插件。"
  },
  "liustack/modsearch": {
    "en": "Gives the web to models that lack it: search, X search, and single-page fetch. Six engines with automatic failover, and the default one is free.",
    "ja": "ネットを持たないモデルにウェブを渡す。検索・X 検索・単一ページ取得に対応。6 つのエンジンが自動フェイルオーバーし、既定エンジンは無料。",
    "ko": "웹이 없는 모델에 웹을 준다. 검색·X 검색·단일 페이지 수집. 엔진 6개가 자동 페일오버하며 기본 엔진은 무료.",
    "zh": "把网络接给没有网络的模型：搜索、X 搜索、单页抓取。六个引擎自动故障转移，默认引擎免费。"
  },
  "liyupi/dsh-kun-like-pet": {
    "en": "The Kun Like desktop pet for DeepSeek Harness — a companion in the bottom-right corner that cycles nine animations based on agent state and celebrates when a task finishes.",
    "ja": "Kun Like デスクトップペット・プラグイン。右下のペットがエージェントの状態に応じて 9 種類の動きを切り替え、タスク完了時には専用の演出が入る。",
    "ko": "Kun Like 데스크톱 펫 플러그인. 우측 하단 펫이 에이전트 상태에 따라 9가지 동작을 바꾸고 작업이 끝나면 전용 연출을 재생한다.",
    "zh": "Kun Like 桌宠插件：右下角小坤宠随 Agent 工作状态切换 9 种动作，任务完成时播放专属音效。"
  },
  "lsz-asd/dsh-plugin-session-delete": {
    "en": "Delete DeepSeek Harness sessions from the UI — a header danger button plus a sidebar session-row menu item that doesn't jump conversations, with a risk-consent dialog showing the session name and id, stopping any running work.",
    "ja": "UI から DSH のセッションを削除。ヘッダーの危険操作ボタンとサイドバーの行メニューの二経路を用意し、セッション名と id を示す確認ダイアログを挟み、実行中の処理は停止する。",
    "ko": "UI에서 DSH 세션을 삭제. 헤더의 위험 작업 버튼과 사이드바 세션 행 메뉴 두 경로를 제공하고 세션 이름과 id를 보여주는 확인 대화상자를 거치며 실행 중인 작업은 중단한다.",
    "zh": "在界面里直接删除 DSH 会话：标题栏危险按钮与侧边栏会话行菜单两个入口，带会话名与 id 的风险确认弹窗，删除时会停掉正在跑的任务。"
  },
  "lzszq/dsh-scholar": {
    "en": "dsh-scholar — an academic search and literature assistance plugin for DeepSeek Harness.",
    "ja": "dsh-scholar。DeepSeek Harness 向けの学術検索・文献支援プラグイン。",
    "ko": "dsh-scholar. DeepSeek Harness용 학술 검색·문헌 지원 플러그인.",
    "zh": "dsh-scholar：面向 DeepSeek Harness 的学术检索与文献辅助插件。"
  },
  "mexiaosqwq/dsh-web-mobile": {
    "en": "Adapts the DeepSeek Harness web UI for mobile devices and portrait screens, reworking narrow-viewport layout so it stays usable on a phone.",
    "ja": "dsh を縦画面などモバイル端末にできる限り最適化。狭い画面のレイアウトを調整し、スマホでも扱いやすくする。",
    "ko": "dsh를 세로 화면 등 모바일 기기에 최대한 맞춘다. 좁은 화면 레이아웃을 조정해 휴대폰에서도 쓰기 편하게 만든다.",
    "zh": "尽可能让 dsh 适配竖屏等移动端设备：优化窄屏布局，手机上也能顺手操作。"
  },
  "mishibeikejie/zat-dsh-engine": {
    "en": "A visual plugin marketplace for DeepSeek Harness — browse, search and install community plugins.",
    "ja": "ビジュアルな DSH プラグインマーケット。コミュニティプラグインを閲覧・検索・導入できる。",
    "ko": "시각적인 DSH 플러그인 마켓. 커뮤니티 플러그인을 탐색하고 검색해 설치할 수 있다.",
    "zh": "可视化的 DSH 插件市场：浏览、搜索并安装社区插件。"
  },
  "modusensus/dsh-mneme": {
    "en": "A structured memory engine for DeepSeek Harness with offline semantic search, entity-attribute-timeline modelling, autoDream self-consolidation and human-editable Markdown storage.",
    "ja": "構造化メモリエンジン。オフライン意味検索、エンティティ-属性-タイムライン、autoDream による自己統合を備え、人が直接編集できる Markdown で保存する。",
    "ko": "구조화 메모리 엔진. 오프라인 의미 검색, 엔티티-속성-타임라인 모델링, autoDream 자기 통합을 갖추고 사람이 직접 편집할 수 있는 Markdown으로 저장한다.",
    "zh": "结构化记忆引擎：离线语义检索、实体-属性-时间线建模、autoDream 自我整合，存储用人类可直接编辑的 Markdown。"
  },
  "mrpulor-gh/nuphus-mcp": {
    "en": "A desktop automation MCP server bringing computer use to any AI agent — control the screen, windows, mouse, keyboard and Chrome over the Model Context Protocol (stdio).",
    "ja": "デスクトップ自動化の MCP サーバー。Model Context Protocol（stdio）経由で画面・ウィンドウ・マウス／キーボード・Chrome を操作でき、どの AI エージェントからも利用できる。",
    "ko": "데스크톱 자동화 MCP 서버. Model Context Protocol(stdio)로 화면, 창, 마우스·키보드, Chrome을 제어하며 어떤 AI 에이전트에서도 사용할 수 있다.",
    "zh": "桌面自动化 MCP 服务端：通过 Model Context Protocol（stdio）控制屏幕、窗口、鼠标键盘与 Chrome，任何 AI Agent 都能用。"
  },
  "multica-ai/dsh-multica-runtime": {
    "en": "Adds dsh runtime support on Multica, letting DeepSeek Harness run on the Multica platform.",
    "ja": "Multica 上で dsh ランタイムをサポート。DeepSeek Harness を Multica プラットフォームで動かせるようにする。",
    "ko": "Multica에서 dsh 런타임을 지원. DeepSeek Harness를 Multica 플랫폼에서 실행할 수 있게 한다.",
    "zh": "在 Multica 上支持 dsh 运行时：把 DeepSeek Harness 接入 Multica 平台运行。"
  },
  "ningbainb/deepseek-harness-desktop": {
    "en": "An open-source Windows desktop client and GUI for DeepSeek Harness — a zero-setup installer bundling Codex, plugins, skills, SSH, mobile remote access and 11 skins.",
    "ja": "オープンソースの DSH Windows デスクトップクライアント兼 GUI。設定不要のインストーラに Codex、プラグイン、スキル、SSH、モバイル遠隔操作、11 種のスキンを同梱。",
    "ko": "오픈소스 DSH Windows 데스크톱 클라이언트 겸 GUI. 설정이 필요 없는 설치 파일에 Codex, 플러그인, 스킬, SSH, 모바일 원격 접속, 11종 스킨을 포함.",
    "zh": "开源的 DSH Windows 桌面客户端与图形界面：零配置安装包，内置 Codex、插件、技能、SSH、手机远程访问与 11 套皮肤。"
  },
  "oil-oil/dsh-vision": {
    "en": "Near-native image understanding for DeepSeek Harness, letting the agent read screenshots and images directly.",
    "ja": "DeepSeek Harness にほぼネイティブな画像理解を追加。エージェントがスクリーンショットや画像をそのまま読み取れるようになる。",
    "ko": "DeepSeek Harness에 거의 네이티브에 가까운 이미지 이해 기능을 추가. 에이전트가 스크린샷과 이미지를 직접 읽을 수 있다.",
    "zh": "为 DeepSeek Harness 提供接近原生的图像理解能力：让 Agent 直接看懂截图与图片内容。"
  },
  "omdsh-dev/DSH-better-sidebar": {
    "en": "A complete workbench inside the sidebar: third-party extensions can register new tabs; file rendering & editing, terminal, Git, and subagents built in.",
    "ja": "サイドバーに収まるフル装備のワークベンチ。サードパーティ拡張が新しいタブを登録でき、ファイル表示・編集／ターミナル／Git／サブエージェントを内蔵。",
    "ko": "사이드바 하나에 담긴 완전한 워크벤치. 서드파티 확장이 새 탭을 등록할 수 있으며 파일 렌더링·편집/터미널/Git/서브에이전트 내장.",
    "zh": "开放式侧边栏底座：第三方插件可注册自己的侧边栏页面，内置文件渲染编辑、终端、Git 与子代理面板，按需分块加载。"
  },
  "omdsh-dev/dsh-advisor": {
    "en": "Pairs a second model with your agent that passively reviews every turn and injects notes — a continuous second opinion that never interrupts the main flow.",
    "ja": "副モデルを併走させ、毎ターンを受動的にレビューして所見を注入する。メインの流れを止めずにセカンドオピニオンを得られる。",
    "ko": "보조 모델을 함께 두어 매 턴을 수동적으로 검토하고 의견을 주입한다. 주 흐름을 끊지 않으면서 지속적인 제2 의견을 얻을 수 있다.",
    "zh": "搭配一个副模型：在每轮对话被动审查并注入见解，不打断主流程也能持续给出第二意见。"
  },
  "omdsh-dev/dsh-annotation": {
    "en": "A selection-annotation plugin for DSH Web: select text in a reply, annotate it, and press Enter to send it along with your message — the model answers each annotation by number. The annotation block never appears in your own bubble (removed before paint, zero flicker), and Annotation labels in the reply are hoverable chips. Official bundle, zero core changes.",
    "ja": "DSH Web 向けの選択範囲アノテーションプラグイン。返信内のテキストを選んで注釈を書き、Enter でメッセージと一緒に送ると、モデルが番号ごとに個別に答える。注釈ブロックは自分の吹き出しには現れず（描画前に除去、ちらつきゼロ）、返信中の Annotation ラベルはホバー可能なチップになる。公式 bundle、コア改変ゼロ。",
    "ko": "DSH Web용 선택 주석 플러그인. 답변 속 텍스트를 선택해 주석을 달고 Enter를 누르면 메시지와 함께 전송되며, 모델이 번호별로 하나씩 답한다. 주석 블록은 내 말풍선에 나타나지 않고(그리기 전에 제거되어 깜빡임 없음), 답변의 Annotation 라벨은 호버 가능한 칩이 된다. 공식 번들이며 코어 수정은 없다.",
    "zh": "DSH Web 的选中批注插件：在回复里选中文字→写批注→回车随消息一起发出，模型按编号逐条回复。批注块不会出现在你自己的消息气泡里（发送前就移除，零闪烁），回复里的 Annotation 标签是可悬浮芯片。官方 bundle，零核心改动。"
  },
  "omdsh-dev/dsh-custom-tool": {
    "en": "Create and manage sandboxed JavaScript tools for DeepSeek Harness with a built-in Monaco editor and a model-driven tool lifecycle.",
    "ja": "サンドボックス化された JavaScript ツールを DSH 上で作成・管理。Monaco エディタを内蔵し、ツールのライフサイクルはモデルが駆動する。",
    "ko": "샌드박스화된 JavaScript 도구를 DSH에서 만들고 관리. Monaco 에디터를 내장하고 도구 수명 주기를 모델이 주도한다.",
    "zh": "在 DSH 里创建与管理沙箱化的 JavaScript 工具：内置 Monaco 编辑器，工具生命周期由模型驱动。"
  },
  "omdsh-dev/dsh-data-agent": {
    "en": "Ships a dedicated Data Agent preset so the AI can query, update, and analyze your data for you.",
    "ja": "専用の Data Agent プリセットを定義し、AI にデータの照会・更新・分析を任せられる。",
    "ko": "전용 Data Agent 프리셋을 정의해 AI가 데이터 조회·업데이트·분석을 대신하게 한다.",
    "zh": "把 DSH 接上你的数据库做对话式数据分析：用自然语言查询并产出可执行的业务洞察。"
  },
  "omdsh-dev/dsh-genui": {
    "en": "Gives the model's answers a face — the text is still there, and an interactive UI is already live. Ask how this month's orders are doing and a clickable data panel renders inside the answer.",
    "ja": "モデルの回答に顔を与える。テキストはそのままに、インタラクティブな UI がすでに動いている。「今月の注文はどう？」と聞けば、回答の中にクリックできるデータパネルが現れる。",
    "ko": "모델의 답변에 얼굴을 달아 준다. 텍스트는 그대로 있고 상호작용 UI가 이미 살아 있다. 「이번 달 주문 어때?」라고 물으면 답변 안에 클릭 가능한 데이터 패널이 렌더링된다.",
    "zh": "给模型的回答加一张脸：文字还在，可交互的界面已经渲染出来了。问「这个月订单怎么样」，答案里直接出现一块能点的数据面板。"
  },
  "omdsh-dev/dsh-lark": {
    "en": "Official Lark/Feishu IM bot channel for DeepSeek Harness: chats drive agents, replies and approvals return as messages and cards.",
    "ja": "公式の Lark（飛書）ボットチャンネルプラグイン。チャットから DSH Agent を駆動し、返信や承認はメッセージ・カードとして Lark に戻る。",
    "ko": "공식 Lark(페이슈) 봇 채널 플러그인. 채팅으로 DSH Agent를 구동하고, 답변과 승인은 메시지·카드로 Lark에 돌아온다.",
    "zh": "飞书/Lark 机器人通道插件（官方出品）：在飞书对话里直接驱动 DSH Agent，回复与审批以消息和卡片形式回到飞书。"
  },
  "omdsh-dev/dsh-mnemon": {
    "en": "A three-tier memory control plane for DeepSeek Harness — persistent runtime context, searchable project documents and pluggable long-term memory, with smart routing, supervised agent workflows, a web UI and headless mode.",
    "ja": "三層構成のメモリ制御プレーン。永続的なランタイムコンテキスト、検索可能なプロジェクト文書、差し替え可能な長期記憶を、スマートルーティングと監督付きエージェントワークフロー、WebUI とともに提供。",
    "ko": "3계층 메모리 컨트롤 플레인. 지속적인 런타임 컨텍스트, 검색 가능한 프로젝트 문서, 교체 가능한 장기 기억을 스마트 라우팅, 감독형 에이전트 워크플로, 웹 UI와 함께 제공.",
    "zh": "三层记忆控制平面：持久化运行时上下文、可检索的项目文档、可插拔的长期记忆，配智能路由、受监督的 Agent 工作流与 Web UI。"
  },
  "omdsh-dev/dsh-notification": {
    "en": "Desktop notifications for DeepSeek Harness turn completions, with per-outcome controls and include/exclude keyword rules.",
    "ja": "DSH のターン完了をデスクトップ通知。結果の種類ごとに通知を制御でき、含める／除外するキーワードのルールも設定できる。",
    "ko": "DSH 턴 완료를 데스크톱 알림으로 전달. 결과 유형별로 제어할 수 있고 포함·제외 키워드 규칙도 설정할 수 있다.",
    "zh": "DSH 回合完成的桌面通知插件：可按结果类型分别控制，并支持包含/排除关键词规则。"
  },
  "omdsh-dev/dsh-open-in-vscode": {
    "en": "Open a workspace directory in VS Code straight from the DeepSeek Harness web GUI: every real Workspace row in the sidebar gains an \"Open in VSCode\" entry in its \"…\" overflow menu, and the host spawns the editor CLI detached so the editor outlives the server.",
    "ja": "DeepSeek Harness の Web GUI から直接ワークスペースディレクトリを VS Code で開くプラグイン。サイドバーの実際の Workspace 行それぞれの「…」オーバーフローメニューに「VSCode で開く」項目が加わり、ホスト側がエディタ CLI を切り離しプロセスとして起動するため、エディタはサーバーより長く生き残る。",
    "ko": "DeepSeek Harness 웹 GUI에서 워크스페이스 디렉터리를 곧바로 VS Code로 여는 플러그인. 사이드바의 실제 Workspace 행마다 '…' 오버플로 메뉴에 'VSCode에서 열기' 항목이 생기고, 호스트가 에디터 CLI를 분리 프로세스로 띄우므로 에디터가 서버보다 오래 살아남는다.",
    "zh": "在 DSH Web GUI 里直接用 VS Code 打开工作区目录：侧栏每个真实工作区行的「…」溢出菜单里会多出一条「在 VSCode 中打开」，点击后由服务端以分离进程拉起编辑器 CLI，编辑器不会随服务端退出。"
  },
  "omdsh-dev/dsh-plugin-check": {
    "en": "A health checker for DSH plugins — scans a plugin repo's manifest protocol, patch format, build pitfalls and hub listing status. Zero dependencies, read-only, registers a plugin_check tool.",
    "ja": "DSH プラグインのヘルスチェックツール。マニフェスト規約、patch 形式、ビルドの落とし穴、hub 収録状況を走査する。依存ゼロ・読み取り専用で plugin_check ツールを登録。",
    "ko": "DSH 플러그인 헬스 체크 도구. 매니페스트 규약, patch 형식, 빌드 함정, 허브 수록 상태를 스캔한다. 의존성 없이 읽기 전용으로 동작하며 plugin_check 도구를 등록.",
    "zh": "DSH 插件健康检查工具：扫描插件仓库的清单协议、patch 格式、构建陷阱与 hub 收录状态，零依赖只读，注册 plugin_check 工具。"
  },
  "omdsh-dev/dsh-security-audit": {
    "en": "A local security audit plugin for DeepSeek Harness covering configuration, plugin provenance, sessions and network exposure, producing a read-only, redacted risk report.",
    "ja": "DSH のローカルセキュリティ監査プラグイン。設定・プラグインの出所・セッション・ネットワーク露出面を点検し、読み取り専用でマスク済みのリスクレポートを出力する。",
    "ko": "DSH 로컬 보안 감사 플러그인. 설정, 플러그인 출처, 세션, 네트워크 노출면을 점검해 읽기 전용의 마스킹된 위험 보고서를 만든다.",
    "zh": "DSH 本机安全审计插件：检查配置、插件来源、会话与网络暴露面，输出只读且已脱敏的风险报告。"
  },
  "omdsh-dev/dsh-toolkit": {
    "en": "A zero-dependency toolkit for DeepSeek Harness — ten deterministic tools covering time, encoding, JSON, calculator, CSV, regex, Markdown, diff, stats and schema, installed together from one entry point.",
    "ja": "依存ゼロの DSH ツールキット集。time / encoding / json / calculator / csv / regex / markdown / diff / stat / schema の 10 個の確定的ツールを、統一の入口から一括導入できる。",
    "ko": "의존성 없는 DSH 툴킷 모음. time, encoding, json, calculator, csv, regex, markdown, diff, stat, schema 등 10개 결정적 도구를 하나의 진입점에서 한 번에 설치한다.",
    "zh": "DSH 零依赖工具包合集：time、encoding、json、calculator、csv、regex、markdown、diff、stat、schema 十个确定性工具，统一入口一键安装。"
  },
  "omdsh-dev/dsh_workflow": {
    "en": "Brings Claude Code's UltraCode mode to DeepSeek Harness, upgrading one-off multi-agent dispatch into a workflow layer that is generatable, savable, governable, observable and recoverable.",
    "ja": "Claude Code の UltraCode モードを DSH に導入。使い捨てのマルチエージェント実行を、生成・保存・統制・観測・復旧が可能な Workflow 層へと引き上げる。",
    "ko": "Claude Code의 UltraCode 모드를 DSH에 도입. 일회성 멀티 에이전트 실행을 생성·저장·통제·관측·복구가 가능한 워크플로 계층으로 끌어올린다.",
    "zh": "把 Claude Code 的 UltraCode 模式带给 DSH：将一次性的多 Agent 调度升级为可生成、可保存、可治理、可观察、可恢复的 Workflow 层。"
  },
  "omdsh-dev/stent": {
    "en": "A hook processor in the spirit of Minecraft Fabric.",
    "ja": "MC Fabric ライクなフックプロセッサ。",
    "ko": "MC Fabric 스타일의 후크 프로세서.",
    "zh": "类似 Minecraft Fabric 的 dsh hook 处理器：以统一方式挂载与编排 DSH 的各类钩子。"
  },
  "op7418/pilot-harness": {
    "en": "A CodePilot-inspired desktop client and plugin suite for DeepSeek Harness, available on macOS, Windows and Linux.",
    "ja": "CodePilot に着想を得た DSH デスクトップクライアント兼プラグイン集。macOS・Windows・Linux に対応。",
    "ko": "CodePilot에서 영감을 받은 DSH 데스크톱 클라이언트 겸 플러그인 모음. macOS, Windows, Linux를 지원.",
    "zh": "受 CodePilot 启发的 DSH 桌面客户端与插件套件，支持 macOS、Windows 与 Linux。"
  },
  "openma-ai/deepseek-harness-acp": {
    "en": "An ACP server implementation for DeepSeek Harness (dsh-acp), letting external clients talk to DSH over the Agent Client Protocol.",
    "ja": "DeepSeek Harness 向けの ACP サーバー実装（dsh-acp）。外部クライアントが Agent Client Protocol 経由で DSH に接続できる。",
    "ko": "DeepSeek Harness용 ACP 서버 구현(dsh-acp). 외부 클라이언트가 Agent Client Protocol로 DSH에 접속할 수 있다.",
    "zh": "DeepSeek Harness 的 ACP 服务端实现（dsh-acp）：让外部客户端以 Agent Client Protocol 接入 DSH。"
  },
  "opensetk/dsh-xiaohei": {
    "en": "A Luo Xiaohei themed plugin for DeepSeek Harness, bringing the character into the DSH interface.",
    "ja": "dsh 向けの羅小黒テーマプラグイン。羅小黒の要素を DeepSeek Harness の画面に取り込む。",
    "ko": "dsh용 뤄샤오헤이 테마 플러그인. 캐릭터 요소를 DeepSeek Harness 화면에 담는다.",
    "zh": "dsh 的罗小黑主题插件：把罗小黑元素带进 DeepSeek Harness 界面。"
  },
  "orziz/odai": {
    "en": "A governance-powered general task-execution framework for AI agents: align the real objective, facts, assumptions, authorization, risks and acceptance first, then take the shortest sufficient path, act, verify, and keep going until the task is genuinely deliverable. Governance stays nearly invisible on simple work and deepens automatically with risk.",
    "ja": "ガバナンスを実行に埋め込んだ AI Agent 向け汎用タスク実行フレームワーク。まず真の目的・事実・前提・権限・リスク・受入条件を揃え、次に最短で十分な経路を選び、能力を組み合わせ、実行し、検証して、タスクが本当に引き渡せる状態になるまで進める。簡単な作業ではガバナンスはほぼ見えず、リスクに応じて自動的に深まる。",
    "ko": "거버넌스를 실행에 내장한 AI 에이전트용 범용 작업 실행 프레임워크. 먼저 진짜 목표·사실·가정·권한·위험·인수 조건을 정렬하고, 가장 짧고 충분한 경로를 골라 능력을 조합해 실행하고 검증하며, 작업이 정말 인도 가능해질 때까지 나아간다. 쉬운 작업에서는 거버넌스가 거의 보이지 않고 위험에 따라 자동으로 깊어진다.",
    "zh": "把治理嵌进执行的 AI Agent 通用任务框架：先对齐真实目标、事实、假设、授权、风险与验收，再选最短够用的路径、组合能力、执行、验证，直到任务真正可交付。简单活儿几乎看不到治理，复杂和高风险时自动加深。"
  },
  "pengyue-polaron/deepseek-harness-genui": {
    "en": "Code-first generative UI for DeepSeek Harness — task-specific React apps rendered inline in replies, with component state carried into the next agent turn.",
    "ja": "コードファーストの生成 UI。タスク専用の React アプリを応答内にインライン描画し、コンポーネントの状態を次のエージェントターンへ引き継ぐ。",
    "ko": "코드 우선 생성형 UI. 작업별 React 앱을 응답 안에 인라인으로 렌더링하고 컴포넌트 상태를 다음 에이전트 턴으로 이어간다.",
    "zh": "代码优先的生成式 UI：为具体任务生成 React 应用并内联渲染在回复里，组件状态会带进下一轮 Agent 对话。"
  },
  "pingfanfan/hello-dsh": {
    "en": "The first lesson for DeepSeek Harness: from \"open a terminal\" to building your own plugin and watching its lifecycle, in 10 steps and about 30 minutes. It assumes you have nothing — no Node.js, no command-line experience — and every section ends with a checkpoint you must see before moving on.",
    "ja": "DeepSeek Harness の最初のレッスン。「ターミナルを開く」から自分のプラグインを作ってそのライフサイクルを眺めるまで、10 ステップ・約 30 分。Node.js もコマンドライン経験も無い前提で書かれており、各セクションはチェックポイントで終わる。期待した結果が見えるまで次へ進まない。",
    "ko": "DeepSeek Harness의 첫 수업. '터미널 열기'에서 시작해 자기 플러그인을 만들고 그 생명주기를 지켜보기까지 10단계, 약 30분. Node.js도 명령줄 경험도 없다는 전제로 쓰였고, 각 절은 체크포인트로 끝나 예상 결과를 보기 전에는 다음으로 넘어가지 않는다.",
    "zh": "DeepSeek Harness 的第一课：从「打开终端」到写出自己的第一个插件并看着它的生命周期跑起来，30 分钟走完 10 个步骤。假设你什么都没有——没装 Node.js、没有命令行经验，每节都有检查点，看不到预期结果就不往下走。"
  },
  "runzhliu/deepseek-harness-docker": {
    "en": "Community Docker and Kubernetes packaging for DeepSeek Harness with a hardened image, a Compose stack, a Helm chart, the web UI and a headless CLI.",
    "ja": "DeepSeek Harness のコミュニティ製 Docker / Kubernetes パッケージ。堅牢化イメージ、Compose 構成、Helm チャート、Web UI、ヘッドレス CLI を含む。",
    "ko": "DeepSeek Harness의 커뮤니티 Docker·Kubernetes 패키징. 보안 강화 이미지, Compose 스택, Helm 차트, 웹 UI, 헤드리스 CLI를 제공.",
    "zh": "DeepSeek Harness 的社区 Docker 与 Kubernetes 打包：提供加固镜像、Compose 编排、Helm chart、Web UI 与无头 CLI。"
  },
  "saya-ch/dsh-mobile": {
    "en": "Mobile adaptation and secure LAN access for DeepSeek Harness, supporting both an Android app and mobile browsers to operate your local Harness.",
    "ja": "DSH のモバイル対応と安全な LAN アクセス。Android アプリとスマホブラウザの双方からローカルの Harness を操作できる。",
    "ko": "DSH 모바일 최적화와 안전한 LAN 접속. Android 앱과 모바일 브라우저 모두에서 로컬 Harness를 조작할 수 있다.",
    "zh": "DSH 移动端适配与安全局域网访问插件：支持 Android App 与手机浏览器直接操作本机 Harness。"
  },
  "shanliuling/dsh-image-gen": {
    "en": "Generate images directly inside DeepSeek Harness conversations, with pluggable Gemini, OpenAI and Seedream backends you can switch between per request.",
    "ja": "DSH の会話内で直接画像を生成。Gemini・OpenAI・Seedream など複数バックエンドに対応し、リクエストごとに切り替えられる。",
    "ko": "DSH 대화 안에서 바로 이미지를 생성. Gemini, OpenAI, Seedream 등 여러 백엔드를 지원하며 요청마다 전환할 수 있다.",
    "zh": "在 DSH 对话里直接生成图片：支持 Gemini、OpenAI、Seedream 多个后端，切换模型即可出图。"
  },
  "shaobeichen/dsh-pocket": {
    "en": "Take DeepSeek Harness mobile — run dsh web on your desktop and scan a QR code to mirror and control the same session from your phone, over LAN or the public internet.",
    "ja": "DeepSeek Harness をポケットに。PC で dsh web を動かし、スマホで QR を読むだけで同じ画面をリアルタイム共有・操作できる。LAN・公網どちらにも対応。",
    "ko": "DeepSeek Harness를 주머니에. PC에서 dsh web을 실행하고 휴대폰으로 QR을 스캔하면 같은 화면을 실시간 공유·조작할 수 있다. LAN과 공용망 모두 지원.",
    "zh": "把 DeepSeek Harness 装进口袋：电脑跑 dsh web，手机扫码即同步访问，局域网与公网都支持，实时同屏操作。"
  },
  "shaokeyibb/dsh-plugin-product-subagents": {
    "en": "Role-based Codex, Claude Code and ACP subagent providers for DeepSeek Harness — continuable children, durable session recovery, per-role product permissions and delegation with a permission ceiling.",
    "ja": "ロールベースの Codex / Claude Code / ACP サブエージェント・プロバイダ。再開可能な子セッション、永続的なセッション復旧、ロール別の権限、上限付きの委譲に対応。",
    "ko": "역할 기반 Codex/Claude Code/ACP 서브에이전트 프로바이더. 이어갈 수 있는 자식 세션, 지속적 세션 복구, 역할별 제품 권한, 권한 상한이 있는 위임을 지원.",
    "zh": "基于角色的 Codex / Claude Code / ACP 子代理 provider：支持可续跑的子会话、持久会话恢复、按角色的产品权限与带权限上限的委派。"
  },
  "shengsheng90/DSH-taskboard": {
    "en": "A native local taskboard for DeepSeek Harness — SQLite-backed projects with agent claim and review flows, rendered in a native web UI with no iframe and no second chat runtime.",
    "ja": "DSH ネイティブのローカルタスクボード。SQLite でプロジェクトを保存し、エージェントの受け持ちとレビューに対応。iframe も二つ目のチャットランタイムも使わない。",
    "ko": "DSH 네이티브 로컬 작업 보드. SQLite로 프로젝트를 저장하고 에이전트 인수·검토 흐름을 지원하며 iframe이나 별도 채팅 런타임 없이 동작.",
    "zh": "DSH 原生本地任务板：SQLite 存储项目进度，支持 Agent 认领与评审，原生 Web UI，不用 iframe 也不起第二个对话运行时。"
  },
  "sliverp/DeepSeek-harness-qqbot": {
    "en": "A QQ Bot channel plugin for DeepSeek Harness supporting both text and image messages in each direction.",
    "ja": "DSH 向けの QQ Bot チャネルプラグイン。テキストと画像の双方向送受信に対応する。",
    "ko": "DSH용 QQ 봇 채널 플러그인. 텍스트와 이미지 메시지를 양방향으로 주고받을 수 있다.",
    "zh": "DSH 的 QQ 机器人通道插件：支持文本与图片消息双向收发。"
  },
  "superdesigndev/superdesign-skill": {
    "en": "A design skill for coding agents including Claude Code, Cursor and DSH — turns AI-slop UI into shippable, tasteful frontend work.",
    "ja": "コーディングエージェント向けのデザインスキル。Claude Code や Cursor、DSH などで、AI がありがちな雑な UI を出荷可能で趣味のよいフロントエンドに変える。",
    "ko": "코딩 에이전트를 위한 디자인 스킬. Claude Code, Cursor, DSH 등에서 AI가 만든 조잡한 UI를 배포 가능하고 감각 있는 프런트엔드로 바꾼다.",
    "zh": "面向编码 Agent 的设计技能包：把 AI 生成的粗糙界面变成可上线的、有品味的前端，适用于 Claude Code、Cursor 与 DSH 等。"
  },
  "superdesigndev/treg": {
    "en": "OpenRouter for agent tools — a proxy registry that reaches 2,600+ tool endpoints behind a single token, with the treg-dsh package providing the DeepSeek Harness integration layer.",
    "ja": "エージェントツール版の OpenRouter。単一トークンで 2,600 超のツールエンドポイントを呼び出せるプロキシ・レジストリで、treg-dsh パッケージが DSH 連携層を担う。",
    "ko": "에이전트 도구용 OpenRouter. 토큰 하나로 2,600개 이상 도구 엔드포인트를 호출하는 프록시 레지스트리이며 treg-dsh 패키지가 DSH 연동 계층을 담당.",
    "zh": "Agent 工具版 OpenRouter：一个 token 调用 2600+ 工具端点的代理注册中心，treg-dsh 包提供 DSH 接入层。"
  },
  "suzike/freestyle-dsh-theme": {
    "en": "A theme experience plugin for DeepSeek Harness with OKLCH-based theme proposals and a theme designer whose settings persist across restarts.",
    "ja": "DSH のテーマ体験プラグイン。OKLCH 色空間によるテーマ提案とテーマデザイナーを備え、設定は再起動をまたいで保持される。",
    "ko": "DSH 테마 경험 플러그인. OKLCH 색 공간 기반 테마 제안과 테마 디자이너를 제공하며 설정은 재시작 후에도 유지된다.",
    "zh": "DSH 主题体验插件：提供 OKLCH 色彩空间的主题提案与主题设计器，配置可跨重启持久化。"
  },
  "taxueseek/argo": {
    "en": "Multilingual search infrastructure built for AI agents: language detection → domain routing → multi-engine recall → RRF fusion → evidence appraisal, delivering compact JSON evidence candidates with a credibility breakdown instead of a human-facing summary page or link list. One command on DSH gives the model ten `mcp__argo__*` tools.",
    "ja": "AI Agent のために作られた多言語検索インフラ。言語検出 → ドメインルーティング → 多エンジン再現 → RRF 融合 → 証拠の即時評価というパイプラインで、人向けの要約ページやリンク一覧ではなく、簡潔な JSON の証拠候補と信頼度分解を返す。DSH なら 1 行で 10 個の `mcp__argo__*` ツールが手に入る。",
    "ko": "AI 에이전트를 위해 만든 다국어 검색 인프라. 언어 감지 → 도메인 라우팅 → 다중 엔진 회수 → RRF 융합 → 증거 평가 파이프라인으로, 사람이 읽는 요약 페이지나 링크 목록이 아니라 간결한 JSON 증거 후보와 신뢰도 분해를 돌려준다. DSH에서는 한 줄 설치로 10개의 `mcp__argo__*` 도구가 생긴다.",
    "zh": "专门给 AI Agent 用的多语言搜索基础设施：语言检测 → 领域路由 → 多引擎召回 → RRF 融合 → 证据快评，交付的是精简 JSON 的证据候选加可信度分解，而不是给人看的总结页或链接清单。DSH 一行安装即得 10 个 `mcp__argo__*` 工具。"
  },
  "tencent-connect/dsh-qqbot": {
    "en": "The official plugin for connecting QQ Bot to DeepSeek Harness, letting you talk to your agent directly from QQ.",
    "ja": "QQ Bot を DeepSeek Harness に接続する公式プラグイン。QQ から直接エージェントと対話できる。",
    "ko": "QQ 봇을 DeepSeek Harness에 연결하는 공식 플러그인. QQ에서 바로 에이전트와 대화할 수 있다.",
    "zh": "腾讯官方出品的 QQ 机器人接入插件：把 QQ Bot 接上 DeepSeek Harness，直接在 QQ 里与 Agent 对话。"
  },
  "text2future/flowix": {
    "en": "A local-first Markdown notebook where what you write becomes durable agent context: keep requirements, decisions, research and personal knowledge in one place, point an agent at the part it needs, and save the result back into the same note. Tauri desktop app, connected over MCP and CLI.",
    "ja": "ローカルファーストの Markdown ノートブック。書いた内容がそのまま Agent の永続コンテキストになる。要件・決定・調査・個人知識を一箇所にまとめ、Agent には必要な部分だけを指し示し、結果を同じノートに書き戻す。Tauri 製デスクトップアプリで、MCP と CLI で外部 Agent に接続する。",
    "ko": "로컬 우선 Markdown 노트북. 적어 둔 내용이 그대로 에이전트의 지속 컨텍스트가 된다. 요구사항·결정·조사·개인 지식을 한곳에 모으고, 에이전트에게는 필요한 부분만 가리키며, 결과는 같은 노트로 되돌린다. Tauri 데스크톱 앱이며 MCP와 CLI로 외부 에이전트에 연결한다.",
    "zh": "本地优先的 Markdown 笔记本，写下的内容直接成为 Agent 的持久上下文：把需求、决策、调研和个人知识放在一处，指给 Agent 需要的那部分，结果再写回同一篇笔记。Tauri 桌面应用，走 MCP 与 CLI 接外部 Agent。"
  },
  "titanwings/distilly": {
    "en": "Distill anyone into an AI Skill: source material plus your description yields a Skill that genuinely thinks in their frame and speaks in their voice. Colleagues, family, idols, fictional characters — even yourself.",
    "ja": "誰でも AI Skill に蒸留する。素材とあなたの説明から、その人の思考の枠組みで考え、その人の口調で話す Skill を生成。同僚・家族・推し・架空のキャラ、そして自分自身も。",
    "ko": "누구든 AI Skill로 증류한다. 자료와 당신의 설명을 주면 그 사람의 사고 틀로 생각하고 그 사람의 말투로 답하는 Skill이 나온다. 동료·가족·최애·가상 인물, 심지어 자기 자신까지.",
    "zh": "把任何人蒸馏成一个 AI Skill：素材加一段你的描述，产出一个真按他的思路思考、用他的语气说话的 Skill。同事、家人、偶像、虚构角色，甚至你自己。"
  },
  "titanwings/dsh-automation": {
    "en": "Automation for DeepSeek Harness — run coding tasks on a schedule in fresh agent sessions, with schedules creatable and manageable from either the web UI or an agent, under explicit workspace and permission boundaries.",
    "ja": "DSH の自動化プラグイン。コーディングタスクを新規エージェントセッションでスケジュール実行でき、ユーザーからもエージェントからもスケジュールを作成・管理できる。",
    "ko": "DSH 자동화 플러그인. 코딩 작업을 새 에이전트 세션에서 예약 실행하고 사용자와 에이전트 모두 일정을 만들고 관리할 수 있으며 워크스페이스·권한 경계가 명확하다.",
    "zh": "DSH 自动化插件：让编码任务按计划在全新 Agent 会话中运行，用户或 Agent 都能创建与管理定时任务，工作区与权限边界清晰。"
  },
  "toby-bridges/api-relay-audit": {
    "en": "Local security auditing for AI API relays and LLM proxies — detects prompt injection, model substitution, tool-call rewriting, SSE anomalies, error leakage and Web3 wallet risks.",
    "ja": "AI API リレーと LLM プロキシのローカルセキュリティ監査。プロンプトインジェクション、モデルすり替え、ツール呼び出しの改ざん、SSE 異常、エラー漏洩、Web3 ウォレットのリスクを検出。",
    "ko": "AI API 릴레이와 LLM 프록시의 로컬 보안 감사. 프롬프트 인젝션, 모델 치환, 도구 호출 변조, SSE 이상, 오류 유출, Web3 지갑 위험을 탐지.",
    "zh": "AI API 中转与 LLM 代理的本地安全审计插件：检测提示注入、模型替换、工具调用改写、SSE 异常、错误信息泄漏与 Web3 钱包风险。"
  },
  "toolclub/dsh-agent-team-gui": {
    "en": "Persistent multi-model workflow teams for DeepSeek Harness — dynamic lead planning, bounded DAGs, per-agent model and tool assignment, plus a Run Center and token insights.",
    "ja": "永続的なマルチモデル・ワークフローチーム。動的なリード計画、境界付き DAG、エージェントごとのモデル/ツール指定に対応し、実行センターと token インサイトを備える。",
    "ko": "지속적인 멀티모델 워크플로 팀. 동적 리드 계획, 경계가 있는 DAG, 에이전트별 모델·도구 지정을 지원하며 실행 센터와 토큰 인사이트를 제공.",
    "zh": "持久化多模型工作流团队插件：动态主控规划、有界 DAG、按 Agent 配置模型与工具，附运行中心与 token 洞察面板。"
  },
  "vibeinging/dsh-desktop": {
    "en": "A local AI desktop workspace for DeepSeek Harness covering sessions, projects, files, web research, plugins and Office artifacts — built directly on the Session, Tool, Skill and Worktree seams.",
    "ja": "DSH プラグインのためのローカルファースト AI ワークベンチ。Agent セッション、プロジェクトファイル、データ分析、Web リサーチ、MCP、Office 成果物を 1 つの Electron デスクトップアプリに統合。",
    "ko": "DSH 플러그인을 위한 로컬 우선 AI 워크벤치. Agent 세션, 프로젝트 파일, 데이터 분석, 웹 리서치, MCP, Office 산출물을 하나의 Electron 데스크톱 앱에 통합.",
    "zh": "面向 DSH 插件的本地优先 AI 工作台：把 Agent 会话、项目文件、数据分析、网络调研、MCP 与 Office 产物整合进一个 Electron 桌面应用。"
  },
  "vlln/dsh-navbar": {
    "en": "A conversation node navigation bar for DeepSeek Harness — a node rail along the right edge that jumps straight to any user message. Ships as an official bundle plugin.",
    "ja": "会話ノードのナビゲーションバー。右端にノードを並べ、任意の user メッセージへ素早くジャンプできる。公式 bundle 形式で導入。",
    "ko": "대화 노드 내비게이션 바. 오른쪽 가장자리에 노드를 나열해 임의의 user 메시지로 빠르게 이동할 수 있다. 공식 번들 형태로 설치.",
    "zh": "对话节点导航条插件：在右缘串起节点，快速跳转到任意一条 user 消息，官方 bundle 形态安装。"
  },
  "vlln/dsh-task-status": {
    "en": "A background task status bar for DeepSeek Harness showing task progress and a live output tail on the conversation page. Ships as an official bundle plugin installed with dsh plugin --profile web add.",
    "ja": "バックグラウンドタスクのステータスバー。会話ページに進捗とリアルタイム出力の tail を表示する。公式 bundle 形式で dsh plugin --profile web add で導入。",
    "ko": "백그라운드 작업 상태 바. 대화 페이지에 작업 진행률과 실시간 출력 tail을 표시한다. 공식 번들 형태로 dsh plugin --profile web add로 설치.",
    "zh": "后台任务状态条插件：在对话页显示任务进度与实时输出 tail，官方 bundle 形态，用 dsh plugin --profile web add 安装。"
  },
  "vlln/plugin-registry": {
    "en": "Ecosystem infrastructure for DeepSeek Harness — a thin, zero-patch console for managing official repository plugins from a browser panel, plus a make-dsh-plugin skill that guides official plugin development.",
    "ja": "DSH プラグイン基盤。パッチ不要の薄いコンソールでブラウザパネルから公式リポジトリのプラグインを管理でき、make-dsh-plugin スキルが公式プラグイン開発を案内する。",
    "ko": "DSH 플러그인 인프라. 패치가 필요 없는 얇은 콘솔로 브라우저 패널에서 공식 저장소 플러그인을 관리하고 make-dsh-plugin 스킬이 공식 플러그인 개발을 안내한다.",
    "zh": "DSH 插件生态基建：零 patch 的薄控制台，在浏览器面板里管理官方 repository 插件，另附 make-dsh-plugin 官方插件开发引导技能。"
  },
  "vlln/whale-girl": {
    "en": "A desktop pet in the bottom-right of the DSH Web GUI: draggable, feedable, playable, accumulating seniority levels, titles and memories from the tasks, sessions and companion time you rack up.",
    "ja": "DSH Web GUI の右下に住むデスクトップペット。ドラッグでき、餌やりや遊びに応じ、こなしたタスク・セッション・共に過ごした時間から経験レベル・称号・思い出を積み上げていく。",
    "ko": "DSH Web GUI 우하단에 사는 데스크톱 펫. 끌 수 있고 먹이를 주거나 놀아 줄 수 있으며, 완료한 작업·세션·함께한 시간으로 연차 레벨과 칭호, 추억을 쌓아 간다.",
    "zh": "DSH Web GUI 右下角的桌宠（QQ 宠物形态）：可拖拽、可投喂玩耍，随你完成任务、会话和陪伴时长积累资历等级、称号与回忆。"
  },
  "wangshunnn/oh-my-dsh": {
    "en": "oh-my-dsh — an auto-updating index and curated selection of community plugins for DeepSeek Harness.",
    "ja": "oh-my-dsh は DeepSeek Harness のコミュニティプラグイン索引兼厳選リスト。自動更新される。",
    "ko": "oh-my-dsh는 DeepSeek Harness 커뮤니티 플러그인 색인 겸 엄선 목록. 자동으로 갱신된다.",
    "zh": "oh-my-dsh：DeepSeek Harness 社区插件索引与精选清单，自动更新。"
  },
  "weijiafu14/pi2dsh": {
    "en": "Bridges the Pi and DeepSeek Harness ecosystems — one Pi Host ABI runs unmodified Pi extensions as native DSH plugins.",
    "ja": "Pi と DSH の生態系を橋渡し。単一の Pi Host ABI により、未改変の Pi 拡張をそのままネイティブな DSH プラグインとして動かせる。",
    "ko": "Pi와 DSH 생태계를 잇는다. 하나의 Pi Host ABI로 수정하지 않은 Pi 확장을 네이티브 DSH 플러그인처럼 실행한다.",
    "zh": "打通 Pi 与 DSH 两个生态：用一套 Pi Host ABI 让未经修改的 Pi 扩展直接以原生 DSH 插件的形式运行。"
  },
  "weinibuliu/deepseek-harness-vsc-extension": {
    "en": "DeepSeek Harness as a VS Code extension, so you can use DSH without leaving the editor.",
    "ja": "DeepSeek Harness を VSCode 拡張として提供。エディタを離れずに DSH を利用できる。",
    "ko": "DeepSeek Harness를 VS Code 확장으로 제공. 에디터를 떠나지 않고 DSH를 사용할 수 있다.",
    "zh": "把 DeepSeek Harness 做成 VSCode 扩展：不离开编辑器即可使用 DSH。"
  },
  "wess09/DeepSeekHarnessDesktop": {
    "en": "A desktop packaging of DeepSeek Harness, bundling DSH into a directly distributable desktop application.",
    "ja": "DeepSeek Harness のデスクトップ版パッケージング。DSH をそのまま配布・インストールできるデスクトップアプリに仕立てる。",
    "ko": "DeepSeek Harness 데스크톱 패키징. DSH를 바로 배포·설치할 수 있는 데스크톱 애플리케이션으로 묶는다.",
    "zh": "DeepSeek Harness 桌面端打包方案：把 DSH 打成可直接分发安装的桌面应用。"
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
    "ko": "OpenBiliClaw는 로컬에서 실행되는 크로스플랫폼 개인화 콘텐츠 발견 Agent. 이 저장소는 그 DeepSeek Harness 플러그인으로, DSH 화면에 상주하는 네 번째 패널(추천/라이브러리/대화/프로필/설정)과 22개의 Agent Bridge 도구를 등록해 Agent가 추천을 읽고 프로브에 답하며 학습 루프를 완성하게 한다.",
    "zh": "本地运行的个性化内容推荐 Agent 的 DSH 插件：界面常驻第四栏（推荐/内容库/对话/画像/设置），并注册 22 个 Agent Bridge 工具形成学习闭环。"
  },
  "whitelonng/dshcode": {
    "en": "A community desktop companion for DeepSeek Harness — a one-click Electron app for macOS and Windows.",
    "ja": "DeepSeek Harness のコミュニティ製デスクトップ・コンパニオン。macOS と Windows 向けのワンクリック Electron アプリ。",
    "ko": "DeepSeek Harness의 커뮤니티 데스크톱 컴패니언. macOS와 Windows용 원클릭 Electron 앱.",
    "zh": "DeepSeek Harness 的社区桌面伴侣：一键安装的 Electron 应用，支持 macOS 与 Windows。"
  },
  "whyihaveyou/dsh-suite": {
    "en": "A living DeepSeek Harness plugin directory — refreshed hourly, compatibility-tested daily, with an in-app plugin store and a scaffolder.",
    "ja": "生きた DSH プラグインディレクトリ。毎時更新・毎日互換性テストを行い、アプリ内プラグインストアとスキャフォルダを備える。",
    "ko": "살아 있는 DSH 플러그인 디렉터리. 매시간 갱신하고 매일 호환성 테스트를 하며 인앱 플러그인 스토어와 스캐폴더를 제공.",
    "zh": "DSH 插件活目录：每小时刷新、每日做兼容性实测，内置插件商店与脚手架。"
  },
  "william-jin-cmu/dsh-stickers": {
    "en": "A sticker plugin for the DSH web UI that supports bidirectional reactions from both the user and the agent.",
    "ja": "DSH Web UI 用ステッカープラグイン。ユーザーとエージェントの双方がスタンプでリアクションを返せる。",
    "ko": "DSH 웹 UI용 스티커 플러그인. 사용자와 에이전트 모두 스티커로 양방향 반응을 남길 수 있다.",
    "zh": "DSH Web UI 贴纸插件：用户与 Agent 都能贴表情做双向反应。"
  },
  "william-jin-cmu/dsh-vision": {
    "en": "Adds vision to text-only DeepSeek — a view_image tool that bridges any OpenAI-compatible VLM, defaulting to Zhipu's free tier and tested across 10 models from 4 vendors.",
    "ja": "テキスト専用の DeepSeek に視覚を追加。view_image ツールが任意の OpenAI 互換 VLM を仲介し、既定は Zhipu の無料枠、4 社 10 モデルで実測済み。",
    "ko": "텍스트 전용 DeepSeek에 시각을 추가. view_image 도구가 OpenAI 호환 VLM을 중계하며 기본값은 Zhipu 무료 등급, 4개 업체 10개 모델에서 검증했다.",
    "zh": "给纯文本 DeepSeek 加上视觉：view_image 工具桥接任意 OpenAI 兼容的视觉模型，默认走智谱免费档，已实测 4 家 10 个模型。"
  },
  "wssfk12138/dsh-damage-pulse": {
    "en": "A DeepSeek Harness token-balance monitor with game-style damage-pulse animations, turning quota burn into an instantly readable visual cue.",
    "ja": "ゲームのダメージ表示風の token 残高モニター。消費のたびにダメージ数値がポップし、クォータの減りを一目で把握できる。",
    "ko": "게임의 데미지 표시 스타일 토큰 잔액 모니터. 소비할 때마다 데미지 숫자가 튀어나와 쿼터 소모를 한눈에 파악할 수 있다.",
    "zh": "游戏扣血风格的 token 余额监控插件：消耗即触发伤害数字动画，把额度变化做成一眼可感知的视觉反馈。"
  },
  "wssfk12138/dsh-wechat-notify": {
    "en": "Adds a wechat_notify tool so the agent can message you over a local ClawBot WeChat channel when a task finishes or a decision is needed, with self-reporting on disconnects.",
    "ja": "エージェントに wechat_notify ツールを追加。ローカルの ClawBot WeChat チャネル経由で、タスク完了時や判断が必要なときに通知を送り、切断時は自ら知らせる。",
    "ko": "에이전트에 wechat_notify 도구를 추가. 로컬 ClawBot WeChat 채널로 작업 완료나 결정이 필요할 때 알림을 보내고 연결이 끊기면 스스로 알린다.",
    "zh": "为 Agent 新增 wechat_notify 工具：通过本机 ClawBot 微信通道在任务完成或需要决策时主动给你发通知，掉线会自行提示。"
  },
  "wxkingstar/SpecFusion": {
    "en": "Search 65,600+ API docs from 20 Chinese open platforms directly inside DeepSeek Harness, Claude Code, Cursor, Codex or Gemini CLI — zero config, shipped as both a skill and a native DSH plugin.",
    "ja": "DSH・Claude Code・Cursor・Codex・Gemini CLI から、中国の 20 のオープンプラットフォームの API ドキュメント 65,600 本超を直接検索。設定不要で、Skill と DSH ネイティブプラグインの両形態を提供。",
    "ko": "DSH, Claude Code, Cursor, Codex, Gemini CLI에서 중국 20개 오픈 플랫폼의 API 문서 65,600건 이상을 바로 검색. 설정이 필요 없고 스킬과 DSH 네이티브 플러그인 두 형태를 제공.",
    "zh": "在 DSH、Claude Code、Cursor、Codex、Gemini CLI 里直接检索 20 个中国开放平台的 65,600+ 篇 API 文档，零配置，同时支持 Skill 与 DSH 原生插件两种形态。"
  },
  "xiaobright/dsh-anchored-standard": {
    "en": "A two-phase DeepSeek Harness agent preset: the first model request keeps the Minimal system prompt and exposes only the platform shell plus `read`, then the full Standard tool catalog appears once the session records its first durable promotion signal. Scored 98 / 99 on Project2.",
    "ja": "2 段階の DeepSeek Harness Agent プリセット。最初のモデルリクエストでは Minimal の完全システムプロンプトを保ったままプラットフォーム shell と `read` の 2 つだけを露出し、セッションが最初の永続的な昇格シグナルを記録した後に Standard の全ツールカタログを開放する。Project2 で 98 / 99 点。",
    "ko": "2단계 DeepSeek Harness 에이전트 프리셋. 첫 모델 요청에서는 Minimal 전체 시스템 프롬프트를 유지한 채 플랫폼 shell과 `read` 두 개만 노출하고, 세션이 첫 지속 승격 신호를 기록한 뒤 전체 Standard 도구 카탈로그를 개방한다. Project2에서 98 / 99점.",
    "zh": "两段式 DeepSeek Harness Agent 预设：首个模型请求只暴露平台 shell 加 `read` 两个工具并沿用 Minimal 完整系统提示，会话记录下第一个持久提升信号后再放出完整 Standard 工具目录。Project2 实测 98 / 99 分。"
  },
  "xiincs/deepseek-harness-desktop": {
    "en": "A native DeepSeek Harness desktop build on Tauri 2 with a bundled Node.js runtime — one-click install, fast startup, tray residency and automatic updates.",
    "ja": "Tauri 2 ベースの DSH ネイティブデスクトップ版。Node.js ランタイムを同梱し、ワンクリック導入・高速起動・トレイ常駐・自動更新に対応。",
    "ko": "Tauri 2 기반 DSH 네이티브 데스크톱 버전. Node.js 런타임을 내장해 원클릭 설치, 빠른 시작, 트레이 상주, 자동 업데이트를 지원.",
    "zh": "基于 Tauri 2 的 DSH 原生桌面版：内置 Node.js 运行时，一键安装、极速启动、托盘常驻并支持自动更新。"
  },
  "xmanrui/dsh-im": {
    "en": "Connect IM bots to DeepSeek Harness across nine channels — Feishu, WeChat, DingTalk, WeCom, QQ, Slack, Telegram, Discord and WhatsApp — via QR code or credentials, with unified settings and secret storage.",
    "ja": "IM ボットを DSH に接続。Feishu・WeChat・DingTalk・WeCom・QQ・Slack・Telegram・Discord・WhatsApp の 9 チャネルに QR か認証情報で対応し、設定と資格情報を一元管理。",
    "ko": "IM 봇을 DSH에 연결. Feishu, WeChat, DingTalk, WeCom, QQ, Slack, Telegram, Discord, WhatsApp 등 9개 채널을 QR 또는 자격 증명으로 연동하고 설정과 시크릿을 통합 관리.",
    "zh": "把 IM 机器人接入 DSH：扫码或凭据接入飞书、微信、钉钉、企业微信、QQ、Slack、Telegram、Discord 与 WhatsApp 九个渠道，统一设置页与凭据存储。"
  },
  "yejiming/MuseAI": {
    "en": "A local AI companion, text-adventure and story-immersion app: build your own characters and world settings, and accumulate relationships, memories and bonds across ongoing conversations. Data stays on your machine, called with your own API key.",
    "ja": "ローカルの AI コンパニオン、テキストアドベンチャー、物語没入アプリ。自作のキャラクターと世界設定を用意し、続く対話の中で関係・記憶・絆を積み上げる。データは手元に残り、自分の API キーで呼び出す。",
    "ko": "로컬 AI 동반자·텍스트 어드벤처·이야기 몰입 앱. 직접 만든 캐릭터와 세계 설정으로 이어지는 대화 속에서 관계와 기억, 유대를 쌓는다. 데이터는 내 컴퓨터에 남고 자신의 API 키로 호출한다.",
    "zh": "本地 AI 伴侣、文字冒险与穿书互动应用：自建角色与世界设定，在持续对话里积累关系、记忆与羁绊。数据留在本机，用自己的 API Key。"
  },
  "ysr666/dsh-vision-router": {
    "en": "Eyes for text-only DSH agents: paste an image and it just works, with a built-in free vision chain (no key, no Python) plus ten pixel-level tools. DeepSeek keeps doing the reasoning while the vision model does the seeing, and image turns behave like ordinary tool-calling turns.",
    "ja": "テキスト専用の DSH Agent に目を与えるプラグイン。画像を貼るだけで動き、キー不要・Python 不要の内蔵無料ビジョンチェーンと 10 個のピクセルレベルツールを備える。DeepSeek は推論を続け、見るのはビジョンモデルが担当し、画像ターンはふつうのツール呼び出しターンのように振る舞う。",
    "ko": "텍스트 전용 DSH 에이전트에 눈을 달아 주는 플러그인. 이미지를 붙여넣으면 그대로 동작하고, 키도 Python도 필요 없는 내장 무료 비전 체인과 열 개의 픽셀 단위 도구를 제공한다. DeepSeek은 계속 추론을 맡고 보는 일은 비전 모델이 하며, 이미지 턴은 평범한 도구 호출 턴처럼 동작한다.",
    "zh": "给纯文本 DSH Agent 装上眼睛：贴张图就能用，内置免费视觉链路（无需 Key、无需 Python）加十个像素级工具。DeepSeek 继续负责推理，看图交给视觉模型，图片回合表现得就像普通的工具调用回合。"
  },
  "yuezengwu/dsh-explain": {
    "en": "A local-first learning mode for DeepSeek Harness — a global cross-session study thread, source-attributed explanations, ExplainContext management, compaction and a diagnosable settings UI.",
    "ja": "ローカルファーストの学習モード・プラグイン。セッションを跨ぐグローバル学習スレッド、出典ごとの解説、ExplainContext 管理、圧縮、診断可能な設定画面を備える。",
    "ko": "로컬 우선 학습 모드 플러그인. 세션을 넘나드는 전역 학습 스레드, 출처별 설명, ExplainContext 관리, 압축, 진단 가능한 설정 화면을 제공.",
    "zh": "本地优先的学习模式插件：跨会话的全局学习线程、按来源讲解、ExplainContext 上下文管理、压缩与可诊断的设置界面。"
  },
  "yxxbc/dsh-balance-plugin": {
    "en": "A dynamic Cordis plugin for DeepSeek balance monitoring and usage stats — balance tracking, an official top-up entry point, usage analytics and third-party plugin management in one.",
    "ja": "DeepSeek の残高監視と使用量集計を行う動的 Cordis プラグイン。残高モニタ、公式チャージ導線、使用量統計、サードパーティ・プラグイン管理を一つにまとめている。",
    "ko": "DeepSeek 잔액 모니터링과 사용량 통계를 담당하는 동적 Cordis 플러그인. 잔액 추적, 공식 충전 진입점, 사용량 분석, 서드파티 플러그인 관리를 하나로 묶었다.",
    "zh": "DeepSeek 余额监控与用量统计的动态 Cordis 插件：余额监控、官方充值入口、用量统计与第三方插件管理四合一。"
  },
  "zenx0x/allinluna": {
    "en": "Resource-aware multi-agent orchestration for Codex and DeepSeek Harness, scheduling concurrent tasks against available capacity so agents don't starve each other.",
    "ja": "Codex と DeepSeek Harness 向けのリソース考慮型マルチエージェント編成。利用可能なリソースに応じて並行タスクをスケジュールし、互いの奪い合いを防ぐ。",
    "ko": "Codex와 DeepSeek Harness를 위한 리소스 인식 멀티 에이전트 오케스트레이션. 가용 자원에 맞춰 동시 작업을 스케줄링해 에이전트끼리 자원을 뺏지 않게 한다.",
    "zh": "面向 Codex 与 DeepSeek Harness 的资源感知型多 Agent 编排：按可用资源调度并发任务，避免互相抢占。"
  },
  "zh667/TokenLedger": {
    "en": "Relay-site attributed token usage tracking for DeepSeek Harness — tells you which relay your usage came from, with zero configuration and no credentials required.",
    "ja": "中継サイト単位で帰属を分ける DSH の token 使用量集計。設定も認証情報も不要で、どの中継経由の消費かを判別できる。",
    "ko": "중계 사이트별로 귀속을 구분하는 DSH 토큰 사용량 집계. 설정도 자격 증명도 필요 없이 어느 중계를 통한 소비인지 판별한다.",
    "zh": "按中转站归因的 DSH token 用量统计：零配置、不需要任何凭据即可分辨用量来自哪个中转服务。"
  },
  "zhu1090093659/dsh-web": {
    "en": "The plugin ecosystem bundle for the DeepSeek Harness (DSH) Web GUI — performance engine, task board, mobile and PC remote, SSH ops, image understanding, agent presets and transactional self-healing. Skins are just one piece of it.",
    "ja": "DSH Web GUI のプラグイン統合エコシステム——パフォーマンスエンジン、タスクボード、モバイル／PC 遠隔、SSH 運用、画像理解、agent プリセット、障害の自己修復。スキンはその一部にすぎません。",
    "ko": "DSH Web GUI용 플러그인 통합 생태계 번들 — 성능 엔진, 작업 보드, 모바일·PC 원격, SSH 운영, 이미지 이해, agent 프리셋, 트랜잭션 자가 복구. 스킨은 그중 하나일 뿐입니다.",
    "zh": "DSH Web GUI 的插件聚合生态包——性能引擎、任务看板、移动端与 PC 远程、SSH 运维、图像理解、agent 预设与故障自愈，皮肤只是其中一环。"
  },
  "zhu168/dsh-save-money": {
    "en": "A save-money plugin for DeepSeek Harness — define your own pause and resume time windows so long-running tasks are paused rather than killed at pause time, then resume automatically afterwards.",
    "ja": "節約プラグイン。独自の「一時停止／再開」時間帯を設定でき、停止時刻には実行中の長時間タスクを終了ではなく一時停止し、時間帯が明けると自動的に再開する。",
    "ko": "절약 플러그인. 직접 정한 일시정지·재개 시간대에 따라 실행 중인 장시간 작업을 종료가 아닌 일시정지 상태로 두었다가 시간대가 끝나면 자동으로 이어간다.",
    "zh": "省钱插件：自定义暂停与恢复的时间窗口，到点自动把运行中的长任务暂停（而非终止），窗口结束后自动继续。"
  },
  "zhuiyueya/dsh-im-gateway": {
    "en": "An aggregate IM gateway for DeepSeek Harness — connect your agents to WeChat, Feishu, Telegram, Discord and 20+ other chat platforms through one unified pipe.",
    "ja": "IM 集約ゲートウェイ・プラグイン。dsh のエージェントを WeChat・Feishu・Telegram・Discord など 20 以上のチャットプラットフォームに接続し、送受信を一元化する。",
    "ko": "IM 통합 게이트웨이 플러그인. dsh 에이전트를 WeChat, Feishu, Telegram, Discord 등 20개 이상 채팅 플랫폼에 연결해 메시지를 일원화한다.",
    "zh": "IM 聚合网关插件：把 dsh agent 接入微信、飞书、Telegram、Discord 等 20+ 聊天平台，统一收发消息。"
  },
  "zimodzh/dsh-plugin-dev-skills": {
    "en": "An Agent Skill for developing DeepSeek Harness plugins — conventions for plugins, services, events, tools, LLM adapters and packaging. Works with Claude Code, Codex, DSH, VS Code Copilot and any coding agent.",
    "ja": "DSH プラグイン開発のための Agent Skill。プラグイン・サービス・イベント・ツール・LLM アダプタ・パッケージングの標準を収録し、Claude Code、Codex、DSH、VS Code Copilot などで利用できる。",
    "ko": "DSH 플러그인 개발용 Agent Skill. 플러그인, 서비스, 이벤트, 도구, LLM 어댑터, 패키징 표준을 담았고 Claude Code, Codex, DSH, VS Code Copilot 등에서 쓸 수 있다.",
    "zh": "开发 DSH 插件的 Agent Skill：覆盖插件、服务、事件、工具、LLM 适配器与打包安装的标准做法，Claude Code、Codex、DSH 与 Copilot 都能用。"
  },
  "zp-home/dsh-recommend": {
    "en": "Transparent rankings and recommendations for the DSH plugin ecosystem — daily crawls of the dsh-plugin topic, an open scoring model, plus a leaderboard, recommender plugin and static site.",
    "ja": "DSH プラグイン生態の透明なランキングと推薦。dsh-plugin トピックを毎日自動取得し、公開されたスコアモデルでランキング・推薦プラグイン・静的サイトを生成する。",
    "ko": "DSH 플러그인 생태계의 투명한 순위와 추천. dsh-plugin 토픽을 매일 자동 수집하고 공개 점수 모델로 순위, 추천 플러그인, 정적 사이트를 만든다.",
    "zh": "DSH 插件生态的透明排行与推荐：每日自动抓取 dsh-plugin 话题，配公开评分模型，产出排行榜、推荐插件与静态站点。"
  }
};

const editorial: Record<string, PluginEditorial> = {
  "0xsline/awesome-deepseek-harness": {
    "intro": {
      "en": "An awesome.re-badged list of the DSH ecosystem with a wider scope than a pure plugin list — it collects tools and infrastructure alongside plugins. Its sourcing is stated plainly: the dsh-external/hub catalog merged with the public GitHub dsh-plugin topic. The README lays out entry points right at the top — install, contribution guide, the DeepSeek docs site, the public plugin topic, issues and the full catalogue each get a link, with long-tail entries living in a separate CATALOG.md. Bilingual Chinese and English.",
      "ja": "awesome.re バッジ付きの DSH エコシステムリストで、純粋なプラグイン一覧より範囲が広く、プラグインに加えてツールとインフラも収録します。データの出所も明記されています：dsh-external/hub の catalog と公開の GitHub dsh-plugin topic を合流させたもの。README の冒頭に入口が並びます——インストール、コントリビューションガイド、DeepSeek ドキュメントサイト、公開プラグイン topic、issues、完全なカタログにそれぞれリンクが張られ、ロングテールの項目は別途 CATALOG.md に収められています。中英バイリンガル。",
      "ko": "awesome.re 배지를 단 DSH 생태계 목록으로, 순수 플러그인 목록보다 범위가 넓어 플러그인 외에 도구와 인프라도 담습니다. 데이터 출처도 분명히 밝힙니다: dsh-external/hub의 catalog와 공개된 GitHub dsh-plugin topic을 합류시킨 것입니다. README 상단에 진입점이 정리되어 있습니다——설치, 기여 가이드, DeepSeek 문서 사이트, 공개 플러그인 topic, issues, 전체 카탈로그에 각각 링크가 걸리고, 롱테일 항목은 별도의 CATALOG.md에 있습니다. 중·영 이중 언어.",
      "zh": "一份 awesome.re 徽章的 DSH 生态清单，范围比纯插件清单更宽——插件之外还收工具与基础设施。它的数据来源写得很清楚：dsh-external/hub 的 catalog 加上公开的 GitHub dsh-plugin topic，两边合流。README 顶部就把入口铺好了：安装、贡献指南、DeepSeek 文档站、公开插件 topic、issues 和完整目录各自一个链接，长尾条目放在单独的 CATALOG.md 里。中英双语。"
    },
    "highlights": {
      "en": [
        "Scope spans plugins, tools and infrastructure rather than installable plugins alone",
        "Two merged sources: the dsh-external/hub catalog plus the public GitHub dsh-plugin topic",
        "Top-of-page navigation to install, contribution guide, docs site and issues; long-tail entries in a separate CATALOG.md, bilingual"
      ],
      "ja": [
        "対象範囲はプラグインに加えツールとインフラまで。導入可能なプラグインに限らない",
        "データは 2 系統を合流：dsh-external/hub の catalog ＋ 公開の GitHub dsh-plugin topic",
        "冒頭ナビからインストール・コントリビューションガイド・ドキュメント・issues へ直行。ロングテールは CATALOG.md、中英バイリンガル"
      ],
      "ko": [
        "범위가 플러그인에 더해 도구와 인프라까지. 설치 가능한 플러그인에 한정하지 않음",
        "두 출처를 합류: dsh-external/hub catalog + 공개 GitHub dsh-plugin topic",
        "상단 내비게이션에서 설치·기여 가이드·문서·issues로 바로 이동. 롱테일은 CATALOG.md, 중·영 이중 언어"
      ],
      "zh": [
        "范围覆盖插件、工具与基础设施，不限于可安装插件",
        "数据双源合流：dsh-external/hub catalog + 公开的 GitHub dsh-plugin topic",
        "顶部导航直达安装、贡献指南、文档站与 issues；长尾条目另置 CATALOG.md，中英双语"
      ]
    }
  },
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
  "Anionex/agent-vision-toolkit": {
    "intro": {
      "en": "This is the upstream, cross-host repository for the vision toolkit; native DSH support landed on 2026-08-13 through the independently maintained Anionex/dsh-vision-toolkit package, which this repo tracks as a git submodule — which is why the install command here points at that package rather than at this repository. What lands in DSH is ten structured visual tools: intent-aware image Q&A, grounding, detection, tracing, cropping, pixel diff, long-screenshot OCR, foreground extraction, dominant-colour analysis and HTML screenshots. Beyond the tools it wires into DSH Credentials, a managed isolated runtime, previewable Artifacts, a Web settings panel, and Agent-scoped progressive tool exposure — so all ten tools are not dumped into the model's request schema up front.",
      "ja": "本リポジトリはビジョンツールボックスの上流であり、ホスト横断で利用されます。DSH 側のネイティブ対応は 2026-08-13 に開始され、独立して保守される Anionex/dsh-vision-toolkit パッケージが提供します。本リポジトリはそれを git サブモジュールとして追跡しているため、当サイトのインストールコマンドはこのリポジトリではなく当該パッケージを指しています。DSH に入るのは 10 個の構造化ビジュアルツールです：意図を伴う画像 Q&A、grounding、検出、トレース、クロップ、ピクセル diff、長尺スクリーンショット OCR、前景抽出、主要色分析、HTML スクリーンショット。ツール本体に加え、DSH の資格情報体系、管理された隔離ランタイム、プレビュー可能な Artifacts、Web 設定パネル、そして Agent スコープでの段階的なツール公開にも接続します——最初から 10 個すべてをモデルのリクエストスキーマに詰め込むわけではありません。",
      "ko": "이 저장소는 비전 툴박스의 상류이며 여러 호스트를 아울러 쓰입니다. DSH 쪽 네이티브 지원은 2026-08-13에 시작되었고 독립적으로 유지되는 Anionex/dsh-vision-toolkit 패키지가 제공하며, 이 저장소는 그것을 git 서브모듈로 추적합니다——그래서 사이트의 설치 명령은 이 저장소가 아니라 해당 패키지를 가리킵니다. DSH에 들어가는 것은 10개의 구조화된 시각 도구입니다: 의도 기반 이미지 Q&A, grounding, 검출, 트레이싱, 크롭, 픽셀 diff, 긴 스크린샷 OCR, 전경 추출, 주요 색 분석, HTML 스크린샷. 도구 자체 외에도 DSH 자격 증명 체계, 관리되는 격리 런타임, 미리보기 가능한 Artifacts, Web 설정 패널, 그리고 Agent 범위의 점진적 도구 노출과 연결됩니다——처음부터 10개를 전부 모델의 요청 스키마에 밀어 넣지는 않습니다.",
      "zh": "这是视觉工具箱的上游仓库，跨宿主使用；DSH 那一侧的原生支持在 2026-08-13 上线，由独立维护的 Anionex/dsh-vision-toolkit 包提供，本仓库以 git 子模块的形式跟踪它——所以站内的安装命令指向那个包，而不是这个仓库。带进 DSH 的是 10 个结构化视觉工具：带意图的图片问答、grounding、检测、描摹、裁剪、像素级 diff、长截图 OCR、前景提取、主色分析和 HTML 截图。除了工具本身，它还接了 DSH 的凭据体系、一个受管的隔离运行时、可预览的 Artifacts、Web 设置面板，以及按 Agent 作用域渐进暴露工具的机制——不是一上来就把 10 个工具全塞进模型的请求 schema。"
    },
    "highlights": {
      "en": [
        "Ten structured visual tools: intent-aware Q&A, grounding, detection, tracing, cropping, pixel diff, long-screenshot OCR, foreground extraction, dominant colour, HTML screenshots",
        "DSH support ships as the separate @anionex/dsh-vision-toolkit package tracked here as a submodule; works in Web and Headless profiles",
        "Integrates DSH Credentials, a managed isolated runtime, previewable Artifacts and Agent-scoped progressive tool exposure"
      ],
      "ja": [
        "10 の構造化ビジュアルツール：意図付き Q&A、grounding、検出、トレース、クロップ、ピクセル diff、長尺 OCR、前景抽出、主要色、HTML スクリーンショット",
        "DSH 対応は別パッケージ @anionex/dsh-vision-toolkit が提供（本リポジトリはサブモジュールで追跡）。Web と Headless 両 profile に対応",
        "DSH 資格情報・管理された隔離ランタイム・プレビュー可能な Artifacts・Agent スコープの段階的ツール公開に接続"
      ],
      "ko": [
        "10개 구조화 시각 도구: 의도 기반 Q&A, grounding, 검출, 트레이싱, 크롭, 픽셀 diff, 긴 스크린샷 OCR, 전경 추출, 주요 색, HTML 스크린샷",
        "DSH 지원은 별도 패키지 @anionex/dsh-vision-toolkit가 제공(이 저장소는 서브모듈로 추적). Web과 Headless profile 모두 지원",
        "DSH 자격 증명·관리형 격리 런타임·미리보기 Artifacts·Agent 범위 점진적 도구 노출과 연동"
      ],
      "zh": [
        "10 个结构化视觉工具：意图问答、grounding、检测、描摹、裁剪、像素 diff、长截图 OCR、前景提取、主色分析、HTML 截图",
        "DSH 侧由独立包 @anionex/dsh-vision-toolkit 提供，本仓库以子模块跟踪；Web 与 Headless profile 通用",
        "接入 DSH 凭据、受管隔离运行时、可预览 Artifacts 与 Agent 作用域的渐进工具暴露"
      ]
    }
  },
  "Anionex/dsh-turn-rewind": {
    "intro": {
      "en": "Turn Rewind is the user-facing feature and repository name; Change Ledger is the durable restore engine beneath it — the `ctx.changeLedger` service, the on-disk format and the storage path all keep that name, because it describes the reusable snapshot and recovery layer rather than the web action alone. It gives a DSH session an explicit safety boundary around workspace mutations, and the flow runs: create a restore point → agent, user or external tools modify the worktree → preview exact path-level drift → review a full or selective restore plan → press the final restore button in the rewind dialog → create a rescue point → restore → verify. What it deliberately does not do matters just as much: it never commits, stashes, resets, switches branches, edits the Git index, or decides on its own that a change should be reverted. Why an engine rather than a diff button? A diff button can show current changes, but it does not own a durable restore lifecycle. Change Ledger owns content-addressed restore-point manifests, fences around the Git worktree, HEAD, branch and any in-progress operation, and stale-plan detection between the moment you review and the moment anything mutates. In the UI, Rewind appears as an icon-only third action under each user message, after its timestamp and the native Copy action; opening it shows the affected files and offers two choices — restore the files and restart from before that message, or restore only the files.",
      "ja": "Turn Rewind はユーザーから見た機能名でありリポジトリ名でもある。その下にある永続復元エンジンが Change Ledger だ——`ctx.changeLedger` サービス、ディスク上のフォーマット、保存パスはいずれもこの名前を保っている。Web 上の操作だけでなく、再利用可能なスナップショットと復旧の層そのものを指す名前だからだ。これは DSH のセッションに、ワークスペース変更をめぐる明確な安全境界を与える。流れはこうだ。復元ポイントを作る → agent / ユーザー / 外部ツールがワークツリーを変更する → パス単位の正確な差分をプレビューする → 完全または選択的な復元プランを確認する → rewind ダイアログで最終的な復元ボタンを押す → レスキューポイントを作る → 復元する → 検証する。意図的にやらないことも同じくらい重要だ。commit も stash も reset もせず、ブランチを切り替えず、Git インデックスを触らず、ある変更を戻すべきだと自動で判断することもない。なぜ diff ボタンではなくエンジンなのか。diff ボタンは現在の変更を表示できるが、永続的な復元ライフサイクルを所有していないからだ。Change Ledger が所有するのは、内容アドレス方式の復元ポイントマニフェスト、Git のワークツリー・HEAD・ブランチ・進行中の操作に対するフェンス、そして確認した時点と実際に変更する時点のあいだの陳腐化プラン検出である。UI 上では、Rewind は各ユーザーメッセージの下、タイムスタンプとネイティブのコピー操作に続く 3 番目のアイコンのみのアクションとして現れる。開くと影響を受けるファイルが表示され、2 つの選択肢が提示される——ファイルを復元してそのメッセージの前から再開するか、ファイルだけを復元するか。",
      "ko": "Turn Rewind는 사용자에게 보이는 기능이자 저장소 이름이고, 그 아래의 지속 복원 엔진이 Change Ledger다 — `ctx.changeLedger` 서비스와 디스크 포맷, 저장 경로는 모두 이 이름을 유지하는데, 웹의 동작 하나가 아니라 재사용 가능한 스냅샷·복구 계층 자체를 가리키는 이름이기 때문이다. 이것은 DSH 세션에 워크스페이스 변경을 둘러싼 명확한 안전 경계를 제공한다. 흐름은 이렇다. 복원 지점 생성 → 에이전트·사용자·외부 도구가 워크트리를 수정 → 경로 단위의 정확한 변동 미리보기 → 전체 또는 선택적 복원 계획 검토 → rewind 대화상자에서 최종 복원 버튼 누르기 → 구조 지점 생성 → 복원 → 검증. 의도적으로 하지 않는 일도 그만큼 중요하다. commit도 stash도 reset도 하지 않고, 브랜치를 바꾸지 않으며, Git 인덱스를 건드리지 않고, 어떤 변경을 되돌려야 한다고 스스로 판단하지도 않는다. 왜 diff 버튼이 아니라 엔진인가. diff 버튼은 현재 변경을 보여 줄 수는 있지만 지속적인 복원 생명주기를 소유하지 않기 때문이다. Change Ledger가 소유하는 것은 내용 주소 방식의 복원 지점 매니페스트, Git 워크트리·HEAD·브랜치·진행 중 작업에 대한 펜스, 그리고 검토 시점과 실제 변경 시점 사이의 낡은 계획 감지다. UI에서 Rewind는 각 사용자 메시지 아래, 타임스탬프와 기본 복사 동작에 이어 세 번째 아이콘 전용 동작으로 나타난다. 열면 영향받는 파일이 표시되고 두 가지 선택지가 주어진다 — 파일을 복원하고 그 메시지 이전부터 다시 시작하거나, 파일만 복원하거나.",
      "zh": "Turn Rewind 是面向用户的功能与仓库名，Change Ledger 是它底下的持久恢复引擎——`ctx.changeLedger` 服务、磁盘格式和存储路径都沿用后者的名字，因为它描述的是可复用的快照与恢复层，而不只是 Web 上那个动作。它给 DSH 会话在工作区改动周围划出一条明确的安全边界，流程是这样的：创建恢复点 → agent / 用户 / 外部工具修改工作树 → 预览精确的路径级漂移 → 审阅完整或选择性的恢复方案 → 在 rewind 对话框里按下最终恢复按钮 → 创建救援点 → 恢复 → 验证。它明确不做的事情同样重要：从不 commit、不 stash、不 reset、不切分支、不动 Git 索引，也不会自动判定某个改动应该被回滚。为什么需要一个引擎而不是一个 diff 按钮？因为 diff 按钮能显示当前改动，却不拥有持久的恢复生命周期。Change Ledger 拥有的是：内容寻址的恢复点清单、Git 工作树与 HEAD 与分支与进行中操作的围栏，以及审阅与实际改动之间的陈旧方案检测。界面上，Rewind 是每条用户消息下的第三个纯图标动作，排在时间戳和原生复制之后；点开会列出受影响的文件，并给你两个选择：恢复文件并从这条消息之前重新开始，或者只恢复文件。"
    },
    "highlights": {
      "en": [
        "Anchored to user messages: every message gains a Rewind icon action that opens to the affected files and exact path-level drift",
        "Two choices on restore: files only, or restore the files and restart from before that message",
        "The Change Ledger engine owns content-addressed restore-point manifests, Git worktree/HEAD/branch/in-progress fences, and stale-plan detection",
        "Clear boundaries: never commits, stashes, resets, switches branches or edits the Git index, and never auto-decides what to revert — a rescue point is created before restoring"
      ],
      "ja": [
        "ユーザーメッセージを起点に：各メッセージの下に Rewind アイコン操作が増え、開くと影響ファイルとパス単位の差分が並ぶ",
        "復元時の 2 択：ファイルだけ戻すか、ファイルを戻したうえでそのメッセージの前から再開するか",
        "Change Ledger エンジンが内容アドレス方式の復元ポイントマニフェスト、Git ワークツリー/HEAD/ブランチ/進行中操作のフェンス、陳腐化プラン検出を所有",
        "境界が明確：commit・stash・reset・ブランチ切替・Git インデックス変更を一切せず、戻すべき対象を自動判断しない。復元前にレスキューポイントを作成"
      ],
      "ko": [
        "사용자 메시지를 기준점으로: 메시지마다 Rewind 아이콘 동작이 생기고, 열면 영향 파일과 경로 단위 변동이 나열된다",
        "복원 시 두 가지 선택: 파일만 되돌리기, 또는 파일을 되돌리고 그 메시지 이전부터 다시 시작하기",
        "Change Ledger 엔진이 내용 주소 복원 지점 매니페스트, Git 워크트리/HEAD/브랜치/진행 중 작업 펜스, 낡은 계획 감지를 담당",
        "경계가 분명: commit·stash·reset·브랜치 전환·Git 인덱스 수정을 하지 않고 되돌릴 대상을 자동 판단하지 않는다. 복원 전 구조 지점을 먼저 생성"
      ],
      "zh": [
        "以用户消息为锚点：每条消息下多一个 Rewind 图标动作，点开列出受影响文件与路径级漂移",
        "两种选择：只还原文件，或还原文件并从这条消息之前重新开始",
        "Change Ledger 引擎提供内容寻址恢复点清单、Git 工作树/HEAD/分支/进行中操作围栏，以及陈旧方案检测",
        "边界清晰：从不 commit、stash、reset、切分支或改 Git 索引，也不自动判定该回滚什么；恢复前先建救援点"
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
    }
  },
  "ChisaAlter/Deepseek-Harness-Desktop": {
    "intro": {
      "en": "This desktop client keeps a deliberately narrow scope: conversation, tool calls and approvals still run through the official `dsh web`. Electron only takes over windows, tray, workspaces, API keys and launch orchestration, then fills a few gaps the official build leaves open. At startup it checks `127.0.0.1:3080`, kills leftover dsh processes from the last run, and hops to a free port if something else holds it; a triple launch chain tries the `vendor/deepseek-harness` build output, then a local `dsh`, then `npx @deepseek-ai/dsh`, so one of them always comes up. Workspaces register into Harness over RPC at startup, with nothing to create by hand. The additions: custom and third-party models can be given five reasoning-effort levels from Low to Extreme, switchable right in the input bar; when the main model can't read images (yes, DeepSeek), a separately configured vision model looks at the picture first and hands the description to the main model; Appearance lets you pick a built-in theme or build your own, with separate light and dark palettes, frosted glass, pixelation and glass opacity all adjustable, plus a background image; and the plugin market reads the GitHub `dsh-plugin` topic directly, filtered by UI, workflow, tools, notifications, development and learning categories, installing and removing into the web profile in one click via the official `dsh plugin --profile web add`. A frameless window with a custom title bar, a persistent tray icon, and a green update button next to Settings when a new release lands. API keys live separately from config and are injected into the dsh process through `DEEPSEEK_API_KEY`. Windows x64 installers only for now.",
      "ja": "このデスクトップ版の立ち位置は意図的に控えめだ。会話・ツール呼び出し・承認は今も公式の `dsh web` が担い、Electron はウィンドウ・トレイ・ワークスペース・API Key・起動オーケストレーションだけを引き受け、公式がカバーしていない部分をいくつか補う。起動時に `127.0.0.1:3080` を確認し、前回残った dsh プロセスを終了させ、他のプログラムが使っていれば空いているポートへ自動的に移る。三重の起動チェーンが `vendor/deepseek-harness` のビルド成果物 → ローカルの `dsh` → `npx @deepseek-ai/dsh` の順に試すので、どれかは必ず立ち上がる。ワークスペースは起動時に RPC で Harness に登録され、手動で作る必要はない。補われた機能は次のとおり。カスタム/サードパーティモデルには Low から Extreme までの 5 段階の思考強度を設定でき、入力欄から直接切り替えられる。メインモデルが画像を扱えないとき（そう、DeepSeek のことだ）、別途設定した画像認識モデルが先に画像を見て、その説明をメインモデルに渡す。外観では内蔵テーマを選ぶか自分で作ることができ、ライト/ダーク 2 系統の配色、すりガラス、ピクセル化、ガラスの透明度をすべて調整でき、背景画像も敷ける。プラグインマーケットは GitHub の `dsh-plugin` トピックを直接読み、UI・ワークフロー・ツール・通知・開発・学習のカテゴリで絞り込み、公式の `dsh plugin --profile web add` 経由でワンクリック導入/削除する。フレームレスウィンドウと自前描画のタイトルバー、常駐トレイ、新バージョンがあれば設定ボタンの横に緑の更新ボタンが出る。API Key は設定とは別に保管され、`DEEPSEEK_API_KEY` として dsh プロセスに注入される。現時点では Windows x64 インストーラーのみ。",
      "ko": "이 데스크톱 클라이언트의 범위는 의도적으로 좁다. 대화와 도구 호출, 승인은 여전히 공식 `dsh web`이 담당하고, Electron은 창·트레이·워크스페이스·API Key·시작 오케스트레이션만 맡은 뒤 공식 빌드가 비워 둔 몇 곳을 채운다. 시작할 때 `127.0.0.1:3080`을 확인해 지난번에 남은 dsh 프로세스를 정리하고, 다른 프로그램이 점유하고 있으면 빈 포트로 자동 이동한다. 삼중 시작 체인이 `vendor/deepseek-harness` 빌드 산출물 → 로컬 `dsh` → `npx @deepseek-ai/dsh` 순으로 시도하므로 하나는 반드시 뜬다. 워크스페이스는 시작 시 RPC로 Harness에 등록되어 직접 만들 필요가 없다. 추가된 기능은 이렇다. 커스텀·서드파티 모델에 Low부터 Extreme까지 다섯 단계 사고 강도를 지정해 입력창에서 바로 전환할 수 있다. 메인 모델이 이미지를 못 읽을 때(그렇다, DeepSeek 이야기다) 따로 설정한 이미지 인식 모델이 먼저 그림을 보고 그 설명을 메인 모델에 넘긴다. 외관에서는 내장 테마를 고르거나 직접 만들 수 있고, 라이트·다크 두 벌 배색과 프로스트 글래스, 픽셀화, 유리 투명도를 모두 조절하며 배경 이미지도 깔 수 있다. 플러그인 마켓은 GitHub `dsh-plugin` 토픽을 직접 읽어 UI·워크플로·도구·알림·개발·학습 분류로 걸러 주고, 공식 `dsh plugin --profile web add`를 통해 web profile에 원클릭으로 설치·제거한다. 테두리 없는 창과 직접 그린 타이틀 바, 상주 트레이, 새 버전이 나오면 설정 버튼 옆에 뜨는 녹색 업데이트 버튼도 있다. API Key는 설정과 분리 보관되어 `DEEPSEEK_API_KEY`로 dsh 프로세스에 주입된다. 현재는 Windows x64 설치 파일만 제공한다.",
      "zh": "这个桌面端的定位很克制：对话、工具调用、审批依然是官方 `dsh web`，Electron 只接管窗口、托盘、工作区、API Key 和启动编排，再在官方没覆盖到的地方补几块。启动时会检测 `127.0.0.1:3080`，杀掉上次残留的 dsh 进程，被别的程序占用就自动跳到空闲端口；三重启动链依次尝试 `vendor/deepseek-harness` 构建产物、本机 `dsh`、`npx @deepseek-ai/dsh`，总有一条能起来。工作区在启动时通过 RPC 注册进 Harness，不用手建。补的功能包括：自定义和第三方模型可以勾选 Low 到 Extreme 五档思考强度，直接在输入栏切换；主模型不支持图片时（对，说的就是 DeepSeek）先由专门配置的识图模型看图，再把描述交给主模型；外观里可以选内置主题或自己做一套，浅深两套色、毛玻璃、像素化、玻璃透明度都能调，还能铺背景图；插件市场直接读 GitHub `dsh-plugin` 话题，按界面、工作流、工具、通知、开发、学习分类筛选，一键装卸到 web profile，安装走官方 `dsh plugin --profile web add`。无边框窗口配自绘标题栏，托盘常驻，有新版本时设置按钮旁会冒出绿色提示可在线更新。API Key 与配置分开存放，通过 `DEEPSEEK_API_KEY` 注入 dsh 进程。目前只提供 Windows x64 安装包。"
    },
    "highlights": {
      "en": [
        "Doesn't rebuild the chat UI: conversation and approvals stay on the official `dsh web`, while Electron handles windows, tray, workspaces, keys and launch",
        "Triple launch chain (vendor build → local `dsh` → `npx`) with automatic port fallback, and workspaces auto-registered over RPC at startup",
        "Five reasoning-effort levels for third-party models, switchable from the input bar; a dedicated vision model covers for main models that can't read images",
        "Plugin market reads the GitHub `dsh-plugin` topic with category filters and one-click install/uninstall; themes and backgrounds support frosted glass, pixelation and opacity"
      ],
      "ja": [
        "チャット画面は作り直さない：会話と承認は公式 `dsh web` のまま、Electron はウィンドウ・トレイ・ワークスペース・Key・起動を担当",
        "三重起動チェーン（vendor ビルド → ローカル `dsh` → `npx`）とポート自動回避、ワークスペースは起動時に RPC で自動登録",
        "サードパーティモデルの思考強度 5 段階を入力欄から直接切替。メインモデルが画像を扱えないときは専用の画像認識モデルが肩代わり",
        "プラグインマーケットは GitHub `dsh-plugin` トピックをカテゴリ絞り込みで表示しワンクリック導入/削除。テーマと背景画像はすりガラス・ピクセル化・透明度を調整可能"
      ],
      "ko": [
        "채팅 UI를 새로 만들지 않는다: 대화와 승인은 공식 `dsh web` 그대로, Electron은 창·트레이·워크스페이스·Key·시작을 담당",
        "삼중 시작 체인(vendor 빌드 → 로컬 `dsh` → `npx`)과 포트 자동 회피, 워크스페이스는 시작 시 RPC로 자동 등록",
        "서드파티 모델 사고 강도 5단계를 입력창에서 바로 전환. 메인 모델이 이미지를 못 읽으면 전용 인식 모델이 대신 처리",
        "플러그인 마켓이 GitHub `dsh-plugin` 토픽을 분류 필터로 보여 주고 원클릭 설치·제거. 테마와 배경 이미지는 프로스트 글래스·픽셀화·투명도 조절 지원"
      ],
      "zh": [
        "不重做聊天界面：对话与审批仍走官方 `dsh web`，Electron 只管窗口、托盘、工作区、Key 与启动编排",
        "三重启动链（vendor 构建产物 → 本机 `dsh` → `npx`）+ 端口自动避让，工作区启动时经 RPC 自动注册",
        "第三方模型五档思考强度直接在输入栏切换；主模型不能识图时由专配识图模型兜底",
        "插件市场读 GitHub `dsh-plugin` 话题分类筛选，一键装卸到 web profile；主题与背景图支持毛玻璃、像素化、透明度调节"
      ]
    }
  },
  "Devin-AXIS/iPolloWork": {
    "intro": {
      "en": "iPolloWork gives agents one workspace covering repositories, local files, browser tasks, documents, presentations, websites, design and video: you describe the outcome, the agent plans and executes, and you inspect the work, approve actions and keep editing the result in the same place. What separates it from a pure coding agent is that last step — when the output is a deck, a web page, a visual design or a video, it stays editable rather than being handed off as a finished blob. On DSH specifically, the plan is to integrate DeepSeek Harness as an optional subagent runtime: iPolloWork remains the primary workspace, delegates bounded work to DSH subagents and brings structured results back into the same task, with each side keeping its own Skills and plugin ecosystem. Per the README, however, that integration is in active development and is not included in the latest stable release.",
      "ja": "iPolloWork はリポジトリ、ローカルファイル、ブラウザタスク、ドキュメント、プレゼン、ウェブサイト、デザイン、動画を一つのワークスペースにまとめます：成果物を説明すると agent が計画して実行し、あなたは作業を確認し、操作を承認し、同じ場所で結果を編集し続けられます。純粋なコーディング agent との違いは最後の一歩にあります——成果物がスライド、ウェブページ、ビジュアルデザイン、動画であっても編集可能なまま保たれ、完成物として投げ渡されて終わりにはなりません。DSH について明確にしておくと、計画されているのは DeepSeek Harness をオプションのサブエージェントランタイムとして統合することです：iPolloWork が主ワークスペースであり続け、範囲を限定した作業を DSH サブエージェントに委譲して構造化された結果を同じタスクへ戻し、双方が自分の Skills とプラグインエコシステムを保持します。ただし README によれば、この統合は現在開発中であり、最新の安定版には含まれていません。",
      "ko": "iPolloWork는 저장소, 로컬 파일, 브라우저 작업, 문서, 프레젠테이션, 웹사이트, 디자인, 영상을 하나의 작업 공간에 모읍니다: 결과를 설명하면 agent가 계획하고 실행하며, 당신은 작업을 검토하고 동작을 승인한 뒤 같은 자리에서 결과를 계속 편집합니다. 순수 코딩 agent와 갈리는 지점은 마지막 단계입니다——산출물이 덱이든 웹 페이지든 비주얼 디자인이든 영상이든 편집 가능한 상태로 남고, 완성품으로 넘겨주고 끝나지 않습니다. DSH에 관해서는 분명히 해 둘 점이 있습니다: 계획된 것은 DeepSeek Harness를 선택적 서브에이전트 런타임으로 통합하는 것으로, iPolloWork가 주 작업 공간으로 남아 범위가 한정된 작업을 DSH 서브에이전트에 위임하고 구조화된 결과를 같은 작업으로 되가져오며, 양쪽이 각자의 Skills와 플러그인 생태계를 유지합니다. 다만 README에 따르면 이 통합은 현재 개발 중이며 최신 안정 릴리스에는 포함되어 있지 않습니다.",
      "zh": "iPolloWork 把仓库、本地文件、浏览器任务、文档、演示、网站、设计和视频收进同一个工作区：你描述结果，agent 规划并执行，你审查、批准，然后在同一个地方继续编辑产物。它和纯编码 agent 的区别在最后一步——当产物是一份演示、一个网页、一套视觉设计或一段视频时，它保持可编辑，而不是把结果丢给你了事。关于 DSH 需要说清楚：作者规划中的是把 DeepSeek Harness 作为可选的子代理运行时接进来，iPolloWork 仍是主工作区，把有边界的工作委派给 DSH 子代理再把结构化结果带回同一个任务，两边各自保留自己的 Skills 和插件生态。但这项集成按 README 自述仍在开发中，尚未包含在最新稳定版里。"
    },
    "highlights": {
      "en": [
        "One goal produces code, documents, decks, websites, designs and video, and the output stays editable",
        "A local-first workspace unifying repositories, local files and browser tasks",
        "On DSH: planned as an optional subagent runtime, but the README states the integration is still in development and not in the stable release"
      ],
      "ja": [
        "一つのゴールからコード・ドキュメント・プレゼン・ウェブサイト・デザイン・動画を生成し、成果物は編集可能なまま",
        "ローカルファーストのワークスペースでリポジトリ・ローカルファイル・ブラウザタスクを一元管理",
        "DSH との関係：オプションのサブエージェントランタイムとして統合予定だが、README 自身が開発中・安定版未搭載と明記"
      ],
      "ko": [
        "하나의 목표로 코드·문서·덱·웹사이트·디자인·영상을 만들고 산출물은 계속 편집 가능",
        "로컬 우선 작업 공간에서 저장소·로컬 파일·브라우저 작업을 통합 관리",
        "DSH와의 관계: 선택적 서브에이전트 런타임으로 통합 예정이나, README가 개발 중·안정 릴리스 미포함이라고 명시"
      ],
      "zh": [
        "一个目标产出代码、文档、演示、网站、设计与视频，且产物保持可继续编辑",
        "本地优先的工作区，统一管理仓库、本地文件与浏览器任务",
        "与 DSH 的关系：计划把 DSH 作为可选子代理运行时，但 README 自述该集成仍在开发中、未进入稳定版"
      ]
    }
  },
  "Electricitysheep/dsh-handbook": {
    "intro": {
      "en": "A systematic Chinese-language primer whose selling point is that every chapter runs — these are not scattered snippets; the commands have all been tested. The fourteen-chapter route starts at what Harness is and a five-minute quickstart, moves through profiles and the plugin system, hands-on plugin development, use cases and performance tuning, then ecosystem resources, tools and the context system, MCP subagents and workflows, and closes on complex worked examples, a look ahead, known gaps and boundaries, security and sandboxing, and caching and cost. Notably it devotes a whole chapter to known gaps and boundaries, which is uncommon in introductory material. It ships both as an online reading site and a 5.2 MB PDF, under CC BY-NC-SA 4.0.",
      "ja": "体系的な中国語の入門書で、売りは「各章が実行可能」であること——断片的なサンプルではなく、コマンドはすべて実際に検証されています。14 章の道筋は、Harness とは何か、5 分で始める、から始まり、profile とプラグインシステム、プラグイン開発の実践、活用シーンと性能チューニングを経て、エコシステムとリソース、ツールとコンテキストシステム、MCP サブエージェントとワークフローへ進み、最後に複雑な実戦ケース、今後の展望、既知の不足と境界、セキュリティとサンドボックス、キャッシュとコストで締めくくられます。特筆すべきは「既知の不足と境界」に一章を割いている点で、入門教材では珍しい構成です。オンライン閲覧サイトと 5.2MB の PDF の 2 形態があり、CC BY-NC-SA 4.0 で公開されています。",
      "ko": "체계적인 중국어 입문서로, 핵심 강점은 「각 장이 실행 가능」하다는 점입니다——흩어진 예제가 아니라 명령을 전부 실제로 검증했습니다. 14장의 흐름은 Harness가 무엇인지와 5분 만에 시작하기에서 출발해 profile과 플러그인 시스템, 플러그인 개발 실전, 활용 사례와 성능 튜닝을 지나 생태계와 자원, 도구와 컨텍스트 시스템, MCP 서브에이전트와 워크플로로 이어지고, 마지막으로 복잡한 실전 사례, 향후 전망, 알려진 한계와 경계, 보안과 샌드박스, 캐시와 비용으로 마무리됩니다. 특히 「알려진 한계와 경계」에 한 장을 통째로 할애한 점이 입문 자료에서는 드문 구성입니다. 온라인 열람 사이트와 5.2MB PDF 두 형태로 제공되며 CC BY-NC-SA 4.0으로 공개됩니다.",
      "zh": "一本系统的中文入门手册，卖点是「每章可运行」——不是零散示例，命令全部实测过。14 章的路线从认识 Harness、五分钟上手，走到 profile 与插件系统、插件开发实战、应用场景与性能调优，再到生态资源、工具与上下文系统、MCP 子代理与工作流，最后收在复杂实战案例、未来展望、已知不足与边界、安全与沙箱、缓存与成本。值得一提的是它专门留了一章讲「已知不足与边界」，这在入门材料里不常见。有在线阅读站点和 5.2MB 的 PDF 两种形态，按 CC BY-NC-SA 4.0 发布。"
    },
    "highlights": {
      "en": [
        "Fourteen chapters from zero to one, with tested runnable commands in each rather than scattered snippets",
        "Covers profiles and the plugin system, plugin development, MCP subagents and workflows, security sandboxing, caching and cost",
        "A dedicated chapter on known gaps and boundaries; online reader plus PDF, under CC BY-NC-SA 4.0"
      ],
      "ja": [
        "ゼロからイチまで 14 章、各章のコマンドは実測済みで実行可能。断片的サンプルではない",
        "profile とプラグインシステム、プラグイン開発、MCP サブエージェントとワークフロー、セキュリティサンドボックス、キャッシュとコストを網羅",
        "「既知の不足と境界」に専用章。オンライン閲覧＋PDF の 2 形態、CC BY-NC-SA 4.0"
      ],
      "ko": [
        "0에서 1까지 14장, 각 장의 명령이 실측된 실행 가능한 형태로 흩어진 예제가 아님",
        "profile과 플러그인 시스템, 플러그인 개발, MCP 서브에이전트와 워크플로, 보안 샌드박스, 캐시와 비용까지 포괄",
        "「알려진 한계와 경계」 전용 장 수록. 온라인 열람 + PDF 두 형태, CC BY-NC-SA 4.0"
      ],
      "zh": [
        "14 章从 0 到 1，每章命令都实测可运行，不是零散示例",
        "覆盖 profile 与插件系统、插件开发、MCP 子代理与工作流、安全沙箱、缓存与成本",
        "专章讲「已知不足与边界」；在线阅读 + PDF 两种形态，CC BY-NC-SA 4.0"
      ]
    }
  },
  "FSMargoo/dsh-at-file": {
    "intro": {
      "en": "Typing @ opens a picker, and the matched file or directory path drops straight into the draft; the selected path stays visible in the reference bar and can be opened or removed. The key design decision landed in 0.3.0: before the agent starts a step, the plugin confirms the path really exists inside the active workspace, then appends only a short reference message (a workspace-reference carrying the workspace-relative path and its kind). It does not open the referenced file or list the contents of a referenced directory — whether to look, and with which tool, is the agent's call based on the task. As a result file format and size are irrelevant to this path: a PDF follows exactly the same path-reference flow as any other workspace file. Only earlier releases read content at submission time and enforced size limits.",
      "ja": "入力欄で @ を打つとピッカーが開き、一致したファイルやディレクトリのパスがそのまま下書きに入ります。選んだパスは参照バーに残り、開くことも削除することもできます。設計上の要となる判断は 0.3.0 で入りました：agent がステップを開始する前に、そのパスが現在のワークスペース内に実在するかを確認し、短い参照メッセージ（ワークスペース相対パスと種別を持つ workspace-reference）だけを追加します。参照先のファイルを開くことも、参照先ディレクトリの中身を列挙することもしません——見るかどうか、どのツールで見るかは、タスクに応じて agent が決めます。したがってファイル形式やサイズはこの経路に影響せず、PDF も他のワークスペースファイルとまったく同じパス参照フローを通ります。提出時に内容を読み、サイズ制限を課していたのは初期リリースだけです。",
      "ko": "입력창에서 @를 치면 선택기가 열리고, 검색된 파일 또는 디렉터리 경로가 초안에 바로 들어갑니다. 선택한 경로는 참조 바에 남아 열거나 제거할 수 있습니다. 핵심 설계 결정은 0.3.0에서 들어왔습니다: agent가 다음 단계를 시작하기 전에 그 경로가 현재 워크스페이스 안에 실제로 존재하는지 확인한 뒤, 짧은 참조 메시지(워크스페이스 상대 경로와 종류를 담은 workspace-reference)만 덧붙입니다. 참조된 파일을 열지도, 참조된 디렉터리의 내용을 나열하지도 않습니다——볼지 말지, 어떤 도구로 볼지는 작업에 따라 agent가 결정합니다. 따라서 파일 형식과 크기는 이 경로에 영향을 주지 않으며, PDF도 다른 워크스페이스 파일과 똑같은 경로 참조 흐름을 탑니다. 제출 시점에 내용을 읽고 크기 제한을 두던 것은 초기 릴리스뿐입니다.",
      "zh": "在输入框打 @ 唤起选择器，搜到的文件或目录路径直接插进草稿，选中的路径会留在引用栏里，可以打开也可以移除。关键的设计取舍在 0.3.0 之后：插件在 agent 开始下一步之前确认路径确实存在于当前工作区，然后只追加一条简短的引用消息（形如 workspace-reference，带工作区相对路径和类型），它不打开被引用的文件，也不列举被引用目录的内容——要不要看、用什么工具看，交给 agent 按任务需要决定。所以文件格式和大小都不影响这条链路，PDF 和任何别的文件走一样的路径引用流程；早期版本才在提交时读取内容并有大小限制。"
    },
    "highlights": {
      "en": [
        "Passes the path, not the contents: since 0.3.0 it appends a workspace-reference message and lets the agent decide whether to read it",
        "Consequently format and size do not matter — a PDF follows the same flow as any other file",
        "Ranking favours exact names, prefixes and compact matches; a query with / matches path segments, ArrowRight enters a directory, and the default index skips VCS, IDE metadata, dependency trees, caches and build output"
      ],
      "ja": [
        "渡すのはパスで内容ではない：0.3.0 以降は workspace-reference メッセージを追加し、読むかどうかは agent が判断",
        "そのため形式もサイズも無関係。PDF も他のファイルと同じフローを通る",
        "完全一致・前方一致・コンパクト一致を上位に、/ を含む問い合わせはパスセグメント順で一致。→ キーでディレクトリに入れ、既定の索引は VCS・IDE メタデータ・依存ツリー・キャッシュ・ビルド成果物を除外"
      ],
      "ko": [
        "내용이 아니라 경로를 전달: 0.3.0부터 workspace-reference 메시지를 덧붙이고 읽을지는 agent가 판단",
        "그래서 형식과 크기가 무관 — PDF도 다른 파일과 같은 흐름",
        "정확한 이름·접두사·압축 일치를 상위로, / 가 들어간 질의는 경로 세그먼트 순으로 일치. → 키로 디렉터리 진입, 기본 색인은 VCS·IDE 메타데이터·의존성 트리·캐시·빌드 산출물 제외"
      ],
      "zh": [
        "只递路径不读内容：0.3.0 起改为追加一条 workspace-reference 引用消息，读不读由 agent 决定",
        "因此不受文件格式与大小影响，PDF 与普通文件走同一条流程",
        "搜索按精确名、前缀、紧凑匹配排序；查询带 / 时按路径段匹配，方向键可进入目录；默认索引跳过版本控制、IDE 元数据、依赖树、缓存与构建产物"
      ]
    }
  },
  "GanyuanRan/Aegis": {
    "intro": {
      "en": "Aegis is aimed squarely at the \"I can't stop babysitting my agent\" problem. It isn't a plugin or a daemon — it's a method pack. Before touching code, the agent aligns with your project's real baseline: who owns what, what the contracts are, where the boundaries sit, instead of guessing. When it claims something is done, that claim ships with fresh verification evidence, the scope it covered, and the residual risk — you read evidence, not vibes. Retired fallbacks and old code paths get tracked or removed under a retirement trigger, so technical debt stops accumulating silently. It also deliberately keeps a fast path: trivial requests stay trivial, and ceremony only shows up when the task genuinely calls for it. The effect was measured on a frozen held-out A/B benchmark (Aegis 2.7.6, 120 valid runs across 20 cases, both arms on gpt-5.6-sol / xhigh): contract pass rate rose from 61.67% to 93.33% and unsafe outcomes fell from 13.33% to 0%. The same pack runs on Codex, Claude Code, OpenCode, Kimi and DeepSeek Harness, with a dedicated DSH setup guide.",
      "ja": "Aegis が狙うのは「Agent から目を離せない」という問題そのものだ。プラグインでもデーモンでもなく、メソッドパックである。コードを触る前に、Agent はプロジェクトの実際のベースライン——誰が何を持ち、契約は何で、境界はどこか——と整合する。推測ではない。「終わった」と主張するときは、新鮮な検証証拠・カバー範囲・残存リスクが必ず添えられる。読むのは証拠であって雰囲気ではない。退役したフォールバックや古い経路は退役トリガーで追跡または削除され、技術的負債が静かに積み上がることがなくなる。同時に高速レーンも意図的に残されている。些細な依頼は些細なままで、儀式はタスクが本当に必要とするときだけ現れる。効果は凍結された hold-out A/B ベンチマークで測定済み（Aegis 2.7.6、20 ケース 120 有効ラン、両アームとも gpt-5.6-sol / xhigh）。契約合格率は 61.67% から 93.33% へ、危険な結果は 13.33% から 0% へ。同じパックが Codex・Claude Code・OpenCode・Kimi・DeepSeek Harness で動き、DSH には専用の導入ドキュメントがある。",
      "ko": "Aegis가 겨냥하는 것은 '에이전트에서 눈을 뗄 수 없다'는 문제다. 플러그인도 데몬도 아닌 메서드 팩이다. 코드를 건드리기 전에 에이전트는 프로젝트의 실제 기준선 — 누가 무엇을 소유하고, 계약은 무엇이며, 경계는 어디인지 — 과 정렬한다. 추측이 아니다. '끝났다'고 주장할 때는 신선한 검증 증거와 커버한 범위, 남은 위험이 함께 나온다. 읽는 것은 증거지 분위기가 아니다. 퇴역한 폴백과 옛 경로는 퇴역 트리거로 추적되거나 제거되어, 기술 부채가 조용히 쌓이지 않는다. 동시에 빠른 경로도 의도적으로 남겨 뒀다. 사소한 요청은 사소한 채로 두고, 절차는 작업이 정말 필요로 할 때만 등장한다. 효과는 동결된 hold-out A/B 벤치마크에서 측정됐다(Aegis 2.7.6, 20개 케이스 120회 유효 실행, 양쪽 모두 gpt-5.6-sol / xhigh). 계약 통과율은 61.67%에서 93.33%로, 위험한 결과는 13.33%에서 0%로. 같은 팩이 Codex·Claude Code·OpenCode·Kimi·DeepSeek Harness에서 동작하며, DSH용 전용 설치 문서가 있다.",
      "zh": "Aegis 想解决的是「不敢放手让 Agent 干活」这件事。它不是插件也不是守护进程，而是一套方法包：让 Agent 在改代码之前先对齐你项目的真实基线——谁负责什么、契约是什么、边界在哪，而不是靠猜；声称「做完了」的时候必须附上新鲜的验证证据、覆盖范围和残留风险，你读的是证据不是感觉；退役的兜底逻辑和旧路径会被追踪或删掉，技术债不再悄悄堆积。同时它刻意保留了快车道：琐碎的请求不会被套上一堆流程，只有任务本身复杂时仪式感才会出现。效果在一份冻结的留出 A/B 基准上量过（Aegis 2.7.6，20 个用例 120 次有效运行，两侧同为 gpt-5.6-sol / xhigh）：契约通过率从 61.67% 升到 93.33%，不安全结果从 13.33% 降到 0%。同一套方法包在 Codex、Claude Code、OpenCode、Kimi 和 DeepSeek Harness 上通用，DSH 有专门的接入文档。"
    },
    "highlights": {
      "en": [
        "Aligns with the project's real baseline — owners, contracts, boundaries — before any edit, so there is less rework and less blind trust",
        "Completion claims arrive with fresh verification evidence, covered scope and residual risk — evidence, not vibes",
        "Frozen held-out A/B benchmark: contract pass 61.67% → 93.33%, unsafe outcomes 13.33% → 0% (bounded advisory evidence)",
        "Simple tasks stay simple; ceremony appears only when needed. One pack spans DSH, Codex, Claude Code, OpenCode and Kimi"
      ],
      "ja": [
        "編集前にプロジェクトの実ベースライン（所有者・契約・境界）と整合、手戻りも盲信も減る",
        "完了の主張には新鮮な検証証拠・カバー範囲・残存リスクが付随——雰囲気ではなく証拠を読む",
        "凍結 hold-out A/B ベンチ：契約合格率 61.67%→93.33%、危険な結果 13.33%→0%（限定的な参考証拠）",
        "簡単なタスクは簡単なまま、儀式は必要なときだけ。1 つのパックで DSH / Codex / Claude Code / OpenCode / Kimi に対応"
      ],
      "ko": [
        "수정 전에 프로젝트의 실제 기준선(소유자·계약·경계)과 정렬 — 재작업도 맹신도 줄어든다",
        "완료 주장에는 신선한 검증 증거·커버 범위·잔여 위험이 함께 — 분위기가 아니라 증거를 읽는다",
        "동결 hold-out A/B 벤치마크: 계약 통과율 61.67%→93.33%, 위험한 결과 13.33%→0% (제한적 참고 증거)",
        "쉬운 작업은 쉽게, 절차는 필요할 때만. 하나의 팩으로 DSH / Codex / Claude Code / OpenCode / Kimi 대응"
      ],
      "zh": [
        "改代码前先对齐项目真实基线（归属、契约、边界），少返工也少盲信",
        "完工声明必须附新鲜验证证据、覆盖范围与残留风险——你读证据，不读感觉",
        "冻结留出 A/B 基准：契约通过率 61.67%→93.33%，不安全结果 13.33%→0%（有界限的参考性证据）",
        "简单任务保持简单，仪式只在任务真需要时出现；一套方法包通吃 DSH / Codex / Claude Code / OpenCode / Kimi"
      ]
    }
  },
  "JingbiaoMei/Tokdash": {
    "intro": {
      "en": "Tokdash answers \"how much did I actually burn this month\", and does it entirely locally. DSH has been supported since day one — tokens, cost and sessions are read straight from `~/.dsh`, with nothing to configure. Exact token counts break down into input, output and cache. The contribution calendar offers both a 2D heatmap and a 3D isometric view, switchable between tokens, cost and message-count metrics. A session explorer supports per-session drill-down. The Quota tab shows subscription window bars with reset countdowns for Codex, Claude Code and Antigravity — Codex windows work out of the box from local logs, while Codex reset credits, metered features and all Claude/Antigravity quota need opt-in live polling. A statusline integration drops a live token-usage indicator into Claude Code's statusline, or any agent that can hit a local HTTP endpoint. Multi-server views let you add WSL, macOS and other Tokdash servers in Settings and combine usage across any selection while keeping quota grouped by machine. There's also a companion status bar app for the macOS menu bar and Windows notification area (unsigned preview) so you can see today's spend and subscription quota without keeping the dashboard open. On performance, cold usage scans run about 30× faster than pre-0.6.0 and about 15× faster than ccusage in the same local benchmark. The UI ships 10 themes, light/dark mode and PWA install support.",
      "ja": "Tokdash が答えるのは「今月いくら燃やしたのか」という問いで、それをすべてローカルで行う。DSH は初日から対応済み——token・コスト・セッションは `~/.dsh` から直接ローカルに読み取られ、設定は何も要らない。正確な token 数は入力・出力・キャッシュに分解される。コントリビューションカレンダーは 2D ヒートマップと 3D アイソメトリック表示の両方を提供し、token 数・コスト・メッセージ数の指標を切り替えられる。セッションエクスプローラーはセッション単位のドリルダウンに対応する。Quota タブには Codex・Claude Code・Antigravity のサブスクリプションウィンドウのバーとリセットカウントダウンが表示される。Codex のウィンドウはローカルログからそのまま動作するが、Codex のリセットクレジット、従量課金機能、Claude / Antigravity の枠にはオプトインのライブポーリングが必要だ。ステータスライン統合により、ライブの token 使用インジケータを Claude Code のステータスラインや、ローカル HTTP エンドポイントを叩ける任意の Agent に置ける。マルチサーバービューでは設定から WSL・macOS など他の Tokdash サーバーを追加し、任意の組み合わせで使用量を合算しつつ、枠はマシンごとにグループ化したまま表示できる。さらに macOS のメニューバーと Windows の通知領域向けのコンパニオンアプリ（未署名プレビュー）があり、ダッシュボードを開きっぱなしにしなくても今日の支出とサブスク枠を確認できる。性能面では、コールドの使用量スキャンが 0.6.0 以前と比べて約 30 倍、同じローカルベンチマークで ccusage と比べて約 15 倍速い。UI には 10 種類のテーマ、ライト/ダークモード、PWA インストール対応が含まれる。",
      "ko": "Tokdash가 답하는 질문은 '이번 달에 실제로 얼마나 썼나'이고, 그것을 전부 로컬에서 처리한다. DSH는 첫날부터 지원됐다 — 토큰과 비용, 세션을 `~/.dsh`에서 직접 로컬로 읽으며 설정할 것이 없다. 정확한 토큰 수는 입력·출력·캐시로 분해된다. 기여 캘린더는 2D 히트맵과 3D 아이소메트릭 뷰를 모두 제공하고 토큰 수·비용·메시지 수 지표를 전환할 수 있다. 세션 탐색기는 세션별 드릴다운을 지원한다. 할당량 탭에는 Codex, Claude Code, Antigravity의 구독 창 막대와 리셋 카운트다운이 표시된다. Codex 창은 로컬 로그에서 바로 동작하지만, Codex의 리셋 크레딧과 종량 기능, Claude·Antigravity의 할당량은 라이브 폴링을 직접 켜야 한다. 스테이터스라인 통합으로 실시간 토큰 사용량 표시기를 Claude Code의 스테이터스라인이나 로컬 HTTP 엔드포인트를 호출할 수 있는 임의의 에이전트에 넣을 수 있다. 멀티 서버 뷰에서는 설정에서 WSL, macOS 등 다른 Tokdash 서버를 추가해 원하는 조합의 사용량을 합산해 보면서 할당량은 머신별로 묶어 둘 수 있다. macOS 메뉴 막대와 Windows 알림 영역용 동반 앱(미서명 프리뷰)도 있어 대시보드를 계속 열어 두지 않아도 오늘 지출과 구독 할당량을 볼 수 있다. 성능 면에서 콜드 사용량 스캔이 0.6.0 이전보다 약 30배, 같은 로컬 벤치마크에서 ccusage보다 약 15배 빠르다. UI에는 10가지 테마와 라이트·다크 모드, PWA 설치 지원이 들어 있다.",
      "zh": "Tokdash 解决的是「这个月到底烧了多少」这个问题，而且完全在本地跑。DSH 从第一天就被支持——token、成本和会话直接从 `~/.dsh` 本地读取，不用配置任何东西。功能上：精确的 token 计数会拆成输入、输出和缓存三块；贡献日历提供 2D 热力图和 3D 等距视图两种呈现，可以按 token 数、成本或消息数切换指标；会话浏览器支持逐会话下钻；额度标签页会显示 Codex、Claude Code 和 Antigravity 的订阅窗口条与重置倒计时，其中 Codex 的窗口直接从本地日志算出开箱即用，Codex 的重置额度、计量功能和 Claude / Antigravity 的额度需要主动开启实时轮询。还有一个状态栏集成，可以把实时 token 用量指示器放进 Claude Code 的状态栏，或任何能访问本地 HTTP 端点的 Agent。多服务器视图允许在设置里加入 WSL、macOS 等其他 Tokdash 服务端，把任意组合的用量合并查看，同时额度仍按机器分组。另有 macOS 菜单栏与 Windows 通知区的伴侣应用（未签名预览版），不用一直开着仪表盘也能看今天花了多少和订阅额度。性能方面，冷启动用量扫描比 0.6.0 之前快约 30 倍，在同一本地基准下比 ccusage 快约 15 倍。界面有 10 套主题、明暗模式和 PWA 安装支持。"
    },
    "highlights": {
      "en": [
        "Day-one DSH support: tokens, cost and sessions read locally from `~/.dsh` with zero configuration",
        "Exact input/output/cache token breakdowns, plus a contribution calendar in 2D heatmap and 3D isometric views across tokens, cost or messages",
        "Quota tab with subscription window bars and reset countdowns; statusline integration feeds live usage into Claude Code or any local HTTP consumer",
        "Multi-server views combine usage across WSL, macOS and other instances while grouping quota per machine; cold scans about 30× faster than pre-0.6.0"
      ],
      "ja": [
        "DSH は初日から対応：token・コスト・セッションを `~/.dsh` からローカル読み取り、設定不要",
        "入力/出力/キャッシュに分けた正確な token 数と、2D ヒートマップ + 3D アイソメトリックのコントリビューションカレンダー（token / コスト / メッセージ数で切替）",
        "Quota タブにサブスクウィンドウのバーとリセットカウントダウン。ステータスライン統合でライブ使用量を Claude Code や任意のローカル HTTP 利用側へ",
        "マルチサーバービューで WSL / macOS などの使用量を合算（枠はマシン別にグループ化）。コールドスキャンは 0.6.0 以前の約 30 倍速"
      ],
      "ko": [
        "DSH 첫날 지원: 토큰·비용·세션을 `~/.dsh`에서 로컬로 읽고 설정 불필요",
        "입력/출력/캐시로 나눈 정확한 토큰 수와 2D 히트맵 + 3D 아이소메트릭 기여 캘린더(토큰 / 비용 / 메시지 수 전환)",
        "할당량 탭의 구독 창 막대와 리셋 카운트다운. 스테이터스라인 통합으로 실시간 사용량을 Claude Code나 임의의 로컬 HTTP 소비자에게 전달",
        "멀티 서버 뷰로 WSL / macOS 등 사용량 합산(할당량은 머신별 그룹). 콜드 스캔은 0.6.0 이전 대비 약 30배 빠름"
      ],
      "zh": [
        "DSH 首日支持：token、成本与会话从 `~/.dsh` 本地读取，零配置",
        "精确 token 拆分（输入/输出/缓存）+ 贡献日历 2D 热力图与 3D 等距视图，可切 token / 成本 / 消息数",
        "额度标签页显示订阅窗口条与重置倒计时；状态栏集成可把实时用量塞进 Claude Code 状态栏或任意本地 HTTP 端点",
        "多服务器视图合并 WSL / macOS 等实例用量（额度仍按机器分组）；冷扫描比 0.6.0 前快约 30 倍"
      ]
    }
  },
  "LaplaceYoung/oh-my-dsh": {
    "intro": {
      "en": "DSH is a pluggable agent harness, while opencode, oh-my-pi, Codex CLI, Claude Code, pi, Goose, Aider, LangGraph and PyRIT have each accumulated mature capabilities in orchestration, memory, approvals, evaluation, safety guardrails, automation and developer experience. This project does something direct: go through those tools one by one, find the capabilities that would help DSH users, rewrite them as plugins adapted to DSH's seams and conventions, and assemble a directly installable capability library. The workflow is an explicit pipeline: research (compare against open-source harnesses to find capabilities worth borrowing) → register the gap (entries in `GAP-LEDGER.md` and under `swarm/ledger/`, moving through the state machine `open → designing → implementing → verifying → closed`) → design the plugin (following DSH's three-part capability seam: interface / implementation / consumer) → implement with vitest tests → e2e verification (mounted into a real DSH environment for registration checks and a real-LLM smoke test). Plugin discipline is stated firmly: registration is a side effect, done through `ctx.effect()` / `ctx.on()` returning a disposer; the three-part capability seam must be complete; explicit beats implicit; configuration is adjustable rather than hardcoded; and modifying `agent-loop` is forbidden. Verification standards are just as explicit: every plugin's vitest unit tests green with zero typecheck errors, and an e2e environment that mounts all plugins for registration validation and a real-LLM smoke test.",
      "ja": "DSH はプラグイン化された agent harness であり、一方 opencode・oh-my-pi・Codex CLI・Claude Code・pi・Goose・Aider・LangGraph・PyRIT はそれぞれ、オーケストレーション、記憶、承認、評価、安全ガードレール、自動化、開発者体験の分野で成熟した能力を蓄えてきた。このプロジェクトがやることは率直だ。これらのツールを一項目ずつ突き合わせ、DSH ユーザーに有用な能力を見つけ、DSH の接ぎ目と規約に適合させたプラグインとして書き直し、そのまま導入できる能力ライブラリにまとめる。ワークフローは明示的なパイプラインになっている。調査（オープンソースの harness と照らして借用に値する能力を探す）→ ギャップの登記（`GAP-LEDGER.md` と `swarm/ledger/` 配下のエントリ。状態機械は `open → designing → implementing → verifying → closed`）→ プラグイン設計（DSH の能力接ぎ目 3 点セット：interface / implementation / consumer に従う）→ 実装と vitest テスト → e2e 検証（実際の DSH 環境にマウントして登録検証と実 LLM のスモークテスト）。プラグインの規律は厳格に定められている。登録は副作用であり `ctx.effect()` / `ctx.on()` が disposer を返す形で行う。能力接ぎ目 3 点セットは揃っていること。暗黙より明示。設定は調整可能でハードコードしない。`agent-loop` の改変は禁止。検証基準も同様に明確で、各プラグインの vitest 単体テストが全て緑で typecheck エラーゼロ、e2e 環境は全プラグインをマウントして登録検証と実 LLM スモークを行う。",
      "ko": "DSH는 플러그인화된 에이전트 하네스이고, opencode·oh-my-pi·Codex CLI·Claude Code·pi·Goose·Aider·LangGraph·PyRIT는 각각 오케스트레이션, 기억, 승인, 평가, 안전 가드레일, 자동화, 개발자 경험 분야에서 성숙한 능력을 쌓아 왔다. 이 프로젝트가 하는 일은 단순명료하다. 그 도구들을 하나씩 대조해 DSH 사용자에게 유용한 능력을 찾고, DSH의 이음매와 관례에 맞춘 플러그인으로 다시 써서 바로 설치할 수 있는 능력 라이브러리로 만든다. 워크플로는 명시적인 파이프라인이다. 조사(오픈소스 하네스와 대조해 빌려올 만한 능력 찾기) → 격차 등재(`GAP-LEDGER.md`와 `swarm/ledger/` 아래 항목, 상태 기계는 `open → designing → implementing → verifying → closed`) → 플러그인 설계(DSH 능력 이음매 3종 세트: interface / implementation / consumer 준수) → 구현과 vitest 테스트 → e2e 검증(실제 DSH 환경에 마운트해 등록 검증과 실제 LLM 스모크 테스트). 플러그인 규율은 단호하게 정해져 있다. 등록은 부수효과이며 `ctx.effect()` / `ctx.on()`이 disposer를 반환하는 형태로 한다. 능력 이음매 3종 세트를 갖출 것. 암묵보다 명시. 설정은 조정 가능해야 하고 하드코딩하지 않는다. `agent-loop` 수정 금지. 검증 기준도 마찬가지로 명확해서, 플러그인마다 vitest 단위 테스트 전부 통과에 typecheck 오류 0, e2e 환경은 모든 플러그인을 마운트해 등록 검증과 실제 LLM 스모크를 돌린다.",
      "zh": "DSH 是一个插件化的 agent harness，而 opencode、oh-my-pi、Codex CLI、Claude Code、pi、Goose、Aider、LangGraph、PyRIT 这些工具各自在编排、记忆、审批、评估、安全护栏、自动化和开发者体验上已经积累了成熟能力。这个项目做的事情很直接：逐项对照这些工具，找出对 DSH 用户有用的能力，用插件形态重写并适配 DSH 的接缝与约定，形成一个可以直接安装的能力库。工作流是一条明确的流水线：调研（对照开源 harness 找可借鉴的能力）→ 登记差距（`GAP-LEDGER.md` 与 `swarm/ledger/` 下的条目，状态机走 `open → designing → implementing → verifying → closed`）→ 设计插件（遵循 DSH 能力接缝三件套：interface / implementation / consumer）→ 实现加 vitest 测试 → e2e 验证（挂载进真实 DSH 环境做注册校验并跑真实 LLM 冒烟）。插件纪律写得很死：注册必须是副作用，通过 `ctx.effect()` / `ctx.on()` 返回 disposer；能力接缝三件套齐全；显式优于隐式；配置可调不硬编码；禁止改 `agent-loop`。验证标准同样明确：每个插件 vitest 单测全绿、typecheck 零错误，e2e 环境挂载全部插件做注册校验与真实 LLM 冒烟。"
    },
    "highlights": {
      "en": [
        "Works through opencode, oh-my-pi, Codex CLI, Claude Code, Goose, Aider and LangGraph, rewriting mature capabilities as DSH plugins",
        "A gap ledger (`GAP-LEDGER.md`) driven by an `open → designing → implementing → verifying → closed` state machine, each entry citing evidence from the compared project",
        "Plugin discipline: register only through extension seams such as `ctx.effect()` / `ctx.on()` / `ctx.tools`, returning disposers; never touch `agent-loop` or add hot-path overhead",
        "Verification bar: green vitest unit tests plus zero typecheck errors, with e2e mounting every plugin for registration validation and a real-LLM smoke test"
      ],
      "ja": [
        "opencode / oh-my-pi / Codex CLI / Claude Code / Goose / Aider / LangGraph などと突き合わせ、成熟した能力を DSH プラグインとして書き直す",
        "ギャップ総勘定 `GAP-LEDGER.md` は `open → designing → implementing → verifying → closed` の状態機械で進み、各項目に対照プロジェクトの証拠が付く",
        "プラグイン規律：`ctx.effect()` / `ctx.on()` / `ctx.tools` などの拡張接ぎ目経由でのみ登録し disposer を返す。`agent-loop` 改変禁止、ホットパスへの負荷なし",
        "検証基準：vitest 単体テスト全緑 + typecheck エラーゼロ、e2e で全プラグインをマウントして登録検証と実 LLM スモーク"
      ],
      "ko": [
        "opencode / oh-my-pi / Codex CLI / Claude Code / Goose / Aider / LangGraph 등과 대조해 성숙한 능력을 DSH 플러그인으로 재작성",
        "격차 원장 `GAP-LEDGER.md`는 `open → designing → implementing → verifying → closed` 상태 기계로 진행되며 항목마다 대조 프로젝트 근거를 첨부",
        "플러그인 규율: `ctx.effect()` / `ctx.on()` / `ctx.tools` 같은 확장 이음매로만 등록하고 disposer 반환. `agent-loop` 수정 금지, 핫패스 부담 없음",
        "검증 기준: vitest 단위 테스트 전부 통과 + typecheck 오류 0, e2e에서 모든 플러그인을 마운트해 등록 검증과 실제 LLM 스모크"
      ],
      "zh": [
        "对照 opencode / oh-my-pi / Codex CLI / Claude Code / Goose / Aider / LangGraph 等，把成熟能力重写为 DSH 插件",
        "差距总账 `GAP-LEDGER.md` 走 `open → designing → implementing → verifying → closed` 状态机，每条附对照项目证据",
        "插件纪律：只通过 `ctx.effect()` / `ctx.on()` / `ctx.tools` 等扩展接缝注册并返回 disposer，禁改 `agent-loop`、不引入热路径开销",
        "验证标准：vitest 单测全绿 + typecheck 零错误，e2e 挂载全部插件做注册校验与真实 LLM 冒烟"
      ]
    }
  },
  "Lum1104/dsh-browser": {
    "intro": {
      "en": "Rather than spawning a clean browser instance, it drives the tab you are already signed into — so login state, session and cookies come along, skipping the most annoying part of browser automation. The whole integration is text-only: pages become structured text with a numbered inventory of interactive elements that the model addresses by number, and screenshots never enter the model-facing pipeline. The security boundary is concrete: bridge handshakes are authenticated, privileged gateway methods reject non-loopback callers, and the extension only operates the active tab. Engineering-wise it is one standalone pnpm workspace pinned to a publicly released @deepseek-ai/dsh version, requiring neither a Harness source checkout nor npm credentials.",
      "ja": "まっさらなブラウザインスタンスを立ち上げるのではなく、すでにログイン済みのタブをそのまま操作します。ログイン状態・セッション・cookie がそのまま使えるため、ブラウザ自動化で最も面倒な部分を省けます。統合はテキスト専用です：ページは構造化テキストに変換され、操作可能な要素は番号付きの一覧になり、モデルは番号で指定して操作します。スクリーンショットがモデル向けのパイプラインに入ることはありません。セキュリティ境界も具体的です：ブリッジのハンドシェイクは認証され、特権ゲートウェイメソッドは loopback 以外の呼び出し元を拒否し、拡張機能はアクティブタブのみを操作します。実装は独立した pnpm workspace で、公開リリース版の @deepseek-ai/dsh をピン留めしており、Harness のソースチェックアウトも npm 資格情報も不要です。",
      "ko": "깨끗한 브라우저 인스턴스를 새로 띄우는 대신 이미 로그인해 둔 탭을 그대로 다룹니다. 덕분에 로그인 상태와 세션, 쿠키가 그대로 따라와 브라우저 자동화에서 가장 성가신 단계를 건너뜁니다. 통합은 전부 텍스트 기반입니다: 페이지는 구조화된 텍스트로 바뀌고 상호작용 요소는 번호가 매겨진 목록이 되며, 모델은 번호로 지정해 조작합니다. 스크린샷은 모델을 향한 파이프라인에 절대 들어가지 않습니다. 보안 경계도 구체적입니다: 브리지 핸드셰이크는 인증을 거치고, 특권 게이트웨이 메서드는 loopback이 아닌 호출자를 거부하며, 확장은 활성 탭만 조작합니다. 구현은 독립된 pnpm workspace로 공개 배포된 @deepseek-ai/dsh 버전을 고정해 두어 Harness 소스 체크아웃도 npm 자격 증명도 필요 없습니다.",
      "zh": "它不另开一个干净的浏览器实例，而是接管你已经登录好的那个标签页——所以登录态、会话和 cookie 都在，省掉了自动化浏览器最烦的那一步。整套集成是纯文本的：页面被转成结构化文本，可交互元素编号成一份清单，模型按编号来操作，截图始终不进入面向模型的管线。安全边界写得比较实：桥接握手需要认证，特权网关方法拒绝非 loopback 调用方，扩展只操作当前活动标签页。工程上是一个独立的 pnpm workspace，钉死了公开发布的 @deepseek-ai/dsh 版本，不需要 Harness 源码 checkout，也不需要 npm 凭据。"
    },
    "highlights": {
      "en": [
        "Drives the tab you are already signed into, preserving login state, session and cookies",
        "Text-only pipeline: structured page text plus a numbered inventory of controls; screenshots never reach the model",
        "Authenticated bridge handshakes, privileged methods reject non-loopback callers, extension touches only the active tab; one install.sh sets up plugin and extension"
      ],
      "ja": [
        "ログイン済みのタブをそのまま操作。ログイン状態・セッション・cookie を保持",
        "テキスト専用パイプライン：構造化ページテキストと番号付きコントロール一覧。スクリーンショットはモデルに渡らない",
        "ブリッジは認証付きハンドシェイク、特権メソッドは非 loopback を拒否、拡張はアクティブタブのみ。install.sh 一本でプラグインと拡張を導入"
      ],
      "ko": [
        "이미 로그인된 탭을 그대로 조작해 로그인 상태·세션·쿠키 유지",
        "텍스트 전용 파이프라인: 구조화된 페이지 텍스트와 번호 매긴 컨트롤 목록, 스크린샷은 모델에 전달되지 않음",
        "브리지 핸드셰이크 인증, 특권 메서드는 비 loopback 거부, 확장은 활성 탭만 접근. install.sh 한 줄로 플러그인과 확장 설치"
      ],
      "zh": [
        "接管你已登录的标签页，登录态、会话与 cookie 全部保留",
        "纯文本管线：页面转结构化文本 + 可交互元素编号清单，截图不进模型管线",
        "桥接握手需认证、特权方法拒绝非 loopback、扩展只碰活动标签页；一条 install.sh 装好插件与扩展"
      ]
    },
    "installCmd": "# 一条命令装桥接插件 + Chrome 扩展（装进 ~/.dsh/dsh-browser 并注册进 web profile）\ncurl -fsSL https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.sh | bash\n# 装完按提示在 chrome://extensions 开启开发者模式加载扩展，然后：\ncd ~/.dsh/dsh-browser && pnpm start"
  },
  "Nagi-ovo/dsh-ads": {
    "intro": {
      "en": "It stuffs a full set of fictional ads into the sidebar, the conversation, the middle of inference, and the bottom-right corner. Inference appears to pause, but the model keeps working in the background — later answers and tool calls simply wait for the ad to finish. Behind the joke sits one serious design decision: the plugin does not only make fun of itself. Public plugins carrying the dsh-plugin topic and updated within the last two weeks rotate through the recommendation slots, clicking an ad opens the real repository, and repos remain discoverable after moving to a personal account or another organisation. Two asset sets swap instantly with DSH's Settings → Language with no refresh — Chinese mode leans on browser games and fortune gods, English mode on fake antivirus and weird tricks. Every slot can be switched off individually under Settings → Ads (unofficial), and the choice persists across restarts. The author states the plugin does not scan, read or modify files on your machine.",
      "ja": "サイドバー、会話、推論の途中、右下——架空の広告一式を詰め込みます。inference が止まったように見えますが、実際にはモデルは裏で動き続けており、後続の回答やツール呼び出しが広告終了まで表示を待つだけです。ネタの裏に一つ真面目な設計があります：このプラグインは自分だけをネタにしません。GitHub で dsh-plugin topic を持ち、直近 2 週間に更新された公開プラグインが推薦枠を巡回し、広告をクリックすると実在のリポジトリが開きます。個人アカウントや別組織に移管された後も発見され続けます。素材は DSH の「設定 → 言語」に追従して即座に切り替わり、リロードは不要です——中国語モードはブラウザゲームと財神、English mode は fake antivirus と weird tricks。各広告枠は「設定 → 広告（非公式）」で個別にオフにでき、選択は次回起動まで保持されます。作者は、このプラグインがマシン上のファイルをスキャン・読み取り・変更しないと明言しています。",
      "ko": "사이드바, 대화, 추론 도중, 우하단에 가상의 광고 한 세트를 밀어 넣습니다. inference가 멈춘 것처럼 보이지만 실제로 모델은 뒤에서 계속 돌아가고 있고, 이후 답변과 도구 호출이 광고가 끝날 때까지 표시를 기다릴 뿐입니다. 장난 뒤에 진지한 설계가 하나 있습니다: 이 플러그인은 자기만 소재로 삼지 않습니다. GitHub에서 dsh-plugin topic을 달고 최근 2주 안에 갱신된 공개 플러그인이 추천 자리를 순회하며, 광고를 클릭하면 실제 저장소가 열리고, 개인 계정이나 다른 조직으로 옮겨간 뒤에도 계속 발견됩니다. 소재는 DSH의 「설정 → 언어」를 따라 새로고침 없이 즉시 바뀝니다——중국어 모드는 브라우저 게임과 재물신, English mode는 fake antivirus와 weird tricks. 각 광고 자리는 「설정 → 광고(비공식)」에서 개별로 끌 수 있고 선택은 다음 실행까지 유지됩니다. 작성자는 이 플러그인이 기기의 파일을 스캔·읽기·수정하지 않는다고 명시합니다.",
      "zh": "侧栏、对话、推理中途和右下角，塞进一整套虚构广告。它看起来会暂停 inference，其实模型一直在后台跑，只是后续回答和工具调用要等广告结束才显示。整活之外有个正经设计：插件不只拿自己开涮，GitHub 上带 dsh-plugin topic、最近两周更新过的公开插件会进入推荐位，点击广告打开的是真实仓库，仓库转到个人账号或别的组织后仍能被发现。两套素材跟着 DSH 的「设置 → 语言」即时切换、不用刷新——中文主打页游、财神和「这次一定」，English mode 是 fake antivirus 和 weird tricks。每个广告位都能在「设置 → 广告（非官方）」里单独关掉，选择保留到下次启动。作者声明插件不扫描、不读取、不修改机器上的文件。"
    },
    "highlights": {
      "en": [
        "The recommendation slots are real: public plugins with the dsh-plugin topic updated within two weeks, each ad linking to the actual repo",
        "Two flavours of internet-junk aesthetics, swapping instantly with the DSH language setting, no refresh needed",
        "Every ad slot toggles off individually; build output is committed, so one git-source command installs it"
      ],
      "ja": [
        "推薦枠は本物：dsh-plugin topic 付きで 2 週間以内に更新された公開プラグインが巡回し、広告先は実在リポジトリ",
        "中英 2 種のインターネット・ジャンク美学が DSH の言語設定に追従して即時切替、リロード不要",
        "各広告枠を個別にオフ可能。ビルド成果物はコミット済みで git ソース一行で導入"
      ],
      "ko": [
        "추천 자리는 진짜: dsh-plugin topic이 달리고 2주 내 갱신된 공개 플러그인이 순회, 광고는 실제 저장소로 연결",
        "중·영 두 가지 인터넷 잡동사니 미학이 DSH 언어 설정을 따라 즉시 전환, 새로고침 불필요",
        "광고 자리마다 개별 차단 가능. 빌드 산출물이 커밋되어 git 소스 한 줄로 설치"
      ],
      "zh": [
        "推荐位是真的：带 dsh-plugin topic 且两周内更新过的公开插件轮播，点开是真实仓库",
        "中英两套互联网垃圾美学，跟随 DSH 语言设置即时切换，不用刷新",
        "每个广告位可单独关闭；构建产物已入库，git 源一行装完"
      ]
    }
  },
  "Nagi-ovo/dsh-find-plugins": {
    "intro": {
      "en": "Finding plugins normally means browsing the GitHub topic page yourself; this skill hands the job to DSH instead. Say \"is there a plugin that can visualize data and flows\" and it runs its bundled script to fetch every public, non-archived, non-fork `dsh-plugin` repository, narrows to the handful that actually match, explains how they differ, and waits for your call before installing anything. During install it reads the README, `package.json` and repository files to decide whether the repo should be installed as an official bundle, a Cordis plugin or a skill, then verifies the result. When lifecycle scripts or suspicious extra writes are involved, it stops and asks rather than proceeding on its own. The catalog is the GitHub topic itself, so it makes no difference whether a repo belongs to a person or an organization, and repositories stay discoverable after a transfer; `dsh-external/hub` supplements categories and install information when it is reachable. To install, just send DSH a message asking it to install the dsh-find-plugins skill from the repository — or copy the whole `skills/find-plugins/` directory into `~/.dsh/skills/`, where the directory watcher picks it up immediately.",
      "ja": "プラグイン探しは本来 GitHub の topic ページを自分でめくる作業だが、この Skill はそれを DSH に任せる。「データとフローを可視化できるプラグインある？」と言えば、同梱スクリプトを走らせて公開・非アーカイブ・非 fork の `dsh-plugin` リポジトリをすべて取得し、本当に合致する少数の候補に絞り、互いの違いを説明したうえで、あなたが決めるまでインストールはしない。導入時は README・`package.json`・リポジトリのファイルを読み、公式 bundle・Cordis プラグイン・skill のどれとして入れるべきかを自分で判断し、完了後に検証する。lifecycle スクリプトや不審な追加書き込みが絡む場合は、勝手に進めず手を止めて確認を求める。カタログは GitHub topic そのものなので、リポジトリが個人所有か組織所有かは関係なく、リポジトリを移管しても発見され続ける。`dsh-external/hub` はアクセス可能なときに分類とインストール情報を補完する。導入はリポジトリから dsh-find-plugins skill を入れてほしいと DSH に伝えるだけ。手動なら `skills/find-plugins/` ディレクトリごと `~/.dsh/skills/` にコピーすれば、ディレクトリ watcher が即座に反映する。",
      "ko": "플러그인 찾기는 원래 GitHub topic 페이지를 직접 넘겨야 하는 일이지만, 이 Skill은 그 일을 DSH에 맡긴다. \"데이터와 흐름을 시각화하는 플러그인 있어?\"라고 말하면 내장 스크립트를 돌려 공개·비보관·비포크 `dsh-plugin` 저장소를 모두 가져오고, 실제로 맞는 소수의 후보로 좁힌 뒤 서로의 차이를 설명하고, 사용자가 결정할 때까지 아무것도 설치하지 않는다. 설치할 때는 README와 `package.json`, 저장소 파일을 읽어 공식 bundle인지 Cordis 플러그인인지 skill인지 스스로 판단하고 완료 후 검증한다. lifecycle 스크립트나 수상한 추가 쓰기가 얽히면 알아서 진행하지 않고 멈춰 확인을 요청한다. 목록의 기준은 GitHub topic 자체라서 저장소가 개인 소유인지 조직 소유인지는 상관없고, 저장소를 옮겨도 계속 발견된다. `dsh-external/hub`는 접근 가능할 때 분류와 설치 정보를 보완해 준다. 설치는 저장소에서 dsh-find-plugins skill을 설치해 달라고 DSH에 말하면 되고, 수동으로는 `skills/find-plugins/` 디렉터리를 통째로 `~/.dsh/skills/`에 복사하면 디렉터리 watcher가 즉시 반영한다.",
      "zh": "找插件这件事本来要自己开 GitHub topic 页翻，这个 Skill 把它交给 DSH：你只要说「有没有插件能把数据和流程画出来」，它就跑自带脚本拉取所有公开、未归档、非 fork 的 `dsh-plugin` 仓库，挑出最匹配的少数候选，讲清楚彼此差别，等你拍板之后再动手装。装的时候它会读 README、`package.json` 和仓库文件，自己判断这个仓库该按官方 bundle、Cordis 插件还是 skill 来装，装完还会验证。涉及 lifecycle scripts 或者可疑的额外写入时，它会停下来让你确认，不会自作主张。目录以 GitHub topic 为准，所以仓库属于个人还是组织都不影响，转移仓库之后仍然能被发现；`dsh-external/hub` 在可访问时会补充分类和安装信息作为辅助。安装只要把这句话发给 DSH：请从仓库地址安装 dsh-find-plugins skill；手动装则把 `skills/find-plugins/` 整个目录复制到 `~/.dsh/skills/`，目录 watcher 会让它立即生效。"
    },
    "highlights": {
      "en": [
        "One plain-language question searches the entire GitHub `dsh-plugin` topic, checking only the closest candidates and explaining the differences",
        "Reads README, `package.json` and repo files to decide between bundle, Cordis plugin and skill installs, then verifies",
        "Stops for your confirmation whenever lifecycle scripts or suspicious extra writes are involved",
        "Copy into `~/.dsh/skills/` and the watcher makes it live instantly; project-level or `~/.agents/skills/` also work for sharing with other agents"
      ],
      "ja": [
        "自然言語ひとことで GitHub 全体の `dsh-plugin` topic を検索、最も合致する少数だけを見て違いを説明",
        "README / `package.json` / リポジトリ構成を読んで bundle・Cordis プラグイン・skill を自動判別し、導入後に検証",
        "lifecycle スクリプトや不審な追加書き込みが絡むときは手を止めて確認、勝手に実行しない",
        "`~/.dsh/skills/` にコピーで即時反映。プロジェクト単位や `~/.agents/skills/` に置いて他 Agent と共用も可能"
      ],
      "ko": [
        "자연어 한마디로 GitHub 전체 `dsh-plugin` topic 검색, 가장 잘 맞는 소수만 확인하고 차이를 설명",
        "README / `package.json` / 저장소 구성을 읽고 bundle·Cordis 플러그인·skill을 자동 판별해 설치 후 검증",
        "lifecycle 스크립트나 수상한 추가 쓰기가 관련되면 멈추고 확인 요청 — 임의로 실행하지 않는다",
        "`~/.dsh/skills/`에 복사하면 즉시 적용. 프로젝트 단위나 `~/.agents/skills/`에 두어 다른 에이전트와 공유도 가능"
      ],
      "zh": [
        "一句自然语言检索全 GitHub `dsh-plugin` topic，只看最匹配的少量候选并解释差别",
        "读 README / `package.json` / 仓库文件自行判断按 bundle、Cordis 插件还是 skill 安装，装完验证",
        "涉及 lifecycle scripts 或可疑额外写入时停下来等你确认，不擅自执行",
        "复制到 `~/.dsh/skills/` 即时生效；也可放项目级或 `~/.agents/skills/` 与其他 Agent 共用"
      ]
    }
  },
  "Nagi-ovo/dsh-visualize": {
    "intro": {
      "en": "The model writes an HTML fragment, then calls visualize(path, title?, mode?), and the card appears in the conversation stream. You can simply ask for \"an adjustable visualization of a sorting algorithm\" and let it handle the rest; side-by-side comparisons use mode: \"wide\". Cards follow the DSH light or dark theme and whale-blue palette, and session replay restores them from the persistent tool result, so the original fragment file does not need to stay on disk. The security boundary is stated plainly: each card runs in a sandboxed iframe with an opaque origin and cannot reach the host page, its CSP blocks network requests, nested pages and form submissions while allowing static assets from a fixed set of CDNs, and fragments are capped at 1000000 bytes by default. The limits are equally plain — interactive cards render only in the Web UI, while TUI and headless clients show the standard tool result.",
      "ja": "モデルが HTML 断片を書き、visualize(path, title?, mode?) を呼ぶと、カードが会話の流れの中に現れます。「パラメータを調整できるソートアルゴリズムの可視化を作って」と言うだけでよく、並列比較には mode: \"wide\" を使います。カードは DSH のライト／ダークテーマとホエールブルーの配色に従い、セッション再生時は永続化されたツール結果から復元されるため、元の断片ファイルをディスクに残す必要はありません。セキュリティ境界も明記されています：各カードは opaque origin のサンドボックス iframe 内で動作しホストページに触れられず、CSP がネットワークリクエスト・入れ子ページ・フォーム送信を遮断しつつ固定された CDN の静的アセットのみ許可し、断片は既定で 1000000 バイトに制限されます。制約も明快で、インタラクティブカードは現状 Web UI でのみ描画され、TUI と headless クライアントは標準のツール結果を表示します。",
      "ko": "모델이 HTML 조각을 작성한 뒤 visualize(path, title?, mode?)를 호출하면 카드가 대화 흐름 안에 나타납니다. 「파라미터를 조절할 수 있는 정렬 알고리즘 시각화를 만들어줘」라고만 해도 되며, 나란히 비교할 때는 mode: \"wide\"를 씁니다. 카드는 DSH의 라이트·다크 테마와 웨일 블루 팔레트를 따르고, 세션 재생 시 영속화된 도구 결과에서 복원되므로 원본 조각 파일을 디스크에 남길 필요가 없습니다. 보안 경계도 분명합니다: 각 카드는 opaque origin의 샌드박스 iframe에서 실행되어 호스트 페이지에 접근할 수 없고, CSP가 네트워크 요청·중첩 페이지·폼 제출을 차단하면서 고정된 CDN의 정적 자산만 허용하며, 조각은 기본 1000000바이트로 제한됩니다. 한계 역시 분명해서 상호작용 카드는 현재 Web UI에서만 렌더링되고 TUI·headless 클라이언트는 표준 도구 결과를 표시합니다.",
      "zh": "模型写好一段 HTML 片段，再调用 visualize(path, title?, mode?)，卡片就出现在对话流里。你可以直接说「做一个可调参数的排序算法可视化」，剩下的交给它；并排对比用 mode: \"wide\"。卡片跟随 DSH 的明暗主题和鲸蓝配色，会话回放时从持久化的工具结果里恢复，所以原始片段文件不必留在磁盘上。安全边界写得很清楚：每张卡片跑在一个 opaque origin 的沙箱 iframe 里，碰不到宿主页面，CSP 拦掉网络请求、嵌套页面和表单提交，只放行固定几个 CDN 的静态资源，片段默认限制 1000000 字节。局限也说得明白——交互卡片目前只在 Web UI 渲染，TUI 和 headless 客户端显示的是标准工具结果。"
    },
    "highlights": {
      "en": [
        "The model calls visualize(path, title?, mode?) to render an interactive card in-conversation; mode: \"wide\" for side-by-side",
        "Sandboxed iframe with opaque origin; CSP blocks network requests and form submissions; 1000000-byte fragment cap",
        "Session replay restores cards from the persistent tool result; Web UI only, TUI/headless fall back to the standard result"
      ],
      "ja": [
        "モデルが visualize(path, title?, mode?) を呼ぶだけで会話内にインタラクティブカードを描画、並列比較は mode: \"wide\"",
        "opaque origin のサンドボックス iframe、CSP がネットワークとフォーム送信を遮断、断片は既定 1000000 バイト上限",
        "セッション再生は永続化ツール結果からカードを復元。Web UI 限定で TUI/headless は標準結果にフォールバック"
      ],
      "ko": [
        "모델이 visualize(path, title?, mode?)를 호출해 대화 내 상호작용 카드 렌더링, 나란히 비교는 mode: \"wide\"",
        "opaque origin 샌드박스 iframe, CSP가 네트워크 요청·폼 제출 차단, 조각 기본 1000000바이트 상한",
        "세션 재생은 영속 도구 결과에서 카드 복원. Web UI 전용이며 TUI/headless는 표준 결과로 폴백"
      ],
      "zh": [
        "模型调 visualize(path, title?, mode?) 即可在对话内渲染交互卡片，并排对比用 mode: \"wide\"",
        "沙箱 iframe + opaque origin，CSP 拦网络请求与表单提交，片段默认限 1000000 字节",
        "会话回放从持久化工具结果恢复卡片；仅 Web UI 渲染，TUI/headless 退回标准工具结果"
      ]
    }
  },
  "NanmiCoder/dsh-agent-teams": {
    "intro": {
      "en": "Once installed, saying something like \"use AgentTeams to research X\" in any session drives a full multi-agent team. The semantics are ported from Claude Code's AgentTeams as a four-step loop: create the team (the captain is the current session's agent), recruit members (resumable subagents), split tasks and declare dependencies between them, then let members exchange messages directly. That last step is the key design choice — messages go straight to a member's mailbox and wake them, with no relay through the captain, so the captain never becomes the bottleneck. Live team activity lives in a panel pinned to the top-right of the Web GUI, so you can see who is doing what.",
      "ja": "導入後は、どのセッションでも「AgentTeams で XX を調べて」と言うだけでマルチエージェントのチームが動きます。意味論は Claude Code の AgentTeams からの移植で、4 ステップの閉ループになっています：チーム作成（キャプテンは現在のセッションの agent）→ メンバー招集（会話を再開できるサブエージェント）→ タスク分割と依存関係の宣言 → メンバー間の直接メッセージング。最後のステップが設計上の要で、メッセージは相手のメールボックスへ直送されて相手を起こすため、キャプテンを経由せず、キャプテンがボトルネックになりません。チームのリアルタイム活動は Web GUI 右上の常駐パネルに表示され、誰が何をしているか把握できます。",
      "ko": "설치 후에는 어떤 세션에서든 「AgentTeams로 XX 좀 조사해줘」 한마디로 멀티에이전트 팀이 움직입니다. 의미론은 Claude Code의 AgentTeams에서 이식한 4단계 순환입니다: 팀 생성(캡틴은 현재 세션의 agent) → 멤버 모집(대화를 이어갈 수 있는 서브에이전트) → 작업 분할과 의존 관계 선언 → 멤버 간 직접 메시지 교환. 마지막 단계가 핵심 설계로, 메시지는 상대 메일박스로 직행해 상대를 깨우므로 캡틴을 거치지 않고, 따라서 캡틴이 병목이 되지 않습니다. 팀의 실시간 활동은 Web GUI 우상단 상주 패널에 표시되어 누가 무엇을 하는지 볼 수 있습니다.",
      "zh": "装上之后，任何会话里说一句「用 AgentTeams 调研一下 XX」就能驱动一个多智能体团队。它的语义是从 Claude Code 的 AgentTeams 移植过来的，四步闭环：创建团队（队长就是当前会话的 agent）→ 拉成员（可续聊的子代理）→ 拆任务并声明彼此的依赖 → 成员之间直接收发消息。最后一步是关键设计——消息走邮箱直达并唤醒对方，不需要队长中转，所以队长不会变成瓶颈。团队的实时活动挂在 Web GUI 右上角的面板里，能看到谁在做什么。"
    },
    "highlights": {
      "en": [
        "Four-step loop: form the team, recruit members, split tasks with declared dependencies, then direct member-to-member messaging",
        "Messages use direct mailbox delivery plus wake, never relayed through the captain",
        "A persistent team activity panel in the Web GUI; the author documents version pinning, npx-without-install and GitHub-latest install paths too"
      ],
      "ja": [
        "4 ステップの閉ループ：チーム作成 → メンバー招集 → 依存関係付きのタスク分割 → メンバー間の直接通信",
        "メッセージはメールボックス直送 + 起床通知。キャプテン中継なしでボトルネックを回避",
        "Web GUI にチーム活動パネルを常駐。作者はバージョン固定・npx 直実行・GitHub 最新版など複数の導入経路も提示"
      ],
      "ko": [
        "4단계 순환: 팀 생성 → 멤버 모집 → 의존 관계를 선언한 작업 분할 → 멤버 간 직접 통신",
        "메시지는 메일박스 직행 + 깨우기. 캡틴 중계가 없어 병목이 생기지 않음",
        "Web GUI에 팀 활동 패널 상주. 작성자는 버전 고정·npx 무설치·GitHub 최신본 등 설치 경로도 함께 제공"
      ],
      "zh": [
        "四步闭环：建队 → 拉成员 → 拆任务并声明依赖 → 成员间直接通信",
        "消息走邮箱直达 + 唤醒，不经队长中转，队长不会成为瓶颈",
        "Web GUI 右上角常驻团队活动面板；作者同时给出了钉版本、npx 免安装、GitHub 装最新提交等多种安装路径"
      ]
    }
  },
  "PlutoKeating/dsh-lark-bot": {
    "intro": {
      "en": "dsh runs on your machine, so the moment you step away it becomes a black box — stuck, off-track or crashed, you only find out back at the desk. dsh-lark-bot puts the remote in Feishu: drive the local dsh coding agent from DMs, group chats and threads, with replies rendered as streaming cards that update thinking, tool calls and results live, complete with stop / approve / question buttons; images and text files can be sent straight to the bot. Inside a Git repo every session gets its own isolated worktree workspace, so projects never collide. Six capabilities set it apart from other bridges: the Guardian safety net (a system-level daemon independent of the dsh process — when dsh goes down the Feishu channel still answers, and /safemode brings up a restricted session on a core-only profile to self-heal), /role multi-role agents (PM / dev / docs each bound to their own persona, model and rules), parallel tasks per scope (default 2, tunable with /concurrency), /archive and /retention for session archiving and retention policy, lark_notify for cross-session push with @mentions, and /providers /provider /key to switch providers and hot-swap keys without leaving the chat. Setup needs no public IP, domain or tunnel (Feishu uses an outbound WebSocket): one npx dsh-lark-bot@latest setup --profile dsh-lark, then scan the QR code. v0.14.0 added /version and periodic update reminders; v0.15.0 added an official-channel statement. ⚠️ Only the repo PlutoKeating/dsh-lark-bot and the npm package dsh-lark-bot (twin package dsh-feishu-bot) are official — this project never ships an .exe or any download-and-run installer.",
      "ja": "dsh はローカルで動くため、席を離れた瞬間ブラックボックスになる——詰まったのか、逸れたのか、落ちたのか、机に戻るまで分からない。dsh-lark-bot はそのリモコンを飛書に入れる：DM・グループ・スレッドからローカルの dsh coding agent を操作でき、返信はストリーミングカードとして思考・ツール呼び出し・結果をリアルタイム更新、停止／承認／質問ボタン付き、画像やテキストファイルはそのまま bot に送れる。Git リポジトリ内ではセッションごとに隔離 worktree のワークスペースを自動作成し、プロジェクト同士が干渉しない。他の橋渡しと違うのは六つの組み合わせ：Guardian セーフティネット守護（dsh プロセスから独立したシステムレベルの守護。dsh が落ちても飛書は応答し、/safemode がコアのみの profile で制限付きセッションを立ち上げて自己修復）、/role のマルチロール Agent（PM／開発／ドキュメントごとに人格・モデル・ルールを個別に紐付け）、scope 内の並列タスク（既定 2、/concurrency で調整）、/archive と /retention によるアーカイブと保持ポリシー、lark_notify のセッション跨ぎ通知と @ メンション、そして /providers /provider /key によるチャット内でのプロバイダ切替と鍵のホットスワップ。導入にグローバル IP・ドメイン・トンネルは不要（飛書は送信方向の WebSocket）。npx dsh-lark-bot@latest setup --profile dsh-lark 一行のあと QR を読むだけ。v0.14.0 で /version と定期更新通知、v0.15.0 で公式チャネル声明を追加。⚠️ 公式はリポジトリ PlutoKeating/dsh-lark-bot と npm パッケージ dsh-lark-bot（同源の双子 dsh-feishu-bot）のみ——本プロジェクトは .exe や「ダウンロードして実行」型のインストーラを一切配布しない。",
      "ko": "dsh는 로컬에서 돌기 때문에 자리를 뜨는 순간 블랙박스가 된다——막혔는지, 엇나갔는지, 죽었는지 책상에 돌아와야 안다. dsh-lark-bot은 그 리모컨을 Feishu에 넣는다: DM·그룹·스레드에서 로컬 dsh coding agent를 지휘하고, 답변은 스트리밍 카드로 사고·도구 호출·결과를 실시간 갱신하며 중지／승인／질문 버튼을 제공하고, 이미지와 텍스트 파일은 봇에게 바로 보내면 된다. Git 저장소 안에서는 세션마다 격리된 worktree 작업 공간을 자동 생성해 프로젝트가 서로 간섭하지 않는다. 다른 브리지와 갈리는 지점은 여섯 가지 조합이다: Guardian 안전망 가디언(dsh 프로세스와 독립된 시스템 수준 데몬으로, dsh가 내려가도 Feishu는 응답하고 /safemode가 코어 전용 profile로 제한 세션을 띄워 자가 복구), /role 멀티 롤 Agent(PM／개발／문서 각각 페르소나·모델·규칙을 따로 바인딩), scope 내 병렬 작업(기본 2, /concurrency로 조절), /archive와 /retention의 아카이브·보존 정책, lark_notify의 세션 간 능동 알림과 @멘션, 그리고 /providers /provider /key로 대화 안에서 공급자 전환과 키 핫스왑. 설치에 공인 IP·도메인·터널이 필요 없고(Feishu는 아웃바운드 WebSocket), npx dsh-lark-bot@latest setup --profile dsh-lark 한 줄 뒤 QR을 스캔하면 끝이다. v0.14.0에서 /version과 주기적 업데이트 알림, v0.15.0에서 공식 채널 성명이 추가됐다. ⚠️ 공식은 저장소 PlutoKeating/dsh-lark-bot과 npm 패키지 dsh-lark-bot(동일 소스 쌍둥이 dsh-feishu-bot)뿐이며, 이 프로젝트는 .exe나 '내려받아 실행' 설치 파일을 배포하지 않는다.",
      "zh": "dsh 跑在本机，离开工位就成了盲盒——任务卡住、跑偏还是崩了，回到电脑前才知道。dsh-lark-bot 把遥控器装进飞书：私聊、群聊、话题里直接指挥本机 dsh coding agent，回复以流式卡片实时更新思考、工具调用与结果，带停止 / 审批 / 问答交互按钮，图片和文本文件直接发给 bot 即可；Git 仓库内为每个会话自动开隔离 worktree 工作区，多项目互不干扰。六项组合能力是它区别于其他桥接的地方：Guardian 安全网守护（独立于 dsh 进程的系统级守护，dsh 下线仍能在飞书里对话，/safemode 用仅核心 profile 拉起受限会话自愈）、/role 多角色 Agent（PM / 开发 / 文档各自绑定人设、模型与规则）、scope 内并行多任务（默认 2，/concurrency 可调）、/archive 与 /retention 会话归档与保留策略、lark_notify 跨会话主动通知并 @ 人、以及 /providers /provider /key 在对话里直接切供应商热更新密钥。安装无需公网 IP、域名或内网穿透（走飞书 WebSocket 出站长连接），一条 npx dsh-lark-bot@latest setup --profile dsh-lark 装完扫码即用；v0.14.0 起有 /version 与周期更新提醒，v0.15.0 起附官方渠道声明。⚠️ 认准官方仓库 PlutoKeating/dsh-lark-bot 与官方 npm 包 dsh-lark-bot（同源双包 dsh-feishu-bot）——本项目从不提供任何 .exe 或「下载即运行」安装包。"
    },
    "highlights": {
      "en": [
        "Guardian safety net: a daemon independent of dsh — the Feishu channel keeps answering after a crash, /safemode self-heals on a core-only profile",
        "/role multi-role agents plus parallel tasks per scope (default 2, tune with /concurrency) — one bot covers a whole team, no queueing",
        "lark_notify pushes across sessions with @mentions: a task finished in one group pings you in another; /archive and /retention manage history",
        "One command then a QR scan — no public IP, domain or tunnel; /providers and /key switch providers and hot-swap keys in-chat"
      ],
      "ja": [
        "Guardian セーフティネット守護：dsh から独立し、落ちても飛書は応答継続。/safemode がコアのみ profile で自己修復",
        "/role のマルチロール Agent と scope 内並列タスク（既定 2、/concurrency で調整）——一台でチーム分、待ち行列なし",
        "lark_notify がセッションを跨いで @ 通知：A グループの完了を B グループや DM に push。/archive と /retention で履歴管理",
        "一行実行＋QR 読み取りで完了。グローバル IP・ドメイン・トンネル不要。/providers と /key でチャット内から鍵を切替"
      ],
      "ko": [
        "Guardian 안전망 가디언: dsh와 독립돼 크래시 후에도 Feishu가 응답하고, /safemode가 코어 전용 profile로 자가 복구",
        "/role 멀티 롤 Agent와 scope 내 병렬 작업(기본 2, /concurrency 조절) — 봇 하나가 팀 하나 몫, 대기열 없음",
        "lark_notify가 세션을 넘어 @알림: A 그룹에서 끝난 작업을 B 그룹·DM으로 push. /archive와 /retention으로 이력 관리",
        "명령 한 줄과 QR 스캔이면 끝, 공인 IP·도메인·터널 불필요. /providers와 /key로 대화 안에서 공급자·키 교체"
      ],
      "zh": [
        "Guardian 安全网守护：独立于 dsh 进程，dsh 崩溃后飞书里仍叫得应，/safemode 仅核心 profile 自愈重启",
        "/role 多角色 Agent + scope 内并行多任务（默认 2，/concurrency 可调），一个 bot 顶一整个团队且不用排队",
        "lark_notify 跨会话主动通知并 @ 人：A 群任务跑完主动推到 B 群或私聊；/archive 与 /retention 管归档与保留",
        "一条命令装完扫码即用，无需公网 IP / 域名 / 内网穿透；/providers /key 在对话里直接切供应商、热更新密钥"
      ]
    }
  },
  "Ruler4396/dsh-launcher": {
    "intro": {
      "en": "This launcher is for Windows users who would rather not open a terminal every time. Once installed, it starts the dsh service silently after you log in, with no window popping up; when you want it, double-click to open a standalone WebView2 window that uses roughly 50–150MB and releases it when closed — much lighter than keeping a whole browser open. If the service isn't running, the launcher starts it and waits for readiness; the first run downloads dsh components through npx with an on-screen progress indicator, so dsh never needs to be installed globally. Failures stop being silent: missing Node.js, a slow download or an occupied port each raise a dialog that says what happened. Logs are split in two — the dsh service log at `%USERPROFILE%\\.dsh-web.log` and the shell startup trace at `DSH_HOME\\dsh-launcher\\shell.log`. The custom-drawn title bar and the window/taskbar icons follow the dsh theme and switch between light and dark instantly, no restart needed. A companion plugin, `dsh-launcher-lifetime`, adds a \"Node service residency\" setting inside dsh with three modes (follow window / always on / tray-resident) that decide whether the node service keeps running after you close the window; without the plugin the launcher defaults to follow-window. Ships as both an MSI installer and a portable ZIP.",
      "ja": "毎回ターミナルを開いてコマンドを打ちたくない Windows ユーザー向けのランチャー。インストールすればログイン後に dsh サービスが静かに起動し、ウィンドウは出てこない。使いたいときはダブルクリックで独立した WebView2 ウィンドウが開く。消費はおよそ 50〜150MB で、閉じれば解放される——ブラウザを丸ごと開いておくよりずっと軽い。サービスが起動していなければ自動で立ち上げて準備完了まで待つ。初回は npx 経由で dsh コンポーネントをダウンロードし、進捗が画面に表示されるので、dsh をグローバルインストールする必要はない。失敗が黙って起きることはなくなる。Node.js が無い、ダウンロードが遅い、ポートが使われている——いずれも何が起きたかを説明するダイアログが出る。ログは 2 つに分かれ、dsh サービスログは `%USERPROFILE%\\.dsh-web.log`、シェル起動トレースは `DSH_HOME\\dsh-launcher\\shell.log`。自前描画のタイトルバーとウィンドウ/タスクバーアイコンは dsh のテーマに追従し、再起動なしでライト/ダークが即座に切り替わる。連携プラグイン `dsh-launcher-lifetime` は dsh の設定画面に「Node サービス常駐」の 3 モード（ウィンドウ追従 / 常駐 / トレイ常駐）を追加し、ウィンドウを閉じた後に node サービスを走らせ続けるかどうかを決められる。プラグイン未導入時は既定の「ウィンドウ追従」で動作する。MSI インストーラーとポータブル ZIP の 2 形態を提供。",
      "ko": "매번 터미널을 열어 명령을 치고 싶지 않은 Windows 사용자를 위한 런처다. 설치해 두면 로그인 후 dsh 서비스가 조용히 시작되고 창은 뜨지 않는다. 쓰고 싶을 때 더블클릭하면 독립 WebView2 창이 열리는데, 약 50~150MB를 쓰고 닫으면 바로 해제된다 — 브라우저를 통째로 띄워 두는 것보다 훨씬 가볍다. 서비스가 꺼져 있으면 자동으로 띄우고 준비될 때까지 기다린다. 첫 실행에서는 npx로 dsh 구성 요소를 내려받으며 진행 상황이 화면에 표시되므로 dsh를 전역 설치할 필요가 없다. 실패가 조용히 지나가는 일도 없다. Node.js가 없거나, 다운로드가 느리거나, 포트가 점유되어 있으면 각각 무슨 일인지 설명하는 대화상자가 뜬다. 로그는 둘로 나뉘어 dsh 서비스 로그는 `%USERPROFILE%\\.dsh-web.log`, 셸 시작 추적은 `DSH_HOME\\dsh-launcher\\shell.log`에 남는다. 직접 그린 타이틀 바와 창·작업 표시줄 아이콘은 dsh 테마를 따라 재시작 없이 즉시 라이트/다크가 전환된다. 동반 플러그인 `dsh-launcher-lifetime`은 dsh 설정 화면에 'Node 서비스 상주' 3단계(창 따라감 / 상주 / 트레이 상주)를 추가해 창을 닫은 뒤 node 서비스를 계속 돌릴지 정할 수 있게 한다. 플러그인이 없으면 기본값인 '창 따라감'으로 동작한다. MSI 설치 파일과 휴대용 ZIP 두 가지로 제공된다.",
      "zh": "给不想每次开终端敲命令的 Windows 用户准备的启动器。装好之后开机登录就静默启动 dsh 服务，不弹窗；要用的时候双击打开一个 WebView2 独立窗口，占用大约 50–150MB，关窗即释放，比挂着一整个浏览器轻。服务没开会自动拉起并等待就绪，首次运行需要通过 npx 下载 dsh 组件，界面上有进度提示——dsh 本身不必全局安装。出问题时不再静默失败：缺 Node.js、下载太慢、端口被占都会弹窗说清楚，日志分两份，dsh 服务日志在 `%USERPROFILE%\\.dsh-web.log`，壳启动轨迹在 `DSH_HOME\\dsh-launcher\\shell.log`。自绘标题栏和窗口/任务栏图标跟随 dsh 主题即时切换深浅色，不用重启。还有一个配套插件 `dsh-launcher-lifetime`，在 dsh 设置页里提供「Node 服务驻留」三档切换（跟随窗口 / 常驻 / 托盘驻留），决定关窗后 node 服务继续跑还是跟着停；不装插件时按默认「跟随窗口」工作。提供 MSI 安装包和便携版 ZIP 两种形式。"
    },
    "highlights": {
      "en": [
        "Silent autostart of the dsh service at logon, with a standalone WebView2 window (~50–150MB, freed on close) replacing a full browser",
        "Starts the service and waits for readiness if it isn't up; first run pulls components via npx with progress, so dsh needs no global install",
        "Missing Node.js, failed downloads and port conflicts all raise explicit dialogs; service log and shell startup trace are kept separate for triage",
        "Companion plugin `dsh-launcher-lifetime` adds three service-residency modes — follow window / always on / tray-resident — applied live with no restart"
      ],
      "ja": [
        "ログオン時に dsh サービスを静かに自動起動、ブラウザ全体の代わりに独立 WebView2 ウィンドウ（約 50〜150MB、閉じれば解放）",
        "サービス未起動なら自動で立ち上げて待機、初回は npx でコンポーネントを進捗表示つきダウンロード、dsh のグローバル導入は不要",
        "Node.js 不足 / ダウンロード失敗 / ポート競合はすべて明示的なダイアログ、サービスログとシェル起動トレースは別ファイルで切り分けやすい",
        "連携プラグイン `dsh-launcher-lifetime` で「ウィンドウ追従 / 常駐 / トレイ常駐」の 3 モードを即時切り替え、再起動不要"
      ],
      "ko": [
        "로그온 시 dsh 서비스 무음 자동 시작, 브라우저 전체 대신 독립 WebView2 창(약 50~150MB, 닫으면 해제)",
        "서비스가 꺼져 있으면 자동으로 띄우고 대기, 첫 실행은 npx로 진행률과 함께 구성 요소 다운로드 — dsh 전역 설치 불필요",
        "Node.js 누락 / 다운로드 실패 / 포트 충돌 모두 명확한 대화상자로, 서비스 로그와 셸 시작 추적을 분리 보관해 원인 파악이 쉽다",
        "동반 플러그인 `dsh-launcher-lifetime`으로 '창 따라감 / 상주 / 트레이 상주' 3단계를 재시작 없이 즉시 전환"
      ],
      "zh": [
        "开机静默自启 dsh 服务，WebView2 独立小窗（约 50–150MB，关窗即释放）替代整个浏览器",
        "服务未开自动拉起并等待就绪，首次经 npx 下载组件带进度提示，dsh 无需全局安装",
        "缺 Node.js / 下载失败 / 端口占用都明确弹窗，服务日志与壳启动轨迹分两份便于定位",
        "配套插件 `dsh-launcher-lifetime` 提供「跟随窗口 / 常驻 / 托盘驻留」三档服务模式，立即生效不用重启"
      ]
    }
  },
  "Small-tailqwq/dsh-deep-whale": {
    "intro": {
      "en": "A repository dedicated to distributing whale-girl skins, with full previews for both light and dark modes. The skin currently shipped is maid-atelier (package @dsh-external/dsh-client-ui-skin-maid-atelier): a twin-maid backdrop, deep-blue lace interface and chibi sidebar. Installation differs from a normal plugin — there is no package.json at the repo root, and each skin is a separate subdirectory package, so you clone first and then point the install at the specific skin directory. The character is derivative work: the original whale-girl design is by 上善, the DeepSeek-flavoured maid redesign is by ZipZipPipe, and the repo ships under CC BY-NC-SA 4.0, which forbids commercial use. The skin scaffolding comes from zhu1090093659/dsh-web-ui; this repo distributes finished skins only.",
      "ja": "クジラ娘スキンの配布に特化したリポジトリで、ライト／ダーク両モードのプレビューが揃っています。現在収録されているスキンは maid-atelier（パッケージ名 @dsh-external/dsh-client-ui-skin-maid-atelier）：双子メイドの背景、深海ブルーのレース調インターフェース、デフォルメ版サイドバー。導入方法は通常のプラグインと異なります——リポジトリのルートに package.json がなく、各スキンが独立したサブディレクトリパッケージなので、まず clone してから対象スキンのディレクトリを指定してインストールします。キャラクターは二次創作で、クジラ娘の原作は上善、DeepSeek 要素を加えたメイドの再デザインは ZipZipPipe によるもの。リポジトリ全体は CC BY-NC-SA 4.0 で公開され、商用利用は禁止です。スキンの足場は zhu1090093659/dsh-web-ui 由来で、本リポジトリは完成品のみを配布します。",
      "ko": "고래소녀 스킨 배포에 특화된 저장소로, 라이트·다크 두 모드의 전체 미리보기가 있습니다. 현재 수록된 스킨은 maid-atelier(패키지명 @dsh-external/dsh-client-ui-skin-maid-atelier)입니다: 쌍둥이 메이드 배경, 심해 블루 레이스 인터페이스, 데포르메 사이드바. 설치 방식은 일반 플러그인과 다릅니다——저장소 루트에 package.json이 없고 각 스킨이 독립된 하위 디렉터리 패키지라서, 먼저 clone한 뒤 해당 스킨 디렉터리를 지정해 설치합니다. 캐릭터는 2차 창작으로, 고래소녀 원작은 上善, DeepSeek 요소를 더한 메이드 재디자인은 ZipZipPipe의 작업입니다. 저장소 전체는 CC BY-NC-SA 4.0으로 공개되어 상업적 사용이 금지됩니다. 스킨 스캐폴딩은 zhu1090093659/dsh-web-ui에서 왔고, 이 저장소는 완성품만 배포합니다.",
      "zh": "一个专门分发鲸鱼娘皮肤的仓库，明暗两套模式都有完整预览。当前收录的皮肤是 maid-atelier（深海女仆工坊，包名 @dsh-external/dsh-client-ui-skin-maid-atelier）：双女仆背景、深海蓝蕾丝界面、Q 版侧栏。装法和一般插件不同——仓库根目录没有 package.json，每个皮肤是一个独立的子目录包，所以要先 clone 再指到具体皮肤目录装。角色形象是二创：鲸鱼娘原作者是上善，加入 DeepSeek 元素的女仆二次设计出自 ZipZipPipe，仓库整体以 CC BY-NC-SA 4.0 发布，禁止商业使用。皮肤工程脚手架来自 zhu1090093659/dsh-web-ui，本仓库只分发成品。"
    },
    "highlights": {
      "en": [
        "Distributed per subdirectory: no root package.json, so clone first and point at ./dsh-deep-whale/maid-atelier",
        "maid-atelier deep-sea maid atelier, with complete light and dark mode previews",
        "Derivative work under CC BY-NC-SA 4.0, non-commercial only; original by 上善, redesign by ZipZipPipe, attribution in each skin's NOTICE"
      ],
      "ja": [
        "サブディレクトリ単位で配布：ルートに package.json がないため、clone 後に ./dsh-deep-whale/maid-atelier を指定",
        "maid-atelier 深海メイド工房。ライト／ダーク両モードの完全プレビュー付き",
        "二次創作、CC BY-NC-SA 4.0 で商用利用禁止。原作は上善、再デザインは ZipZipPipe、帰属は各スキンの NOTICE に記載"
      ],
      "ko": [
        "하위 디렉터리 단위 배포: 루트에 package.json이 없어 clone 후 ./dsh-deep-whale/maid-atelier를 지정",
        "maid-atelier 심해 메이드 공방, 라이트·다크 모드 전체 미리보기 제공",
        "2차 창작, CC BY-NC-SA 4.0으로 상업적 사용 금지. 원작 上善, 재디자인 ZipZipPipe, 귀속은 각 스킨 NOTICE 참조"
      ],
      "zh": [
        "按子目录分发：根目录无 package.json，需 clone 后指到 ./dsh-deep-whale/maid-atelier",
        "maid-atelier 深海女仆工坊，明暗双模式完整预览",
        "衍生创作，CC BY-NC-SA 4.0 禁止商用；原作上善、二次设计 ZipZipPipe，署名见各皮肤 NOTICE"
      ]
    },
    "installCmd": "# 皮肤按子目录分发，仓库根没有 package.json，要指到具体皮肤目录\ngit clone https://github.com/Small-tailqwq/dsh-deep-whale\ndsh plugin --profile web add ./dsh-deep-whale/maid-atelier"
  },
  "ZSeven-W/dsh-openpencil": {
    "intro": {
      "en": "The usual \"AI does design\" story ends with a generated picture. DSH OpenPencil takes another route: the agent operates on real `.op` documents. The installed OpenPencil headless exporter renders design-faithful previews — the first top-level frame as a large replay-safe PNG, plus a horizontally scrollable thumbnail rail with click-to-select and previous/next navigation for multi-frame documents. \"Open interactive canvas\" lazily mounts the read-only OpenPencil Web SDK with pan, zoom and fit, so you can inspect any page, nested node or inactive page without leaving the conversation. With `editable: true`, the edit action opens the managed OpenPencil editor — selection, layers, properties, drawing tools, undo/redo and explicit save semantics — in a resizable right-hand workbench with a full-screen option. Five tools (`openpencil_new`, `openpencil_create`, `openpencil_edit`, `openpencil_render`, `openpencil_selection`) let the agent create, modify and read a real canvas through transactional `batch_design` programs. On the security side, image and document grants are signed, hash-bound capabilities: browser metadata never exposes an arbitrary host path, and signed preview or editor capabilities never enter the canonical tool result or the model context. Transactional safety means a new document is published only after the whole `batch_design` program succeeds, the tool never overwrites an existing path, a failed batch leaves no empty file behind, and saves use an optimistic hash with atomic replace.",
      "ja": "よくある「AI がデザインする」話は生成画像を返して終わるが、DSH OpenPencil は別の道を行く。Agent が本物の `.op` ドキュメントを直接操作するのだ。導入された OpenPencil ヘッドレスエクスポーターは設計に忠実なプレビューを描画する——最初のトップレベル frame は再生安全な大きな PNG として、その下に横スクロールできるサムネイルレールが付き、クリックで選択、複数フレーム文書では前後移動もできる。「インタラクティブキャンバスを開く」を選ぶと、読み取り専用の OpenPencil Web SDK が遅延マウントされ、パン・ズーム・フィットが使える。会話を離れずに任意のページ、ネストしたノード、非アクティブなページを検分できる。`editable: true` を渡すと、マネージド OpenPencil エディタが開く——選択、レイヤー、プロパティ、描画ツール、アンドゥ/リドゥ、そして明示的な保存セマンティクスが、幅を変えられる右側のワークベンチに現れ、全画面表示にも対応する。5 つのツール（`openpencil_new`、`openpencil_create`、`openpencil_edit`、`openpencil_render`、`openpencil_selection`）により、Agent はトランザクショナルな `batch_design` プログラムを通じて本物のキャンバスを作成・変更・読み取りできる。セキュリティ面では、画像と文書の付与は署名されハッシュに束縛された capability であり、ブラウザのメタデータが任意のホストパスを露出することはなく、署名済みのプレビュー/エディタ capability が正規のツール結果やモデルコンテキストに入ることもない。トランザクション保証として、`batch_design` プログラム全体が成功した後にのみ新規文書が公開され、既存パスを上書きすることはなく、失敗したバッチが空ファイルを残すこともなく、保存は楽観的ハッシュとアトミック置換で行われる。",
      "ko": "흔한 'AI가 디자인한다'는 이야기는 생성된 그림 한 장으로 끝나지만, DSH OpenPencil은 다른 길을 간다. 에이전트가 실제 `.op` 문서를 직접 조작한다. 설치된 OpenPencil 헤드리스 익스포터는 디자인에 충실한 미리보기를 렌더링한다 — 첫 최상위 frame은 재생 안전한 큰 PNG로, 그 아래에는 가로로 스크롤되는 썸네일 레일이 붙어 클릭 선택과 다중 프레임 문서의 앞뒤 이동을 지원한다. '인터랙티브 캔버스 열기'를 고르면 읽기 전용 OpenPencil Web SDK가 지연 마운트되어 팬·줌·맞춤을 쓸 수 있고, 대화를 떠나지 않고도 임의의 페이지나 중첩 노드, 비활성 페이지를 살펴볼 수 있다. `editable: true`를 넘기면 관리형 OpenPencil 에디터가 열린다 — 선택, 레이어, 속성, 그리기 도구, 실행 취소/다시 실행, 그리고 명시적인 저장 의미론이 너비를 조절할 수 있는 오른쪽 작업대에 나타나며 전체 화면도 지원한다. 다섯 개 도구(`openpencil_new`, `openpencil_create`, `openpencil_edit`, `openpencil_render`, `openpencil_selection`)를 통해 에이전트는 트랜잭션 `batch_design` 프로그램으로 실제 캔버스를 만들고 수정하고 읽는다. 보안 면에서 이미지와 문서 권한은 서명되고 해시에 묶인 capability이며, 브라우저 메타데이터가 임의의 호스트 경로를 노출하지 않고, 서명된 미리보기·에디터 capability가 정식 도구 결과나 모델 컨텍스트에 들어가지도 않는다. 트랜잭션 안전성으로 `batch_design` 프로그램 전체가 성공한 뒤에만 새 문서가 게시되고, 기존 경로를 덮어쓰지 않으며, 실패한 배치가 빈 파일을 남기지 않고, 저장은 낙관적 해시와 원자적 교체로 이뤄진다.",
      "zh": "常见的「AI 出设计」是返回一张生成图，DSH OpenPencil 走的是另一条路：让 Agent 直接操作真实的 `.op` 文档。安装后的 OpenPencil headless 导出器渲染的是设计忠实的预览——第一个顶层 frame 是一张可重放的大图 PNG，下面配一条可横向滚动的缩略图轨，点击切换、支持上一张下一张。「打开交互画布」会惰性挂载只读的 OpenPencil Web SDK，可以平移、缩放、适配，不离开对话就能检视任意页面、嵌套节点或未激活页。传 `editable: true` 则打开托管编辑器：选择、图层、属性、绘图工具、撤销重做，以及明确的保存语义，在右侧可调宽度的工作台里，也支持全屏。Agent 侧有五个工具——`openpencil_new`、`openpencil_create`、`openpencil_edit`、`openpencil_render`、`openpencil_selection`——通过事务式的 `batch_design` 程序创建、修改和读取画布。安全上，图片与文档授权是签名且哈希绑定的能力凭证，浏览器元数据不会暴露任意主机路径，签名的预览/编辑器凭证也不会进入工具结果或模型上下文。事务性保证：整个 `batch_design` 全部成功才发布新文档，永不覆盖已有路径，失败的批次不会留下空文件，保存用乐观哈希加原子替换。"
    },
    "highlights": {
      "en": [
        "Exact multi-frame previews: a large PNG of the top-level frame plus a scrollable thumbnail rail with click-to-select and prev/next navigation",
        "Pan-and-zoom interactive canvas; `editable: true` opens a managed editor with layers, properties and undo/redo in a resizable, full-screen-capable workbench",
        "Five agent tools create, modify and read the real canvas through transactional `batch_design` — published only on full success, no empty files on failure",
        "Signed, hash-bound capability grants: no host paths leak through browser metadata, and preview/editor capabilities never reach tool results or model context"
      ],
      "ja": [
        "多フレームの正確なプレビュー：トップレベル frame の大きな PNG + 横スクロールのサムネイルレール、クリック選択と前後移動",
        "パン・ズーム可能なインタラクティブキャンバス。`editable: true` でレイヤー / プロパティ / アンドゥを備えたマネージドエディタが幅可変・全画面対応のワークベンチに開く",
        "5 つの Agent ツールがトランザクショナルな `batch_design` で本物のキャンバスを作成・変更・読み取り。全成功時のみ公開、失敗しても空ファイルを残さない",
        "署名・ハッシュ束縛の capability 付与。ホストパスはブラウザメタデータから漏れず、プレビュー/エディタ capability はツール結果やモデルコンテキストに入らない"
      ],
      "ko": [
        "다중 프레임 정확 미리보기: 최상위 frame의 큰 PNG + 가로 스크롤 썸네일 레일, 클릭 선택과 앞뒤 이동",
        "팬·줌 가능한 인터랙티브 캔버스. `editable: true`로 레이어 / 속성 / 실행 취소를 갖춘 관리형 에디터가 너비 조절·전체 화면 작업대에 열린다",
        "다섯 개 에이전트 도구가 트랜잭션 `batch_design`으로 실제 캔버스를 생성·수정·조회. 전부 성공해야 게시되고 실패해도 빈 파일이 남지 않는다",
        "서명·해시 결속 capability 부여. 호스트 경로가 브라우저 메타데이터로 새지 않고, 미리보기·에디터 capability는 도구 결과와 모델 컨텍스트에 들어가지 않는다"
      ],
      "zh": [
        "多帧精确预览：顶层 frame 大图 PNG + 可横向滚动缩略图轨，点击切换、前后翻页",
        "交互画布可平移缩放，`editable: true` 打开带图层/属性/撤销重做的托管编辑器，右侧工作台可调宽并支持全屏",
        "五个 Agent 工具通过事务式 `batch_design` 创建、修改、读取真实画布，全部成功才发布，失败不留空文件",
        "签名且哈希绑定的能力授权，主机路径不外泄，预览/编辑器凭证不进入工具结果与模型上下文"
      ]
    }
  },
  "anywhere-labs/dsh-desktop": {
    "intro": {
      "en": "DeepSeek Harness officially starts its local Web UI from the command line. This project wraps that flow into a desktop application — it starts and manages the local Harness service automatically and integrates a system tray and desktop window, so users need neither a Node.js install nor a terminal. It is not a plugin you add to a profile; you download an installer from the project's site, and macOS and Windows are supported. Two planned features are not shipped yet: mobile remote control (connect from iOS or Android to start tasks and watch agent progress from a phone) and a desktop plugin marketplace for discovering, installing, updating and managing plugins — the latter echoing the Harness \"everything is a plugin\" architecture.",
      "ja": "DeepSeek Harness は公式にはコマンドラインからローカル Web UI を起動します。本プロジェクトはその流れをデスクトップアプリとして包み込みます——ローカルの Harness サービスを自動で起動・管理し、システムトレイとデスクトップウィンドウを統合するため、ユーザーは Node.js のインストールもターミナルも必要ありません。profile に追加するプラグインではなく、公式サイトからインストーラをダウンロードする方式で、macOS と Windows に対応します。計画中の 2 機能は未リリースです：スマートフォンからのリモート操作（iOS / Android でデスクトップに接続し、タスク起動と Agent の進捗確認）と、デスクトップ側のプラグインマーケット（プラグインの発見・導入・更新・管理）——後者は Harness の「すべてがプラグイン」というアーキテクチャ志向に呼応しています。",
      "ko": "DeepSeek Harness는 공식적으로 명령줄에서 로컬 Web UI를 띄웁니다. 이 프로젝트는 그 흐름을 데스크톱 앱으로 감쌉니다——로컬 Harness 서비스를 자동으로 시작·관리하고 시스템 트레이와 데스크톱 창을 통합해, 사용자는 Node.js 설치도 터미널도 필요하지 않습니다. profile에 추가하는 플러그인이 아니라 공식 사이트에서 설치 파일을 내려받는 방식이며 macOS와 Windows를 지원합니다. 계획된 두 기능은 아직 출시되지 않았습니다: 휴대폰 원격 제어(iOS·Android에서 데스크톱에 연결해 작업을 시작하고 Agent 진행 상황 확인)와 데스크톱 플러그인 마켓(플러그인 발견·설치·업데이트·관리)——후자는 Harness의 「모든 것이 플러그인」 아키텍처 지향과 맞닿아 있습니다.",
      "zh": "DeepSeek Harness 官方目前是通过命令行启动本地 Web UI。这个项目把那套流程包成桌面应用——自动启动和管理本地 Harness 服务，集成系统托盘与桌面窗口，用户不需要装 Node.js，也不需要执行命令。它不是装进 profile 的插件，从官网下载安装包即可，支持 macOS 和 Windows。作者规划中的两项还没上线：手机远程控制（iOS / Android 连接桌面端，在手机上发起任务、查看 Agent 进度）和桌面端插件市场（做插件的发现、安装、更新与管理）——插件市场这一项呼应了 Harness「一切皆插件」的架构取向。"
    },
    "highlights": {
      "en": [
        "Starts and manages the local Harness service automatically, with system tray and desktop window integration — no Node.js, no command line",
        "Installed from the project's website; macOS and Windows supported; not a profile plugin",
        "Mobile remote control and the desktop plugin marketplace are both marked \"coming soon\" and are not shipped yet"
      ],
      "ja": [
        "ローカル Harness サービスを自動起動・管理し、システムトレイとデスクトップウィンドウを統合。Node.js もコマンドラインも不要",
        "公式サイトからインストール、macOS と Windows に対応。profile プラグインではない",
        "スマホからのリモート操作とデスクトップ版プラグインマーケットはいずれも「近日公開」で未リリース"
      ],
      "ko": [
        "로컬 Harness 서비스를 자동 시작·관리하고 시스템 트레이와 데스크톱 창 통합 — Node.js도 명령줄도 불필요",
        "공식 사이트에서 설치, macOS와 Windows 지원. profile 플러그인이 아님",
        "휴대폰 원격 제어와 데스크톱 플러그인 마켓은 모두 「출시 예정」으로 아직 미출시"
      ],
      "zh": [
        "自动启动与管理本地 Harness 服务，集成系统托盘与桌面窗口，无需 Node.js 或命令行",
        "从官网下载安装，支持 macOS 与 Windows；不是 profile 插件",
        "手机远程控制与桌面端插件市场均标注为「即将推出」，尚未上线"
      ]
    },
    "installCmd": "# 桌面应用，从官网下载安装包（macOS / Windows）\nhttps://www.deepseekdesktop.com"
  },
  "awesome-dsh-plugin/awesome-dsh-plugin": {
    "intro": {
      "en": "An awesome.re-badged list of DSH plugins whose admission criterion is unusually concrete for the genre — only community plugins that are installable via dsh plugin add and that declare dsh.bundle in package.json. That line happens to exclude index repositories, documentation sites and projects that never became bundles, so the list's signal-to-noise ratio beats a raw topic sweep. The README opens by explaining what DSH is: DeepSeek's open-source agent harness, a runnable coding agent (Web and headless) built on a framework where everything is a plugin — models, tools, sandboxes, session storage, UI, even the agent loop itself. It also points readers at dsh-market first, which brings the whole list inside DeepSeek Harness for browsing, searching, star counts and one-click install, update and uninstall.",
      "ja": "awesome.re バッジ付きの DSH プラグインリストで、収録基準がこの手のリストとしては珍しく具体的です——dsh plugin add で導入でき、かつ package.json に dsh.bundle を宣言しているコミュニティプラグインのみ。この線引きは結果としてインデックスリポジトリ、ドキュメントサイト、複合パッケージ化されていないプロジェクトを除外するため、topic を丸ごと拾う方式よりも S/N 比が高くなります。README は冒頭で DSH とは何かを説明します：DeepSeek のオープンソース agent harness であり、実行可能なコーディング agent（Web と headless）で、「すべてがプラグイン」というフレームワーク上に構築されている——モデル、ツール、サンドボックス、セッションストレージ、UI、そして agent loop 自体さえもプラグインです。さらに dsh-market から始めることを勧めています。リスト全体を DeepSeek Harness の中に持ち込み、閲覧・検索・star 数の確認・ワンクリックでの導入／更新／削除ができます。",
      "ko": "awesome.re 배지를 단 DSH 플러그인 목록으로, 수록 기준이 이런 목록치고는 드물게 구체적입니다——dsh plugin add로 설치할 수 있고 package.json에 dsh.bundle을 선언한 커뮤니티 플러그인만 받습니다. 이 선은 결과적으로 색인 저장소와 문서 사이트, 복합 패키지가 되지 못한 프로젝트를 걸러내므로 topic을 통째로 훑는 방식보다 신호 대 잡음비가 좋습니다. README는 첫머리에서 DSH가 무엇인지 설명합니다: DeepSeek의 오픈소스 agent harness이자 실행 가능한 코딩 agent(Web과 headless)이며, 「모든 것이 플러그인」인 프레임워크 위에 세워졌다——모델, 도구, 샌드박스, 세션 저장소, UI, 심지어 agent loop 자체까지 플러그인입니다. 또한 dsh-market부터 시작하라고 안내하는데, 목록 전체를 DeepSeek Harness 안으로 가져와 탐색·검색·star 확인·원클릭 설치/업데이트/삭제를 할 수 있습니다.",
      "zh": "一份挂了 awesome.re 徽章的 DSH 插件清单，收录标准是这类清单里少见的具体——只收「能通过 dsh plugin add 安装」且「package.json 声明了 dsh.bundle」的社区插件。这条线正好把索引仓库、文档站和没做成组合包的项目挡在外面，所以清单本身的信噪比比按 topic 全量抓取的高。README 开头先解释了 DSH 是什么：DeepSeek 开源的 agent harness，一个可运行的编码 agent（Web 与 headless），构建在「一切皆插件」的框架上——模型、工具、沙箱、会话存储、界面，连 agent loop 本身都是插件。它还引导读者从 dsh-market 开始——把整份清单搬进 DSH 里，浏览、搜索、看 star、一键装卸。"
    },
    "highlights": {
      "en": [
        "A concrete admission bar: must be installable via dsh plugin add and declare dsh.bundle, which naturally filters out index sites and non-bundles",
        "Paired with dsh-market, which brings the whole list inside DSH for browsing, search and one-click install/update",
        "The README opens by laying out the DSH \"everything is a plugin\" architecture, making it a usable ecosystem entry point"
      ],
      "ja": [
        "収録基準が具体的：dsh plugin add で導入可能かつ dsh.bundle 宣言が必須。インデックスサイトや非バンドルは自然に除外",
        "dsh-market と連携し、リスト全体を DSH 内で閲覧・検索・ワンクリック導入／更新",
        "README 冒頭で DSH の「すべてがプラグイン」アーキテクチャを解説。エコシステムの入口として読める"
      ],
      "ko": [
        "구체적인 수록 기준: dsh plugin add 설치 가능 + dsh.bundle 선언 필수. 색인 사이트와 비번들은 자연히 제외",
        "dsh-market과 연계해 목록 전체를 DSH 안에서 탐색·검색하고 원클릭 설치/업데이트",
        "README 첫머리가 DSH의 「모든 것이 플러그인」 아키텍처를 정리해 생태계 입구로 읽기 좋음"
      ],
      "zh": [
        "收录门槛具体：必须能 dsh plugin add 安装且声明 dsh.bundle，天然挡掉索引站与非组合包",
        "配套 dsh-market：把整份清单搬进 DSH 内浏览、搜索、一键安装与更新",
        "README 开篇讲清 DSH 的「一切皆插件」架构，适合当生态入口读"
      ]
    }
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
  "bowenliang123/dsh-context": {
    "intro": {
      "en": "A context-insight plugin for DeepSeek Harness. It adds a Context tab and a /context command to the web UI, turning \"what is the model carrying right now\" into visuals: a six-category composition bar, a per-request history chart, an event log of every compaction, prune, injection and model switch, and the exact message surface the model currently sees. When a conversation starts degrading or the token bill balloons, this is where you find out which part ate the budget.",
      "ja": "DeepSeek Harness 向けのコンテキスト洞察プラグイン。Web UI に Context タブと /context コマンドを追加し、「モデルがいま何を抱えているか」を可視化します：6 分類の積み上げバー、モデルリクエストごとの履歴チャート、圧縮・プルーニング・注入・モデル切替のイベントログ、そしてモデルが現在実際に見ているメッセージ一覧。会話の質が落ちてきたとき、トークン消費が膨らんだとき、どの部分がウィンドウを食い潰したかをここで突き止められます。",
      "ko": "DeepSeek Harness용 컨텍스트 인사이트 플러그인. Web UI에 Context 탭과 /context 명령을 추가해 \"모델이 지금 무엇을 담고 있는지\"를 시각화합니다: 6개 분류의 누적 막대, 모델 요청 단위의 히스토리 차트, 압축·프루닝·주입·모델 전환 이벤트 로그, 그리고 모델이 현재 실제로 보고 있는 메시지 목록까지. 대화 품질이 떨어지거나 토큰 비용이 갑자기 불어날 때, 어느 부분이 윈도우를 잡아먹었는지 여기서 확인하세요.",
      "zh": "DeepSeek Harness 的上下文洞察插件。给 Web 界面加一个 Context 标签页和 /context 命令，把「模型此刻带着什么」变成可视化：六类组成的堆叠条、逐模型请求的历史图、每次压缩/裁剪/注入/换模型的事件流水，以及模型当前真正可见的消息列表。对话开始变笨、token 预算莫名爆炸时，先来这里看是哪部分吃掉了窗口。"
    },
    "highlights": {
      "en": [
        "Six-color stacked bar scaled against the model's full window: system prompt, tool schemas, user messages, injected context, assistant replies, tool results — plus the top-5 most expensive tool schemas",
        "History chart with one bar per model request, Turn / Step granularity, ✂ marking where compaction and pruning happened; click to pin the full breakdown",
        "Estimated tokens shown side by side with provider-reported actuals, so you can see how the estimate holds up",
        "Event log of every compaction, tool-output prune, skill/plugin injection and model switch, each with its token delta and turn/step attribution",
        "One-command install (dsh plugin --profile web add dsh-context), no build step, no restart; Apache-2.0"
      ],
      "ja": [
        "モデルの全ウィンドウを基準にした 6 色積み上げバー：システムプロンプト、ツール schema、ユーザーメッセージ、注入コンテキスト、アシスタント応答、ツール結果。最もコストの高いツール schema Top-5 も表示",
        "履歴チャートはモデルリクエストごとに 1 本。Turn / Step の 2 段階粒度、✂ が圧縮・プルーニングの発生位置を示し、クリックで完全な内訳をピン留め",
        "推定トークンと provider 実報告値を並べて表示。推定の精度がひと目で検証できる",
        "イベントログ：compaction、ツール出力プルーニング、skill/プラグイン注入、モデル切替を、トークン増減と turn/step 帰属つきで記録",
        "コマンド一つでインストール（dsh plugin --profile web add dsh-context）。ビルド不要・再起動不要、Apache-2.0"
      ],
      "ko": [
        "모델 전체 윈도우 대비 6색 누적 막대: 시스템 프롬프트, 도구 schema, 사용자 메시지, 주입 컨텍스트, 어시스턴트 응답, 도구 결과 — 비용 상위 5개 도구 schema도 표시",
        "히스토리 차트는 모델 요청당 막대 하나, Turn / Step 두 단계 세분화, ✂ 가 압축·프루닝 발생 지점을 표시하며 클릭하면 전체 내역 고정",
        "추정 토큰과 provider 실측값을 나란히 표시해 추정 정확도를 바로 검증",
        "이벤트 로그: 모든 compaction, 도구 출력 프루닝, skill/플러그인 주입, 모델 전환을 토큰 증감과 turn/step 귀속과 함께 기록",
        "명령 한 줄로 설치(dsh plugin --profile web add dsh-context), 빌드·재시작 불필요; Apache-2.0"
      ],
      "zh": [
        "六色堆叠条对照模型完整窗口：系统提示、工具 schema、用户消息、注入上下文、助手回复、工具结果，附最贵的 Top-5 工具 schema",
        "历史图逐模型请求一根条，Turn / Step 两档粒度，✂ 标出压缩与裁剪发生的位置，点击钉住完整分解",
        "估算 token 与 provider 实报并排显示，估得准不准一眼可验",
        "事件流水记录每次 compaction、工具输出裁剪、skill/插件注入与模型切换，各带 token 增量和 turn/step 归属",
        "一条命令安装（dsh plugin --profile web add dsh-context），免构建免重启；Apache-2.0"
      ]
    }
  },
  "bruc3van/awesome-dsh-plugin": {
    "intro": {
      "en": "It positions itself as \"find the right plugin for your DSH in 30 seconds\" and explicitly says it is not another repo listing — out of 2000+ repos carrying the dsh-plugin tag, it forwards only those meeting all three bars: solves a real problem, explains itself clearly, still maintained. Beyond enumerating, it adds a buyer's-guide step: each plugin is annotated with who it suits and where to begin. The catalogue refreshes on a GitHub Actions schedule, the repository count is a badge read dynamically from data/repositories.json, and a full CATALOG.md catches the long tail. Bilingual Chinese and English.",
      "ja": "「30 秒であなたの DSH に合うプラグインを見つける」を掲げ、単なるリポジトリ一覧ではないと明言しています——dsh-plugin タグの付いた 2000 以上のリポジトリのうち、実際の問題を解決し、説明が明快で、今も保守されている、という 3 条件をすべて満たすものだけを届けます。列挙にとどまらず、各プラグインが誰に向いているか、どこから始めればよいかを注記する「案内」の一手間が加わっています。カタログは GitHub Actions で定期的に更新され、リポジトリ総数は data/repositories.json から動的に読み出されるバッジで表示。ロングテールは全量の CATALOG.md が受け止めます。中英バイリンガル。",
      "ko": "「30초 만에 당신의 DSH에 맞는 플러그인을 찾는다」를 내걸고, 또 하나의 저장소 목록이 아니라고 분명히 밝힙니다——dsh-plugin 태그가 달린 2000개 넘는 저장소 중 실제 문제를 풀고, 설명이 분명하며, 아직 유지보수된다는 세 조건을 모두 만족하는 것만 전달합니다. 나열에 그치지 않고 각 플러그인이 누구에게 맞는지와 어디서 시작할지를 표시하는 안내 한 단계를 더합니다. 카탈로그는 GitHub Actions로 주기적으로 갱신되고, 저장소 총수는 data/repositories.json에서 동적으로 읽는 배지로 표시되며, 롱테일은 전체 CATALOG.md가 받아 줍니다. 중·영 이중 언어.",
      "zh": "它的定位是「用 30 秒为你的 DSH 找到合适的插件」，明确说自己不是又一个仓库清单——2000+ 个打着 dsh-plugin 标签的仓库里，只带过来三条都满足的：解决真实问题、说得清楚、还在维护。比起单纯罗列，它多做了一步导购：每个插件标注适合谁、从哪里开始。目录由 GitHub Actions 定时刷新，仓库总数是从 data/repositories.json 动态读出来的徽章，另有全量 CATALOG.md 兜住长尾。中英双语。"
    },
    "highlights": {
      "en": [
        "Three filters: solves a real problem, explains itself clearly, still maintained — deliberately not an exhaustive listing",
        "Each plugin is annotated with who it suits and where to start, closer to a buyer's guide than an index",
        "Catalogue refreshed on a GitHub Actions schedule with a full CATALOG.md alongside; bilingual Chinese and English"
      ],
      "ja": [
        "3 つの選別基準：実際の問題を解決・説明が明快・今も保守中。網羅的な列挙はしない",
        "各プラグインに「誰向けか」「どこから始めるか」を注記。索引よりも案内寄り",
        "カタログは GitHub Actions で定期更新、全量の CATALOG.md も併設。中英バイリンガル"
      ],
      "ko": [
        "세 가지 선별 기준: 실제 문제 해결·명확한 설명·유지보수 지속. 의도적으로 전수 나열을 하지 않음",
        "각 플러그인에 「누구에게 맞는지」와 「어디서 시작할지」를 표기해 색인보다 안내에 가까움",
        "카탈로그는 GitHub Actions로 주기 갱신, 전체 CATALOG.md 병설. 중·영 이중 언어"
      ],
      "zh": [
        "三条筛选线：解决真实问题、说得清楚、还在维护——不做全量罗列",
        "每个插件标注适合谁、从哪开始，偏导购而非索引",
        "目录由 GitHub Actions 定时刷新，另有全量 CATALOG.md；中英双语"
      ]
    }
  },
  "btspoony/mstar-harness": {
    "intro": {
      "en": "Morning Star's central claim is that workflow gates should be enforced by an engine, not suggested in a prompt. The path, status, lease, dispatch, sdd, iteration and lint gates run inside `@mstar-harness/engine` — TypeScript code doing the enforcing, not a model choosing to comply. Judgment itself stays in the `mstar-*` skills: skills remain the single source of truth for roles, gates and workflow judgment, while the engine owns only the deterministic half. That split is what lets one engine plus one set of skills span hosts: dsh (DeepSeek Harness), omp, OpenCode, Cursor, Kimi Code, ZCode and Codex all have host adapters, and the author's recommended order from best to merely usable is dsh = omp ≥ OpenCode ≥ Cursor > Kimi = ZCode > Codex. The repository ships three things: the Harness Workflow Engine (`@mstar-harness/engine`, the TS enforcement of deterministic gates), the mstar CLI (`@mstar-harness/cli`, installer bootstrap plus `mstar` workflow verbs), and the `mstar-*` skills (the single source of truth for role, gate and workflow judgment). One install note: dsh installs through its own plugin manager rather than the CLI. `npx @mstar-harness/cli init` has no dsh target — it covers omp, OpenCode, Cursor, Kimi, ZCode and Codex — so on dsh you install the profile bundle with the host's own command: `dsh plugin --profile web add @mstar-harness/dsh`.",
      "ja": "Morning Star の中心的な主張は、ワークフローのゲートはプロンプト内の提案ではなくエンジンによる強制であるべきだ、というものだ。path・status・lease・dispatch・sdd・iteration・lint の各ゲートは `@mstar-harness/engine` の内部で走る。強制しているのは TypeScript のコードであって、モデルが従うことを選んでいるのではない。判断そのものは `mstar-*` スキルに残る。ロール・ゲート・ワークフロー判断の単一の真実の源はあくまでスキルであり、エンジンは決定的な半分だけを担う。この分担のおかげで、ひとつのエンジンとひと揃いのスキルがホストをまたげる。dsh（DeepSeek Harness）・omp・OpenCode・Cursor・Kimi Code・ZCode・Codex にはいずれもホストアダプタがあり、作者が挙げる推奨順（最良から使用可能まで）は dsh = omp ≥ OpenCode ≥ Cursor > Kimi = ZCode > Codex だ。リポジトリが提供するのは 3 つ。Harness Workflow Engine（`@mstar-harness/engine`、決定的ゲートの TS による強制）、mstar CLI（`@mstar-harness/cli`、インストーラのブートストラップと `mstar` ワークフロー動詞）、そして `mstar-*` スキル（ロール・ゲート・ワークフロー判断の単一の真実の源）。導入時の注意がひとつ。dsh は CLI ではなく自身のプラグインマネージャ経由で導入する。`npx @mstar-harness/cli init` に dsh のターゲットは無く（omp / OpenCode / Cursor / Kimi / ZCode / Codex をカバーする）、dsh ではホスト自身のコマンドで profile bundle を入れる：`dsh plugin --profile web add @mstar-harness/dsh`。",
      "ko": "Morning Star의 핵심 주장은 워크플로 게이트가 프롬프트 속 제안이 아니라 엔진의 강제여야 한다는 것이다. path·status·lease·dispatch·sdd·iteration·lint 게이트는 `@mstar-harness/engine` 안에서 돈다. 강제하는 주체는 TypeScript 코드이지 모델의 자발적 준수가 아니다. 판단 자체는 `mstar-*` 스킬에 남는다. 역할과 게이트, 워크플로 판단의 단일 진실 공급원은 어디까지나 스킬이고 엔진은 결정적인 절반만 맡는다. 이 분담 덕분에 하나의 엔진과 한 벌의 스킬이 여러 호스트를 넘나든다. dsh(DeepSeek Harness), omp, OpenCode, Cursor, Kimi Code, ZCode, Codex 모두 호스트 어댑터가 있고, 작성자가 제시한 권장 순서(최적에서 사용 가능까지)는 dsh = omp ≥ OpenCode ≥ Cursor > Kimi = ZCode > Codex다. 저장소가 제공하는 것은 셋이다. Harness Workflow Engine(`@mstar-harness/engine`, 결정적 게이트의 TS 강제 구현), mstar CLI(`@mstar-harness/cli`, 설치 부트스트랩과 `mstar` 워크플로 동사), 그리고 `mstar-*` 스킬(역할·게이트·워크플로 판단의 단일 진실 공급원). 설치 시 주의점이 하나 있다. dsh는 CLI가 아니라 자체 플러그인 매니저로 설치한다. `npx @mstar-harness/cli init`에는 dsh 대상이 없고(omp / OpenCode / Cursor / Kimi / ZCode / Codex를 다룬다), dsh에서는 호스트 자체 명령으로 profile 번들을 넣는다: `dsh plugin --profile web add @mstar-harness/dsh`.",
      "zh": "Morning Star 的核心主张是把工作流关卡从「提示词里的建议」变成「引擎里的强制」。path、status、lease、dispatch、sdd、iteration、lint 这些关卡跑在 `@mstar-harness/engine` 里，是 TypeScript 代码在执行，不是模型自觉遵守。而判断本身仍然留在 `mstar-*` 技能里——角色、关卡和工作流判断的唯一事实源是技能，引擎只负责确定性的那一半。这样分工的好处是同一套引擎加技能可以跨宿主：dsh（DeepSeek Harness）、omp、OpenCode、Cursor、Kimi Code、ZCode 和 Codex 都有宿主适配层，作者给出的推荐顺序（从最佳到可用）是 dsh = omp ≥ OpenCode ≥ Cursor > Kimi = ZCode > Codex。仓库交付三样东西：Harness Workflow Engine（`@mstar-harness/engine`，确定性关卡的 TS 强制实现）、mstar CLI（`@mstar-harness/cli`，安装引导加 `mstar` 工作流动词）以及 `mstar-*` 技能（角色、关卡与工作流判断的单一事实源）。安装上要注意 dsh 走自己的插件管理器而不是 CLI：`npx @mstar-harness/cli init` 没有 dsh 目标（它覆盖 omp / OpenCode / Cursor / Kimi / ZCode / Codex），在 dsh 上要用宿主自己的命令装 profile bundle：`dsh plugin --profile web add @mstar-harness/dsh`。"
    },
    "highlights": {
      "en": [
        "Deterministic gates (path / status / lease / dispatch / sdd / iteration / lint) enforced by a TS engine, not offered as prompt suggestions",
        "Judgment stays in the `mstar-*` skills as the single source of truth for roles, gates and workflow, cleanly split from the engine",
        "One engine plus skills across hosts: dsh, omp, OpenCode, Cursor, Kimi Code, ZCode and Codex all have adapters",
        "On dsh, install through the host's own plugin manager: `dsh plugin --profile web add @mstar-harness/dsh` (the CLI init has no dsh target)"
      ],
      "ja": [
        "決定的ゲート（path / status / lease / dispatch / sdd / iteration / lint）を TS エンジンが強制、プロンプトの提案ではない",
        "判断は `mstar-*` スキルに残り、ロール・ゲート・ワークフロー判断の単一の真実の源としてエンジンと明確に分担",
        "ひとつのエンジン + スキルがホストをまたぐ：dsh・omp・OpenCode・Cursor・Kimi Code・ZCode・Codex にアダプタあり",
        "dsh ではホスト自身のプラグインマネージャで導入：`dsh plugin --profile web add @mstar-harness/dsh`（CLI init に dsh ターゲットは無い）"
      ],
      "ko": [
        "결정적 게이트(path / status / lease / dispatch / sdd / iteration / lint)를 TS 엔진이 강제 — 프롬프트 제안이 아니다",
        "판단은 `mstar-*` 스킬에 남아 역할·게이트·워크플로 판단의 단일 진실 공급원으로 엔진과 역할을 명확히 분리",
        "하나의 엔진 + 스킬로 여러 호스트 대응: dsh, omp, OpenCode, Cursor, Kimi Code, ZCode, Codex 모두 어댑터 보유",
        "dsh에서는 호스트 자체 플러그인 매니저로 설치: `dsh plugin --profile web add @mstar-harness/dsh` (CLI init에는 dsh 대상 없음)"
      ],
      "zh": [
        "确定性关卡（path / status / lease / dispatch / sdd / iteration / lint）由 TS 引擎强制执行，不是提示词建议",
        "判断留在 `mstar-*` 技能里，作为角色、关卡与工作流判断的唯一事实源，与引擎分工明确",
        "一套引擎 + 技能跨宿主：dsh、omp、OpenCode、Cursor、Kimi Code、ZCode、Codex 都有适配层",
        "dsh 用宿主自己的插件管理器安装：`dsh plugin --profile web add @mstar-harness/dsh`（CLI init 不含 dsh 目标）"
      ]
    }
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
  "csyangwen/dsh-memory-evolve": {
    "intro": {
      "en": "An AI conversation is normally one-shot: switch projects, come back a few days later, open a new session, and it has forgotten who you are. This plugin gives DSH a long-term working memory that spans sessions. Memory is split into five tracks: a user profile (your preferences, company and communication habits, visible every turn), global facts (environment, tools, conventions and other durable knowledge), project key memory (the current project's conventions, decisions, architecture and pitfalls, injected into context automatically, with important conclusions optionally scoped to a single git branch), and project and daily logs (progress recorded automatically each turn, fully traceable). Writes require your confirmation before they take effect — the AI never slips things into memory on its own — and once memory grows you can have entries archived, which removes them from context injection while keeping them one command away from returning. Your reactions to results — a \"nice\" or a \"why still not fixed\" — get recorded as `【反馈】` lines in the daily and project logs, so after a while you can ask the AI to analyze which kinds of task it handles well or badly. Installing adds a row of capability tabs — memory, skills, to-dos, infinite canvas, COI scheduling, session broadcast, prompts, memory sync, model settings, bookmarks, session review and more. Many are off by default so they don't crowd the AI's tool list; turn on what you need in settings. Memory sync shares project memory across machines, storing it by default on a dedicated branch of your own code repository so it never pollutes the code; if your code is public but your memory should stay private, point it at a separate shared memory repository instead. The four to-do tracks split life, work, project and daily, with the project track isolated per working directory.",
      "ja": "AI の対話はふつう一度きりだ。プロジェクトを変え、数日空け、新しいセッションを開けば、相手はあなたが誰かを忘れている。このプラグインは DSH に、セッションをまたぐ長期的な作業記憶を与える。記憶は 5 つの軌に分かれる。ユーザープロフィール（好み、所属、コミュニケーションの癖。毎ターン参照される）、グローバルな事実（環境・ツール・慣習といった長期知識）、プロジェクト重要記憶（現在のプロジェクトの取り決め・決定・アーキテクチャ・踏んだ地雷。自動でコンテキストに注入され、重要な結論は特定の git ブランチでのみ有効と印を付けられる）、そしてプロジェクトログと日次ログ（毎ターン自動で進捗を記録し、追跡可能）。記憶への書き込みはあなたの確認を経て初めて有効になり、AI が勝手に書き込むことはない。記憶が増えたらアーカイブさせることもでき、アーカイブした項目はコンテキストに注入されなくなるが、いつでも戻せる。結果への反応（「いいね」「まだ直ってない」）は日次ログとプロジェクトログの `【反馈】` 行として記録され、しばらく貯まれば「どの種類のタスクが得意/不得意か」を AI 自身に分析させられる。導入すると能力タブの列が増える——記憶、スキル、ToDo、無限キャンバス、COI スケジューリング、セッションブロードキャスト、プロンプト、記憶同期、モデル設定、ブックマーク、セッションレビューなど。多くは AI のツール一覧を圧迫しないよう既定でオフになっており、必要なものを設定で有効にする。記憶同期は複数マシンでプロジェクト記憶を共有し、既定では自分のコードリポジトリの専用ブランチに保存するのでコードを汚さない。コードは公開だが記憶は private にしたい場合は、別の共有記憶リポジトリを指定すればよい。4 軌の ToDo は生活・仕事・プロジェクト・日次に分かれ、プロジェクト軌は作業ディレクトリごとに分離される。",
      "ko": "AI와의 대화는 보통 일회성이다. 프로젝트를 바꾸고 며칠이 지나 새 세션을 열면 상대는 당신이 누구인지 잊어버린다. 이 플러그인은 DSH에 세션을 넘나드는 장기 작업 기억을 부여한다. 기억은 다섯 트랙으로 나뉜다. 사용자 프로필(취향, 소속, 소통 습관 — 매 턴 참조된다), 전역 사실(환경·도구·관례 같은 장기 지식), 프로젝트 핵심 기억(현재 프로젝트의 약속·결정·아키텍처·삽질 기록으로 자동 주입되며, 중요한 결론은 특정 git 브랜치에서만 유효하도록 표시할 수 있다), 그리고 프로젝트 로그와 일일 로그(매 턴 진행 상황을 자동 기록하고 추적 가능하다). 기억 쓰기는 사용자가 확인해야 반영되며 AI가 멋대로 집어넣지 않는다. 기억이 많아지면 항목을 보관 처리할 수 있는데, 보관된 항목은 컨텍스트에 주입되지 않지만 언제든 되돌릴 수 있다. 결과에 대한 반응('좋다', '아직도 안 고쳐졌네')은 일일·프로젝트 로그의 `【反馈】` 줄로 기록되어, 얼마간 쌓이면 어떤 종류의 작업을 잘하고 못하는지 AI에게 분석시킬 수 있다. 설치하면 능력 탭 줄이 늘어난다 — 기억, 스킬, 할 일, 무한 캔버스, COI 스케줄링, 세션 브로드캐스트, 프롬프트, 기억 동기화, 모델 설정, 북마크, 세션 리뷰 등. 상당수는 AI의 도구 목록을 차지하지 않도록 기본 비활성이며 필요할 때 설정에서 켜면 된다. 기억 동기화는 여러 기기에서 프로젝트 기억을 공유하며, 기본적으로 자기 코드 저장소의 전용 브랜치에 저장해 코드를 오염시키지 않는다. 코드는 공개지만 기억은 비공개로 두고 싶다면 별도의 공유 기억 저장소를 지정하면 된다. 4개 할 일 트랙은 생활·업무·프로젝트·일일로 나뉘고, 프로젝트 트랙은 작업 디렉터리별로 분리된다.",
      "zh": "AI 的对话本来是一次性的：换项目、隔几天、开新会话，它就忘了你是谁。这个插件给 DSH 装上跨会话的长期工作记忆。记忆分五轨：用户档案（你的偏好、公司、沟通习惯，每回合可见）、全局事实（环境、工具、惯例这类长期知识）、项目关键记忆（当前项目的约定、决策、架构、踩坑，自动注入上下文，重要结论还能标记成只在某个 git 分支生效）、项目日志与每日日志（每回合自动记录进展，可追溯）。写记忆需要你确认才生效，AI 不会擅自往里塞东西；记忆多了可以让它归档，归档条目不再注入上下文但随时能转回。你对结果的评价（「太好了」「怎么还没改对」）会被记进当日与项目日志的 `【反馈】` 行，攒一段时间后可以让 AI 分析自己在哪类任务上做得好或差。装上后会多出一排能力标签：记忆、技能、待办、无限画板、COI 调度、会话广播、提示词、记忆同步、模型设置、书签、会话评审等等；很多能力默认关闭以免占用 AI 的工具清单，需要时在设置里打开。记忆同步支持多台电脑共享项目记忆，默认存进你代码仓库的专属分支不污染代码，代码开源但记忆想私藏的话可以另填一个共享记忆仓库地址。四轨待办按生活/工作/项目/每日分开，项目轨按工作目录隔离。"
    },
    "highlights": {
      "en": [
        "Five memory tracks — user profile, global facts, project key memory, project log, daily log — with important conclusions scopable to a single git branch",
        "Writes take effect only after you confirm; entries can be archived to stop context injection and restored at any time",
        "Memory sync shares project memory across machines on a dedicated branch of your code repo, or a separate shared memory repo when code is public",
        "Four to-do tracks (life / work / project / daily) isolated per working directory, plus COI scheduling, session broadcast and search, and skill self-evolution"
      ],
      "ja": [
        "5 軌の記憶：ユーザープロフィール / グローバル事実 / プロジェクト重要記憶 / プロジェクトログ / 日次ログ。重要な結論は特定 git ブランチ限定にできる",
        "記憶への書き込みは確認後に有効、AI は勝手に書かない。項目はアーカイブで注入停止、いつでも復帰可能",
        "記憶同期は自分のコードリポジトリの専用ブランチで複数マシン共有（コードは汚さない）。公開リポジトリなら別の共有記憶リポジトリも指定可",
        "4 軌の ToDo（生活/仕事/プロジェクト/日次）を作業ディレクトリごとに分離、加えて COI スケジューリング・セッションブロードキャストと検索・スキルの自己進化"
      ],
      "ko": [
        "5개 기억 트랙: 사용자 프로필 / 전역 사실 / 프로젝트 핵심 기억 / 프로젝트 로그 / 일일 로그. 중요한 결론은 특정 git 브랜치 한정 가능",
        "기억 쓰기는 확인 후에만 반영되고 AI가 임의로 쓰지 않는다. 항목은 보관 처리로 주입 중단, 언제든 복귀 가능",
        "기억 동기화는 자기 코드 저장소의 전용 브랜치로 여러 기기 공유(코드는 오염되지 않음). 공개 저장소라면 별도 공유 기억 저장소 지정 가능",
        "4개 할 일 트랙(생활/업무/프로젝트/일일)을 작업 디렉터리별 분리, 여기에 COI 스케줄링·세션 브로드캐스트와 검색·스킬 자기 진화"
      ],
      "zh": [
        "五轨记忆：用户档案 / 全局事实 / 项目关键记忆 / 项目日志 / 每日日志，重要结论可标记只在某个 git 分支生效",
        "写记忆需你确认才生效，AI 不擅自写入；条目可归档，归档后不再注入上下文且随时可转回",
        "记忆同步跨设备共享项目记忆，默认存进代码仓库专属分支不污染代码，也可指定独立的共享记忆仓库",
        "四轨待办（生活/工作/项目/每日）按工作目录隔离，外加 COI 调度、会话广播与搜索、技能自我进化"
      ]
    }
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
  "drewnekota/cetus": {
    "intro": {
      "en": "Cetus does not try to replace the agent itself; it adds the layer that does not belong inside a terminal: an always-available entry point, ambient context from your Mac, continuity across sessions, background scheduling, and a place to review completed work. Four capabilities — Quick Launcher (hold both ⌘ keys to summon it over any app, arriving with the current screenshot, frontmost app, browser URL and selected text as removable context chips), Automations (turn any prompt into a one-off or recurring job with at / every / cron / daily, each run keeping its own runtime and model settings in a fresh background conversation), Global Quick Reply (double-tap right ⌥ in any conversation) and Screen Context. Runtimes include the built-in pi runtime, Claude Code, Codex, DeepSeek Harness, OpenCode, Grok Build and Kimi CLI; DSH runs through the dsh CLI you have already installed and signed into.",
      "ja": "Cetus は agent 自体を置き換えようとはせず、ターミナルの中にあるべきでない層を追加します：いつでも呼び出せる入口、Mac から得られる周辺コンテキスト、セッションをまたぐ連続性、バックグラウンドのスケジューリング、そして完了した作業を見返す場所です。機能は 4 つ——クイックランチャー（両方の ⌘ キーを押し続けると任意のアプリの上に呼び出され、現在のスクリーンショット・最前面アプリ・ブラウザ URL・選択テキストを削除可能なコンテキストチップとして伴う）、オートメーション（任意のプロンプトを単発または定期ジョブに変換。at / every / cron / daily に対応し、各実行は新しいバックグラウンド会話でそれぞれのランタイムとモデル設定を保持）、グローバルクイック返信（任意の会話で右 ⌥ をダブルタップ）、スクリーンコンテキスト。ランタイムは内蔵の pi runtime、Claude Code、Codex、DeepSeek Harness、OpenCode、Grok Build、Kimi CLI から選べ、DSH はインストール・ログイン済みの dsh CLI を経由します。",
      "ko": "Cetus는 agent 자체를 대체하려 하지 않고, 터미널 안에 있어서는 안 될 층을 더합니다: 언제든 부를 수 있는 진입점, Mac에서 오는 주변 맥락, 세션을 넘나드는 연속성, 백그라운드 스케줄링, 그리고 완료된 작업을 되돌아볼 장소. 기능은 네 가지입니다——퀵 런처(양쪽 ⌘ 키를 누르면 어떤 앱 위로든 소환되며 현재 스크린샷·최상단 앱·브라우저 URL·선택한 텍스트를 삭제 가능한 맥락 칩으로 함께 가져옴), 자동화(어떤 프롬프트든 일회성 또는 반복 작업으로 전환, at / every / cron / daily 지원, 각 실행은 새 백그라운드 대화에서 각자의 런타임과 모델 설정 유지), 전역 빠른 답장(어떤 대화에서든 오른쪽 ⌥ 더블탭), 화면 맥락. 런타임은 내장 pi runtime, Claude Code, Codex, DeepSeek Harness, OpenCode, Grok Build, Kimi CLI 중에서 고를 수 있고, DSH는 이미 설치·로그인된 dsh CLI를 통해 동작합니다.",
      "zh": "Cetus 不打算替代 agent 本身，它加的是终端里不该有的那一层：随时可唤起的入口、来自 Mac 的环境上下文、跨会话的连续性、后台定时，以及一个回看已完成工作的地方。四件事——快速唤起（按住两个 ⌘ 键在任意应用上方唤出，自动带上当前截图、前台应用、浏览器 URL 和选中文本作为可删除的上下文条）、自动化（把任意 prompt 变成一次性或周期任务，支持 at / every / cron / daily，每次运行在全新的后台会话里并保留各自的运行时与模型设置）、全局快速回复（在任意会话里双击右 ⌥）、屏幕上下文。运行时可选内置的 pi runtime、Claude Code、Codex、DeepSeek Harness、OpenCode、Grok Build 与 Kimi CLI，DSH 走的是你已安装并登录的 dsh CLI。"
    },
    "highlights": {
      "en": [
        "DSH is one of several supported runtimes, reusing your existing signed-in dsh CLI with no second account setup",
        "Four desktop-layer capabilities: Quick Launcher (double ⌘), scheduled Automations (at/every/cron/daily), Global Quick Reply (double-tap right ⌥), and Screen Context",
        "A macOS app downloaded from Releases; positioned to add a desktop layer around agents rather than replace them"
      ],
      "ja": [
        "DSH は対応ランタイムの一つ。ログイン済みの dsh CLI をそのまま再利用し、アカウントの再設定は不要",
        "4 つのデスクトップ層機能：クイックランチャー（両 ⌘）、定期オートメーション（at/every/cron/daily）、グローバルクイック返信（右 ⌥ ダブルタップ）、スクリーンコンテキスト",
        "Releases から入手する macOS アプリ。agent を置き換えるのではなく、その周りにデスクトップ層を足す位置づけ"
      ],
      "ko": [
        "DSH는 지원 런타임 중 하나. 로그인된 dsh CLI를 그대로 재사용하며 계정 재설정 불필요",
        "데스크톱 층 기능 네 가지: 퀵 런처(양 ⌘), 예약 자동화(at/every/cron/daily), 전역 빠른 답장(오른쪽 ⌥ 더블탭), 화면 맥락",
        "Releases에서 받는 macOS 앱. agent를 대체하지 않고 그 주위에 데스크톱 층을 더하는 위치"
      ],
      "zh": [
        "DSH 是其支持的多个运行时之一，直接复用已登录的 dsh CLI，无需二次配置账号",
        "四项桌面层能力：快速唤起（双 ⌘）、定时自动化（at/every/cron/daily）、全局快速回复（双击右 ⌥）、屏幕上下文",
        "macOS 应用，从 Releases 下载；定位是给 agent 补桌面层，而不是替代 agent"
      ]
    },
    "installCmd": "# macOS 桌面应用，从 Releases 下载（Apple Silicon）\nhttps://github.com/drewnekota/cetus/releases/latest\n# 装好后在运行时选择器里选已登录的 dsh CLI，复用现有登录，无需二次配置"
  },
  "dsh-market/dsh-market": {
    "intro": {
      "en": "This moves the whole find-install-update loop into the DSH settings page. Install with one line — `dsh plugin --profile web add dshmarket` — restart `dsh web`, and open Settings → Plugin Market. The catalog holds 300+ plugins and grows daily, with category filters, star counts, top/new sorting, and bilingual descriptions that follow your UI language. Themes get their own tab: install and it's active immediately, switch with one click, themes are mutually exclusive and your choice survives restarts, and uninstalling reverts. Installs start by confirming the source, then show live progress; most plugins go live after a page refresh with no restart. Updates are checked per plugin — npm version, or a pinned commit against HEAD — so you can update one at a time or everything at once, and the market updates itself the same way. Uninstall is a two-step confirm, and plugins installed during the session are removed live. Security comes in layers: installs are restricted to sources listed in the curated awesome-dsh-plugin registry and anything else is rejected; build scripts stay blocked by default (pnpm ≥10) and allowing one is your explicit per-package choice; plugins that would put a terminal or CLI surface into the web profile are flagged before install; the install endpoint accepts same-origin POST only, and the market never phones home. On speed, installs prefer npm tarballs over full-repo GitHub downloads whenever a plugin publishes to npm (registry-verified against the repo to prevent name squatting), usually finishing in seconds. If a component like pnpm is missing, the market detects it and offers a one-click setup, and one click produces a sanitized log for bug reports — home paths and credential shapes masked, nothing sent anywhere.",
      "ja": "プラグインを探す・入れる・更新するという一連の動作を、まるごと DSH の設定画面に移す。`dsh plugin --profile web add dshmarket` の 1 行で導入し、`dsh web` を再起動して設定 → プラグインマーケットを開けばよい。カタログには 300 以上のプラグインがあり日々増えている。カテゴリ絞り込み、スター数表示、人気/新着の並べ替えに対応し、説明はバイリンガルで UI 言語に追従する。テーマは独立したタブを持つ。導入すれば即座に有効になり、ワンクリックで切り替えられ、テーマ同士は排他で選択は再起動をまたいで保持され、アンインストールすれば元に戻る。インストールはまず提供元を確認してから、進捗をリアルタイムで表示する。多くのプラグインはページを再読み込みするだけで有効になり、再起動は不要だ。更新はプラグインごとにチェックされ（npm のバージョン、あるいは固定した commit と HEAD の比較）、個別にも一括にも更新でき、マーケット自身も同じ仕組みで更新される。アンインストールは 2 段階確認で、そのセッション中に入れたプラグインはリアルタイムで取り除かれる。セキュリティは層をなしている。インストール元は厳選された awesome-dsh-plugin レジストリに載っているものに限定され、それ以外は拒否される。ビルドスクリプトは既定でブロックされたまま（pnpm ≥10）で、許可するかどうかはパッケージごとの明示的な選択だ。ターミナル/CLI の面を web profile に持ち込むプラグインは導入前に印が付く。インストールのエンドポイントは同一オリジンの POST しか受け付けず、マーケットが外部に情報を送ることはない。速度面では、npm に公開されているプラグインならリポジトリ全体のダウンロードより npm tarball を優先し（名前の先取りを防ぐためレジストリとリポジトリを突き合わせて検証）、たいてい数秒で終わる。pnpm のような構成要素が欠けていればマーケットが検知してワンクリック設定を提示し、不具合報告用にはワンクリックで匿名化ログを生成できる（ホームディレクトリのパスや資格情報の形はマスクされ、どこにも送信されない）。",
      "ko": "플러그인을 찾고 설치하고 업데이트하는 흐름을 통째로 DSH 설정 화면으로 옮긴다. `dsh plugin --profile web add dshmarket` 한 줄로 설치하고 `dsh web`을 재시작한 뒤 설정 → 플러그인 마켓을 열면 된다. 카탈로그에는 300개가 넘는 플러그인이 있고 매일 늘어난다. 분류 필터와 스타 수 표시, 인기·최신 정렬을 지원하며 설명은 이중 언어로 UI 언어를 따라간다. 테마는 독립된 탭을 갖는다. 설치하면 바로 적용되고 원클릭으로 전환되며, 테마끼리는 배타적이고 선택은 재시작을 견디며, 제거하면 원래대로 돌아간다. 설치는 먼저 출처를 확인한 뒤 실시간 진행 상황을 보여 준다. 대부분의 플러그인은 페이지만 새로 고치면 적용되고 재시작이 필요 없다. 업데이트는 플러그인별로 확인되며(npm 버전 또는 고정 commit과 HEAD 비교) 하나씩도 한 번에 전부도 가능하고, 마켓 자신도 같은 방식으로 갱신된다. 제거는 2단계 확인이고, 이번 세션에 설치한 플러그인은 실시간으로 제거된다. 보안은 여러 겹이다. 설치 출처는 엄선된 awesome-dsh-plugin 레지스트리에 등재된 것으로 제한되고 그 외에는 거부된다. 빌드 스크립트는 기본적으로 차단된 상태(pnpm ≥10)이며 허용 여부는 패키지마다 사용자가 명시적으로 정한다. 터미널·CLI 표면을 web profile에 들이는 플러그인은 설치 전에 표시된다. 설치 엔드포인트는 동일 출처 POST만 받고, 마켓이 외부로 정보를 보내는 일은 없다. 속도 면에서는 npm에 게시된 플러그인이라면 저장소 전체 다운로드 대신 npm tarball을 우선하며(이름 선점을 막기 위해 레지스트리와 저장소를 대조 검증) 보통 몇 초면 끝난다. pnpm 같은 구성 요소가 없으면 마켓이 감지해 원클릭 설정을 제안하고, 버그 신고용으로는 한 번의 클릭으로 익명화된 로그를 만들 수 있다(홈 경로와 자격 증명 형태는 마스킹되며 어디로도 전송되지 않는다).",
      "zh": "把找插件、装插件、更新插件这套动作全搬进 DSH 设置页。一行 `dsh plugin --profile web add dshmarket` 装好，重启 `dsh web` 后打开设置 → 插件市场即可。目录有 300 多个插件且每天在长，支持分类筛选、星数展示、热门/最新排序，描述是双语的并跟随你的界面语言。主题单独一个标签页：装上立即生效，一键切换，主题之间互斥且选择能扛住重启，卸载即还原。安装时先确认来源再看实时进度，多数插件刷新页面就生效不用重启。更新是逐插件检查的——npm 版本或钉住的 commit 对比 HEAD——可以单个更新也可以一次性全更，市场自己也走同一套更新方式。卸载是两步确认，本次会话装的插件会实时移除。安全上有几层：安装来源限定在 awesome-dsh-plugin 精选注册表内，其他一律拒绝；构建脚本默认保持阻止（pnpm ≥10），要放行是你逐包的明确选择；会往 web profile 里塞终端/CLI 界面的插件会在安装前被标出来；安装端点只接受同源 POST，市场从不回传数据。速度上，只要插件发布到 npm 就优先走 npm tarball 而不是整仓下载（并与仓库做注册表校验防抢注），通常几秒完成。缺 pnpm 这类组件时会自动检测并提供一键补装，出问题可一键导出脱敏日志（家目录路径和凭据形状都会打码，且不会发往任何地方）。"
    },
    "highlights": {
      "en": [
        "Browse and search 300+ community plugins in Settings → Plugin Market, with category filters, star counts, top/new sorting and language-following descriptions",
        "A dedicated Themes tab: install to activate instantly, switch in one click, mutually exclusive, choice survives restarts, uninstall reverts",
        "Per-plugin update checks (npm version or pinned commit vs HEAD), one at a time or all at once — the market updates itself the same way",
        "Installs restricted to the curated registry, build scripts blocked by default with explicit per-package opt-in, terminal-surface plugins flagged, same-origin POST only"
      ],
      "ja": [
        "設定 → プラグインマーケットで 300 以上のコミュニティプラグインを閲覧・検索。カテゴリ絞り込み、スター数、人気/新着並べ替え、UI 言語追従の説明",
        "テーマ専用タブ：導入で即有効、ワンクリック切替、排他で選択は再起動後も保持、アンインストールで復元",
        "プラグインごとの更新チェック（npm バージョンまたは固定 commit と HEAD の比較）、個別/一括どちらも可能。マーケット自身も同じ方式で更新",
        "インストール元は厳選レジストリに限定、ビルドスクリプトは既定ブロックでパッケージ単位の明示許可制、ターミナル系は事前に警告、同一オリジン POST のみ受付"
      ],
      "ko": [
        "설정 → 플러그인 마켓에서 300+ 커뮤니티 플러그인 탐색·검색. 분류 필터, 스타 수, 인기·최신 정렬, UI 언어를 따르는 설명",
        "테마 전용 탭: 설치 즉시 적용, 원클릭 전환, 상호 배타적이며 선택은 재시작 후에도 유지, 제거 시 복원",
        "플러그인별 업데이트 확인(npm 버전 또는 고정 commit 대 HEAD), 개별·일괄 모두 가능. 마켓 자신도 같은 방식으로 갱신",
        "설치 출처를 엄선 레지스트리로 제한, 빌드 스크립트는 기본 차단에 패키지 단위 명시 허용, 터미널 계열은 설치 전 표시, 동일 출처 POST만 수신"
      ],
      "zh": [
        "设置 → 插件市场里浏览搜索 300+ 社区插件，分类筛选、星数、热门/最新排序，描述跟随界面语言",
        "主题独立标签页：装上即生效、一键切换、互斥且选择扛重启，卸载即还原",
        "逐插件更新检查（npm 版本或钉住 commit 对比 HEAD），可单更也可一键全更，市场自身同样方式更新",
        "安装来源限定精选注册表，构建脚本默认阻止需逐包放行，终端类插件安装前标注，端点只收同源 POST"
      ]
    }
  },
  "freehul/sgme": {
    "intro": {
      "en": "SGME fixes the fact that AI treats every conversation as a first meeting: sessions land as raw L0 records, get distilled into tagged structured memories (facts, preferences, project state, decisions) with automatic dedup, merge and contradiction detection, and only the scenario-relevant subset is injected next time — casual chat gets identity and recent status, coding gets the project's stack and past pitfalls. Every memory traces back to its original conversation, and multiple agents (Hermes, dsh, …) share one memory brain. This entry is its dsh adapter: a native TS plugin on the Cordis SDK with zero runtime Python, injecting profile and relevant memories at agent/pre-step, registering the memory_search and wiki_search tools plus the /sgme command, and writing sessions back to SGME at turn/end to trigger distillation. ⚠️ Prerequisite: the plugin is only the bridge — the memory itself lives in the SGME server (a Python service, HTTP :9910 by default). Deploy and start SGME first, run adapters/dsh/install.py to register an agent and write SGME_AGENT_KEY / SGME_ADMIN_KEY into .env, and confirm /v1/health returns 200. Skip that and the plugin does nothing.",
      "ja": "SGME は「AI が毎回初対面になる」問題を解く：会話をまず L0 生ログとして保存し、タグ付き構造化記憶（事実・好み・プロジェクト状態・決定）へ蒸留、重複排除・統合・矛盾検出を自動で行い、次の対話ではシーンに関係する分だけを注入する——雑談なら人物像と近況、コーディングならプロジェクトの技術スタックと踏んだ地雷。どの記憶も元の会話まで遡れ、複数の Agent（Hermes、dsh…）が同じ記憶の脳を共有する。本エントリはその dsh アダプタ：Cordis プラグイン SDK による TS ネイティブプラグインで実行時 Python 依存はゼロ、agent/pre-step でプロフィールと関連記憶を注入し、memory_search / wiki_search ツールと /sgme コマンドを登録、turn/end で会話を SGME へ書き戻して蒸留を起動する。⚠️ 前提条件：プラグインは橋渡しに過ぎず、記憶機能は SGME 本体（Python サービス、既定 HTTP :9910）にある。先に SGME を配備・起動し、adapters/dsh/install.py で agent を登録して SGME_AGENT_KEY / SGME_ADMIN_KEY を .env に書き、/v1/health が 200 を返すことを確認すること。これを飛ばすと記憶機能は一切働かない。",
      "ko": "SGME는 'AI가 매번 첫 만남처럼 구는' 문제를 푼다: 대화를 먼저 L0 원본 기록으로 남기고 태그가 붙은 구조화 기억(사실·선호·프로젝트 상태·결정)으로 증류하며, 중복 제거·병합·모순 감지를 자동으로 수행한 뒤 다음 대화에는 상황에 맞는 부분만 주입한다——잡담이면 정체성과 근황, 코딩이면 프로젝트 기술 스택과 밟았던 지뢰. 모든 기억은 원본 대화까지 되짚을 수 있고, 여러 Agent(Hermes, dsh…)가 같은 기억 두뇌를 공유한다. 이 항목은 그 dsh 어댑터다: Cordis 플러그인 SDK 기반 TS 네이티브 플러그인으로 런타임 Python 의존이 없고, agent/pre-step에서 프로필과 관련 기억을 주입하며 memory_search / wiki_search 도구와 /sgme 명령을 등록하고, turn/end에 세션을 SGME로 되돌려 증류를 트리거한다. ⚠️ 선행 조건: 플러그인은 다리일 뿐이고 기억 기능은 SGME 본체(Python 서비스, 기본 HTTP :9910)에 있다. 먼저 SGME를 배포·기동하고 adapters/dsh/install.py로 agent를 등록해 SGME_AGENT_KEY / SGME_ADMIN_KEY를 .env에 쓴 뒤 /v1/health가 200인지 확인해야 한다. 건너뛰면 기억 기능은 전혀 동작하지 않는다.",
      "zh": "SGME（拾光记忆引擎）解决的是「AI 每次对话都像初次见面」：会话先落成 L0 原始记录，再提炼成带标签的结构化记忆（事实、偏好、项目状态、决策），自动去重、合并与矛盾检测，下次对话按场景只注入相关的那部分——闲聊给身份与近况，写代码给项目技术栈与踩过的坑。每条记忆都能一路回溯到原始对话，多个 Agent（Hermes、dsh……）共享同一个记忆大脑。本条目收录的是它的 dsh 适配器：走 Cordis 插件 SDK 的原生 TS 插件，运行时零 Python 依赖，在 agent/pre-step 首步注入画像与相关记忆，注册 memory_search / wiki_search 两个工具与 /sgme 命令，并在 turn/end 时把会话写回 SGME 并触发提炼。⚠️ 重要前置：插件只是桥接层，记忆能力全在 SGME 本体（Python 服务，默认 HTTP :9910）。装插件前需先部署并启动 SGME 本体，运行 adapters/dsh/install.py 注册 agent 拿到 SGME_AGENT_KEY / SGME_ADMIN_KEY 写入 .env，确认 /v1/health 返回 200——跳过这步装完不会有任何记忆功能。"
    },
    "highlights": {
      "en": [
        "⚠️ Requires a self-hosted SGME server (Python service on :9910) plus install.py for keys — this is the dsh-side bridge only",
        "Sessions are captured and distilled into structured memory, injected per scenario: identity for chat, stack and pitfalls for coding",
        "Every memory is traceable back to its source conversation; multiple agents share one memory brain across devices",
        "Native TS plugin (Cordis SDK), zero runtime Python; ships memory_search / wiki_search tools and the /sgme command"
      ],
      "ja": [
        "⚠️ SGME 本体（Python サービス :9910）の自前構築と install.py での鍵取得が必須。本プラグインは dsh 側の橋渡しのみ",
        "会話を自動で蓄積・構造化しシーン別に注入：雑談には人物像と近況、コーディングには技術スタックと地雷履歴",
        "記憶は元の会話まで遡れる。複数 Agent が同じ記憶の脳を共有し、デバイスを跨いでも忘れない",
        "TS ネイティブプラグイン（Cordis SDK）で実行時 Python 依存ゼロ。memory_search / wiki_search と /sgme を提供"
      ],
      "ko": [
        "⚠️ SGME 본체(Python 서비스 :9910) 자체 구축과 install.py 키 발급이 필수. 이 플러그인은 dsh 쪽 다리일 뿐",
        "세션을 자동 수집·구조화해 상황별로 주입: 잡담엔 정체성과 근황, 코딩엔 기술 스택과 지뢰 이력",
        "모든 기억을 원본 대화까지 추적 가능. 여러 Agent가 같은 기억 두뇌를 공유해 기기를 옮겨도 잊지 않는다",
        "TS 네이티브 플러그인(Cordis SDK)으로 런타임 Python 의존 제로. memory_search / wiki_search와 /sgme 제공"
      ],
      "zh": [
        "⚠️ 需自建 SGME 本体（Python 服务 :9910）并跑 install.py 拿 key，本插件只是 dsh 侧桥接，单装无效",
        "会话自动入库并提炼成结构化记忆，按场景注入：闲聊给身份近况，写代码给项目技术栈与踩坑记录",
        "记忆可溯源——任一条画像陈述都能回查到原始对话；多个 Agent 共享同一记忆大脑，跨设备不失忆",
        "原生 TS 插件（Cordis SDK），运行时零 Python 依赖；提供 memory_search / wiki_search 工具与 /sgme 命令"
      ]
    }
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
  "hikariming/dshfind": {
    "intro": {
      "en": "dshfind sets out to answer three questions: how DSH actually works, which plugins exist, and how other people build them. The principles track is a structured course that runs from the basics all the way into a chapter-by-chapter reading of the Cordis paper — monads, coeffects, revertible effects, effect composition, spatiotemporal composability, all unpacked. The plugin marketplace is a live index aggregated straight from GitHub's `dsh-plugin` topic, so adding that topic to your own public repository is enough to have it appear at the next data refresh; there is no submission form. The best-practices track collects plugin development guides, a glossary, and community rankings for both authors and projects. The site itself is open source: Next.js 16 App Router with React 19, next-intl for internationalization, lesson content as MDX under `src/content/lessons`, Tailwind CSS for styling, deployed on Vercel. Issues and PRs are welcome for both lessons and UI strings.",
      "ja": "dshfind が答えようとしているのは 3 つの問いだ。DSH は実際どう動いているのか、どんなプラグインがあるのか、他の人はどう作っているのか。原理のトラックは体系的な講座で、基礎から Cordis 論文の章ごとの深掘りまで続く——monad、coeffect、取り消し可能な副作用、副作用の合成、時空的合成可能性といった概念を一つずつ解きほぐす。プラグインマーケットは GitHub の `dsh-plugin` トピックからそのまま自動集約されるライブインデックスなので、自分の公開リポジトリにそのトピックを付けるだけで次のデータ更新時に掲載される。申請フォームは存在しない。ベストプラクティスのトラックには、プラグイン開発ガイド、用語集、そして作者とプロジェクトのコミュニティランキングが集まっている。サイト自体もオープンソースで、Next.js 16 App Router と React 19、国際化に next-intl、講座本文は `src/content/lessons` 配下の MDX、スタイルは Tailwind CSS、Vercel にデプロイされている。講座も UI 文言も Issue と PR を歓迎している。",
      "ko": "dshfind가 답하려는 질문은 세 가지다. DSH는 실제로 어떻게 돌아가는가, 어떤 플러그인이 있는가, 다른 사람들은 어떻게 만드는가. 원리 트랙은 체계적인 강의로, 기초부터 Cordis 논문의 장별 심화까지 이어진다 — 모나드, coeffect, 되돌릴 수 있는 부수효과, 효과 합성, 시공간 합성 가능성 같은 개념을 하나씩 풀어낸다. 플러그인 마켓은 GitHub의 `dsh-plugin` 토픽에서 곧바로 자동 집계되는 실시간 인덱스라서, 자기 공개 저장소에 그 토픽만 붙이면 다음 데이터 갱신 때 등재된다. 제출 양식 같은 건 없다. 모범 사례 트랙에는 플러그인 개발 가이드와 용어집, 그리고 작성자와 프로젝트의 커뮤니티 랭킹이 모여 있다. 사이트 자체도 오픈소스다. Next.js 16 App Router와 React 19, 국제화에는 next-intl, 강의 본문은 `src/content/lessons` 아래 MDX, 스타일은 Tailwind CSS, Vercel에 배포되어 있다. 강의든 UI 문구든 Issue와 PR을 환영한다.",
      "zh": "dshfind 想回答三个问题：DSH 到底是怎么运转的、有哪些插件能用、别人是怎么写的。原理部分是一套结构化课程，从最基础一路讲到 Cordis 论文的逐章深入——monad、coeffect、可撤销副作用、副作用组合、时空可组合性这些概念都拆开讲。插件市场是一份实时索引，直接从 GitHub 的 `dsh-plugin` topic 自动聚合，所以你只要给自己的公开仓库打上这个 topic，下一次数据刷新时它就会出现在市场里，不用提交申请。最佳实践部分收了插件开发指南、术语表，以及作者与项目的社区排行榜。站点本身也是开源的：Next.js 16 App Router 加 React 19，next-intl 做国际化，课程正文是 `src/content/lessons` 下的 MDX，Tailwind CSS 样式，部署在 Vercel 上。课程和 UI 文案都欢迎提 Issue 和 PR。"
    },
    "highlights": {
      "en": [
        "Structured lessons from DSH fundamentals to a chapter-by-chapter dive into the Cordis paper — monads, coeffects, revertible effects, spatiotemporal composability",
        "Plugin marketplace auto-aggregated from the GitHub `dsh-plugin` topic: tag your public repo and it appears at the next refresh",
        "Plugin development guides, a glossary, and community rankings of authors and projects",
        "The site is open source: Next.js 16 App Router + React 19 + next-intl, lessons authored in MDX, issues and PRs welcome"
      ],
      "ja": [
        "体系的な講座：DSH の基礎から Cordis 論文の章ごとの読み解きまで——monad、coeffect、取り消し可能な副作用、時空的合成可能性",
        "プラグインマーケットは GitHub `dsh-plugin` トピックから自動集約、公開リポジトリにトピックを付ければ次回更新で掲載",
        "プラグイン開発ガイド、用語集、作者とプロジェクトのコミュニティランキング",
        "サイトもオープンソース：Next.js 16 App Router + React 19 + next-intl、講座本文は MDX。Issue と PR を歓迎"
      ],
      "ko": [
        "체계적 강의: DSH 기초부터 Cordis 논문 장별 해설까지 — 모나드, coeffect, 되돌릴 수 있는 부수효과, 시공간 합성 가능성",
        "플러그인 마켓은 GitHub `dsh-plugin` 토픽에서 자동 집계 — 공개 저장소에 토픽을 붙이면 다음 갱신 때 등재",
        "플러그인 개발 가이드, 용어집, 작성자와 프로젝트의 커뮤니티 랭킹",
        "사이트도 오픈소스: Next.js 16 App Router + React 19 + next-intl, 강의 본문은 MDX. Issue와 PR 환영"
      ],
      "zh": [
        "系统课程：从 DSH 入门一路到 Cordis 论文逐章拆解——monad、coeffect、可撤销副作用、时空可组合性",
        "插件市场按 GitHub `dsh-plugin` topic 自动聚合，给公开仓库打上 topic 即会在下次刷新时收录",
        "插件开发指南、术语表，以及作者与项目的社区排行榜",
        "站点开源：Next.js 16 App Router + React 19 + next-intl，课程正文为 MDX，欢迎提 Issue 与 PR"
      ]
    }
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
  "hust-open-atom-club/oh-dsh": {
    "intro": {
      "en": "A DSH distribution from HUST's Open Atom Open Source Club. It packages DeepSeek Harness, the Node runtime, local dev tooling and built-in plugins into installable Desktop / Web / TUI builds — no separate Node install, no plugin-by-plugin setup. The local workbench brings Workspace, PTY terminal, browser, file tree, Git Review, side chat and trajectory under one roof; every plugin marketplace change lands in an isolated preview first, so you can inspect the risk before applying and roll back afterwards. Upstream dsh-TUI and DSH-better-sidebar keep their implementations and attribution intact — Oh-DSH adds the unified launcher, profiles, data directory and cross-surface skins on top.",
      "ja": "華中科技大学 Open Atom オープンソースクラブ製の DSH ディストリビューション。DeepSeek Harness、Node ランタイム、ローカル開発ツール、内蔵プラグインをまとめて Desktop / Web / TUI のインストール可能なビルドに同梱——Node の別途インストールも、プラグインの個別設定も不要です。ローカルワークベンチが Workspace、PTY ターミナル、ブラウザ、ファイル、Git Review、サイドチャット、Trajectory を一箇所に集約。プラグインマーケットの変更は必ず隔離プレビューを経由するため、適用前にリスクを確認でき、後から元に戻せます。上流の dsh-TUI と DSH-better-sidebar は実装もクレジットもそのまま維持し、Oh-DSH は統一ランチャー・プロファイル・データディレクトリ・横断スキンを上に足すだけです。",
      "ko": "화중과기대 Open Atom 오픈소스 클럽이 만든 DSH 배포판. DeepSeek Harness와 Node 런타임, 로컬 개발 도구, 내장 플러그인을 한데 묶어 Desktop / Web / TUI 설치본으로 제공합니다 — Node를 따로 깔 필요도, 플러그인을 하나씩 설정할 필요도 없습니다. 로컬 워크벤치가 Workspace, PTY 터미널, 브라우저, 파일, Git Review, 사이드 챗, Trajectory를 한곳에 모아주고, 플러그인 마켓의 모든 변경은 격리 미리보기를 먼저 거치므로 적용 전에 위험을 확인하고 이후에도 되돌릴 수 있습니다. 상류 프로젝트인 dsh-TUI와 DSH-better-sidebar의 구현과 저작자 표기는 그대로 유지하며, Oh-DSH는 그 위에 통합 런처와 프로필, 데이터 디렉터리, 크로스 플랫폼 스킨을 더합니다.",
      "zh": "华科开放原子开源俱乐部出品的 DSH 发行版。把 DeepSeek Harness、Node runtime、本地开发工具与内置插件一起打包成可安装的 Desktop / Web / TUI 三种形态——不用先装 Node，也不用逐个配插件，下载即用。本地工作台统一组织 Workspace、PTY 终端、浏览器、文件、Git Review、Side chat 与 Trajectory；插件市场的每次变更先进隔离预览，确认无风险再应用，随时可撤销回上一状态。上游 dsh-TUI 与 DSH-better-sidebar 的实现与署名都完整保留，Oh-DSH 只在其上补统一启动器、Profile、数据目录与跨端皮肤。"
    },
    "highlights": {
      "en": [
        "One `ohdsh` command for Desktop / Web / TUI — shared sessions and credentials, separate profiles",
        "Builds ship a pinned DSH and Node runtime, so nothing else to install; pick full, Web-only or TUI-only",
        "Plugin installs, updates and removals stage into an isolated preview — inspect before applying, undo after",
        "Git Review sidebar: working-tree and commit diffs, line-level review comments, commit and push in place",
        "Releases for macOS / Windows / Linux (DMG, installer, AppImage, deb), MIT licensed"
      ],
      "ja": [
        "`ohdsh` 一つで Desktop / Web / TUI を起動。セッションと認証情報は共有、プロファイルは独立",
        "配布物にバージョン固定の DSH と Node ランタイムを同梱。フル版 / Web のみ / TUI のみを選択可能",
        "プラグインの導入・更新・削除は隔離プレビュー経由。適用前に確認、適用後も巻き戻し可能",
        "Git Review サイドバー：作業ツリーと commit の diff、行単位のレビューコメント、その場でコミットとプッシュ",
        "macOS / Windows / Linux 向けリリース完備（DMG・インストーラ・AppImage・deb）、MIT ライセンス"
      ],
      "ko": [
        "`ohdsh` 명령 하나로 Desktop / Web / TUI 실행 — 세션과 자격 증명은 공유, 프로필은 분리",
        "배포본에 버전 고정된 DSH와 Node 런타임 포함해 별도 설치 불필요. 풀 / Web 전용 / TUI 전용 선택 가능",
        "플러그인 설치·업데이트·삭제가 격리 미리보기로 먼저 반영 — 적용 전 점검, 적용 후 롤백",
        "Git Review 사이드바: 작업 트리와 커밋 diff, 라인 단위 리뷰 코멘트, 그 자리에서 커밋과 푸시",
        "macOS / Windows / Linux 릴리스 완비(DMG, 인스톨러, AppImage, deb), MIT 라이선스"
      ],
      "zh": [
        "一个 ohdsh 命令启动 Desktop / Web / TUI，三端共享会话与凭据、各自保留 Profile",
        "发行包自带固定版本 DSH 与 Node runtime，免装运行环境；可选完整版 / Web-only / TUI-only",
        "插件市场的安装、更新、卸载先进隔离预览，应用前可查风险、事后可回滚",
        "Git Review 侧边栏：看工作区改动与 commit diff、逐行写 review comment、直接提交推送",
        "macOS / Windows / Linux 三平台 Release 齐全（DMG、安装包、AppImage、deb），MIT 协议"
      ]
    },
    "installCmd": "# 从 Releases 选发行形态：完整版 / Web-only / TUI-only\nhttps://github.com/hust-open-atom-club/oh-dsh/releases/latest"
  },
  "hyhmrright/brooks-lint": {
    "intro": {
      "en": "Most code-quality tools count lines and cyclomatic complexity. brooks-lint goes deeper: it distills the judgment in twelve classics — The Mythical Man-Month, Code Complete, Refactoring, Clean Architecture, Domain-Driven Design, A Philosophy of Software Design and more — into six production decay risks and six test decay risks, then has the agent diagnose against that yardstick. Findings never stop at \"this looks bad\": each one arrives as Symptom → Source → Consequence → Remedy, traceable to a specific argument in a specific book, and rolls up into a 0–100 health score. Six slash commands cover the usual jobs: `/brooks-review` for PRs, `/brooks-audit` for architecture, `/brooks-debt` for technical debt, `/brooks-test` for test suites, `/brooks-health` for the score, and `/brooks-sweep` for a full sweep with auto-fix. On DSH it installs into `~/.dsh/skills`, and the same skill runs on Codex, Cursor, Copilot and a dozen other hosts.",
      "ja": "多くのコード品質ツールは行数と循環的複雑度を数えるだけだが、brooks-lint は別の道を選んだ。『人月の神話』『Code Complete』『リファクタリング』『Clean Architecture』『エリック・エヴァンスのドメイン駆動設計』『ソフトウェア設計の哲学』など 12 冊の古典に書かれた判断基準を、6 つの「本番コード劣化リスク」と 6 つの「テスト劣化リスク」に蒸留し、Agent にその物差しで診断させる。出力は「ここが良くない」で終わらず、症状 → 出典 → 帰結 → 対処の 4 段構成で、どの本のどの主張に基づくかまで辿れる。最後に 0〜100 の健全性スコアにまとまる。6 つのスラッシュコマンドが役割を分担する：`/brooks-review` は PR、`/brooks-audit` はアーキテクチャ、`/brooks-debt` は技術的負債、`/brooks-test` はテスト、`/brooks-health` はスコア、`/brooks-sweep` は全体走査と自動修正。DSH では `~/.dsh/skills` に入れるだけで使え、同じ Skill が Codex・Cursor・Copilot など十数のホストでも動く。",
      "ko": "대부분의 코드 품질 도구는 줄 수와 순환 복잡도만 센다. brooks-lint는 다른 길을 택했다. 『맨먼스 미신』, 『Code Complete』, 『리팩터링』, 『클린 아키텍처』, 『도메인 주도 설계』, 『소프트웨어 설계의 철학』 등 12권의 고전에 담긴 판단 기준을 6가지 '프로덕션 코드 부패 위험'과 6가지 '테스트 부패 위험'으로 증류해, 에이전트가 그 잣대로 진단하게 한다. 결과는 '여기가 별로다'로 끝나지 않고 증상 → 출처 → 결과 → 처방의 네 단계로 나오며, 어떤 책의 어떤 주장에 근거했는지까지 추적된다. 마지막에는 0~100 건강 점수로 정리된다. 여섯 개의 슬래시 명령이 용도를 나눈다. `/brooks-review`는 PR, `/brooks-audit`은 아키텍처, `/brooks-debt`는 기술 부채, `/brooks-test`는 테스트, `/brooks-health`는 점수, `/brooks-sweep`은 전체 스캔과 자동 수정. DSH에서는 `~/.dsh/skills`에 넣으면 바로 쓸 수 있고, 같은 Skill이 Codex·Cursor·Copilot 등 십여 개 호스트에서도 동작한다.",
      "zh": "大多数代码质量工具只会数行数和圈复杂度，brooks-lint 换了个路子：把《人月神话》《代码大全》《重构》《整洁架构》《领域驱动设计》《软件设计的哲学》等十二本经典里的判断标准，蒸馏成六个「生产代码腐化风险」和六个「测试腐化风险」，让 Agent 照着这套尺子体检。输出不是一句「这里写得不好」，而是「症状 → 出处 → 后果 → 改法」四段式，每条都能追到具体哪本书的哪个论断，最后汇总成 0–100 的健康分。六个斜杠命令覆盖不同场景：`/brooks-review` 审 PR、`/brooks-audit` 审架构、`/brooks-debt` 盘技术债、`/brooks-test` 查测试、`/brooks-health` 出总分、`/brooks-sweep` 全量扫描并自动修。装到 DSH 上走 `~/.dsh/skills`，同一套 Skill 也能在 Codex、Cursor、Copilot 等十来个宿主上用。"
    },
    "highlights": {
      "en": [
        "Twelve engineering classics distilled into six production decay risks plus six test decay risks — every judgment has a source",
        "Findings come as Symptom → Source → Consequence → Remedy with book citations and severity labels, rolled up into a 0–100 health score",
        "Six purpose-built slash commands: review a PR, audit architecture, tally debt, check tests, score health, or sweep and auto-fix",
        "Drops into `~/.dsh/skills` for DSH, and the same skill works across Codex, Cursor, Copilot and other hosts"
      ],
      "ja": [
        "12 冊の工学古典を 6 つの本番劣化リスク + 6 つのテスト劣化リスクに蒸留、判断には必ず典拠がある",
        "各指摘は「症状 → 出典 → 帰結 → 対処」の形で書籍引用と深刻度つき、最後に 0〜100 の健全性スコア",
        "6 つのスラッシュコマンドで用途を分離：PR レビュー・アーキ監査・負債棚卸し・テスト点検・スコア算出・全体走査と自動修正",
        "`~/.dsh/skills` に置けば DSH で使え、同じ Skill が Codex / Cursor / Copilot などでも通用"
      ],
      "ko": [
        "12권의 공학 고전을 6가지 프로덕션 부패 위험 + 6가지 테스트 부패 위험으로 증류 — 모든 판단에 근거가 있다",
        "모든 지적이 '증상 → 출처 → 결과 → 처방' 형태로 서적 인용과 심각도를 달고 나오며, 0~100 건강 점수로 집계",
        "여섯 개 슬래시 명령으로 역할 분담: PR 리뷰·아키텍처 감사·부채 정리·테스트 점검·점수 산출·전체 스캔 자동 수정",
        "`~/.dsh/skills`에 넣으면 DSH에서 사용 가능하고, 같은 Skill이 Codex / Cursor / Copilot 등에서도 통용"
      ],
      "zh": [
        "十二本工程经典蒸馏成六大生产腐化风险 + 六大测试腐化风险，判断有据可查",
        "每条结论都是「症状 → 出处 → 后果 → 改法」，附书目引用与严重级别，最后给 0–100 健康分",
        "六个斜杠命令分工明确：审 PR、审架构、盘技术债、查测试、出总分、全量扫描自动修",
        "装进 `~/.dsh/skills` 即可在 DSH 使用，同一套 Skill 跨 Codex / Cursor / Copilot 等宿主通用"
      ]
    }
  },
  "libukai/awesome-deepseek-harness": {
    "intro": {
      "en": "This is a deliberately restrained list. The author states the principle up front — fewer but better — so it isn't a dump of every repository you could search up, but a filtered selection. The structure follows the path you'd actually take: the quick-start section covers launching the web UI, running from source, using the Python SDK and installing plugins; the official resources section collects install integrations, source repositories, official documentation and discussion communities; the community section gathers analysis tutorials and community discussion; third-party clients split into desktop and distributions versus terminal, mobile and web experiences; curated plugins are organized into four directions — workflow and agents, context/session/input, browser/vision/interface, and themes and skins; and the tail covers external integrations and developer tools. The document comes in Simplified Chinese, English and Japanese. The author is @libukai on 𝕏, posting ongoing practical content about agents.",
      "ja": "これは意図的に抑制されたリストだ。著者は最初に原則を明言している——少なく、良いものを。だから検索して出てくるリポジトリを片端から並べたものではなく、一度ふるいにかけた選集になっている。構成は実際にたどる道筋に沿っている。クイックスタートの節は Web UI の起動、ソースからの実行、Python SDK の利用、プラグインの導入をカバーする。公式資料の節にはインストール連携、ソースリポジトリ、公式ドキュメント、議論コミュニティが集まる。コミュニティ資料の節は解説チュートリアルとコミュニティでの議論。サードパーティクライアントはデスクトップとディストリビューション、そしてターミナル・モバイル・Web 体験の 2 系統に分かれる。厳選プラグインは 4 つの方向に分類されている——ワークフローと Agent、コンテキストとセッションと入力、ブラウザと視覚とインターフェース、テーマとスキン。末尾に外部連携と開発ツールが続く。ドキュメントは簡体中文・English・日本語の 3 版が用意されている。著者は 𝕏 の @李不凯正在研究 で、Agent 関連の実践的な内容を継続的に発信している。",
      "ko": "의도적으로 절제된 목록이다. 저자가 원칙을 먼저 밝힌다 — 적지만 좋은 것. 그래서 검색되는 저장소를 모조리 쌓아 둔 것이 아니라 한 번 걸러 낸 선집이다. 구성은 실제로 밟게 되는 경로를 따른다. 빠른 시작 절은 웹 UI 실행, 소스에서 실행하기, Python SDK 사용, 플러그인 설치를 다룬다. 공식 자료 절에는 설치 연동과 소스 저장소, 공식 문서, 토론 커뮤니티가 모인다. 커뮤니티 자료 절은 분석 튜토리얼과 커뮤니티 토론이다. 서드파티 클라이언트는 데스크톱·배포판과 터미널·모바일·웹 경험 두 갈래로 나뉜다. 엄선 플러그인은 네 방향으로 분류된다 — 워크플로와 에이전트, 컨텍스트·세션·입력, 브라우저·비전·인터페이스, 테마와 스킨. 끝으로 외부 연동과 개발 도구가 이어진다. 문서는 간체 중문, English, 日本語 세 판본으로 제공된다. 저자는 𝕏의 @libukai로, 에이전트 관련 실전 콘텐츠를 꾸준히 올린다.",
      "zh": "这是一份刻意克制的清单。作者明确说了要遵循「少而精」的原则，所以它不是把所有能搜到的仓库都堆上来，而是筛过一遍再收。结构按你实际会走的路径组织：快速开始部分覆盖启动 Web UI、从源码运行、使用 Python SDK 和安装插件；官方资源部分收了安装集成、源码仓库、官方文档和讨论社区；社区资源部分是分析教程与社区讨论；第三方客户端分成桌面与发行版、终端与移动与 Web 体验两类；精选插件按工作流与 Agent、上下文与会话与输入、浏览器与视觉与界面、主题与皮肤四个方向分类；最后是外部集成和开发工具。文档提供简体中文、English、日本語三个版本。作者是 𝕏 上的 @李不凯正在研究，会持续发 Agent 相关的实践内容。"
    },
    "highlights": {
      "en": [
        "Curated on a fewer-but-better principle — filtered rather than piled up",
        "Organized along the path you'd actually take: quick start (web UI / source / Python SDK / plugins) → official and community resources → third-party clients",
        "Curated plugins sorted into four directions: workflow and agents, context/session/input, browser/vision/interface, themes and skins",
        "Available in Simplified Chinese, English and Japanese, with external integrations and developer tools covered as well"
      ],
      "ja": [
        "「少なく、良いものを」の原則で厳選——並べ立てるのではなく、ふるいにかけたものだけを収録",
        "実際にたどる道筋で構成：クイックスタート（Web UI / ソース / Python SDK / プラグイン）→ 公式・コミュニティ資料 → サードパーティクライアント",
        "厳選プラグインは 4 方向に分類：ワークフローと Agent、コンテキスト・セッション・入力、ブラウザ・視覚・インターフェース、テーマとスキン",
        "簡体中文・English・日本語の 3 言語版を提供、外部連携と開発ツールも収録"
      ],
      "ko": [
        "'적지만 좋은 것' 원칙으로 엄선 — 나열이 아니라 걸러 낸 것만 수록",
        "실제 밟는 경로대로 구성: 빠른 시작(웹 UI / 소스 / Python SDK / 플러그인) → 공식·커뮤니티 자료 → 서드파티 클라이언트",
        "엄선 플러그인을 네 방향으로 분류: 워크플로와 에이전트, 컨텍스트·세션·입력, 브라우저·비전·인터페이스, 테마와 스킨",
        "간체 중문·English·日本語 3개 언어판 제공, 외부 연동과 개발 도구도 함께 수록"
      ],
      "zh": [
        "遵循「少而精」原则筛选，不堆砌，收进来的都是过了一遍的",
        "按实际路径组织：快速开始（Web UI / 源码 / Python SDK / 装插件）→ 官方与社区资源 → 第三方客户端",
        "精选插件按工作流与 Agent、上下文会话输入、浏览器视觉界面、主题皮肤四个方向分类",
        "提供简体中文、English、日本語三个语言版本，另收外部集成与开发工具"
      ]
    }
  },
  "liustack/modlens": {
    "intro": {
      "en": "The flagship DeepSeek and GLM chat models are text-only and cannot read images. ModLens is a bolt-on vision engine that restores that capability with a very short interaction path: paste the image directly into the composer and the plugin takes over through a native modlens_read_image tool. It also auto-discovers every provider route carrying a text-only DeepSeek or GLM model and adds a companion entry suffixed (modlens vision) for each, while automatically excluding both families' own vision models so nothing is taken over needlessly. The author's stated design goal is the lightest possible touch: no hooks, no wrappers, no local proxy daemon, and not a single line changed in any host config — on DSH it is exactly one plugin, and uninstalling is deleting it.",
      "ja": "DeepSeek と GLM のフラッグシップ対話モデルはテキスト専用で、画像を読めません。ModLens はその能力を後付けするビジョンエンジンで、操作経路が非常に短いのが特徴です——画像を入力欄に直接貼れば、ネイティブの modlens_read_image ツールが引き継ぎます。さらに、テキスト専用の DeepSeek / GLM モデルを載せた provider ルートを自動検出し、各ルートに (modlens vision) 付きのモデル項目を追加します。両ファミリー自身のビジョンモデルは自動的に除外され、不要な乗っ取りは起きません。作者が掲げる設計目標は「市場で最も軽い一層」であること：hook もラッパーもローカルプロキシも使わず、ホスト設定を一行も変更しません。DSH 上ではプラグイン一つ、アンインストールはそれを削除するだけです。",
      "ko": "DeepSeek과 GLM의 대표 대화 모델은 텍스트 전용이라 이미지를 읽지 못합니다. ModLens는 그 능력을 덧붙이는 비전 엔진으로, 조작 경로가 매우 짧습니다——이미지를 입력창에 그대로 붙여넣으면 네이티브 modlens_read_image 도구가 이어받습니다. 또한 텍스트 전용 DeepSeek / GLM 모델을 실은 provider 라우트를 모두 자동 발견해 라우트마다 (modlens vision) 접미사가 붙은 모델 항목을 추가하며, 두 계열 자체의 비전 모델은 자동 제외되어 불필요한 가로채기가 없습니다. 작성자가 내세우는 설계 목표는 「시장에서 가장 가벼운 한 겹」입니다: hook도 래퍼도 로컬 프록시 데몬도 없고 호스트 설정을 한 줄도 바꾸지 않습니다. DSH에서는 플러그인 하나이며, 제거는 그것을 지우는 것으로 끝납니다.",
      "zh": "DeepSeek 和 GLM 的旗舰对话模型是纯文本的，看不了图。ModLens 是一台外挂的视觉引擎，把「看图」这件事补回去，而且交互路径很短——图片直接粘进输入框，插件通过原生的 modlens_read_image 工具接手。它还会自动发现每一条承载纯文本 DeepSeek / GLM 模型的 provider 路由，为每条路由加一个带 (modlens vision) 后缀的模型条目，两家自己的视觉模型会被自动排除，不会被多此一举地接管。作者强调的是「市面上最轻的一层」：没有 hook、没有 wrapper、没有本地代理守护进程，也不改任何一行宿主配置，在 DSH 上就是一个插件，卸载就是删掉它。"
    },
    "highlights": {
      "en": [
        "Two paste routes: plain paste (temp file + modlens_read_image), or pick a (modlens vision) model entry to keep the thumbnail visible",
        "Auto-generates a vision entry per text-only DeepSeek/GLM route; native vision models are skipped",
        "No hooks, wrappers or local proxy, and no host config changes; the same author's ModSearch covers the web"
      ],
      "ja": [
        "貼り付け経路は 2 つ：そのまま貼る（一時ファイル + modlens_read_image）か、モデル選択で (modlens vision) を選びサムネイルを残すか",
        "テキスト専用の DeepSeek / GLM ルートごとにビジョン項目を自動生成、ネイティブのビジョンモデルは除外",
        "hook・ラッパー・ローカルプロキシなし、ホスト設定も無改変。同作者の ModSearch は Web を担当"
      ],
      "ko": [
        "붙여넣기 경로 두 가지: 그냥 붙여넣기(임시 파일 + modlens_read_image), 또는 모델 선택기에서 (modlens vision) 항목을 골라 썸네일 유지",
        "텍스트 전용 DeepSeek/GLM 라우트마다 비전 항목 자동 생성, 네이티브 비전 모델은 건너뜀",
        "hook·래퍼·로컬 프록시 없음, 호스트 설정 무변경. 같은 작성자의 ModSearch가 웹을 담당"
      ],
      "zh": [
        "两种粘贴路径：直接粘（走临时文件 + modlens_read_image），或在模型选择器里选 (modlens vision) 条目保留缩略图",
        "自动为每条纯文本 DeepSeek / GLM 路由生成视觉条目，原生视觉模型自动跳过",
        "零 hook、零 wrapper、零本地代理，不改宿主配置；同作者另有管网络的 ModSearch"
      ]
    }
  },
  "liustack/modsearch": {
    "intro": {
      "en": "Models like DeepSeek-V4-Flash either have no web access or a weak one. ModSearch fills that gap across three jobs: web search, X (Twitter) search, and single-page fetch. Its distinguishing trait is a swappable engine layer with automatic failover — the default is the free Antigravity CLI, with Tavily, Exa, Firecrawl, Grok (for X) and a local engine also supported; when one fails the next takes over, so an exhausted quota at one provider does not take the whole capability down. It pairs with the same author's ModLens: one supplies sight, the other supplies the web, and both follow the same design line — no host config changes, and install and uninstall are just one plugin.",
      "ja": "DeepSeek-V4-Flash のようなモデルはウェブアクセスを持たないか、あっても貧弱です。ModSearch はその穴を埋めるプラグインで、ウェブ検索・X（Twitter）検索・単一ページ取得の 3 つを担います。特徴は差し替え可能なエンジン層と自動フェイルオーバーです——既定は無料の Antigravity CLI で、Tavily・Exa・Firecrawl・Grok（X 担当）・ローカルエンジンにも対応し、一つが失敗すれば次に切り替わるため、あるプロバイダの割当を使い切っても機能全体が止まりません。同作者の ModLens と対になる設計で、片方が視覚、片方がウェブを補い、いずれもホスト設定を変更せず、導入も削除もプラグイン一つで完結します。",
      "ko": "DeepSeek-V4-Flash 같은 모델은 웹 접근이 없거나 약합니다. ModSearch는 그 공백을 메우는 플러그인으로 웹 검색, X(트위터) 검색, 단일 페이지 수집 세 가지를 담당합니다. 특징은 교체 가능한 엔진 계층과 자동 페일오버입니다——기본은 무료인 Antigravity CLI이며 Tavily·Exa·Firecrawl·Grok(X 담당)·로컬 엔진도 지원해, 하나가 실패하면 다음으로 넘어가므로 한 공급자의 할당량이 소진돼도 기능 전체가 멈추지 않습니다. 같은 작성자의 ModLens와 짝을 이루어 한쪽은 시각을, 한쪽은 웹을 채우며, 둘 다 호스트 설정을 바꾸지 않고 설치와 제거가 플러그인 하나로 끝납니다.",
      "zh": "像 DeepSeek-V4-Flash 这类模型要么没有联网能力，要么很弱。ModSearch 是补这一块的插件，覆盖三件事：网页搜索、X（推特）搜索、单页抓取。它的特点是引擎是可换的、且会自动故障转移——默认走免费的 Antigravity CLI，另外支持 Tavily、Exa、Firecrawl、Grok（负责 X）以及本地引擎，一个失败自动落到下一个，不会因为某家配额用尽就整个功能失灵。它和同作者的 ModLens 是一对：一个管眼睛，一个管网络，设计取向一致——不改宿主配置，装卸都只是一个插件。"
    },
    "highlights": {
      "en": [
        "Six engines with automatic failover: Antigravity CLI (free default), Tavily, Exa, Firecrawl, Grok (X), local",
        "Covers web search, X search and single-page fetch, with an explicit structured output contract",
        "Companion to the same author's ModLens: one adds vision, the other adds the web"
      ],
      "ja": [
        "6 エンジンの自動フェイルオーバー：Antigravity CLI（無料・既定）、Tavily、Exa、Firecrawl、Grok(X)、ローカル",
        "ウェブ検索・X 検索・単一ページ取得の 3 種をカバーし、出力は明確な構造化契約に従う",
        "同作者の ModLens と対：片方が視覚を、片方がウェブを補う"
      ],
      "ko": [
        "엔진 6개 자동 페일오버: Antigravity CLI(무료 기본), Tavily, Exa, Firecrawl, Grok(X), 로컬",
        "웹 검색·X 검색·단일 페이지 수집을 아우르며 출력은 명시적 구조화 계약을 따름",
        "같은 작성자의 ModLens와 짝: 하나는 시각을, 하나는 웹을 보완"
      ],
      "zh": [
        "六个引擎带自动故障转移：Antigravity CLI（免费默认）、Tavily、Exa、Firecrawl、Grok(X)、本地",
        "覆盖网页搜索、X 搜索与单页抓取三类任务，输出有明确的结构化契约",
        "与同作者的 ModLens 配套：一个补视觉，一个补网络"
      ]
    }
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
  "omdsh-dev/dsh-annotation": {
    "intro": {
      "en": "Select any text in an assistant reply to annotate it, and the annotation body may be left empty — that just marks the passage. Annotations accumulate across messages and turns, numbered from 1, and an \"Annotations ×N\" chip appears next to the input box; hover it to view every annotation and remove them one by one. Press Enter and the annotation block goes to the model together with whatever question is in the input box, so the model receives the full content — number, original passage and your note — and replies with `Annotation 1: …` through `Annotation N: …`, one per annotation, with every Annotation label in the reply rendered as a hoverable chip showing the annotated passage and your note. One detail is handled cleanly: the annotation block is removed from your own bubble's DOM the moment you send, before the browser paints, so there's zero flicker — the bubble keeps only the question plus that chip, and historical messages self-heal after a refresh. The numbered marker is a blue highlight anchored to the passage, viewport-anchored with collision avoidance, never lost when scrolled out of view. In form it's an official bundle plugin (`dsh.bundle` plus a `dsh.client` declaration in package.json, injected into the browser via client-modules, with the Node half an empty implementation) and it makes zero core changes — no DSH files are touched, `cordis.patch.yml` only inserts its own id once, and the profile patch stays `[]`.",
      "ja": "アシスタントの返信内の任意のテキストを選択すれば注釈を付けられる。注釈本文は空でもよく、その場合は単にその一節を印付けするだけになる。注釈はメッセージやターンをまたいで蓄積され、1 から番号が振られる。入力欄の横には「Annotations ×N」の小さなチップが現れ、ホバーすればすべての注釈を確認して 1 件ずつ削除できる。Enter を押すと、注釈ブロックが入力欄の質問と一緒にモデルへ送られる。モデルが受け取るのは完全な内容——番号・元の一節・あなたのメモ——で、`Annotation 1: …` から `Annotation N: …` まで注釈ごとに個別に返信し、返信中の各 Annotation ラベルは注釈された一節とメモを表示するホバー可能なチップとして描画される。細部の処理が丁寧だ。注釈ブロックは送信した瞬間に、ブラウザが描画する前に自分の吹き出しの DOM から取り除かれるのでちらつきがまったく無い。吹き出しには質問とそのチップだけが残り、過去のメッセージは再読み込み後に自己修復する。番号付きマーカーは一節に固定された青いハイライトで、ビューポート基準で配置され衝突回避も行うため、スクロールで視界から外れても失われない。形態としては公式 bundle プラグイン（`dsh.bundle` と package.json 内の `dsh.client` 宣言、client-modules 経由でブラウザに注入され、Node 側は空実装）で、コア改変はゼロ——DSH のファイルには一切触れず、`cordis.patch.yml` は自身の id を一度挿入するだけ、profile patch は `[]` のままだ。",
      "ko": "어시스턴트 답변의 아무 텍스트나 선택해 주석을 달 수 있고, 주석 본문은 비워 둬도 된다 — 그러면 그 구절을 표시하기만 하는 셈이다. 주석은 메시지와 턴을 넘나들며 쌓이고 1번부터 번호가 매겨진다. 입력창 옆에는 'Annotations ×N' 칩이 나타나고, 호버하면 모든 주석을 보고 하나씩 지울 수 있다. Enter를 누르면 주석 블록이 입력창의 질문과 함께 모델로 간다. 모델이 받는 것은 완전한 내용 — 번호와 원래 구절, 그리고 내 메모 — 이고, `Annotation 1: …`부터 `Annotation N: …`까지 주석마다 하나씩 답하며, 답변의 모든 Annotation 라벨은 주석이 달린 구절과 메모를 보여 주는 호버 칩으로 렌더링된다. 세부 처리가 깔끔하다. 주석 블록은 전송하는 순간, 브라우저가 그리기 전에 내 말풍선 DOM에서 제거되므로 깜빡임이 전혀 없다. 말풍선에는 질문과 그 칩만 남고, 지난 메시지는 새로고침 후 스스로 복원된다. 번호 마커는 구절에 고정된 파란 하이라이트로, 뷰포트 기준으로 배치되며 충돌 회피까지 하므로 스크롤로 화면을 벗어나도 사라지지 않는다. 형태는 공식 번들 플러그인(`dsh.bundle`과 package.json의 `dsh.client` 선언, client-modules로 브라우저에 주입되고 Node 쪽은 빈 구현)이며 코어 수정은 전혀 없다 — DSH 파일을 건드리지 않고, `cordis.patch.yml`은 자기 id를 한 번 넣을 뿐이며, profile patch는 `[]` 그대로다.",
      "zh": "在助手回复里选中任意文字就能批注，批注正文可以留空——那就只是标记这一段。批注会跨消息、跨回合累积，从 1 开始编号，输入框旁会出现一个「Annotations ×N」的小芯片，悬浮可以查看全部批注并逐条删除。按回车时，批注块和输入框里的问题会一起发给模型，模型收到的是完整内容（编号 + 原文段落 + 你的备注），并按格式指令逐条回复 `Annotation 1: …` … `Annotation N: …`，回复里的每个 Annotation 标签都渲染成可悬浮芯片，悬浮显示被批注的段落和你的备注。有个细节做得很干净：批注块在你发送的那一刻就从自己的气泡 DOM 里移除——在浏览器绘制之前完成，所以零闪烁——气泡里只留下问题加那个芯片，历史消息刷新后会自我修复。编号标记是锚定在段落上的蓝色高亮，视口锚定并做了碰撞避让，滚出视野也不会丢。形态上是官方 bundle 插件（`dsh.bundle` 加 package.json 里的 `dsh.client` 声明，通过 client-modules 注入浏览器，Node 那半是空实现），零核心改动——不碰任何 DSH 文件，`cordis.patch.yml` 只插入自己的 id 一次，profile patch 保持为 `[]`。"
    },
    "highlights": {
      "en": [
        "Select text in a reply to annotate it (an empty body just marks the passage); annotations accumulate across messages and turns, numbered from 1",
        "Enter sends the annotation block with your question, and the model replies `Annotation 1: …` one by one, with hoverable chips on every label",
        "The annotation block leaves your bubble before the browser paints — zero flicker, only question plus an \"Annotations ×N\" chip, with history self-healing on refresh",
        "Official bundle form with zero core changes: no DSH files touched, `cordis.patch.yml` inserts its own id once, profile patch stays `[]`"
      ],
      "ja": [
        "返信のテキストを選ぶだけで注釈（本文は空でも可＝一節の印付け）。メッセージ・ターンをまたいで蓄積し 1 から採番",
        "Enter で注釈ブロックが質問と一緒にモデルへ。モデルは `Annotation 1: …` と 1 件ずつ対応して返信、ラベルはホバー可能なチップ",
        "注釈ブロックは描画前に自分の吹き出しから除去されちらつきゼロ。残るのは質問 +「Annotations ×N」チップ、履歴は再読み込みで自己修復",
        "公式 bundle 形態でコア改変ゼロ：DSH ファイル不変、`cordis.patch.yml` は自 id を一度挿すのみ、profile patch は `[]` のまま"
      ],
      "ko": [
        "답변 텍스트를 선택하면 주석 작성(본문을 비우면 구절 표시만). 메시지와 턴을 넘나들며 쌓이고 1번부터 번호 부여",
        "Enter로 주석 블록이 질문과 함께 모델에 전달되고, 모델은 `Annotation 1: …` 형태로 하나씩 대응해 답변. 라벨은 호버 칩",
        "주석 블록은 그리기 전에 내 말풍선에서 제거되어 깜빡임 없음. 질문 + 'Annotations ×N' 칩만 남고 지난 메시지는 새로고침으로 자가 복원",
        "공식 번들 형태로 코어 수정 없음: DSH 파일 불변, `cordis.patch.yml`은 자기 id를 한 번만 삽입, profile patch는 `[]` 유지"
      ],
      "zh": [
        "选中回复文字即可批注（正文可留空＝只标记），跨消息跨回合累积并从 1 开始编号",
        "回车时批注块随问题一起发给模型，模型按 `Annotation 1: …` 逐条对应回复，回复标签是可悬浮芯片",
        "批注块在绘制前就从你的气泡里移除，零闪烁，只留问题 + 「Annotations ×N」芯片，历史消息刷新自愈",
        "官方 bundle 形态零核心改动：不碰 DSH 文件，`cordis.patch.yml` 只插自己 id 一次，profile patch 保持 `[]`"
      ]
    }
  },
  "omdsh-dev/dsh-genui": {
    "intro": {
      "en": "Once installed, the model stops answering in text alone: ask \"how are this month's orders doing\" and it renders a clickable data panel right inside the answer as it analyzes — watch trends, drag sliders, hit refresh, and the model actually responds. The most notable engineering choice is dual-channel rendering, picked automatically at startup with no dependency on a specific host version: when the host exposes the fence-registry extension point (newer dsh builds), fences register through the host's own streaming render pipeline; when it does not (including stock DSH and older builds), the plugin falls back to a DOM channel, observing the session DOM and mounting its own render tree. Since 0.7.2 the DOM channel supports streaming too, so components appear as the model writes them rather than after the whole reply lands. Components, interactions, panels and persistence behave identically on either channel.",
      "ja": "導入後、モデルはテキストだけで答えなくなります——「今月の注文はどう？」と聞くと、分析しながら回答の中にクリック可能なデータパネルを描画します。トレンドを見て、スライダーをドラッグし、更新を押せば、モデルが実際に応答します。技術的に最も注目すべきは二重チャネル描画で、起動時に自動選択され特定のホストバージョンに依存しません：ホストが fence-registry 拡張点を公開している場合（新しい dsh ビルド）はレジストリチャネルを使い、フェンスがホスト自身のストリーミング描画パイプラインに登録されます。拡張点がない場合（素の DSH や古いビルドを含む）は DOM チャネルにフォールバックし、プラグインがセッション DOM を監視して自前の描画ツリーをマウントします。0.7.2 以降は DOM チャネルもストリーミング描画に対応し、返信全体を待たずにモデルが書いた順にコンポーネントが現れます。どちらのチャネルでも、コンポーネント・操作・パネル・永続化の挙動は完全に同一です。",
      "ko": "설치하면 모델이 텍스트로만 답하지 않습니다——「이번 달 주문 어때?」라고 물으면 분석하면서 답변 안에 클릭 가능한 데이터 패널을 렌더링합니다. 추세를 보고 슬라이더를 끌고 새로고침을 누르면 모델이 실제로 응답합니다. 공학적으로 가장 주목할 점은 이중 채널 렌더링으로, 시작할 때 자동 선택되며 특정 호스트 버전에 의존하지 않습니다: 호스트가 fence-registry 확장점을 노출하면(최신 dsh 빌드) 레지스트리 채널을 써서 펜스가 호스트 자체의 스트리밍 렌더 파이프라인에 등록되고, 확장점이 없으면(기본 DSH와 구버전 포함) DOM 채널로 폴백해 플러그인이 세션 DOM을 관찰하며 자체 렌더 트리를 마운트합니다. 0.7.2부터는 DOM 채널도 스트리밍을 지원해 전체 응답을 기다릴 필요 없이 모델이 작성하는 대로 컴포넌트가 나타납니다. 어느 채널에서든 컴포넌트·상호작용·패널·영속화 동작은 완전히 동일합니다.",
      "zh": "装上之后模型不再只用文字作答——问一句「这个月订单怎么样」，它一边分析一边在回答里渲染出一块可点击的数据面板：看趋势、拖滑块、点刷新，模型会真的响应。工程上最值得注意的是双通道渲染，插件启动时自动二选一，不绑定特定宿主版本：宿主暴露 fence-registry 扩展点时（较新的 dsh 构建）走注册通道，围栏接进宿主自己的流式渲染管线；宿主没有这个扩展点时（包括原版 DSH 和更老的构建）退到 DOM 通道，插件观察会话 DOM 自己挂载渲染树。0.7.2 起 DOM 通道也支持流式渲染，组件随模型书写逐个出现，不必等整段回复写完。两条通道下组件、交互、面板和持久化的行为完全一致。"
    },
    "highlights": {
      "en": [
        "Dual-channel rendering chosen automatically: fence-registry on newer hosts, DOM channel on stock or older builds — no host version lock-in",
        "Since 0.7.2 the DOM channel streams too: the first finished component shows up immediately",
        "Components, interactions, panels and persistence behave identically on both channels"
      ],
      "ja": [
        "二重チャネル描画を自動選択：新しいホストは fence-registry、素の／古いビルドは DOM チャネル。ホストバージョンに縛られない",
        "0.7.2 以降は DOM チャネルもストリーミング対応。最初に完成したコンポーネントが即座に表示",
        "どちらのチャネルでもコンポーネント・操作・パネル・永続化の挙動は完全に同一"
      ],
      "ko": [
        "이중 채널 렌더링 자동 선택: 최신 호스트는 fence-registry, 기본·구버전 빌드는 DOM 채널 — 호스트 버전 종속 없음",
        "0.7.2부터 DOM 채널도 스트리밍 지원, 먼저 완성된 컴포넌트가 즉시 표시",
        "두 채널 모두에서 컴포넌트·상호작용·패널·영속화 동작이 완전히 동일"
      ],
      "zh": [
        "双通道渲染自动选择：新宿主走 fence-registry 注册通道，原版/老构建退到 DOM 通道，不绑定宿主版本",
        "0.7.2 起 DOM 通道也支持流式渲染，第一个完成的组件立刻出现",
        "两条通道下组件、交互、面板与持久化行为完全一致"
      ]
    }
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
    }
  },
  "omdsh-dev/dsh-open-in-vscode": {
    "intro": {
      "en": "A small, complete plugin. The client half uses the harness's `sidebar.workspaces.row-menu` slot where available and falls back to a scoped compatibility adapter on the public DSH `0.1.0-rc.6` build — both paths render the same menu row, following the locale: 在 VSCode 中打开 under Chinese, Open in VSCode under English. Clicking the row closes the menu and calls the host over the strict Typert Remote `openInVscode/open`, passing the workspace directory. The host half spawns the configured editor CLI on that directory (`code` by default), detached, so the editor's lifetime is independent of the server. Prerequisites: VS Code, or any editor CLI on PATH that opens a directory. On Windows the default `code` command also discovers standard per-user and system VS Code installations; on macOS you'll want the VS Code shell command installed, or point the plugin's `command` at any editor that opens a directory. Requires DSH `0.1.0-rc.6` or newer — the plugin uses the native Workspace row-menu extension point where present and a compatibility adapter on rc.6. After installing, restart the web server with `kill -TERM` and wait for it to exit — never `kill -9`, which tears the session zstd log mid-frame — then refresh the page.",
      "ja": "小さいがまとまりのあるプラグインだ。クライアント側は利用可能なら harness の `sidebar.workspaces.row-menu` スロットを使い、公開されている DSH `0.1.0-rc.6` ビルドではスコープを限定した互換アダプタにフォールバックする。どちらの経路でも描画されるメニュー行は同一で、ロケールに追従する——中国語ロケールでは「在 VSCode 中打开」、英語では「Open in VSCode」。この行をクリックするとメニューが閉じ、厳格な Typert Remote `openInVscode/open` を通じてホストを呼び出し、ワークスペースディレクトリを渡す。ホスト側は設定されたエディタ CLI（既定は `code`）をそのディレクトリに対して切り離しモードで起動するので、エディタの寿命はサーバーから独立する。前提条件は、VS Code があるか、ディレクトリを開けるエディタ CLI が PATH 上にあること。Windows では既定の `code` コマンドがユーザー単位およびシステム単位の標準的な VS Code インストールも検出する。macOS では VS Code の shell コマンドを入れるか、プラグインの `command` をディレクトリを開ける任意のエディタに向ければよい。DSH `0.1.0-rc.6` 以降が必要で、ネイティブの Workspace 行メニュー拡張点があればそれを使い、rc.6 では互換アダプタを用いる。導入後は `kill -TERM` で web サーバーを再起動し、終了を待つこと——`kill -9` は絶対に使わない。セッションの zstd ログをフレームの途中で引き裂いてしまう——そのうえでページを再読み込みする。",
      "ko": "작지만 완결된 플러그인이다. 클라이언트 쪽은 가능하면 하네스의 `sidebar.workspaces.row-menu` 슬롯을 쓰고, 공개된 DSH `0.1.0-rc.6` 빌드에서는 범위를 제한한 호환 어댑터로 폴백한다. 두 경로가 그려 내는 메뉴 행은 동일하며 로케일을 따라간다 — 중국어에서는 '在 VSCode 中打开', 영어에서는 'Open in VSCode'. 이 행을 클릭하면 메뉴가 닫히고 엄격한 Typert Remote `openInVscode/open`을 통해 호스트를 호출하며 워크스페이스 디렉터리를 넘긴다. 호스트 쪽은 설정된 에디터 CLI(기본값 `code`)를 그 디렉터리에 대해 분리 모드로 실행하므로 에디터의 수명은 서버와 무관해진다. 전제 조건은 VS Code가 있거나, 디렉터리를 열 수 있는 에디터 CLI가 PATH에 있는 것이다. Windows에서는 기본 `code` 명령이 사용자별·시스템 표준 VS Code 설치도 찾아낸다. macOS에서는 VS Code의 shell 명령을 설치하거나, 플러그인의 `command`를 디렉터리를 여는 아무 에디터로 지정하면 된다. DSH `0.1.0-rc.6` 이상이 필요하며, 네이티브 Workspace 행 메뉴 확장점이 있으면 그것을 쓰고 rc.6에서는 호환 어댑터를 쓴다. 설치 후에는 `kill -TERM`으로 웹 서버를 재시작하고 종료를 기다린다 — `kill -9`는 절대 쓰지 말 것. 세션 zstd 로그를 프레임 중간에 찢어 놓는다 — 그런 다음 페이지를 새로고침한다.",
      "zh": "一个小而完整的插件。客户端那半在可用时使用 harness 的 `sidebar.workspaces.row-menu` 插槽，在公开的 DSH `0.1.0-rc.6` 构建上则回退到一个作用域受限的兼容适配器——两条路径渲染出的菜单行完全一致，并跟随界面语言：中文下显示「在 VSCode 中打开」，英文下显示「Open in VSCode」。点击这一行会关闭菜单，并通过严格的 Typert Remote `openInVscode/open` 调用服务端，把工作区目录传过去。服务端那半在该目录上以分离方式拉起配置好的编辑器 CLI（默认是 `code`），所以编辑器的生命周期不受服务端影响。前置条件：装了 VS Code，或者 PATH 上有任意能打开目录的编辑器 CLI；Windows 上默认的 `code` 命令还会自动发现标准的按用户安装和系统级安装，macOS 上需要装 VS Code 的 shell 命令，或者把插件的 `command` 配置指向任意能打开目录的编辑器。需要 DSH `0.1.0-rc.6` 或更新版本。装完记得用 `kill -TERM` 重启 web 服务并等待退出——不要用 `kill -9`，那会在中途撕裂会话的 zstd 日志帧——然后刷新页面。"
    },
    "highlights": {
      "en": [
        "Every real Workspace row in the sidebar gains an open entry in its \"…\" menu, with Chinese and English labels following the UI locale",
        "Prefers the harness's native `sidebar.workspaces.row-menu` slot, falling back to a scoped compatibility adapter on `0.1.0-rc.6`",
        "Calls the host over the strict Typert Remote `openInVscode/open` and spawns the editor detached, so it outlives the server",
        "Defaults to the `code` command, or point the plugin's `command` at any directory-opening editor CLI; restart with `kill -TERM`, never `kill -9`"
      ],
      "ja": [
        "サイドバーの実 Workspace 行ごとに「…」メニューへ項目が追加され、UI ロケールに応じて日中英の表記が切り替わる",
        "harness ネイティブの `sidebar.workspaces.row-menu` スロットを優先し、`0.1.0-rc.6` ではスコープ限定の互換アダプタにフォールバック",
        "厳格な Typert Remote `openInVscode/open` でホストを呼び出し、エディタを切り離し起動するためサーバー終了後も残る",
        "既定コマンドは `code`。プラグインの `command` をディレクトリを開ける任意のエディタ CLI に向けることも可能。再起動は `kill -TERM` で、`kill -9` は使わない"
      ],
      "ko": [
        "사이드바의 실제 Workspace 행마다 '…' 메뉴에 열기 항목이 추가되고, UI 로케일에 따라 표기가 바뀐다",
        "하네스 네이티브 `sidebar.workspaces.row-menu` 슬롯을 우선 사용하고 `0.1.0-rc.6`에서는 범위 제한 호환 어댑터로 폴백",
        "엄격한 Typert Remote `openInVscode/open`으로 호스트를 호출하고 에디터를 분리 실행해 서버 종료 후에도 남는다",
        "기본 명령은 `code`이며 플러그인 `command`를 디렉터리를 여는 임의의 에디터 CLI로 지정 가능. 재시작은 `kill -TERM`, `kill -9`는 금지"
      ],
      "zh": [
        "侧栏每个真实工作区行的「…」菜单里多一条打开项，跟随界面语言显示中英文案",
        "优先用 harness 原生的 `sidebar.workspaces.row-menu` 插槽，在 `0.1.0-rc.6` 上回退到作用域受限的兼容适配器",
        "通过严格的 Typert Remote `openInVscode/open` 调用服务端，以分离进程拉起编辑器，编辑器不随服务端退出",
        "默认命令 `code`，也可把插件 `command` 指向任意能打开目录的编辑器 CLI；重启用 `kill -TERM`，别用 `kill -9`"
      ]
    }
  },
  "orziz/odai": {
    "intro": {
      "en": "odai is for people who want agents to move with autonomy but not with false confidence. It embeds governance into execution itself: the agent asks only when the missing answer would change the goal, scope, authorization, acceptance, risk or stop line; anything it can verify from files, commands, logs, tests or project context, it verifies before asking you; lightweight tasks stay lightweight instead of turning every request into ceremony; and it never claims something was tested, delegated, reviewed or verified when it was not. Specialist skills and domain guidance get combined only when the task needs them, rather than stuffing every rule into every turn. There is a single entry point — `/odai` — and the depth of handling rises or falls automatically with ambiguity, complexity, risk and domain needs. DSH users can install either integration independently: `dsh plugin --profile web add odai-dsh-plugin` applies odai to every agent preset in a profile, or install it as a selectable session-scoped Agent, which preserves every capability of the pinned DSH Standard preset and adds odai as a scoped extension. The Agent installer requires `dsh@0.1.0-rc.6`.",
      "ja": "odai は「Agent に自律性は欲しいが、根拠のない自信は要らない」という人のためのものだ。ガバナンスを実行そのものに埋め込む。欠けている答えが目的・範囲・権限・受入・リスク・停止線を変える場合にだけ質問し、ファイル・コマンド・ログ・テスト・プロジェクト文脈から自分で確かめられることは先に確かめてから聞く。軽いタスクは軽いままで、あらゆる依頼を儀式に変えたりしない。テストした・委譲した・レビューした・検証したと偽ることは決してない。専門スキルや領域ガイドは、あらゆるルールを毎ターン詰め込むのではなく、タスクが必要とするときにだけ組み合わせる。入口は `/odai` ひとつで、扱いの深さは曖昧さ・複雑さ・リスク・領域要件に応じて自動的に上下する。DSH ユーザーは 2 つの統合を独立に導入できる。`dsh plugin --profile web add odai-dsh-plugin` は profile 内のすべての agent プリセットに odai を適用し、もう一方はセッション内で選択できる Agent として導入する（固定された DSH Standard プリセットの全機能を保ったまま odai をスコープ付き拡張として追加）。Agent 版インストーラーには `dsh@0.1.0-rc.6` が必要。",
      "ko": "odai는 '에이전트에 자율성은 원하지만 근거 없는 자신감은 원하지 않는' 사람들을 위한 것이다. 거버넌스를 실행 자체에 내장한다. 빠진 답이 목표·범위·권한·인수·위험·중단선을 바꿀 때만 묻고, 파일·명령·로그·테스트·프로젝트 맥락에서 스스로 확인할 수 있는 것은 먼저 확인한 뒤 묻는다. 가벼운 작업은 가볍게 두고 모든 요청을 절차로 만들지 않는다. 테스트했다·위임했다·리뷰했다·검증했다고 사실이 아닌 주장을 결코 하지 않는다. 전문 스킬과 도메인 가이드는 모든 규칙을 매 턴에 밀어 넣는 대신 작업이 필요로 할 때만 조합한다. 진입점은 `/odai` 하나이며, 처리 깊이는 모호함·복잡도·위험·도메인 요구에 따라 자동으로 오르내린다. DSH 사용자는 두 가지 통합을 독립적으로 설치할 수 있다. `dsh plugin --profile web add odai-dsh-plugin`은 profile의 모든 에이전트 프리셋에 odai를 적용하고, 다른 하나는 세션에서 선택 가능한 Agent로 설치한다(고정된 DSH Standard 프리셋의 모든 기능을 보존하면서 odai를 범위 제한 확장으로 추가). Agent 설치 방식은 `dsh@0.1.0-rc.6`이 필요하다.",
      "zh": "odai 面向的是「希望 Agent 有自主性，但不要有虚假自信」的人。它把治理嵌进执行本身：只在缺失答案会改变目标、范围、授权、验收、风险或停止线时才发问；能从文件、命令、日志、测试或项目上下文里自己核实的，就先核实再来问你；轻量任务保持轻量，不会把每个请求都变成一套仪式；绝不谎称测过、派过、审过或验证过；只在任务需要时才组合专家技能与领域指引，而不是把所有规则塞进每一轮。调用入口就一个 `/odai`，治理深度随歧义、复杂度、风险和领域需求自动升降。DSH 用户可以独立安装两种集成之一：`dsh plugin --profile web add odai-dsh-plugin` 把 odai 应用到 profile 里的每个 agent 预设，或者装成会话内可选的 Agent——后者完整保留固定 DSH Standard 预设的全部能力，把 odai 作为受限扩展加上去。Agent 安装方式需要 `dsh@0.1.0-rc.6`。"
    },
    "highlights": {
      "en": [
        "Asks only when the missing answer would change goal, scope, authorization, acceptance or risk — otherwise it verifies from files, commands, logs and tests first",
        "No false completion: it will not claim work was tested, delegated, reviewed or verified when it wasn't",
        "Lightweight tasks stay lightweight; depth scales automatically with ambiguity, complexity and risk, all behind one `/odai` entry point",
        "Two DSH install paths: `odai-dsh-plugin` across every preset in a profile, or a selectable session-scoped Agent (requires dsh@0.1.0-rc.6)"
      ],
      "ja": [
        "目的・範囲・権限・受入・リスクを変える答えが欠けているときだけ質問、それ以外はファイル/コマンド/ログ/テストで自ら確認",
        "偽りの完了を拒否：テスト・委譲・レビュー・検証を、していないのにしたとは言わない",
        "軽いタスクは軽いまま。曖昧さ・複雑さ・リスクに応じて深さが自動調整され、入口は `/odai` のみ",
        "DSH は 2 通り：`odai-dsh-plugin` で profile 全プリセットに適用、またはセッション内選択式 Agent として導入（dsh@0.1.0-rc.6 が必要）"
      ],
      "ko": [
        "목표·범위·권한·인수·위험을 바꿀 답이 빠졌을 때만 질문, 나머지는 파일/명령/로그/테스트로 먼저 확인",
        "거짓 완료 거부: 테스트·위임·리뷰·검증을 하지 않았다면 했다고 말하지 않는다",
        "가벼운 작업은 가볍게. 모호함·복잡도·위험에 따라 깊이가 자동 조절되며 진입점은 `/odai` 하나",
        "DSH 설치 두 가지: `odai-dsh-plugin`으로 profile 전체 프리셋에 적용, 또는 세션 내 선택형 Agent (dsh@0.1.0-rc.6 필요)"
      ],
      "zh": [
        "只在答案会改变目标、范围、授权、验收或风险时才发问，其余先自行从文件/命令/日志/测试核实",
        "拒绝虚假完成：不谎称测过、派过、审过、验证过，交付要真的可交付",
        "轻量任务保持轻量，治理深度随歧义、复杂度、风险自动升降，入口只有一个 `/odai`",
        "DSH 两种装法：`odai-dsh-plugin` 覆盖 profile 全部预设，或装成会话内可选 Agent（需 dsh@0.1.0-rc.6）"
      ]
    }
  },
  "pingfanfan/hello-dsh": {
    "intro": {
      "en": "DSH introduces itself as \"Everything is a Plugin.\" That isn't marketing — open Settings → Plugins → Plugin list and count them: 133. `llm` (the model adapter), `session` (conversation history), `webserver` (the page you're looking at), `ui-sidebar` (the sidebar on the left), and even `agent-loop` — the agent loop itself is a plugin. This repository walks you from \"open a terminal\" all the way to building your own plugin and watching its lifecycle. The tutorial assumes you have nothing: no Node.js, no command-line experience. Ten steps in four stretches — steps 1–2 open a terminal and install Node.js (about 7 minutes), steps 3–5 launch DSH, configure the API key and pick a workspace (about 10 minutes), step 6 has you see all 133 plugins for yourself (about 3 minutes), and steps 7–8 build your first plugin and watch its lifecycle (about 10 minutes). Every section ends with a checkpoint, and you don't move on until you see the expected result. The repository also ships 22 example skills. One gotcha to know up front: launch the web UI with `--patch`, or skills silently do nothing. The tutorial text is currently written in Chinese with an English version in progress; the code, commands and screenshots are language-neutral, so the walkthrough is still followable, and the skills in `examples/skills/` work regardless of what language you read. Verified against DSH 0.1.0-rc.6.",
      "ja": "DSH は自らを「すべてはプラグインである」と紹介する。これは宣伝文句ではない——設定 → プラグイン → プラグイン一覧を開いて数えてみれば 133 個ある。`llm`（モデルアダプタ）、`session`（会話履歴）、`webserver`（いま見ているこのページ）、`ui-sidebar`（左側のサイドバー）、そして `agent-loop`——agent ループそのものまでがプラグインだ。このリポジトリは「ターミナルを開く」ところから、自分でプラグインを書いてそのライフサイクルを観察するところまで案内する。チュートリアルはあなたが何も持っていない前提だ。Node.js も無い、コマンドラインの経験も無い。10 ステップは 4 つの区切りに分かれる。ステップ 1〜2 でターミナルを開き Node.js を入れる（約 7 分）、ステップ 3〜5 で DSH を起動し API キーを設定してワークスペースを選ぶ（約 10 分）、ステップ 6 で 133 個のプラグインを自分の目で確かめる（約 3 分）、ステップ 7〜8 で最初のプラグインを作りライフサイクルを観察する（約 10 分）。各セクションはチェックポイントで終わり、期待した結果が見えるまで先へ進まない。リポジトリには 22 個のスキル実例も同梱されている。先に知っておくべき落とし穴がひとつ。Web UI は `--patch` 付きで起動すること。さもないと skills は何も言わずに機能しない。チュートリアル本文は現在中国語で、英語版は作成中。コード・コマンド・スクリーンショットは言語に依存しないので手順は追えるし、`examples/skills/` のスキルも読む言語を選ばない。DSH 0.1.0-rc.6 で検証済み。",
      "ko": "DSH는 스스로를 '모든 것은 플러그인'이라고 소개한다. 마케팅 문구가 아니다 — 설정 → 플러그인 → 플러그인 목록을 열어 세어 보면 133개다. `llm`(모델 어댑터), `session`(대화 기록), `webserver`(지금 보고 있는 이 페이지), `ui-sidebar`(왼쪽 사이드바), 그리고 `agent-loop` — 에이전트 루프 자체까지 플러그인이다. 이 저장소는 '터미널 열기'에서 시작해 직접 플러그인을 쓰고 그 생명주기를 관찰하는 데까지 안내한다. 튜토리얼은 당신이 아무것도 없다고 가정한다. Node.js도 없고 명령줄 경험도 없다. 10단계는 네 구간으로 나뉜다. 1~2단계는 터미널을 열고 Node.js를 설치하고(약 7분), 3~5단계는 DSH를 실행해 API 키를 설정하고 워크스페이스를 고르고(약 10분), 6단계는 133개 플러그인을 직접 확인하고(약 3분), 7~8단계는 첫 플러그인을 만들어 생명주기를 지켜본다(약 10분). 각 절은 체크포인트로 끝나며, 예상한 결과를 보기 전에는 다음으로 넘어가지 않는다. 저장소에는 22개의 스킬 예제도 함께 들어 있다. 미리 알아 둘 함정이 하나 있다. Web UI는 `--patch`를 붙여 실행해야 하며, 그러지 않으면 skills가 조용히 아무 일도 하지 않는다. 튜토리얼 본문은 현재 중국어이고 영어판은 작업 중이다. 코드와 명령, 스크린샷은 언어와 무관해서 따라가는 데 문제가 없고, `examples/skills/`의 스킬도 읽는 언어를 가리지 않는다. DSH 0.1.0-rc.6에서 검증됐다.",
      "zh": "DSH 给自己的介绍是「万物皆可插件」。这不是营销话术——打开设置 → 插件 → 插件列表数一数，133 个：`llm`（模型适配器）、`session`（对话历史）、`webserver`（你正在看的这个页面）、`ui-sidebar`（左边那条侧栏），连 `agent-loop`（agent 循环本身）都是插件。这个仓库要做的，就是带你从「打开终端」一路走到自己写一个插件并观察它的生命周期。教程假设你什么都没有：没有 Node.js，没有命令行经验。10 个步骤分四段——第 1–2 步开终端装 Node.js（约 7 分钟），第 3–5 步启动 DSH、配 API Key、选工作区（约 10 分钟），第 6 步亲眼看到那 133 个插件（约 3 分钟），第 7–8 步写出你的第一个插件并观察生命周期（约 10 分钟）。每一节都以检查点结尾，看不到预期结果就不要往下走。仓库另附 22 个中文技能实例。有个坑要先说：启动 Web UI 必须带 `--patch`，否则 skills 会静默失效。教程正文目前是中文，英文版在做；代码、命令和截图与语言无关，所以照着走仍然通得过，`examples/skills/` 里的技能也不挑阅读语言。已在 DSH 0.1.0-rc.6 上验证。"
    },
    "highlights": {
      "en": [
        "Ten steps in about 30 minutes: terminal and Node → launch DSH, set the key, pick a workspace → count all 133 plugins → build your first plugin and watch its lifecycle",
        "Assumes zero background: no Node.js and no command-line experience needed, and each section ends with a checkpoint you must reach first",
        "Ships 22 example skills in `examples/skills/` that work regardless of the language you read",
        "Know the gotcha first: launch the web UI with `--patch` or skills silently do nothing. Verified on DSH 0.1.0-rc.6"
      ],
      "ja": [
        "10 ステップ約 30 分：ターミナルと Node → DSH 起動・キー設定・ワークスペース選択 → 133 個のプラグインを自分で数える → 最初のプラグインを作りライフサイクルを見る",
        "前提知識ゼロ：Node.js もコマンドライン経験も不要。各セクションはチェックポイントで終わり、そこに到達してから次へ",
        "`examples/skills/` に 22 個のスキル実例を同梱、読む言語を問わずそのまま使える",
        "落とし穴を先に：Web UI は `--patch` 付きで起動しないと skills が黙って無効化される。DSH 0.1.0-rc.6 で検証済み"
      ],
      "ko": [
        "10단계 약 30분: 터미널과 Node → DSH 실행·키 설정·워크스페이스 선택 → 133개 플러그인 직접 세어 보기 → 첫 플러그인 제작과 생명주기 관찰",
        "사전 지식 제로 전제: Node.js도 명령줄 경험도 필요 없고, 각 절은 체크포인트로 끝나 도달 후에야 다음으로",
        "`examples/skills/`에 22개 스킬 예제 동봉 — 읽는 언어와 무관하게 그대로 사용 가능",
        "함정 먼저: Web UI는 `--patch`로 실행하지 않으면 skills가 조용히 무력화된다. DSH 0.1.0-rc.6 검증 완료"
      ],
      "zh": [
        "10 个步骤 30 分钟：开终端装 Node → 启动 DSH 配 Key 选工作区 → 亲眼数完 133 个插件 → 写出第一个插件看生命周期",
        "假设你零基础：没 Node.js、没命令行经验也能跟；每节以检查点结尾，看不到预期结果就不往下走",
        "附 22 个中文技能实例（`examples/skills/`），与阅读语言无关，可直接拿来用",
        "先避坑：Web UI 必须用 `--patch` 启动，否则 skills 静默失效。已在 DSH 0.1.0-rc.6 验证"
      ]
    }
  },
  "taxueseek/argo": {
    "intro": {
      "en": "Model-native search, AI search and metasearch all solve \"a person looking for information\"; Argo solves \"an agent looking for information\" — and the difference is not the interface, it's the deliverable. People get a summary page or a SERP link list. An agent should get evidence it can rank, re-check with `fetch`, and consume without blowing up its context. Argo treats search as an evidence pipeline: detect the language, route by domain to the right sources, recall across multiple engines, fuse with RRF, then appraise the evidence and emit compact JSON — evidence candidates plus a credibility breakdown across selection, absorption, freshness and consensus. Vertical questions (market data, chemical formulas and the like) go straight to vertical sources for a direct answer rather than scanning web page titles. Repeat queries hit a two-layer cache (in-memory plus SQLite), putting hot queries at roughly 10ms. Cost is handled by a budget mode that prefers free sources, with every API key optional. Coverage spans Chinese, English, academic, code, shopping, finance, news and encyclopedic sources, and web search works alongside local file search. DSH users can install the `.dsh-plugin` bundle directly — one command and the model has ten `mcp__argo__*` tools.",
      "ja": "モデル内蔵検索・AI 検索・アグリゲート検索が解くのは「人が情報を探す」問題で、Argo が解くのは「Agent が情報を探す」問題だ。違いは UI ではなく成果物にある。人に渡すのは要約ページや SERP のリンク一覧でよいが、Agent に渡すべきなのは、並べ替えられて `fetch` で再確認でき、コンテキストを溢れさせない証拠素材である。Argo は検索を証拠パイプラインとして扱う。まず言語を検出し、領域に応じて適切なソースへルーティングし、複数エンジンで再現したうえで RRF で融合し、最後に証拠を即時評価して簡潔な JSON を出す——証拠候補に加え、selection・absorption・freshness・合意という 4 軸の信頼度分解が付く。相場や化学式のような垂直的な問いは、ウェブページのタイトルを総なめするのではなく垂直ソースに直結して答えを返す。繰り返しのクエリはメモリと SQLite の二層キャッシュに当たり、ホットなクエリは約 10ms。コストは無料優先の予算モードで扱い、API キーはすべて任意。中国語・英語・学術・コード・ショッピング・金融・ニュース・百科などをカバーし、ウェブ検索とローカルファイル検索が一体で使える。DSH ユーザーは `.dsh-plugin` bundle をそのまま導入でき、1 行のコマンドでモデルが 10 個の `mcp__argo__*` ツールを得る。",
      "ko": "모델 내장 검색, AI 검색, 메타 검색이 푸는 것은 '사람이 정보를 찾는' 문제이고, Argo가 푸는 것은 '에이전트가 정보를 찾는' 문제다. 차이는 인터페이스가 아니라 산출물에 있다. 사람에게는 요약 페이지나 SERP 링크 목록이면 되지만, 에이전트에게 필요한 것은 정렬할 수 있고 `fetch`로 재확인할 수 있으며 컨텍스트를 터뜨리지 않는 증거 자료다. Argo는 검색을 증거 파이프라인으로 다룬다. 먼저 언어를 감지하고, 도메인에 따라 적합한 소스로 라우팅하고, 여러 엔진으로 회수한 뒤 RRF로 융합하고, 마지막에 증거를 빠르게 평가해 간결한 JSON을 낸다 — 증거 후보와 함께 selection·absorption·freshness·합의 네 축의 신뢰도 분해가 붙는다. 시세나 화학식 같은 수직적 질문은 웹 페이지 제목을 훑는 대신 수직 소스에 직결해 바로 답한다. 반복 질의는 메모리와 SQLite 이중 캐시를 타서 인기 질의는 약 10ms. 비용은 무료 우선 예산 모드로 다루고 API 키는 모두 선택 사항이다. 중국어·영어·학술·코드·쇼핑·금융·뉴스·백과 등을 아우르며, 웹 검색과 로컬 파일 검색을 함께 쓸 수 있다. DSH 사용자는 `.dsh-plugin` 번들을 바로 설치할 수 있고, 한 줄 명령이면 모델이 10개의 `mcp__argo__*` 도구를 갖게 된다.",
      "zh": "模型自带搜索、AI 搜索和聚合搜索解决的是「人找信息」，Argo 解决的是「Agent 找信息」——差别不在界面，在交付物。给人看的是总结页或 SERP 链接清单，给 Agent 应该是能排序、能 `fetch` 复核、不撑爆上下文的证据材料。Argo 把搜索当成一条证据管线来做：先做语言检测，再按领域路由到合适的源，多引擎召回后用 RRF 融合，最后做证据快评，输出精简 JSON——证据候选加上 selection、absorption、freshness 与共识四维的可信度分解。垂直问题（行情、化学式这类）直连垂直源直接给答案，而不是泛搜网页标题。重复查询走内存加 SQLite 双层缓存，热查询大约 10ms。成本上采用预算模式、免费优先，所有 Key 都是可选的；覆盖中文、英文、学术、代码、购物、金融、新闻、百科等方向，联网搜索与本机文件搜索一体可用。DSH 用户可以直接装 `.dsh-plugin` bundle，一行命令后模型就拿到 10 个 `mcp__argo__*` 工具。"
    },
    "highlights": {
      "en": [
        "An evidence pipeline — language detection → domain routing → multi-engine recall → RRF fusion → appraisal — emitting compact JSON, not a link list",
        "Credibility is broken out across selection, absorption, freshness and consensus, so the agent can rank and re-verify with `fetch`",
        "Vertical questions route straight to vertical sources for direct answers; a two-layer cache (memory + SQLite) keeps hot queries near 10ms",
        "Budget mode prefers free sources and every key is optional; `dsh plugin --profile web add` installs ten `mcp__argo__*` tools in one line"
      ],
      "ja": [
        "証拠パイプライン：言語検出 → ドメインルーティング → 多エンジン再現 → RRF 融合 → 即時評価。出力はリンク一覧ではなく簡潔な JSON",
        "信頼度を selection / absorption / freshness / 合意の 4 軸に分解、Agent がそのまま並べ替え `fetch` で再検証できる",
        "垂直的な問いは垂直ソースに直結して回答。メモリ + SQLite の二層キャッシュでホットクエリは約 10ms",
        "無料優先の予算モードでキーはすべて任意。`dsh plugin --profile web add` の 1 行で 10 個の `mcp__argo__*` ツールが入る"
      ],
      "ko": [
        "증거 파이프라인: 언어 감지 → 도메인 라우팅 → 다중 엔진 회수 → RRF 융합 → 평가. 출력은 링크 목록이 아닌 간결한 JSON",
        "신뢰도를 selection / absorption / freshness / 합의 네 축으로 분해해 에이전트가 바로 정렬하고 `fetch`로 재검증",
        "수직적 질문은 수직 소스에 직결해 답변. 메모리 + SQLite 이중 캐시로 인기 질의는 약 10ms",
        "무료 우선 예산 모드에 키는 모두 선택 사항. `dsh plugin --profile web add` 한 줄로 10개 `mcp__argo__*` 도구 설치"
      ],
      "zh": [
        "证据管线：语言检测 → 领域路由 → 多引擎召回 → RRF 融合 → 证据快评，输出精简 JSON 而非链接清单",
        "可信度分解到 selection / absorption / freshness / 共识四维，Agent 可直接排序与 `fetch` 复核",
        "垂直问题直连垂直源给答案；双层缓存（内存 + SQLite）让热查询约 10ms",
        "预算模式免费优先、Key 全可选；`dsh plugin --profile web add` 一行装完即得 10 个 `mcp__argo__*` 工具"
      ]
    }
  },
  "text2future/flowix": {
    "intro": {
      "en": "Flowix's premise is \"notes are memory\": you write in plain Markdown, and when you need an agent to work, you point it at the part of the note it should see — then the output goes back into that same note, ready to review, edit and reuse instead of re-explaining the background every time. Product work, development context, research material and personal knowledge all live in one local notebook, so agents can continue rather than start over. Everything stays as plain Markdown files on your device, openable in any other app. Agents see only the note, folder or notebook you explicitly share, and only when you decide to send it. Sync, backup and version control use whatever tools you already trust — there is no export step. Beyond the agents built into Flowix, you can connect Codex, Claude Code, OpenCode, Hermes and other MCP or CLI tools so they all work from the same notes and context. The desktop app is built on Tauri v2, supports macOS 14+ and Windows 10+, and is MIT-licensed open source.",
      "ja": "Flowix の前提は「ノートこそが記憶」だ。ふだんどおり Markdown で書き、Agent に働いてもらうときはこのノートの見るべき部分を指し示す。成果は同じノートに戻るので、次回はゼロから背景を説明し直すのではなく、そのまま見直し・編集・再利用できる。プロダクトの作業、開発コンテキスト、調査資料、個人の知識がひとつのローカルノートブックに収まり、Agent は毎回やり直すのではなく続きから進められる。すべてはあなたの端末上のプレーンな Markdown ファイルとして保存され、他のアプリでも開ける。Agent が見られるのは明示的に共有したノート・フォルダ・ノートブックだけで、いつ送るかもあなたが決める。同期・バックアップ・バージョン管理は既に使っているツールをそのまま使え、エクスポートという手順は存在しない。Flowix 内蔵の Agent に加え、MCP や CLI 経由で Codex・Claude Code・OpenCode・Hermes などの外部ツールを接続し、同じノートとコンテキストを共有させられる。デスクトップは Tauri v2 ベースで macOS 14+ と Windows 10+ に対応、MIT ライセンスのオープンソース。",
      "ko": "Flowix의 전제는 '노트가 곧 기억'이다. 평소처럼 Markdown으로 쓰고, 에이전트가 일해야 할 때 이 노트에서 봐야 할 부분을 가리킨다. 결과는 같은 노트로 돌아오므로 다음번에 배경을 처음부터 다시 설명하는 대신 그대로 검토·편집·재사용할 수 있다. 제품 업무, 개발 컨텍스트, 연구 자료, 개인 지식이 하나의 로컬 노트북에 모여 있어 에이전트가 매번 새로 시작하지 않고 이어서 진행한다. 모든 것은 내 기기의 평범한 Markdown 파일로 저장되어 다른 앱에서도 열린다. 에이전트는 명시적으로 공유한 노트·폴더·노트북만 볼 수 있고, 언제 보낼지도 사용자가 정한다. 동기화·백업·버전 관리는 이미 쓰던 도구를 그대로 쓰면 되고 내보내기 단계는 없다. Flowix 내장 에이전트 외에 MCP나 CLI로 Codex, Claude Code, OpenCode, Hermes 같은 외부 도구를 연결해 같은 노트와 컨텍스트를 공유하게 할 수 있다. 데스크톱은 Tauri v2 기반으로 macOS 14+와 Windows 10+를 지원하며 MIT 오픈소스다.",
      "zh": "Flowix 的思路是「笔记即记忆」：你用 Markdown 正常写作，需要 Agent 干活时把它指向这篇笔记里该看的部分，产出再存回同一篇——下次可以直接复审、编辑、复用，而不是每次从零讲一遍背景。产品需求、开发上下文、研究材料和个人知识都放在同一个本地笔记库里，Agent 接着上次继续。所有内容都是你设备上的纯 Markdown 文件，别的编辑器也能打开；Agent 只能看到你明确共享的那一篇、那个文件夹或那个笔记本，什么时候发送上下文由你决定；同步、备份和版本管理沿用你已经在用的工具，没有导出这一步。除了在 Flowix 内部调用 Agent，也可以通过 MCP 或 CLI 接上 Codex、Claude Code、OpenCode、Hermes 等外部工具，让它们共用同一份笔记与上下文。桌面端基于 Tauri v2，支持 macOS 14+ 与 Windows 10+，MIT 开源。"
    },
    "highlights": {
      "en": [
        "Notes double as agent context: point at the part you want, and the result is saved back into the same note for review and reuse",
        "Plain Markdown on your own device, readable in any editor; sync and back up with the tools you already use, nothing to export",
        "Grant access per note, per folder or per notebook — agents see only what you share, when you choose to send it",
        "Connect Codex, Claude Code, OpenCode, Hermes and other agents over MCP or CLI, all working from the same memory"
      ],
      "ja": [
        "ノートがそのまま Agent のコンテキストに。使う部分を指定し、成果は同じノートへ書き戻して再利用",
        "端末上のプレーン Markdown なのでどのエディタでも開ける。同期・バックアップは既存ツールのまま、エクスポート不要",
        "ノート単位 / フォルダ単位 / ノートブック単位で権限を指定、共有する内容とタイミングを自分で決められる",
        "MCP と CLI で Codex・Claude Code・OpenCode・Hermes などの外部 Agent を接続し、同じ記憶を共有"
      ],
      "ko": [
        "노트가 곧 에이전트 컨텍스트. 쓸 부분을 지정하고 결과는 같은 노트로 되돌려 검토·재사용",
        "내 기기의 평범한 Markdown이라 어떤 에디터로도 열리고, 동기화·백업은 기존 도구 그대로, 내보내기 불필요",
        "노트 / 폴더 / 노트북 단위로 권한 지정 — 공유할 내용과 시점을 직접 결정",
        "MCP와 CLI로 Codex, Claude Code, OpenCode, Hermes 등 외부 에이전트를 연결해 같은 기억을 공유"
      ],
      "zh": [
        "笔记即 Agent 上下文：指定要用的部分，产出写回同一篇，下次可复审复用",
        "纯 Markdown 存在本机，任何编辑器都能打开，同步备份沿用你现有的工具，无需导出",
        "按篇 / 按文件夹 / 按笔记本精确授权，Agent 只看到你选择共享的内容与时机",
        "通过 MCP 与 CLI 接 Codex、Claude Code、OpenCode、Hermes 等外部 Agent，共用同一份记忆"
      ]
    }
  },
  "titanwings/distilly": {
    "intro": {
      "en": "dot-skill started life as colleague.skill, aimed at a very concrete pain: a colleague quits, a mentor graduates, a teammate transfers, and their whole playbook and context walks out with them. Feed it source material plus a description, and it distills a Skill that does not merely quote the person but reasons in their frame and answers in their voice. The rename to dot-skill widened the target: family, old friends, idols, public figures, fictional characters, and yourself all qualify. It is a cross-host Skill rather than a DSH plugin, so installation differs — DSH discovers Skills natively from the filesystem, so cloning the repo into ~/.dsh/skills/ is enough to invoke /dot-skill; dsh plugin add is not involved.",
      "ja": "dot-skill の前身は colleague.skill で、出発点は極めて具体的な痛みでした——同僚が辞め、指導教員が卒業し、チームメイトが異動すると、その人の判断の型と文脈ごと失われる。素材とあなたの説明を与えると、その人の発言を復唱するのではなく、その人の枠組みで考え、その人の声で答える Skill が蒸留されます。dot-skill への改称で対象は広がり、家族・旧友・推し・著名人・架空のキャラ、さらには自分自身も対象になりました。これは DSH プラグインではなくホスト横断の Skill なので、導入方法も異なります。DSH はファイルシステムからの Skill 検出を標準で備えているため、リポジトリを ~/.dsh/skills/ にクローンするだけで /dot-skill を呼び出せます。dsh plugin add は使いません。",
      "ko": "dot-skill의 전신은 colleague.skill로, 아주 구체적인 고통에서 출발했습니다——동료가 퇴사하고 지도교수가 졸업하고 팀원이 이동하면 그 사람의 판단 방식과 맥락까지 함께 사라집니다. 자료와 설명을 넣으면 그 사람의 말을 되풀이하는 대신 그 사람의 틀로 사고하고 그 목소리로 답하는 Skill이 증류됩니다. dot-skill로 이름을 바꾸면서 대상도 넓어져 가족·오랜 친구·최애·공인·가상 인물, 나아가 자기 자신까지 가능해졌습니다. DSH 플러그인이 아니라 호스트를 넘나드는 Skill이라 설치 방식도 다릅니다. DSH는 파일시스템 기반 Skill 탐색을 기본 지원하므로 저장소를 ~/.dsh/skills/에 클론하기만 하면 /dot-skill로 부를 수 있고, dsh plugin add는 쓰지 않습니다.",
      "zh": "dot-skill 的前身是 colleague.skill，起点是一个很具体的痛点——同事离职、导师毕业、队友转岗，人走了，那套判断方式和上下文也跟着走了。它的做法是把素材和你的一段描述喂进去，蒸馏出一个 Skill：不是复述那个人说过的话，而是按他的框架思考、用他的语气回答。升级成 dot-skill 之后对象不再限于同事，家人、老友、偶像、公众人物、虚构角色都可以，连你自己也行。它是跨宿主的 Skill 而不是 DSH 插件，所以装法也不一样：DSH 原生支持文件系统 Skill 发现，把仓库克隆进 ~/.dsh/skills/ 就能用 /dot-skill 唤起，不走 dsh plugin add。"
    },
    "highlights": {
      "en": [
        "Cross-host: one Skill serves Claude Code, Codex, OpenClaw, Hermes and DeepSeek Harness",
        "Community gallery of 215 skills from 165 contributors, plus a companion technical report",
        "On DSH it uses filesystem Skill discovery — ~/.dsh/skills/ globally, .dsh/skills/ per project"
      ],
      "ja": [
        "ホスト横断：Claude Code・Codex・OpenClaw・Hermes・DeepSeek Harness が同じ Skill を共有",
        "コミュニティ gallery に 215 の skill と 165 名の貢献者、技術レポートも公開",
        "DSH 側はファイルシステム Skill 検出。全体は ~/.dsh/skills/、プロジェクト単位は .dsh/skills/"
      ],
      "ko": [
        "호스트 횡단: Claude Code·Codex·OpenClaw·Hermes·DeepSeek Harness가 같은 Skill 사용",
        "커뮤니티 gallery에 215개 skill과 165명 기여자, 별도 기술 보고서도 공개",
        "DSH는 파일시스템 Skill 탐색 사용 — 전역은 ~/.dsh/skills/, 프로젝트는 .dsh/skills/"
      ],
      "zh": [
        "跨宿主：Claude Code、Codex、OpenClaw、Hermes、DeepSeek Harness 用同一份 Skill",
        "社区 gallery 已积累 215 个 skill、165 位贡献者，另有配套技术报告",
        "DSH 侧走文件系统 Skill 发现，全局放 ~/.dsh/skills/、项目级放 .dsh/skills/"
      ]
    }
  },
  "vlln/whale-girl": {
    "intro": {
      "en": "A companion pinned to the bottom-right of your workbench that grows on you. Click it for a menu to feed or play, drag it around, and hover to see its seniority level, task count and recent shared memories. It runs a full state machine wired to your actual working rhythm: it dozes off after 60 seconds idle and wakes on interaction; it cheers when a task completes, it levels up or earns a title; it startles then looks dejected when a task fails or a request errors; it waves hello when a new session starts; it broods along while any session is thinking, and looks expectant while waiting for approval. It is a standard official bundle plugin (root package.json declaring dsh.bundle and dsh.client) with build output committed, so a single git-source command installs it — restart web afterwards, since bundle layers are composed at startup.",
      "ja": "ワークベンチの右下に常駐する、積み上げ型の相棒です。クリックでメニューを開いて餌やりや遊び、ドラッグで移動、ホバーで経験レベル・タスク数・最近の共通の思い出を表示します。実際の作業リズムに紐づいた完全な状態機械を持ちます：60 秒アイドルでうたた寝し、操作すると目を覚まします。タスク完了・レベルアップ・称号獲得では万歳して喜び、タスク失敗やリクエストエラーではまず驚き、次に落ち込みます。新しいセッションが始まれば手を振って迎え、どれかのセッションが思考中は一緒に考え込み、承認待ちのときは期待の姿勢になります。公式の標準 bundle プラグイン（ルート package.json に dsh.bundle と dsh.client を宣言）でビルド成果物もコミット済みなので、git ソース一行で導入できます。bundle 層は起動時に合成されるため、導入後は web の再起動が必要です。",
      "ko": "작업대 우하단에 상주하는 축적형 동반자입니다. 클릭하면 메뉴가 떠서 먹이를 주거나 놀아 줄 수 있고, 끌어서 옮기며, 마우스를 올리면 연차 레벨·작업 수·최근 함께한 추억이 보입니다. 실제 작업 리듬에 연결된 완전한 상태 기계를 갖췄습니다: 60초 유휴 시 졸다가 상호작용하면 깨어나고, 작업 완료·레벨 업·칭호 획득에는 만세하며 기뻐하고, 작업 실패나 요청 오류에는 먼저 놀란 뒤 시무룩해집니다. 새 세션이 시작되면 손을 흔들어 맞이하고, 어떤 세션이든 사고 중이면 함께 골똘해지며, 승인 대기 중에는 기대하는 자세가 됩니다. 공식 표준 bundle 플러그인(루트 package.json에 dsh.bundle과 dsh.client 선언)이며 빌드 산출물도 커밋되어 있어 git 소스 한 줄로 설치됩니다. bundle 계층은 시작 시 합성되므로 설치 후 web을 재시작해야 합니다.",
      "zh": "一只挂在工作台右下角的积累型伙伴。点击弹出菜单可以喂食和玩耍，拖拽能移动，hover 显示资历等级、任务数和最近的共同回忆。它有一套完整的状态机，绑在你真实的工作节奏上：空闲 60 秒开始打盹，互动时醒来；任务完成、升级、拿到称号会举手欢呼；任务失败或请求出错先惊吓再失落；新会话开始挥手欢迎；任一会话在思考时它陪着沉思，等待批准时是期待的姿态。它是标准的官方 bundle 插件（根 package.json 带 dsh.bundle 和 dsh.client），构建产物已入库，所以 git 源一行就能装；装完要重启 web，因为 bundle 层在启动时合成。"
    },
    "highlights": {
      "en": [
        "State machine wired to real work rhythm: dozing, cheering, startling, welcoming, brooding and awaiting approval each have triggers",
        "Feeding, playing and dragging accumulate into seniority levels, titles and shared memories",
        "A standard bundle plugin with committed build output — one git-source command installs it; restart web to take effect"
      ],
      "ja": [
        "状態機械が実際の作業リズムに連動：うたた寝・歓喜・驚き・歓迎・思索・承認待ちにそれぞれ発火条件",
        "餌やり・遊び・ドラッグなどの交流が経験レベル・称号・思い出として蓄積",
        "標準 bundle プラグインでビルド成果物もコミット済み。git ソース一行で導入、反映には web の再起動が必要"
      ],
      "ko": [
        "상태 기계가 실제 작업 리듬과 연동: 졸기·환호·놀람·환영·사색·승인 대기에 각각 트리거",
        "먹이 주기·놀아 주기·끌기 같은 상호작용이 연차 레벨·칭호·추억으로 축적",
        "표준 bundle 플러그인에 빌드 산출물 커밋 완료 — git 소스 한 줄로 설치, 적용하려면 web 재시작"
      ],
      "zh": [
        "状态机绑真实工作节奏：打盹/欢呼/惊吓/欢迎/沉思/等待批准各有触发条件",
        "投喂、玩耍、拖拽等互动会累积成资历等级、称号与回忆",
        "标准 bundle 插件且构建产物已入库，git 源一行装完；装后需重启 web 才生效"
      ]
    }
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
  "xiaobright/dsh-anchored-standard": {
    "intro": {
      "en": "This preset targets a specific observation: DeepSeek V4 Pro conditions strongly on the API-visible tool catalog when picking a trajectory. In the Project2 evaluation, Standard and PTC scored 91 and 92 while the official Minimal preset scored 99 and 96 — but staying on Minimal forever means giving up Standard's broader tool set. Anchored Standard separates initial trajectory selection from later tool use: it keeps Minimal's complete system prompt and exposes only the platform shell (pwsh on Windows, bash on Linux) plus `read` on the first request. Once the session records its first durable promotion signal — a `tool/call` or the first `assistant/message`, whichever comes first — all 25 Standard tools become visible. Request #1 always sees the bootstrap catalog and request #2 always sees the full one, so a text-only first reply can no longer trap the session in bootstrap. The phase is derived from durable session events, so resume and reload both preserve it. This is a community project: not an official DeepSeek preset, and not affiliated with or endorsed by DeepSeek.",
      "ja": "このプリセットが狙うのは具体的な観察結果だ。DeepSeek V4 Pro は、API から見えるツールカタログに強く条件づけられて軌跡を選ぶ。Project2 評価では Standard と PTC が 91 点と 92 点だったのに対し、公式 Minimal プリセットは 99 点と 96 点だった——しかし Minimal に留まり続けると Standard の広いツールセットを諦めることになる。Anchored Standard は「初期軌跡の選択」と「その後のツール利用」を分離する。Minimal の完全なシステムプロンプトはそのまま保ち、最初のリクエストではプラットフォーム shell（Windows なら pwsh、Linux なら bash）と `read` だけを露出する。セッションが最初の永続的な昇格シグナル——`tool/call` か最初の `assistant/message`、先に来た方——を記録した時点で、25 個の Standard ツールがすべて見えるようになる。リクエスト #1 は常にブートストラップカタログを、#2 は常に完全カタログを見るため、テキストのみの初回応答でセッションがブートストラップに閉じ込められることはない。フェーズは永続セッションイベントから導出されるので resume も reload も維持される。これはコミュニティプロジェクトであり、公式プリセットでも DeepSeek 公認でもない。",
      "ko": "이 프리셋은 구체적인 관찰에서 출발한다. DeepSeek V4 Pro는 API에 보이는 도구 카탈로그에 강하게 조건화되어 궤적을 고른다. Project2 평가에서 Standard와 PTC는 91점과 92점, 공식 Minimal 프리셋은 99점과 96점을 받았다 — 그러나 계속 Minimal에 머무르면 Standard의 넓은 도구 세트를 포기하게 된다. Anchored Standard는 '초기 궤적 선택'과 '이후 도구 사용'을 분리한다. Minimal의 완전한 시스템 프롬프트는 그대로 두고, 첫 요청에서는 플랫폼 shell(Windows는 pwsh, Linux는 bash)과 `read`만 노출한다. 세션이 첫 지속 승격 신호 — `tool/call` 또는 첫 `assistant/message` 중 먼저 오는 것 — 를 기록하면 25개 Standard 도구가 모두 보인다. 요청 #1은 항상 부트스트랩 카탈로그를, #2는 항상 전체 카탈로그를 보므로, 텍스트만 있는 첫 응답이 세션을 부트스트랩에 가둘 수 없다. 단계는 지속 세션 이벤트에서 파생되어 resume과 reload 모두 유지된다. 커뮤니티 프로젝트이며 공식 프리셋도, DeepSeek의 보증을 받은 것도 아니다.",
      "zh": "这个预设针对的是一个具体观察：DeepSeek V4 Pro 会强烈地根据 API 可见的工具目录来选择轨迹。在 Project2 评测里，Standard 和 PTC 拿到 91 和 92 分，而官方 Minimal 预设拿到 99 和 96——但一直待在 Minimal 又要放弃 Standard 更宽的工具集。Anchored Standard 的做法是把「初始轨迹选择」和「后续工具使用」拆开：保留 Minimal 的完整系统提示，第一个请求只暴露平台 shell（Windows 上是 pwsh，Linux 上是 bash）加 `read`；等会话记录下第一个持久提升信号——`tool/call` 或第一条 `assistant/message`，谁先到算谁——再放出全部 25 个 Standard 工具。请求 #1 永远看到引导目录，请求 #2 永远看到完整目录，纯文本的首轮回复不会再把会话卡在引导阶段。阶段状态从持久会话事件推导，所以恢复和重载都不会丢。这是社区项目，不是官方预设，也未获 DeepSeek 背书。"
    },
    "highlights": {
      "en": [
        "First request exposes only `pwsh`/`bash` plus `read`, keeping Minimal's complete system prompt to anchor the initial trajectory",
        "The first `tool/call` or first `assistant/message` (whichever comes first) promotes the session; request #2 sees the full 25-tool Standard catalog",
        "Phase is derived from durable session events, so resume and reload preserve it; `promoteOn` selects `either` / `tool-call` / `assistant-message`",
        "Project2 V4.1b with V4 Pro at reasoningEffort=max scored 98 and 99 across two runs; a community project, not an official preset"
      ],
      "ja": [
        "最初のリクエストは `pwsh`/`bash` + `read` の 2 つだけ、Minimal の完全システムプロンプトで初期軌跡を固定",
        "最初の `tool/call` または最初の `assistant/message`（先着）で昇格、リクエスト #2 で 25 ツールの Standard カタログが開く",
        "フェーズは永続セッションイベントから導出され resume / reload でも保持、`promoteOn` は `either` / `tool-call` / `assistant-message` を選択可",
        "Project2 V4.1b + V4 Pro + reasoningEffort=max で 2 ラン 98 / 99 点。コミュニティ製で公式プリセットではない"
      ],
      "ko": [
        "첫 요청은 `pwsh`/`bash` + `read` 두 개만, Minimal 전체 시스템 프롬프트로 초기 궤적을 고정",
        "첫 `tool/call` 또는 첫 `assistant/message`(먼저 오는 쪽)로 승격, 요청 #2에서 25개 Standard 카탈로그 개방",
        "단계는 지속 세션 이벤트에서 파생되어 resume·reload에도 보존, `promoteOn`으로 `either` / `tool-call` / `assistant-message` 선택",
        "Project2 V4.1b + V4 Pro + reasoningEffort=max에서 2회 실행 98 / 99점. 커뮤니티 프로젝트로 공식 프리셋 아님"
      ],
      "zh": [
        "第一个请求只给 `pwsh`/`bash` + `read` 两个工具，沿用 Minimal 完整系统提示锚定初始轨迹",
        "首个 `tool/call` 或首条 `assistant/message`（先到者为准）触发提升，第二个请求即放出完整 25 工具 Standard 目录",
        "阶段由持久会话事件推导，resume 与 reload 都保留；`promoteOn` 可选 `either` / `tool-call` / `assistant-message`",
        "Project2 V4.1b + V4 Pro + reasoningEffort=max 实测两轮 98 / 99 分；社区项目，非官方预设"
      ]
    }
  },
  "yejiming/MuseAI": {
    "intro": {
      "en": "MuseAI is neither an ordinary AI chat tool nor writing software; it behaves more like a local interactive world that persists settings, characters, memories and relationships. Create a world book and character cards under world settings, then open a one-on-one conversation — the character responds according to their persona, speaking style, relationship with you and past memories. After each conversation or adventure you can have it write relationship changes, key events and interaction patterns back into the character's file, and the bonds page organises those per character into a relationship overview, a timeline, conversation traces and adventure traces. Works, settings and session data all stay on your local machine, with models called through your own API key. Worth noting: this repository is the application itself, not a DSH plugin — installing MuseAI into DeepSeek Harness uses the author's separate repository yejiming/dsh-museai-tavern, a DSH client plugin.",
      "ja": "MuseAI は普通の AI チャットツールでも執筆ソフトでもなく、世界・キャラクター・記憶・関係を保存できるローカルの対話世界に近いものです。「背景設定」で世界観とキャラクターカードを作れば一対一の対話を始められ、キャラクターは設定・話し方・あなたとの関係・過去の記憶に基づいて応答します。対話や冒険が終わるたびに、関係の変化・重要な出来事・関わり方をキャラクターのファイルへ書き戻させることができ、「絆」ページがそれをキャラクターごとに関係概要・タイムライン・会話の足跡・冒険の足跡として整理します。作品・設定・セッションデータはすべてローカルに保存され、モデルは自分の API キーで呼び出します。注意点として、本リポジトリはアプリ本体であり DSH プラグインではありません——MuseAI を DeepSeek Harness に入れるには、作者の別リポジトリ yejiming/dsh-museai-tavern（DSH クライアントプラグイン）を使います。",
      "ko": "MuseAI는 평범한 AI 채팅 도구도 집필 소프트웨어도 아니고, 세계·캐릭터·기억·관계를 저장하는 로컬 상호작용 세계에 가깝습니다. 「배경 설정」에서 세계관과 캐릭터 카드를 만들면 일대일 대화를 시작할 수 있고, 캐릭터는 설정·말투·당신과의 관계·과거 기억에 따라 반응합니다. 대화나 모험이 끝날 때마다 관계 변화와 중요한 사건, 지내 온 방식을 캐릭터 파일에 되써 넣게 할 수 있으며, 「유대」 페이지가 이를 캐릭터별로 관계 개요·타임라인·대화 발자취·모험 발자취로 정리합니다. 작품과 설정, 세션 데이터는 모두 로컬에 저장되고 모델은 자신의 API 키로 호출합니다. 유의할 점은 이 저장소가 앱 본체이지 DSH 플러그인이 아니라는 것입니다——MuseAI를 DeepSeek Harness에 넣으려면 작성자의 다른 저장소 yejiming/dsh-museai-tavern(DSH 클라이언트 플러그인)을 써야 합니다.",
      "zh": "MuseAI 不是普通的 AI 聊天工具，也不是写作软件，更像一个能保存世界、角色、记忆和关系的本地互动世界。在「背景设定」里建好世界书和角色卡，就能开一对一角色对话——角色会依人设、说话风格、与你的关系和过往记忆来回应。每次对话或冒险结束后可以让它把关系变化、重要事件和相处模式写回角色档案，「羁绊」页按角色整理成关系概览、时间线、会话足迹和冒险足迹。作品、设定与会话数据都保存在本地电脑，只通过你自己的 API Key 调模型。需要说明的是，本仓库是应用本体而不是 DSH 插件——把 MuseAI 装进 DeepSeek Harness 要用作者的另一个仓库 yejiming/dsh-museai-tavern（DSH 客户端插件）。"
    },
    "highlights": {
      "en": [
        "Character cards, world book and long-term memory: relationship changes and key events are written back into character files as a reviewable bond timeline",
        "All data stored locally, with models called through your own API key",
        "Note: this repo is the app itself; the DSH plugin lives in the author's separate repo yejiming/dsh-museai-tavern"
      ],
      "ja": [
        "キャラクターカード＋世界観設定＋長期記憶：関係の変化と重要イベントをキャラクターファイルに書き戻し、振り返れる絆のタイムラインに",
        "データはすべてローカル保存、モデルは自分の API キーで呼び出し",
        "注意：本リポジトリはアプリ本体。DSH プラグインは作者の別リポジトリ yejiming/dsh-museai-tavern にある"
      ],
      "ko": [
        "캐릭터 카드 + 세계관 설정 + 장기 기억: 관계 변화와 핵심 사건을 캐릭터 파일에 되써 넣어 되돌아볼 수 있는 유대 타임라인 구성",
        "모든 데이터를 로컬에 저장하고 모델은 자신의 API 키로 호출",
        "유의: 이 저장소는 앱 본체이며 DSH 플러그인은 작성자의 다른 저장소 yejiming/dsh-museai-tavern에 있음"
      ],
      "zh": [
        "角色卡 + 世界书 + 长期记忆：关系变化与关键事件回写角色档案，形成可回顾的羁绊时间线",
        "数据全部本地保存，只用你自己的 API Key 调模型",
        "注意：本仓库是应用本体，DSH 插件在作者的另一个仓库 yejiming/dsh-museai-tavern"
      ]
    }
  },
  "ysr666/dsh-vision-router": {
    "intro": {
      "en": "Most DSH vision plugins bridge an image into a text description and feed that to DeepSeek — lossy, one-shot and blind to pixels. This plugin inverts that: the original pixels stay on the vision model's side, DeepSeek stays on the reasoning side, and looking at an image becomes an ordinary tool call. Installation is one command: the package ships its own `dsh.bundle.patch`, so `dsh plugin add` wires the route row, the admission wrapper and the attachment limits (relaxed to 20MB / 100MP) automatically — purely additive, never touching the core rows, with no manual file edits. Taking over the official DeepSeek route is an optional stealth setting, off by default. Free by default: the vision chain starts with a built-in OVHcloud anonymous endpoint (Qwen2.5-VL-72B-Instruct, no account, no key, 2 requests/min per IP), with OpenRouter, Pi-AI providers or any OpenAI-compatible endpoint as optional upgrades. No Python anywhere — downscale, grounding, crop, pixel diff, palette, OCR, SVG trace, cutout and HTML screenshot all run on sharp, potrace, tesseract and system Chrome. Because seeing is a tool call, the work can be continuous and multi-step: `vision_ground` → `vision_crop` → `vision_describe` → `vision_pixel_diff` → fix → screenshot again, iterating until it's done. Text turns are untouched in model, cost and context; the vision model is called only on demand and answers are cached by image content. It stays transparent to the user too: uploaded images keep rendering as images in the conversation UI, and the rewrite that points the model at the vision tools happens only inside the model call, never in the session log. Since v1.1.0 Extra vision wrappers let any custom text route (opencode, for instance) send images out of the box, alongside long-screenshot OCR, a connection-test button and artifact preview cards.",
      "ja": "多くの DSH ビジョンプラグインは、画像をテキスト説明に変換して DeepSeek に渡す——非可逆で、一度きりで、ピクセルには無頓着だ。このプラグインは逆を行く。元のピクセルはビジョンモデル側に残り、DeepSeek は推論側に残り、「画像を見る」ことがふつうのツール呼び出しになる。導入はコマンド 1 つ。パッケージ自身が `dsh.bundle.patch` を同梱しているので、`dsh plugin add` がルート行・アドミッション wrapper・添付上限（20MB / 100MP に緩和）を自動で配線する。純粋な追加のみでコア行には触れず、手作業のファイル編集も不要だ。公式 DeepSeek ルートを乗っ取るかどうかは任意のステルス設定で、既定はオフ。既定で無料——ビジョンチェーンは内蔵の OVHcloud 匿名エンドポイント（Qwen2.5-VL-72B-Instruct、アカウント不要・キー不要、IP あたり毎分 2 回）から始まり、OpenRouter・Pi-AI・任意の OpenAI 互換エンドポイントは任意のアップグレードとして選べる。Python はどこにも要らない。縮小、grounding、切り抜き、ピクセル diff、パレット、OCR、SVG トレース、切り抜き、HTML スクリーンショットはすべて sharp / potrace / tesseract / システムの Chrome 上で動く。見ることがツール呼び出しである以上、作業は連続的で多段になりうる。`vision_ground` → `vision_crop` → `vision_describe` → `vision_pixel_diff` → 修正 → もう一度スクリーンショット、と終わるまで反復できる。テキストターンはモデル・コスト・コンテキストのいずれも影響を受けず、ビジョンモデルは必要なときだけ呼ばれ、回答は画像内容でキャッシュされる。ユーザーから見ても透明だ。アップロードした画像は会話 UI 上で画像のまま描画され、モデルをビジョンツールに向ける書き換えはモデル呼び出しの内部でのみ起こり、セッションログには入らない。v1.1.0 以降は Extra vision wrappers により、任意のカスタムテキストルート（たとえば opencode）でも画像送信がそのまま使えるようになり、長いスクリーンショットの OCR、接続テストボタン、成果物プレビューカードも加わった。",
      "ko": "대부분의 DSH 비전 플러그인은 이미지를 텍스트 설명으로 바꿔 DeepSeek에 넘긴다 — 손실이 있고, 일회성이며, 픽셀에 무감각하다. 이 플러그인은 반대로 간다. 원본 픽셀은 비전 모델 쪽에 남고 DeepSeek은 추론 쪽에 남으며, '이미지를 본다'는 것이 평범한 도구 호출이 된다. 설치는 명령 하나다. 패키지가 자체 `dsh.bundle.patch`를 담고 있어 `dsh plugin add`가 라우트 행과 어드미션 래퍼, 첨부 한도(20MB / 100MP로 완화)를 자동으로 연결한다. 순수 추가 방식이라 코어 행을 건드리지 않고 파일을 손으로 고칠 필요도 없다. 공식 DeepSeek 라우트를 가로챌지는 선택적인 스텔스 설정이며 기본은 꺼짐이다. 기본이 무료다. 비전 체인은 내장 OVHcloud 익명 엔드포인트(Qwen2.5-VL-72B-Instruct, 계정 불필요·키 불필요, IP당 분당 2회)에서 시작하고, OpenRouter나 Pi-AI, 임의의 OpenAI 호환 엔드포인트는 선택적 업그레이드다. Python은 어디에도 필요 없다. 축소, grounding, 자르기, 픽셀 diff, 팔레트, OCR, SVG 트레이스, 누끼, HTML 스크린샷이 모두 sharp / potrace / tesseract / 시스템 Chrome 위에서 돈다. 보는 것이 도구 호출이므로 작업은 연속적이고 다단계가 될 수 있다. `vision_ground` → `vision_crop` → `vision_describe` → `vision_pixel_diff` → 수정 → 다시 스크린샷으로 끝날 때까지 반복한다. 텍스트 턴은 모델·비용·컨텍스트 모두 그대로이고, 비전 모델은 필요할 때만 호출되며 답변은 이미지 내용 기준으로 캐시된다. 사용자에게도 투명하다. 업로드한 이미지는 대화 UI에서 여전히 이미지로 렌더링되고, 모델을 비전 도구로 향하게 하는 재작성은 모델 호출 내부에서만 일어나며 세션 로그에는 들어가지 않는다. v1.1.0부터는 Extra vision wrappers로 임의의 커스텀 텍스트 라우트(예: opencode)에서도 이미지 전송이 바로 되고, 긴 스크린샷 OCR과 연결 테스트 버튼, 산출물 미리보기 카드도 추가됐다.",
      "zh": "多数 DSH 视觉插件把图片桥接成一段文字描述再喂给 DeepSeek——有损、一次性、对像素无感。这个插件的思路相反：原始像素留在视觉模型那侧，DeepSeek 留在推理那侧，而「看图」变成一次普通的工具调用。一条命令装完即用：包自带 `dsh.bundle.patch`，`dsh plugin add` 会自动接好路由行、准入 wrapper 和附件上限（放宽到 20MB / 100MP），纯增量、不碰核心行，不需要手改任何文件；是否接管官方 DeepSeek 路由是可选的隐身模式，默认关闭。默认免费：视觉链路首选内置的 OVHcloud 匿名端点（Qwen2.5-VL-72B-Instruct，无需账号无需 Key，每 IP 每分钟 2 次），OpenRouter、Pi-AI 或任意 OpenAI 兼容端点是可选升级。全链路不需要 Python——降采样、grounding、裁剪、像素 diff、调色板、OCR、SVG 描摹、抠图、HTML 截图都跑在 sharp / potrace / tesseract / 系统 Chrome 上。因为看图是工具调用，所以可以连续多步：`vision_ground` → `vision_crop` → `vision_describe` → `vision_pixel_diff` → 改 → 再截图，一直迭代到做完。文本回合的模型、成本和上下文完全不受影响，视觉模型只在需要时被调用，答案按图片内容缓存。对用户也是透明的：上传的图片在对话界面里仍然渲染成图片，指向视觉工具的改写只发生在模型调用内部，不进会话日志。v1.1.0 起支持 Extra vision wrappers，任意自定义文本路由（比如 opencode）也能开箱发图，另有长截图 OCR、连接测试按钮和产物预览卡片。"
    },
    "highlights": {
      "en": [
        "One-command install: the bundle patch wires the route row, admission wrapper and attachment limits (20MB / 100MP) — purely additive, core rows untouched",
        "Free by default via a built-in OVHcloud anonymous endpoint (Qwen2.5-VL-72B, no account or key); paid chains are optional upgrades, and no Python is needed",
        "Seeing is an ordinary tool call, so work is multi-step: ground → crop → describe → pixel_diff → fix → screenshot again, iterating to completion",
        "Text turns keep their model, cost and context; uploaded images still render as images, and the rewrite lives inside the model call, never the session log"
      ],
      "ja": [
        "コマンド 1 つで導入：bundle patch がルート行・アドミッション wrapper・添付上限（20MB / 100MP）を自動配線、純追加でコア行不変",
        "既定で無料：内蔵 OVHcloud 匿名エンドポイント（Qwen2.5-VL-72B、アカウント・キー不要）。有料チェーンは任意、Python も不要",
        "見ることがふつうのツール呼び出しなので多段作業が可能：ground → crop → describe → pixel_diff → 修正 → 再スクリーンショットで反復",
        "テキストターンのモデル・コスト・コンテキストは不変。アップロード画像は画像のまま表示され、書き換えはモデル呼び出し内部に留まりログに残らない"
      ],
      "ko": [
        "명령 하나로 설치: bundle patch가 라우트 행·어드미션 래퍼·첨부 한도(20MB / 100MP)를 자동 연결, 순수 추가라 코어 행은 그대로",
        "기본이 무료: 내장 OVHcloud 익명 엔드포인트(Qwen2.5-VL-72B, 계정·키 불필요). 유료 체인은 선택 사항이고 Python도 불필요",
        "보는 것이 평범한 도구 호출이라 다단계 작업 가능: ground → crop → describe → pixel_diff → 수정 → 재스크린샷으로 반복",
        "텍스트 턴의 모델·비용·컨텍스트는 그대로. 업로드 이미지는 이미지로 표시되고 재작성은 모델 호출 내부에 머물러 로그에 남지 않는다"
      ],
      "zh": [
        "一条命令装完：自带 bundle patch 自动接好路由行、准入 wrapper 与附件上限（20MB / 100MP），纯增量不碰核心行",
        "默认免费：内置 OVHcloud 匿名端点（Qwen2.5-VL-72B，无账号无 Key），付费链路是可选升级；全程无需 Python",
        "看图是普通工具调用，可连续多步：ground → crop → describe → pixel_diff → 改 → 再截图，迭代到完成",
        "文本回合的模型、成本与上下文不受影响；上传图在界面里仍是图片，改写只发生在模型调用内部不进会话日志"
      ]
    }
  },
  "zhu1090093659/dsh-web": {
    "intro": {
      "en": "dsh-web brings \"everything is a plugin\" to the DSH Web GUI. A performance engine tracks per-session event rate and event-loop p99 latency, then throttles write batching and sheds render load across three tiers. A five-column task board runs tasks on real DSH agent sessions with cron scheduling and automatic status write-back. QR pairing puts your workspace on a phone — and the same link can drive a full Web GUI on another PC. An SSH panel provides terminal, SFTP transfer, port forwarding and cluster execution. describe_image gives text-only models vision while keeping the image itself out of the transcript. LiangShen mode is a two-stage anchored agent preset, and Rescue mode transactionally detects, repairs and byte-rolls-back a broken profile. Every capability ships as its own package, so you can install the whole bundle or just one, on either the web or desktop profile. Skins and pets are distributed through the Creative Workshop.",
      "ja": "dsh-web は「すべてはプラグイン」を DeepSeek Harness Web GUI で実現します。パフォーマンスエンジンはセッションごとのイベント速度とイベントループ p99 遅延を計測し、書き込みバッチ調整とレンダリング負荷軽減を三段階で行います。五列のタスクボードは cron 定期実行に対応し、実際の DSH エージェントセッションが実行して状態を自動反映。QR ペアリングでワークスペースをスマホへ、同じリンクで別の PC も遠隔操作できます。SSH パネルはターミナル、SFTP 転送、ポート転送、クラスタ実行を提供。describe_image はテキスト専用モデルに視覚を与えつつ、画像自体は会話履歴に残しません。梁神モードは二段階アンカーの agent プリセット、レスキューモードは壊れた profile をトランザクションで検知・修復し、失敗時はバイト単位でロールバックします。各機能は独立パッケージで、一括導入も単体導入も可能。web と desktop の両 profile に対応し、スキンとペットは創作ワークショップから配布されます。",
      "ko": "dsh-web은 \"모든 것이 플러그인\"을 DeepSeek Harness Web GUI에서 구현합니다. 성능 엔진은 세션별 이벤트 속도와 이벤트 루프 p99 지연을 관측하고, 쓰기 배치 조정과 렌더링 부하 경감을 3단계로 수행합니다. 5열 작업 보드는 cron 예약을 지원하며 실제 DSH 에이전트 세션이 실행하고 상태를 자동 반영합니다. QR 페어링으로 워크스페이스를 폰에서 원격 제어하고, 같은 링크로 다른 PC도 구동할 수 있습니다. SSH 패널은 터미널, SFTP 전송, 포트 포워딩, 클러스터 실행을 제공합니다. describe_image는 텍스트 전용 모델에 시각을 더하면서 이미지 자체는 대화 기록에 남기지 않습니다. 량션 모드는 2단계 앵커드 agent 프리셋이고, 레스큐 모드는 손상된 profile을 트랜잭션으로 감지·복구하며 실패 시 바이트 단위로 롤백합니다. 모든 기능이 개별 패키지로 배포되어 번들 일괄 설치도 단독 설치도 가능하며, web과 desktop 두 profile을 모두 지원합니다. 스킨과 펫은 창작 워크숍을 통해 배포됩니다.",
      "zh": "dsh-web 把「一切皆插件」落到 DeepSeek Harness Web GUI 上：性能引擎实时观测事件速率与事件循环 p99 延迟，并分档做写批频控与渲染降载；五列任务看板支持 cron 定时，由真实 DSH 智能体会话执行并回写状态；扫码配对可把工作区远程到手机，同一链接也能远程另一台 PC；SSH 面板给出终端、SFTP 传输、端口转发与集群执行；describe_image 为纯文本模型补上视觉，且图片本身不进会话记录；梁神模式是两阶段锚定的 agent 预设；救助模式以事务方式检测、修复并按字节回滚坏掉的 profile。每一样都是独立成包的插件，可整包装齐也可单装，web 与 desktop 两个 profile 都支持；皮肤与宠物资产统一走创意工坊分发。"
    },
    "highlights": {
      "en": [
        "Performance engine watches event-loop latency and sheds render load in three tiers",
        "Task board runs on real DSH agent sessions with cron scheduling and status write-back",
        "QR pairing remotes the workspace to a phone — the same link also drives another PC",
        "Rescue mode repairs a broken profile transactionally, rolling back byte-for-byte on failure"
      ],
      "ja": [
        "パフォーマンスエンジンがイベントループ遅延を監視し、三段階で描画負荷を軽減",
        "タスクボードは実際の DSH セッションが cron 実行し、状態を自動反映",
        "QR ペアリングでスマホへ遠隔、同じリンクで別の PC も操作可能",
        "レスキューモードはトランザクション自己修復、失敗時はバイト単位でロールバック"
      ],
      "ko": [
        "성능 엔진이 이벤트 루프 지연을 관측하고 3단계로 렌더링 부하 경감",
        "작업 보드는 실제 DSH 세션이 cron으로 실행하고 상태를 자동 반영",
        "QR 페어링으로 폰 원격 제어, 같은 링크로 다른 PC도 구동",
        "레스큐 모드는 트랜잭션 자가 복구, 실패 시 바이트 단위 롤백"
      ],
      "zh": [
        "性能引擎实时观测事件循环延迟，按档位做写批频控与渲染降载",
        "任务看板支持 cron 定时，由真实 DSH 会话执行并自动回写状态",
        "扫码配对把工作区远程到手机，同一链接也能远程另一台 PC",
        "救助模式事务式自愈：健康门禁不过就按字节回滚 profile"
      ]
    }
  },
  "labmimors/dsh-mcp-lens": {
    "installCmd": "dsh plugin --profile web add \\\n  https://github.com/labmimors/dsh-mcp-lens/releases/download/v0.1.0-rc.7/dsh-mcp-lens-0.1.0-rc.7.tgz"
  },
  "CocoSgt/dsh-inspector": {
    "installCmd": "dsh plugin --profile web add dsh-inspector"
  },
  "CocoSgt/dsh-skills": {
    "installCmd": "dsh plugin --profile web add dsh-skills"
  },
  "CocoSgt/dsh-attachments": {
    "installCmd": "dsh plugin --profile web add dsh-attachments"
  },
  "ayuanwong/dsh-ux": {
    "installCmd": "git clone https://github.com/ayuanwong/deepseek-harness-ux.git\ncd deepseek-harness-ux && pnpm install && pnpm run build\npnpm run dsh -- web --port 3081"
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
