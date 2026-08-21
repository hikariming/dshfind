/**
 * Production deployment gate 的可测试决策逻辑。
 *
 * 平台 API、GitHub Actions state 与 CLI 调用放在 .github/scripts/deploy-gate.mjs；
 * 这里保持无 I/O，防止发布条件和回滚条件在工作流演进时漂移。
 *
 * 范围只剩 Railway（Go API）。前端已从 Vercel 迁到 Cloudflare Workers，那侧的
 * 锚定与回滚不由本 gate 负责——见 gateProblems 的说明。
 */

export const REQUIRED_GATE_ENV = [
  "RAILWAY_TOKEN",
  "RAILWAY_PROJECT_ID",
  "RAILWAY_ENVIRONMENT_ID",
  "RAILWAY_SERVICE_ID",
  "PROD_WEB_URL",
  "PROD_API_URL",
];

export function missingGateEnv(env) {
  return REQUIRED_GATE_ENV.filter((name) => !String(env[name] ?? "").trim());
}

export function isRailwayChange(paths) {
  return paths.some((path) => path === "railway.json" || path.startsWith("server/"));
}

/**
 * 有 live deployment ID 时，锚点必须就是该实例；不能因列表排序或队列状态
 * 选择另一个历史 SUCCESS 部署。无 ID 的分支仅供纯决策测试与旧状态兼容。
 */
export function selectRailwayAnchor(deployments, activeDeploymentID) {
  if (activeDeploymentID) {
    return (
      deployments.find(
        (deployment) => deployment?.id === activeDeploymentID && deployment.status === "SUCCESS",
      ) ?? null
    );
  }
  return deployments.find((deployment) => deployment?.status === "SUCCESS") ?? null;
}

/** Go API 的稳定 /healthz 契约。只有预期的 Railway commit 正在服务流量时才通过。 */
export function healthyAPIResponse(health, expectedCommit) {
  return (
    health?.status === "ok" &&
    Number.isInteger(health.plugins_loaded) &&
    health.plugins_loaded > 0 &&
    typeof expectedCommit === "string" &&
    expectedCommit.length > 0 &&
    typeof health.commit_sha === "string" &&
    health.commit_sha === expectedCommit
  );
}

/** 从真实流量的 healthz 响应提取可精确回滚的 Railway 身份。 */
export function railwayHealthAnchor(health) {
  if (
    typeof health?.commit_sha !== "string" ||
    health.commit_sha.length === 0 ||
    typeof health.deployment_id !== "string" ||
    health.deployment_id.length === 0
  ) {
    return null;
  }
  return { deploymentID: health.deployment_id, commitSHA: health.commit_sha };
}

/** /v1/suggest 与既有 Next fallback 的契约是 items，而非分页接口使用的 data。 */
export function healthySuggestionResponse(response) {
  return Array.isArray(response?.items);
}

/** Railway 回滚必须定位到捕获的部署和其实际服务的 commit，绝不猜测父提交。 */
export function railwayRollbackTarget(railway) {
  if (!railway?.anchorID || !railway?.anchorCommitSha) {
    throw new Error("incomplete Railway rollback anchor");
  }
  return { deploymentID: railway.anchorID, commitSHA: railway.anchorCommitSha };
}

/** Railway 只允许将仍处于 SUCCESS 且标为 canRollback 的锚点作为回滚目标。 */
export function railwayRollbackIsAvailable(deployment, target) {
  return (
    deployment?.id === target?.deploymentID &&
    deployment.status === "SUCCESS" &&
    deployment.canRollback === true
  );
}

/**
 * Gate 的唯一判定入口。任一未知、失败或跳过的关键检查都会进入回滚；只有明确
 * true 才可保留新版本，避免把网络/控制面超时误判为成功。
 *
 * 前端不在此列：站点迁到 Cloudflare Workers 后，前端由 Workers Builds 从 main
 * 自动构建，本 gate 不锚定也不回滚它。冒烟仍会请求 PROD_WEB_URL，但那只证明
 * 站点在服务，不证明当前 commit 已经上线——CF 构建失败时旧版本会继续服务，
 * 冒烟照样通过。前端回滚用 `wrangler rollback`，是有意保留的人工动作。
 */
export function gateProblems({ stale, verificationOk, railwayOk, smokeOk }) {
  if (stale) return [];
  const problems = [];
  if (verificationOk !== true) problems.push("CI verification failed or did not complete");
  if (railwayOk !== true) problems.push("Railway production deployment is not healthy");
  if (smokeOk !== true) problems.push("production smoke check failed or did not complete");
  return problems;
}

export function shouldRollback(state) {
  return gateProblems(state).length > 0;
}
