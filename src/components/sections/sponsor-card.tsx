import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Sparkle } from "lucide-react";

type SponsorItem = { name: string; tagline: string };

// 赞助商卡片：挂在首页 hero 右侧留白处。
// 名称/简介走 i18n（Sponsors.items，按顺序对应 SPONSOR_META 里的链接和 logo）。
// 外链统一新窗口打开并带 rel="sponsored"。
const SPONSOR_META: { href: string; logo: string; tile?: string }[] = [
  { href: "https://rong-ai.com/", logo: "/sponsors/rong.png" },
  // OpenModel 的 logo 是透明底黑色图形，垫一层白底保证暗色主题下可读
  { href: "https://www.openmodel.ai/zh", logo: "/sponsors/openmodel.png", tile: "bg-white" },
];

export async function SponsorCard() {
  const t = await getTranslations("Sponsors");
  const items = t.raw("items") as SponsorItem[];

  return (
    <aside className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm sm:p-5">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <span className="text-xs text-muted-foreground">{t("subtitle")}</span>
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item, i) => {
          const meta = SPONSOR_META[i];
          if (!meta) return null;
          return (
            <li key={item.name}>
              <a
                href={meta.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 transition-colors hover:border-brand-500/40 hover:bg-accent/50"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ${meta.tile ?? ""}`}
                >
                  <Image
                    src={meta.logo}
                    alt={item.name}
                    width={36}
                    height={36}
                    className="size-full object-contain"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.tagline}
                  </span>
                </span>
                <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </a>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <Sparkle className="size-3.5 shrink-0 text-brand-500" />
        {t("footer")}
      </p>
    </aside>
  );
}
