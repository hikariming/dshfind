#!/usr/bin/env node
/**
 * 为「已确认插件 + 已发布 npm 包」生成只读 ENTRY 证据，写入 plugin_entry_checks。
 *
 * 设计约束（PR 阶段 1）：
 *   - 只检查 npm 发布物：npm pack --ignore-scripts 精确版本，解包后跑 checker；
 *     绝不 clone 源码（源码仓常常缺 lib/，会得到假失败）。
 *   - checker 钉死 dsh-standards@1.6.8，registry 钉死 registry.npmjs.org。
 *   - 静态 ENTRY：--scope entry --entry-claim static --no-exec，不执行被检代码。
 *   - 单行失败只记日志，不让整轮 job 失败；进程正常收尾时 exit 0。
 *   - 不写 plugins / 评分 / 排序 / 徽章 / i18n / snapshots，只 upsert 本表。
 *
 * 用法：
 *   pnpm entry:check                        # 滚动检查（版本变化优先 + 30 天 TTL）
 *   pnpm entry:check --limit 400 --deadline 20
 *   pnpm entry:check --only iqingyoung/429-throttle-mcp --dry-run
 *   node scripts/entry-check.mjs --ensure-schema   # 只建表后退出（部署前用）
 *
 * npm pack 的网络与解包都在 os.tmpdir() 的一次性目录里完成，结束即删除。
 */
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { openDb } from "./lib/db.mjs";
import { CHECKER_VERSION, NPM_REGISTRY, mapReport, notRunEntry } from "./lib/entry-check.mjs";
import { assertResultsMatchCandidates, makeCandidatesDocument, makeResultsDocument, parseCandidatesDocument, parseResultsDocument } from "./lib/entry-check-json.mjs";
import { childEnv } from "./lib/process-env.mjs";

const exec = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

const DEFAULT_LIMIT = 300;
const DEFAULT_STALE_DAYS = 30;
const DEFAULT_DEADLINE_MINUTES = 20;
const DEFAULT_CONCURRENCY = 4;
const PACK_TIMEOUT_MS = 120_000;
const CHECK_TIMEOUT_MS = 150_000;

// probe:install 只采信精确稳定版本；这里再校验一次，避免把库里的脏值拼进
// npm 参数（execFile 不经过 shell，但仍不该把非法值送进 registry）。
const PACKAGE_NAME_RE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const VERSION_RE = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;

// ---------- 参数 ----------

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const opt = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [argv[i + 1]] : []));
const dryRun = has("--dry-run");
const ensureSchemaOnly = has("--ensure-schema");
const emitCandidatesFile = opt("--emit-candidates", "");
const fromCandidatesFile = opt("--from-candidates", "");
const resultsFile = opt("--results", "");
const upsertResultsFile = opt("--upsert-results", "");
const upsertCandidatesFile = opt("--candidates", "");
const limit = Math.max(0, Number(opt("--limit", String(DEFAULT_LIMIT))) || 0);
const staleDays = Math.max(0, Number(opt("--stale-days", String(DEFAULT_STALE_DAYS))) || 0);
// 首次失败的行不要锁满 30 天：3 天后重试，避免一次网络抖动长期留下 not_run。
const RETRY_NOT_RUN_DAYS = 3;
const deadlineMinutes = Math.max(0, Number(opt("--deadline", String(DEFAULT_DEADLINE_MINUTES))) || 0);
const concurrency = Math.max(1, Number(opt("--concurrency", String(DEFAULT_CONCURRENCY))) || 1);
const deadlineAt = deadlineMinutes > 0 ? Date.now() + deadlineMinutes * 60_000 : null;
const pastDeadline = () => deadlineAt !== null && Date.now() >= deadlineAt;

if (has("--help") || has("-h")) {
  console.log(`entry-check — read-only static ENTRY evidence for published npm packages

Usage:
  node scripts/entry-check.mjs [--only owner/repo ...] [--dry-run]
  node scripts/entry-check.mjs --ensure-schema
  node scripts/entry-check.mjs --emit-candidates <file>              # D1 token；只读候选
  node scripts/entry-check.mjs --from-candidates <file> --results <file>  # 无 secret；pack + checker
  node scripts/entry-check.mjs --upsert-results <file> [--candidates <file>]  # D1 token；只校验 + 写库

Options:
  --only <owner/repo>  target one repository (repeatable; ignores the TTL filter)
  --limit <n>          max packages this run (default ${DEFAULT_LIMIT}; 0 = unlimited)
  --stale-days <n>     re-check unchanged versions after n days (default ${DEFAULT_STALE_DAYS})
  --deadline <min>     stop starting new packages after n minutes (default ${DEFAULT_DEADLINE_MINUTES})
  --concurrency <n>    parallel packages (default ${DEFAULT_CONCURRENCY})
  --dry-run            run npm pack + checker, print the mapping, write nothing
  --ensure-schema      create plugin_entry_checks if missing, then exit
  --help               show this help`);
  process.exit(0);
}

