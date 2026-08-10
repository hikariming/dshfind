/**
 * 事件 waterfall（瀑布式）拦截语义示意图
 */
export function EventWaterfall() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 240" className="h-auto w-full max-w-xl" role="img" aria-label="事件 waterfall 拦截：监听器通过 next() 委托，不调用则短路接管">
        {/* 事件源 */}
        <rect x="16" y="90" width="100" height="60" rx="12" fill="#f59e0b" />
        <text x="66" y="116" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">事件</text>
        <text x="66" y="134" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">如 agent/request</text>

        {/* 监听器链 */}
        {[
          { x: 150, label: "监听器 1", note: "中间件" },
          { x: 300, label: "监听器 2", note: "中间件" },
        ].map((l) => (
          <g key={l.label}>
            <rect x={l.x} y="90" width="100" height="60" rx="12" fill="#4d6bfe" />
            <text x={l.x + 50} y="116" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">{l.label}</text>
            <text x={l.x + 50} y="134" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">{l.note}</text>
          </g>
        ))}

        {/* 消费方 */}
        <rect x="434" y="90" width="80" height="60" rx="12" fill="#22d3ee" />
        <text x="474" y="116" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">消费方</text>
        <text x="474" y="134" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">最终处理</text>

        {/* next() 箭头 */}
        <path d="M116 108 h32" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#ew-a)" />
        <path d="M250 108 h48" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#ew-a)" />
        <text x="183" y="78" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="600">next()</text>
        <text x="274" y="78" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="600">next()</text>
        <path d="M400 108 h32" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#ew-a)" />

        {/* 短路分支 */}
        <path d="M200 90 v-24 h240 v24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6 4" markerEnd="url(#ew-b)" />
        <text x="320" y="52" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="700">不调用 next() = 直接返回 → 接管/短路</text>

        <defs>
          <marker id="ew-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#10b981" />
          </marker>
          <marker id="ew-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#f43f5e" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        waterfall = 环绕中间件：监听器用 next() 把控制权交给下一位，不调用就是接管
      </p>
    </div>
  );
}
