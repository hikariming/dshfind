import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { LogOut, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLocale, getTranslations } from "next-intl/server";
import { verifySession } from "@/lib/auth";
import { logoutURL } from "@/lib/auth-api";

export const metadata: Metadata = {
  title: "无访问权限",
  robots: { index: false },
};

export default async function UnauthorizedPage() {
  const t = await getTranslations("Unauthorized");
  const locale = await getLocale();
  const logoutAction = logoutURL(`/${locale}/login`);
  const user = await verifySession(
    (await cookies()).get("dshfind_session")?.value
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-500">
        <ShieldX className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {t("desc1")}
        <span className="mx-1 font-mono text-brand-600 dark:text-brand-300">
          {t("org")}
        </span>
        {t("desc2")}
        {user ? (
          <>
            {t("loggedInAs")}
            <span className="mx-1 font-medium">@{user.login}</span>
            {t("notInOrg")}
          </>
        ) : (
          t("pleaseLogin")
        )}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("hint")}
      </p>

      <div className="mt-8 flex items-center gap-3">
        {logoutAction && (
          <form action={logoutAction} method="post">
            <Button variant="outline" className="rounded-xl">
              <LogOut />
              {t("logout")}
            </Button>
          </form>
        )}
        {!user && (
          <Button asChild className="rounded-xl">
            <Link href="/login">去登录</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
