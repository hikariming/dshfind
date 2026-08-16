import assert from "node:assert/strict";
import test from "node:test";

import {
  gateProblems,
  healthyAPIResponse,
  healthySuggestionResponse,
  isRailwayChange,
  missingGateEnv,
  rollbackBoth,
  railwayHealthAnchor,
  railwayRollbackIsAvailable,
  railwayRollbackTarget,
  selectRailwayAnchor,
  selectVercelAnchor,
  shouldRollback,
  vercelRecoveryCommand,
} from "./deploy-gate.mjs";

const gateEnv = {
  VERCEL_TOKEN: "token",
  VERCEL_ORG_ID: "org",
  VERCEL_PROJECT_ID: "project",
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

test("Vercel anchor prefers the previous commit and never selects the current commit", () => {
  const deployments = [
    { uid: "current", readyState: "READY", meta: { githubCommitSha: "new" } },
    { uid: "older", readyState: "READY", meta: { githubCommitSha: "old" } },
  ];
  assert.equal(
    selectVercelAnchor({ deployments, beforeSha: "old", currentSha: "new" }).uid,
    "older",
  );
  assert.equal(
    selectVercelAnchor({ deployments: [deployments[0]], beforeSha: "old", currentSha: "new" }),
    null,
  );
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

test("Vercel recovery promotes the anchor without disabling Git auto-assignment", () => {
  assert.deepEqual(vercelRecoveryCommand("stable.vercel.app"), [
    "promote",
    "stable.vercel.app",
    "--yes",
    "--timeout",
    "10m",
  ]);
  assert.throws(() => vercelRecoveryCommand(""), /incomplete/);
});

test("only API source or railway config changes require a new Railway deployment", () => {
  assert.equal(isRailwayChange(["src/app/page.tsx", "README.md"]), false);
  assert.equal(isRailwayChange(["server/internal/httpapi/server.go"]), true);
  assert.equal(isRailwayChange(["railway.json"]), true);
});

test("a failed provider, smoke check, or CI verdict requires rollback", () => {
  const healthy = { verificationOk: true, vercelOk: true, railwayOk: true, smokeOk: true };
  assert.equal(shouldRollback(healthy), false);
  assert.match(gateProblems({ ...healthy, vercelOk: false })[0], /Vercel/);
  assert.match(gateProblems({ ...healthy, railwayOk: false })[0], /Railway/);
  assert.match(gateProblems({ ...healthy, smokeOk: false })[0], /smoke/);
  assert.match(gateProblems({ ...healthy, verificationOk: false })[0], /CI/);
});

test("a stale workflow does not roll back a newer main release", () => {
  assert.equal(
    shouldRollback({ stale: true, verificationOk: false, vercelOk: false, railwayOk: false }),
    false,
  );
});

test("rollback still attempts Railway when Vercel rollback fails", async () => {
  const calls = [];
  const result = await rollbackBoth({
    rollbackVercel: async () => {
      calls.push("vercel");
      throw new Error("Vercel API unavailable");
    },
    rollbackRailway: async () => {
      calls.push("railway");
      return "redeployed";
    },
  });
  assert.deepEqual(calls, ["vercel", "railway"]);
  assert.deepEqual(result.errors, ["Vercel rollback: Vercel API unavailable"]);
  assert.equal(result.results.railway, "redeployed");
});
