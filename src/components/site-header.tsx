import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BookOpen, MessagesSquare, Puzzle, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBox } from "@/components/search-box";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { GithubIcon } from "@/components/github-icon";
import { MobileNav, type MobileNavItem } from "@/components/mobile-nav";
import { UserChip } from "@/components/user-chip";

// 登录态在客户端由 UserChip 读取（会话 cookie 由 Go API 签发）——服务端读
// cookies() 会把渲染到本组件的每个页面（即全站）拖成动态渲染，
// 这正是之前 Vercel 函数费用爆炸的根源。
export async function SiteHeader() {
  const t = await getTranslations("Header");

  // 断点定在 lg 而不是 md：md 下完整顶栏只剩 10px 余量，
  // 日/韩语标签更长（「プラグインストア」）会直接撑爆。
  // 加论坛这第 4 项时同一处又紧了一截，搜索框在 lg 下相应收窄（见下方 w-40）。
  const navItems: (MobileNavItem & { icon: typeof BookOpen })[] = [
    { id: "learn", href: "/learn", label: t("nav.learn"), icon: BookOpen },
    { id: "plugins", href: "/plugins", label: t("nav.plugins"), icon: Puzzle },
    { id: "ranking", href: "/ranking", label: t("nav.ranking"), icon: Trophy },
    { id: "bbs", href: "/bbs", label: t("nav.bbs"), icon: MessagesSquare },
  ];

  // header 的 sticky 本身就是定位元素，窄屏抽屉的 absolute 直接锚在它上面
  // （不能锚视口：backdrop-blur 会截胡 fixed，详见 mobile-nav.tsx）
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/brand/dshfind-whale.png"
            alt=""
            width={32}
            height={32}
            className="size-8 object-contain"
            priority
          />
          <span className="text-base font-bold tracking-tight">
            dsh<span className="text-brand-500 dark:text-brand-300">find</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden lg:block lg:w-40 xl:w-64">
            <SearchBox compact />
          </div>
          <div className="hidden lg:block">
            <LocaleSwitcher />
          </div>
          <ThemeToggle />

          {/* 开源仓库入口——原登录按钮的位置，登录改由 /login 直接访问 */}
          <Button asChild size="sm" className="rounded-lg">
            <a
              href="https://github.com/hikariming/dshfind"
              target="_blank"
              rel="noopener"
              aria-label="GitHub"
            >
              <GithubIcon className="size-4" />
              {/* 窄屏只留图标，文字省下的 50px 留给汉堡按钮 */}
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>

          <UserChip />

          <MobileNav
            items={navItems.map(({ id, href, label }) => ({ id, href, label }))}
          />
        </div>
      </div>
    </header>
  );
}
