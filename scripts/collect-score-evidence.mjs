#!/usr/bin/env node
/**
 * 评分证据采集：对指定插件（默认全部精选）拉取打分所需的全部客观证据。
 *
 * 用法：
 *   node --env-file=.env.local scripts/collect-score-evidence.mjs <输出.json> [owner/repo ...]
 *
 * 每仓库约 6 个 GitHub API 请求 + 1 个 npm registry 请求：
 *   repo 详情 / 近 90 天 commit 数与活跃天 / issue 列表 / package.json /
 *   README（截断） / owner 与其名下仓库
 * 输出一个 JSON：deterministic 字段给 scoring.mjs 算硬分，
 * readme/manifest 摘要给 AI 评审打工程规范分。
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createClient } from "@libsql/client/web";

const API = "https://api.github.com";
const DAY = 86400_000;

const TOKEN =
  process.env.GITHUB_TOKEN ||
  execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();

async function gh(path, accept = "application/vnd.github+json") {
  return fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

/** Link header 的 last 页码即总数（per_page=1 时）。 */
function lastPage(res) {
  const m = (res.headers.get("link") ?? "").match(/[?&]page=(\d+)>;\s*rel="last"/);
  return m ? Number(m[1]) : null;
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://"),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const [outPath, ...repoArgs] = process.argv.slice(2);
if (!outPath) {
  console.error("用法：collect-score-evidence.mjs <输出.json> [owner/repo ...]");
  process.exit(1);
}

const targets = repoArgs.length
  ? repoArgs
  : (
      await client.execute(
        `SELECT full_name FROM plugins WHERE is_featured = 1 AND is_present = 1 ORDER BY stars DESC`,
      )
    ).rows.map((r) => String(r.full_name));

const ecoStart = Date.parse(
  String(
    (await client.execute(`SELECT MIN(first_seen_at) AS d FROM plugins`)).rows[0].d,
  ),
);
const now = Date.now();
const ecoAgeDays = (now - ecoStart) / DAY;
const since90 = new Date(now - 90 * DAY).toISOString();

async function collect(fullName) {
  const [owner] = fullName.split("/");

  const repo = await (await gh(`/repos/${fullName}`)).json();

  // 近 90 天 commit 总数（per_page=1 翻页数）+ 前 100 个的活跃天数
  const cRes = await gh(`/repos/${fullName}/commits?since=${since90}&per_page=1`);
  const commits90 = cRes.ok ? (lastPage(cRes) ?? (await cRes.json()).length) : 0;
  const cList = await gh(`/repos/${fullName}/commits?since=${since90}&per_page=100`);
  const commitDates = cList.ok
    ? (await cList.json()).map((c) => (c.commit?.author?.date ?? "").slice(0, 10))
    : [];
  const activeDays = new Set(commitDates.filter(Boolean)).size;

  // issue + PR（GitHub 把 PR 也算 issue）；answered ≈ 有评论或已关闭
  const iRes = await gh(`/repos/${fullName}/issues?state=all&per_page=100&sort=created&direction=desc`);
  const issues = iRes.ok ? await iRes.json() : [];
  const issuesTotal = issues.length;
  const issuesAnswered = issues.filter((i) => i.comments > 0 || i.state === "closed").length;
  const issuesClosed = issues.filter((i) => i.state === "closed").length;

  // package.json（HEAD 上没有则 404）
  let manifest = null;
  const pj = await fetch(
    `https://raw.githubusercontent.com/${fullName}/HEAD/package.json`,
  );
  if (pj.ok) {
    try {
      const j = JSON.parse(await pj.text());
      manifest = {
        name: j.name ?? null,
        version: j.version ?? null,
        private: Boolean(j.private),
        hasDshField: Boolean(j.dsh || j.dshPlugin || j["dsh-plugin"]),
        keywords: j.keywords ?? [],
        scripts: Object.keys(j.scripts ?? {}),
        deps: Object.keys({ ...j.dependencies, ...j.peerDependencies }).slice(0, 20),
      };
    } catch {
      manifest = { parseError: true };
    }
  }

  // npm 是否真实发布
  let npm = null;
  if (manifest?.name && !manifest.private) {
    const nRes = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(manifest.name)}`,
    );
    if (nRes.ok) {
      const n = await nRes.json();
      npm = { published: true, versions: Object.keys(n.versions ?? {}).length };
    } else {
      npm = { published: false };
    }
  }

  // release/tag
  const rRes = await gh(`/repos/${fullName}/tags?per_page=1`);
  const hasTags = rRes.ok && (await rRes.json()).length > 0;

  // README 截断给 AI 评审
  const readmeRes = await gh(`/repos/${fullName}/readme`, "application/vnd.github.raw+json");
  const readme = readmeRes.ok ? (await readmeRes.text()).slice(0, 3000) : "";

  // owner 历史 + 名下最佳其他原创仓
  const user = await (await gh(`/users/${owner}`)).json();
  const repos = await (
    await gh(`/users/${owner}/repos?per_page=100&type=owner&sort=pushed`)
  ).json();
  const bestOtherRepoStars = Array.isArray(repos)
    ? Math.max(
        0,
        ...repos
          .filter((r) => r.full_name !== fullName && !r.fork)
          .map((r) => r.stargazers_count ?? 0),
      )
    : 0;

  // Turso 侧：快照增速 + 运营字段
  const row = (
    await client.execute({
      sql: `SELECT stars, contributors, is_insider FROM plugins WHERE full_name = ?`,
      args: [fullName],
    })
  ).rows[0];
  const snaps = (
    await client.execute({
      sql: `SELECT snapshot_date, stars FROM plugin_snapshots WHERE full_name = ? ORDER BY snapshot_date`,
      args: [fullName],
    })
  ).rows;
  const first = snaps[0];
  const last = snaps[snaps.length - 1];
  const trackedDays = snaps.length >= 2
    ? Math.max(1, (Date.parse(String(last.snapshot_date)) - Date.parse(String(first.snapshot_date))) / DAY)
    : 1;
  const starVelocity = snaps.length >= 2
    ? (Number(last.stars) - Number(first.stars)) / trackedDays
    : Number(row?.stars ?? 0) / Math.max(1, Math.min(ecoAgeDays, (now - Date.parse(repo.created_at)) / DAY));

  return {
    fullName,
    // —— 硬分证据 ——
    now,
    ecoAgeDays,
    stars: Number(row?.stars ?? repo.stargazers_count ?? 0),
    starVelocity: Math.round(starVelocity * 10) / 10,
    pushedAt: repo.pushed_at,
    repoAgeDays: Math.round((now - Date.parse(repo.created_at)) / DAY),
    archived: Boolean(repo.archived),
    commits90,
    activeDays,
    issuesTotal,
    issuesAnswered,
    issuesClosed,
    contributors: row?.contributors == null ? null : Number(row.contributors),
    isInsider: Boolean(Number(row?.is_insider ?? 0)),
    accountAgeYears:
      Math.round(((now - Date.parse(user.created_at)) / DAY / 365) * 10) / 10,
    bestOtherRepoStars,
    // —— AI 评审证据 ——
    description: repo.description ?? "",
    license: repo.license?.spdx_id ?? null,
    hasTags,
    manifest,
    npm,
    ownerFollowers: user.followers ?? 0,
    readme,
  };
}

const out = [];
for (const fullName of targets) {
  process.stdout.write(`采集 ${fullName} … `);
  try {
    out.push(await collect(fullName));
    console.log("ok");
  } catch (err) {
    console.log(`失败：${err?.message ?? err}`);
  }
}
writeFileSync(outPath, JSON.stringify({ ecoAgeDays, collectedAt: new Date(now).toISOString(), repos: out }, null, 1));
console.log(`已写 ${outPath}：${out.length}/${targets.length} 个仓库`);
