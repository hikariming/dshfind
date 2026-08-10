/**
 * Service 三角色：Service Definition / Provider / Consumer
 */
export function ServiceRoles() {
  return (
    <div className="my-8">
      <svg viewBox="0 0 520 260" className="h-auto w-full max-w-xl" role="img" aria-label="Service 三角色：定义、提供者、消费者">
        {/* 定义 */}
        <rect x="185" y="24" width="150" height="60" rx="12" fill="#4d6bfe" />
        <text x="260" y="52" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Service Definition</text>
        <text x="260" y="70" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">能力长什么样（契约）</text>

        {/* 提供者 */}
        <rect x="40" y="160" width="150" height="60" rx="12" fill="#22d3ee" />
        <text x="115" y="188" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Service Provider</text>
        <text x="115" y="206" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">谁来干活（实现）</text>

        {/* 消费者 */}
        <rect x="330" y="160" width="150" height="60" rx="12" fill="#8b5cf6" />
        <text x="405" y="188" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">Consumer</text>
        <text x="405" y="206" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10">谁在用（注入）</text>

        {/* 箭头 */}
        <path d="M190 84 C 130 110, 115 130, 115 158" fill="none" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#sr-a)" />
        <text x="112" y="122" textAnchor="middle" fill="#6e8bff" fontSize="10">实现服务</text>
        <path d="M330 84 C 390 110, 405 130, 405 158" fill="none" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#sr-a)" />
        <text x="408" y="122" textAnchor="middle" fill="#6e8bff" fontSize="10">消费服务</text>
        <path d="M190 190 h138" stroke="#6e8bff" strokeWidth="2.5" markerEnd="url(#sr-a)" />
        <text x="259" y="178" textAnchor="middle" fill="#6e8bff" fontSize="10">按定义注入 / 获取</text>

        <defs>
          <marker id="sr-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#6e8bff" />
          </marker>
        </defs>
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        三种角色分离 → 换提供者不影响消费者，能力才可替换
      </p>
    </div>
  );
}
