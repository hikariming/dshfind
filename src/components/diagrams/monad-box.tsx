/**
 * 单子 = 盒子的示意图
 */
export function MonadBox() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 300" className="h-auto w-full max-w-xl" role="img" aria-label="单子盒子：把值装进盒子，只能通过窗户操作">
        {/* 盒子 */}
        <rect x="170" y="60" width="180" height="120" rx="14" fill="#4d6bfe" />
        <rect x="170" y="60" width="180" height="120" rx="14" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="6 5" />
        <text x="260" y="125" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">值</text>
        <text x="260" y="150" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11">（可能为空 / 可能还没到）</text>

        {/* 装值 */}
        <rect x="20" y="90" width="110" height="44" rx="10" fill="#22d3ee" />
        <text x="75" y="117" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Just(x) / resolve</text>
        <path d="M130 112 h38" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#mb-a)" />

        {/* 取值 */}
        <path d="M352 112 h38" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#mb-a)" />
        <rect x="390" y="90" width="110" height="44" rx="10" fill="#8b5cf6" />
        <text x="445" y="112" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">map / flatMap</text>
        <text x="445" y="127" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">在盒子里操作</text>

        <defs>
          <marker id="mb-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>

        {/* 底部提示 */}
        <text x="260" y="225" textAnchor="middle" fill="#6e8bff" fontSize="12" fontWeight="600">规则：不能直接把值抠出来</text>
        <text x="260" y="245" textAnchor="middle" fill="rgba(110,139,255,0.8)" fontSize="11">Promise 就是这种盒子</text>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        η 装值、μ 压平——盒子的规矩让副作用显式、可控、可组合
      </p>
    </div>
  );
}
