import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FolderGit2,
  Star,
  Users,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "@/components/score-badge";
import {
  getPluginEditorial,
  localizePluginDescription,
} from "@/lib/plugin-i18n";
import { getPluginDetail } from "@/lib/plugins-db";
import { isLocale, type Locale } from "@/i18n/config";
import { pageAlternates, SITE_URL } from "@/lib/site";
import { ShareCardBox } from "@/components/share-card-box";

type Params = Promise<{ locale: string; owner: string; repo: string }>;

function day(iso: string) {
  return iso ? iso.slice(0, 10) : "-";
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, owner, repo } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const plugin = await getPluginDetail(`${owner}/${repo}`);
  if (!plugin) return { title: t("notFoundTitle"), robots: { index: false } };

  const title = t("pluginDetailTitle", { name: plugin.name });
  const description =
    localizePluginDescription(plugin.fullName, locale, plugin.description) ||
    t("pluginDetailFallbackDescription", {
      name: plugin.name,
      owner: plugin.owner,
    });
  return {
    title,
    description,
    alternates: isLocale(locale)
      ? pageAlternates(locale, `/plugins/${plugin.fullName}`)
      : undefined,
    openGraph: { title, description },
  };
}

export default async function PluginDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locale, owner, repo } = await params;
  const plugin = await getPluginDetail(`${owner}/${repo}`);
  if (!plugin) notFound();

  const t = await getTranslations("Plugins");
  // 文案取用顺序：Turso 实时 → 构建期生成物 → GitHub 原文
  const editorial = getPluginEditorial(plugin.fullName);
  const loc = locale as Locale;
  const live = plugin.i18n[loc];
  const intro = live?.intro ?? editorial?.intro?.[loc];
  const highlights = live?.highlights ?? editorial?.highlights?.[loc];
  // 安装命令三个来源，优先级递减：运营人工核对 → 构建期生成物 → 按 package.json/npm 推导。
  // 都没有时不再拿 fullName 硬拼 `github:` —— 仓库名不足以推出安装方式，编出来的命令
  // 对索引仓库、非组合包、未构建的 TS 包一律是错的（判定见 scripts/lib/install.mjs）。
  const curatedCmd = plugin.installCmd ?? editorial?.installCmd ?? null;
  const installCmd = curatedCmd ?? plugin.installCmdAuto;
  const installKind = curatedCmd ? "curated" : plugin.installKind;
  const description =
    live?.description ??
    localizePluginDescription(plugin.fullName, locale, plugin.description);

  const ai = plugin.scoreDetail?.ai;
  const parts = plugin.scoreDetail?.parts;
  const pinned = Boolean(plugin.scoreDetail?.pinned || parts?.pinned);
  // 分项满分随生态年龄浮动，展示时用入库快照里的权重；没有就按当前早期权重兜底
  const dims: { key: string; max: number }[] = [
    { key: "activity", max: 45 },
    { key: "star", max: 30 },
    { key: "engineering", max: 25 },
    { key: "maintainer", max: 20 },
  ];

  // 结构化数据：把插件页标记成开源仓库，利于搜索结果展示
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: plugin.name,
    description: description || undefined,
    codeRepository: plugin.url,
    programmingLanguage: plugin.language || undefined,
    keywords: ["DeepSeek Harness plugin", "dsh-plugin", ...plugin.tags].join(", "),
    author: {
      "@type": "Person",
      name: plugin.owner,
      url: `https://github.com/${plugin.owner}`,
    },
    dateModified: plugin.pushedAt || undefined,
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-lg text-muted-foreground">
        <Link href="/plugins">
          <ArrowLeft />
          {t("backToList")}
        </Link>
      </Button>

      {/* 头部 */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2.5 font-mono text-2xl font-bold break-all sm:text-3xl">
            {plugin.name}
            <ScoreBadge score={plugin.score} />
          </h1>
          <a
            href={`https://github.com/${plugin.owner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            @{plugin.owner}
          </a>
        </div>
        <Button asChild className="rounded-lg">
          <a href={plugin.url} target="_blank" rel="noopener noreferrer">
            <FolderGit2 />
            {t("viewRepo")}
          </a>
        </Button>
      </div>

      {/* 徽标 + 分类 */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {plugin.isOfficial && (
          <Badge className="bg-sky-600 text-white dark:bg-sky-500">
            🏛 {t("official")}
          </Badge>
        )}
        {plugin.isFeatured && (
          <Badge className="bg-gradient-brand text-white">✨ {t("featured")}</Badge>
        )}
        {plugin.isInsider && <Badge variant="secondary">{t("insider")}</Badge>}
        {plugin.archived && <Badge variant="outline">{t("archived")}</Badge>}
        {plugin.category && (
          <Link href={`/plugins?category=${plugin.category}`}>
            <Badge variant="outline" className="hover:border-brand-500/60">
              {t(`categories.${plugin.category}`)}
            </Badge>
          </Link>
        )}
      </div>

      <p className="mt-4 max-w-[70ch] leading-relaxed text-muted-foreground">
        {description || t("noDesc")}
      </p>

      {/* 指标 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="size-3.5" />
            Star
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums">
            {plugin.stars.toLocaleString("en-US")}
            {plugin.starGrowth > 0 && (
              <span className="ml-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                +{plugin.starGrowth.toLocaleString("en-US")}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">{t("weeklyGrowth")}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {t("contributors")}
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums">
            {plugin.contributors == null
              ? "-"
              : plugin.contributors.toLocaleString("en-US")}
            {plugin.contributorGrowth != null && plugin.contributorGrowth > 0 && (
              <span className="ml-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                +{plugin.contributorGrowth}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="text-xs text-muted-foreground">{t("language")}</div>
          <div className="mt-1 text-xl font-bold">{plugin.language || "-"}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            {t("updated")}
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums">
            {day(plugin.pushedAt)}
          </div>
        </div>
      </div>

      {/* 安装：命令来源与可装性都据实标注，装不了的仓库不给命令 */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              {installKind === "not-installable"
                ? t("installNoneTitle")
                : installKind === "build-required"
                  ? t("installBuildTitle")
                  : t("detailInstall")}
            </CardTitle>
            {(installKind === "curated" ||
              installKind === "release" ||
              installKind === "npm" ||
              installKind === "git") && (
              <Badge
                variant="outline"
                className="text-[11px] font-normal text-muted-foreground"
              >
                {installKind === "curated"
                  ? t("installVerified")
                  : t("installDerived")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {installKind === "not-installable" && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {plugin.pkgName
                ? t("installNoneBundle")
                : t("installNoneManifest")}{" "}
              {t("installNoneHint")}
            </p>
          )}
          {installKind === "build-required" && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("installBuildNote")}
            </p>
          )}
          {installKind == null && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("installUnknown")}
            </p>
          )}

          {installCmd && (
            <pre className="overflow-x-auto rounded-lg bg-muted/60 px-4 py-3 font-mono text-sm">
              {installCmd}
            </pre>
          )}

          {installKind === "git" && (
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-500">
              {t("installGitNote")}
            </p>
          )}
          {installKind === "release" && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("installReleaseNote")}
            </p>
          )}
          {(installKind === "release" ||
            installKind === "npm" ||
            installKind === "git" ||
            installKind === "build-required") && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("installProfileNote")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 编辑介绍（热门插件专供） */}
      {intro && (
        <Card className="mt-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("detailIntro")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="leading-relaxed text-muted-foreground">{intro}</p>
            {highlights && highlights.length > 0 && (
              <ul className="space-y-1.5">
                {highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm leading-relaxed">
                    <span className="text-brand-500">▸</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* 评分明细 */}
      {plugin.score != null && (
        <Card className="mt-5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{t("detailScore")}</CardTitle>
              <span className="text-xs text-muted-foreground tabular-nums">
                {plugin.scoredAt ? `${t("detailScoredAt")} ${day(plugin.scoredAt)}` : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pinned ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {plugin.scoreDetail?.ai?.comment ?? t("detailPinned")}
              </p>
            ) : (
              <>
                {parts && (
                  <div className="space-y-2">
                    {dims.map(({ key, max }) => {
                      const v = Number(parts[key] ?? 0);
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-sm text-muted-foreground">
                            {t(`detailDim.${key}`)}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="bg-gradient-brand h-full rounded-full"
                              style={{ width: `${Math.min(100, (v / max) * 100)}%` }}
                            />
                          </div>
                          <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums">
                            {v}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(plugin.scoreDetail?.suspicious || ai?.suspicious) && (
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    ⚠️ {t("detailSuspicious")}
                  </p>
                )}
                {ai?.comment && (
                  <p className="border-t border-border/60 pt-3 text-sm leading-relaxed text-muted-foreground">
                    {ai.comment}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 炫耀卡：作者贴进 README 后可跳回本页，给站点带外链 */}
      <Card className="mt-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("shareTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("shareDesc")}
          </p>
          <ShareCardBox siteUrl={SITE_URL} fullName={plugin.fullName} />
        </CardContent>
      </Card>

      {/* 标签 */}
      {plugin.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {plugin.tags.map((tag) => (
            <a
              key={tag}
              href={`https://github.com/topics/${tag}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge variant="ghost" className="text-[11px] hover:text-foreground">
                #{tag}
                <ExternalLink className="size-2.5" />
              </Badge>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
