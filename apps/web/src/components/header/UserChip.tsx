import { useSessionUser } from "~/components/header/session";

/** 顶栏桌面端的登录用户块：只放一个头像，链到 /login（那里能看账号、退出）。与老站 UserChip 一致。 */
export default function UserChip({ locale, logoutLabel }: { locale: string; logoutLabel: string }) {
  const user = useSessionUser();
  if (!user) return null;
  return (
    <a href={`/${locale}/login`} aria-label={`@${user.login} · ${logoutLabel}`} title={`@${user.login}`} class="hidden shrink-0 lg:block">
      {user.avatar ? (
        <img src={user.avatar} alt="" class="size-7 rounded-full border border-border/60 transition-opacity hover:opacity-80" />
      ) : (
        <span class="flex size-7 items-center justify-center rounded-full border border-border/60 text-xs font-medium uppercase">
          {user.login.slice(0, 1)}
        </span>
      )}
    </a>
  );
}
