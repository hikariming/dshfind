import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { LogOut, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/auth";

export const metadata: Metadata = { title: "无访问权限" };

export default async function UnauthorizedPage() {
  const user = await verifySession(
    (await cookies()).get("dshfind_session")?.value
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500">
        <ShieldX className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">无访问权限</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        本站内容仅限
        <span className="mx-1 font-mono text-brand-600 dark:text-brand-300">
          dsh-external
        </span>
        组织成员查看。
        {user ? (
          <>
            你当前登录的账号是
            <span className="mx-1 font-medium">@{user.login}</span>
            ，不在该组织成员列表中。
          </>
        ) : (
          "请先登录。"
        )}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        如果你确实是组织成员，请确认 GitHub 账号已加入该组织，然后重新登录。
      </p>

      <div className="mt-8 flex items-center gap-3">
        <form action="/api/auth/logout" method="post">
          <Button variant="outline" className="rounded-xl">
            <LogOut />
            退出登录
          </Button>
        </form>
        {!user && (
          <Button asChild className="rounded-xl">
            <Link href="/login">去登录</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
