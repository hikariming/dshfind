/**
 * 效应组合 ⋄：后进先出（LIFO）恢复
 */
export function EffectComposition() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 280" className="h-auto w-full max-w-xl" role="img" aria-label="效应组合后进先出">
        {/* 加载顺序 */}
        <rect x="16" y="30" width="150" height="52" rx="10" fill="#22d3ee" />
        <text x="91" y="53" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">先装 f（外层）</text>
        <text x="91" y="70" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">记录逆 f⁻¹</text>
        <path d="M166 56 h36" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#ecm-a)" />
        <rect x="202" y="30" width="150" height="52" rx="10" fill="#4d6bfe" />
        <text x="277" y="53" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">后装 g（内层）</text>
        <text x="277" y="70" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">记录逆 g⁻¹</text>

        {/* 中间结果 */}
        <text x="277" y="115" textAnchor="middle" fill="#8b5cf6" fontSize="13" fontWeight="700">复合变换 = f ⋄ g</text>
        <text x="277" y="133" textAnchor="middle" fill="rgba(139,92,246,0.85)" fontSize="11">组合后：记录逆 = g⁻¹ 先、f⁻¹ 后</text>

        {/* 卸载顺序 */}
        <rect x="202" y="160" width="150" height="52" rx="10" fill="#8b5cf6" />
        <text x="277" y="183" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">先拆 g → 应用 g⁻¹</text>
        <text x="277" y="200" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">（后装的先拆）</text>
        <path d="M202 186 h-36" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#ecm-a)" />
        <rect x="16" y="160" width="150" height="52" rx="10" fill="#22d3ee" />
        <text x="91" y="183" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">再拆 f → 应用 f⁻¹</text>
        <text x="91" y="200" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">（先装的后拆）</text>

        <text x="277" y="240" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="600">恢复顺序 = 加载顺序的反转：后进先出（LIFO）</text>
        <text x="277" y="260" textAnchor="middle" fill="rgba(16,185,129,0.8)" fontSize="11">复合效应的逆，由组合自动推导——不用手写</text>

        <defs>
          <marker id="ecm-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        ⋄ 运算：任意复合效应的逆，都能按 LIFO 自动组合出来
      </p>
    </div>
  );
}
