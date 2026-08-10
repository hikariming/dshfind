/**
 * 工具执行流水线示意图
 */
export function ToolExecution() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 260" className="h-auto w-full max-w-xl" role="img" aria-label="工具执行流水线：模型请求、工具注册表、执行后端、结果返回">
        {/* 模型 */}
        <rect x="16" y="100" width="110" height="60" rx="12" fill="#8b5cf6" />
        <text x="71" y="127" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">模型</text>
        <text x="71" y="145" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">「调用 get_weather」</text>

        {/* 工具注册表 */}
        <rect x="176" y="100" width="120" height="60" rx="12" fill="#4d6bfe" />
        <text x="236" y="125" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">工具注册表</text>
        <text x="236" y="143" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">ctx.tools</text>

        {/* 执行后端 */}
        <rect x="346" y="100" width="158" height="60" rx="12" fill="#22d3ee" />
        <text x="425" y="120" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">执行后端</text>
        <text x="425" y="138" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">bash · pty · fs · web</text>
        <text x="425" y="154" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">（可替换的接缝）</text>

        {/* 箭头 */}
        <path d="M126 118 h48" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#te-a)" />
        <path d="M296 118 h48" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#te-a)" />
        <text x="211" y="92" textAnchor="middle" fill="#6e8bff" fontSize="11" fontWeight="600">工具调用请求</text>

        {/* 结果返回 */}
        <path d="M425 160 v26 h-354 v-26" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" markerEnd="url(#te-b)" />
        <text x="260" y="205" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="600">执行结果回到模型上下文</text>

        <defs>
          <marker id="te-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
          <marker id="te-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#10b981" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        模型只声明要什么工具，注册表调度，后端执行——每个环节都可替换
      </p>
    </div>
  );
}
