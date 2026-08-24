import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowLeft,
  Calendar,
  Download,
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
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PluginHubList } from "@/components/plugin-hub-list";
import { jsonLdSafe } from "@/lib/json-ld";
import { internalTagSlugs, relatedPlugins, tagSlug } from "@/lib/plugin-hubs";
import { pluginRelatedDocs } from "@/lib/docs-related";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import {
  getPluginEditorial,
  localizePluginDescription,
} from "@/lib/plugin-i18n";
import { getPluginDetail } from "@/lib/plugins-db";
import { downloadTier, formatDownloads } from "@/lib/downloads";
import { realPlugins } from "@/lib/plugins-real";
import { isLocale, type Locale } from "@/i18n/config";
import { pageAlternates, SITE_URL } from "@/lib/site";
import { ShareCardBox } from "@/components/share-card-box";
import { CopyInstallCommand } from "@/components/copy-install-command";
import { PluginDiscussion } from "@/components/plugin-discussion";

type Params = Promise<{ locale: string; owner: string; repo: string }>;

/**
 * ISR：详情页按需渲染后静态缓存 24 小时，命中缓存不再产生函数调用。
 * sitemap 对外列了 5600+ 插件 × 4 语言 ≈ 2.3 万个 URL，爬虫会全量抓——
 * 之前每次抓取都是一次动态渲染 + 3 条 Turso 查询。
 * 24h 而不是更短：数据本来就一天一同步（同步会触发部署、重置全部缓存），
 * 6h 只会让爬虫一天把 2.3 万页多烤三遍（CPU/FOT/ISR Writes 三头计费）。
 */
export const revalidate = 86400;

/**
 * 只预渲染头部插件（realPlugins 行序 featured 优先、star 降序），
 * 其余 2 万多个 URL 首次访问时按需渲染，随后进 ISR 缓存。
 * 没有这个导出，经典模型会把整条路由当成纯动态、每请求都跑函数。
 */
export function generateStaticParams() {
  return realPlugins.slice(0, 24).map((p) => {
    const [owner, repo] = p.fullName.split("/");
    return { owner, repo };
  });
}

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
    // 风险项目不进搜索索引——假冒仓库靠 SEO 分流官方流量，不能替它做收录
    robots: plugin.isRisky ? { index: false } : undefined,
  };
}

