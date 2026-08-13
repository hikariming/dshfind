import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

// 赞助商横幅：置于 SiteHeader 之上，全站每页可见。
// rel 带 sponsored：付费/赞助外链的规范写法，避免被当成自然外链。
export async function SponsorBanner() {
  const t = await getTranslations("Sponsor");

  return (
    <div className="border-b border-border/60 bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent">
      <a
        href="https://lobehub.com"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group mx-auto flex w-full max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-xs sm:gap-2.5 sm:px-6"
      >
        <span className="shrink-0 rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
          {t("label")}
        </span>

        <Image
          src="/lobehub.png"
          alt="LobeHub"
          width={96}
          height={96}
          className="size-5 shrink-0"
        />

        <span className="shrink-0 font-semibold text-foreground">
          {t("name")}
        </span>

        <span className="hidden truncate text-muted-foreground md:inline">
          <span aria-hidden="true" className="mr-2 text-border">|</span>
          {t("tagline")}
        </span>

        <span className="flex shrink-0 items-center gap-0.5 font-medium text-brand-600 transition-colors group-hover:text-brand-500 dark:text-brand-400 dark:group-hover:text-brand-300">
          {t("cta")}
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </a>
    </div>
  );
}
