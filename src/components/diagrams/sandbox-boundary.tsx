/**
 * 沙箱边界示意图
 */
export function SandboxBoundary() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 280" className="h-auto w-full max-w-xl" role="img" aria-label="沙箱边界：智能体在沙箱内，只允许访问受控资源">
        {/* 沙箱大框 */}
        <rect x="60" y="30" width="400" height="200" rx="16" fill="rgba(34,211,238,0.06)" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="8 5" />
        <text x="260" y="52" textAnchor="middle" fill="#22d3ee" fontSize="13" fontWeight="700">沙箱（sandbox）</text>

        {/* 智能体 */}
        <rect x="110" y="80" width="120" height="60" rx="12" fill="#4d6bfe" />
        <text x="170" y="107" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">智能体</text>
        <text x="170" y="125" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">+ 它调用的工具</text>

        {/* 允许 */}
        <rect x="280" y="80" width="140" height="44" rx="10" fill="#10b981" />
        <text x="350" y="100" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">允许 ✓</text>
        <text x="350" y="116" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">工作区文件 · 受管进程</text>
        <path d="M230 105 h48" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#sb-a)" />

        {/* 策略 */}
        <rect x="280" y="150" width="140" height="44" rx="10" fill="#f59e0b" />
        <text x="350" y="170" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">逐调用策略</text>
        <text x="350" y="186" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">sandboxPolicy / 审批</text>
        <path d="M230 172 h48" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#sb-b)" />

        {/* 禁止 */}
        <rect x="420" y="80" width="70" height="44" rx="10" fill="rgba(244,63,94,0.15)" stroke="#f43f5e" strokeOpacity="0.6" />
        <text x="455" y="100" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="700">系统</text>
        <text x="455" y="116" textAnchor="middle" fill="rgba(244,63,94,0.9)" fontSize="9">外部 ×</text>

        {/* 外部 */}
        <text x="455" y="170" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="700">沙箱外</text>
        <text x="455" y="188" textAnchor="middle" fill="rgba(244,63,94,0.8)" fontSize="9">摸不到 ×</text>

        <defs>
          <marker id="sb-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#10b981" />
          </marker>
          <marker id="sb-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        沙箱 + 策略 + 审批：智能体只碰它被允许碰的东西
      </p>
    </div>
  );
}
