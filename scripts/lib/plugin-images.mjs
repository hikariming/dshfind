/**
 * 从 README 里挑出一张能当插件配图的图片。纯函数，不联网——联网部分在
 * scripts/extract-plugin-images.mjs。
 *
 * 为什么需要这一层：实测 60 个仓库的 README 共 530 条图片引用，**41% 是徽章**
 * （shields.io 的 build passing 之类）。不过滤就直接取「第一张图」，卡片上会铺满
 * 绿色小条——比没有图更糟，因为它同时毁掉版面又不传达任何信息。
 *
 * 另一半麻烦是地址形态：非徽章图片里约一半写的是相对路径（`assets/hero.png`、
 * `./docs/images/x.png`），直接拿去下载必然 404，得拼回 raw.githubusercontent.com。
 */

/**
 * 徽章服务域名。命中即判定为徽章，不进候选。
 *
 * 这些站点的产物一律是状态标签而非截图，没有例外，所以按域名一刀切比按尺寸
 * 或内容猜要可靠得多——尺寸要下载完才知道，而下载 9,672 × N 张徽章纯属浪费。
 */
const BADGE_HOSTS = [
  "shields.io",
  "img.shields.io",
  "badgen.net",
  "badge.fury.io",
  "forthebadge.com",
  "travis-ci.org",
  "travis-ci.com",
  "circleci.com",
  "codecov.io",
  "coveralls.io",
  "app.netlify.com",
  "api.netlify.com",
  "deepwiki.com",
  "visitor-badge.laobi.icu",
  "visitor-badge.glitch.me",
  "hits.seeyoufarm.com",
  "api.star-history.com",
  "star-history.com",
  "skillicons.dev",
  "opencollective.com",
  "contrib.rocks",
  "img.badgesize.io",
  "isitmaintained.com",
  "snyk.io",
  "sonarcloud.io",
  "bestpractices.coreinfrastructure.org",
  "gitpod.io",
  "herokucdn.com",
  "jitpack.io",
  "poser.pugx.org",
  "nodei.co",
  "david-dm.org",
  "badge.buildkite.com",
  "codeclimate.com",
  "codefactor.io",
  "www.codefactor.io",
  "api.codacy.com",
  "readthedocs.org",
  "mseep.net",
  "trendshift.io",
];

/** GitHub Actions 自己的状态徽章：github.com/<o>/<r>/(actions/workflows/x.yml|workflows/名)/badge.svg */
const GH_WORKFLOW_BADGE = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/(actions\/workflows\/[^/]+|workflows\/[^/]+)\/badge\.svg/i;

/**
 * 判断一个图片地址是不是徽章。
 *
 * `.svg` 一律算徽章，这是有意为之的一刀切：徽章几乎清一色是 svg，而剩下的 svg
 * 基本是 logo 或流程图——两者当卡片配图都很糟（logo 卡会让整个列表看起来像批量
 * 生成的）。宁可漏掉极少数好 svg，也不要放进来一堆 logo。
 */
