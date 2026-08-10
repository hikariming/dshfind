/**
 * 智能体主循环示意图：感知 → 思考 → 行动 → 观察
 */
export function AgentLoop() {
  return (
    <div className="my-8">
      <svg
        viewBox="0 0 480 300"
        className="h-auto w-full max-w-xl"
        role="img"
        aria-label="智能体主循环：感知、思考、行动、观察"
      >
        <defs>
          <marker
            id="al-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#8b5cf6" />
          </marker>
        </defs>

        {/* 节点 */}
        <rect x="40" y="40" width="96" height="56" rx="10" fill="#4d6bfe" />
        <text x="88" y="66" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
          感知
        </text>
        <text x="88" y="83" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">
          观察输入
        </text>

        <rect x="344" y="40" width="96" height="56" rx="10" fill="#4d6bfe" />
        <text x="392" y="66" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
          思考
        </text>
        <text x="392" y="83" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">
          决定动作
        </text>

        <rect x="344" y="200" width="96" height="56" rx="10" fill="#8b5cf6" />
        <text x="392" y="226" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
          行动
        </text>
        <text x="392" y="243" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">
          调用工具
        </text>

        <rect x="40" y="200" width="96" height="56" rx="10" fill="#8b5cf6" />
        <text x="88" y="226" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
          观察
        </text>
        <text x="88" y="243" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">
          获取结果
        </text>

        {/* 箭头 */}
        <path d="M136 68 H344" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#al-arrow)" />
        <path d="M392 96 V200" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#al-arrow)" />
        <path d="M344 228 H136" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#al-arrow)" />
        <path d="M88 200 V96" stroke="#8b5cf6" strokeWidth="2.5" markerEnd="url(#al-arrow)" />

        {/* 中心 */}
        <text x="240" y="152" textAnchor="middle" fill="#6e8bff" fontSize="14" fontWeight="600">
          智能体主循环
        </text>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        循环本身很简单——难的是让「行动」安全、可控地发生
      </p>
    </div>
  );
}
