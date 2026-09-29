import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadmeCollapse } from "@/components/readme-collapse";
import type { PluginReadme } from "@/lib/plugin-readme";

/**
 * 详情页的 README 区块。内容由同步脚本渲染、净化后入库（scripts/lib/readme-render.mjs），
 * 这里只负责套框、折叠与「去 GitHub 看全文」的出口。
 */
export async function PluginReadmeCard({
  readme,
  fullName,
}: {
  readme: PluginReadme;
  fullName: string;
}) {
  const t = await getTranslations("Plugins");
  const githubUrl = `https://github.com/${fullName}${readme.path ? `/blob/HEAD/${readme.path}` : "#readme"}`;
  const date = readme.fetchedAt.slice(0, 10);

  return (
    <Card className="mt-5">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <CardTitle className="text-base">{t("readmeTitle")}</CardTitle>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            GitHub
            <ExternalLink className="size-3" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">{t("readmeSource", { date })}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {readme.status === "ok" && readme.html ? (
          <ReadmeCollapse
            html={readme.html}
            expandLabel={t("readmeExpand")}
            collapseLabel={t("readmeCollapse")}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t("readmeTooLarge")}</p>
        )}
        {(readme.truncated || readme.status === "too_large") && (
          <p className="text-sm text-muted-foreground">
            {readme.status === "ok" && `${t("readmeTruncated")} `}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline underline-offset-2 hover:no-underline dark:text-brand-300"
            >
              {t("readmeViewOnGithub")}
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