// ---------- 小工具 ----------

const sqlStatements = (text) =>
  text
    .replace(/^\s*--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

/** npm 在 Windows 上是 npm.cmd；POSIX 直接 npm。 */
const npmBin = () => (process.platform === "win32" ? "npm.cmd" : "npm");

function messageOf(err) {
  const stderr = typeof err?.stderr === "string" ? err.stderr.trim().split("\n").slice(-2).join(" ") : "";
  const text = stderr || String(err?.message ?? err);
  return text.length > 300 ? `${text.slice(0, 297)}...` : text;
}

/**
 * 把 checker 装进本轮的一次性临时目录，而不是加进仓库依赖：一次安装、
 * 全部包复用，版本与 registry 都在这里钉死，也不会让每日 job 之外的
 * install 变慢。npm 缓存命中时约 0.3s。
 */
async function prepareChecker(workRoot) {
  const prefix = join(workRoot, "checker");
  await exec(
    npmBin(),
    [
      "install",
      "--prefix",
      prefix,
      "--no-save",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      `--registry=${NPM_REGISTRY}`,
      `dsh-standards@${CHECKER_VERSION}`,
    ],
    {
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
      env: childEnv({
        npm_config_registry: NPM_REGISTRY,
        npm_config_ignore_scripts: "true",
        npm_config_update_notifier: "false",
        npm_config_loglevel: "error",
      }),
    },
  );
  const pkgDir = join(prefix, "node_modules", "dsh-standards");
  const version = JSON.parse(await readFile(join(pkgDir, "package.json"), "utf8")).version;
  if (version !== CHECKER_VERSION) {
    throw new Error(`dsh-standards ${version} installed, expected ${CHECKER_VERSION}`);
  }
  return join(pkgDir, "bin", "dsh-standards.mjs");
}

async function ensureSchema(db) {
  const file = join(root, "migrations", "0002_plugin_entry_checks.sql");
  const statements = sqlStatements(await readFile(file, "utf8"));
  for (const sql of statements) await db.execute(sql);
  console.log(`schema: plugin_entry_checks ensured (${statements.length} statements)`);
}

// ---------- 候选行 ----------

/**
 * 只取 is_plugin=1 且有 npm 发布事实的行。`npm_latest_version` 为空的
 * （未发布 / 只有 prerelease / 探测没问出来）不写任何记录，详情接口自然
 * 回落成 not_checked；这里绝不去 clone 源码补检查。
 */
async function fetchCandidates(db, now) {
  let sql = `SELECT p.full_name, p.pkg_name, p.npm_latest_version, p.npm_repo_directory,
                    p.stars, c.pkg_version AS last_pkg_version
             FROM plugins p
             LEFT JOIN plugin_entry_checks c ON c.full_name = p.full_name
             WHERE p.is_present = 1 AND p.is_offtopic = 0
               AND p.is_plugin = 1 AND p.npm_published = 1
               AND p.pkg_name IS NOT NULL AND p.npm_latest_version IS NOT NULL`;
  const args = [];
  if (only.length > 0) {
    sql += ` AND lower(p.full_name) IN (${only.map(() => "?").join(",")})`;
    args.push(...only.map((s) => s.toLowerCase()));
  } else {
    // 版本或 checker 变了优先重查；not_run 3 天后重试；其余按 30 天 TTL 滚动。
    const cutoff = new Date(now - staleDays * 86_400_000).toISOString();
    const retryCutoff = new Date(now - RETRY_NOT_RUN_DAYS * 86_400_000).toISOString();
    sql += ` AND (c.full_name IS NULL OR c.checked_at IS NULL OR c.checked_at < ?
              OR c.pkg_version IS NULL OR c.pkg_version != p.npm_latest_version
              OR c.checker_version IS NULL OR c.checker_version != ?
              OR (c.state = 'not_run' AND c.checked_at < ?))`;
    args.push(cutoff, CHECKER_VERSION, retryCutoff);
  }
  // 先版本变化 / 从未检查，再最久没查的；同组内 star 高的先查。
  // checker 升级后旧行也要重查：否则 API 会长期混发两个 checker 版本。
  sql += ` ORDER BY
             CASE WHEN c.full_name IS NULL OR c.pkg_version IS NULL
                       OR c.pkg_version != p.npm_latest_version
                       OR c.checker_version IS NULL OR c.checker_version != ? THEN 0 ELSE 1 END,
             COALESCE(c.checked_at, '') ASC,
             p.stars DESC`;
  args.push(CHECKER_VERSION);
  if (limit > 0) {
    sql += " LIMIT ?";
    args.push(limit);
  }
  const { rows } = await db.execute({ sql, args });
  return rows ?? [];
}

function isEligible(row) {
  const name = typeof row.pkg_name === "string" ? row.pkg_name : "";
  const version = typeof row.npm_latest_version === "string" ? row.npm_latest_version : "";
  return PACKAGE_NAME_RE.test(name) && VERSION_RE.test(version);
}

// ---------- 单个包 ----------

/** 校验 tar 条目，避免发布物里的 ../ 把解包写到临时目录之外。 */
function assertSafeTarEntries(listing, fullName) {
  for (const raw of listing.split("\n")) {
    const entry = raw.trim();
    if (entry === "") continue;
    if (
      entry !== "package" &&
      (!entry.startsWith("package/") || entry.startsWith("/") || entry.split("/").includes(".."))
    ) {
      throw new Error(`unsafe tar entry for ${fullName}: ${entry.slice(0, 120)}`);
    }
  }
}

async function extractPackedTarball(tgz, extractDir, fullName) {
  const listing = await exec("tar", ["-tzf", tgz], { maxBuffer: 16 * 1024 * 1024, timeout: 60_000, env: childEnv() });
  assertSafeTarEntries(listing.stdout, fullName);
  await exec("tar", ["-xzf", tgz, "-C", extractDir], { maxBuffer: 16 * 1024 * 1024, timeout: 60_000, env: childEnv() });
  return join(extractDir, "package");
}

/**
 * 跑一次 checker。退出码 0/1/2 都可能带合法 JSON（2 = incomplete），
 * 所以即使 execFile 抛错也要解析 stdout；只有解析不了才按行失败处理。
 */
async function runChecker(checker, packageDir) {
  let stdout = "";
  let processExit = null;
  try {
    const result = await exec(
      process.execPath,
      [checker, packageDir, "--scope", "entry", "--entry-claim", "static", "--no-exec", "--format", "json"],
      { timeout: CHECK_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024, env: childEnv({ NO_COLOR: "1" }) },
    );
    stdout = result.stdout;
    processExit = 0;
  } catch (err) {
    stdout = typeof err?.stdout === "string" ? err.stdout : "";
    processExit = typeof err?.code === "number" ? err.code : null;
    if (stdout === "") throw new Error(`checker failed (exit ${processExit}): ${messageOf(err)}`);
  }
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`checker did not emit JSON (exit ${processExit})`);
  }
}

