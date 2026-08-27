import assert from "node:assert/strict";
import test from "node:test";

import {
  edgeProblems,
  gateProblems,
  healthyAPIResponse,
  healthyMarketPageResponse,
  healthyPluginListResponse,
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

test("edge plugin list canary validates the worker-served envelope", () => {
  const item = { full_name: "deepseek-ai/deepseek-harness" };
  const ok = { data: [item], total: 11336, data_version: "sha256:abc" };
  assert.equal(healthyPluginListResponse(ok), true);
  // 桌面首屏截断契约：total 超过 200 = UA 分流把完整目录串给了桌面端
  assert.equal(healthyPluginListResponse({ ...ok, total: 200 }, { maxTotal: 200 }), true);
  assert.equal(healthyPluginListResponse({ ...ok, total: 201 }, { maxTotal: 200 }), false);
  assert.equal(healthyPluginListResponse({ ...ok, data: [] }), false);
  assert.equal(healthyPluginListResponse({ ...ok, data_version: "v1" }), false);
  assert.equal(healthyPluginListResponse({ ...ok, total: "11336" }), false);
  assert.equal(healthyPluginListResponse(null), false);
});

test("edge market canary validates the desktop catalog-source envelope", () => {
  const ok = {
    schemaVersion: "1.0.0",
    generatedAt: "2026-08-26T09:14:47Z",
    revision: "sha256:abc",
    items: [{ id: "deepseek-ai/deepseek-harness" }],
    page: { nextCursor: "c2hhMjU2OmFiYzo1MA", total: 4977 },
  };
  assert.equal(healthyMarketPageResponse(ok), true);
  // revision 必须与目录同源——漂了说明 market 产物与列表产物不是一次生成的
  assert.equal(healthyMarketPageResponse(ok, { expectRevision: "sha256:abc" }), true);
  assert.equal(healthyMarketPageResponse(ok, { expectRevision: "sha256:other" }), false);
  // 末页没有 nextCursor 是正常的，信封本身仍然健康
  assert.equal(healthyMarketPageResponse({ ...ok, page: { total: 4977 } }), true);
  assert.equal(healthyMarketPageResponse({ ...ok, schemaVersion: "2.0.0" }), false);
  assert.equal(healthyMarketPageResponse({ ...ok, items: [] }), false);
  assert.equal(healthyMarketPageResponse({ ...ok, items: [{}] }), false);
  assert.equal(healthyMarketPageResponse({ ...ok, revision: "v1" }), false);
  assert.equal(healthyMarketPageResponse({ ...ok, page: { total: "4977" } }), false);
  assert.equal(healthyMarketPageResponse(null), false);
});

test("edge canary marks the release failed without triggering a Railway rollback", () => {
  // Worker 金丝雀失败：release 标红，但 shouldRollback 不受影响
  const state = { stale: false, verificationOk: true, railwayOk: true, smokeOk: true, edgeOk: false };
  assert.equal(shouldRollback(state), false);
  assert.equal(edgeProblems(state).length, 1);
  // 主链路已失败时金丝雀保持沉默——Railway 回滚已在处理
  assert.deepEqual(edgeProblems({ ...state, smokeOk: false }), []);
  // stale 运行不产生任何判定
  assert.deepEqual(edgeProblems({ stale: true, smokeOk: true, edgeOk: false }), []);
  // 未知不放行：smoke 绿但 edge 结论缺失同样标红
  assert.equal(edgeProblems({ ...state, edgeOk: undefined }).length, 1);
  assert.deepEqual(edgeProblems({ ...state, edgeOk: true }), []);
});
