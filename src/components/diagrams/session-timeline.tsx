/**
 * 会话-轮次-步骤：事件溯源时间线示意图
 */
export function SessionTimeline() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 250" className="h-auto w-full max-w-xl" role="img" aria-label="会话时间线：会话由轮次组成，轮次由步骤组成">
        {/* 会话长条 */}
        <rect x="20" y="30" width="480" height="60" rx="12" fill="rgba(77,107,254,0.1)" stroke="#4d6bfe" strokeWidth="2" />
        <text x="260" y="52" textAnchor="middle" fill="#4d6bfe" fontSize="13" fontWeight="700">会话（append-only 事件流 · 权威日志）</text>
        <text x="260" y="72" textAnchor="middle" fill="rgba(77,107,254,0.8)" fontSize="10">模型可见 ⟺ 已记录：可恢复、可 fork、可回放</text>

        {/* 轮次1 */}
        <rect x="50" y="110" width="190" height="52" rx="10" fill="#22d3ee" />
        <text x="145" y="133" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">轮次 1</text>
        <text x="145" y="150" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">领取一条消息</text>

        {/* 轮次2 */}
        <rect x="280" y="110" width="190" height="52" rx="10" fill="#22d3ee" />
        <text x="375" y="133" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">轮次 2</text>
        <text x="375" y="150" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">领取下一条消息</text>

        {/* 轮次内的步骤 */}
        <rect x="50" y="186" width="56" height="34" rx="8" fill="#4d6bfe" />
        <text x="78" y="208" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">步骤1</text>
        <rect x="116" y="186" width="56" height="34" rx="8" fill="#4d6bfe" />
        <text x="144" y="208" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">步骤2</text>
        <rect x="182" y="186" width="56" height="34" rx="8" fill="#8b5cf6" />
        <text x="210" y="208" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">步骤3</text>

        <rect x="280" y="186" width="56" height="34" rx="8" fill="#4d6bfe" />
        <text x="308" y="208" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">步骤1</text>
        <rect x="346" y="186" width="56" height="34" rx="8" fill="#8b5cf6" />
        <text x="374" y="208" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">步骤2</text>

        <text x="120" y="240" textAnchor="middle" fill="#6e8bff" fontSize="11">每个步骤 = 一次模型请求 + 它的工具</text>
        <text x="375" y="240" textAnchor="middle" fill="rgba(110,139,255,0.8)" fontSize="10">…</text>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        会话 → 轮次 → 步骤：事件全都追加进日志，从任意检查点都能重建
      </p>
    </div>
  );
}
