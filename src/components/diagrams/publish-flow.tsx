/**
 * 配置与发布：包 → 构建 → 发布 → 安装使用
 */
export function PublishFlow() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 220" className="h-auto w-full max-w-xl" role="img" aria-label="插件发布流程：写包、构建、发布、安装">
        {[
          { x: 16, label: "① 写包", note: "src + 配置", fill: "#22d3ee" },
          { x: 147, label: "② 构建", note: "构建产物", fill: "#4d6bfe" },
          { x: 278, label: "③ 发布", note: "npm 等注册表", fill: "#8b5cf6" },
          { x: 409, label: "④ 安装", note: "dsh plugin add", fill: "#10b981" },
        ].map((s) => (
          <g key={s.label}>
            <rect x={s.x} y="70" width="95" height="70" rx="12" fill={s.fill} />
            <text x={s.x + 47.5} y="102" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">{s.label}</text>
            <text x={s.x + 47.5} y="120" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">{s.note}</text>
          </g>
        ))}
        {[111, 242, 373].map((x) => (
          <path key={x} d={`M${x} 105 h34`} stroke="#6e8bff" strokeWidth="3" markerEnd="url(#pf-a)" />
        ))}

        <text x="260" y="185" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="600">配置：插件可按字段协调（config 变更 → 增量重载）</text>

        <defs>
          <marker id="pf-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        发布即分发：别人一条命令装上你的插件，配置变化自动协调
      </p>
    </div>
  );
}
