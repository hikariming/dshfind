/**
 * 插件综合评分：0-100 = 活跃度 + Star 热度 + 工程规范(AI) + 维护者靠谱度。
 *
 * 核心设计：DSH 生态刚开源几天，时间类信号（更新衰减/周覆盖率/长期增长）
 * 尚无区分度，所以权重与时间窗都是「生态年龄」的函数——
 * 今天自动是早期形态（工程规范与维护者历史吃重、star 看速度），
 * ~90 天后自动长成成熟形态（活跃度吃重、star 看存量与持续性），无需换算法。
 *
 * 工程规范 25 分制的四个子分由 AI 评审给出（manifest/发布/文档/DSH 真实集成度），
 * 其余全部为确定性公式，保证分数可复现、可审计。
 */

export const GRADE_BANDS = [
  ["S", 85],
  ["A", 70],
  ["B", 55],
  ["C", 0],
];

export function gradeOf(score) {
  return GRADE_BANDS.find(([, min]) => score >= min)[0];
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const DAY = 86400_000;

/** 生态年龄 0→90 天的线性过渡进度。 */
function transition(ecoAgeDays) {
  return clamp01(ecoAgeDays / 90);
}

/** 四维权重（和恒为 100）。 */
export function weights(ecoAgeDays) {
  const t = transition(ecoAgeDays);
  return {
    activity: 25 + 20 * t,
    star: 30,
    engineering: 25 - 10 * t,
    maintainer: 20 - 10 * t,
  };
}

/**
 * 活跃度 0-1。
 * @param {{pushedAt: string, repoAgeDays: number, commits90: number,
 *          activeDays: number, issuesTotal: number, issuesAnswered: number,
 *          issuesClosed: number, ecoAgeDays: number, now: number}} e
 */
export function activityScore(e) {
  // push 新鲜度：半衰期随生态年龄缩放——生态第 3 天时约 2 天没动就掉一半
  const halfLife = Math.max(2, Math.min(30, e.ecoAgeDays / 6));
  const daysSincePush = Math.max(0, (e.now - Date.parse(e.pushedAt)) / DAY);
  const freshness = Math.exp((-Math.LN2 * daysSincePush) / halfLife);

  // 开发节奏：观察窗内的日均 commit（log 归一，3/天≈满）+ 活跃天覆盖率各半
  const windowDays = Math.max(1, Math.min(e.repoAgeDays, 90));
  const cpd = e.commits90 / windowDays;
  const density =
    0.5 * clamp01(Math.log1p(cpd) / Math.log1p(3)) +
    0.5 * clamp01(e.activeDays / windowDays);

  // issue/PR 互动：没有 issue 的小仓给中位 0.5，不惩罚小而稳
  const engagement =
    e.issuesTotal === 0
      ? 0.5
      : 0.5 * clamp01(e.issuesAnswered / e.issuesTotal) +
        0.5 * clamp01(e.issuesClosed / e.issuesTotal);

  return 0.4 * freshness + 0.35 * density + 0.25 * engagement;
}

/**
 * Star 热度 0-1。早期看增速为主，成熟后看存量与持续性。
 * @param {{stars: number, starVelocity: number, ecoAgeDays: number}} e
 *        starVelocity = 观察窗内日均新增 star
 */
export function starScore(e) {
  const t = transition(e.ecoAgeDays);
  const level = clamp01(Math.log10(e.stars + 1) / Math.log10(2001));
  const velocity = clamp01(Math.log1p(Math.max(0, e.starVelocity)) / Math.log1p(50));
  const velWeight = 0.5 - 0.3 * t; // 0.5 → 0.2
  return velWeight * velocity + (1 - velWeight) * level;
}

/**
 * 维护者靠谱度 0-1：账号年龄 0.4 + 既往原创作品 0.3 + 内测身份 0.15 + 多人协作 0.15。
 * @param {{accountAgeYears: number, bestOtherRepoStars: number,
 *          isInsider: boolean, contributors: number|null}} e
 */
export function maintainerScore(e) {
  const age = clamp01(e.accountAgeYears / 3);
  const priorWork = clamp01(
    Math.log10(e.bestOtherRepoStars + 1) / Math.log10(501),
  );
  const insider = e.isInsider ? 1 : 0;
  const collab = (e.contributors ?? 1) >= 5 ? 1 : (e.contributors ?? 1) >= 2 ? 0.67 : 0;
  return 0.4 * age + 0.3 * priorWork + 0.15 * insider + 0.15 * collab;
}

/**
 * 刷量嫌疑（程序侧启发式；AI 评审可另行给 suspicious）：
 * star 增速可观但 commit 与 issue 互动几乎为零。
 */
export function looksSuspicious(e) {
  return e.starVelocity >= 30 && e.commits90 <= 2 && e.issuesTotal === 0;
}

/**
 * 合成总分。
 * @param {object} e 证据（各维度函数所需字段的并集）
 * @param {{manifest: number, release: number, docs: number, dshIntegration: number,
 *          suspicious?: boolean, comment?: string}} ai
 *        AI 评审：manifest 0-8 / release 0-4 / docs 0-6 / dshIntegration 0-7
 */
export function composeScore(e, ai) {
  const w = weights(e.ecoAgeDays);
  const suspicious = looksSuspicious(e) || Boolean(ai.suspicious);
  const penalty = suspicious ? 0.5 : 1;

  const parts = {
    activity: activityScore(e) * w.activity * penalty,
    star: starScore(e) * w.star * penalty,
    engineering:
      ((ai.manifest + ai.release + ai.docs + ai.dshIntegration) / 25) *
      w.engineering,
    maintainer: maintainerScore(e) * w.maintainer,
  };

  let total =
    parts.activity + parts.star + parts.engineering + parts.maintainer;
  if (e.archived) total *= 0.3;
  const score = Math.round(total);

  return {
    score,
    grade: gradeOf(score),
    suspicious,
    parts: Object.fromEntries(
      Object.entries(parts).map(([k, v]) => [k, Math.round(v * 10) / 10]),
    ),
    weights: w,
  };
}
