/**
 * 评分 → 等级。等级线与 scripts/lib/scoring.mjs 的 GRADE_BANDS 保持一致。
 * 独立成无依赖模块：老站 score-badge 与 Astro 新站（apps/web）共用同一份口径。
 */
export function gradeOf(score: number) {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  return "C";
}
