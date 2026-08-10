/**
 * 自我演化循环：检查运行时 → 生成插件 → 挂载 → 运行 → 反馈 → 替换/卸载
 */
export function SelfEvolution() {
  const nodes = [
    { x: 40, y: 40, w: 110, h: 52, label: "检查运行时", en: "自指工具", fill: "#22d3ee", cx: 95, cy: 66 },
    { x: 370, y: 40, w: 110, h: 52, label: "生成新插件", en: "自己写代码", fill: "#4d6bfe", cx: 425, cy: 66 },
    { x: 370, y: 200, w: 110, h: 52, label: "挂载到运行中", en: "装上", fill: "#8b5cf6", cx: 425, cy: 226 },
    { x: 40, y: 200, w: 110, h: 52, label: "运行 & 反馈", en: "不好用就换", fill: "#10b981", cx: 95, cy: 226 },
  ];

  return (
    <div className="my-8">
      <svg viewBox="0 0 520 300" className="h-auto w-full max-w-xl" role="img" aria-label="自我演化循环：检查、生成、挂载、运行反馈">
        <defs>
          <marker id="se-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>

        {nodes.map((n) => (
          <g key={n.label}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10" fill={n.fill} />
            <text x={n.cx} y={n.cy + 2} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{n.label}</text>
            <text x={n.cx} y={n.cy + 19} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">{n.en}</text>
          </g>
        ))}

        {/* 箭头：顺时针 */}
        <path d="M150 66 h220" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#se-a)" />
        <path d="M425 92 v108" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#se-a)" />
        <path d="M370 226 h-220" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#se-a)" />
        <path d="M95 200 v-108" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#se-a)" />

        {/* 中心 */}
        <text x="260" y="150" textAnchor="middle" fill="#6e8bff" fontSize="13" fontWeight="700">自我演化循环</text>
        <text x="260" y="170" textAnchor="middle" fill="rgba(110,139,255,0.85)" fontSize="11">动态组合保证：装上能拆、拆下无痕</text>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        运行中的智能体自己改造自己——自指 Cordis 工具 + 时空可组合性
      </p>
    </div>
  );
}
