// 由 scripts/gen-plugins-real.mjs 从 Turso plugin_i18n 表生成——请勿手改。
// 文案唯一事实源在 Turso，用 scripts/set-plugin-i18n.mjs 维护；改完跑 pnpm gen:plugins 刷新本文件。
// 生成时间：2026-08-15T01:06:36.945Z
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
  "Anionex/agent-vision-toolkit": {
    "en": "The upstream toolkit that lets text-only models handle vision tasks. On DSH it arrives through its independently maintained dsh-vision-toolkit package, bringing 10 structured visual tools into Web and Headless profiles.",
    "ja": "テキスト専用モデルに視覚タスクをこなさせる上流ツールボックス。DSH へは独立管理の dsh-vision-toolkit パッケージ経由で入り、10 の構造化ビジュアルツールを Web と Headless の profile にもたらす。",
    "ko": "텍스트 전용 모델이 비전 작업을 하게 해 주는 상류 툴박스. DSH에는 독립 관리되는 dsh-vision-toolkit 패키지를 통해 들어가며, 10개의 구조화된 시각 도구를 Web과 Headless profile에 가져온다.",
    "zh": "让纯文本模型做视觉任务的上游工具箱。进 DSH 走它独立维护的 dsh-vision-toolkit 包，把 10 个结构化视觉工具带进 Web 与 Headless profile。"
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
  "Devin-AXIS/iPolloWork": {
    "en": "A local-first visual AI workbench that turns one goal into editable code, documents, presentations, websites, designs and videos. Its DSH subagent collaboration is still in development and not in the stable release yet.",
    "ja": "ローカルファーストのビジュアル AI ワークベンチ。一つのゴールを、編集を続けられるコード・ドキュメント・プレゼン・ウェブサイト・デザイン・動画に変える。DSH とのサブエージェント連携は開発中で、安定版には未搭載。",
    "ko": "로컬 우선 비주얼 AI 작업대. 하나의 목표를 계속 편집할 수 있는 코드·문서·프레젠테이션·웹사이트·디자인·영상으로 바꾼다. DSH 서브에이전트 협업은 아직 개발 중이며 안정 릴리스에 없다.",
    "zh": "本地优先的可视化 AI 工作台，把一个目标变成可继续编辑的代码、文档、演示、网站、设计与视频。与 DSH 的子代理协作仍在开发中，尚未进入稳定版。"
  },
  "Electricitysheep/dsh-handbook": {
    "en": "The DeepSeek Harness handbook: a 14-chapter Chinese-language guide from zero to one, with every chapter's commands actually tested, readable online or as a PDF.",
    "ja": "DeepSeek Harness ホワイトペーパー。ゼロからイチまでの中国語入門書 14 章で、各章のコマンドはすべて実測済み。オンライン閲覧と PDF の両方に対応。",
    "ko": "DeepSeek Harness 백서. 0에서 1까지 다루는 중국어 입문서 14장으로, 각 장의 명령을 모두 실측했다. 온라인 열람과 PDF 모두 제공.",
    "zh": "DeepSeek Harness 白皮书：14 章从 0 到 1 的中文新手百科，每章命令都实测过，可在线读也可下 PDF。"
  },
  "Lum1104/dsh-browser": {
    "en": "Connects DSH to the Chrome tab you are already using: read pages, click controls, fill forms, scroll and navigate while login state, session and cookies are preserved, with a side panel as the conversation UI.",
    "ja": "すでに使っている Chrome タブに DSH をつなぐ。ページの読み取り、コントロールのクリック、フォーム入力、スクロール、遷移を、ログイン状態・セッション・cookie を保ったまま実行。サイドパネルが会話 UI になる。",
    "ko": "이미 쓰고 있는 Chrome 탭에 DSH를 연결한다. 페이지 읽기, 컨트롤 클릭, 폼 입력, 스크롤, 이동을 로그인 상태·세션·쿠키를 유지한 채 수행하며, 사이드 패널이 대화 UI가 된다.",
    "zh": "把 DSH 接到你正在用的那个 Chrome 标签页：读页面、点控件、填表单、滚动、跳转，登录态、会话和 cookie 全保留，侧边栏就是对话界面。"
  },
  "Nagi-ovo/dsh-ads": {
    "en": "Turns DeepSeek Harness into a 2005 web portal — even inference gets ad breaks. The ads are fake, the plugin is real, and the repos in the recommendation slots are genuine links.",
    "ja": "DeepSeek Harness を 2005 年のポータルサイトに変える。inference すら広告から逃れられない。広告は偽物だがプラグインは本物で、推薦枠のリポジトリは実在のリンク。",
    "ko": "DeepSeek Harness를 2005년 포털 사이트로 바꾼다. inference조차 광고를 피하지 못한다. 광고는 가짜지만 플러그인은 진짜이고, 추천 자리의 저장소는 실제 링크다.",
    "zh": "把 DeepSeek Harness 变成 2005 年的门户网站，连 inference 都逃不过广告。广告是假的，插件是真的——推荐位里的插件仓库点开都是真链接。"
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
  "Small-tailqwq/dsh-deep-whale": {
    "en": "A whale-girl themed skin series for the DSH Web GUI, shipped from its own distribution repo. Current resident: maid-atelier — a deep-sea maid atelier with twin-maid backdrop, deep-blue lace interface and chibi sidebar.",
    "ja": "DSH Web GUI 向けクジラ娘テーマのスキンシリーズ（独立配布リポジトリ）。現在の住人は maid-atelier——深海メイド工房、双子メイドの背景・深海ブルーのレース調 UI・デフォルメ版サイドバー。",
    "ko": "DSH Web GUI용 고래소녀 테마 스킨 시리즈(독립 배포 저장소). 현재 입주자는 maid-atelier——심해 메이드 공방, 쌍둥이 메이드 배경과 심해 블루 레이스 인터페이스, 데포르메 사이드바.",
    "zh": "DSH Web GUI 的鲸鱼娘主题皮肤系列，独立分发仓库。当前住户 maid-atelier：深海女仆工坊，双女仆背景、深海蓝蕾丝界面与 Q 版侧栏。"
  },
  "anywhere-labs/deepseek-harness-desktop": {
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
  "bruc3van/awesome-dsh-plugin": {
    "en": "Sifts the 2000+ repos tagged dsh-plugin down to the ones that solve a real problem, explain themselves clearly and are still maintained — then tells you who each plugin is for and where to start.",
    "ja": "dsh-plugin タグの付いた 2000 以上のリポジトリから「実際の問題を解決し、説明が明快で、今も保守されている」ものだけを選び出し、各プラグインが誰に向いていてどこから始めるべきかまで示す。",
    "ko": "dsh-plugin 태그가 달린 2000개 넘는 저장소에서 「실제 문제를 풀고, 설명이 분명하며, 아직 유지보수되는」 것만 골라내고, 각 플러그인이 누구에게 맞는지와 어디서 시작할지까지 알려 준다.",
    "zh": "从 2000+ 个挂着 dsh-plugin 标签的仓库里筛出「解决真实问题、说得清楚、还在维护」的那部分，并告诉你每个插件适合谁、从哪开始。"
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
  "drewnekota/cetus": {
    "en": "Turns your favourite agent runtime into an always-on desktop assistant. DSH is one of its supported runtimes — it reuses the dsh CLI you have already installed and signed into, with no second account to configure.",
    "ja": "使い慣れた agent ランタイムを常駐のデスクトップアシスタントに変える。DSH は対応ランタイムの一つで、すでにインストール・ログイン済みの dsh CLI をそのまま再利用でき、アカウントの再設定は不要。",
    "ko": "즐겨 쓰는 agent 런타임을 상시 대기 데스크톱 어시스턴트로 바꾼다. DSH는 지원 런타임 중 하나로, 이미 설치하고 로그인해 둔 dsh CLI를 그대로 재사용하므로 계정을 다시 설정할 필요가 없다.",
    "zh": "把你惯用的 agent 运行时变成常驻桌面助手。DSH 是它支持的运行时之一——复用你已经装好、登录好的 dsh CLI，不需要再配一套账号。"
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
  "hust-open-atom-club/oh-dsh": {
    "en": "One DSH runtime, three independently installable ways to interact with it: DeepSeek Harness, Node.js and local capabilities packaged into Desktop, Web and TUI distributions.",
    "ja": "一つの DSH runtime に、独立して導入できる 3 通りの操作方法。DeepSeek Harness・Node.js・ローカル機能を Desktop／Web／TUI のディストリビューションとしてパッケージ化。",
    "ko": "하나의 DSH runtime, 독립적으로 설치 가능한 세 가지 상호작용 방식. DeepSeek Harness와 Node.js, 로컬 기능을 Desktop·Web·TUI 배포판으로 묶었다.",
    "zh": "一套 DSH runtime，三种可独立安装的交互方式：把 DeepSeek Harness、Node.js 和本地能力打包成 Desktop、Web 与 TUI 发行版。"
  },
  "lehhair/dsh-diff-viewer": {
    "ja": "DSH Web GUI の PiUI 風 diff ビューアプラグイン。ui-tool diff-card チェーンスロット経由で write/edit ツール呼び出しの標準 DiffBlock を置き換える（ホストパッチ同梱）。",
    "ko": "DSH Web GUI의 PiUI 스타일 diff 뷰어 플러그인. ui-tool diff-card 체인 슬롯으로 write/edit 도구 호출의 기본 DiffBlock을 대체한다(호스트 패치 포함).",
    "zh": "DSH Web GUI 的 PiUI 风格 diff 查看器插件：通过 ui-tool diff-card 链式插槽替换 write/edit 工具调用的原生 DiffBlock（附宿主补丁）。"
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
  "omdsh-dev/DSH-better-sidebar": {
    "en": "A complete workbench inside the sidebar: third-party extensions can register new tabs; file rendering & editing, terminal, Git, and subagents built in.",
    "ja": "サイドバーに収まるフル装備のワークベンチ。サードパーティ拡張が新しいタブを登録でき、ファイル表示・編集／ターミナル／Git／サブエージェントを内蔵。",
    "ko": "사이드바 하나에 담긴 완전한 워크벤치. 서드파티 확장이 새 탭을 등록할 수 있으며 파일 렌더링·편집/터미널/Git/서브에이전트 내장."
  },
  "omdsh-dev/dsh-at-file": {
    "en": "Type @ in the DSH composer to search the current workspace and insert a file or directory path. The plugin passes the path only — never the contents — leaving it to the agent to decide whether to open it.",
    "ja": "DSH の入力欄で @ を打つと現在のワークスペースを検索し、ファイルやディレクトリのパスを挿入できる。プラグインが渡すのはパスのみで内容は読まず、開くかどうかは agent が判断する。",
    "ko": "DSH 입력창에서 @를 입력하면 현재 워크스페이스를 검색해 파일이나 디렉터리 경로를 삽입한다. 플러그인은 경로만 전달하고 내용은 읽지 않으며, 열지 여부는 agent가 정한다.",
    "zh": "在 DSH 输入框里打 @ 就能搜当前工作区、插入文件或目录路径。插件只递路径不读内容，要不要打开由 agent 自己决定。"
  },
  "omdsh-dev/dsh-data-agent": {
    "en": "Ships a dedicated Data Agent preset so the AI can query, update, and analyze your data for you.",
    "ja": "専用の Data Agent プリセットを定義し、AI にデータの照会・更新・分析を任せられる。",
    "ko": "전용 Data Agent 프리셋을 정의해 AI가 데이터 조회·업데이트·분석을 대신하게 한다."
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
  "omdsh-dev/fabric": {
    "en": "A hook processor in the spirit of Minecraft Fabric.",
    "ja": "MC Fabric ライクなフックプロセッサ。",
    "ko": "MC Fabric 스타일의 후크 프로세서."
  },
  "titanwings/colleague-skill": {
    "en": "Distill anyone into an AI Skill: source material plus your description yields a Skill that genuinely thinks in their frame and speaks in their voice. Colleagues, family, idols, fictional characters — even yourself.",
    "ja": "誰でも AI Skill に蒸留する。素材とあなたの説明から、その人の思考の枠組みで考え、その人の口調で話す Skill を生成。同僚・家族・推し・架空のキャラ、そして自分自身も。",
    "ko": "누구든 AI Skill로 증류한다. 자료와 당신의 설명을 주면 그 사람의 사고 틀로 생각하고 그 사람의 말투로 답하는 Skill이 나온다. 동료·가족·최애·가상 인물, 심지어 자기 자신까지.",
    "zh": "把任何人蒸馏成一个 AI Skill：素材加一段你的描述，产出一个真按他的思路思考、用他的语气说话的 Skill。同事、家人、偶像、虚构角色，甚至你自己。"
  },
  "vibeinging/dsh-work": {
    "ja": "DSH プラグインのためのローカルファースト AI ワークベンチ。Agent セッション、プロジェクトファイル、データ分析、Web リサーチ、MCP、Office 成果物を 1 つの Electron デスクトップアプリに統合。",
    "ko": "DSH 플러그인을 위한 로컬 우선 AI 워크벤치. Agent 세션, 프로젝트 파일, 데이터 분석, 웹 리서치, MCP, Office 산출물을 하나의 Electron 데스크톱 앱에 통합.",
    "zh": "面向 DSH 插件的本地优先 AI 工作台：把 Agent 会话、项目文件、数据分析、网络调研、MCP 与 Office 产物整合进一个 Electron 桌面应用。"
  },
  "vlln/whale-girl": {
    "en": "A desktop pet in the bottom-right of the DSH Web GUI: draggable, feedable, playable, accumulating seniority levels, titles and memories from the tasks, sessions and companion time you rack up.",
    "ja": "DSH Web GUI の右下に住むデスクトップペット。ドラッグでき、餌やりや遊びに応じ、こなしたタスク・セッション・共に過ごした時間から経験レベル・称号・思い出を積み上げていく。",
    "ko": "DSH Web GUI 우하단에 사는 데스크톱 펫. 끌 수 있고 먹이를 주거나 놀아 줄 수 있으며, 완료한 작업·세션·함께한 시간으로 연차 레벨과 칭호, 추억을 쌓아 간다.",
    "zh": "DSH Web GUI 右下角的桌宠（QQ 宠物形态）：可拖拽、可投喂玩耍，随你完成任务、会话和陪伴时长积累资历等级、称号与回忆。"
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
  "yejiming/MuseAI": {
    "en": "A local AI companion, text-adventure and story-immersion app: build your own characters and world settings, and accumulate relationships, memories and bonds across ongoing conversations. Data stays on your machine, called with your own API key.",
    "ja": "ローカルの AI コンパニオン、テキストアドベンチャー、物語没入アプリ。自作のキャラクターと世界設定を用意し、続く対話の中で関係・記憶・絆を積み上げる。データは手元に残り、自分の API キーで呼び出す。",
    "ko": "로컬 AI 동반자·텍스트 어드벤처·이야기 몰입 앱. 직접 만든 캐릭터와 세계 설정으로 이어지는 대화 속에서 관계와 기억, 유대를 쌓는다. 데이터는 내 컴퓨터에 남고 자신의 API 키로 호출한다.",
    "zh": "本地 AI 伴侣、文字冒险与穿书互动应用：自建角色与世界设定，在持续对话里积累关系、记忆与羁绊。数据留在本机，用自己的 API Key。"
  },
  "zhu1090093659/dsh-web-ui": {
    "ja": "DSH Web UI のプラグイン＆スキン集——タスクボード、Git グラフ、右サイドパネル、モバイル遠隔 UI、ペット、リアルタイム token 統計、スキンセンター。",
    "ko": "DSH Web UI 플러그인·스킨 모음 — 작업 보드, Git 그래프, 오른쪽 패널, 원격 모바일 UI, 펫, 실시간 token 통계, 스킨 센터.",
    "zh": "DSH Web UI 插件与皮肤合集——任务看板、Git 图谱、右侧面板、远程移动端 UI、桌宠、实时 token 统计与皮肤中心。"
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
    },
    "installCmd": "# 本仓库是上游工具箱；进 DSH 用它以子模块方式维护的独立包\ndsh plugin --profile web add @anionex/dsh-vision-toolkit\n# Headless profile 同理：dsh plugin --profile headless add @anionex/dsh-vision-toolkit"
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
    },
    "installCmd": "# 独立桌面应用，从 Releases 下载\nhttps://github.com/Devin-AXIS/iPolloWork/releases/latest\n# 注：与 DSH 的子代理协作仍在开发中，尚未进入稳定版"
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
  "anywhere-labs/deepseek-harness-desktop": {
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
  "hust-open-atom-club/oh-dsh": {
    "intro": {
      "en": "Oh-DSH is not a plugin you install into a profile — it is a packaged distribution that bundles DeepSeek Harness, the Node.js runtime and local capabilities together, downloaded straight from Releases. The model still runs in the cloud; what Oh-DSH owns is the local half: workspace, terminal, Git review, browser, window integration and plugin lifecycle. Three shapes are available, pick by need: the full build ships Desktop, Web, TUI, the Node runtime and bundled plugins for a local development workbench; Web-only drops Electron for a lighter install or remote use; TUI-only suits pure terminal environments. The full build ships DMG/ZIP, AppImage/deb and Windows packages per platform. The project has been featured in the official DeepSeek Harness community showcase, and its terminal side builds on the likewise community-recognised dsh-TUI upstream plugin with full attribution preserved.",
      "ja": "Oh-DSH は profile に入れるプラグインではなく、DeepSeek Harness・Node.js runtime・ローカル機能をまとめてパッケージ化したディストリビューションで、Releases から直接ダウンロードします。モデルは引き続きクラウドで動作し、Oh-DSH が担うのはローカル側——Workspace、ターミナル、Git Review、ブラウザ、ウィンドウ統合、プラグインのライフサイクルです。形態は 3 種類あり、用途に応じて選べます：フル版は Desktop・Web・TUI・Node runtime・内蔵プラグインを含みローカル開発ワークベンチ向け、Web-only は Electron を外した軽量／リモート向け、TUI-only はターミナル専用環境向け。フル版はプラットフォームごとに DMG/ZIP、AppImage/deb、Windows パッケージを提供します。本プロジェクトは DeepSeek Harness 公式コミュニティのショーケースに掲載されており、ターミナル側は同じくコミュニティに認められた dsh-TUI 上流プラグインを基盤とし、帰属表示を完全に保持しています。",
      "ko": "Oh-DSH는 profile에 넣는 플러그인이 아니라 DeepSeek Harness와 Node.js runtime, 로컬 기능을 함께 묶은 배포판이며 Releases에서 바로 내려받습니다. 모델은 여전히 클라우드에서 돌아가고, Oh-DSH가 맡는 것은 로컬 쪽입니다——워크스페이스, 터미널, Git Review, 브라우저, 창 통합, 플러그인 수명 주기. 형태는 세 가지이며 필요에 따라 고르면 됩니다: 전체판은 Desktop·Web·TUI·Node runtime·내장 플러그인을 담아 로컬 개발 작업대에 맞고, Web-only는 Electron을 빼 가볍게 설치하거나 원격으로 쓰기 좋으며, TUI-only는 순수 터미널 환경용입니다. 전체판은 플랫폼별로 DMG/ZIP, AppImage/deb, Windows 패키지를 제공합니다. 이 프로젝트는 DeepSeek Harness 공식 커뮤니티 쇼케이스에 소개되었고, 터미널 쪽은 마찬가지로 커뮤니티에서 인정받은 dsh-TUI 상류 플러그인을 기반으로 하며 귀속 표시를 온전히 유지합니다.",
      "zh": "Oh-DSH 不是装进 profile 的插件，而是一整套打包发行版——把 DeepSeek Harness、Node.js runtime 和本地能力封在一起，从 Releases 直接下载。模型仍然跑在云端，Oh-DSH 负责的是 Workspace、终端、Git Review、浏览器、窗口集成和插件生命周期这些本地部分。发行形态分三种，按需要挑：完整版含 Desktop、Web、TUI、Node runtime 与内置插件，适合本地开发工作台；Web-only 去掉 Electron，适合轻量安装或远程使用；TUI-only 适合纯终端环境。完整版按平台提供 DMG/ZIP、AppImage/deb 和 Windows 包。项目已进入 DeepSeek Harness 官方社区展示，终端端基于同样获得社区认可的 dsh-TUI 上游插件并保留完整署名。"
    },
    "highlights": {
      "en": [
        "Three distribution shapes: full (Desktop + Web + TUI), Web-only (no Electron), and TUI-only",
        "Installed from GitHub Releases rather than dsh plugin add; the model stays in the cloud while local capabilities are handled here",
        "Featured in the official DSH community showcase; the terminal side builds on the dsh-TUI upstream plugin with attribution"
      ],
      "ja": [
        "3 つの配布形態：フル版（Desktop＋Web＋TUI）、Web-only（Electron なし）、TUI-only",
        "dsh plugin add ではなく GitHub Releases から導入。モデルはクラウド、ローカル機能はこちらが担当",
        "DSH 公式コミュニティのショーケース掲載。ターミナル側は dsh-TUI 上流プラグインを基盤に帰属を保持"
      ],
      "ko": [
        "세 가지 배포 형태: 전체판(Desktop+Web+TUI), Web-only(Electron 제외), TUI-only",
        "dsh plugin add가 아니라 GitHub Releases에서 설치. 모델은 클라우드에 두고 로컬 기능만 담당",
        "DSH 공식 커뮤니티 쇼케이스 소개. 터미널 쪽은 dsh-TUI 상류 플러그인 기반이며 귀속 유지"
      ],
      "zh": [
        "三种发行形态：完整版（Desktop+Web+TUI）、Web-only（不含 Electron）、TUI-only",
        "从 GitHub Releases 下载安装，不走 dsh plugin add；模型仍在云端，本地只管工作台能力",
        "已进入 DSH 官方社区展示；终端端基于 dsh-TUI 上游插件并保留署名"
      ]
    },
    "installCmd": "# 从 Releases 选发行形态：完整版 / Web-only / TUI-only\nhttps://github.com/hust-open-atom-club/oh-dsh/releases/latest"
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
  "omdsh-dev/dsh-at-file": {
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
  "titanwings/colleague-skill": {
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
    },
    "installCmd": "# DSH 走原生文件系统 Skill 发现，克隆到 skills 目录即可\ngit clone https://github.com/titanwings/colleague-skill ~/.dsh/skills/dot-skill\n# 项目级则放 .dsh/skills/dot-skill；装好后在任意会话输入 /dot-skill"
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
    },
    "installCmd": "# 本仓库是 MuseAI 应用本体，不是 DSH 插件。\n# 装进 DSH 要用作者的另一个仓库（DSH 客户端插件）：\n# https://github.com/yejiming/dsh-museai-tavern"
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
