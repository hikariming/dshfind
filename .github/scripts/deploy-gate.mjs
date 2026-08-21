#!/usr/bin/env node
// Railway(Go API) 自动 Git 发布的生产 Gate。
//
// Railway 仍从 main 自动构建；本脚本不主动发布。它只记录健康锚点、等待当前 SHA
// 的自动部署、做生产冒烟，并在任一环节失败时把 API 恢复到锚点。
//
// 前端不在范围内：站点已从 Vercel 迁到 Cloudflare Workers，由 Workers Builds 从
// main 自动构建。冒烟仍请求 PROD_WEB_URL,但那只证明站点在服务,不证明当前 commit
// 已上线——CF 构建失败时旧版本继续服务,冒烟照样通过。前端回滚是人工动作
// (`wrangler rollback`),有意不做自动化:Worker 版本回滚不会同时回滚 R2 里的
// ISR 缓存,自动化反而容易造出"新缓存配旧代码"的错配。
//
// Turso 是共享数据源,不属于此处的回滚范围;schema 迁移必须保持向后兼容。

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  gateProblems,
  healthyAPIResponse,
  healthySuggestionResponse,
  isRailwayChange,
  missingGateEnv,
  railwayHealthAnchor,
  railwayRollbackIsAvailable,
  railwayRollbackTarget,
} from "../../scripts/lib/deploy-gate.mjs";

const RAILWAY_GQL = "https://backboard.railway.app/graphql/v2";
const STATE_PATH = path.join(
  process.env.GITHUB_WORKSPACE || process.cwd(),
  ".deploy-gate-state.json",
);
const POLL_MS = numberEnv("DEPLOY_GATE_POLL_MS", 20_000);
const RAILWAY_TIMEOUT_MS = numberEnv("DEPLOY_GATE_RAILWAY_TIMEOUT_MS", 30 * 60 * 1_000);
const ROLLBACK_TIMEOUT_MS = numberEnv("DEPLOY_GATE_ROLLBACK_TIMEOUT_MS", 10 * 60 * 1_000);

function numberEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function required(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`missing required environment variable ${name}`);
  return value.trim();
}

function assertConfiguration() {
  const missing = missingGateEnv(process.env);
  if (missing.length) {
    throw new Error(`missing required production Environment configuration: ${missing.join(", ")}`);
  }
}

