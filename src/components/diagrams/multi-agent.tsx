/**
 * 多智能体协作：编排器委派子智能体，目标/计划/任务贯穿
 */
export function MultiAgent() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 320" className="h-auto w-full max-w-xl" role="img" aria-label="多智能体协作：编排器委派子智能体">
        {/* 编排器 */}
        <rect x="170" y="24" width="180" height="64" rx="12" fill="#4d6bfe" />
        <text x="260" y="52" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">编排器</text>
        <text x="260" y="70" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">主智能体 / workflow</text>

        {/* 目标/计划/任务横条 */}
        <rect x="60" y="112" width="400" height="34" rx="8" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeOpacity="0.6" />
        <text x="260" y="134" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="700">目标 goals · 计划 plan · 任务 tasks · 待办 todo</text>

        {/* 子智能体 */}
        {[
          { x: 60, label: "调研员", en: "research" },
          { x: 190, label: "程序员", en: "coder" },
          { x: 320, label: "审查员", en: "reviewer" },
        ].map((s) => (
          <g key={s.label}>
            <rect x={s.x} y="180" width="140" height="58" rx="10" fill="#8b5cf6" />
            <text x={s.x + 70} y="206" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{s.label}</text>
            <text x={s.x + 70} y="224" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">subagent {s.en}</text>
          </g>
        ))}

        {/* 委派箭头 */}
        <path d="M210 88 v24" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#ma-a)" />
        <path d="M260 88 v24" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#ma-a)" />
        <path d="M310 88 v24" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#ma-a)" />
        <path d="M130 146 v34" stroke="#6e8bff" strokeWidth="2" markerEnd="url(#ma-a)" />
        <path d="M260 146 v34" stroke="#6e8bff" strokeWidth="2" markerEnd="url(#ma-a)" />
        <path d="M390 146 v34" stroke="#6e8bff" strokeWidth="2" markerEnd="url(#ma-a)" />

        {/* 结果汇总 */}
        <path d="M260 238 v26" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#ma-b)" />
        <text x="260" y="288" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="600">结果汇总回编排器</text>

        <defs>
          <marker id="ma-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
          <marker id="ma-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#10b981" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        大任务拆给多个智能体：目标贯穿、计划分解、子智能体各司其职
      </p>
    </div>
  );
}
