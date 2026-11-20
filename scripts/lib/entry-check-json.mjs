/**
 * ENTRY runner 的跨 job JSON 契约。
 *
 * 拆分后的流水线：
 *   entry-candidates（有 D1 token，只读候选）→ entry-check（无 secret，npm pack
 *   + checker，上传结果）→ entry-upsert（有 D1 token，只校验 + 写库）。
 *
 * 这个模块是纯函数，负责把候选/结果序列化并拒绝形状不对的数据；它不碰
 * D1、npm 或文件系统，方便单测，也避免 token job 里出现任意第三方代码。
 */
import {
  CHECKER_VERSION,
  ENTRY_STATES,
  RAW_EXIT_CODES,
  RAW_STATUSES,
} from "./entry-check.mjs";

export const CANDIDATES_SCHEMA = 1;
export const RESULTS_SCHEMA = 1;

const PACKAGE_NAME_RE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const VERSION_RE = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const FULL_NAME_RE = /^[^/\s]+\/[^/\s]+$/;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isString = (value) => typeof value === "string";
const isStringArray = (value) => Array.isArray(value) && value.every(isString);

function fail(message) {
  throw new TypeError(message);
}

function assertCandidate(item) {
  if (!isObject(item)) fail("candidate is not an object");
  if (!isString(item.full_name) || !FULL_NAME_RE.test(item.full_name)) fail("candidate.full_name is invalid");
  if (!isString(item.pkg_name) || !PACKAGE_NAME_RE.test(item.pkg_name)) fail("candidate.pkg_name is invalid");
  if (!isString(item.npm_latest_version) || !VERSION_RE.test(item.npm_latest_version)) {
    fail("candidate.npm_latest_version is invalid");
  }
  const dir = item.npm_repo_directory ?? null;
  const last = item.last_pkg_version ?? null;
  if (dir !== null && !isString(dir)) fail("candidate.npm_repo_directory is invalid");
  if (last !== null && !isString(last)) fail("candidate.last_pkg_version is invalid");
  return {
    full_name: item.full_name,
    pkg_name: item.pkg_name,
    npm_latest_version: item.npm_latest_version,
    npm_repo_directory: dir,
    last_pkg_version: last,
  };
}

/** 只把 runner 真正需要的字段带进无 secret job，避免把整行数据库数据复制过去。 */
export function makeCandidatesDocument(rows, { generatedAt = new Date().toISOString() } = {}) {
  return {
    schema: CANDIDATES_SCHEMA,
    generated_at: generatedAt,
    checker_version: CHECKER_VERSION,
    candidates: rows.map(assertCandidate),
  };
}

export function parseCandidatesDocument(doc) {
  if (!isObject(doc) || doc.schema !== CANDIDATES_SCHEMA) fail("candidates schema is invalid");
  if (!isString(doc.generated_at) || Number.isNaN(Date.parse(doc.generated_at))) {
    fail("candidates.generated_at is invalid");
  }
  if (doc.checker_version !== CHECKER_VERSION) fail("candidates.checker_version does not match this runner");
  if (!Array.isArray(doc.candidates)) fail("candidates.candidates is not an array");
  return doc.candidates.map(assertCandidate);
}

function assertEntry(entry, candidate) {
  if (!isObject(entry)) fail("result.entry is not an object");
  if (entry.checker_version !== CHECKER_VERSION) fail("result.entry.checker_version does not match this runner");
  if (!ENTRY_STATES.includes(entry.state)) fail("result.entry.state is invalid");
  if (!isString(entry.checked_at) || Number.isNaN(Date.parse(entry.checked_at))) {
    fail("result.entry.checked_at is invalid");
  }
  if (entry.source !== "npm") fail("result.entry.source is invalid");
  if (!isObject(entry.subject)) fail("result.entry.subject is invalid");
  if (entry.subject.name !== candidate.pkg_name) fail("result.entry.subject.name does not match candidate");
  if (entry.subject.version !== candidate.npm_latest_version) {
    fail("result.entry.subject.version does not match candidate");
  }
  if (!isString(entry.subject.kind) || entry.subject.kind === "") fail("result.entry.subject.kind is invalid");
  if (entry.subject.dir !== undefined && !isString(entry.subject.dir)) fail("result.entry.subject.dir is invalid");
  if (entry.commit !== undefined && (typeof entry.commit !== "string" || !/^[0-9a-f]{7,64}$/i.test(entry.commit))) {
    fail("result.entry.commit is invalid");
  }
  if (!isObject(entry.raw)) fail("result.entry.raw is invalid");
  if (!RAW_STATUSES.includes(entry.raw.status)) fail("result.entry.raw.status is invalid");
  if (entry.raw.exit_code !== null && !RAW_EXIT_CODES.includes(entry.raw.exit_code)) {
    fail("result.entry.raw.exit_code is invalid");
  }
  if (!isObject(entry.entry_blocking)) fail("result.entry.entry_blocking is invalid");
  if (typeof entry.entry_blocking.pass !== "boolean") fail("result.entry.entry_blocking.pass is invalid");
  if (!isStringArray(entry.entry_blocking.checked)) fail("result.entry.entry_blocking.checked is invalid");
  if (!isStringArray(entry.entry_blocking.not_checked)) fail("result.entry.entry_blocking.not_checked is invalid");
  if (!Array.isArray(entry.not_checked)) fail("result.entry.not_checked is invalid");
  if (!entry.not_checked.every((item) => isObject(item) && isString(item.id) && isString(item.reason))) {
    fail("result.entry.not_checked items are invalid");
  }
  if (entry.flow !== "not-run" || entry.boost !== "not-measured") {
    fail("result.entry must not claim FLOW or BOOST");
  }
}

function assertResult(item) {
  if (!isObject(item)) fail("result is not an object");
  const candidate = assertCandidate({
    full_name: item.full_name,
    pkg_name: item.pkg_name,
    npm_latest_version: item.npm_latest_version,
    npm_repo_directory: item.npm_repo_directory,
    last_pkg_version: item.last_pkg_version,
  });
  assertEntry(item.entry, candidate);
  return { ...candidate, entry: item.entry };
}

export function makeResultsDocument(results, { generatedAt = new Date().toISOString() } = {}) {
  return {
    schema: RESULTS_SCHEMA,
    generated_at: generatedAt,
    checker_version: CHECKER_VERSION,
    results: results.map(assertResult),
  };
}

/** token job 只接受通过校验的结果；形状不对直接失败，不写半截数据。 */
export function parseResultsDocument(doc) {
  if (!isObject(doc) || doc.schema !== RESULTS_SCHEMA) fail("results schema is invalid");
  if (!isString(doc.generated_at) || Number.isNaN(Date.parse(doc.generated_at))) {
    fail("results.generated_at is invalid");
  }
  if (doc.checker_version !== CHECKER_VERSION) fail("results.checker_version does not match this runner");
  if (!Array.isArray(doc.results)) fail("results.results is not an array");
  return doc.results.map(assertResult);
}

const identityOf = (item) => `${item.full_name}\u0000${item.pkg_name}\u0000${item.npm_latest_version}`;

/** token job 只接受候选清单里的行，防止被污染的 results artifact 写入新条目。 */
export function assertResultsMatchCandidates(results, candidates) {
  const allowed = new Set(candidates.map(identityOf));
  for (const result of results) {
    if (!allowed.has(identityOf(result))) fail(`result is not in the candidate list: ${identityOf(result)}`);
  }
}
