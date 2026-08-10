/**
 * 效应 vs 余效应：两个相反的方向
 */
export function EffectVsCoeffect() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 240" className="h-auto w-full max-w-xl" role="img" aria-label="效应与余效应方向相反">
        {/* 中间：计算 */}
        <rect x="200" y="80" width="120" height="70" rx="12" fill="#4d6bfe" />
        <text x="260" y="110" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">计算</text>
        <text x="260" y="132" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">（组件/代码）</text>

        {/* 左边：环境 */}
        <rect x="20" y="80" width="120" height="70" rx="12" fill="#22d3ee" />
        <text x="80" y="110" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">环境</text>
        <text x="80" y="132" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">（世界/上下文）</text>

        {/* 右边：需要什么 */}
        <rect x="380" y="80" width="120" height="70" rx="12" fill="#8b5cf6" />
        <text x="440" y="104" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">我改了什么？</text>
        <text x="440" y="124" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">余效应 · 需要什么</text>
        <text x="440" y="142" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">给谁用？给我用</text>

        {/* 箭头：效应 计算→环境 */}
        <path d="M320 108 h56" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#ec-a)" />
        <text x="348" y="92" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="700">效应</text>
        <text x="348" y="76" textAnchor="middle" fill="rgba(34,211,238,0.8)" fontSize="10">修改世界</text>

        {/* 箭头：余效应 环境→计算 */}
        <path d="M140 132 h56" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#ec-a)" />
        <text x="168" y="158" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="700">余效应</text>
        <text x="168" y="176" textAnchor="middle" fill="rgba(139,92,246,0.8)" fontSize="10">向世界索取</text>

        <defs>
          <marker id="ec-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        效应问「我改了什么」（对世界的影响）；余效应问「我需要什么」（世界对我的约束）
      </p>
    </div>
  );
}
