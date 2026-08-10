/**
 * 组件生命周期状态机：Inactive ⇄ Active
 */
export function Lifecycle() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 220" className="h-auto w-full max-w-xl" role="img" aria-label="组件生命周期：Inactive 与 Active 之间的 Reload/Unload">
        {/* Inactive */}
        <rect x="40" y="70" width="170" height="80" rx="14" fill="#22d3ee" />
        <text x="125" y="106" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">Inactive</text>
        <text x="125" y="128" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">未激活 · 依赖不满足</text>

        {/* Reload 上 */}
        <path d="M210 92 h70" stroke="#10b981" strokeWidth="3" markerEnd="url(#lc-a)" />
        <text x="245" y="76" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="700">Reload（加载）</text>
        <text x="245" y="92" textAnchor="middle" fill="rgba(16,185,129,0.8)" fontSize="10">执行效应 e，累积逆函数</text>

        {/* Active */}
        <rect x="310" y="70" width="170" height="80" rx="14" fill="#4d6bfe" />
        <text x="395" y="106" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">Active</text>
        <text x="395" y="128" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">激活 · 依赖满足</text>

        {/* Unload 下 */}
        <path d="M395 150 v-0" stroke="none" />
        <path d="M395 150 v-0" stroke="none" />
        <path d="M310 160 h-70" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#lc-b)" />
        <text x="245" y="190" textAnchor="middle" fill="#f43f5e" fontSize="12" fontWeight="700">Unload（卸载）</text>
        <text x="245" y="206" textAnchor="middle" fill="rgba(244,63,94,0.8)" fontSize="10">应用累积逆函数，恢复环境</text>

        {/* 反向箭头路径：从 Active 底部到 Inactive 底部 */}
        <path d="M310 160 C 260 172, 230 172, 210 160" fill="none" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#lc-b)" />

        <defs>
          <marker id="lc-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#10b981" />
          </marker>
          <marker id="lc-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#f43f5e" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        生命周期 = 可回退效应与反应式余效应「相遇」的地方
      </p>
    </div>
  );
}
