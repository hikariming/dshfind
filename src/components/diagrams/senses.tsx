/**
 * 智能体的「感官」：技能、搜索、代码语义、工作区、上下文
 */
export function Senses() {
  const senses = [
    { x: 194, y: 16, label: "技能", en: "skill", fill: "#4d6bfe", cx: 240, cy: 60, line: "M240 60 V140" },
    { x: 352, y: 100, label: "搜索", en: "web", fill: "#22d3ee", cx: 398, cy: 144, line: "M398 144 H300" },
    { x: 352, y: 240, label: "代码语义", en: "lsp", fill: "#8b5cf6", cx: 398, cy: 284, line: "M398 284 H300" },
    { x: 194, y: 320, label: "工作区", en: "workspace", fill: "#4d6bfe", cx: 240, cy: 320, line: "M240 320 V220" },
    { x: 36, y: 170, label: "上下文", en: "context", fill: "#22d3ee", cx: 82, cy: 192, line: "M82 192 H180" },
  ];

  return (
    <div className="my-8">
      <svg viewBox="0 0 520 380" className="h-auto w-full max-w-xl" role="img" aria-label="智能体的感官：技能、搜索、代码语义、工作区、上下文">
        <defs>
          <linearGradient id="se-center" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4d6bfe" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {senses.map((s) => (
          <path key={s.label} d={s.line} stroke="#6e8bff" strokeWidth="2" strokeDasharray="5 4" />
        ))}

        <rect x="180" y="160" width="120" height="60" rx="12" fill="url(#se-center)" />
        <text x="240" y="188" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">智能体</text>
        <text x="240" y="206" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">大脑 + 身体</text>

        {senses.map((s) => (
          <g key={s.label}>
            <rect x={s.x} y={s.y} width="92" height="44" rx="10" fill={s.fill} />
            <text x={s.cx} y={s.y + 22} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{s.label}</text>
            <text x={s.cx} y={s.y + 37} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">{s.en}</text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        感官接缝：技能渐进披露、Web 搜索、LSP 语义、工作区与上下文压缩
      </p>
    </div>
  );
}
