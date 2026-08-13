/**
 * ctx：一切能力的入口（所有服务都挂在 ctx 上）
 */
export function CtxHub() {
  const services = [
    { x: 194, y: 20, label: "ctx.llm", en: "模型调用", fill: "#8b5cf6" },
    { x: 356, y: 100, label: "ctx.tools", en: "工具注册表", fill: "#4d6bfe" },
    { x: 356, y: 240, label: "ctx.sessions", en: "会话", fill: "#22d3ee" },
    { x: 194, y: 320, label: "ctx.skills", en: "技能", fill: "#4d6bfe" },
    { x: 36, y: 240, label: "ctx.shell", en: "命令执行", fill: "#8b5cf6" },
    { x: 36, y: 100, label: "ctx.sandbox", en: "沙箱", fill: "#22d3ee" },
  ];
  const centers = [
    { x: 260, y: 60, to: [176, 74] },
    { x: 400, y: 148, to: [348, 166] },
    { x: 400, y: 280, to: [348, 262] },
    { x: 260, y: 320, to: [260, 288] },
    { x: 120, y: 280, to: [172, 262] },
    { x: 120, y: 148, to: [172, 166] },
  ];

  return (
    <div className="my-8">
      <svg viewBox="0 0 520 390" className="h-auto w-full max-w-xl" role="img" aria-label="ctx 是一切能力的入口">
        <defs>
          <linearGradient id="ch-center" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4d6bfe" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* 中心 ctx */}
        <rect x="215" y="148" width="90" height="80" rx="14" fill="url(#ch-center)" />
        <text x="260" y="188" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">ctx</text>
        <text x="260" y="208" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">一切的入口</text>

        {/* 连线 */}
        {services.map((s, i) => (
          <path
            key={s.label}
            d={`M${centers[i].to[0]} ${centers[i].to[1]} L${centers[i].to[0] < 260 ? s.x + 92 : s.x} ${centers[i].to[1]}`}
            stroke="#6e8bff"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />
        ))}

        {/* 服务 */}
        {services.map((s) => (
          <g key={s.label}>
            <rect x={s.x} y={s.y} width="92" height="44" rx="10" fill={s.fill} />
            <text x={s.x + 46} y={s.y + 22} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">{s.label}</text>
            <text x={s.x + 46} y={s.y + 37} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">{s.en}</text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        ctx.xxx 就是 DSH 的 API 面：所有能力都挂在 ctx 这个入口上
      </p>
    </div>
  );
}
