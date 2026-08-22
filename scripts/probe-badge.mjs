#!/usr/bin/env node
/**
 * 探测每个收录仓库的 README 里「有没有放我们的链接」，结论写回 Turso plugins 表。
 *
 * 用法：
 *   pnpm probe:badge --min-stars 50        # 只探 star ≥ 50 的（外链外联名单就够用了）
 *   pnpm probe:badge --limit 300           # 按 star 降序只探前 300 个
 *   pnpm probe:badge --stale-days 30       # 换新鲜度阈值（默认 30 天）
 *   pnpm probe:badge --all                 # 无视新鲜度全部重探
 *   pnpm probe:badge --only owner/repo     # 只探一个（可重复传）
 *   pnpm probe:badge --dry-run             # 只打印，不写库
 *
 * 为什么单独一个脚本而不并进 probe-install：那边的 fetchReadme 只在 `hasBundle`
 * 时才调用（安装命令只对组合包有意义），而徽章任何仓库都可能挂。合进去要么改坏
 * 那边的短路逻辑、白抓几千个 README，要么继续漏掉大半。分开还能单独控成本——
 * 外联名单只需要头部几百个，不必为此全库扫一遍。
 *
 * 四种状态分开存，因为对应四种不同的沟通话术，冷热差一个数量级：
 *   has_badge=1            已挂徽章 —— 什么都不用做
 *   dshfind_link=1         提了站但没用徽章 —— 把徽章代码发过去即可
 *   dshfind_repo_link=1    只提了 GitHub 仓库、没提站 —— 「顺手把官网也加上」
 *   三者皆 0               完全没提 —— 才需要从头介绍
 *
 * 第三类是补测才发现的：最初 LINK_RE 只匹配站点域名，把
 * anywhere-labs/deepseek-harness-desktop（★17.9k，README 表格里有 dshfind 行、
 * 链的是 GitHub）判成了「完全没提」。最热的线索差点被归进最冷的一档。
 */
import { createClient } from "@libsql/client/web";

const CONCURRENCY = 8;
const DEFAULT_STALE_DAYS = 30;

// ---------- 参数 ----------

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [argv[i + 1]] : []));
const dryRun = has("--dry-run");
const all = has("--all");
const staleDays = Number(val("--stale-days", DEFAULT_STALE_DAYS));
const minStars = Number(val("--min-stars", 0));
const limit = Number(val("--limit", 0));

// ---------- 检测规则 ----------

/**
 * 站点域名。徽章片段由 src/components/share-card-box.tsx 生成，形如
 *   [![dshfind](https://dshfind.com/api/badge/owner/repo?lang=zh)](https://dshfind.com/zh/plugins/owner/repo?ref=badge)
 * badge 与 card 是两个变体，两个都算。
 */
const HOST = "dshfind\\.com";

/** 官方徽章／卡片图片。这是「挂了徽章」的判据。 */
const BADGE_RE = new RegExp(`${HOST}/api/(?:badge|card)/`, "i");

/**
 * 任何指向本站的链接——徽章是它的子集。
 * 用于区分「提过我们但没用徽章」和「完全没提」。
 */
const LINK_RE = new RegExp(`${HOST}`, "i");

/**
 * 只提了 GitHub 仓库、没提网站的情况。
 *
 * 这是最初漏掉的一类，而它恰恰是最热的线索：对方已经知道我们、已经愿意在自己的
 * README 里署名，只是给的是仓库地址而不是站点。转化只差一句「顺手把官网也加上」，
 * 比冷启动外联容易一个数量级。
 * （anywhere-labs/deepseek-harness-desktop ★17.9k 就是这样被 LINK_RE 判成
 * 「完全没提」的——它表格里有 dshfind 行，链的是 GitHub。）
 */
const REPO_RE = /github\.com\/hikariming\/dshfind/i;

/**
 * 带重试的 fetch。上千个仓库要打几千个请求，连接层偶发失败是常态；
 * 全部重试完仍失败返回 null，调用方按「这轮没测到」处理——**不写库**，
 * 留给下轮 stale 重探，避免把网络抖动记成「作者摘了徽章」。
 */
async function tryFetch(url, init, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init);
    } catch {
      if (i === attempts - 1) return null;
      await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    }
  }
  return null;
}

/**
 * README 原文。文件名各家不一，按常见顺序试。
 * 与 probe-install 的同名函数保持一致的候选顺序。
 *
 * 返回 { text } 表示读到了（text 可能为空串——仓库有 README 但内容为空）；
 * 返回 null 表示**没读到**，与「读到了但没有徽章」是两回事。
 */
async function fetchReadme(fullName) {
  for (const file of ["README.md", "readme.md", "README.zh-CN.md", "README.rst"]) {
    const res = await tryFetch(`https://raw.githubusercontent.com/${fullName}/HEAD/${file}`);
    if (!res) return null; // 连接层失败：判「没测到」，不是「没有 README」
    if (!res.ok) continue; // 404：换下一个文件名
    try {
      return { text: await res.text() };
    } catch {
      return null;
    }
  }
  return { text: "" }; // 四个名字都 404：确实没有 README，等价于没放链接
}

