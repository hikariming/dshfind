import Link from "next/link";

const footerGroups = [
  {
    title: "产品",
    links: [
      { label: "学习", href: "/learn" },
      { label: "插件超市", href: "/plugins" },
      { label: "用户排名", href: "/ranking" },
    ],
  },
  {
    title: "资源",
    links: [
      { label: "Cordis 论文精读", href: "/learn/cordis" },
      { label: "DSH 入门指南", href: "/learn#dsh-intro" },
      { label: "术语表", href: "/learn/cordis#glossary" },
    ],
  },
  {
    title: "社区",
    links: [
      { label: "GitHub", href: "https://github.com" },
      { label: "登录", href: "/login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gradient-brand flex size-7 items-center justify-center rounded-lg text-sm font-bold text-white">
              d
            </span>
            <span className="text-base font-bold tracking-tight">
              dsh<span className="text-brand-500 dark:text-brand-300">find</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            面向 DeepSeek Harness 的学习与分享社区：论文精读、插件生态、用户共创，
            一起探索时空可组合性编程范式。
          </p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold">{group.title}</h3>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© 2026 dshfind.com · 网站内容均为 mock 演示数据</p>
          <p>Made with DeepSeek Blue 💙</p>
        </div>
      </div>
    </footer>
  );
}
