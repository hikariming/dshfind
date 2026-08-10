/**
 * 智能体框架五大职责示意图
 */
export function FrameworkFive() {
  const boxes = [
    { x: 194, y: 16, label: "工具", en: "Tool", fill: "#4d6bfe", cx: 240, cy: 60, line: "M240 60 V160" },
    { x: 352, y: 100, label: "权限", en: "Sandbox", fill: "#22d3ee", cx: 398, cy: 144, line: "M398 144 H300" },
    { x: 352, y: 250, label: "记忆", en: "Memory", fill: "#8b5cf6", cx: 398, cy: 294, line: "M398 294 H300" },
    { x: 194, y: 326, label: "编排", en: "Subagent", fill: "#4d6bfe", cx: 240, cy: 326, line: "M240 326 V220" },
    { x: 36, y: 175, label: "连接", en: "MCP", fill: "#22d3ee", cx: 82, cy: 197, line: "M82 197 H180" },
  ];

  return (
    <div className="my-8">
      <svg
        viewBox="0 0 520 390"
        className="h-auto w-full max-w-xl"
        role="img"
        aria-label="智能体框架五大职责：工具、权限、记忆、编排、连接"
      >
        <defs>
          <linearGradient id="ff-center" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4d6bfe" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* 连线 */}
        {boxes.map((b) => (
          <path
            key={b.label}
            d={b.line}
            stroke="#6e8bff"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        ))}

        {/* 中心 */}
        <rect x="180" y="160" width="120" height="60" rx="12" fill="url(#ff-center)" />
        <text x="240" y="188" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">
          智能体框架
        </text>
        <text x="240" y="206" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">
          管杂活 · 保安全
        </text>

        {/* 五职责 */}
        {boxes.map((b) => (
          <g key={b.label}>
            <rect x={b.x} y={b.y} width="92" height="44" rx="10" fill={b.fill} />
            <text x={b.cx} y={b.y + 22} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
              {b.label}
            </text>
            <text x={b.cx} y={b.y + 37} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">
              {b.en}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        框架 = 给「大脑」配「身体」的脚手架，五大职责各司其职
      </p>
    </div>
  );
}
