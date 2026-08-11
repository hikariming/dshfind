import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  const footerGroups = [
    {
      title: t("product"),
      links: [
        { label: t("learn"), href: "/learn" },
        { label: t("plugins"), href: "/plugins" },
        { label: t("ranking"), href: "/ranking" },
      ],
    },
    {
      title: t("resources"),
      links: [
        { label: t("cordis"), href: "/learn/cordis" },
        { label: "DSH 入门指南", href: "/learn#dsh-intro" },
        { label: t("glossary"), href: "/learn/cordis#glossary" },
      ],
    },
    {
      title: t("community"),
      links: [
        { label: t("github"), href: "https://github.com" },
        { label: t("login"), href: "/login" },
      ],
    },
  ];

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
            {t("tagline")}
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
          <p>© 2026 dshfind.com · dsh-external</p>
          <p>{t("madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}