async function checkPackage({ checker, workRoot, row }) {
  const fullName = String(row.full_name);
  const name = String(row.pkg_name);
  const version = String(row.npm_latest_version);
  const dir = typeof row.npm_repo_directory === "string" && row.npm_repo_directory !== ""
    ? row.npm_repo_directory
    : null;
  const started = Date.now();
  const slot = await mkdtemp(join(workRoot, "pkg-"));
  const packDir = join(slot, "pack");
  const extractDir = join(slot, "extract");
  await mkdir(packDir);
  await mkdir(extractDir);
  try {

  // 精确版本 + 官方 registry + 禁止生命周期脚本；cwd 在临时目录，避免读到
  // 仓库自身的 package.json 或 .npmrc。
  await exec(
    npmBin(),
    [
      "pack",
      "--ignore-scripts",
      // 精确版本不可变：缓存命中时优先用本地 tarball，冷缓存仍会回源。
      "--prefer-offline",
      `--registry=${NPM_REGISTRY}`,
      "--pack-destination",
      packDir,
      `${name}@${version}`,
    ],
    {
      cwd: slot,
      timeout: PACK_TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024,
      env: childEnv({
        npm_config_registry: NPM_REGISTRY,
        npm_config_ignore_scripts: "true",
        npm_config_audit: "false",
        npm_config_fund: "false",
        npm_config_update_notifier: "false",
        npm_config_loglevel: "error",
      }),
    },
  );

  const tarballs = (await readdir(packDir)).filter((f) => f.endsWith(".tgz"));
  if (tarballs.length !== 1) throw new Error(`npm pack produced ${tarballs.length} tarballs`);
  const packageDir = await extractPackedTarball(join(packDir, tarballs[0]), extractDir, fullName);
  const manifest = JSON.parse(await readFile(join(packageDir, "package.json"), "utf8"));
  if (manifest.name !== name || manifest.version !== version) {
    throw new Error(`packed subject mismatch: ${manifest.name}@${manifest.version}`);
  }

  const report = await runChecker(checker, packageDir);
  const entry = mapReport(report, { checkedAt: new Date().toISOString(), dir });
  if (entry.subject.name !== name || entry.subject.version !== version) {
    throw new Error(`report subject mismatch: ${entry.subject.name}@${entry.subject.version}`);
  }
  return { entry, elapsedMs: Date.now() - started };
  } finally {
    // 每个包一个临时目录；400 个 tarball 不清理会撑爆 runner 磁盘。
    await rm(slot, { recursive: true, force: true }).catch(() => {});
  }
}

