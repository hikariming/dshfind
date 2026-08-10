/**
 * 插件/包解剖：组件定义 → ctx.use → fiber
 */
export function PluginAnatomy() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 260" className="h-auto w-full max-w-xl" role="img" aria-label="插件解剖：组件 = 依赖声明 + 效应函数，ctx.use 实例化为 fiber">
        {/* 组件定义 */}
        <rect x="16" y="40" width="170" height="160" rx="14" fill="rgba(77,107,254,0.08)" stroke="#4d6bfe" strokeWidth="2" />
        <text x="101" y="66" textAnchor="middle" fill="#4d6bfe" fontSize="13" fontWeight="700">组件定义</text>

        {/* inject */}
        <rect x="34" y="86" width="134" height="46" rx="10" fill="#22d3ee" />
        <text x="101" y="106" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">inject（我需要）</text>
        <text x="101" y="122" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">依赖声明 d</text>

        {/* apply */}
        <rect x="34" y="142" width="134" height="46" rx="10" fill="#8b5cf6" />
        <text x="101" y="162" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">apply（我贡献）</text>
        <text x="101" y="178" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9">效应函数 e</text>

        {/* ctx.use */}
        <path d="M186 120 h40" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#pa-a)" />
        <rect x="226" y="96" width="100" height="48" rx="12" fill="#4d6bfe" />
        <text x="276" y="118" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">ctx.use</text>
        <text x="276" y="135" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">实例化</text>

        {/* fiber */}
        <path d="M326 120 h40" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#pa-a)" />
        <rect x="366" y="60" width="138" height="120" rx="14" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="2" />
        <text x="435" y="84" textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="700">fiber（运行时）</text>
        <text x="435" y="106" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="10">parent / ctx（子上下文）</text>
        <text x="435" y="124" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="10">epoch（目标状态版本）</text>
        <text x="435" y="142" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="10">dispose（累积逆函数）</text>
        <text x="435" y="160" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="10">inertia（迁移句柄）</text>

        <defs>
          <marker id="pa-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        组件 = 声明我需要什么 + 贡献什么；ctx.use 把它变成带生命周期的 fiber
      </p>
    </div>
  );
}
