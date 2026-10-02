/**
 * npm 发现源：keywords:dsh-plugin / dsh-bundle 的包 → 它们指向的 GitHub 仓库。
 *
 * 动机（2026-10 实测）：npm 去重后约 5300 个包，其中 554 个仓库不在库里——GitHub topic
 * 搜索漏了它们（作者没挂 dsh-plugin topic，或单日新仓超 1000 被截断）。
 * 本模块只放纯函数，网络与落盘在 scripts/discover-npm.mjs，入库走 sync-plugins-db 的手动收录路径。
 */

export const NPM_KEYWORDS = ["dsh-plugin", "dsh-bundle"];

const GITHUB_RE = /github\.com[/:]([^/\s]+)\/([^/#?\s]+?)(?:\.git)?(?:[/#?]|$)/i;
// GitHub 的 owner / repo 命名规则：字母数字、-、_、.；owner 不含 _ 与 .
const OWNER_RE = /^[a-z\d](?:[a-z\d-]{0,38})$/i;
const REPO_RE = /^[\w.-]{1,100}$/;

/** 从 npm 的 repository 链接里取 owner/repo；非 GitHub 或格式不合法返回 null。 */
export function parseGithubRepo(url) {
  const m = GITHUB_RE.exec(url ?? "");
  if (!m) return null;
  const [, owner, repo] = m;
  // 模板占位符（如 <your-account>）、纯点号名都会在这里被挡掉
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo) || /^\.+$/.test(repo)) return null;
  return `${owner}/${repo}`;
}

/** npm 搜索结果 objects → Map<小写 owner/repo, {repo, packages[]}>；同一仓库多个包合并。 */
export function collectRepos(objects) {
  const out = new Map();
  for (const o of objects) {
    const pkg = o?.package;
    if (!pkg?.name) continue;
    const repo = parseGithubRepo(pkg.links?.repository);
    if (!repo) continue;
    const key = repo.toLowerCase();
    const e = out.get(key) ?? { repo, packages: [] };
    if (!e.packages.includes(pkg.name)) e.packages.push(pkg.name);
    out.set(key, e);
  }
  return out;
}

/**
 * 从发现名单里挑出本轮要抓的仓库：库里已有的全部保留（它们不在 topic 搜索里，
 * 不抓就会被软删），库里没有的最多取 limit 个——「慢慢补」，免得一晚上冲掉 GitHub 配额。
 * known 为小写 full_name 集合；names 保持发现名单的顺序。
 */
export function pickBatch(names, known, limit) {
  const have = names.filter((n) => known.has(n.toLowerCase()));
  const fresh = names.filter((n) => !known.has(n.toLowerCase())).slice(0, limit);
  return { have, fresh };
}