// ---------- 写库 ----------

const UPSERT_SQL = `INSERT INTO plugin_entry_checks (
    full_name, state, checked_at, checker_version, anchor_commit, source,
    pkg_name, pkg_version, subject_name, subject_version, subject_kind, subject_dir,
    conclusion_status, exit_code, blocking_pass, blocking_checked,
    blocking_not_checked, not_checked
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(full_name) DO UPDATE SET
    state=excluded.state, checked_at=excluded.checked_at,
    checker_version=excluded.checker_version, anchor_commit=excluded.anchor_commit,
    source=excluded.source, pkg_name=excluded.pkg_name, pkg_version=excluded.pkg_version,
    subject_name=excluded.subject_name, subject_version=excluded.subject_version,
    subject_kind=excluded.subject_kind, subject_dir=excluded.subject_dir,
    conclusion_status=excluded.conclusion_status, exit_code=excluded.exit_code,
    blocking_pass=excluded.blocking_pass, blocking_checked=excluded.blocking_checked,
    blocking_not_checked=excluded.blocking_not_checked, not_checked=excluded.not_checked`;

function upsertRow(db, row, entry) {
  return db.execute({
    sql: UPSERT_SQL,
    args: [
      String(row.full_name),
      entry.state,
      entry.checked_at,
      entry.checker_version,
      entry.commit ?? null,
      entry.source,
      String(row.pkg_name),
      String(row.npm_latest_version),
      entry.subject.name,
      entry.subject.version,
      entry.subject.kind,
      entry.subject.dir ?? null,
      entry.raw.status,
      entry.raw.exit_code,
      entry.entry_blocking.pass ? 1 : 0,
      JSON.stringify(entry.entry_blocking.checked),
      JSON.stringify(entry.entry_blocking.not_checked),
      JSON.stringify(entry.not_checked),
    ],
  });
}

// ---------- 主流程 ----------

if (ensureSchemaOnly) {
  const db = openDb();
  await ensureSchema(db);
  process.exit(0);
}

if (emitCandidatesFile !== "") {
  const db = openDb();
  const rows = await fetchCandidates(db, Date.now());
  const candidates = rows.filter(isEligible);
  await writeFile(emitCandidatesFile, JSON.stringify(makeCandidatesDocument(candidates), null, 2) + "\n");
  console.log(`entry-check candidates: ${candidates.length}/${rows.length} -> ${emitCandidatesFile}`);
  process.exit(0);
}

if (upsertResultsFile !== "") {
  const results = parseResultsDocument(JSON.parse(await readFile(upsertResultsFile, "utf8")));
  if (upsertCandidatesFile !== "") {
    const candidates = parseCandidatesDocument(JSON.parse(await readFile(upsertCandidatesFile, "utf8")));
    assertResultsMatchCandidates(results, candidates);
  }
  const db = openDb();
  for (const item of results) await upsertRow(db, item, item.entry);
  console.log(`entry-check upsert: ${results.length} rows from ${upsertResultsFile}`);
  process.exit(0);
}

let db = null;
const collectMode = fromCandidatesFile !== "";
let candidates;
let rows = [];
if (collectMode) {
  if (resultsFile === "") throw new Error("--results <file> is required with --from-candidates");
  candidates = parseCandidatesDocument(JSON.parse(await readFile(fromCandidatesFile, "utf8")));
  rows = candidates;
} else {
  db = openDb();
  rows = await fetchCandidates(db, Date.now());
  candidates = rows.filter(isEligible);
}
console.log(
  `entry-check: ${candidates.length}/${rows.length} candidates ` +
    `(limit=${limit || "all"}, staleDays=${staleDays}, concurrency=${concurrency}, dryRun=${dryRun}, collect=${collectMode})`,
);
if (!candidates.length) {
  if (collectMode) {
    await writeFile(resultsFile, JSON.stringify(makeResultsDocument([]), null, 2) + "\n");
  }
  console.log("entry-check: nothing to do");
  process.exit(0);
}

