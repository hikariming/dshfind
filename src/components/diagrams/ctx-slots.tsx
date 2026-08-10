/**
 * Cordis 核心库：ctx 的余效应槽位
 */
export function CtxSlots() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 240" className="h-auto w-full max-w-xl" role="img" aria-label="ctx 的三个余效应槽位">
        {/* ctx 大框 */}
        <rect x="150" y="30" width="220" height="150" rx="16" fill="rgba(77,107,254,0.06)" stroke="#4d6bfe" strokeWidth="2.5" />
        <text x="260" y="54" textAnchor="middle" fill="#4d6bfe" fontSize="14" fontWeight="700">ctx（上下文）</text>

        {/* 三个槽位 */}
        <rect x="175" y="72" width="170" height="30" rx="8" fill="#22d3ee" />
        <text x="260" y="92" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">@@store 值存储 σ</text>

        <rect x="175" y="110" width="170" height="30" rx="8" fill="#4d6bfe" />
        <text x="260" y="130" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">@@isolate 域表 ρ</text>

        <rect x="175" y="148" width="170" height="30" rx="8" fill="#8b5cf6" />
        <text x="260" y="168" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">@@intercept 拦截表 ι</text>

        {/* 访问 */}
        <path d="M100 120 h48" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#cs-a)" />
        <rect x="16" y="95" width="84" height="50" rx="10" fill="#10b981" />
        <text x="58" y="118" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">get(key)</text>
        <text x="58" y="134" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">两层解析</text>

        {/* 写入 */}
        <rect x="420" y="95" width="84" height="50" rx="10" fill="#f59e0b" />
        <text x="462" y="118" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">set(key)</text>
        <text x="462" y="134" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">一个效应</text>
        <path d="M370 120 h48" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#cs-a)" />

        <defs>
          <marker id="cs-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        ctx.set / ctx.get 都是效应：自动被跟踪，卸载即回退
      </p>
    </div>
  );
}