function readState() {
  if (!existsSync(STATE_PATH)) return {};
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

function writeState(patch) {
  const state = { ...readState(), ...patch };
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

function setOutput(name, value) {
  const rendered = String(value).replace(/[\r\n]/g, " ");
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${rendered}\n`);
  console.log(`[output] ${name}=${rendered}`);
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15_000) });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${options.method ?? "GET"} ${url}: expected JSON, got HTTP ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${url}: HTTP ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function railwayGql(query, variables) {
  const body = await requestJSON(RAILWAY_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Project-Access-Token": required("RAILWAY_TOKEN"),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (body?.errors?.length) throw new Error(`Railway GraphQL: ${JSON.stringify(body.errors)}`);
  if (!body?.data) throw new Error("Railway GraphQL returned no data");
  return body.data;
}

async function railwayDeployments() {
  const data = await railwayGql(
    `query($input: DeploymentListInput!) {
       deployments(first: 20, input: $input) {
         edges { node { id status createdAt canRollback } }
       }
     }`,
    {
      input: {
        projectId: required("RAILWAY_PROJECT_ID"),
        environmentId: required("RAILWAY_ENVIRONMENT_ID"),
        serviceId: required("RAILWAY_SERVICE_ID"),
      },
    },
  );
  return data.deployments.edges.map((edge) => edge.node);
}

/** Read the exact deployment that healthz identified, rather than trusting list ordering. */
async function railwayDeployment(id) {
  const data = await railwayGql(
    `query($id: String!) {
       deployment(id: $id) { id status canRollback }
     }`,
    { id },
  );
  return data.deployment ?? null;
}

function terminalRailwayFailure(status) {
  return ["FAILED", "CRASHED", "REMOVED", "SKIPPED"].includes(status);
}

async function waitForRailwayCommit(expectedCommit, timeoutMs = RAILWAY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let observedCommit = "missing";
  let lastError = null;
  const apiURL = new URL(required("PROD_API_URL"));
  while (Date.now() < deadline) {
    try {
      const health = await smokeJSON(new URL("/healthz", apiURL));
      observedCommit = typeof health?.commit_sha === "string" ? health.commit_sha : "missing";
      if (healthyAPIResponse(health, expectedCommit)) return health;
    } catch (error) {
      lastError = error;
    }
    await sleep(POLL_MS);
  }
  const detail = lastError ? `; last health error: ${lastError.message}` : "";
  throw new Error(`timed out waiting for Railway to serve commit ${expectedCommit}; last observed ${observedCommit}${detail}`);
}

async function waitForRailwayDeployment(id, timeoutMs = ROLLBACK_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const deployment = (await railwayDeployments()).find((candidate) => candidate.id === id);
    if (deployment?.status === "SUCCESS") return deployment;
    if (deployment && terminalRailwayFailure(deployment.status)) {
      throw new Error(`Railway rollback deployment ${id} reached ${deployment.status}`);
    }
    await sleep(POLL_MS);
  }
  throw new Error(`timed out waiting for Railway deployment ${id}`);
}

function currentMainHead() {
  const mainHead = git(["ls-remote", "origin", "refs/heads/main"]).split(/\s+/)[0];
  if (!mainHead) throw new Error("could not determine the current origin/main SHA");
  return mainHead;
}

function changedFiles(beforeSha, currentSha) {
  return git(["diff", "--name-only", beforeSha, currentSha])
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function commandAnchors() {
  assertConfiguration();
  const preflight = process.env.DEPLOY_GATE_MODE === "preflight";
  const currentSha = required("GITHUB_SHA");
  const beforeSha = process.env.BEFORE_SHA?.trim() || git(["rev-parse", "HEAD~1"]);
  const mainHead = currentMainHead();
  if (mainHead !== currentSha) {
    console.log(`stale run: ${currentSha} is no longer main HEAD (${mainHead}); skipping`);
    writeState({ stale: true, currentSha, beforeSha });
    setOutput("stale", "true");
    return;
  }

  const files = changedFiles(beforeSha, currentSha);
  const railwayExpected = isRailwayChange(files);
  const health = await smokeJSON(new URL("/healthz", new URL(required("PROD_API_URL"))));
  const healthAnchor = railwayHealthAnchor(health);
  if (!healthAnchor || !healthyAPIResponse(health, healthAnchor.commitSHA)) {
    throw new Error("current Railway health response lacks a healthy commit_sha; refusing to capture an unverifiable rollback anchor");
  }
  const railwayAnchor = await railwayDeployment(healthAnchor.deploymentID);
  if (railwayAnchor?.id !== healthAnchor.deploymentID || railwayAnchor.status !== "SUCCESS") {
    throw new Error("the Railway deployment serving healthz is not a SUCCESS deployment in the control plane; refusing an unsafe rollback anchor");
  }
  if (!preflight && railwayExpected && healthAnchor.commitSHA === currentSha) {
    throw new Error("Railway already serves the current commit before the previous anchor was captured; refusing an unsafe rollback");
  }
  if (!preflight && railwayExpected && !railwayRollbackIsAvailable(railwayAnchor, {
    deploymentID: healthAnchor.deploymentID,
  })) {
    throw new Error("the Railway deployment serving healthz is not currently canRollback; refusing a release without a recoverable API anchor");
  }
  writeState({
    stale: false,
    preflight,
    currentSha,
    beforeSha,
    railwayExpected,
    railway: { anchorID: railwayAnchor.id, anchorCommitSha: healthAnchor.commitSHA },
  });
  console.log(
    `anchor captured: Railway=${railwayAnchor.id} (${healthAnchor.commitSHA})`,
  );
  setOutput("stale", "false");
}

async function commandObserve() {
  const state = readState();
  if (state.stale) {
    setOutput("ok", "true");
    return;
  }
  const verificationOk = process.env.VERIFY_OK === "true";
  let railwayOk = false;
  const errors = [];

  if (!state.railwayExpected) {
    railwayOk = true;
    console.log("no server/** or railway.json change; keeping the Railway anchor deployment");
  } else {
    try {
      await waitForRailwayCommit(state.currentSha);
      railwayOk = true;
      console.log(`Railway production serves expected commit: ${state.currentSha}`);
    } catch (error) {
      errors.push(`Railway: ${error.message}`);
      console.error(errors.at(-1));
    }
  }

  writeState({ verificationOk, railwayOk, observeErrors: errors });
  setOutput("ok", String(verificationOk && railwayOk));
}

async function smokeRequest(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${url} returned HTTP ${response.status}`);
  return response;
}

async function smokeJSON(url, options = {}) {
  const response = await smokeRequest(url, options);
  try {
    return await response.json();
  } catch {
    throw new Error(`${options.method ?? "GET"} ${url} did not return JSON`);
  }
}

async function runSmoke({ expectedRailwayCommit }) {
  const webURL = new URL(required("PROD_WEB_URL"));
  const apiURL = new URL(required("PROD_API_URL"));
  await smokeRequest(webURL);

  const health = await smokeJSON(new URL("/healthz", apiURL));
  if (!healthyAPIResponse(health, expectedRailwayCommit)) {
    throw new Error(`API healthz is not ready on expected Railway commit ${expectedRailwayCommit}`);
  }

  const suggestion = await smokeJSON(new URL("/v1/suggest?q=dsh", apiURL));
  if (!healthySuggestionResponse(suggestion)) throw new Error("API suggest response is missing items[]");

  const graph = await smokeJSON(new URL("/graphql", apiURL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "{ plugins(first: 1) { totalCount nodes { fullName } } }",
    }),
  });
  const plugins = graph?.data?.plugins;
  if (
    graph?.errors?.length ||
    !Number.isInteger(plugins?.totalCount) ||
    plugins.totalCount < 1 ||
    !Array.isArray(plugins.nodes) ||
    typeof plugins.nodes[0]?.fullName !== "string"
  ) {
    throw new Error("public GraphQL plugin query is not healthy");
  }
}

