/**
 * 配置即组合：profile 叠层示意图
 */
export function ConfigLayers() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 280" className="h-auto w-full max-w-xl" role="img" aria-label="配置叠层：官方默认层、profile 插件层、用户覆盖层">
        {/* 三层 */}
        <rect x="60" y="30" width="250" height="52" rx="10" fill="#22d3ee" />
        <text x="185" y="53" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">官方默认层</text>
        <text x="185" y="70" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">内置能力包</text>

        <rect x="60" y="96" width="250" height="52" rx="10" fill="#4d6bfe" />
        <text x="185" y="119" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">profile 插件层</text>
        <text x="185" y="136" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">dsh plugin --profile tui add ...</text>

        <rect x="60" y="162" width="250" height="52" rx="10" fill="#8b5cf6" />
        <text x="185" y="185" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">用户覆盖层</text>
        <text x="185" y="202" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">$DSH_HOME/profiles/&lt;name&gt;</text>

        {/* 叠加 */}
        <path d="M310 119 h30" stroke="#6e8bff" strokeWidth="3" markerEnd="url(#cl-a)" />
        <text x="358" y="108" textAnchor="middle" fill="#6e8bff" fontSize="12" fontWeight="700">叠加</text>
        <text x="358" y="126" textAnchor="middle" fill="rgba(110,139,255,0.85)" fontSize="10">后层覆盖前层</text>

        {/* 运行时 */}
        <rect x="340" y="80" width="150" height="90" rx="14" fill="rgba(77,107,254,0.12)" stroke="#4d6bfe" strokeWidth="2.5" />
        <text x="415" y="115" textAnchor="middle" fill="#4d6bfe" fontSize="14" fontWeight="700">运行上下文</text>
        <text x="415" y="137" textAnchor="middle" fill="rgba(77,107,254,0.85)" fontSize="11">ctx（Cordis）</text>
        <text x="415" y="155" textAnchor="middle" fill="rgba(77,107,254,0.85)" fontSize="10">换模型、加工具＝改配置</text>

        <defs>
          <marker id="cl-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        配置即组合：一个 cordis.yml / profile 决定整个智能体的能力组合
      </p>
    </div>
  );
}
