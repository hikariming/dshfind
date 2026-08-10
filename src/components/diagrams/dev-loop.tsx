/**
 * 插件开发循环：写代码 → 注册 → 加载 → 运行/调试 → 热更新
 */
export function DevLoop() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 240" className="h-auto w-full max-w-xl" role="img" aria-label="插件开发循环">
        {[
          { x: 16, label: "① 写代码", note: "inject / apply / ctx.use", fill: "#22d3ee" },
          { x: 147, label: "② 注册", note: "cordis.yml / profile", fill: "#4d6bfe" },
          { x: 278, label: "③ 加载运行", note: "dsh 启动即生效", fill: "#8b5cf6" },
          { x: 409, label: "④ 调试", note: "日志 / 事件", fill: "#10b981" },
        ].map((s) => (
          <g key={s.label}>
            <rect x={s.x} y="80" width="95" height="70" rx="12" fill={s.fill} />
            <text x={s.x + 47.5} y="112" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">{s.label}</text>
            <text x={s.x + 47.5} y="130" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">{s.note}</text>
          </g>
        ))}
        {[111, 242, 373].map((x) => (
          <path key={x} d={`M${x} 115 h34`} stroke="#6e8bff" strokeWidth="3" markerEnd="url(#dl-a)" />
        ))}
        <text x="260" y="205" textAnchor="middle" fill="#6e8bff" fontSize="12" fontWeight="600">改代码 → 热模块替换，无需重启</text>

        <defs>
          <marker id="dl-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        写插件 = 声明「需要什么 / 贡献什么」，注册即加载，加载即生效
      </p>
    </div>
  );
}
