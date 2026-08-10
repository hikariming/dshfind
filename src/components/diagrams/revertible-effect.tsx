/**
 * 可回退效应：装上记录逆，拆下应用逆
 */
export function RevertibleEffect() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 250" className="h-auto w-full max-w-xl" role="img" aria-label="可回退效应：装上时记录逆变换，卸载时应用逆变换">
        {/* 环境初始 */}
        <rect x="16" y="40" width="120" height="80" rx="12" fill="#22d3ee" />
        <text x="76" y="85" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">环境（初始）</text>

        {/* 装上 */}
        <path d="M136 80 h50" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#re-a)" />
        <rect x="186" y="40" width="130" height="80" rx="12" fill="#4d6bfe" />
        <text x="251" y="75" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">装上组件</text>
        <text x="251" y="97" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">执行变换 f，记录逆 f⁻¹</text>

        {/* 变化后 */}
        <path d="M316 80 h50" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#re-a)" />
        <rect x="366" y="40" width="138" height="80" rx="12" fill="#8b5cf6" />
        <text x="435" y="75" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">环境（被改）</text>
        <text x="435" y="97" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">抽屉里存着 f⁻¹</text>

        {/* 卸载回退 */}
        <path d="M435 150 v-30" stroke="#10b981" strokeWidth="3" markerEnd="url(#re-b)" />
        <rect x="16" y="150" width="138" height="70" rx="12" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeOpacity="0.5" />
        <text x="85" y="182" textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="700">卸载组件</text>
        <text x="85" y="202" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="11">应用 f⁻¹ → 环境还原</text>

        <path d="M366 185 h-220" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 5" markerEnd="url(#re-a)" />
        <text x="256" y="140" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="600">装上时记录，拆下时还原</text>

        <defs>
          <marker id="re-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
          <marker id="re-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#10b981" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        每个上下文变换都配一个显式逆变换——卸载 = 播放逆变换
      </p>
    </div>
  );
}
