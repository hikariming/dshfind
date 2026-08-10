/**
 * DSH 三层结构示意图：SDK 底座 → dsh 工具 → 生态
 */
export function DshLayers() {
  return (
    <div className="my-8">
      <svg
        viewBox="0 0 520 300"
        className="h-auto w-full max-w-xl"
        role="img"
        aria-label="DSH 三层结构：SDK 底座、dsh 工具、生态"
      >
        <defs>
          <linearGradient id="dl-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#4d6bfe" />
          </linearGradient>
          <linearGradient id="dl-base" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b5bdb" />
            <stop offset="100%" stopColor="#232e69" />
          </linearGradient>
        </defs>

        {/* 生态 */}
        <rect x="80" y="24" width="360" height="72" rx="12" fill="url(#dl-top)" />
        <text x="260" y="52" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">
          生态（内容）
        </text>
        <text x="260" y="74" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="12">
          skills · 插件 · profile ｜ 应用商店
        </text>

        {/* 下箭头 */}
        <path d="M260 102 v14" stroke="#6e8bff" strokeWidth="3" strokeLinecap="round" />
        <path d="M253 110 l7 9 l7 -9" fill="none" stroke="#6e8bff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* dsh 工具 */}
        <rect x="80" y="122" width="360" height="72" rx="12" fill="#4d6bfe" />
        <text x="260" y="150" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">
          dsh 工具
        </text>
        <text x="260" y="172" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="12">
          web · run · profile ｜ 装好系统的电脑
        </text>

        {/* 下箭头 */}
        <path d="M260 200 v14" stroke="#6e8bff" strokeWidth="3" strokeLinecap="round" />
        <path d="M253 208 l7 9 l7 -9" fill="none" stroke="#6e8bff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* SDK 底座 */}
        <rect x="80" y="220" width="360" height="72" rx="12" fill="url(#dl-base)" />
        <text x="260" y="248" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">
          SDK 底座
        </text>
        <text x="260" y="270" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="12">
          Cordis · 一切皆插件 ｜ 操作系统内核
        </text>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        三层都建立在 Cordis（时空可组合性范式）之上
      </p>
    </div>
  );
}
