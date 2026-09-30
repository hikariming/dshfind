import { useEffect, useState } from "preact/hooks";

import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from "@/lib/suggest";
import { API_BASE } from "~/config";

/**
 * 搜索结果（Preact 岛）。老站在服务端按 ?q= 每请求渲染（占 Worker CPU，结果页也进不了缓存）；
 * 这里页面是静态外壳，岛读取查询串后直连公开的 /v1/plugins?q=（与桌面端同一个接口，边缘缓存 5 分钟）。
 * 结果页本就不该被收录（页面 noindex），服务端渲染结果对 SEO 没有价值。
 */

export interface SearchLabels {
  title: string;
  placeholder: string;
  empty: string;
  found: string;
  found2: string;
  found3: string;
  plugins: string;
  noResults: string;
  noResults2: string;
  first12: string;
  marketplace: string;
  noDesc: string;
}

interface Hit {
  full_name: string;
  name: string;
  description: string;
  language: string;
}

/** 插件结果最多渲染这么多条，其余引导去插件超市（与老站一致） */
const PAGE_SIZE = 12;

export default function SearchResults({ locale, labels: t }: { locale: string; labels: SearchLabels }) {
  const [q, setQ] = useState<string | null>(null);
  const [result, setResult] = useState<{ total: number; hits: Hit[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const raw = (new URLSearchParams(window.location.search).get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
    setQ(raw);
    // 少于 MIN_QUERY_LENGTH 不检索：单个字母会命中几乎全表
    if (raw.length < MIN_QUERY_LENGTH) return;
    fetch(`${API_BASE}/v1/plugins?q=${encodeURIComponent(raw.toLowerCase())}&per_page=${PAGE_SIZE}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { total?: number; data?: Hit[] }) => setResult({ total: d.total ?? 0, hits: d.data ?? [] }))
      .catch(() => setFailed(true));
  }, []);

  const searching = q != null && q.length >= MIN_QUERY_LENGTH;

  return (
    <>
      <form action={`/${locale}/search`} method="get" class="flex items-center gap-2">
        <div class="relative flex-1">
          <svg class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            name="q"
            defaultValue={q ?? ""}
            key={q ?? ""}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            class="h-11 w-full min-w-0 rounded-xl border border-input bg-transparent px-2.5 py-1 pl-9 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
        <button type="submit" class="inline-flex h-11 shrink-0 items-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80">
          {t.title}
        </button>
      </form>

      {!searching ? (
        <div class="mt-16 text-center">
          <svg class="mx-auto size-10 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <p class="mt-4 text-muted-foreground">{t.empty}</p>
        </div>
      ) : failed ? (
        <p class="mt-12 text-center text-muted-foreground">
          {t.noResults}
          {q}
          {t.noResults2}
        </p>
      ) : !result ? (
        <div class="mt-6 space-y-2" aria-busy="true">
          {Array.from({ length: 4 }, () => (
            <div class="h-[74px] animate-pulse rounded-xl border border-border/60 bg-muted/30" />
          ))}
        </div>
      ) : (
        <>
          <div class="mt-6 text-sm text-muted-foreground">
            {t.found} <span class="font-semibold text-foreground">{result.total}</span> {t.found2}
            {q}
            {t.found3}
          </div>
          {result.total > 0 ? (
            <section class="mt-6">
              <h2 class="flex items-center gap-2 text-lg font-bold">
                <svg class="size-5 text-brand-500 dark:text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
                  <circle cx="13" cy="12" r="2" />
                  <path d="M18 19c-2.8 0-5-2.2-5-5v8" />
                  <circle cx="20" cy="19" r="2" />
                </svg>
                {t.plugins}（{result.total}）
              </h2>
              <div class="mt-3 space-y-2">
                {/* 结果卡链站内详情页（评分、安装命令、讨论区都在那里），不跳 GitHub */}
                {result.hits.map((p) => (
                  <a
                    key={p.full_name}
                    href={`/${locale}/plugins/${p.full_name}`}
                    class="group flex items-center justify-between gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-brand-500/40 hover:bg-brand-500/5"
                  >
                    <div class="min-w-0">
                      <div class="truncate font-mono text-[15px] font-medium">{p.name}</div>
                      <div class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.description || t.noDesc}</div>
                    </div>
                    <span class="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">{p.language || "—"}</span>
                  </a>
                ))}
                {result.total > PAGE_SIZE && (
                  <p class="pt-1 text-xs text-muted-foreground">
                    {t.first12}{" "}
                    <a href={`/${locale}/plugins`} class="text-brand-600 hover:underline dark:text-brand-300">
                      {t.marketplace}
                    </a>
                  </p>
                )}
              </div>
            </section>
          ) : (
            <p class="mt-12 text-center text-muted-foreground">
              {t.noResults}
              {q}
              {t.noResults2}
            </p>
          )}
        </>
      )}
    </>
  );
}
