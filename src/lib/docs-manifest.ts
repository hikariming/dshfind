// 由 scripts/gen-docs-manifest.mjs 从 Turso docs_pages 生成——请勿手改。
// 存在的意义是让 /docs 索引页与 sitemap 在构建期零数据库依赖：CF 构建机拿不到
// Worker 的运行时 secret，构建期查库会返回空，/docs 会烤成空页面（revalidate
// 86400，最长空 24 小时），docs 的 URL 也会整批从 sitemap 缺席。
// 正文不在这里——那是几 MB 语料，只在运行时按需从 Turso 取。
// 改完文档（sync-official-docs / apply-docs-translations）后跑 pnpm gen:docs 刷新。
// 生成时间：2026-08-22T02:31:06.280Z

export interface DocManifestEntry {
  section: string;
  slug: string;
  navOrder: number;
  /**
   * locale → 标题。**键即"这篇实际入库了哪些语言"**：
   * sitemap 据此避免为尚未翻译的语言发出 404 的 URL。
   */
  titles: Record<string, string>;
}

export const docManifest: DocManifestEntry[] = [
  {
    section: "develop",
    slug: "basic/config",
    navOrder: 10,
    titles: {"en":"Plugin configuration","ja":"プラグインの設定","ko":"플러그인 설정","zh":"插件配置"},
  },
  {
    section: "develop",
    slug: "basic",
    navOrder: 20,
    titles: {"en":"Your first plugin","ja":"最初のプラグイン","ko":"첫 번째 플러그인","zh":"第一个插件"},
  },
  {
    section: "develop",
    slug: "basic/publish",
    navOrder: 30,
    titles: {"en":"Package and install a plugin","ja":"プラグインのパッケージ化とインストール","ko":"플러그인 패키징과 설치","zh":"打包与安装插件"},
  },
  {
    section: "develop",
    slug: "basic/tool",
    navOrder: 40,
    titles: {"en":"Build a tool","ja":"ツールを作る","ko":"도구 만들기","zh":"开发一个工具"},
  },
  {
    section: "develop",
    slug: "framework/events",
    navOrder: 50,
    titles: {"en":"Event system","ja":"イベントシステム","ko":"이벤트 시스템","zh":"事件系统"},
  },
  {
    section: "develop",
    slug: "framework",
    navOrder: 60,
    titles: {"en":"Plugins and lifecycle","ja":"プラグインとライフサイクル","ko":"플러그인과 생명주기","zh":"插件与生命周期"},
  },
  {
    section: "develop",
    slug: "framework/service",
    navOrder: 70,
    titles: {"en":"Services and dependencies","ja":"サービスと依存","ko":"서비스와 의존성","zh":"服务与依赖"},
  },
  {
    section: "develop",
    slug: "practice",
    navOrder: 80,
    titles: {"en":"Three-role capability design","ja":"能力を担う 3 つの役割の設計","ko":"능력을 맡는 세 가지 역할 설계","zh":"能力的三种角色设计"},
  },
  {
    section: "develop",
    slug: "practice/llm-adapter",
    navOrder: 90,
    titles: {"en":"LLM adapters","ja":"LLM アダプタ","ko":"LLM 어댑터","zh":"LLM 适配器"},
  },
  {
    section: "guide",
    slug: "index",
    navOrder: 10,
    titles: {"en":"Use the Web UI","ja":"Web UI を使う","ko":"Web UI 사용하기","zh":"使用 Web UI"},
  },
  {
    section: "guide",
    slug: "providers",
    navOrder: 20,
    titles: {"en":"Configure models","ja":"モデルを設定する","ko":"모델 설정하기","zh":"配置模型"},
  },
  {
    section: "guide",
    slug: "python-sdk",
    navOrder: 30,
    titles: {"en":"Get started with the Python SDK","ja":"Python SDK クイックスタート","ko":"Python SDK 빠른 시작","zh":"Python SDK 快速上手"},
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
