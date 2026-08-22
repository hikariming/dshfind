import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { sourceUrl, UPSTREAM_REPO } from "@/lib/docs-sections";

/**
 * 出处与许可声明栏。
 *
 * 转载/翻译 MIT 内容的合规要求就是保留出处与许可，所以这一栏是每篇文档的
 * 硬性组成部分，不是装饰。链接带 commit SHA——指向的永远是我们翻译的那一版，
 * 上游改了也不会让声明变成假话。
 */
export async function DocsAttribution({
  sourcePath,
  isTranslated,
  updatedAt,
}: {
  sourcePath: string;
  isTranslated: boolean;
  updatedAt: string;
}) {
  const t = await getTranslations("Docs");
  return (
    <aside className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      <p className="font-semibold text-amber-700 dark:text-amber-400">
        {isTranslated ? `⚠️ ${t("unofficialNotice")}` : "ℹ️"}
      </p>
      <p className="mt-1 leading-relaxed text-muted-foreground">
        {isTranslated ? t("translatedNote") : t("mirroredNote")}
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <a
          href={sourceUrl(sourcePath)}
          target="_blank"
          rel="nofollow noopener"
          className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
        >
          {t("sourceLink")}
          <ExternalLink className="size-3" />
        </a>
        <span>· {UPSTREAM_REPO}</span>
        <span>· {t("licenseNote")}</span>
        <span>
          · {t("updatedAt")} {updatedAt.slice(0, 10)}
        </span>
      </p>
    </aside>
  );
}