const workRoot = await mkdtemp(join(tmpdir(), "dshfind-entry-"));
let checker = null;
const stats = { checked: 0, written: 0, collected: 0, notRunRows: 0, failed: 0, skipped: 0, states: {}, sample: null };
const processed = new Set();
const collected = [];

function candidateFields(row) {
  const dir = typeof row.npm_repo_directory === "string" && row.npm_repo_directory !== "" ? row.npm_repo_directory : null;
  const last = typeof row.last_pkg_version === "string" && row.last_pkg_version !== "" ? row.last_pkg_version : null;
  return {
    full_name: String(row.full_name),
    pkg_name: String(row.pkg_name),
    npm_latest_version: String(row.npm_latest_version),
    npm_repo_directory: dir,
    last_pkg_version: last,
  };
}

async function processRow(row, { collect = null } = {}) {
  processed.add(String(row.full_name));
  try {
    const { entry, elapsedMs } = await checkPackage({ checker, workRoot, row });
    stats.checked++;
    stats.states[entry.state] = (stats.states[entry.state] ?? 0) + 1;
    if (dryRun) {
      stats.sample ??= { full_name: String(row.full_name), entry };
      console.log(`✓ ${row.full_name} ${row.pkg_name}@${row.npm_latest_version} ${entry.state} (${elapsedMs}ms, dry-run)`);
      return;
    }
    if (collect !== null) {
      collect.push({ ...candidateFields(row), entry });
      stats.collected++;
      console.log(`✓ ${row.full_name} ${row.pkg_name}@${row.npm_latest_version} ${entry.state} (${elapsedMs}ms, collected)`);
      return;
    }
    await upsertRow(db, row, entry);
    stats.written++;
    console.log(`✓ ${row.full_name} ${row.pkg_name}@${row.npm_latest_version} ${entry.state} (${elapsedMs}ms)`);
  } catch (err) {
    stats.failed++;
    console.error(`✗ ${row.full_name}: ${messageOf(err)}`);
    // 新版本 / 首次检查失败写 not_run 并带 checked_at，让滚动队列能越过它；
    // 同版本失败不覆盖已有结论。
    if (!dryRun && String(row.last_pkg_version ?? "") !== String(row.npm_latest_version)) {
      const entry = notRunEntry({
        name: String(row.pkg_name),
        version: String(row.npm_latest_version),
        checkedAt: new Date().toISOString(),
        dir: row.npm_repo_directory,
      });
      if (collect !== null) {
        collect.push({ ...candidateFields(row), entry });
        stats.collected++;
        stats.notRunRows++;
      } else {
        try {
          await upsertRow(db, row, entry);
          stats.notRunRows++;
        } catch (writeErr) {
          console.error(`✗ ${row.full_name}: could not persist not_run: ${messageOf(writeErr)}`);
        }
      }
    }
  }
}

try {
  checker = await prepareChecker(workRoot);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, candidates.length) }, async () => {
    while (next < candidates.length) {
      if (pastDeadline()) return;
      const row = candidates[next++];
      await processRow(row, { collect: collectMode ? collected : null });
    }
  });
  await Promise.all(workers);
} finally {
  await rm(workRoot, { recursive: true, force: true }).catch(() => {});
}

stats.skipped = candidates.length - processed.size;
if (collectMode) {
  await writeFile(resultsFile, JSON.stringify(makeResultsDocument(collected), null, 2) + "\n");
  console.log(`entry-check results: ${collected.length} -> ${resultsFile}`);
}
if (stats.sample !== null) {
  console.log(`entry-check sample: ${JSON.stringify(stats.sample)}`);
}
console.log(
  `entry-check done: checked=${stats.checked} written=${stats.written} collected=${stats.collected} notRunRows=${stats.notRunRows} ` +
    `failed=${stats.failed} skipped=${stats.skipped}${pastDeadline() ? " (deadline)" : ""}`,
);
console.log(
  `entry-check states: ${Object.entries(stats.states).map(([k, v]) => `${k}=${v}`).join(" ") || "none"}`,
);
// 单行失败不抛出；只有启动/配置错误（openDb / prepareChecker / 候选查询）
// 才会以非零退出，方便 CI 报警。设置 exitCode 而不是 process.exit()，避免
// 大量逐行日志在管道里被截断。
process.exitCode = 0;
