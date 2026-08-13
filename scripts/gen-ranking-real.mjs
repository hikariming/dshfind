#!/usr/bin/env node
/**
 * 由 dsh-external/dsh-club 的每日快照生成 src/lib/ranking-real.ts。
 *
 * 用法：
 *   node scripts/gen-ranking-real.mjs            # 用 gh CLI 拉最新两个快照（需 read:org）
 *   node scripts/gen-ranking-real.mjs a.json b.json   # 用本地快照（最新, 上一日）
 *
 * 积分公式与 dsh-club 的「综合积分榜」保持一致（lib/rankings.ts 的 SCORE_WEIGHTS）：
 *   近30天代码×0.1 + 历史代码×0.02 + 插件×30 + 插件星标×10 + (星标-插件星标)×3 + 仓库×2
 * 这里只是把同一套口径投影到 dshfind；dsh-club 仍是排行榜的权威来源。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/lib/ranking-real.ts");

/** 榜单写入前 N 名——完整榜单在 dsh-club，这里只做首页/排行页展示。 */
const TOP_N = 100;

const SCORE_WEIGHTS = { code30: 0.1, codeTotal: 0.02, plugin: 30, pluginStar: 10, star: 3, repo: 2 };
/** 单仓库单周代码行上限，防止一次性搬运的大仓库爆分（与 dsh-club 一致）。 */
const WEEKLY_CODE_CAP = 15000;

