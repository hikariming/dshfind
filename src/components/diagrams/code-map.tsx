/**
 * DSH 项目结构（monorepo）代码地图
 */
export function CodeMap() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 320" className="h-auto w-full max-w-xl" role="img" aria-label="DSH 项目结构：apps、packages、docs">
        {/* 根 */}
        <rect x="205" y="20" width="110" height="40" rx="10" fill="#4d6bfe" />
        <text x="260" y="45" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">仓库根</text>

        {/* 分支线 */}
        <path d="M260 60 v20" stroke="#6e8bff" strokeWidth="2" />
        <path d="M90 80 h340" stroke="#6e8bff" strokeWidth="2" />
        <path d="M90 80 v20 M260 80 v20 M430 80 v20" stroke="#6e8bff" strokeWidth="2" />

        {/* apps */}
        <rect x="40" y="100" width="100" height="36" rx="8" fill="#22d3ee" />
        <text x="90" y="123" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">apps/ 入口</text>
        <text x="90" y="158" textAnchor="middle" fill="rgba(34,211,238,0.9)" fontSize="10">cli · web · acp</text>

        {/* packages 主干 */}
        <rect x="210" y="100" width="100" height="36" rx="8" fill="#8b5cf6" />
        <text x="260" y="123" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">packages/</text>
        <text x="260" y="158" textAnchor="middle" fill="rgba(139,92,246,0.9)" fontSize="10">全部能力家族</text>

        {/* docs */}
        <rect x="380" y="100" width="100" height="36" rx="8" fill="#f59e0b" />
        <text x="430" y="123" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">docs/ 文档</text>
        <text x="430" y="158" textAnchor="middle" fill="rgba(245,158,11,0.9)" fontSize="10">架构·教程·指南</text>

        {/* core 子包 */}
        <rect x="120" y="200" width="130" height="52" rx="10" fill="#4d6bfe" />
        <text x="185" y="222" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">core/ 核心</text>
        <text x="185" y="240" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">agent · session</text>
        <text x="185" y="254" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">tools · system-prompt</text>

        {/* 能力家族 */}
        <rect x="270" y="200" width="230" height="52" rx="10" fill="#22d3ee" />
        <text x="385" y="222" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">能力家族（接缝）</text>
        <text x="385" y="240" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">bash · sandbox · skill · web · lsp</text>
        <text x="385" y="254" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">subagent · workflow · session-query</text>

        <path d="M185 136 v64" stroke="#6e8bff" strokeWidth="1.8" markerEnd="url(#cm-a)" />
        <path d="M290 136 v64" stroke="#6e8bff" strokeWidth="1.8" markerEnd="url(#cm-a)" />

        {/* 底部 */}
        <text x="260" y="292" textAnchor="middle" fill="#6e8bff" fontSize="12" fontWeight="600">想找什么能力 → 找对应 packages/xxx</text>
        <text x="260" y="310" textAnchor="middle" fill="rgba(110,139,255,0.8)" fontSize="11">每个包都是独立可替换的插件</text>

        <defs>
          <marker id="cm-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        apps 是入口，packages/core 是默认流程，其余全是可替换的能力插件
      </p>
    </div>
  );
}