async function commandSmoke() {
  const state = readState();
  if (state.stale) {
    setOutput("ok", "true");
    return;
  }
  if (state.verificationOk !== true || state.railwayOk !== true) {
    writeState({ smokeOk: false, smokeError: "skipped because a prior gate check failed" });
    setOutput("ok", "false");
    return;
  }
  try {
    await runSmoke({
      expectedRailwayCommit: state.railwayExpected ? state.currentSha : state.railway.anchorCommitSha,
    });
    writeState({ smokeOk: true });
    setOutput("ok", "true");
    console.log("production smoke check passed");
  } catch (error) {
    writeState({ smokeOk: false, smokeError: error.message });
    setOutput("ok", "false");
    console.error(`production smoke check failed: ${error.message}`);
  }
}

async function commandVerdict() {
  const state = readState();
  const problems = gateProblems(state);
  if (!problems.length) {
    setOutput("rollback", "none");
    console.log(state.stale ? "stale run skipped" : "production gate passed");
    return;
  }
  setOutput("rollback", "needed");
  console.error(`production gate failed: ${problems.join("; ")}`);
  process.exitCode = 1;
}

/**
 * Recheck just before either provider is mutated. `canRollback` is dynamic, so the
 * capture-time proof cannot substitute for this final control-plane check.
 */
async function assertRailwayRollbackAvailable(railway) {
  const target = railwayRollbackTarget(railway);
  const deployment = await railwayDeployment(target.deploymentID);
  if (!railwayRollbackIsAvailable(deployment, target)) {
    throw new Error(
      `Railway anchor ${target.deploymentID} is not an available rollback target (requires SUCCESS and canRollback=true)`,
    );
  }
  return target;
}

