/**
 * 统一上下文类型 Γ∞：一个实体承载三样东西
 */
export function ContextType() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 260" className="h-auto w-full max-w-xl" role="img" aria-label="统一上下文类型：当前状态、逆函数、依赖表">
        {/* 大框：Γ∞ */}
        <rect x="60" y="30" width="400" height="180" rx="16" fill="rgba(77,107,254,0.06)" stroke="#4d6bfe" strokeWidth="2.5" />
        <text x="260" y="56" textAnchor="middle" fill="#4d6bfe" fontSize="14" fontWeight="700">统一上下文类型 Γ∞（ctx）</text>

        {/* 槽位1：当前状态 */}
        <rect x="90" y="80" width="150" height="100" rx="12" fill="#22d3ee" />
        <text x="165" y="112" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Γ · 当前状态</text>
        <text x="165" y="132" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">现在环境是什么样</text>
        <text x="165" y="152" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">（递归嵌套）</text>

        {/* 槽位2：逆函数 */}
        <rect x="260" y="80" width="150" height="100" rx="12" fill="#4d6bfe" />
        <text x="335" y="112" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Γ→Γ · 逆函数</text>
        <text x="335" y="132" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">怎么把改动撤销</text>
        <text x="335" y="152" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">（累积恢复变换）</text>

        {/* 槽位3：依赖表 */}
        <rect x="170" y="140" width="150" height="100" rx="12" fill="#8b5cf6" />
        <text x="245" y="176" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Σ · 依赖表</text>
        <text x="245" y="196" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">我需要什么</text>
        <text x="245" y="214" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">（键 → 有类型的值）</text>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        一个 ctx 同时记住「我在哪、我改了什么、我需要什么」——效应与余效应合体
      </p>
    </div>
  );
}
