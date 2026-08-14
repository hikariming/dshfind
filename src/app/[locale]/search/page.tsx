import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowRight, BookOpen, FolderGit2, Search, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { learnChapters } from "@/lib/nav";
import { realPlugins } from "@/lib/plugins-real";
import { getTranslations } from "next-intl/server";
import { rankingUsers } from "@/lib/ranking-real";

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
  const tl = await getTranslations("Learn");
  const tp = await getTranslations("Plugins");
  const query = (q ?? "").trim().toLowerCase();

  // 课程与章节索引（标题按当前语言从 messages 取）
  const learnResults: {
    id: string;
    label: string;
    href: string;
    chapter: string;
    index?: number;
  }[] = [];
  for (const chapter of learnChapters) {
    const chapterTitle = tl(`chapters.${chapter.id}.title`);
    for (const item of chapter.items) {
      if (!item.href) continue;
      const label = tl(`lessons.${item.href.split("/").pop()}`);
      if (
        !query ||
        label.toLowerCase().includes(query) ||
        chapterTitle.toLowerCase().includes(query)
      ) {
        learnResults.push({
          id: item.id,
          label,
          href: item.href,
          chapter: chapterTitle,
          index: item.index,
        });
      }
    }
  }

  // 插件
  const pluginResults = query
    ? realPlugins.filter((p) =>
        `${p.fullName} ${p.description} ${p.tags.join(" ")} ${p.language}`
          .toLowerCase()
          .includes(query)
      )
    : [];

  // 用户
  const userResults = query
    ? rankingUsers.filter((u) =>
        `${u.name} ${u.login} ${u.badges.join(" ")} ${u.title}`
          .toLowerCase()
          .includes(query)
      )
    : [];

  const total = learnResults.length + pluginResults.length + userResults.length;

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
            {t("found")} <span className="font-semibold text-foreground">{total}</span>{" "}
            {t("found2")}{q}{t("found3")}
          </div>

          {/* 课程与章节 */}
          {learnResults.length > 0 && (
            <section className="mt-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <BookOpen className="size-5 text-brand-500 dark:text-brand-300" />
                {t("courses")}（{learnResults.length}）
              </h2>
              <div className="mt-3 space-y-2">
                {learnResults.map((r) => (
                  <Link
                    key={r.id}
                    href={r.href}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-brand-500/40 hover:bg-brand-500/5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-medium">
                        {r.index !== undefined && `${r.index}. `}
                        {r.label}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.chapter}
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 插件 */}
          {pluginResults.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <FolderGit2 className="size-5 text-brand-500 dark:text-brand-300" />
                {t("plugins")}（{pluginResults.length}）
              </h2>
              <div className="mt-3 space-y-2">
                {pluginResults.slice(0, 12).map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
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
                  </a>
                ))}
                {pluginResults.length > 12 && (
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

          {/* 用户 */}
          {userResults.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Trophy className="size-5 text-brand-500 dark:text-brand-300" />
                {t("users")}（{userResults.length}）
              </h2>
              <div className="mt-3 space-y-2">
                {userResults.map((u) => (
                  <Link
                    key={u.id}
                    href="/ranking"
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-brand-500/40 hover:bg-brand-500/5"
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${u.color}`}
                    >
                      {u.initial}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium">{u.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        @{u.login} · {u.badges.join(" · ")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 空状态 */}
          {total === 0 && (
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
