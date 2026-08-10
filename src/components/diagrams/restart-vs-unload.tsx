/**
 * 传统重启 vs Cordis 细粒度卸载对比图
 */
export function RestartVsUnload() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 260" className="h-auto w-full max-w-xl" role="img" aria-label="传统重启 vs Cordis 细粒度卸载">
        {/* 传统 */}
        <rect x="16" y="30" width="225" height="180" rx="14" fill="rgba(244,63,94,0.08)" stroke="#f43f5e" strokeOpacity="0.4" />
        <text x="128" y="58" textAnchor="middle" fill="#f43f5e" fontSize="14" fontWeight="700">传统做法</text>
        <text x="128" y="76" textAnchor="middle" fill="#f43f5e" fontSize="11">换 1 个插件 → 重启整个宿主</text>
        {/* 插件小方块 */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={34 + (i % 2) * 95} y={92 + Math.floor(i / 2) * 46} width="80" height="30" rx="7" fill="#f43f5e" opacity={i === 1 ? 0.95 : 0.35} />
        ))}
        <text x="128" y="112" textAnchor="middle" fill="#fff" fontSize="11">插件A</text>
        <text x="128" y="158" textAnchor="middle" fill="#fff" fontSize="11">插件B</text>
        <text x="223" y="112" textAnchor="middle" fill="#fff" fontSize="11">插件C</text>
        <text x="223" y="158" textAnchor="middle" fill="#fff" fontSize="11">插件D</text>
        <text x="128" y="196" textAnchor="middle" fill="#f43f5e" fontSize="12" fontWeight="600">全部一起停 ❌</text>

        {/* Cordis */}
        <rect x="279" y="30" width="225" height="180" rx="14" fill="rgba(16,185,129,0.08)" stroke="#10b981" strokeOpacity="0.4" />
        <text x="391" y="58" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="700">Cordis 做法</text>
        <text x="391" y="76" textAnchor="middle" fill="#10b981" fontSize="11">换 1 个插件 → 只拆它自己</text>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={297 + (i % 2) * 95} y={92 + Math.floor(i / 2) * 46} width="80" height="30" rx="7" fill={i === 1 ? "#f43f5e" : "#10b981"} opacity={i === 1 ? 0.95 : 0.85} />
        ))}
        <text x="391" y="112" textAnchor="middle" fill="#fff" fontSize="11">插件A</text>
        <text x="391" y="158" textAnchor="middle" fill="#fff" fontSize="11">插件B</text>
        <text x="486" y="112" textAnchor="middle" fill="#fff" fontSize="11">插件C</text>
        <text x="486" y="158" textAnchor="middle" fill="#fff" fontSize="11">插件D</text>
        <text x="391" y="196" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="600">只停 1 个，其他继续 ✅</text>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        粒度不匹配：想换一个组件，传统做法却要推倒整个进程
      </p>
    </div>
  );
}
