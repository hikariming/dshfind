import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { FolderGit2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchFromBackend, type SearchHit } from "@/lib/backend";
import { realPlugins } from "@/lib/plugins-real";
import { getTranslations } from "next-intl/server";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from "@/lib/suggest";

/** 插件结果最多渲染这么多条，其余引导去插件超市。 */
const PLUGIN_PAGE_SIZE = 12;

// 静态兜底用的检索串，按进程算一次并缓存：上千条插件拼串 + toLowerCase，
// 原来每个请求都要从头再来一遍。正常路径查 Go 后端，不走这里。
let pluginHaystack: string[] | null = null;

function getPluginHaystack(): string[] {
  pluginHaystack ??= realPlugins.map((p) =>
    `${p.id ?? p.fullName} ${p.description} ${p.tags.join(" ")} ${p.language}`.toLowerCase()
  );
  return pluginHaystack;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Search");
  return {
    title: t("title"),
    description: t("empty"),
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations("Search");
  const tp = await getTranslations("Plugins");
  // 少于 MIN_QUERY_LENGTH 不检索：?q=a 会命中几乎全表，白扫 1203 条还报个上千的数。
  // 这是公开 URL，谁都能刷，所以门槛放在服务端。
  const raw = (q ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const query = raw.length >= MIN_QUERY_LENGTH ? raw.toLowerCase() : "";

  // 优先查 Go 后端（实时数据），不可用时回落构建期静态数据。
  // 两条路都是：总数要准（页面上要显示），但只物化前 PLUGIN_PAGE_SIZE 条。
  let pluginResults: SearchHit[] = [];
  let pluginTotal = 0;
  if (query) {
    const backend = await searchFromBackend(query, PLUGIN_PAGE_SIZE);
    if (backend) {
      pluginResults = backend.hits;
      pluginTotal = backend.total;
    } else {
      const hay = getPluginHaystack();
      for (let i = 0; i < realPlugins.length; i++) {
        if (!hay[i].includes(query)) continue;
        pluginTotal++;
        if (pluginResults.length < PLUGIN_PAGE_SIZE) pluginResults.push(realPlugins[i]);
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {/* 搜索框 */}
      <form action="/search" method="get" className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("placeholder")}
            className="h-11 rounded-xl pl-9 text-base"
          />
        </div>
        <Button type="submit" className="h-11 rounded-xl px-6">
          {t("title")}
        </Button>
      </form>

      {!query ? (
        <div className="mt-16 text-center">
          <Search className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">
            {t("empty")}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 text-sm text-muted-foreground">
            {t("found")} <span className="font-semibold text-foreground">{pluginTotal}</span>{" "}
            {t("found2")}{q}{t("found3")}
          </div>

          {/* 插件 */}
          {pluginTotal > 0 && (
            <section className="mt-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <FolderGit2 className="size-5 text-brand-500 dark:text-brand-300" />
                {t("plugins")}（{pluginTotal}）
              </h2>
              <div className="mt-3 space-y-2">
                {/*
                  结果卡链站内详情页，不再 target=_blank 跳 GitHub。
                  下拉建议早就改成站内了（/api/suggest 返回 /plugins/{fullName}），
                  唯独这里漏改——用户搜完一路被送去 GitHub，站内详情页拿不到任何入口，
                  评分、安装命令、下载量、讨论区全都白做。
                */}
                {pluginResults.map((p) => (
                  <Link
                    key={p.fullName}
                    href={`/plugins/${p.fullName}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-brand-500/40 hover:bg-brand-500/5"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[15px] font-medium">
                        {p.name}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {p.description || tp("noDesc")}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {p.language || "—"}
                    </span>
                  </Link>
                ))}
                {pluginTotal > PLUGIN_PAGE_SIZE && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    {t("first12")}{" "}
                    <Link href="/plugins" className="text-brand-600 hover:underline dark:text-brand-300">
                      {t("marketplace")}
                    </Link>
                  </p>
                )}
              </div>
            </section>
          )}

          {/* 空状态 */}
          {pluginTotal === 0 && (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                {t("noResults")}{q}{t("noResults2")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