export function isBadge(url) {
  if (typeof url !== "string" || !url) return true;
  const lower = url.toLowerCase();
  if (GH_WORKFLOW_BADGE.test(lower)) return true;

  let host = "";
  try {
    host = new URL(lower, "https://x.invalid").hostname;
  } catch {
    host = "";
  }
  if (host && BADGE_HOSTS.includes(host)) return true;

  // 路径部分（去掉查询串）以 .svg 结尾
  const path = lower.split(/[?#]/, 1)[0] ?? "";
  return path.endsWith(".svg");
}

/**
 * 从 Markdown 抽出全部图片引用，保持出现顺序。
 *
 * 两种写法都要覆盖：Markdown 的 `![alt](url "title")`，以及 README 里极常见的
 * 原生 `<img src="..." alt="...">`（作者想控制宽度时基本都用后者）。
 *
 * @returns {{url: string, alt: string, index: number}[]}
 */
export function extractImageCandidates(markdown) {
  if (typeof markdown !== "string" || !markdown) return [];

  const out = [];
  // ![alt](url) —— url 可能被 <> 包起来，后面可能跟 "title"
  for (const m of markdown.matchAll(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?/g)) {
    out.push({ url: m[2], alt: m[1] ?? "", index: m.index ?? 0 });
  }
  // <img src="..." alt="...">，属性顺序不定，所以分两次取
  for (const m of markdown.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (!src) continue;
    const alt = /\balt\s*=\s*["']([^"']*)["']/i.exec(tag);
    out.push({ url: src[1], alt: alt?.[1] ?? "", index: m.index ?? 0 });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** 归一化相对路径里的 `./` 与 `../`，避免拼出 raw.githubusercontent.com/o/r/HEAD/./x.png。 */
function normalizePath(path) {
  const parts = [];
  for (const seg of path.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

/**
 * 把 README 里写的地址解析成可以直接 GET 的绝对地址。
 *
 * @param raw       README 里的原始写法
 * @param fullName  owner/repo
 * @param branch    默认分支；用 "HEAD" 可以免去查询默认分支名（main/master 之争）
 * @returns 可下载的绝对 URL；无法解析（data:、锚点等）返回 null
 */
export function resolveImageUrl(raw, fullName, branch = "HEAD") {
  if (typeof raw !== "string") return null;
  const url = raw.trim();
  if (!url || url.startsWith("#") || /^(data|mailto|javascript):/i.test(url)) {
    return null;
  }

  // 协议相对：//host/path
  if (url.startsWith("//")) return `https:${url}`;

  if (/^https?:\/\//i.test(url)) {
    // github.com 的 blob / raw 页面是 HTML 包装页，取字节要换成 raw 域名
    const m = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/i.exec(url);
    if (m) {
      const path = m[3].split(/[?#]/, 1)[0];
      return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${path}`;
    }
    // raw.githubusercontent 上的 ?raw=true 之类查询串没有意义，去掉以便按 URL 去重
    if (/^https?:\/\/raw\.githubusercontent\.com\//i.test(url)) {
      return url.split(/[?#]/, 1)[0];
    }
    // user-attachments 与其它外站原样保留（前者是会 302 到 CDN 的短链）
    return url;
  }

  if (!fullName || !/^[^/]+\/[^/]+$/.test(fullName)) return null;

  // 根相对（/assets/x.png）在 README 语境下指的是仓库根，不是站点根
  const path = normalizePath(url.split(/[?#]/, 1)[0].replace(/^\//, ""));
  if (!path) return null;
  return `https://raw.githubusercontent.com/${fullName}/${branch}/${path}`;
}

/** 一眼能看出是「效果图」的词，中英文都收。 */
const SHOWCASE = /(screenshot|screen-shot|demo|preview|showcase|example|usage|in-action|截图|效果|演示|预览|示例)/i;
/** 首屏大图：不是效果图但同样适合当卡片。 */
const HERO = /(hero|banner|cover|header|splash)/i;
/** 标识类：能用，但排在最后——满屏 logo 卡会让列表看起来像批量生成的。 */
const MARK = /(logo|icon|avatar|favicon|wordmark)/i;

/**
 * 给一个候选打分。分数只用于排序，绝对值没有意义。
 *
 * 同时看 alt 与 URL 路径：作者可能写 `![演示](assets/a.png)`，也可能写
 * `![](docs/screenshot.png)`，两种线索都不该漏。
 */
function scoreCandidate({ url, alt }) {
  const hay = `${alt} ${url}`;
  let score = 0;
  if (SHOWCASE.test(hay)) score += 3;
  if (HERO.test(hay)) score += 2;
  // 动图基本都是操作演示，信息量高于静态图
  if (/\.gif(\?|#|$)/i.test(url)) score += 1;
  if (MARK.test(hay)) score -= 2;
  return score;
}

/**
 * 从 README 里选出最适合当配图的一张。
 *
 * 排序规则：先按得分，同分按出现顺序——README 的第一张非徽章图通常就是作者
 * 精心放的首屏图，这个先验很强，所以只在有更明确信号（alt 写着「截图」）时才推翻它。
 *
 * @returns {{url: string, sourceUrl: string, alt: string, score: number} | null}
 */
export function pickPluginImage(markdown, fullName, branch = "HEAD") {
  const candidates = extractImageCandidates(markdown)
    .filter((c) => !isBadge(c.url))
    .map((c, order) => ({ ...c, order, resolved: resolveImageUrl(c.url, fullName, branch) }))
    .filter((c) => c.resolved && !isBadge(c.resolved));

  if (candidates.length === 0) return null;

  const best = candidates
    .map((c) => ({ ...c, score: scoreCandidate({ url: c.resolved, alt: c.alt }) }))
    .sort((a, b) => b.score - a.score || a.order - b.order)[0];

  return { url: best.resolved, sourceUrl: best.url, alt: best.alt, score: best.score };
}

/**
 * 从仓库主页 HTML 里读出自定义社交预览图。
 *
 * GitHub 给每个仓库都会出一张 og:image，但**自动合成的那张没有价值**（就是仓库名
 * + 头像 + 描述，我们自己排版能做得更好）。只有仓库主手工上传过的才值得收，
 * 而两者的区别正好体现在域名上：
 *   自定义 → repository-images.githubusercontent.com
 *   自动合成 → opengraph.githubassets.com
 *
 * @returns 自定义预览图地址；没有则 null
 */
export function customSocialPreview(html) {
  if (typeof html !== "string") return null;
  const m = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)
    ?? /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
  const url = m?.[1];
  if (!url) return null;
  return /^https?:\/\/repository-images\.githubusercontent\.com\//i.test(url) ? url : null;
}

/** R2 对象键前缀：owner/repo → p/owner__repo。斜杠换成双下划线，避免多一层目录。 */
export function imageKeyPrefix(fullName) {
  return `p/${fullName.replace("/", "__")}`;
}
