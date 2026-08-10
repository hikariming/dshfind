import Link from "next/link";
import { cookies } from "next/headers";
import { BookOpen, LogOut, Puzzle, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBox } from "@/components/search-box";
import { GithubIcon } from "@/components/github-icon";
import { verifySession } from "@/lib/auth";

const navItems = [
  { href: "/learn", label: "学习", icon: BookOpen },
  { href: "/plugins", label: "插件超市", icon: Puzzle },
  { href: "/ranking", label: "排名", icon: Trophy },
];

export async function SiteHeader() {
  const user = await verifySession(
    (await cookies()).get("dshfind_session")?.value
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="bg-gradient-brand flex size-7 items-center justify-center rounded-lg text-sm font-bold text-white glow-brand">
            d
          </span>
          <span className="text-base font-bold tracking-tight">
            dsh<span className="text-brand-500 dark:text-brand-300">find</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          <ThemeToggle />

          {user?.isMember ? (
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
                  aria-label="退出登录"
                  type="submit"
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild size="sm" className="rounded-lg">
              <Link href="/login">
                <GithubIcon className="size-4" />
                登录
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
