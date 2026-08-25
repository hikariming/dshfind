// 由 scripts/gen-docs-manifest.mjs 从 Turso docs_pages 生成——请勿手改。
// 存在的意义是让 /docs 索引页与 sitemap 在构建期零数据库依赖：CF 构建机拿不到
// Worker 的运行时 secret，构建期查库会返回空，/docs 会烤成空页面（revalidate
// 86400，最长空 24 小时），docs 的 URL 也会整批从 sitemap 缺席。
// 正文不在这里——那是几 MB 语料，只在运行时按需从 Turso 取。
// 改完文档（sync-official-docs / apply-docs-translations）后跑 pnpm gen:docs 刷新。
// 生成时间：2026-08-25T08:19:38.236Z

export interface DocManifestEntry {
  section: string;
  slug: string;
  navOrder: number;
  /**
   * locale → 标题。**键即"这篇实际入库了哪些语言"**：
   * sitemap 据此避免为尚未翻译的语言发出 404 的 URL。
   */
  titles: Record<string, string>;
  /**
   * 各语言 updated_at 的最大值（ISO）。sitemap 的 <lastmod> 用它。
   *
   * 没有这个字段时 docs 分片的 272 条 URL 一个 lastmod 都不带，Google 只能靠
   * 自己的启发式决定要不要重爬——对一个新站就是极慢。空串表示 DB 里没记时间，
   * 此时不发 lastmod（缺失好过瞎填：lastmod 不准会让 Google 学会忽略这个字段）。
   */
  updatedAt: string;
}

