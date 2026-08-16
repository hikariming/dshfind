/**
 * Production deployment gate 的可测试决策逻辑。
 *
 * 平台 API、GitHub Actions state 与 CLI 调用放在 .github/scripts/deploy-gate.mjs；
 * 这里保持无 I/O，防止发布条件和回滚条件在工作流演进时漂移。
 */

export const REQUIRED_GATE_ENV = [
  "VERCEL_TOKEN",
  "VERCEL_ORG_ID",
  "VERCEL_PROJECT_ID",
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

export function readyVercelDeployments(deployments) {
  return deployments.filter(
    (deployment) => (deployment?.readyState ?? deployment?.state) === "READY",
  );
}

/**
 * 优先选 parent commit 的 READY 部署；它不存在时仅退到非当前 SHA 的最新 READY
 * 部署，绝不把正要验证的当前提交当成回滚锚点。
 */
export function selectVercelAnchor({ deployments, beforeSha, currentSha }) {
  const ready = readyVercelDeployments(deployments);
  return (
    ready.find((deployment) => deployment.meta?.githubCommitSha === beforeSha) ??
    ready.find((deployment) => deployment.meta?.githubCommitSha !== currentSha) ??
    null
  );
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
 * 不能用 `vercel rollback`：它会关闭 Git 生产域名的自动分配。Promote 已记录的
 * production 部署既能恢复流量，也会保持后续 main 自动上线。
 */
export function vercelRecoveryCommand(anchorURL) {
  if (typeof anchorURL !== "string" || anchorURL.trim().length === 0) {
    throw new Error("incomplete Vercel rollback anchor");
  }
  return ["promote", anchorURL, "--yes", "--timeout", "10m"];
}

/**
 * Gate 的唯一判定入口。任一未知、失败或跳过的关键检查都会进入回滚；只有明确
 * true 才可保留新版本，避免把网络/控制面超时误判为成功。
 */
export function gateProblems({ stale, verificationOk, vercelOk, railwayOk, smokeOk }) {
  if (stale) return [];
  const problems = [];
  if (verificationOk !== true) problems.push("CI verification failed or did not complete");
  if (vercelOk !== true) problems.push("Vercel production deployment is not healthy");
  if (railwayOk !== true) problems.push("Railway production deployment is not healthy");
  if (smokeOk !== true) problems.push("production smoke check failed or did not complete");
  return problems;
}

export function shouldRollback(state) {
  return gateProblems(state).length > 0;
}

/**
 * 不因一端回滚失败而跳过另一端：尽最大努力同时恢复，然后把所有错误交给调用方
 * 统一标红和输出人工恢复所需的锚点。
 */
export async function rollbackBoth({ rollbackVercel, rollbackRailway }) {
  const errors = [];
  const results = {};
  try {
    results.vercel = await rollbackVercel();
  } catch (error) {
    errors.push(`Vercel rollback: ${error.message}`);
  }
  try {
    results.railway = await rollbackRailway();
  } catch (error) {
    errors.push(`Railway rollback: ${error.message}`);
  }
  return { errors, results };
}
