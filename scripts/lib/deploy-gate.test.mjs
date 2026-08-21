import assert from "node:assert/strict";
import test from "node:test";

import {
  gateProblems,
  healthyAPIResponse,
  healthySuggestionResponse,
  isRailwayChange,
  missingGateEnv,
  railwayHealthAnchor,
  railwayRollbackIsAvailable,
  railwayRollbackTarget,
  selectRailwayAnchor,
  shouldRollback,
} from "./deploy-gate.mjs";

const gateEnv = {
  RAILWAY_TOKEN: "token",
  RAILWAY_PROJECT_ID: "project",
  RAILWAY_ENVIRONMENT_ID: "production",
  RAILWAY_SERVICE_ID: "api",
  PROD_WEB_URL: "https://dshfind.com",
  PROD_API_URL: "https://api.dshfind.com",
};

test("gate configuration rejects a missing platform value before capturing anchors", () => {
  assert.deepEqual(missingGateEnv({ ...gateEnv, RAILWAY_SERVICE_ID: "" }), [
    "RAILWAY_SERVICE_ID",
  ]);
  assert.deepEqual(missingGateEnv(gateEnv), []);
});

test("Railway anchor is the newest successful deployment", () => {
  const deployments = [
    { id: "building", status: "BUILDING" },
    { id: "healthy", status: "SUCCESS" },
    { id: "old", status: "SUCCESS" },
  ];
  assert.deepEqual(selectRailwayAnchor(deployments), { id: "healthy", status: "SUCCESS" });
  assert.deepEqual(selectRailwayAnchor(deployments, "old"), { id: "old", status: "SUCCESS" });
  assert.equal(selectRailwayAnchor(deployments, "building"), null);
});

test("API smoke contracts require the deployed Railway commit and suggest items", () => {
  const health = {
    status: "ok",
    plugins_loaded: 1,
    commit_sha: "current",
    deployment_id: "deployment-current",
  };
  assert.equal(healthyAPIResponse(health, "current"), true);
  assert.equal(healthyAPIResponse({ ...health, commit_sha: "previous" }, "current"), false);
  assert.equal(healthyAPIResponse({ ...health, commit_sha: "" }, ""), false);
  assert.equal(healthyAPIResponse({ status: "ok", plugins_loaded: 0, commit_sha: "current" }, "current"), false);
  assert.equal(healthySuggestionResponse({ items: [] }), true);
  assert.equal(healthySuggestionResponse({ data: [] }), false);
});

test("Railway anchor must match the deployment actually serving healthz", () => {
  assert.deepEqual(
    railwayHealthAnchor({ commit_sha: "stable-sha", deployment_id: "deployment-stable" }),
    { commitSHA: "stable-sha", deploymentID: "deployment-stable" },
  );
  assert.equal(railwayHealthAnchor({ commit_sha: "stable-sha" }), null);
});

test("Railway rollback uses the captured deployment rather than the Git parent", () => {
  assert.deepEqual(
    railwayRollbackTarget({ anchorID: "deployment-old", anchorCommitSha: "stable-sha" }),
    { deploymentID: "deployment-old", commitSHA: "stable-sha" },
  );
  assert.throws(() => railwayRollbackTarget({ anchorID: "deployment-old" }), /incomplete/);
});

test("Railway rollback target must still be a successful, rollbackable deployment", () => {
  const target = { deploymentID: "deployment-old", commitSHA: "stable-sha" };
  assert.equal(
    railwayRollbackIsAvailable(
      { id: "deployment-old", status: "SUCCESS", canRollback: true },
      target,
    ),
    true,
  );
  assert.equal(
    railwayRollbackIsAvailable(
      { id: "deployment-old", status: "SUCCESS", canRollback: false },
      target,
    ),
    false,
  );
  assert.equal(
    railwayRollbackIsAvailable(
      { id: "other-deployment", status: "SUCCESS", canRollback: true },
      target,
    ),
    false,
  );
});

test("only API source or railway config changes require a new Railway deployment", () => {
  assert.equal(isRailwayChange(["src/app/page.tsx", "README.md"]), false);
  assert.equal(isRailwayChange(["server/internal/httpapi/server.go"]), true);
  assert.equal(isRailwayChange(["railway.json"]), true);
});

test("a failed provider, smoke check, or CI verdict requires rollback", () => {
  const healthy = { verificationOk: true, railwayOk: true, smokeOk: true };
  assert.equal(shouldRollback(healthy), false);
  assert.match(gateProblems({ ...healthy, railwayOk: false })[0], /Railway/);
  assert.match(gateProblems({ ...healthy, smokeOk: false })[0], /smoke/);
  assert.match(gateProblems({ ...healthy, verificationOk: false })[0], /CI/);
});

test("a stale workflow does not roll back a newer main release", () => {
  assert.equal(
    shouldRollback({ stale: true, verificationOk: false, railwayOk: false }),
    false,
  );
});

test("frontend health is not part of the verdict after moving to Cloudflare", () => {
  // 前端由 Workers Builds 自动构建、回滚是人工动作，所以判定里没有它的位置。
  // 这条用例锁住这个决定：将来若要恢复前端门禁，必须显式改判定函数而不是
  // 悄悄多传一个字段——多余字段会被忽略，不该让人误以为它生效了。
  const healthy = { verificationOk: true, railwayOk: true, smokeOk: true };
  assert.equal(shouldRollback({ ...healthy, frontendOk: false }), false);
});