export const docManifest: DocManifestEntry[] = [
  {
    section: "cookbook",
    slug: "adding-a-conversation-node",
    navOrder: 10,
    titles: {"en":"Add a Web Client conversation node","ja":"Web Client の Conversation Node を追加する","ko":"Web Client Conversation Node 추가하기","zh":"添加 Web Client Conversation Node"},
    updatedAt: "2026-08-22T07:10:59.918Z",
  },
  {
    section: "cookbook",
    slug: "adding-a-package",
    navOrder: 20,
    titles: {"en":"Cookbook: adding a workspace package","ja":"実践手引き：workspace パッケージを追加する","ko":"실전 안내: workspace 패키지 추가하기","zh":"实操手册：添加 workspace 包"},
    updatedAt: "2026-08-22T06:58:03.906Z",
  },
  {
    section: "cookbook",
    slug: "adding-a-settings-card",
    navOrder: 30,
    titles: {"en":"Cookbook: adding a settings card","ja":"Cookbook：設定カードを追加する","ko":"Cookbook: 설정 카드 추가하기","zh":"Cookbook: 新增设置卡片"},
    updatedAt: "2026-08-22T06:52:19.534Z",
  },
  {
    section: "cookbook",
    slug: "adding-a-tool",
    navOrder: 40,
    titles: {"en":"Tool authoring reference","ja":"ツール作成リファレンス","ko":"툴 작성 레퍼런스","zh":"工具编写参考"},
    updatedAt: "2026-08-22T06:58:03.906Z",
  },
  {
    section: "cookbook",
    slug: "adding-a-vendored-package",
    navOrder: 50,
    titles: {"en":"Cookbook: adding a vendored package","ja":"実践手引き：vendored パッケージを追加する","ko":"실전 안내: vendored 패키지 추가하기","zh":"实操手册：添加一个 vendored 包"},
    updatedAt: "2026-08-22T06:47:32.046Z",
  },
  {
    section: "cookbook",
    slug: "adding-an-llm-adapter",
    navOrder: 60,
    titles: {"en":"Cookbook: adding an LLM adapter","ja":"実践手引き：LLM アダプタを追加する","ko":"실전 안내: LLM 어댑터 추가하기","zh":"实操手册：添加 LLM（大语言模型）适配器"},
    updatedAt: "2026-08-22T06:47:32.046Z",
  },
  {
    section: "cookbook",
    slug: "extension-cookbook",
    navOrder: 70,
    titles: {"en":"Cookbook: extension plugin shapes","ja":"実践手引き：拡張プラグインの形","ko":"실전 안내: 확장 플러그인의 형태","zh":"实操手册：扩展插件形态"},
    updatedAt: "2026-08-22T07:08:11.528Z",
  },
  {
    section: "cookbook",
    slug: "maintaining-dsh-code-review",
    navOrder: 80,
    titles: {"en":"Maintaining the dsh-code-review skill","ja":"dsh-code-review skill を保守する","ko":"dsh-code-review skill 유지보수하기","zh":"维护 dsh-code-review skill"},
    updatedAt: "2026-08-22T06:52:19.534Z",
  },
  {
    section: "cookbook",
    slug: "responding-to-pr-review-on-a-stack",
    navOrder: 90,
    titles: {"en":"Responding to review across a stacked PR chain","ja":"積み重ねた PR チェーンでレビュー指摘に応える","ko":"쌓아 올린 PR 체인에서 리뷰 의견에 응답하기","zh":"在堆叠 PR 链中回应评审意见"},
    updatedAt: "2026-08-22T06:47:32.046Z",
  },
  {
    section: "develop",
    slug: "basic/config",
    navOrder: 10,
    titles: {"en":"Plugin configuration","ja":"プラグインの設定","ko":"플러그인 설정","zh":"插件配置"},
    updatedAt: "2026-08-21T18:36:28.521Z",
  },
  {
    section: "develop",
    slug: "basic",
    navOrder: 20,
    titles: {"en":"Your first plugin","ja":"最初のプラグイン","ko":"첫 번째 플러그인","zh":"第一个插件"},
    updatedAt: "2026-08-21T18:36:28.521Z",
  },
  {
    section: "develop",
    slug: "basic/publish",
    navOrder: 30,
    titles: {"en":"Package and install a plugin","ja":"プラグインのパッケージ化とインストール","ko":"플러그인 패키징과 설치","zh":"打包与安装插件"},
    updatedAt: "2026-08-21T18:49:22.672Z",
  },
  {
    section: "develop",
    slug: "basic/tool",
    navOrder: 40,
    titles: {"en":"Build a tool","ja":"ツールを作る","ko":"도구 만들기","zh":"开发一个工具"},
    updatedAt: "2026-08-21T18:38:42.729Z",
  },
  {
    section: "develop",
    slug: "framework/events",
    navOrder: 50,
    titles: {"en":"Event system","ja":"イベントシステム","ko":"이벤트 시스템","zh":"事件系统"},
    updatedAt: "2026-08-21T18:42:19.274Z",
  },
  {
    section: "develop",
    slug: "framework",
    navOrder: 60,
    titles: {"en":"Plugins and lifecycle","ja":"プラグインとライフサイクル","ko":"플러그인과 생명주기","zh":"插件与生命周期"},
    updatedAt: "2026-08-21T18:40:27.595Z",
  },
  {
    section: "develop",
    slug: "framework/service",
    navOrder: 70,
    titles: {"en":"Services and dependencies","ja":"サービスと依存","ko":"서비스와 의존성","zh":"服务与依赖"},
    updatedAt: "2026-08-21T18:40:27.595Z",
  },
  {
    section: "develop",
    slug: "practice",
    navOrder: 80,
    titles: {"en":"Three-role capability design","ja":"能力を担う 3 つの役割の設計","ko":"능력을 맡는 세 가지 역할 설계","zh":"能力的三种角色设计"},
    updatedAt: "2026-08-21T18:42:19.274Z",
  },
  {
    section: "develop",
    slug: "practice/llm-adapter",
    navOrder: 90,
    titles: {"en":"LLM adapters","ja":"LLM アダプタ","ko":"LLM 어댑터","zh":"LLM 适配器"},
    updatedAt: "2026-08-21T18:49:22.672Z",
  },
  {
    section: "guide",
    slug: "index",
    navOrder: 10,
    titles: {"en":"Use the Web UI","ja":"Web UI を使う","ko":"Web UI 사용하기","zh":"使用 Web UI"},
    updatedAt: "2026-08-21T18:38:42.729Z",
  },
  {
    section: "guide",
    slug: "providers",
    navOrder: 20,
    titles: {"en":"Configure models","ja":"モデルを設定する","ko":"모델 설정하기","zh":"配置模型"},
    updatedAt: "2026-08-21T18:46:01.793Z",
  },
  {
    section: "guide",
    slug: "python-sdk",
    navOrder: 30,
    titles: {"en":"Get started with the Python SDK","ja":"Python SDK クイックスタート","ko":"Python SDK 빠른 시작","zh":"Python SDK 快速上手"},
    updatedAt: "2026-08-21T18:43:38.154Z",
  },
  {
    section: "postmortem",
    slug: "0001-acp-default-export-drops-inject",
    navOrder: 10,
    titles: {"en":"Post-mortem 0001: ACP server crashed on connect — `export default` dropped the plugin's `inject`","ja":"ポストモーテム 0001：ACP サーバーが接続時にクラッシュ——export default がプラグインの inject を落としていた","ko":"포스트모템 0001: ACP 서버가 연결 시 크래시 — export default가 플러그인의 inject를 떨어뜨렸다","zh":"事故复盘（postmortem）0001：ACP（Agent Client Protocol）服务器在连接时崩溃——`export default` 丢弃了插件的 `inject`"},
    updatedAt: "2026-08-22T07:05:10.885Z",
  },
  {
    section: "postmortem",
    slug: "0002-js-expression-disabled-filesystem-tools",
    navOrder: 20,
    titles: {"en":"Post-mortem 0002: Filesystem snapshot tools were permanently disabled","ja":"ポストモーテム 0002：ファイルシステムのスナップショットツールが恒久的に無効化されていた","ko":"포스트모템 0002: 파일 시스템 스냅샷 툴이 영구히 비활성화되었다","zh":"事故复盘（postmortem） 0002：文件系统快照工具被永久禁用"},
    updatedAt: "2026-08-22T06:52:19.534Z",
  },
  {
    section: "postmortem",
    slug: "0003-web-agent-gui-feedback-loop",
    navOrder: 30,
    titles: {"en":"Post-mortem 0003: Web agent validated a replacement server instead of its current GUI","ja":"ポストモーテム 0003：Web agent が現在の GUI ではなく代替サーバーを受け入れ検証していた","ko":"포스트모템 0003: Web agent가 현재 GUI가 아니라 대체 서버를 검수했다","zh":"事故复盘（postmortem） 0003：Web agent（智能体）验收了替代服务器，而非其当前 GUI"},
    updatedAt: "2026-08-22T07:02:16.675Z",
  },
  {
    section: "postmortem",
    slug: "0004-landlock-partial-notice-misclassified-child-failures",
    navOrder: 40,
    titles: {"en":"Post-mortem 0004: Landlock partial-enforcement notice misclassified child failures","ja":"ポストモーテム 0004：Landlock の部分的強制通知により子プロセスの失敗が誤分類された","ko":"포스트모템 0004: Landlock 부분 강제 알림 때문에 자식 프로세스 실패가 잘못 분류되었다","zh":"事故复盘（postmortem） 0004：Landlock 部分强制执行通知导致子进程失败被误归类"},
    updatedAt: "2026-08-22T07:02:16.675Z",
  },
  {
    section: "postmortem",
    slug: "README",
    navOrder: 50,
    titles: {"en":"Post-mortems","ja":"ポストモーテム（事後検証）","ko":"포스트모템(사후 검증)","zh":"事故复盘（postmortem）"},
    updatedAt: "2026-08-22T06:47:32.046Z",
  },
  {
    section: "subsystems",
    slug: "agent-team",
    navOrder: 10,
    titles: {"en":"Agent Teams","ja":"Agent Teams","ko":"Agent Teams","zh":"Agent Teams"},
    updatedAt: "2026-08-22T03:41:07.465Z",
  },
  {
    section: "subsystems",
    slug: "approval",
    navOrder: 20,
    titles: {"en":"User Approval","ja":"ユーザー承認","ko":"사용자 승인","zh":"用户审批"},
    updatedAt: "2026-08-22T03:47:48.588Z",
  },
  {
    section: "subsystems",
    slug: "attachment",
    navOrder: 30,
    titles: {"en":"Durable Image Attachments","ja":"永続的な画像添付","ko":"영속 이미지 첨부","zh":"持久图片附件"},
    updatedAt: "2026-08-22T03:55:26.974Z",
  },
  {
    section: "subsystems",
    slug: "client-modules",
    navOrder: 40,
    titles: {"en":"Client Modules","ja":"Client モジュール","ko":"Client 모듈","zh":"Client 模块"},
    updatedAt: "2026-08-22T03:51:29.940Z",
  },
  {
    section: "subsystems",
    slug: "code-runtime",
    navOrder: 50,
    titles: {"en":"Code Runtime","ja":"コードランタイム","ko":"코드 런타임","zh":"代码运行时"},
    updatedAt: "2026-08-22T04:22:41.890Z",
  },
  {
    section: "subsystems",
    slug: "commands",
    navOrder: 60,
    titles: {"en":"Human Commands","ja":"ユーザーコマンド","ko":"사용자 명령","zh":"用户命令"},
    updatedAt: "2026-08-22T03:51:29.940Z",
  },
  {
    section: "subsystems",
    slug: "compaction",
    navOrder: 70,
    titles: {"en":"Compaction","ja":"圧縮（compaction）","ko":"압축(compaction)","zh":"压缩（compaction）"},
    updatedAt: "2026-08-22T04:11:00.866Z",
  },
  {
    section: "subsystems",
    slug: "core",
    navOrder: 80,
    titles: {"en":"Core","ja":"コア","ko":"코어","zh":"核心"},
    updatedAt: "2026-08-22T04:51:05.828Z",
  },
  {
    section: "subsystems",
    slug: "credentials",
    navOrder: 90,
    titles: {"en":"User Credentials","ja":"ユーザー資格情報","ko":"사용자 자격 증명","zh":"用户凭据"},
    updatedAt: "2026-08-22T03:41:07.465Z",
  },
  {
    section: "subsystems",
    slug: "extensions",
    navOrder: 100,
    titles: {"en":"Extensions","ja":"拡張","ko":"확장","zh":"扩展"},
    updatedAt: "2026-08-22T03:41:07.465Z",
  },
  {
    section: "subsystems",
    slug: "feedback",
    navOrder: 110,
    titles: {"en":"Message Feedback","ja":"メッセージフィードバック","ko":"메시지 피드백","zh":"消息反馈"},
    updatedAt: "2026-08-22T04:31:00.545Z",
  },
  {
    section: "subsystems",
    slug: "filesystem",
    navOrder: 120,
    titles: {"en":"Filesystem","ja":"ファイルシステム","ko":"파일 시스템","zh":"文件系统"},
    updatedAt: "2026-08-22T04:46:47.422Z",
  },
  {
    section: "subsystems",
    slug: "goal",
    navOrder: 130,
    titles: {"en":"Same-session goals","ja":"同一セッション内ゴール","ko":"동일 세션 목표","zh":"同会话目标"},
    updatedAt: "2026-08-22T03:47:48.588Z",
  },
  {
    section: "subsystems",
    slug: "invariants",
    navOrder: 140,
    titles: {"en":"Runtime Invariants","ja":"ランタイム不変条件","ko":"런타임 불변식","zh":"运行时不变式"},
    updatedAt: "2026-08-22T03:19:28.490Z",
  },
  {
    section: "subsystems",
    slug: "jobs",
    navOrder: 150,
    titles: {"en":"Background Task Runtime","ja":"バックグラウンドジョブ・ランタイム","ko":"백그라운드 작업 런타임","zh":"后台任务运行时"},
    updatedAt: "2026-08-22T03:58:51.088Z",
  },
  {
    section: "subsystems",
    slug: "llm-streaming",
    navOrder: 160,
    titles: {"en":"LLM Streaming","ja":"LLM ストリーミング","ko":"LLM 스트리밍","zh":"LLM（大语言模型）流式输出"},
    updatedAt: "2026-08-22T05:19:09.622Z",
  },
  {
    section: "subsystems",
    slug: "lsp",
    navOrder: 170,
    titles: {"en":"LSP navigation","ja":"LSP ナビゲーション","ko":"LSP 내비게이션","zh":"LSP 导航"},
    updatedAt: "2026-08-22T04:14:50.372Z",
  },
  {
    section: "subsystems",
    slug: "permission-presets",
    navOrder: 180,
    titles: {"en":"Permission Presets","ja":"権限プリセット","ko":"권한 프리셋","zh":"权限预设"},
    updatedAt: "2026-08-22T03:43:55.315Z",
  },
  {
    section: "subsystems",
    slug: "persistence",
    navOrder: 190,
    titles: {"en":"Session Persistence","ja":"セッション永続化","ko":"세션 지속화","zh":"会话持久化"},
    updatedAt: "2026-08-22T04:36:53.034Z",
  },
  {
    section: "subsystems",
    slug: "plan",
    navOrder: 200,
    titles: {"en":"Plan Mode","ja":"プランモード","ko":"플랜 모드","zh":"计划模式"},
    updatedAt: "2026-08-22T03:23:06.885Z",
  },
  {
    section: "subsystems",
    slug: "README",
    navOrder: 210,
    titles: {"en":"Subsystems","ja":"サブシステム","ko":"서브시스템","zh":"子系统"},
    updatedAt: "2026-08-22T03:58:51.088Z",
  },
  {
    section: "subsystems",
    slug: "sandbox",
    navOrder: 220,
    titles: {"en":"Process Sandbox","ja":"プロセス・サンドボックス","ko":"프로세스 샌드박스","zh":"进程沙箱"},
    updatedAt: "2026-08-22T04:11:00.866Z",
  },
  {
    section: "subsystems",
    slug: "schedule",
    navOrder: 230,
    titles: {"en":"Session-local Schedule","ja":"Session 内限定の Schedule","ko":"Session 내부 전용 Schedule","zh":"仅限 Session 内的 Schedule"},
    updatedAt: "2026-08-22T04:22:41.890Z",
  },
  {
    section: "subsystems",
    slug: "scope",
    navOrder: 240,
    titles: {"en":"Scoped Registration","ja":"スコープ登録","ko":"스코프 등록","zh":"作用域注册"},
    updatedAt: "2026-08-22T03:19:28.490Z",
  },
  {
    section: "subsystems",
    slug: "session-projection",
    navOrder: 250,
    titles: {"en":"Session Projections","ja":"セッション投影","ko":"세션 투영","zh":"会话投影"},
    updatedAt: "2026-08-22T03:55:26.974Z",
  },
  {
    section: "subsystems",
    slug: "session-query",
    navOrder: 260,
    titles: {"en":"Session Query","ja":"セッションクエリ","ko":"세션 쿼리","zh":"会话查询"},
    updatedAt: "2026-08-22T04:42:32.470Z",
  },
  {
    section: "subsystems",
    slug: "session-reference",
    navOrder: 270,
    titles: {"en":"Session References","ja":"セッション参照","ko":"세션 참조","zh":"会话引用"},
    updatedAt: "2026-08-22T03:43:55.315Z",
  },
  {
    section: "subsystems",
    slug: "session-telemetry",
    navOrder: 280,
    titles: {"en":"SessionTelemetryBackend","ja":"テレメトリ","ko":"텔레메트리","zh":"遥测（telemetry）"},
    updatedAt: "2026-08-22T04:07:07.524Z",
  },
  {
    section: "subsystems",
    slug: "session-title",
    navOrder: 290,
    titles: {"en":"Session Titles","ja":"セッションタイトル","ko":"세션 제목","zh":"会话标题"},
    updatedAt: "2026-08-22T03:55:26.974Z",
  },
  {
    section: "subsystems",
    slug: "session",
    navOrder: 300,
    titles: {"en":"Sessions","ja":"セッション","ko":"세션","zh":"会话"},
    updatedAt: "2026-08-22T05:11:41.925Z",
  },
  {
    section: "subsystems",
    slug: "settings",
    navOrder: 310,
    titles: {"en":"User Settings","ja":"ユーザー設定","ko":"사용자 설정","zh":"用户设置"},
    updatedAt: "2026-08-22T04:03:27.305Z",
  },
  {
    section: "subsystems",
    slug: "shell",
    navOrder: 320,
    titles: {"en":"Bash Executor","ja":"Bash 実行器","ko":"Bash 실행기","zh":"Bash 执行器"},
    updatedAt: "2026-08-22T04:31:00.545Z",
  },
  {
    section: "subsystems",
    slug: "skills",
    navOrder: 330,
    titles: {"en":"Skills","ja":"Skills","ko":"Skills","zh":"Skills"},
    updatedAt: "2026-08-22T04:42:32.470Z",
  },
  {
    section: "subsystems",
    slug: "spill",
    navOrder: 340,
    titles: {"en":"Spill Storage","ja":"spill ストレージ","ko":"spill 스토리지","zh":"spill 存储"},
    updatedAt: "2026-08-22T03:23:06.885Z",
  },
  {
    section: "subsystems",
    slug: "storage",
    navOrder: 350,
    titles: {"en":"Storage","ja":"ストレージ","ko":"스토리지","zh":"存储"},
    updatedAt: "2026-08-22T04:14:50.372Z",
  },
  {
    section: "subsystems",
    slug: "subagent",
    navOrder: 360,
    titles: {"en":"Subagent","ja":"Subagent","ko":"Subagent","zh":"Subagent"},
    updatedAt: "2026-08-22T05:04:31.863Z",
  },
  {
    section: "subsystems",
    slug: "subprocess",
    navOrder: 370,
    titles: {"en":"Subprocess","ja":"サブプロセス","ko":"서브프로세스","zh":"子进程"},
    updatedAt: "2026-08-22T04:36:53.034Z",
  },
  {
    section: "subsystems",
    slug: "system-prompt",
    navOrder: 380,
    titles: {"en":"System Prompt Assembly","ja":"システムプロンプトの組み立て","ko":"시스템 프롬프트 조립","zh":"系统提示词组装"},
    updatedAt: "2026-08-22T03:43:55.315Z",
  },
  {
    section: "subsystems",
    slug: "terminal",
    navOrder: 390,
    titles: {"en":"Persistent PTY Sessions","ja":"永続 PTY セッション","ko":"영속 PTY 세션","zh":"持久 PTY 会话"},
    updatedAt: "2026-08-22T03:47:48.588Z",
  },
  {
    section: "subsystems",
    slug: "token-meter",
    navOrder: 400,
    titles: {"en":"Token Meter","ja":"Token 計量","ko":"Token 계량","zh":"Token 计量"},
    updatedAt: "2026-08-22T03:19:28.490Z",
  },
  {
    section: "subsystems",
    slug: "tools",
    navOrder: 410,
    titles: {"en":"Tools","ja":"ツール","ko":"툴","zh":"工具"},
    updatedAt: "2026-08-22T04:56:51.885Z",
  },
  {
    section: "subsystems",
    slug: "typert",
    navOrder: 420,
    titles: {"en":"Typert remote calls","ja":"Typert リモート呼び出し","ko":"Typert 원격 호출","zh":"Typert 远程调用"},
    updatedAt: "2026-08-22T04:26:19.623Z",
  },
  {
    section: "subsystems",
    slug: "user-questions",
    navOrder: 430,
    titles: {"en":"User Interaction","ja":"ユーザー対話","ko":"사용자 상호작용","zh":"用户交互"},
    updatedAt: "2026-08-22T03:51:29.940Z",
  },
  {
    section: "subsystems",
    slug: "web-server",
    navOrder: 440,
    titles: {"en":"HTTP Server","ja":"HTTP サーバー","ko":"HTTP 서버","zh":"HTTP 服务器"},
    updatedAt: "2026-08-22T03:41:07.465Z",
  },
  {
    section: "subsystems",
    slug: "web",
    navOrder: 450,
    titles: {"en":"Web Access","ja":"Web アクセス","ko":"Web 접근","zh":"Web 访问"},
    updatedAt: "2026-08-22T04:26:19.623Z",
  },
  {
    section: "subsystems",
    slug: "workflow",
    navOrder: 460,
    titles: {"en":"Workflow","ja":"ワークフロー","ko":"워크플로","zh":"工作流"},
    updatedAt: "2026-08-22T04:07:07.524Z",
  },
  {
    section: "subsystems",
    slug: "workspace",
    navOrder: 470,
    titles: {"en":"Workspaces","ja":"ワークスペース","ko":"워크스페이스","zh":"工作区"},
    updatedAt: "2026-08-22T04:03:27.305Z",
  },
];

/** 某语言下的导航条目，按板块与 nav_order 排序。取代运行时的 getDocNav 查询。 */
export function docNavFor(
  locale: string,
): { section: string; slug: string; title: string; navOrder: number }[] {
  return docManifest
    .filter((d) => d.titles[locale])
    .map((d) => ({
      section: d.section,
      slug: d.slug,
      title: d.titles[locale],
      navOrder: d.navOrder,
    }))
    .sort(
      (a, b) =>
        a.section.localeCompare(b.section) ||
        a.navOrder - b.navOrder ||
        a.slug.localeCompare(b.slug),
    );
}
