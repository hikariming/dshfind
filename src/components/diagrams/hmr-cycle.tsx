/**
 * 热模块替换（HMR）流程：改代码 → 换模块，不重启
 */
export function HmrCycle() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 240" className="h-auto w-full max-w-xl" role="img" aria-label="热模块替换流程">
        {/* 第1步 */}
        <rect x="16" y="80" width="105" height="70" rx="12" fill="#22d3ee" />
        <text x="68" y="112" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">① 模块变化</text>
        <text x="68" y="132" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">改代码保存</text>

        <path d="M121 115 h26" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#hm-a)" />

        {/* 第2步 */}
        <rect x="147" y="80" width="105" height="70" rx="12" fill="#4d6bfe" />
        <text x="199" y="106" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">② 分类</text>
        <text x="199" y="124" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">接受 / 拒绝</text>
        <text x="199" y="140" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">（依赖子图）</text>

        <path d="M252 115 h26" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#hm-a)" />

        {/* 第3步 */}
        <rect x="278" y="80" width="105" height="70" rx="12" fill="#8b5cf6" />
        <text x="330" y="106" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">③ 失效条目</text>
        <text x="330" y="124" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">依赖树可达</text>
        <text x="330" y="140" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">已变更模块</text>

        <path d="M383 115 h26" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#hm-a)" />

        {/* 第4步 */}
        <rect x="409" y="80" width="95" height="70" rx="12" fill="#10b981" />
        <text x="456" y="106" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">④ 事务性</text>
        <text x="456" y="124" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">重载（失败）</text>
        <text x="456" y="140" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">自动回滚）</text>

        <text x="260" y="200" textAnchor="middle" fill="#4d6bfe" fontSize="12" fontWeight="700">全程不重启：旧纤程释放（恢复效应），新纤程装上</text>

        <defs>
          <marker id="hm-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        分类 → 失效检测 → 事务性重载：与 Webpack/Vite 不同，无需手写接受边界
      </p>
    </div>
  );
}
