import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { learnChapters } from "@/lib/nav";
import { realPlugins } from "@/lib/plugins-real";
import { rankingUsers } from "@/lib/ranking-real";
import {
  MAX_QUERY_LENGTH,
  MAX_SUGGESTIONS,
  MIN_QUERY_LENGTH,
  type Suggestion,
} from "@/lib/suggest";

/**
 * GET /api/suggest?q=&locale= —— 搜索框下拉建议。
 *
 * 放在服务端的唯一原因是体积：插件数据有 1203 条（约 580KB），
 * 之前搜索框作为 client component 直接 import，把整份数据打进了每个页面的
 * 客户端 bundle（553KB / gzip 133KB）。这里只回传最多 10 条结果。
 */

/** 各类型的配额，加起来正好是 MAX_SUGGESTIONS。 */
const LIMIT = { lesson: 4, plugin: 5, user: 2 };

interface Entry {
  id: string;
  label: string;
  sub: string;
  href?: string;
  /** 预先拼好并小写的检索串。 */
  hay: string;
}

// 索引按 lambda 实例算一次并缓存。Fluid Compute 会复用实例，
// 所以热实例上每个请求只剩一次 includes 扫描。
let pluginEntries: Entry[] | null = null;
let userEntries: Entry[] | null = null;
const lessonEntries = new Map<Locale, Entry[]>();

function getPluginEntries(): Entry[] {
  pluginEntries ??= realPlugins.map((p) => ({
    id: p.fullName,
    label: p.name,
    sub: p.description || `@${p.owner}`,
    href: p.url,
    hay: `${p.fullName} ${p.description} ${p.tags.join(" ")}`.toLowerCase(),
  }));
  return pluginEntries;
}

function getUserEntries(): Entry[] {
  userEntries ??= rankingUsers.map((u) => {
    const sub = `@${u.login} · ${u.badges.join(" · ")}`;
    return {
      id: u.id,
      label: u.name,
      sub,
      href: "/ranking",
      hay: `${u.name} ${sub}`.toLowerCase(),
    };
  });
  return userEntries;
}

async function getLessonEntries(locale: Locale): Promise<Entry[]> {
  const cached = lessonEntries.get(locale);
  if (cached) return cached;

  // 课程标题按语言从 messages 取（结构与 href 来自导航配置）
  const tl = await getTranslations({ locale, namespace: "Learn" });
  const entries = learnChapters.flatMap((ch) =>
    ch.items
      .filter((i) => i.href)
      .map((i) => {
        const label = tl(`lessons.${i.href!.split("/").pop()}`);
        return {
          id: i.id,
          label,
          sub: tl(`chapters.${ch.id}.title`),
          href: i.href!,
          hay: label.toLowerCase(),
        };
      })
  );
  lessonEntries.set(locale, entries);
  return entries;
}

/** 命中 limit 条就停，不再扫剩下的表。 */
function take(
  entries: Entry[],
  q: string,
  limit: number,
  type: Suggestion["type"],
  external?: boolean
): Suggestion[] {
  const out: Suggestion[] = [];
  for (let i = 0; i < entries.length && out.length < limit; i++) {
    const e = entries[i];
    if (e.hay.includes(q)) {
      out.push({ type, id: e.id, label: e.label, sub: e.sub, href: e.href, external });
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("q") ?? "")
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .toLowerCase();

  const raw = searchParams.get("locale");
  const locale: Locale = raw && isLocale(raw) ? raw : defaultLocale;

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { items: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const items = [
    ...take(await getLessonEntries(locale), q, LIMIT.lesson, "lesson"),
    ...take(getPluginEntries(), q, LIMIT.plugin, "plugin", true),
    ...take(getUserEntries(), q, LIMIT.user, "user"),
  ].slice(0, MAX_SUGGESTIONS);

  return NextResponse.json(
    { items },
    {
      // 数据每天同步一次、且每次部署都会刷掉 CDN 缓存，放心缓存长一点。
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
