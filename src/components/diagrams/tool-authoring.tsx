/**
 * 写一个工具：schema + 执行函数 → 注册 → 模型调用
 */
export function ToolAuthoring() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 240" className="h-auto w-full max-w-xl" role="img" aria-label="写工具的四个步骤">
        {/* 工具定义 */}
        <rect x="16" y="60" width="140" height="110" rx="12" fill="rgba(77,107,254,0.08)" stroke="#4d6bfe" strokeWidth="2" />
        <text x="86" y="84" textAnchor="middle" fill="#4d6bfe" fontSize="12" fontWeight="700">工具定义</text>
        <text x="86" y="106" textAnchor="middle" fill="rgba(77,107,254,0.9)" fontSize="10">name / description</text>
        <text x="86" y="122" textAnchor="middle" fill="rgba(77,107,254,0.9)" fontSize="10">parameters（schema）</text>
        <text x="86" y="142" textAnchor="middle" fill="rgba(77,107,254,0.9)" fontSize="10">＋执行函数</text>

        {/* 注册 */}
        <path d="M156 108 h36" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#ta-a)" />
        <rect x="192" y="78" width="120" height="60" rx="12" fill="#4d6bfe" />
        <text x="252" y="106" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">注册</text>
        <text x="252" y="124" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">ctx.tools.register</text>

        {/* 模型调用 */}
        <path d="M312 108 h36" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#ta-a)" />
        <rect x="348" y="78" width="156" height="60" rx="12" fill="#8b5cf6" />
        <text x="426" y="102" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">模型调用</text>
        <text x="426" y="120" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">schema 进提示词组装</text>
        <text x="426" y="136" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">调用时执行你的函数</text>

        <text x="260" y="205" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="600">工具 = 给模型的一份「说明书」+ 一份「实现」</text>

        <defs>
          <marker id="ta-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        注册到 ctx.tools，schema 自动进入提示词，模型就能调用它
      </p>
    </div>
  );
}
