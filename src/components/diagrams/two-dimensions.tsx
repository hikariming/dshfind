/**
 * 动态组合的两个维度示意图：时间可组合性 × 空间可组合性
 */
export function TwoDimensions() {
  return (
    <div className="my-8">
      <svg
        viewBox="0 0 520 300"
        className="h-auto w-full max-w-xl"
        role="img"
        aria-label="动态组合的两个维度：时间可组合性与空间可组合性"
      >
        <defs>
          <marker
            id="td-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>

        {/* 中心：动态组合 */}
        <circle cx="260" cy="150" r="50" fill="#4d6bfe" />
        <text x="260" y="146" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
          动态
        </text>
        <text x="260" y="164" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
          组合
        </text>

        {/* 左：时间维度 */}
        <rect x="16" y="110" width="170" height="80" rx="12" fill="#22d3ee" />
        <text x="101" y="143" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
          时间可组合性
        </text>
        <text x="101" y="164" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">
          拆了能还原
        </text>
        <path d="M196 150 H206" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#td-arrow)" />

        {/* 右：空间维度 */}
        <rect x="334" y="110" width="170" height="80" rx="12" fill="#8b5cf6" />
        <text x="419" y="143" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
          空间可组合性
        </text>
        <text x="419" y="164" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">
          依赖自动协调
        </text>
        <path d="M314 150 H306" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#td-arrow)" />

        {/* 上下小标签 */}
        <text x="101" y="90" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="600">
          副作用完整撤销
        </text>
        <text x="419" y="90" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="600">
          依赖齐了才启动
        </text>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        两个维度互相独立（正交）：一个管「拆了干不干净」，一个管「组件怎么协调」
      </p>
    </div>
  );
}