async function mapPool(items, poolSize, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(poolSize, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

// ---------- 主流程 ----------

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("缺少 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
  process.exit(1);
}
const client = createClient({ url: url.replace(/^libsql:\/\//, "https://"), authToken });

for (const sql of [
  `ALTER TABLE plugins ADD COLUMN has_badge INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE plugins ADD COLUMN dshfind_link INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE plugins ADD COLUMN dshfind_repo_link INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE plugins ADD COLUMN badge_probed_at TEXT`,
  `ALTER TABLE plugins ADD COLUMN badge_first_seen_at TEXT`,
]) {
  try {
    await client.execute(sql);
  } catch (err) {
    if (!/duplicate column/i.test(String(err?.message ?? err))) throw err;
  }
}

const where = ["is_present = 1", "is_offtopic = 0", "is_risky = 0"];
const args = [];
if (only.length) {
  where.push(`full_name IN (${only.map(() => "?").join(",")})`);
  args.push(...only);
} else {
  if (minStars > 0) where.push(`stars >= ${minStars}`);
  if (!all) {
    where.push(
      `(badge_probed_at IS NULL OR badge_probed_at < datetime('now', '-${staleDays} days'))`,
    );
  }
}

const rows = (
  await client.execute({
    sql: `SELECT full_name, stars, has_badge, badge_first_seen_at
          FROM plugins WHERE ${where.join(" AND ")}
          ORDER BY stars DESC${limit > 0 ? ` LIMIT ${limit}` : ""}`,
    args,
  })
).rows;

console.log(`待探测 ${rows.length} 个仓库（并发 ${CONCURRENCY}）…`);

let done = 0;
const results = await mapPool(rows, CONCURRENCY, async (r) => {
  const fullName = String(r.full_name);
  const readme = await fetchReadme(fullName);
  done++;
  if (done % 100 === 0) console.log(`  …${done}/${rows.length}`);
  if (!readme) return { fullName, skipped: true };
  const badge = BADGE_RE.test(readme.text);
  const link = LINK_RE.test(readme.text);
  const repoLink = REPO_RE.test(readme.text);
  return {
    fullName,
    stars: Number(r.stars ?? 0),
    badge,
    link,
    repoLink,
    // 首次看到徽章的时间只写一次，之后不动——用来看推广运动的时间曲线
    firstSeen: r.badge_first_seen_at ? String(r.badge_first_seen_at) : null,
    wasBadge: Number(r.has_badge ?? 0) === 1,
  };
});

const measured = results.filter((r) => !r.skipped);
const skipped = results.length - measured.length;
const now = new Date().toISOString();

if (dryRun) {
  console.log("\n--dry-run，未写库。");
} else {
  const stmts = measured.map((r) => ({
    sql: `UPDATE plugins
          SET has_badge = ?, dshfind_link = ?, dshfind_repo_link = ?, badge_probed_at = ?,
              badge_first_seen_at = COALESCE(badge_first_seen_at, ?)
          WHERE full_name = ?`,
    args: [
      r.badge ? 1 : 0,
      r.link ? 1 : 0,
      r.repoLink ? 1 : 0,
      now,
      r.badge ? now : null, // 没徽章时传 null，COALESCE 保持原值不变
      r.fullName,
    ],
  }));
  for (let i = 0; i < stmts.length; i += 100) {
    await client.batch(stmts.slice(i, i + 100), "write");
  }
  console.log(`\n已写库：${stmts.length} 行。`);
}

const withBadge = measured.filter((r) => r.badge);
const linkOnly = measured.filter((r) => !r.badge && r.link);
// 只提仓库没提站：转化最容易的一档，单独报出来
const repoOnly = measured.filter((r) => !r.badge && !r.link && r.repoLink);
const none = measured.filter((r) => !r.badge && !r.link && !r.repoLink);
const newlyBadged = withBadge.filter((r) => !r.wasBadge);

console.log(`\n本轮测到 ${measured.length} 个${skipped ? `（${skipped} 个网络失败，未写库，下轮重试）` : ""}`);
console.log(`  已挂徽章        ${withBadge.length}`);
console.log(`  只提链接没徽章  ${linkOnly.length}`);
console.log(`  只提 GitHub 仓库 ${repoOnly.length}${repoOnly.length ? ` → ${repoOnly.slice(0, 5).map((r) => `${r.fullName}(★${r.stars})`).join(", ")}` : ""}`);
console.log(`  完全没提        ${none.length}`);
if (newlyBadged.length) {
  console.log(`  本轮新增徽章    ${newlyBadged.length} → ${newlyBadged.slice(0, 5).map((r) => r.fullName).join(", ")}`);
}
