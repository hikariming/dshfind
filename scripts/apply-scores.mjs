#!/usr/bin/env node
/**
 * 评分合成入库：证据 JSON（collect-score-evidence.mjs 产出）
 * + AI 评审 JSON（工程规范四子分与刷量判断）→ 总分与明细写进 Turso。
 *
 * 用法：
 *   node --env-file=.env.local scripts/apply-scores.mjs <evidence.json> <verdicts.json>
 *
 * verdicts.json 形如：
 *   { "owner/repo": { "manifest": 0-8, "release": 0-4, "docs": 0-6,
 *                     "dshIntegration": 0-7, "suspicious": false,
 *                     "comment": "一句话点评" }, ... }
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client/web";

import { composeScore, gradeOf } from "./lib/scoring.mjs";

const [evidencePath, verdictsPath] = process.argv.slice(2);
if (!evidencePath || !verdictsPath) {
  console.error("用法：apply-scores.mjs <evidence.json> <verdicts.json>");
  process.exit(1);
}

const { repos } = JSON.parse(readFileSync(evidencePath, "utf8"));
const verdicts = JSON.parse(readFileSync(verdictsPath, "utf8"));

const client = createClient({
  url: process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://"),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const scoredAt = new Date().toISOString();
const results = [];
for (const e of repos) {
  const ai = verdicts[e.fullName];
  if (!ai) {
    console.warn(`跳过 ${e.fullName}：没有 AI 评审结果`);
    continue;
  }
  const r = composeScore(e, ai);
  results.push({ fullName: e.fullName, ...r, comment: ai.comment ?? "" });
  await client.execute({
    sql: `UPDATE plugins SET score = ?, score_detail = ?, scored_at = ? WHERE full_name = ?`,
    args: [
      r.score,
      JSON.stringify({
        grade: r.grade,
        parts: r.parts,
        ai,
        suspicious: r.suspicious,
        weights: r.weights,
      }),
      scoredAt,
      e.fullName,
    ],
  });
}

results.sort((a, b) => b.score - a.score);
for (const r of results) {
  console.log(
    `${String(r.score).padStart(3)} ${r.grade}  ${r.fullName}` +
      `  (活跃 ${r.parts.activity} / star ${r.parts.star} / 工程 ${r.parts.engineering} / 维护者 ${r.parts.maintainer})` +
      (r.suspicious ? "  ⚠️疑似刷量" : ""),
  );
}
console.log(`已入库 ${results.length} 个评分（等级线 S≥85 A≥70 B≥55，gradeOf 与前台一致：${gradeOf(85)}/${gradeOf(70)}/${gradeOf(55)}）`);
