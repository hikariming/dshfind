// 由 scripts/gen-lessons-manifest.mjs 从 src/content/lessons 的 MDX 生成——请勿手改。
// title 取每篇 MDX 的 H1，description 取紧随其后的「一句话版」引用块——
// 两者本来就是各语言译好的，改正文即改 meta，不会漂移。
// 改动课程内容后跑 pnpm gen:lessons 刷新本文件。
// 生成时间：2026-08-25T07:43:04.544Z

export interface LessonManifestEntry {
  chapter: string;
  slug: string;
  /**
   * locale → 标题。**键即「这一课实际有哪个语言的正文」**：
   * registry 缺语言时会回落到中文，页面与 sitemap 据此避免把
   * 「日文 URL + 中文正文」当成真的日文页收录。
   */
  titles: Record<string, string>;
  /** locale → 一句话摘要，用作 meta description。可能缺。 */
  summaries: Record<string, string>;
}

export const lessonManifest: LessonManifestEntry[] = [
  {
    chapter: "cordis",
    slug: "01-intro",
    titles: {"zh":"第 1 课：摘要与引言：动态组合与两个维度","en":"Lesson 1: Abstract and Introduction — Dynamic Composition and Two Dimensions","ja":"第 1 課：概要と序論：動的コンポジションと 2 つの次元","ko":"1강: 초록과 서론: 동적 컴포지션과 두 가지 차원"},
    summaries: {"zh":"这篇论文想给「运行时能安全地装组件、拆组件」这件事补上理论基础。它发现这需要两个互相独立的维度同时成立——时间上拆了要能还原（时间可组合性），空间上依赖要能自动协调（空间可组合性）——并给出了两把钥匙：可回退效应和反应式余效应。Cordis 就是这套理论的实现，而 DSH 正是站在它肩膀上建起来的。","en":"This paper aims to lay the theoretical foundation for \"safely installing and removing components at runtime.\" It discovers that this requires two mutually independent dimensions to hold simultaneously — temporally, removals must be reversible (temporal composability), and spatially, dependencies mus","ja":"この論文は「実行時にコンポーネントを安全に装着・取り外せる」ことに理論的基盤を与えようとしています。それには、互いに独立した 2 つの次元が同時に成り立つ必要があることを発見しました——時間的には取り外したら元に戻せること（時間的コンポーザビリティ）、空間的には依存関係が自動的に調整されること（空間的コンポーザビリティ）——そして 2 つの鍵を示しています：可逆エフェクトとリアクティブコエフェクトです。Cordis はこの理論の実装であり、DSH はまさにその肩の上に築かれています。","ko":"이 논문은 \"런타임에 컴포넌트를 안전하게 장착하고 분리하는 것\"에 이론적 기반을 마련하려 합니다. 이를 위해서는 서로 독립적인 두 가지 차원이 동시에 성립해야 함을 발견했습니다. 시간적으로는 분리했을 때 원상복구가 가능해야 하고(시간적 컴포저빌리티), 공간적으로는 의존성이 자동으로 조정되어야 합니다(공간적 컴포저빌리티). 그리고 두 개의 열쇠를 제시합니다. 가역 이펙트와 반응형 코이펙트입니다. Cordis는 바로 이 이론의 구현이며, DSH는 그 어깨 위에 세워졌습니다."},
  },
  {
    chapter: "cordis",
    slug: "02-motivation",
    titles: {"zh":"第 2 课：动机示例：VSCode 插件与 AI 智能体","en":"Lesson 2: Motivation Example: VSCode Extensions and AI Agents","ja":"第 2 課：動機となる例：VSCode プラグインと AI エージェント","ko":"2과: 동기가 되는 예시: VSCode 플러그인과 AI 에이전트"},
    summaries: {"zh":"插件系统普遍「装上容易、拆下难」——VSCode 想停用一个插件得重启整个进程，想依赖另一个插件又没有类型保证；而未来的 AI 智能体恰恰会在运行时不断自我修改，因此最需要「装得上、拆得下、互不破坏」的能力，这正是 Cordis 论文要解决的问题。","en":"Plugin systems generally make it \"easy to install but hard to remove\" — to disable a VSCode extension you must restart the entire process, and there is no type guarantee when depending on another extension; yet future AI agents will constantly modify themselves at runtime, so they need exactly the a","ja":"プラグインシステムは一般に「インストールは簡単、取り外しは困難」です——VSCode でプラグインを無効化するにはプロセス全体を再起動する必要があり、別のプラグインに依存しようとしても型の保証がありません。一方、将来の AI エージェントはまさに実行時に絶えず自己改変を行うため、「インストールでき、取り外せ、互いを破壊しない」能力が最も必要とされます。これこそが Cordis 論文が解決しようとする問題です。","ko":"플러그인 시스템은 일반적으로 \"설치는 쉽지만 제거는 어렵습니다\" — VSCode에서 플러그인을 비활성화하려면 전체 프로세스를 재시작해야 하고, 다른 플러그인에 의존하려 합어도 타입 보장이 없습니다. 반면 미래의 AI 에이전트는 바로 런타임에 끊임없이 스스로를 수정하므로, \"설치할 수 있고, 제거할 수 있고, 서로를 파괴하지 않는\" 능력이 가장 절실합니다. 이것이 바로 Cordis 논문이 해결하려는 문제입니다."},
  },
  {
    chapter: "cordis",
    slug: "03-contributions-types",
    titles: {"zh":"第 3 课：贡献回顾与类型判断 Γ ⊢ t : T","en":"Lesson 3: Contributions Review and Typing Judgment Γ ⊢ t : T","ja":"第 3 課：貢献の振り返りと型判断 Γ ⊢ t : T","ko":"3과: 기여 정리와 타입 판단 Γ ⊢ t : T"},
    summaries: {"zh":"这篇论文的目标，是让「组件在运行时动态装上、又能干净地卸下」这件事变得可推理、可验证。本课先看论文的全局地图——四大贡献分别撑起哪两块可组合性；再补两小块地基：类型判断 Γ ⊢ t : T 到底在说什么，以及效应标注 T^effect 为什么能让我们「不看实现就知道副作用」。","en":"the goal of this paper is to make \"components dynamically mounted at runtime and cleanly unmounted\" something that is reasoning-able and verifiable. This lesson first looks at the paper's global map — which two kinds of composability the four contributions each underpin; then it fills in two small f","ja":"この論文の目標は、「コンポーネントを実行時に動的にマウントし、きれいにアンマウントする」ということを推論可能かつ検証可能にすることです。本課ではまず論文の全体地図を見ます——4 つの貢献がそれぞれどの 2 種類の合成可能性を支えているのか。そして小さな土台を 2 つ補います：型判断 Γ ⊢ t : T がいったい何を言っているのか、そして作用注釈 T^effect がなぜ「実装を見ずに副作用が分かる」ようにしてくれるのか。","ko":"이 논문의 목표는 「컴포넌트가 런타임에 동적으로 장착되고, 또 깔끔하게 분리되는」 일을 추론 가능하고 검증 가능하게 만드는 것입니다. 이번 과에서는 먼저 논문의 전체 지도를 봅니다——네 가지 기여가 각각 어떤 두 종류의 조합 가능성을 뒷받침하는지. 그리고 두 작은 토대를 보강합니다: 타입 판단 Γ ⊢ t : T가 도대체 무엇을 말하는지, 그리고 효과 주석 T^effect가 왜 우리가 「구현을 보지 않고도 부수 효과를 알 수」 있게 해 주는지."},
  },
  {
    chapter: "cordis",
    slug: "04-monad",
    titles: {"zh":"单子：一种\"盒子\"的设计模式","en":"Monad: A \"Box\" Design Pattern","ja":"モナド:「箱」というデザインパターン","ko":"모나드: \"상자\"라는 디자인 패턴"},
    summaries: {"zh":"先说结论，让你心里有底：单子不是一个高深的数学对象，它就是一个朴素的编程模式——\"把值装进盒子里，规定只能用窗户取用\"。 你早就会用了，只是不知道它叫这个名字。","en":"Let's start with the takeaway, so you know where you're headed: a monad is not an esoteric mathematical object — it's a plain programming pattern: \"put values in a box, and only take them out through the window.\" You've already been using it; you just didn't know it had this name.","ja":"先に結論を言っておくので安心してください。モナドは高尚な数学オブジェクトではなく、素朴なプログラミングパターン――「値を箱に入れて、窓からしか取り出せないと決める」――にすぎません。 あなたはとっくに使いこなしています。ただ、その名前を知らなかっただけです。","ko":"결론부터 말씀드리니 마음 편히 가지셔도 됩니다. 모나드는 심오한 수학 객체가 아니라 소박한 프로그래밍 패턴입니다 — \"값을 상자에 넣고, 창문으로만 꺼내 쓰도록 규정하는 것\". 여러분은 이미 쓸 줄 압니다. 다만 그 이름을 몰랐을 뿐입니다."},
  },
  {
    chapter: "cordis",
    slug: "05-coeffect",
    titles: {"zh":"第 5 课：余效应：计算需要环境给什么","en":"Lesson 5: Coeffects: What the Computation Needs from the Environment","ja":"第 5 課：コーエフェクト：計算が環境に求めるもの","ko":"5강: 코이펙트: 계산이 환경에게 필요로 하는 것"},
    summaries: {"zh":"效应管「程序对世界做了什么」，余效应管「世界要求程序依赖什么」——余效应回答的是「计算需要环境给什么」（要访问的资源、要具备的能力、要依赖的服务），它与效应方向相反、互为对偶。","en":"Effects govern \"what the program does to the world\"; coeffects govern \"what the world requires the program to depend on\" — a coeffect answers \"what the computation needs the environment to provide\" (resources to access, capabilities to hold, services to depend on). It runs in the opposite direction ","ja":"エフェクトは「プログラムが世界に何をしたか」を扱い、コーエフェクトは「世界がプログラムに何への依存を求めるか」を扱います。コーエフェクトが答えるのは「計算が環境に与えてほしいものは何か」（アクセスするリソース、備えるべき能力、依存するサービス）であり、エフェクトとは向きが逆の、互いに双対な概念です。","ko":"이펙트는 「프로그램이 세상에 무엇을 했는가」를 다루고, 코이펙트는 「세상이 프로그램에게 무엇에 의존할 것을 요구하는가」를 다룹니다. 코이펙트가 답하는 것은 「계산이 환경으로부터 무엇을 제공받아야 하는가」(접근해야 할 리소스, 갖춰야 할 능력, 의존해야 할 서비스)이며, 이펙트와는 방향이 반대인, 서로 쌍대인 개념입니다."},
  },
  {
    chapter: "cordis",
    slug: "06-revertible-effects",
    titles: {"zh":"第 6 课：可回退效应：装得上去，拆得下来","en":"Lesson 6: Revertible Effects: Easy to Install, Easy to Remove","ja":"第 6 課: 回復可能なエフェクト: インストールできて、アンインストールもできる","ko":"6강: 되돌릴 수 있는 이펙트: 설치할 수 있으면, 제거할 수도 있어야 한다"},
    summaries: {"zh":"可回退效应把「副作用」改造成「变换 + 逆变换」——每次修改环境都自动配好一把「逆钥匙」，装上时记进账本、拆下时按逆序自动还原；从此「卸载不留痕」不用手写清理代码，而是由结构本身保证。","en":"Revertible effects turn \"side effects\" into \"transformations + inverse transformations\" — every environment modification automatically comes with an \"inverse key\": when installing, it's recorded in a ledger; when removing, it's automatically restored in reverse order. From then on, \"uninstalling lea","ja":"回復可能なエフェクトは「副作用」を「変換 + 逆変換」に作り替えます——環境を変更するたびに自動的に「逆の鍵」が用意され、インストール時に帳簿に記録され、アンインストール時に逆順で自動的に元に戻されます。これ以降、「アンインストールしても痕跡を残さない」は手書きのクリーンアップコードを必要とせず、構造そのものによって保証されます。","ko":"되돌릴 수 있는 이펙트는 「부수 효과」를 「변환 + 역변환」으로 탈바꿈시킵니다——환경을 수정할 때마다 자동으로 「역방향 열쇠」가 마련되어, 설치할 때는 장부에 기록되고 제거할 때는 역순으로 자동 복원됩니다. 이후로 「제거핟고 흔적이 남지 않음」은 손수 작성하는 정리 코드가 필요 없이, 구조 자체에 의해 보장됩니다."},
  },
  {
    chapter: "cordis",
    slug: "07-effect-composition",
    titles: {"zh":"第 7 课：效应函数与组合：逆变换自动组合","en":"Lesson 7: Effect Functions and Composition: Automatic Inverse Composition","ja":"第 7 課：エフェクト関数と合成：逆変換の自動合成","ko":"7과: 이펙트 함수와 합성: 역변환의 자동 합성"},
    summaries: {"zh":"上一课我们假设「逆函数已经有人替我们写好」；这一课我们让每个效应自己随身带着逆函数，并规定复合时逆按后进先出自动拼装——从此装什么都能拆，还能只拆一半。","en":"Last lesson we assumed \"someone has already written the inverse function for us\"; this lesson we make every effect carry its own inverse along with it, and stipulate that inverses are assembled automatically in last-in-first-out order during composition — from now on, anything you put on can be take","ja":"前回の課では「逆関数は誰かがすでに書いてくれている」と仮定していました。今回は、すべてのエフェクトに逆関数を自ら携帯させ、合成時には逆が後入れ先出しで自動的に組み立てられると規定します——これで、何を載せても外せるようになり、半分だけ外すことさえできます。","ko":"지난 과에서는 「역함수를 누군가가 이미 작성해 두었다」고 가정했습니다. 이번 과에서는 모든 이펙트가 스스로 역함수를 몸에 지니고 다니게 하고, 합성할 때 역이 후입선출 방식으로 자동으로 조립되도록 규정합니다. 이제부터는 무엇을 올려놓든 분해할 수 있고, 절반만 분해하는 것도 가능합니다."},
  },
  {
    chapter: "cordis",
    slug: "08-reactive-coeffects",
    titles: {"zh":"第 8 课：反应式余效应：依赖齐了自动启动","en":"Lesson 8: Reactive Coeffects — Start Automatically When Dependencies Are Ready","ja":"第8課：リアクティブ余効果：依存が揃ったら自動起動","ko":"제8과: 리액티브 코이펙트: 의존성이 갖춰지면 자동으로 시작된다"},
    summaries: {"zh":"反应式余效应就是「一张会自动变化的依赖表」——组件只需要声明自己要什么，系统盯着这张表，依赖一旦齐了就自动把组件启动（Reload），依赖一旦缺了就自动把组件卸载（Unload），先后顺序和时机全都不用你操心。","en":"a reactive coeffect is a dependency table that updates itself — components only need to declare what they want; the system watches the table and, as soon as the dependencies are all present it automatically starts (Reloads) the component, and as soon as a dependency goes missing it automatically unl","ja":"リアクティブ余効果とは「自動的に変化する依存テーブル」のことです——コンポーネントは自分が何を必要とするかを宣言するだけで、システムがそのテーブルを監視し、依存が揃った瞬間にコンポーネントを自動的に起動（Reload）し、依存が欠けた瞬間にコンポーネントを自動的にアンロード（Unload）します。順序やタイミングを気にする必要はまったくありません。","ko":"리액티브 코이펙트란 「스스로 변화하는 의존성 테이블」입니다. 컴포넌트는 자신이 무엇을 필요로 하는지만 선언하면 되고, 시스템이 이 테이블을 감시하면서 의존성이 갖춰지는 즉시 컴포넌트를 자동으로 시작(Reload)하고, 의존성이 없어지는 즉시 컴포넌트를 자동으로 언로드(Unload)합니다. 순서와 타이밍은 전혀 신경 쓸 필요가 없습니다."},
  },
  {
    chapter: "cordis",
    slug: "09-lifecycle",
    titles: {"zh":"第 9 课：组件生命周期：幂等、迭代、纪元、异步","en":"Lesson 9: Component Lifecycle: Idempotence, Iteration, Epochs, Asynchrony","ja":"第 9 課：コンポーネントのライフサイクル：冪等、イテレーション、エポック、非同期","ko":"9과: 컴포넌트 생명주기: 멱등, 반복, 에포크, 비동기"},
    summaries: {"zh":"组件 = 「依赖声明 d（我需要什么）」+「效应函数 e（我贡献什么）」；它只有两个目标状态——Active（效应已应用且依赖全满足）和 Inactive（缺一即非）。而让它在真实世界里安全地来回切换，靠四个机制：幂等（每个逆函数最多生效一次）、迭代（一次 Reload 可分很多步、随时可中断）、纪元（给目标状态打版本号、识破过时）、异步惯性（转换要花真实时间，一旦开跑就让它跑完）。","en":"A component = \"dependency declaration d (what I need)\" + \"effect function e (what I contribute)\"; it has exactly two target states — Active (effects applied and all dependencies satisfied) and Inactive (missing either one). Four mechanisms keep it safe to flip between them in the real world: idempot","ja":"コンポーネント = 「依存宣言 d（自分が必要なもの）」+「エフェクト関数 e（自分が提供するもの）」。目標状態は 2 つだけ——Active（エフェクトが適用済みで依存がすべて満たされている）と Inactive（どちらか一つでも欠けていれば非アクティブ）。そして現実の世界で安全に両者を行き来させるのが 4 つの仕組み——冪等（各逆関数は最大 1 回しか効果を発揮しない）、イテレーション（1 回の Reload を多数のステップに分け、いつでも中断できる）、エポック（目標状態にバージョン番号を付けて陳腐化を見抜く）、非同期の慣性（遷移には実時間がかかるので、一度始まったら最後まで実行させる）","ko":"컴포넌트 = 「의존 선언 d(내가 필요한 것)」+「이펙트 함수 e(내가 기여하는 것)」. 목표 상태는 단 두 가지——Active(이펙트가 적용되었고 의존이 모두 충족됨)와 Inactive(하나라도 빠지면 비활성). 그리고 이 둘을 현실 세계에서 안전하게 오가게 하는 것이 네 가지 메커니즘——멱등(각 역함수는 최대 한 번만 효력을 가짐), 반복(한 번의 Reload를 여러 단계로 나누고 언제든 중단 가능), 에포크(목표 상태에 버전 번호를 붙여 낡은 상태를 간파), 비동기 관성(전이에는 실제 시간이 걸리므로, 일단 시작하면 끝까지 실"},
  },
  {
    chapter: "cordis",
    slug: "10-context-paradigm",
    titles: {"zh":"第 10 课：上下文范式：统一上下文类型","en":"Lesson 10: The Context Paradigm: Unifying Context Types","ja":"第 10 課：コンテキストパラダイム：コンテキスト型の統一","ko":"10강: 컨텍스트 패러다임: 컨텍스트 타입의 통일"},
    summaries: {"zh":"上下文范式（Context Paradigm）把「我在哪（当前状态）、我改了什么（逆函数）、我需要什么（依赖表）」三样东西全部装进同一个可递归的 ctx 实体里，让组件的「插拔」从一句比喻变成真正能落实的结构——撤销和重连的正确性，不再靠开发者自律，而是靠构造本身保证。","en":"The Context Paradigm packs three things — \"where I am (current state), what I changed (inverse functions), what I need (dependency table)\" — into a single recursive ctx entity, turning the \"plug and unplug\" metaphor for components into a structure that can actually be implemented — the correctness o","ja":"コンテキストパラダイム（Context Paradigm）は、「私はどこにいるか（現在の状態）、私は何を変えたか（逆関数）、私は何を必要とするか（依存テーブル）」という 3 つのものをすべて、同じ再帰可能な ctx エンティティに詰め込みます。これにより、コンポーネントの「プラグイン・プラグアウト」は単なる比喩から、実際に実装できる構造へと変わります。アンドゥと再接続の正しさは、もはや開発者の自律ではなく、構造そのものによって保証されます。","ko":"컨텍스트 패러다임(Context Paradigm)은 「내가 어디에 있는가(현재 상태), 내가 무엇을 바꿨는가(역함수), 내가 무엇을 필요로 하는가(의존성 테이블)」이라는 세 가지를 모두 하나의 재귀 가능한 ctx 엔티티에 담습니다. 이를 통해 컴포넌트의 「플러그인·플러그아웃」은 단순한 비유에서 실제로 구현할 수 있는 구조로 바뀌고, 실행 취소와 재연결의 정확성은 더 이상 개발자의 자율이 아니라 구조 자체에 의해 보장됩니다."},
  },
  {
    chapter: "cordis",
    slug: "11-core-library",
    titles: {"zh":"第 11 课：Cordis 核心库：效应跟踪与余效应解析","en":"Lesson 11: The Cordis Core Library — Effect Tracking and Coeffect Resolution","ja":"第 11 課：Cordis コアライブラリ：エフェクト追跡とコエフェクト解決","ko":"11과: Cordis 코어 라이브러리: 이펙트 추적과 코이펙트 해석"},
    summaries: {"zh":"一句话版：这一课我们把论文「从公式变成代码」——Cordis 核心库把一切上下文变更收敛到唯一一个原语 ctx.effect（自动跟踪、随时可撤销），再在它上面盖出余效应的读写、组件的加载与卸载，最后用 Proxy 保证「没声明的东西根本碰不到」。","en":"One-sentence version: in this lesson we turn the paper \"from formulas into code\" — the Cordis core library collapses every context mutation into a single primitive ctx.effect (auto-tracked, undoable at any time), then builds on top of it the reading and writing of coeffects and the mounting and unmo","ja":"一言でいうと：この課では論文を「数式からコードへ」落とし込みます——Cordis コアライブラリは、あらゆるコンテキスト変更を唯一のプリミティブ ctx.effect（自動追跡、いつでも取り消し可能）に集約し、その上にコエフェクトの読み書き、コンポーネントのロードとアンロードを組み立て、最後に Proxy で「宣言していないものにはそもそも触れられない」ことを保証します。","ko":"한 줄 요약: 이번 과에서는 논문을 「수식에서 코드로」 옮깁니다——Cordis 코어 라이브러리는 모든 컨텍스트 변경을 단 하나의 프리미티브 ctx.effect(자동 추적, 언제든 취소 가능)로 수렴시키고, 그 위에 코이펙트의 읽기와 쓰기, 컴포넌트의 로드와 언로드를 쌓아 올린 뒤, 마지막으로 Proxy로 「선언하지 않은 것은 아예 건드릴 수 없다」를 보장합니다."},
  },
  {
    chapter: "cordis",
    slug: "12-loader-koishi",
    titles: {"zh":"第 12 课：组件加载器与 Koishi 案例","en":"Lesson 12: The Component Loader and the Koishi Case Study","ja":"第 12 課：コンポーネントローダーと Koishi の事例","ko":"12과: 컴포넌트 로더와 Koishi 사례"},
    summaries: {"zh":"这一课讲「组件加载器」——它把编排器写下的「想要什么组件」这份声明式配置，翻译成对运行中纤程的最小改动：条目按字段增量协调、改代码靠 HMR 不重启地热替换，而拥有 4000+ 社区插件的 Koishi 在真实生产中验证了这套设计的表达能力与通用性。","en":"This lesson covers the \"component loader\" — it translates the declarative configuration the orchestrator writes down (\"which components I want\") into minimal changes to running fibers: entries are reconciled incrementally field by field, code changes are hot-swapped via HMR without restarting, and K","ja":"この課では「コンポーネントローダー」を扱います。ローダーは、オーケストレーターが書き下した「どのコンポーネントが欲しいか」という宣言的設定を、実行中のファイバーへの最小限の変更へと翻訳します。エントリーはフィールド単位で増分リコンシルされ、コード変更は HMR によって再起動なしでホットスワップされます。そして 4000+ のコミュニティプラグインを持つ Koishi が、この設計の表現力と汎用性を実際の本番環境で検証しています。","ko":"이번 과에서는 「컴포넌트 로더」를 다룹니다. 로더는 오케스트레이터가 적어 내린 「어떤 컴포넌트가 필요한가」라는 선언적 설정을, 실행 중인 파이버에 대한 최소한의 변경으로 번역합니다. 엔트리는 필드 단위로 증분 리컨실되고, 코드 변경은 HMR을 통해 재시작 없이 핫스왑됩니다. 그리고 4000+ 개의 커뮤니티 플러그인을 보유한 Koishi가 실제 프로덕션 환경에서 이 설계의 표현력과 범용성을 검증했습니다."},
  },
  {
    chapter: "cordis",
    slug: "13-discussion",
    titles: {"zh":"第 13 课：讨论、相关工作与总结","en":"Lesson 13: Discussion, Related Work, and Conclusion","ja":"第 13 課：考察、関連研究、そしてまとめ","ko":"13과: 토론, 관련 연구, 그리고 정리"},
    summaries: {"zh":"论文在讲完形式模型与实现之后，还有三个收尾动作——第 5 章「讨论」把范式推向真实工程（服务代理、沙箱、语言独立性、组件粒度、版本管理），第 6 章「相关工作」把它放进学术地图、与 Effekt、AOP、DSU 等邻居逐个划清界限，第 7 章「结论」用「两个维度、一套实现、一个未来」收束全篇——读完本课，你就完整读完了 Cordis 这篇论文。","en":"After presenting the formal model and the implementation, the paper has three closing moves — Chapter 5 \"Discussion\" pushes the paradigm into real engineering (service proxies, sandboxes, language independence, component granularity, version management), Chapter 6 \"Related Work\" places it on the aca","ja":"論文は形式モデルと実装の解説を終えた後、あと三つの締めくくりを行います——第 5 章「考察」ではパラダイムを実際のエンジニアリングへと推し進め（サービスプロキシ、サンドボックス、言語独立性、コンポーネント粒度、バージョン管理）、第 6 章「関連研究」ではそれを学術の地図の上に置き、Effekt、AOP、DSU といった近隣の研究との境界を一つずつ明確にし、第 7 章「結論」では「二つの次元、一つの実装、一つの未来」で全体を締めくくります——このレッスンを読み終えれば、あなたは Cordis の論文をすべて読み終えたことになります。","ko":"논문은 형식 모델과 구현을 설명한 뒤 세 가지 마무리 작업을 합니다——제5장 「토론」은 패러다임을 실제 엔지니어링으로 밀어 나가고(서비스 프록시, 샌드박스, 언어 독립성, 컴포넌트 세분성, 버전 관리), 제6장 「관련 연구」는 이를 학술 지도 위에 올려놓고 Effekt, AOP, DSU 같은 이웃 연구들과 하나하나 경계를 그으며, 제7장 「결론」은 「두 개의 차원, 하나의 구현, 하나의 미래」로 전체를 마무리합니다——이번 과를 다 읽으면 Cordis 논문 전체를 다 읽은 것입니다."},
  },
  {
    chapter: "core",
    slug: "01-boot-config",
    titles: {"zh":"第 1 课：启动与配置：一行配置改变整个智能体","en":"Lesson 1: Boot & Configuration: One Line of Config Changes the Entire Agent","ja":"第 1 課：起動と設定：一行の設定がエージェント全体を変える","ko":"1과: 부팅과 설정: 설정 한 줄이 에이전트 전체를 바꾼다"},
    summaries: {"zh":"在 DSH 里，「配置即组合」——一个 cordis.yml 就决定了整个智能体加载哪些插件、用哪个模型、有哪些工具；改一行配置就能换模型、加工具、换能力组合，完全不用改一行代码。","en":"In DSH, \"configuration is composition\" — a single cordis.yml decides which plugins the entire agent loads, which model it uses, and which tools it has; changing one line of config can swap the model, add tools, or change the capability set, without touching a single line of code.","ja":"DSH では「設定はコンポジション」——ひとつの cordis.yml が、エージェント全体がどのプラグインをロードし、どのモデルを使い、どんなツールを持つかを決定します。一行の設定を変えるだけで、モデルの交換、ツールの追加、能力の組み合わせの変更ができ、コードは一行も触る必要がありません。","ko":"DSH에서는 「설정은 곧 컴포지션」입니다 — 하나의 cordis.yml이 에이전트 전체가 어떤 플러그인을 로드하고, 어떤 모델을 사용하고, 어떤 도구를 가질지를 결정합니다. 설정 한 줄만 바꾸면 모델 교체, 도구 추가, 능력 조합 변경이 가능하며, 코드는 한 줄도 수정할 필요가 없습니다."},
  },
  {
    chapter: "core",
    slug: "02-ctx-basics",
    titles: {"zh":"第 2 课：认识 ctx：一切能力的入口","en":"Lesson 2: Meet ctx — the Entry Point to Every Capability","ja":"第 2 課：ctx を知る：あらゆる能力の入口","ko":"제 2 과: ctx 알아보기: 모든 능력의 입구"},
    summaries: {"zh":"ctx 是 DSH 里一切能力的入口——模型、工具、会话、命令、沙箱、技能全都挂在一个叫 ctx 的上下文对象上；ctx.xxx 就是 DSH 的 API 面，学会了 ctx，就拿到了打开整个 DSH 的钥匙。","en":"ctx is the entry point to every capability in DSH — models, tools, sessions, commands, sandbox, and skills all hang off a single context object called ctx; ctx.xxx is DSH's API surface — master ctx and you hold the key to all of DSH.","ja":"ctx は DSH におけるあらゆる能力の入口です——モデル、ツール、セッション、コマンド、サンドボックス、スキルはすべて ctx というコンテキストオブジェクトにぶら下がっています。ctx.xxx こそが DSH の API 面であり、ctx を学べば、DSH 全体を開く鍵を手に入れたも同然です。","ko":"ctx는 DSH에서 모든 능력으로 통하는 입구입니다. 모델, 도구, 세션, 명령, 샌드박스, 스킬이 모두 ctx라는 컨텍스트 객체에 매달려 있습니다. ctx.xxx가 바로 DSH의 API 표면이며, ctx를 배우면 DSH 전체를 여는 열쇠를 손에 쥐는 것입니다."},
  },
  {
    chapter: "core",
    slug: "03-agent-loop-session",
    titles: {"zh":"第 3 课：智能体循环与会话：一切有据可查","en":"Lesson 3: Agent Loop and Sessions: Everything Is Documented","ja":"第 3 課：エージェントループとセッション：すべてが記録されている","ko":"3과: 에이전트 루프와 세션: 모든 것이 기록되어 있다"},
    summaries: {"zh":"DSH 把智能体的整个工作过程记成一份只追加、不修改的会话日志——模型看见什么，日志就记录什么；恢复、fork、回放、遥测、界面全都从这一份日志派生，所以任务跑到一半，也能无损地继续、分叉或回看。","en":"DSH records the agent's entire working process as an append-only, never-modified session log — whatever the model sees, the log records. Recovery, forking, replay, telemetry, and the UI all derive from this single log, so even a task that is only halfway done can be continued, forked, or replayed lo","ja":"DSH はエージェントの作業プロセス全体を、追記のみ・変更不可のセッションログとして記録します——モデルに見えるものは、すべてログに記録される。復旧・fork・リプレイ・テレメトリ・UI はすべてこの 1 つのログから派生するため、タスクが途中であっても、損失なく続行・分岐・振り返りができます。","ko":"DSH는 에이전트의 전체 작업 과정을 추가만 가능하고 수정할 수 없는 세션 로그로 기록합니다——모델이 보는 것은 무엇이든 로그에 기록됩니다. 복구, fork, 리플레이, 텔레메트리, UI는 모두 이 하나의 로그에서 파생되므로, 작업이 중간에 멈춰도 손실 없이 계속하거나, 분기하거나, 되돌아볼 수 있습니다."},
  },
  {
    chapter: "core",
    slug: "04-tools-execution",
    titles: {"zh":"第 4 课：工具与执行：让智能体真正动手","en":"Lesson 4: Tools & Execution: Making the Agent Really Do Things","ja":"第4課：ツールと実行：エージェントに本当に手を動かさせる","ko":"4과: 도구와 실행: 에이전트가 진짜로 손을 움직이게 하기"},
    summaries: {"zh":"智能体不能只「会想」，还得「会做」——DSH 里模型只负责声明「我要调用什么工具、传什么参数」，工具注册表 ctx.tools 负责调度，bash、pty、subprocess 这些可替换的执行后端负责真正动手，结果再回到模型上下文，开启下一轮思考。","en":"An agent can't just \"think\" — it also has to \"do.\" In DSH, the model is only responsible for declaring \"what tool I want to call and with what arguments\"; the tool registry ctx.tools handles dispatch, replaceable execution backends such as bash, pty, and subprocess do the actual work, and the result","ja":"エージェントは「考える」だけではなく「やる」こともできなければならない——DSHではモデルが「どのツールをどんな引数で呼び出すか」の宣言だけを担当し、ツールレジストリ ctx.tools がディスパッチを担当し、bash・pty・subprocessといった差し替え可能な実行バックエンドが実際に手を動かし、結果がモデルのコンテキストに戻って次の思考ラウンドが始まります。","ko":"에이전트는 「생각」만 할 수 있어서는 안 되고 「실행」도 할 수 있어야 합니다——DSH에서는 모델이 「어떤 도구를 어떤 인자로 호출할지」 선언하는 일만 담당하고, 도구 레지스트리 ctx.tools 가 디스패치를 담당하며, bash·pty·subprocess 같은 교체 가능한 실행 백엔드가 실제로 손을 움직이고, 결과가 모델 컨텍스트로 돌아와 다음 사고 라운드가 시작됩니다."},
  },
  {
    chapter: "core",
    slug: "05-sandbox-security",
    titles: {"zh":"第 5 课：安全边界：能碰什么、不能碰什么","en":"Lesson 5: The Security Boundary: What You Can Touch and What You Can't","ja":"第 5 課：セキュリティ境界：触れられるもの、触れられないもの","ko":"5강: 보안 경계: 무엇을 건드릴 수 있고, 무엇을 건드릴 수 없는가"},
    summaries: {"zh":"DSH 的安全哲学是「默认不信任」——插件要先声明自己要用什么、命令要在沙箱里被包装、文件改动要过策略事件、密钥永远只以引用形式存在——「能碰什么」不是一句口号，而是四道可以逐层验证的防线。","en":"DSH's security philosophy is \"distrust by default\" — plugins must first declare what they use, commands must be wrapped inside a sandbox, file changes must pass policy events, and secrets only ever exist as references — \"what you can touch\" is not a slogan, but four defenses that can be verified lay","ja":"DSH のセキュリティ哲学は「デフォルトで信用しない」——プラグインは何を使うかを事前に宣言し、コマンドはサンドボックス内でラップされ、ファイル変更はポリシーイベントを通過し、シークレットは常に参照の形でしか存在しない——「何に触れられるか」はスローガンではなく、層ごとに検証できる四つの防衛線です。","ko":"DSH의 보안 철학은 「기본적으로 신뢰하지 않음」입니다 —— 플러그인은 무엇을 사용할지 먼저 선언하고, 명령은 샌드박스 안에서 래핑되며, 파일 변경은 정책 이벤트를 통과하고, 시크릿은 항상 참조 형태로만 존재합니다 —— 「무엇을 건드릴 수 있는가」는 구호가 아니라, 계층별로 검증할 수 있는 네 개의 방어선입니다."},
  },
  {
    chapter: "core",
    slug: "06-senses-context",
    titles: {"zh":"第 6 课：感知世界：技能、搜索与上下文","en":"Lesson 6: Sensing the World: Skills, Search, and Context","ja":"第6課：世界を感知する：スキル、検索、コンテキスト","ko":"제6과: 세상을 감지하기: 스킬, 검색, 컨텍스트"},
    summaries: {"zh":"智能体不能只会「动手」，还得会「感知」——用可复用的技能包（skill）学会新本领、用 Web 搜索与抓取查资料、用 LSP 读懂代码语义、用工作区记住自己在哪个项目，再用上下文压缩在超长会话里不「失忆」；而在 DSH 里，这些感官全部是可替换的插件接缝。","en":"An agent can't just \"act\" — it also has to \"sense\": learn new abilities with reusable skill packs, look things up with web search and fetching, read code semantics with LSP, remember which project it's working in through the workspace, and avoid \"losing its memory\" in very long sessions with context","ja":"エージェントは「手を動かす」だけでは不十分で、「感知」もできなければなりません――再利用可能なスキルパック（skill）で新しい能力を学び、Web検索とフェッチで情報を調べ、LSPでコードのセマンティクスを読み取り、ワークスペースで自分がどのプロジェクトにいるかを記憶し、コンテキスト圧縮で超長いセッションでも「記憶喪失」にならないようにする。そしてDSHでは、これらの感覚はすべて交換可能なプラグインのシーム（seam）です。","ko":"에이전트는 「손을 움직이는」 것만으로는 부족하고 「감지」도 할 수 있어야 합니다 — 재사용 가능한 스킬 팩(skill)으로 새로운 능력을 배우고, 웹 검색과 페치로 자료를 찾고, LSP로 코드 의미를 읽고, 워크스페이스로 자신이 어느 프로젝트에 있는지 기억하고, 컨텍스트 압축으로 아주 긴 세션에서도 「기억상실」이 되지 않아야 합니다. 그리고 DSH에서는 이 모든 감각이 교체 가능한 플러그인 심(seam)입니다."},
  },
  {
    chapter: "core",
    slug: "07-goals-collab",
    titles: {"zh":"第 7 课：目标、计划与协作：单兵到军团","en":"Lesson 7: Goals, Plans, and Collaboration: From Solo Agent to Legion","ja":"第7課：目標・計画・協調：単独から軍団へ","ko":"제7강: 목표, 계획, 협업: 단독 요원에서 군단으로"},
    summaries: {"zh":"一个人干不完的大任务，就让一支「智能体军团」来干——目标（goal）持久记录「为什么干」，计划（plan）落成可对账的协作状态，后台任务（tasks）与待办（todo）跟踪进度，子智能体（subagent）领走各自的子任务，再用工作流（workflow）脚本把大家编排成有序的流水线：从单兵作战，到军团协同。","en":"For a big task no single agent can finish alone, let an \"agent legion\" do it — the goal persists \"why we are doing this\", the plan becomes auditable collaboration state, background tasks and todos track progress, subagents each take their own subtask, and a workflow script orchestrates everyone into","ja":"一人では片付けきれない大きなタスクは、「エージェント軍団」に任せましょう——目標（goal）は「なぜやるのか」を永続的に記録し、計画（plan）は照合可能な協調状態として形になり、バックグラウンドタスク（tasks）とToDo（todo）が進捗を追跡し、サブエージェント（subagent）がそれぞれのサブタスクを引き受け、さらにワークフロー（workflow）スクリプトが全員を秩序あるパイプラインに編成します。単独作戦から、軍団の協調へ。","ko":"혼자서 합내기에는 벅찬 큰 작업은 「에이전트 군단」에게 맡기세요——목표(goal) 는 「왜 하는가」를 영구적으로 기록하고, 계획(plan) 은 대조 가능한 협업 상태로 자리 잡으며, 백그라운드 작업(tasks) 과 할 일(todo) 이 진행 상황을 추적하고, 서브에이전트(subagent) 가 각자의 하위 작업을 맡고, 워크플로(workflow) 스크립트가 모두를 질서 있는 파이프라인으로 편성합니다. 단독 작전에서 군단 협업으로."},
  },
  {
    chapter: "core",
    slug: "08-self-evolution",
    titles: {"zh":"第 8 课：自我演化：智能体改造自己","en":"Lesson 8: Self-Evolution: The Agent Modifies Itself","ja":"第 8 課：自己進化：エージェントが自分自身を改造する","ko":"제 8 과: 자기 진화: 에이전트가 스스로를 개조한다"},
    summaries: {"zh":"DSH 里有一组需要显式启用的「自指 Cordis 工具」，让智能体能检查自己的实时运行时、在运行中给自己挂载或卸载插件；再配上 Code Mode（run_code 工具 + 生成的 SDK），智能体甚至可以自己写代码、自己装上、不好用自己拆——而这一切不会自毁，因为底层是 Cordis 的时空可组合性：装上能拆、拆下无痕。","en":"DSH ships a set of self-referential Cordis tools that must be explicitly enabled. They let an agent inspect its own live runtime and mount or unmount plugins on itself while it runs. Combined with Code Mode (the run_code tool + the generated SDK), an agent can even write its own code, install it, an","ja":"DSH には明示的に有効化が必要な「自己参照 Cordis ツール」のセットがあり、エージェントが自分のライブランタイムを検査し、実行中に自分自身へプラグインをマウント・アンマウントできます。さらに Code Mode（run_code ツール + 生成される SDK）を組み合わせると、エージェントは自分でコードを書き、自分でインストールし、うまく動かなければ自分で取り外すことさえできます。それでも自壊しないのは、土台に Cordis の時空間合成可能性があるからです。マウントしたものは取り外せ、取り外せば痕跡も残りません。","ko":"DSH에는 명시적으로 활성화해야 하는 「자기 참조 Cordis 도구」 세트가 있어, 에이전트가 자신의 라이브 런타임을 검사하고 실행 중에 스스로 플러그인을 마운트하거나 언마운트할 수 있습니다. 여기에 Code Mode(run_code 도구 + 생성된 SDK)를 결합하면 에이전트는 스스로 코드를 작성하고, 스스로 설치하고, 제대로 동작하지 않으면 스스로 제거할 수도 있습니다. 그런데도 자멸하지 않는 이유는, 그 밑바탕에 Cordis의 시공간 합성 가능성이 있기 때문입니다. 마운트한 것은 언마운트할 수 있고, 언마운트하면 흔적도 남지 "},
  },
  {
    chapter: "core",
    slug: "09-event-system",
    titles: {"zh":"第 9 课：事件系统：一切皆事件","en":"Lesson 9: The Event System: Everything Is an Event","ja":"第 9 課：イベントシステム：すべてはイベント","ko":"9강: 이벤트 시스템: 모든 것은 이벤트다"},
    summaries: {"zh":"DSH 把智能体的每个关键动作都「广播」成事件——事件就是服务的扩展 API：想在不 fork 源码的前提下插入自定义逻辑，监听对应事件即可；遇到 waterfall（瀑布式）事件时，调用 next() 把控制权委托给下游，不调用则短路接管。","en":"DSH \"broadcasts\" every key action of the agent as an event — events are the service's extension API: to insert custom logic without forking the source, just listen to the corresponding event; when you hit a waterfall event, call next() to delegate control downstream, or short-circuit and take over b","ja":"DSH はエージェントの重要なアクションをすべてイベントとして「ブロードキャスト」します。イベントこそサービスの拡張 API です。ソースを fork せずにカスタムロジックを差し込みたいなら、対応するイベントをリッスンするだけ。waterfall（滝式）イベントに出会ったら、next() を呼んで制御を下流に委譲するか、呼ばずにショートサーキットして乗っ取ります。","ko":"DSH는 에이전트의 핵심 동작 하나하나를 이벤트로「브로드캐스트」합니다. 이벤트가 바로 서비스의 확장 API입니다. 소스를 fork하지 않고 커스텀 로직을 끼워 넣고 싶다면 해당 이벤트를 리스닝하기만 하면 됩니다. waterfall(폭포식) 이벤트를 만나면 next()를 호출해 제어권을 하류에 위임하고, 호출하지 않으면 숏서킷으로 장악합니다."},
  },
  {
    chapter: "core",
    slug: "10-code-map",
    titles: {"zh":"第 10 课：代码地图：项目结构导航","en":"Lesson 10: The Code Map: Navigating the Project Structure","ja":"第 10 課：コードマップ：プロジェクト構造のナビゲーション","ko":"10강: 코드 맵: 프로젝트 구조 낸비게이션"},
    summaries: {"zh":"DSH 是一个 monorepo（多包仓库）——apps/ 是入口（cli、web、acp），packages/ 是全部能力（每个包都是一块可替换的插件积木），docs/ 是说明书；想找什么能力，就去 packages/xxx 找对应名字的包，再配合 docs/architecture.zh.md 里的「ctx 键 → 包 → 职责」表和 module-graph 依赖图，整个仓库就能像地图一样导航。","en":"DSH is a monorepo — apps/ holds the entry points (cli, web, acp), packages/ holds all the capabilities (each package is a swappable plugin brick), and docs/ is the manual; whatever capability you are looking for, go to the package with the matching name under packages/xxx, and with the \"ctx key → pa","ja":"DSH はモノレポ（マルチパッケージリポジトリ）です——apps/ は入口（cli、web、acp）、packages/ はすべての能力（各パッケージは交換可能なプラグインの部品）、docs/ は説明書です。探したい能力があれば、packages/xxx の下に対応する名前のパッケージを探せばよいのです。さらに docs/architecture.zh.md の「ctx キー → パッケージ → 役割」表と module-graph 依存グラフを組み合わせれば、リポジトリ全体を地図のようにナビゲートできます。","ko":"DSH는 모노레포(멀티 패키지 저장소)입니다. apps/는 진입점(cli, web, acp)이고, packages/는 모든 기능(각 패키지는 교체 가능한 플러그인 블록)이며, docs/는 설명서입니다. 찾고 싶은 기능이 있으면 packages/xxx 아래에서 해당 이름의 패키지를 찾으면 됩니다. 여기에 docs/architecture.zh.md의 \"ctx 키 → 패키지 → 역할\" 표와 module-graph 의존성 그래프를 함께 활용하면 저장소 전체를 지도처럼 탐색할 수 있습니다."},
  },
  {
    chapter: "core",
    slug: "11-plugin-anatomy",
    titles: {"zh":"第 11 课：插件代码解剖：一个 DSH 包长什么样","en":"Lesson 11: Plugin Anatomy: What a DSH Package Looks Like","ja":"第 11 課：プラグインコードの解剖：DSH パッケージはどんな姿をしているか","ko":"11과: 플러그인 코드 해부: DSH 패키지는 어떤 모습인가"},
    summaries: {"zh":"在 DSH 里，「给智能体加一个新能力」不是改源码，而是写一个包——在 src/index.ts 里导出 name（我是谁）、inject（我需要什么）和 apply（我贡献什么），把它注册进 cordis.yml，框架就会用 ctx.use 把它实例化成带生命周期的 fiber：加载即生效、卸载即还原。","en":"In DSH, \"giving the agent a new capability\" is not about changing the source code — it's about writing a package — exporting name (who I am), inject (what I need), and apply (what I contribute) from src/index.ts, registering it in cordis.yml, and the framework instantiates it with ctx.use into a lif","ja":"DSH では、「エージェントに新しい能力を追加する」ことはソースコードを改変することではなく、パッケージを書くことです——src/index.ts で name（私は誰か）、inject（何が必要か）、apply（何を提供するか）をエクスポートし、それを cordis.yml に登録すれば、フレームワークが ctx.use でそれをライフサイクルを持つ fiber としてインスタンス化します：ロードすれば即座に有効、アンロードすれば即座に元通り。","ko":"DSH에서 \"에이전트에 새 능력을 추가한다\"는 것은 소스 코드를 수정하는 것이 아니라 패키지를 작성하는 것입니다 — src/index.ts에서 name(나는 누구인가), inject(무엇이 필요한가), apply(무엇을 기여하는가)를 남내고, 이를 cordis.yml에 등록하면, 프레임워크가 ctx.use로 이를 라이프사이클을 갖춘 fiber로 인스턴스화합니다: 로드 즉시 적용, 언로드 즉시 복원."},
  },
  {
    chapter: "core",
    slug: "12-web-ui",
    titles: {"zh":"第 12 课：前端与 Web UI：会话如何变成界面","en":"Lesson 12: Frontend and Web UI: How Sessions Become Interfaces","ja":"第12課：フロントエンドと Web UI：セッションはどうやってインターフェースになるのか","ko":"12과: 프런트엔드와 Web UI: 세션이 어떻게 인터페이스가 되는가"},
    summaries: {"zh":"你看到的整个 DSH Web 界面，不是「一个写死的网页」，而是浏览器侧的一群 Cordis UI 插件拼出来的：web shell 启动 → client runtime 提供服务 → connection 通过 RPC 与宿主通信；宿主侧用 ctx.agents 驱动智能体、把 session/event 事件流推下来，UI 再从事件流投影出聊天、工具树和目标面板——界面是插件的组合，日志是界面的数据源。","en":"The entire DSH Web interface you see is not \"a single hard-coded webpage\" but a collection of Cordis UI plugins assembled on the browser side: the web shell starts → the client runtime provides services → the connection talks to the host over RPC; on the host side, ctx.agents drives agents and pushe","ja":"あなたが見ている DSH Web インターフェース全体は、「書き込まれた1枚のウェブページ」ではなく、ブラウザ側で一群の Cordis UI プラグインを組み合わせたものです。web shell が起動 → client runtime がサービスを提供 → connection が RPC でホストと通信し、ホスト側では ctx.agents がエージェントを駆動し、session/event イベントストリームをプッシュします。UI はそのイベントストリームからチャット、ツールツリー、ゴールパネルを射影します——インターフェースはプラグインの組み合わせであり、ログはインターフェースのデータ","ko":"여러분이 보는 DSH Web 인터페이스 전체는 「하나로 하드코딩된 웹페이지」가 아니라 브라우저 측에서 여러 Cordis UI 플러그인을 조합해 만든 것입니다. web shell 이 시작되고 → client runtime 이 서비스를 제공하고 → connection 이 RPC 로 호스트와 통신합니다. 호스트 측에서는 ctx.agents 가 에이전트를 구동하고 session/event 이벤트 스트림을 남겨주고, UI 는 그 이벤트 스트림에서 채팅, 도구 트리, 목표 패널을 투영합니다 — 인터페이스는 플러그인의 조합이고, 로그는 인터페이"},
  },
  {
    chapter: "dev",
    slug: "01-hello-plugin",
    titles: {"zh":"第 1 课：第一个插件：Hello, DSH!","en":"Lesson 1: Your First Plugin: Hello, DSH!","ja":"第 1 課：はじめてのプラグイン：Hello, DSH!","ko":"제 1 과: 첫 번째 플러그인: Hello, DSH!"},
    summaries: {"zh":"在 DSH 里给智能体加一个「打招呼」插件，不用 fork 源码——写一个导出 name 和 apply(ctx) 的 TypeScript 模块，在 cordis.yml 里登记它，启动 dsh 后它立刻生效；把它移出装配再启动，它注册的一切也随之还原。这就是你亲手写下的第一个插件。","en":"add a \"greeting\" plugin for your agent in DSH without forking the source — write a TypeScript module that exports name and apply(ctx), register it in cordis.yml, and it takes effect the moment you start dsh; move it out of the assembly and start again, and everything it registered is restored as wel","ja":"DSH でエージェントに「挨拶」プラグインを追加するのに、ソースを fork する必要はありません——name と apply(ctx) をエクスポートする TypeScript モジュールを書き、cordis.yml に登録して dsh を起動すれば、すぐに有効になります。アセンブリから外して再起動すれば、プラグインが登録したものはすべて元に戻ります。これが、あなたが自分の手で書いた最初のプラグインです。","ko":"DSH에서 에이전트에 「인사」 플러그인을 추가할 때 소스를 fork할 필요가 없습니다——name과 apply(ctx)를 익스포트하는 TypeScript 모듈을 작성하고, cordis.yml에 등록한 뒤 dsh를 시작하면 즉시 적용됩니다. 어셈블리에서 빼고 다시 시작하면 플러그인이 등록한 모든 것도 원래대로 복원됩니다. 이것이 여러분이 직접 작성한 첫 번째 플러그인입니다."},
  },
  {
    chapter: "dev",
    slug: "02-write-tool",
    titles: {"zh":"第 2 课：写一个工具：给智能体加技能","en":"Lesson 2: Writing a Tool: Giving Your Agent a New Skill","ja":"第2課：ツールを書く：エージェントにスキルを追加する","ko":"2과: 도구 작성하기: 에이전트에 스킬 추가하기"},
    summaries: {"zh":"给智能体加一项新技能，就是写一个「工具」——一份给模型看的「说明书」（name、description、parameters schema）加一份真正执行的「实现」（execute 函数）；注册到 ctx.tools 后，说明书自动进入提示词组装，模型读到你写的说明书，就会在合适的时机调用你的代码。","en":"Giving your agent a new skill means writing a \"tool\" — a \"spec\" for the model to read (name, description, parameters schema) plus an \"implementation\" that actually runs (the execute function); once registered to ctx.tools, the spec automatically enters prompt assembly, the model reads the spec you w","ja":"エージェントに新しいスキルを追加するとは、「ツール」を書くことです――モデルが読む「仕様書」（name、description、parameters スキーマ）と、実際に実行される「実装」（execute 関数）のセットです。ctx.tools に登録すれば、仕様書は自動的にプロンプトの組み立てに組み込まれ、モデルはあなたが書いた仕様書を読んで、適切なタイミングであなたのコードを呼び出します。","ko":"에이전트에 새로운 스킬을 추가한다는 것은 '도구'를 작성하는 것입니다 — 모델이 읽을 '명세서'(name, description, parameters 스키마)와 실제로 실행되는 '구현'(execute 함수)의 한 쌍입니다. ctx.tools에 등록하면 명세서가 자동으로 프롬프트 조립에 들어가고, 모델은 당신이 작성한 명세서를 읽고 적절한 시점에 당신의 코드를 호출합니다."},
  },
  {
    chapter: "dev",
    slug: "03-write-service",
    titles: {"zh":"第 3 课：写一个服务：Service 三角色","en":"Lesson 3: Writing a Service: The Three Service Roles","ja":"第3課：サービスを書く：Service の三つの役割","ko":"3과: 서비스 작성하기: Service의 세 가지 역할"},
    summaries: {"zh":"上一课你往 ctx.tools 上注册了工具；这一课你写服务——把一个能力拆成「定义、提供者、消费者」三个角色挂到 ctx 上：定义方只写契约（能力长什么样），提供方负责干活（super(ctx, name) / ctx.provide 注册实现），消费方只声明「我需要它」（inject 或 ctx.get）。三方只认名字、互不 import，换提供者不用动消费者——这就是第二章说的「接缝（seam）」，也是余效应（coeffect）在 DSH 里的日常形态。","en":"In the last lesson you registered tools on ctx.tools; in this lesson you write services — splitting a capability into three roles, \"definition, provider, consumer\", and hanging it on ctx: the definer only writes the contract (what the capability looks like), the provider does the work (super(ctx, na","ja":"前の課では ctx.tools にツールを登録しました。この課ではサービスを書きます——ひとつの能力を「定義、提供者、消費者」の三つの役割に分けて ctx にマウントします。定義側は契約（その能力がどんな形か）だけを書き、提供側が実際の処理を担い（super(ctx, name) / ctx.provide で実装を登録）、消費側は「それが必要だ」と宣言するだけです（inject または ctx.get）。三者は名前だけで結びつき、互いを import しません。提供者を差し替えても消費者に手を入れる必要はありません——これが第2章で言う「シーム（seam）」であり、コエフェクト（coeffe","ko":"지난 과에서는 ctx.tools에 도구를 등록했습니다. 이번 과에서는 서비스를 작성합니다——하나의 능력을 「정의, 제공자, 소비자」 세 가지 역할로 나누어 ctx에 마운트합니다. 정의하는 쪽은 계약(그 능력이 어떤 모습인지)만 작성하고, 제공하는 쪽이 실제 작업을 담당하며(super(ctx, name) / ctx.provide로 구현을 등록), 소비하는 쪽은 「그것이 필요하다」고 선언만 합니다(inject 또는 ctx.get). 세 쪽은 이름만 알 뿐 서로를 import하지 않습니다. 제공자를 교체해도 소비자는 손댈 필요가 없습니다"},
  },
  {
    chapter: "dev",
    slug: "04-listen-events",
    titles: {"zh":"第 4 课：监听事件：在正确的时机插入逻辑","en":"Lesson 4: Listening to Events: Inserting Logic at the Right Moment","ja":"第 4 課：イベントをリッスンする：正しいタイミングでロジックを挿入する","ko":"4강: 이벤트 리스닝: 올바른 타이밍에 로직 삽입하기"},
    summaries: {"zh":"智能体的每个关键时刻都会广播事件，你的插件只要用 ctx.on 挂一个监听器，就能在「模型请求前」「工具调用后」「轮次关闭前」插入自己的逻辑——要观察就用 emit 事件，要拦截或改行为就用 waterfall 事件，调用 next() 放行，不调用就是接管。","en":"Every critical moment of an agent broadcasts an event. Your plugin only needs to attach a listener with ctx.on to insert its own logic \"before the model request,\" \"after a tool call,\" or \"before the turn closes\" — use emit events when you want to observe, use waterfall events when you want to interc","ja":"エージェントの重要な瞬間ごとにイベントがブロードキャストされます。プラグインは ctx.on でリスナーを 1 つ登録するだけで、「モデルリクエスト前」「ツール呼び出し後」「ターン終了直前」に自分のロジックを挿入できます——観察したいなら emit イベント、インターセプトや動作変更をしたいなら waterfall イベント、next() を呼べば通過、呼ばなければ引き継ぎ（乗っ取り）です。","ko":"에이전트의 모든 중요한 순간마다 이벤트가 브로드캐스트되며, 플러그인은 ctx.on으로 리스너 하나만 등록하면 \"모델 요청 전\", \"도구 호출 후\", \"턴 종료 직전\"에 자신의 로직을 삽입할 수 있습니다. 관찰하려면 emit 이벤트를, 가로채거나 동작을 바꾸려면 waterfall 이벤트를 사용하고, next()를 호출하면 통과, 호출하지 않으면 인계(테이크오버)입니다."},
  },
  {
    chapter: "dev",
    slug: "05-config-publish",
    titles: {"zh":"第 5 课：配置与发布：可配置、可分发","en":"Lesson 5: Configuration and Publishing: Configurable, Distributable","ja":"第 5 課：設定と公開：設定可能、配布可能","ko":"5강: 설정과 배포: 설정 가능, 배포 가능"},
    summaries: {"zh":"插件做好了自己用不算完——把「不同部署可能不同」的参数全部声明成可配置的 schema、把插件打包成可安装的组合包发布出去，别人就能一条命令装上、在配置里按需调整；本课讲完「可配置、可分发」，你的插件就正式「出师」了。","en":"A plugin that works for yourself alone isn't the end — declare every parameter that \"may differ across deployments\" as a configurable schema, package the plugin into an installable bundle and publish it, and others can install it with one command and tune it in the config as needed; once this lesson","ja":"プラグインが自分用に動くだけでは終わりではありません。「デプロイごとに異なる可能性がある」パラメータをすべて設定可能なスキーマとして宣言し、プラグインをインストール可能なバンドルにパッケージ化して公開すれば、他の人は1 コマンドでインストールし、設定で必要に応じて調整できるようになります。この課で「設定可能、配布可能」を学び終えれば、あなたのプラグインは正式に「一人前」です。","ko":"플러그인이 나 혼자 쓰기에만 잘 동작하는 것으로는 끝이 아닙니다. 「배포마다 달라질 수 있는」 매개변수를 모두 설정 가능한 스키마로 선언하고, 플러그인을 설치 가능한 번들로 패키징하여 배포하면, 다른 사람들이 명령어 하나로 설치하고 설정에서 필요에 따라 조정할 수 있습니다. 이 강의에서 「설정 가능, 배포 가능」을 다루고 나면, 여러분의 플러그인은 마침내 「졸업」입니다."},
  },
  {
    chapter: "dev",
    slug: "06-advanced",
    titles: {"zh":"第 6 课：实战进阶：LLM 适配器与自指工具","en":"Lesson 6: Advanced Practice: LLM Adapters and Self-Referential Tools","ja":"第 6 課：実践応用：LLM アダプターと自己参照ツール","ko":"6강: 실전 심화: LLM 어댑터와 자기 참조 도구"},
    summaries: {"zh":"这一课啃下第四章的两块「硬骨头」——写一个 LLM 适配器，往 ctx.llm 注册新的模型提供方，换模型等于换一个适配器插件，智能体循环一行不用改；以及自指 Cordis 工具（需显式启用），让智能体检查自己的实时运行时、在运行中给自己挂载或卸载临时插件。把两者连起来，就是一个「会自我改进」的插件开发者视角：模型合成工具 → 装上 → 用 → 不好用卸掉。","en":"this lesson tackles the two \"tough nuts\" of Chapter 4 — writing an LLM adapter that registers a new model provider into ctx.llm, so switching models means swapping one adapter plugin while the agent loop stays untouched; and self-referential Cordis tools (explicitly opt-in) that let the agent inspec","ja":"この課では第 4 章の 2 つの「難関」に取り組みます——LLM アダプターを書くこと。ctx.llm に新しいモデルプロバイダーを登録すれば、モデルの切り替えはアダプタープラグインを 1 つ交換するだけで、エージェントループは 1 行も変更不要です。もう 1 つは自己参照 Cordis ツール（明示的な有効化が必要）で、エージェントが自分自身のライブランタイムを検査し、実行中に自分へ一時プラグインをマウント・アンマウントできるようにします。この 2 つをつなげると、「自己改善する」プラグイン開発者の視点が得られます：モデルがツールを合成 → マウント → 使う → ダメならアンマウント。","ko":"이 강에서는 4장의 두 가지 '어려운 고비'를 다룹니다 — LLM 어댑터 작성하기. ctx.llm에 새로운 모델 제공자를 등록하면 모델 교체는 어댑터 플러그인 하나를 바꾸는 것과 같아지고, 에이전트 루프는 한 줄도 수정할 필요가 없습니다. 그리고 자기 참조 Cordis 도구(명시적 활성화 필요)로, 에이전트가 자신의 실시간 런타임을 검사하고 실행 중에 자기 자신에게 임시 플러그인을 마운트하거나 언마운트할 수 있게 합니다. 둘을 연결하면 '스스로 개선하는' 플러그인 개발자의 관점이 완성됩니다: 모델이 도구를 합성 → 장착 → 사용 →"},
  },
  {
    chapter: "intro",
    slug: "agent-basics",
    titles: {"zh":"智能体框架的基本思想","en":"Basic Ideas of Agent Frameworks","ja":"エージェントフレームワークの基本的な考え方","ko":"에이전트 프레임워크의 기본 아이디어"},
    summaries: {"zh":"智能体 = 会思考的大脑（大模型）+ 会动手的身体（工具和环境）。智能体框架就是给\"大脑\"配\"身体\"的那套脚手架——它负责把工具、权限、记忆、多智能体协作这些杂活全部管起来，让开发者只操心\"让智能体想清楚该干什么\"。","en":"An agent = a thinking brain (the LLM) + a hands-on body (tools and environment). An agent framework is the scaffolding that gives the \"brain\" a \"body\" — it takes care of all the chores like tools, permissions, memory, and multi-agent collaboration, so developers only need to worry about \"making the ","ja":"エージェント = 考える頭脳（大規模モデル）+ 手を動かす身体（ツールと環境）。エージェントフレームワークとは、その「頭脳」に「身体」を組み合わせるための足場のことです——ツール、権限、メモリ、マルチエージェント連携といった雑務をすべて引き受け、開発者は「エージェントに何をすべきかをきちんと考えさせる」ことだけに集中できます。","ko":"에이전트 = 생각하는 두뇌(대규모 모델) + 손발이 되는 몸(도구와 환경). 에이전트 프레임워크는 이 \"두뇌\"에 \"몸\"을 달아 주는 비계입니다. 도구, 권한, 메모리, 멀티 에이전트 협업 같은 잡일을 모두 떠맡아 주므로, 개발자는 \"에이전트가 무엇을 해야 할지 제대로 생각하게 만드는 일\"에만 신경 쓰면 됩니다."},
  },
  {
    chapter: "intro",
    slug: "what-is-dsh",
    titles: {"zh":"DSH 是什么？","en":"What is DSH?","ja":"DSH とは？","ko":"DSH란 무엇인가?"},
    summaries: {"zh":"DSH（DeepSeek Harness）是一个基于 Cordis 构建的开源 coding agent（编程智能体）——它不仅是一个\"给智能体干活的环境\"，更是一整套以一切皆插件、运行可重建为核心思想的智能体操作系统。","en":"DSH (DeepSeek Harness) is an open-source coding agent built on Cordis — it is not just \"an environment where agents work\", but a whole agent operating system built around the core ideas of everything is a plugin and runs are reproducible.","ja":"DSH（DeepSeek Harness）は Cordis を基盤に構築されたオープンソースの coding agent（コーディングエージェント）です。単なる「エージェントが働くための環境」ではなく、すべてはプラグイン、実行は再構築可能という2つの核心思想を軸にした、エージェントのオペレーティングシステム全体です。","ko":"DSH(DeepSeek Harness)는 Cordis를 기반으로 구축된 오픈 소스 coding agent(코딩 에이전트)입니다. 단순히 \"에이전트가 일하는 환경\"이 아니라, 모든 것은 플러그인, 실행은 재구축 가능이라는 두 가지 핵심 사상을 중심으로 한 에이전트 운영 체제 전체입니다."},
  },
  {
    chapter: "intro",
    slug: "why-dynamic",
    titles: {"zh":"为什么需要动态组合？","en":"Why Dynamic Composition?","ja":"なぜ動的コンポジションが必要なのか？","ko":"왜 동적 합성(dynamic composition)이 필요한가?"},
    summaries: {"zh":"软件越来越需要\"运行中装上、拆下、替换组件\"，但现在的软件大多做不到——要么装了就拆不掉，要么一拆就要重启整个程序、丢掉所有状态。动态组合就是让这件事安全发生的能力，而它正是 DSH 和那篇 Cordis 论文要解决的核心问题。","en":"Software increasingly needs to \"install, remove, and replace components at runtime,\" but most software today can't do it — either you can't remove what was installed, or removing it means restarting the entire program and losing all state. Dynamic composition is the ability to make this happen safel","ja":"ソフトウェアには「実行中にコンポーネントをインストール・削除・置き換える」ことがますます求められていますが、現在のソフトウェアの多くはそれができません——インストールしたら削除できないか、削除しようとするとプログラム全体を再起動してすべての状態を失うかのどちらかです。動的コンポジションとは、このことを安全に実現する能力であり、まさに DSH とあの Cordis 論文が解決しようとする中核的な問題です。","ko":"소프트웨어에는 점점 더 \"실행 중에 컴포넌트를 설치하고, 제거하고, 교체하는\" 능력이 요구되지만, 지금의 소프트웨어 대부분은 그것을 하지 못합니다 — 설치하면 제거할 수 없거나, 제거하려면 프로그램 전체를 재시작하면서 모든 상태를 잃어야 하기 때문입니다. 동적 합성은 이 일을 안전하게 일어나게 하는 능력이며, 바로 DSH와 그 Cordis 논문이 해결하려는 핵심 문제입니다."},
  },
  {
    chapter: "plugin",
    slug: "01-what-is-plugin",
    titles: {"zh":"第 1 课：插件到底是什么？","en":"Lesson 1: What Exactly Is a Plugin?"},
    summaries: {"zh":"DSH 插件就是一个导出 apply 函数的文件——框架启动时把一个叫 ctx 的「万能插座」递给你，你往上挂东西（工具、界面、策略），挂上去的东西在插件卸载时会自动全部撤掉。就这么简单。","en":"A DSH plugin is a file that exports an apply function. At startup the framework hands you a universal power strip called ctx; you plug things into it (tools, UI, policies), and everything you plugged in is automatically unplugged when the plugin unloads. That's the whole idea."},
  },
  {
    chapter: "plugin",
    slug: "02-what-can-plugins-do",
    titles: {"zh":"第 2 课：插件能做什么？","en":"Lesson 2: What Can Plugins Actually Do?"},
    summaries: {"zh":"从「给模型加一个能查 CSV 的工具」到「把整个界面换成 QQ2006 皮肤」再到「让 dsh 跑在安卓手机上」——只要是 DSH 的一部分，就能被插件改。这一课用生态里 275 个真实插件，带你看清这套机制的实际边界。","en":"From \"give the model a tool that queries CSV\" to \"reskin the whole interface as QQ2006\" to \"run dsh on an Android phone\" — if it is part of DSH, a plugin can change it. This lesson uses 275 real ecosystem plugins to map the practical boundaries."},
  },
  {
    chapter: "plugin",
    slug: "03-how-to-build",
    titles: {"zh":"第 3 课：怎么开发一个插件？","en":"Lesson 3: How Do You Build a Plugin?"},
    summaries: {"zh":"三步——写一个文件、在 cordis.yml 里指一下它、启动。第一个能跑的插件只要 5 行；加一个模型能调用的工具，再加 15 行。这一课全程跟着敲，二十分钟出结果。","en":"Three steps — write a file, point at it from cordis.yml, start. The first working plugin is 5 lines; adding a tool the model can call takes 15 more. Follow along and you will have a result in twenty minutes."},
  },
];

const byKey = new Map(
  lessonManifest.map((e) => [`${e.chapter}/${e.slug}`, e]),
);

export function lessonEntry(
  chapter: string,
  slug: string,
): LessonManifestEntry | null {
  return byKey.get(`${chapter}/${slug}`) ?? null;
}

/** 该课时在这个语言下是否有原生正文（而不是回落到中文）。 */
export function lessonHasLocale(
  chapter: string,
  slug: string,
  locale: string,
): boolean {
  return Boolean(byKey.get(`${chapter}/${slug}`)?.titles[locale]);
}

/** 由课程 href 反查课时；nav 里的 href 形如 /learn/core/03-agent-loop-session。 */
export function lessonFromHref(href: string): LessonManifestEntry | null {
  const m = /^\/learn\/(?:cordis\/lessons|([a-z]+))\/([^/]+)$/.exec(href);
  if (!m) return null;
  return lessonEntry(m[1] ?? "cordis", m[2]);
}
