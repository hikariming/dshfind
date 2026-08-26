#!/usr/bin/env node
/**
 * 挑出最该补多语言文案的插件，导出成待翻译清单。
 *
 * 为什么需要它：详情页的 title/description 有 9,600 个 URL × 4 语言，
 * 但其中只有极少数有译文——其余的 /en /ja /ko 页面拿的是同一句英文
 * GitHub description，等于同一个薄页面被复制四份。补译是把这批重复页
 * 变成真内容页的唯一办法。
 *
 * 流水线与 score-plugins 同构：
 *   1. 本脚本采集候选           → candidates.json
 *   2. AI 按候选逐条翻译并写导语 → translations.json
 *   3. scripts/set-plugin-i18n.mjs --from-json=translations.json 入库
 *   4. pnpm gen:plugins 刷新构建期快照
 *
 * 用法：
 *   node --env-file=.env.local scripts/collect-i18n-candidates.mjs <out.json> [--limit=200] [--min-stars=0]
 */
import { writeFileSync } from "node:fs";
import { openDb } from "./lib/db.mjs";

const args = process.argv.slice(2);
const outPath = args.find((a) => !a.startsWith("--"));
const opt = (name, dflt) => {
  const v = args.find((a) => a.startsWith(`--${name}=`));
  return v ? v.slice(name.length + 3) : dflt;
};

if (!outPath) {
  console.error(
    "用法：collect-i18n-candidates.mjs <out.json> [--limit=200] [--min-stars=0]",
  );
  process.exit(1);
}

const limit = Number(opt("limit", "200"));
const minStars = Number(opt("min-stars", "0"));

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error(
    "缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN（用 --env-file=.env.local 运行）",
  );
  process.exit(1);
}
const client = openDb();

/**
 * 候选口径：
 * - 在册且非跑题（与前台展示口径一致）
 * - 有原始描述可翻（空描述翻不出东西，得先等 README 抽取那一步）
 * - 四种语言里任何一种缺 description 都算候选
 * - 排序按 score 降序、再 star 降序：优先补那些已经有排名潜力的页面
 */
const rows = (
  await client.execute({
    sql: `
      SELECT p.full_name, p.name, p.owner, p.description, p.language,
             p.stars, p.score, p.category, p.tags, p.score_detail
      FROM plugins p
      WHERE p.is_present = 1
        AND p.is_offtopic = 0
        AND p.is_risky = 0
        AND p.description IS NOT NULL
        AND trim(p.description) <> ''
        AND p.stars >= ?
        AND (
          SELECT count(*) FROM plugin_i18n i
          WHERE i.full_name = p.full_name AND i.description IS NOT NULL
        ) < 4
      ORDER BY (p.score IS NULL), p.score DESC, p.stars DESC
      LIMIT ?`,
    args: [minStars, limit],
  })
).rows;

const repos = rows.map((r) => {
  let comment = null;
  try {
    comment = JSON.parse(r.score_detail || "{}")?.ai?.comment ?? null;
  } catch {
    /* score_detail 结构异常时当作没有点评，不影响翻译 */
  }
  let topics = [];
  try {
    topics = JSON.parse(r.tags || "[]");
  } catch {
    /* 同上 */
  }
  return {
    fullName: r.full_name,
    name: r.name,
    owner: r.owner,
    description: r.description,
    language: r.language || "",
    stars: Number(r.stars ?? 0),
    score: r.score == null ? null : Number(r.score),
    category: r.category || "",
    topics: topics.slice(0, 8),
    // 已有的中文点评可以给翻译当上下文，避免把插件用途理解错
    scoreComment: comment,
  };
});

writeFileSync(
  outPath,
  JSON.stringify(
    { generatedAt: new Date().toISOString(), count: repos.length, repos },
    null,
    2,
  ) + "\n",
);

console.log(`✅ ${repos.length} 个候选 → ${outPath}`);
console.log(
  `   已评分 ${repos.filter((r) => r.score != null).length} 个，star 中位数 ${
    repos.length
      ? [...repos].sort((a, b) => a.stars - b.stars)[Math.floor(repos.length / 2)]
          .stars
      : 0
  }`,
);