/** 把风险说明里的裸 URL 变成可点链接（如指向被假冒的官方仓库）。 */
function linkifyNote(note: string) {
  return note.split(/(https?:\/\/[^\s，。）)]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener"
        className="underline underline-offset-4"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default async function PluginDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locale, owner, repo } = await params;
  setRequestLocale(locale);
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
  // 累计下载量摘要由数据层给（读库成功用三渠道原值，兜底用构建期快照），没有就整张卡不出现。
  // 攒够最低档（100）才给作者「下载量炫耀小标」这个选项，免得复制出去一张空徽章。
  const downloads = plugin.downloadSummary;
  const downloadsBadge = downloads != null && downloadTier(downloads.total) != null;

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

  // 相关插件：详情页之间此前零内链，整个插件库是一堆互不相连的叶子节点。
  // 风险仓库不出现在推荐里（relatedPlugins 已过滤）。
  const related = relatedPlugins(plugin.fullName);
  // 站内有 hub 页的标签链回站内，其余仍指向 GitHub topic
  const internalTags = internalTagSlugs(plugin.tags);
  const relatedDocs = pluginRelatedDocs(plugin.category, internalTags);
  const td = await getTranslations("Docs");

  const crumbs = [
    { name: "dshfind", path: "" },
    { name: t("title"), path: "/plugins" },
    ...(plugin.category
      ? [
          {
            name: t(`categories.${plugin.category}`),
            path: `/plugins/c/${plugin.category}`,
          },
        ]
      : []),
    { name: plugin.name, path: `/plugins/${plugin.fullName}` },
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
        dangerouslySetInnerHTML={{ __html: jsonLdSafe(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe(breadcrumbJsonLd(loc, crumbs)),
        }}
      />
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-lg text-muted-foreground">
        <Link href="/plugins">
          <ArrowLeft />
          {t("backToList")}
        </Link>
      </Button>

      <div className="mt-2">
        <BreadcrumbNav crumbs={crumbs} />
      </div>

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
            rel="noopener"
            className="mt-1 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            @{plugin.owner}
          </a>
        </div>
        <Button asChild className="rounded-lg">
          <a href={plugin.url} target="_blank" rel="noopener">
            <FolderGit2 />
            {t("viewRepo")}
          </a>
        </Button>
      </div>

      {/* 风险警示：横幅置于最显眼处，说明里带被假冒的官方仓库链接 */}
      {plugin.isRisky && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/8 p-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            ⚠️ {t("riskyBanner")}
          </p>
          {plugin.riskNote && (
            <p className="mt-1.5 text-sm leading-relaxed text-red-700/90 dark:text-red-400/90">
              {linkifyNote(plugin.riskNote)}
            </p>
          )}
        </div>
      )}

      {/* 徽标 + 分类 */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {plugin.isRisky && (
          <Badge className="bg-red-600 text-white dark:bg-red-500">
            ⚠️ {t("risky")}
          </Badge>
        )}
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
          /* 指向分类 hub 而不是 /plugins?category= —— 查询参数页不可索引，
             传不出权重，等于把内链浪费在一个搜索引擎不收的 URL 上 */
          <Link href={`/plugins/c/${plugin.category}`}>
            <Badge variant="outline" className="hover:border-brand-500/60">
              {t(`categories.${plugin.category}`)}
            </Badge>
          </Link>
        )}
      </div>

      <p className="mt-4 max-w-[70ch] leading-relaxed text-muted-foreground">
        {description || t("noDesc")}
      </p>

      {/* 指标：拿得到下载量时多一张卡，网格相应从 4 列变 5 列 */}
      <div
        className={`mt-6 grid grid-cols-2 gap-3 ${
          downloads ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4"
        }`}
      >
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
        {downloads && (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Download className="size-3.5" />
              {t("downloads")}
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums">
              {formatDownloads(downloads.total)}
            </div>
            {/* 口径必须写清楚：npm 系是包安装数，Release 系是安装包下载数，两者不是一回事；
                manual 是运营核实的全渠道数（含官网自建分发），我们没量过，出处挂 tooltip */}
            <div
              className="text-[11px] text-muted-foreground"
              title={downloads.channel === "manual" ? (downloads.note ?? undefined) : undefined}
            >
              {downloads.channel === "manual"
                ? t("downloadsManual")
                : downloads.breakdown
                  ? t("downloadsNpm", {
                      npm: formatDownloads(downloads.breakdown.npm),
                      mirror: formatDownloads(downloads.breakdown.mirror),
                    })
                  : t("downloadsRelease")}
            </div>
          </div>
        )}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                {plugin.pkgVersion ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("installVersion", { version: plugin.pkgVersion })}
                  </span>
                ) : (
                  <span />
                )}
                <CopyInstallCommand command={installCmd} />
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted/60 px-4 py-3 font-mono text-sm">
                {installCmd}
              </pre>
            </div>
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
          <ShareCardBox
            siteUrl={SITE_URL}
            fullName={plugin.fullName}
            showDownloads={downloadsBadge}
          />
        </CardContent>
      </Card>

      {/* 讨论区：客户端直连 Go API，本页仍是 ISR 静态页 */}
      <PluginDiscussion owner={owner} repo={repo} />

      {/* 三角内链的另一条边：插件 → 官方文档。
          目录站没有文档、文档博客没有目录，这两条边只有本站连得起来。 */}
      {relatedDocs.length > 0 && (
        <section className="mt-10 border-t border-border/60 pt-6">
          <h2 className="text-base font-semibold">{td("relatedDocs")}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {relatedDocs.map((d) => (
              <li key={`${d.section}/${d.slug}`}>
                <Link
                  href={
                    d.slug === "index"
                      ? `/docs/${d.section}`
                      : `/docs/${d.section}/${d.slug}`
                  }
                  className="block rounded-xl border border-border/60 bg-card px-4 py-3 text-sm transition-colors hover:border-brand-500/60"
                >
                  {td(`sections.${d.section}`)} · {d.slug}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 相关插件：站内横向内链，同时给这页补一块真实内容 */}
      {related.length > 0 && (
        <section className="mt-10 border-t border-border/60 pt-6">
          <h2 className="text-base font-semibold">{t("hub.related")}</h2>
          <PluginHubList plugins={related} locale={locale} />
        </section>
      )}

      {/* 标签：站内有 hub 页的链回站内，其余才外链 GitHub topic。
          此前全部外链，等于把每个详情页的权重白送给 github.com。 */}
      {plugin.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {plugin.tags.map((tag) => {
            const slug = tagSlug(tag);
            return internalTags.has(slug) ? (
              <Link key={tag} href={`/plugins/t/${slug}`}>
                <Badge
                  variant="ghost"
                  className="text-[11px] hover:text-foreground"
                >
                  #{tag}
                </Badge>
              </Link>
            ) : (
              <a
                key={tag}
                href={`https://github.com/topics/${tag}`}
                target="_blank"
                rel="noopener"
              >
                <Badge
                  variant="ghost"
                  className="text-[11px] hover:text-foreground"
                >
                  #{tag}
                  <ExternalLink className="size-2.5" />
                </Badge>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
