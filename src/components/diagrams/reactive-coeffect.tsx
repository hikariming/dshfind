/**
 * 反应式余效应：依赖满足性驱动的状态迁移
 */
export function ReactiveCoeffect() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 260" className="h-auto w-full max-w-xl" role="img" aria-label="反应式余效应状态迁移">
        {/* 等待状态 */}
        <rect x="30" y="90" width="170" height="80" rx="14" fill="#22d3ee" />
        <text x="115" y="122" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">等待</text>
        <text x="115" y="142" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">依赖不满足（缺东西）</text>
        <text x="115" y="158" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">不启动，不报错</text>

        {/* 激活 */}
        <path d="M200 118 h34" stroke="#10b981" strokeWidth="3" markerEnd="url(#rc-a)" />
        <text x="217" y="100" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="700">依赖齐了 → 激活</text>

        <rect x="234" y="90" width="170" height="80" rx="14" fill="#10b981" />
        <text x="319" y="122" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">激活（运行）</text>
        <text x="319" y="142" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">执行组件效应，自动跟踪</text>
        <text x="319" y="158" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">依赖满足（都齐了）</text>

        {/* 停用 */}
        <path d="M404 130 h34" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#rc-b)" />
        <text x="421" y="112" textAnchor="middle" fill="#f43f5e" fontSize="12" fontWeight="700">依赖没了 → 停用</text>

        <rect x="438" y="90" width="60" height="80" rx="12" fill="#f43f5e" />
        <text x="468" y="122" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">停用</text>
        <text x="468" y="142" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">撤销全部</text>
        <text x="468" y="154" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">副作用</text>

        {/* 底部 */}
        <text x="260" y="215" textAnchor="middle" fill="#4d6bfe" fontSize="12" fontWeight="700">系统盯着变化，自动激活 / 停用——组件自己不用管</text>
        <text x="260" y="235" textAnchor="middle" fill="rgba(77,107,254,0.8)" fontSize="11">值变了但依赖仍齐 → 自动重启（重载）</text>

        <defs>
          <marker id="rc-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#10b981" />
          </marker>
          <marker id="rc-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#f43f5e" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        依赖满足性变化 → 激活 / 停用 / 中性 三种迁移分类
      </p>
    </div>
  );
}
