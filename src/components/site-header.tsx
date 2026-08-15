import { Link } from "@/i18n/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BookOpen, LogOut, Puzzle, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBox } from "@/components/search-box";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { GithubIcon } from "@/components/github-icon";
import { MobileNav, type MobileNavItem } from "@/components/mobile-nav";
import { verifySession } from "@/lib/auth";

export async function SiteHeader() {
  const t = await getTranslations("Header");
  const user = await verifySession(
    (await cookies()).get("dshfind_session")?.value
  );

  // 断点定在 lg 而不是 md：md 下完整顶栏只剩 10px 余量，
  // 日/韩语标签更长（「プラグインストア」）会直接撑爆。
  const navItems: (MobileNavItem & { icon: typeof BookOpen })[] = [
    { id: "learn", href: "/learn", label: t("nav.learn"), icon: BookOpen },
    { id: "plugins", href: "/plugins", label: t("nav.plugins"), icon: Puzzle },
    { id: "ranking", href: "/ranking", label: t("nav.ranking"), icon: Trophy },
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
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden w-48 lg:block xl:w-64">
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

          {user?.isMember && (
            <div className="hidden items-center gap-2 lg:flex">
              {user.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.login}
                  className="size-7 rounded-full border border-border/60"
                />
              )}
              <span className="hidden max-w-28 truncate text-sm font-medium xl:inline">
                {user.login}
              </span>
              <form action="/api/auth/logout" method="post">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("logout")}
                  type="submit"
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
            </div>
          )}

          <MobileNav
            items={navItems.map(({ id, href, label }) => ({ id, href, label }))}
            user={user}
          />
        </div>
      </div>
    </header>
  );
}
