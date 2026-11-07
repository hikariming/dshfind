/**
 * 只读 ENTRY 证据的共享映射层。
 *
 * 两条路径共用这里的字段口径：
 *   - scripts/entry-check.mjs：每晚对已发布 npm 包跑一次静态检查并写库；
 *   - workers/api-edge/shared.mjs：详情接口把库里的行渲染成 `entry` 块。
 *
 * 本文件必须保持纯函数、零 Node API：api-edge Worker 会直接 import 它。
 * FLOW / BOOST 不在本阶段执行，输出恒为 not-run / not-measured；**任何报告
 * 字段都不能覆盖它们**。这里也刻意没有 score / grade 之类的字段。
 *
 * 措辞约定：`state` 只描述「有没有跑过检查」（checked / not_run），
 * 不写「合格 / 不合格」；checker 的原始结论只放在 `raw.status`。
 */

/** 钉死的 checker 版本；runner 装好后会核对实际版本，不一致就停止。 */
export const CHECKER_VERSION = "1.6.8";
/** 只从 npm 官方源取发布物，避免国内镜像的回源/缓存差异改变被检查的字节。 */
export const NPM_REGISTRY = "https://registry.npmjs.org/";
/** 本阶段所有记录都来自 npm 发布物，不 clone 源码。 */
export const ENTRY_SOURCE = "npm";
/** 静态 ENTRY 不产出 FLOW / BOOST 证据；这两个常量不可被报告覆盖。 */
export const FLOW_STATE = "not-run";
export const BOOST_STATE = "not-measured";
/** 库里只允许这两种运行状态；没有记录时由 emptyEntry() 给出 not_checked。 */
export const ENTRY_STATES = ["checked", "not_run"];

/** raw 只承载 checker 的原始结论，取值范围固定。 */
export const RAW_STATUSES = ["pass", "warn", "fail", "not_run"];
export const RAW_EXIT_CODES = [0, 1, 2];

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const stringList = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];

function reportStatus(report) {
  return isObject(report) && isObject(report.conclusion) ? report.conclusion.status : null;
}

function reportExitCode(report) {
  return isObject(report) && isObject(report.conclusion) ? report.conclusion.exitCode : null;
}

/** 原始结论归一化：任何不认识的字符串都落到 not_run，不伪造 pass/fail。 */
function normalizeRawStatus(value) {
  return value === "pass" || value === "warn" || value === "fail" ? value : "not_run";
}

function normalizeExitCode(value) {
  return Number.isInteger(value) && RAW_EXIT_CODES.includes(value) ? value : null;
}

/**
 * checker 是否真的跑完 → 库里的 state。四类报告：
 *   pass / warn / fail → checked（fail 也是跑完了，原始结论留给 raw）
 *   其它（含 exit 2 incomplete）→ not_run
 * 没有 JSON 的进程级失败不进入这里：runner 直接跳过该行，保留旧记录。
 */
export function stateForReport(report) {
  const status = reportStatus(report);
  return status === "pass" || status === "warn" || status === "fail" ? "checked" : "not_run";
}

/**
 * checker 的原始结论，只作为 entry.raw 出现。
 * status 归一化到 pass / warn / fail / not_run；exit_code 归一化到 0 / 1 / 2 / null。
 */
export function rawForReport(report) {
  return {
    status: normalizeRawStatus(reportStatus(report)),
    exit_code: normalizeExitCode(reportExitCode(report)),
  };
}

/**
 * dsh-standards 的 JSON 报告 → 可入库的 entry 记录。
 *
 * `meta.dir` 必须来自 probe:install 的 npm_repo_directory，而不是报告里的
 * `subject.path`（那是 runner 的临时目录，不能进公共响应）。
 * 报告结构不符合预期时抛错；调用方按单行失败处理，不写库。
 */
