/**
 * DSH 前端架构：浏览器侧 client 插件 ⇄ RPC ⇄ 宿主侧
 */
export function WebUi() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 300" className="h-auto w-full max-w-xl" role="img" aria-label="DSH 前端架构：浏览器侧与宿主侧通过 RPC 通信">
        {/* 浏览器侧大框 */}
        <rect x="16" y="30" width="230" height="230" rx="14" fill="rgba(34,211,238,0.06)" stroke="#22d3ee" strokeWidth="2" />
        <text x="131" y="52" textAnchor="middle" fill="#22d3ee" fontSize="13" fontWeight="700">浏览器侧（packages/client）</text>

        {/* shell */}
        <rect x="36" y="70" width="90" height="40" rx="8" fill="#4d6bfe" />
        <text x="81" y="94" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">web shell</text>

        {/* runtime */}
        <rect x="136" y="70" width="90" height="40" rx="8" fill="#4d6bfe" />
        <text x="181" y="94" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">client runtime</text>

        {/* connection */}
        <rect x="36" y="130" width="190" height="44" rx="8" fill="#8b5cf6" />
        <text x="131" y="150" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">connection（RPC + 事件）</text>
        <text x="131" y="166" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">浏览器 ⇄ 宿主通信</text>

        {/* UI 插件 */}
        <rect x="36" y="196" width="190" height="48" rx="8" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeOpacity="0.5" />
        <text x="131" y="216" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="700">UI 插件（一切皆插件）</text>
        <text x="131" y="234" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="9">ui-conversation · ui-tool · ui-sidebar</text>

        {/* 宿主侧 */}
        <rect x="290" y="30" width="214" height="230" rx="14" fill="rgba(77,107,254,0.06)" stroke="#4d6bfe" strokeWidth="2" />
        <text x="397" y="52" textAnchor="middle" fill="#4d6bfe" fontSize="13" fontWeight="700">宿主侧（packages/host）</text>

        <rect x="310" y="70" width="174" height="40" rx="8" fill="#22d3ee" />
        <text x="397" y="94" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">ctx.agents 驱动</text>

        <rect x="310" y="130" width="174" height="44" rx="8" fill="#22d3ee" />
        <text x="397" y="150" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">session/event 事件流</text>
        <text x="397" y="166" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">权威日志 = UI 数据源</text>

        <rect x="310" y="196" width="174" height="48" rx="8" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeOpacity="0.5" />
        <text x="397" y="216" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">Chat 节点 · Plan 模式</text>
        <text x="397" y="234" textAnchor="middle" fill="rgba(245,158,11,0.9)" fontSize="9">ConversationNodeDefinition</text>

        {/* 中间 RPC */}
        <path d="M226 152 h64" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#wu-a)" />
        <path d="M290 170 h-64" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#wu-a)" />
        <text x="258" y="136" textAnchor="middle" fill="#6e8bff" fontSize="11" fontWeight="700">RPC</text>

        <defs>
          <marker id="wu-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        UI 本身也是 Cordis 插件：事件流驱动渲染，前端插件还能热更新
      </p>
    </div>
  );
}