async function rollbackRailway({ expected, railway }) {
  const target = railwayRollbackTarget(railway);
  if (!expected) {
    // 前端提交不会穿过 railway.json 的 watch pattern；服务仍是锚点代码，不能
    // 为了“同步回滚”制造一次无意义且有风险的 API 重启。
    console.log("Railway source did not change; retaining its existing healthy deployment");
    await waitForRailwayCommit(target.commitSHA, ROLLBACK_TIMEOUT_MS);
    return (await railwayDeployments())[0];
  }
  // Railway 官方 API 直接回滚到已记录的部署 ID，不能用 main 父提交猜测版本：
  // 前端提交、队列延迟和外部 redeploy 都可能让 parent SHA 不等于健康锚点。
  const data = await railwayGql(
    `mutation($id: String!) {
       deploymentRollback(id: $id) { id }
     }`,
    { id: target.deploymentID },
  );
  const deploymentID = data.deploymentRollback?.id;
  if (typeof deploymentID !== "string" || !deploymentID) {
    throw new Error("Railway did not return a rollback deployment ID");
  }
  console.log(`Railway rolling back to ${target.deploymentID} (${target.commitSHA}) as ${deploymentID}`);
  await waitForRailwayDeployment(deploymentID);
  await waitForRailwayCommit(target.commitSHA, ROLLBACK_TIMEOUT_MS);
  return deploymentID;
}

async function commandRollback() {
  const state = readState();
  if (state.stale) return;
  const mainHead = currentMainHead();
  if (mainHead !== state.currentSha) {
    const message = `main advanced to ${mainHead}; refusing to let stale ${state.currentSha} roll back a newer release`;
    writeState({ stale: true, rollbackOk: false, rollbackErrors: [message] });
    setOutput("ok", "false");
    throw new Error(message);
  }
  if (!state.railway?.anchorID) {
    throw new Error("no Railway rollback anchor was captured; refusing an unsafe rollback");
  }
  if (state.railwayExpected) {
    try {
      await assertRailwayRollbackAvailable(state.railway);
    } catch (error) {
      const message = `Railway rollback preflight: ${error.message}`;
      writeState({ rollbackOk: false, rollbackErrors: [message] });
      setOutput("ok", "false");
      console.error(message);
      console.error(
        `manual recovery anchor: Railway deployment=${state.railway.anchorID}, commit=${state.railway.anchorCommitSha}`,
      );
      throw error;
    }
  }
  const errors = [];
  try {
    await rollbackRailway({ expected: state.railwayExpected, railway: state.railway });
  } catch (error) {
    errors.push(`Railway rollback: ${error.message}`);
  }
  // 回滚后仍要冒烟：恢复到锚点不等于锚点此刻依然健康。
  if (!errors.length) {
    try {
      await runSmoke({ expectedRailwayCommit: state.railway.anchorCommitSha });
      console.log("rollback production smoke check passed");
    } catch (error) {
      errors.push(`rollback smoke check: ${error.message}`);
    }
  }
  writeState({ rollbackOk: errors.length === 0, rollbackErrors: errors });
  setOutput("ok", String(errors.length === 0));
  if (errors.length) {
    console.error(`rollback incomplete: ${errors.join("; ")}`);
    console.error(
      `manual recovery anchor: Railway deployment=${state.railway.anchorID}, commit=${state.railway.anchorCommitSha}`,
    );
    process.exitCode = 1;
  }
}

async function commandReport() {
  const state = readState();
  if (!Object.keys(state).length) throw new Error("no deployment gate state has been captured");
  console.log(JSON.stringify(state, null, 2));
}

const commands = {
  anchors: commandAnchors,
  observe: commandObserve,
  smoke: commandSmoke,
  verdict: commandVerdict,
  rollback: commandRollback,
  report: commandReport,
};

const command = process.argv[2];
if (!commands[command]) {
  console.error(`expected one of: ${Object.keys(commands).join(", ")}`);
  process.exit(2);
}

commands[command]().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