function ghJson(path) {
  const b64 = execFileSync("gh", ["api", path, "--jq", ".content"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

function loadSnapshots(localArgs) {
  if (localArgs.length >= 1) {
    return localArgs.map((p) => JSON.parse(readFileSync(resolve(p), "utf8")));
  }
  const files = execFileSync(
    "gh",
    ["api", "repos/dsh-external/dsh-club/contents/data/snapshots", "--jq", ".[].name"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  )
    .trim()
    .split("\n")
    .filter((n) => n.endsWith(".json"))
    .sort();
  const latest = files[files.length - 1];
  const latestDate = latest.slice(0, 10);
  // 上一日历日的最后一个快照——与 dsh-club 的「相邻日期对比」口径一致。
  const prev = [...files].reverse().find((f) => f.slice(0, 10) < latestDate);
  const get = (f) => ghJson(`repos/dsh-external/dsh-club/contents/data/snapshots/${f}`);
  return prev ? [get(latest), get(prev)] : [get(latest)];
}

/** 近 30 天日历窗口起点：最新周往前 21 天。 */
function monthCutoff(snapshot) {
  let latest = null;
  for (const w of snapshot.userWeekly) {
    if (!latest || w.weekStart > latest) latest = w.weekStart;
  }
  if (!latest) return null;
  const d = new Date(`${latest}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 21);
  return d.toISOString().slice(0, 10);
}

/** 把一个快照聚合成 login -> 指标。 */
function aggregate(snapshot) {
  const starsByRepo = new Map(snapshot.repos.map((r) => [r.name, r.stars ?? 0]));
  const pluginRepos = new Set(snapshot.plugins.map((p) => p.repo));
  const map = new Map();

  for (const c of snapshot.contributors) {
    let agg = map.get(c.login);
    if (!agg) {
      agg = { login: c.login, commits: 0, stars: 0, pluginStars: 0, plugins: 0, repos: 0, code30: 0, codeTotal: 0 };
      map.set(c.login, agg);
    }
    agg.commits += c.contributions ?? 0;
    agg.repos += 1;
    const stars = starsByRepo.get(c.repo) ?? 0;
    agg.stars += stars;
    if (pluginRepos.has(c.repo)) {
      agg.pluginStars += stars;
      agg.plugins += 1;
    }
  }

  const cutoff = monthCutoff(snapshot);
  const weeklyByLogin = new Map();
  for (const r of snapshot.userWeekly) {
    if (!map.has(r.login)) continue;
    let byWeek = weeklyByLogin.get(r.login);
    if (!byWeek) weeklyByLogin.set(r.login, (byWeek = new Map()));
    byWeek.set(r.weekStart, (byWeek.get(r.weekStart) ?? 0) + Math.min(r.additions ?? 0, WEEKLY_CODE_CAP));
  }
  for (const [login, byWeek] of weeklyByLogin) {
    const agg = map.get(login);
    for (const [week, additions] of byWeek) {
      agg.codeTotal += additions;
      if (cutoff && week >= cutoff) agg.code30 += additions;
    }
  }
  return map;
}

const scoreOf = (a) =>
  Math.round(
    a.code30 * SCORE_WEIGHTS.code30 +
      a.codeTotal * SCORE_WEIGHTS.codeTotal +
      a.plugins * SCORE_WEIGHTS.plugin +
      a.pluginStars * SCORE_WEIGHTS.pluginStar +
      (a.stars - a.pluginStars) * SCORE_WEIGHTS.star +
      a.repos * SCORE_WEIGHTS.repo,
  );

const ranked = (agg) =>
  [...agg.values()].sort((a, b) => scoreOf(b) - scoreOf(a) || b.code30 - a.code30);

/** 头衔，与 dsh-club 的 rankTitle 一致。 */
const rankTitle = (rank) =>
  rank === 1 ? "卷王" : rank <= 3 ? "卷神" : rank <= 10 ? "卷师" : rank <= 50 ? "卷民" : "潜水员";

/** 头像加载失败时的兜底底色——纯展示，由 login 决定，保证稳定。 */
const GRADIENTS = [
  "from-brand-500 to-accent-cyan",
  "from-accent-violet to-brand-500",
  "from-accent-cyan to-accent-violet",
  "from-brand-400 to-brand-600",
  "from-accent-violet to-brand-600",
];
const gradientFor = (login) => {
  let h = 0;
  for (const ch of login) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
};

const [latest, previous] = loadSnapshots(process.argv.slice(2));
const latestRanked = ranked(aggregate(latest));
const prevRanks = new Map();
if (previous) ranked(aggregate(previous)).forEach((a, i) => prevRanks.set(a.login, i + 1));

const rows = latestRanked.slice(0, TOP_N).map((agg, i) => {
  const rank = i + 1;
  const profile = latest.users[agg.login] ?? {};
  const prevRank = prevRanks.get(agg.login) ?? null;
  const rankDelta = prevRank === null ? null : prevRank - rank;
  const badges = [rankTitle(rank)];
  if (agg.plugins > 0) badges.push(`${agg.plugins} 插件`);
  if (agg.stars > 0) badges.push(`${agg.stars} 星标`);
  return {
    id: agg.login,
    login: agg.login,
    name: profile.name || agg.login,
    avatarUrl: profile.avatarUrl ?? "",
    title: rankTitle(rank),
    points: scoreOf(agg),
    contributions: agg.commits,
    plugins: agg.plugins,
    stars: agg.stars,
    repos: agg.repos,
    followers: profile.followers ?? 0,
    rank,
    rankDelta,
    badges,
    initial: agg.login.charAt(0).toUpperCase(),
    color: gradientFor(agg.login),
    trend: rankDelta === null ? "flat" : rankDelta > 0 ? "up" : rankDelta < 0 ? "down" : "flat",
  };
});

const source = `// 由 scripts/gen-ranking-real.mjs 从 dsh-external/dsh-club 的每日快照生成——请勿手改。
// 快照：${latest.date}（采集于 ${latest.meta.collectedAt}）${previous ? `，排名变化对比 ${previous.date}` : ""}
// 积分口径与 dsh-club 的「综合积分榜」一致；完整榜单与历史走势见 dsh-club 本身。
import type { RankingUser } from "./types";

/** 榜单元信息——榜单只收录前 ${TOP_N} 名，参与统计的贡献者共 ${latestRanked.length} 人。 */
export const rankingMeta = {
  snapshot: ${JSON.stringify(latest.date)},
  collectedAt: ${JSON.stringify(latest.meta.collectedAt)},
  totalContributors: ${latestRanked.length},
  listed: ${rows.length},
  source: "https://github.com/dsh-external/dsh-club",
} as const;

export const rankingUsers: RankingUser[] = [
${rows
  .map(
    (r) =>
      `  { id: ${JSON.stringify(r.id)}, login: ${JSON.stringify(r.login)}, name: ${JSON.stringify(r.name)}, avatarUrl: ${JSON.stringify(r.avatarUrl)}, title: ${JSON.stringify(r.title)}, points: ${r.points}, contributions: ${r.contributions}, plugins: ${r.plugins}, stars: ${r.stars}, repos: ${r.repos}, followers: ${r.followers}, rank: ${r.rank}, rankDelta: ${r.rankDelta}, badges: [${r.badges.map((b) => JSON.stringify(b)).join(",")}], initial: ${JSON.stringify(r.initial)}, color: ${JSON.stringify(r.color)}, trend: ${JSON.stringify(r.trend)} },`,
  )
  .join("\n")}
];
`;

writeFileSync(out, source);
console.log(
  `wrote ${out}: top ${rows.length} of ${latestRanked.length} contributors (snapshot ${latest.date})`,
);
