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
import { verifySession } from "@/lib/auth";

export async function SiteHeader() {
  const t = await getTranslations("Header");
  const user = await verifySession(
    (await cookies()).get("dshfind_session")?.value
  );

  const navItems = [
    { href: "/learn", label: t("nav.learn"), icon: BookOpen },
    { href: "/plugins", label: t("nav.plugins"), icon: Puzzle },
    { href: "/ranking", label: t("nav.ranking"), icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
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

        <nav className="hidden items-center gap-1 md:flex">
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

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-64 lg:block">
            <SearchBox compact />
          </div>
          <LocaleSwitcher />
          <ThemeToggle />

          {/* 开源仓库入口——原登录按钮的位置，登录改由 /login 直接访问 */}
          <Button asChild size="sm" className="rounded-lg">
            <a
              href="https://github.com/hikariming/dshfind"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon className="size-4" />
              GitHub
            </a>
          </Button>

          {user?.isMember && (
            <div className="flex items-center gap-2">
              {user.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.login}
                  className="size-7 rounded-full border border-border/60"
                />
              )}
              <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
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
        </div>
      </div>
    </header>
  );
}