export function mapReport(report, { checkedAt, dir = null } = {}) {
  if (!isObject(report)) throw new TypeError("entry report is not an object");
  if (!isObject(report.subject)) throw new TypeError("entry report has no subject");
  if (!isObject(report.conclusion)) throw new TypeError("entry report has no conclusion");
  const name = report.subject.name;
  const version = report.subject.version;
  const kind = report.subject.kind;
  const status = reportStatus(report);
  if (typeof name !== "string" || name === "") throw new TypeError("entry report subject.name missing");
  if (typeof version !== "string" || version === "") throw new TypeError("entry report subject.version missing");
  if (typeof kind !== "string" || kind === "") throw new TypeError("entry report subject.kind missing");
  if (typeof status !== "string" || status === "") throw new TypeError("entry report conclusion.status missing");
  if (typeof checkedAt !== "string" || checkedAt === "") throw new TypeError("checkedAt is required");

  const blocking = isObject(report.coverage?.entryBlocking) ? report.coverage.entryBlocking : {};
  const anchorCommit = isObject(report.anchor) ? report.anchor.commit : null;
  const commit =
    typeof anchorCommit === "string" && /^[0-9a-f]{7,64}$/i.test(anchorCommit) ? anchorCommit : null;

  const subject = { name, version, kind };
  if (typeof dir === "string" && dir !== "") subject.dir = dir;

  return {
    state: stateForReport(report),
    checked_at: checkedAt,
    checker_version: CHECKER_VERSION,
    ...(commit === null ? {} : { commit }),
    source: ENTRY_SOURCE,
    subject,
    raw: rawForReport(report),
    // 原样保留 checker 的 blocking 结论，尤其是 pass=false：静态运行不会因为
    // raw.status 是 pass/warn 就把它改写成 true（C-3 等必需项可能没跑）。
    entry_blocking: {
      pass: blocking.pass === true,
      checked: stringList(blocking.checked),
      not_checked: stringList(blocking.notChecked),
    },
    not_checked: Array.isArray(report.notChecked)
      ? report.notChecked
          .filter((item) => isObject(item) && typeof item.id === "string")
          .map((item) => ({ id: item.id, reason: typeof item.reason === "string" ? item.reason : "" }))
      : [],
    flow: FLOW_STATE,
    boost: BOOST_STATE,
  };
}

/**
 * 检查没有跑成（npm pack / checker 进程失败）时的占位记录。写它不是为了
 * 冒充结论，而是让滚动队列把这一行当成「本版本已尝试过」，30 天内不再
 * 反复占用 limit；没有 JSON 的报告不会走到这里，调用方只保留旧记录。
 */
export function notRunEntry({ name, version, checkedAt, dir = null } = {}) {
  if (typeof name !== "string" || name === "") throw new TypeError("name is required");
  if (typeof version !== "string" || version === "") throw new TypeError("version is required");
  if (typeof checkedAt !== "string" || checkedAt === "") throw new TypeError("checkedAt is required");
  const subject = { name, version, kind: "unknown" };
  if (typeof dir === "string" && dir !== "") subject.dir = dir;
  return {
    state: "not_run",
    checked_at: checkedAt,
    checker_version: CHECKER_VERSION,
    source: ENTRY_SOURCE,
    subject,
    raw: { status: "not_run", exit_code: null },
    entry_blocking: { pass: false, checked: [], not_checked: [] },
    not_checked: [],
    flow: FLOW_STATE,
    boost: BOOST_STATE,
  };
}

/** 没有记录时的公共形状：保留稳定字段，时间/版本/raw 为 null。 */
export function emptyEntry() {
  return {
    state: "not_checked",
    checked_at: null,
    checker_version: null,
    source: null,
    subject: null,
    raw: null,
    entry_blocking: null,
    not_checked: [],
    flow: FLOW_STATE,
    boost: BOOST_STATE,
  };
}

function parseJsonArray(value) {
  if (typeof value !== "string" || value === "") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * D1 行 → 详情接口的 `entry` 块。缺表/查询失败时调用方传 null，得到 not_checked。
 * flow / boost 只认常量，表里即使有同名字段也读不到，防止报告数据覆盖它们。
 */
export function rowToEntry(row) {
  if (!isObject(row)) return emptyEntry();
  const subject = {
    name: row.subject_name ?? null,
    version: row.subject_version ?? null,
    kind: row.subject_kind ?? null,
  };
  if (typeof row.subject_dir === "string" && row.subject_dir !== "") subject.dir = row.subject_dir;
  const commit = typeof row.anchor_commit === "string" && row.anchor_commit !== "" ? row.anchor_commit : null;
  return {
    state: ENTRY_STATES.includes(row.state) ? row.state : "not_run",
    checked_at: row.checked_at ?? null,
    checker_version: row.checker_version ?? null,
    ...(commit === null ? {} : { commit }),
    source: row.source ?? null,
    subject,
    raw: {
      status: normalizeRawStatus(row.conclusion_status),
      exit_code: normalizeExitCode(row.exit_code),
    },
    entry_blocking: {
      pass: Number(row.blocking_pass) === 1,
      checked: parseJsonArray(row.blocking_checked),
      not_checked: parseJsonArray(row.blocking_not_checked),
    },
    not_checked: parseJsonArray(row.not_checked),
    flow: FLOW_STATE,
    boost: BOOST_STATE,
  };
}
