import semver from "semver";

/**
 * 安装方式推导：从仓库根 package.json + npm registry 的事实，推出「这东西到底怎么装」。
 *
 * 背景（依据 docs/user/develop/basic/publish.zh.md，站内课程 dev/05-config-publish 有完整讲解）：
 * 可安装的 DSH 插件 = 一个在 package.json 里用 `dsh.bundle` 声明自己是组合包的 npm 包。
 * `dsh plugin add` 在 profile 目录内转发给 pnpm，所以能接受的目标是「pnpm 能装的东西」：
 * 包名、本地路径、tarball、`github:owner/repo`。三条分发途径里 git 直装是官方点名的坑——
 * 拉的是源码，没有任何环节跑 build，且 pnpm ≥ 10 需要用户在 profile 的 pnpm-workspace.yaml
 * 里显式 allowBuilds 授权才肯运行 prepare。
 *
 * 于是「仓库名」这一个信息根本不足以拼出安装命令：manifest、组合包声明、包名/版本、
 * npm 发布状态与 release 资产都要查清，最后还要判断源码安装能不能加载。
 */

/** 推导结论。null（未探测）由调用方表示，不在此枚举内。 */
export const INSTALL_KINDS = [
  "npm", // 已发布 npm 就用包名装——托管方保障最强，优先级最高
  "release", // 没发 npm 时，退而用 GitHub Release 里与包名/版本严格匹配的 tarball
  "git", // 未发布 npm，但 git 直装能跑起来
  "build-required", // 是组合包，但 git 装拿到的源码缺构建产物，作者也没给 prepare
  "not-installable", // 压根不是可安装的插件包（索引站、文档、独立 App、私有包…）
];

/** 单仓库一次最多看这些 release / asset；避免异常仓库放大内存与 CPU 占用。 */
export const MAX_RELEASES = 10;
export const MAX_ASSETS_PER_RELEASE = 50;
export const MAX_RELEASE_ASSET_BYTES = 100 * 1024 * 1024;

const SAFE_PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const SAFE_VERSION = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function validPackageName(name) {
  return (
    typeof name === "string" &&
    name.length <= 214 &&
    !name.includes("..") &&
    SAFE_PACKAGE_NAME.test(name)
  );
}

function validVersion(version) {
  return typeof version === "string" && version.length <= 128 && SAFE_VERSION.test(version);
}

/** npm pack 对 scoped 包去掉 @ 并用 - 连接 scope/name。 */
function packedName(pkgName) {
  return pkgName.startsWith("@") ? pkgName.slice(1).replace("/", "-") : pkgName;
}

function safeReleaseUrl({ url, fullName, tag, assetName }) {
  if (typeof url !== "string" || url.length > 2_048) return false;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "github.com" ||
      parsed.port ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return false;
    }
    const prefix = `/${fullName}/releases/download/`;
    if (!parsed.pathname.startsWith(prefix)) return false;
    const suffix = parsed.pathname.slice(prefix.length);
    const slash = suffix.lastIndexOf("/");
    if (slash <= 0) return false;
    return (
      decodeURIComponent(suffix.slice(0, slash)) === tag &&
      decodeURIComponent(suffix.slice(slash + 1)) === assetName
    );
  } catch {
    return false;
  }
}

/**
 * 从 GitHub Releases API 的有限结果里挑唯一可用的版本匹配 tarball。
 *
 * 不下载、不解包、更不会执行资产；这里只接受 package.json 的包名/版本、release tag、
 * prerelease 标记、资产名和 GitHub 下载 URL 全部一致的候选。多个候选时宁可回退。
 */
export function selectReleaseTarball({ fullName, pkgName, pkgVersion, releases }) {
  if (
    typeof fullName !== "string" ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName) ||
    !validPackageName(pkgName) ||
    !validVersion(pkgVersion) ||
    !Array.isArray(releases)
  ) {
    return null;
  }

  const assetName = `${packedName(pkgName)}-${pkgVersion}.tgz`;
  const versionIsPrerelease = pkgVersion.split("+")[0].includes("-");
  const candidates = [];

  for (const release of releases.slice(0, MAX_RELEASES)) {
    if (!release || release.draft !== false || typeof release.tag_name !== "string") continue;
    if (release.prerelease !== versionIsPrerelease) continue;
    const tag = release.tag_name;
    if (tag !== pkgVersion && tag !== `v${pkgVersion}`) continue;
    if (!Array.isArray(release.assets)) continue;

    for (const asset of release.assets.slice(0, MAX_ASSETS_PER_RELEASE)) {
      if (
        !asset ||
        asset.state !== "uploaded" ||
        asset.name !== assetName ||
        !Number.isSafeInteger(asset.size) ||
        asset.size <= 0 ||
        asset.size > MAX_RELEASE_ASSET_BYTES ||
        !safeReleaseUrl({
          url: asset.browser_download_url,
          fullName,
          tag,
          assetName,
        })
      ) {
        continue;
      }
      candidates.push({
        releaseTgzUrl: asset.browser_download_url,
        releaseTag: tag,
        releasePrerelease: release.prerelease,
        releaseAssetName: assetName,
        releaseAssetSize: asset.size,
        releaseAssetDigest:
          typeof asset.digest === "string" && /^sha256:[0-9a-f]{64}$/i.test(asset.digest)
            ? asset.digest.toLowerCase()
            : null,
      });
    }
  }

  return candidates.length === 1 ? candidates[0] : null;
}

/**
 * npm package.json 的 repository 字段归一化为小写 `owner/repo`。
 * 兼容 npm 允许的三种形态：string、`{url}`、`{url, directory}`（monorepo 子目录不影响
 * 回链判定，只看仓库本身）。剥掉 `git+` 前缀、`.git` 后缀与 scp 风格 `git@github.com:`；
 * 无法解析或指向非 GitHub 托管（gitlab 等）时返回 null。
 */
export function normalizeNpmRepository(repository) {
  const raw =
    typeof repository === "string"
      ? repository
      : repository && typeof repository.url === "string"
        ? repository.url
        : null;
  if (!raw) return null;
  let s = raw.trim().replace(/^git\+/i, "");
  // scp 风格 git@github.com:owner/repo 先转成 https 形态，走同一套解析
  const scp = s.match(/^git@github\.com:([^/]+\/[^/]+)$/i);
  if (scp) s = `https://github.com/${scp[1]}`;
  s = s.replace(/\.git$/i, "").replace(/\/+$/, "");
  // npm 简写 github:owner/repo
  const short = s.match(/^github:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)$/i);
  if (short) return short[1].toLowerCase();
  let parsed;
  try {
    parsed = new URL(s);
  } catch {
    return null;
  }
  if (parsed.hostname.toLowerCase() !== "github.com") return null;
  const m = parsed.pathname.match(/^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  return m ? `${m[1]}/${m[2]}`.toLowerCase() : null;
}

/**
 * npm 包的 repository 是否回链到目录声明的 GitHub 仓库（大小写不敏感）。
 * 桌面端安装前核对的正是这一事实。
 */
export function npmRepoBacklink(fullName, repository) {
  if (typeof fullName !== "string") return false;
  return normalizeNpmRepository(repository) === fullName.toLowerCase();
}

// ---------- 取数结论：分清「确认没有」与「这轮说不准」 ----------

/**
 * 一次 HTTP 取数的结论：`ok` 拿到了、`absent` 确认不存在、`unknown` 这轮说不准。
 *
 * 只有 404 / 410 算「确认不存在」。429、5xx、网络失败一律 unknown——
 * 这条线很要命：桌面端市场按 npm_desktop_installable 决定发不发一键安装证据，
 * 把 unknown 当成 absent 写库，等于一次限流就能把一个正常插件从市场里除名，
 * 而且下一轮探测还会把「不是插件」这个错误结论当既成事实留着。
 */
export function fetchOutcome(res) {
  if (!res) return "unknown"; // 网络层失败，tryFetch 已重试完
  if (res.ok) return "ok";
  if (res.status === 404 || res.status === 410) return "absent";
  return "unknown";
}

/** 429 / 5xx 值得重试；其余 4xx 是确定性答复，重试只是白等。 */
export function retryableStatus(status) {
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * 抓不到 package.json 时沿用上一轮的清单事实，而不是改写成「不是插件」。
 * 与 mergeReleaseProbe 同一套规矩：complete=false 会让调用方不刷新探测时间，
 * 下一轮 stale 立刻重试。首次探测就 unknown（previous 全空）也照样不写死结论。
 */
export function mergeManifestProbe({ outcome, facts, previous }) {
  if (outcome !== "unknown") return { facts, complete: true };
  return {
    facts: {
      pkgName: previous.pkgName ?? null,
      pkgVersion: previous.pkgVersion ?? null,
      pkgPrivate: Boolean(previous.pkgPrivate),
      hasBundle: Boolean(previous.hasBundle),
      hasPrepare: Boolean(previous.hasPrepare),
      entryNeedsBuild: Boolean(previous.entryNeedsBuild),
    },
    complete: false,
  };
}

/**
 * 抓不到 npm packument 时沿用上一轮的发布事实。
 * 尤其是 npmDesktopInstallable：它是发给桌面端的安装证据开关，
 * 宁可留着上一轮（版本号可能旧一天），也不能因为一次限流把它抹成 0。
 */
export function mergeNpmProbe({ outcome, npm, previous }) {
  if (outcome !== "unknown") return { npm, complete: true };
  return {
    npm: {
      published: Boolean(previous.npmPublished),
      latestVersion: previous.npmLatestVersion ?? null,
      repository: null, // 回链结论直接沿用，不重算
      deprecated: false,
      latestDoc: null,
      keep: {
        npmLatestVersion: previous.npmLatestVersion ?? null,
        npmRepoBacklink: Boolean(previous.npmRepoBacklink),
        npmDesktopInstallable: Boolean(previous.npmDesktopInstallable),
        npmRepoDirectory: previous.npmRepoDirectory ?? null,
      },
    },
    complete: false,
  };
}

// ---------- 桌面端 npm preview 复核 ----------

/**
 * 与桌面端运行时一致的版本常量。唯一事实源是 deepseek-harness-desktop 的
 * `dsh-community-market/src/install/service.ts`（那边叫 DSH_RUNTIME_VERSION /
 * CORDIS_RUNTIME_VERSION / NODE_RUNTIME_VERSION）。
 *
 * **桌面端升级运行时，这里必须跟着改**，否则后果是单向的：已经跟进新运行时的插件
 * 会被判成「版本范围不覆盖桌面端」，我们就不再发安装证据，它们在桌面端市场里
 * 从一键安装变成只能去 GitHub 自己装——插件没错，是我们的常量旧了。
 * 踩过一次：这里停在 0.1.0-rc.7 时，桌面端早已是 0.1.1-rc.2，
 * 全部升级到 `^0.1.0-rc.8` 的头部插件（含 ★2778 的 DSH-better-sidebar）集体掉出市场。
 *
 * 核对方法：读上面那个文件顶部的三个常量；改完跑
 * `pnpm probe:install --all --npm-bundles` 让结论重算（离线 --rederive 不行，
 * 复核要的 npm 版本文档没有入库）。
 */
export const DESKTOP_CORDIS_VERSION = "4.0.1";
export const DESKTOP_DSH_VERSION = "0.1.1-rc.2";
export const DESKTOP_NODE_VERSION = "24.18.1";

const DESKTOP_LIFECYCLE_SCRIPTS = ["preinstall", "install", "postinstall", "prepare"];
const NPM_REGISTRY_ORIGIN = "https://registry.npmjs.org";
const SHA512_INTEGRITY = /^sha512-[A-Za-z0-9+/]+={0,2}$/;

/** 桌面端 safeBundlePatch：dsh.bundle.patch 必须是非空的、不含逃逸的安全相对路径。 */
function desktopSafeBundlePatch(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 512 || value.includes("\0")) {
    return false;
  }
  const path = value.startsWith("./") ? value.slice(2) : value;
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    path
      .split("/")
      .every((seg) => seg.length > 0 && seg !== "." && seg !== ".." && !seg.includes(":"))
  );
}

/** 桌面端 sha512Integrity：格式合法且 base64 解码后恰为 64 字节（round-trip 校验防脏字符）。 */
function desktopSha512Integrity(value) {
  if (typeof value !== "string" || !SHA512_INTEGRITY.test(value)) return false;
  const encoded = value.slice("sha512-".length);
  const digest = Buffer.from(encoded, "base64");
  return digest.byteLength === 64 && digest.toString("base64") === encoded;
}

/**
 * npm manifest 的 `repository.directory`（monorepo 子包）能否原样进目录契约的
 * `repository.subdirectory`。通过则返回原字符串，否则 null。
 *
 * 规则是桌面端 `contracts/identity.ts` `normalizeSubdirectory` 加 wire schema
 * （catalog-provider-page.schema.json `$defs/repository`）的并集，必须逐字镜像：
 * 桌面端对不合规值是**抛异常整页拒收**，我们发错一个值会把整个 dshfind 源在
 * 桌面端搞挂。合规值经桌面端归一化后与输入相同（split/join 恒等），因此
 * v2.0.1/v2.0.2 旧复核的「manifest directory ↔ 目录 subdirectory 相等」也随之成立。
 */
export function catalogSubdirectory(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 240) return null;
  if (value.startsWith("/") || value.endsWith("/") || value.includes("\\")) return null;
  const segments = value.split("/");
  for (const segment of segments) {
    if (segment.length === 0 || segment === "." || segment === "..") return null;
    let decoded;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return null;
    }
    if (decoded.includes("/") || decoded.includes("\\") || decoded === "." || decoded === "..") {
      return null;
    }
  }
  return value;
}

/** npm 版本文档里可进契约的 monorepo 子目录（repository 对象形态的 directory）；无或不合规为 null。 */
export function npmRepoSubdirectory(versionDoc) {
  const repository =
    versionDoc && typeof versionDoc === "object" && !Array.isArray(versionDoc)
      ? versionDoc.repository
      : null;
  const directory =
    repository && typeof repository === "object" && !Array.isArray(repository)
      ? repository.directory
      : undefined;
  return catalogSubdirectory(directory);
}

/** 桌面端 officialNpmTarball：npmjs 官方源、无凭据、无 fragment、.tgz 结尾。 */
function desktopOfficialTarball(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.origin === NPM_REGISTRY_ORIGIN &&
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.hash &&
      url.pathname.endsWith(".tgz")
    );
  } catch {
    return false;
  }
}

/** range 非法（semver 解析抛错）时按不兼容处理——与桌面端 accepts() 的 catch 分支一致。 */
function desktopAccepts(version, range) {
  if (typeof range !== "string") return false;
  try {
    return semver.satisfies(version, range, { includePrerelease: true });
  } catch {
    return false;
  }
}

/**
 * 预演桌面端安装前对 npm 版本 manifest 的 7 项复核
 * （deepseek-harness-desktop dsh-community-market/src/install/service.ts createNpmRegistryVerifier）。
 * 只发「preview 必过」的安装证据，所以规则宁可与桌面端逐条对齐、失败原因全部列出。
 *
 * versionDoc 是 packument 的 versions[dist-tags.latest] 整个版本文档；
 * fullName 用于第 4 项 repository 归一化比对（目录侧不输出 subdirectory，
 * 因此 manifest 里 repository.directory 存在即判不合格——v1 保守处理）。
 *
 * 返回 { ok, reasons }；reasons 是短标签列表，空即通过。
 */
export function desktopPreviewVerdict(versionDoc, fullName) {
  const reasons = [];
  if (!versionDoc || typeof versionDoc !== "object" || Array.isArray(versionDoc)) {
    return { ok: false, reasons: ["no-version-doc"] };
  }
  const m = versionDoc;

  // 1. 身份字段存在且类型正确（桌面端要求与目标完全一致，目标即来自同一 manifest）
  if (typeof m.name !== "string" || m.name === "") reasons.push("bad-name");
  if (typeof m.version !== "string" || m.version === "") reasons.push("bad-version");

  // 2. 无 deprecated 字段
  if (Object.prototype.hasOwnProperty.call(m, "deprecated")) reasons.push("deprecated");

  // 3. 无 install 生命周期脚本
  const scripts = m.scripts;
  if (scripts !== undefined) {
    if (scripts === null || typeof scripts !== "object" || Array.isArray(scripts)) {
      reasons.push("lifecycle-scripts");
    } else if (DESKTOP_LIFECYCLE_SCRIPTS.some((s) => Object.prototype.hasOwnProperty.call(scripts, s))) {
      reasons.push("lifecycle-scripts");
    }
  }

  // 4. repository：剥 git+ 后必须 https://（scp git@ 形式桌面端直接拒）；
  //    归一化后必须与目录仓库一致。monorepo 子包的 directory 不再一票否决：
  //    只要能原样进契约的 subdirectory（catalogSubdirectory）就放行——v2.0.3 起
  //    桌面端安装复核不看 repository，v2.0.1/v2.0.2 靠我们随目录发出的
  //    subdirectory 与 manifest 相等来通过。不合规的 directory 仍拒，
  //    因为那个值我们发不出去（桌面端 normalizeRepositoryIdentity 会整页拒收）。
  const repository = m.repository;
  const rawUrl =
    typeof repository === "string"
      ? repository
      : repository && typeof repository === "object" && !Array.isArray(repository)
        ? repository.url
        : null;
  if (typeof rawUrl !== "string" || !(rawUrl.startsWith("git+") ? rawUrl.slice(4) : rawUrl).startsWith("https://")) {
    reasons.push("repo-not-https");
  } else if (
    typeof repository === "object" &&
    repository !== null &&
    !Array.isArray(repository) &&
    repository.directory !== undefined &&
    catalogSubdirectory(repository.directory) === null
  ) {
    reasons.push("repo-directory");
  } else if (!npmRepoBacklink(fullName, repository)) {
    reasons.push("repo-mismatch");
  }

  // 5. dsh.bundle.patch 必须存在且是安全相对路径
  const patch =
    m.dsh && typeof m.dsh === "object" && !Array.isArray(m.dsh)
      ? m.dsh.bundle && typeof m.dsh.bundle === "object" && !Array.isArray(m.dsh.bundle)
        ? m.dsh.bundle.patch
        : undefined
      : undefined;
  if (patch === undefined) {
    reasons.push("no-bundle-patch");
  } else if (!desktopSafeBundlePatch(patch)) {
    reasons.push("unsafe-bundle-patch");
  }

  // 6. 运行时兼容：legacy cordis 直接拒；@deepseek-ai/cordis 与 @deepseek-ai/dsh*
  //    的 range 必须覆盖桌面端运行时版本（includePrerelease）
  for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
    const deps = m[field];
    if (deps === undefined) continue;
    if (deps === null || typeof deps !== "object" || Array.isArray(deps)) {
      reasons.push(`bad-deps:${field}`);
      continue;
    }
    for (const [name, range] of Object.entries(deps)) {
      if (name === "cordis") {
        reasons.push("legacy-cordis");
        continue;
      }
      const runtime =
        name === "@deepseek-ai/cordis"
          ? DESKTOP_CORDIS_VERSION
          : name.startsWith("@deepseek-ai/dsh")
            ? DESKTOP_DSH_VERSION
            : null;
      if (runtime !== null && !desktopAccepts(runtime, range)) {
        reasons.push(`runtime-range:${name}`);
      }
    }
  }

  // 7. engines.node 与 dist 完整性
  const engines = m.engines;
  if (engines !== undefined) {
    if (engines === null || typeof engines !== "object" || Array.isArray(engines)) {
      reasons.push("engines-node");
    } else if (engines.node !== undefined && !desktopAccepts(DESKTOP_NODE_VERSION, engines.node)) {
      reasons.push("engines-node");
    }
  }
  const dist = m.dist && typeof m.dist === "object" && !Array.isArray(m.dist) ? m.dist : null;
  if (!dist || !desktopSha512Integrity(dist.integrity) || !desktopOfficialTarball(dist.tarball)) {
    reasons.push("bad-dist");
  }

  return { ok: reasons.length === 0, reasons };
}

/** 入口落在构建产物目录里 → git 装拉到的源码树里不存在这个文件。 */
const BUILD_DIR = /(?:^|[/"])(?:lib|dist|build|out|esm|cjs)\//;

/** main / module / exports / bin 里出现过的所有路径（exports 可能是嵌套对象）。 */
function entryPaths(pkg) {
  const out = [];
  const walk = (v) => {
    if (typeof v === "string") out.push(v);
    else if (v && typeof v === "object") for (const x of Object.values(v)) walk(x);
  };
  walk(pkg.main);
  walk(pkg.module);
  walk(pkg.exports);
  walk(pkg.bin);
  return out;
}

/**
 * 第一个落在构建产物目录里的入口路径（已去掉 `./` 前缀）；没有则 null。
 * 调用方拿它去仓库里实际查一次：产物已提交的话，git 直装照样能跑。
 */
export function buildEntryPath(pkg) {
  if (!pkg || typeof pkg !== "object") return null;
  const hit = entryPaths(pkg).find((p) => BUILD_DIR.test(p));
  return hit ? hit.replace(/^\.\//, "") : null;
}

/**
 * package.json 里与「能不能装」有关的事实，抽成扁平结构直接入库。
 * 传 null（仓库根没有 package.json）时返回全空事实。
 */
export function manifestFacts(pkg) {
  if (!pkg || typeof pkg !== "object") {
    return {
      pkgName: null,
      pkgVersion: null,
      pkgPrivate: false,
      hasBundle: false,
      hasPrepare: false,
      entryNeedsBuild: false,
    };
  }
  return {
    pkgName: typeof pkg.name === "string" ? pkg.name : null,
    pkgVersion: typeof pkg.version === "string" ? pkg.version : null,
    pkgPrivate: pkg.private === true,
    // 官方约定就是 dsh.bundle 指向一份 cordis.patch.yml；没有这个字段 dsh 不会把它
    // 追加进 dsh.profile.bundles，装进去也只是一条永远不会被装配的依赖
    hasBundle: Boolean(pkg.dsh?.bundle),
    hasPrepare: Boolean(pkg.scripts?.prepare),
    entryNeedsBuild: entryPaths(pkg).some((p) => BUILD_DIR.test(p)),
  };
}

/**
 * profile 名。profile 是用户自己起的名字，不是插件属性——这里只是给条能直接粘的命令，
 * 页面上会另外说明可以换。TUI 插件塞进 web profile 没有意义，按名字兜一下。
 */
function profileFor({ fullName, pkgName }) {
  const hay = `${fullName} ${pkgName ?? ""}`.toLowerCase();
  return /(^|[^a-z])tui([^a-z]|$)/.test(hay) ? "tui" : "web";
}

/** 去掉版本后缀：`pkg@latest` → `pkg`，`@scope/pkg@1.2` → `@scope/pkg`。 */
function bareName(target) {
  const at = target.lastIndexOf("@");
  return at > 0 ? target.slice(0, at) : target;
}

/**
 * README 里的 profile 名过半是占位符——`<name>`、`your-profile`、`<该名字>`。
 * 照抄上站会让用户粘出一条 shell 重定向错误，比我们自己的默认值更糟，所以只认真名。
 */
const PLACEHOLDER_PROFILES = new Set([
  "name",
  "profile",
  "profilename",
  "profile-name",
  "your-profile",
  "yourprofile",
  "my-profile",
  "myprofile",
  "demo", // 官方文档的示例名，作者多半是照抄来的
  "example",
  "test",
]);

function usableProfile(profile) {
  if (!profile) return null;
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(profile)) return null;
  return PLACEHOLDER_PROFILES.has(profile.toLowerCase()) ? null : profile;
}

/**
 * README 里作者自己写的安装命令。作者最清楚该进哪个 profile、要不要带 @latest，
 * 但 README 是散文、会过期，所以只取「命令形状」，包身份仍以 package.json 为准。
 * 取第一条 `dsh plugin … add …`——README 里通常第一条就是主推装法。
 */
export function readmeInstallHint(md) {
  if (!md) return null;
  const m = md.match(
    /(?:^|[`\s])((?:npx\s+(?:-y\s+)?\S+\s+)?dsh\s+plugin\s+[^\n`]*?\badd\s+([^\s`\n]+))/m,
  );
  if (!m) return null;
  const cmd = m[1].trim().replace(/\s+/g, " ");
  return {
    cmd,
    target: m[2],
    profile: cmd.match(/--profile\s+(\S+)/)?.[1] ?? null,
  };
}

/**
 * 推导结论 + 可直接粘贴的命令。
 * facts 为 manifestFacts() 的结果加上 npmPublished 与已筛选的 release 元数据。
 */
export function deriveInstall({ fullName, npmPublished, readmeCmd, ...facts }) {
  const {
    pkgName,
    pkgVersion,
    pkgPrivate,
    hasBundle,
    hasPrepare,
    entryNeedsBuild,
    entryCommitted,
    releaseTgzUrl,
    releaseTag,
    releasePrerelease,
    releaseAssetName,
    releaseAssetSize,
    releaseAssetDigest,
  } = facts;
  const hint = readmeCmd ? readmeInstallHint(readmeCmd) : null;
  // README 说的包和 package.json 对得上，才认它——对不上说明 README 过期了
  const hintTrusted = Boolean(hint && pkgName && bareName(hint.target) === pkgName);
  const profile =
    (hintTrusted && usableProfile(hint.profile)) || profileFor({ fullName, pkgName });
  // 命令始终由我们组装，不照抄 README 原句：占位符 profile、npx 前缀这些噪声不上站。
  // README 唯一带来的增量是「装哪个 profile」和「有没有钉版本」。
  const target = hintTrusted ? hint.target : pkgName;

  // 不是组合包就没有安装这回事：索引仓库、文档站、独立 App、宿主本体都落这里
  const none = (reason) => ({ kind: "not-installable", reason, cmd: null, profile, source: null });
  if (!pkgName) return none("no-manifest");
  if (!hasBundle) return none("no-bundle");

  // 发布过就用包名——避开 git 装源码那一整套坑。
  // npm 排在 release 之前：两者都是无法与源码对账的预构建产物，但 npm 那条链路有
  // provenance/attestation、恶意包扫描与 unpublish 机制，GitHub Release 资产一样都没有。
  if (npmPublished && !pkgPrivate) {
    return {
      kind: "npm",
      reason: null,
      cmd: `dsh plugin --profile ${profile} add ${target}`,
      profile,
      source: hintTrusted ? "readme" : "manifest",
    };
  }

  // 没发布 npm 但有版本严格匹配的 Release tarball：不走 git prepare / allowBuilds。
  // 入库事实也重新校验，避免旧数据或人工写库绕过 URL、包名与版本约束。
  const release = selectReleaseTarball({
    fullName,
    pkgName,
    pkgVersion,
    releases: [
      {
        draft: false,
        prerelease: releasePrerelease,
        tag_name: releaseTag,
        assets: [
          {
            state: "uploaded",
            name: releaseAssetName,
            size: releaseAssetSize,
            digest: releaseAssetDigest,
            browser_download_url: releaseTgzUrl,
          },
        ],
      },
    ],
  });
  if (release) {
    return {
      kind: "release",
      reason: null,
      cmd: `dsh plugin --profile ${profile} add ${release.releaseTgzUrl}`,
      profile,
      source: hintTrusted ? "readme" : "manifest",
    };
  }

  // 没发布 npm、也没有可用 release：README 里那条 `add <包名>` 装不上（npm 上根本没有），只借它的 profile 名。
  // 入口指向构建产物、没有 prepare、产物也没提交进仓库——三条齐了 git 直装才必然加载失败。
  // 不少作者（如 dsh-ads）直接把 lib/ 提交进仓库，这种 git 装是好的。
  if (entryNeedsBuild && !hasPrepare && !entryCommitted) {
    return {
      kind: "build-required",
      reason: "no-prepare",
      cmd: [
        `git clone https://github.com/${fullName}.git`,
        `cd ${fullName.split("/")[1]}`,
        `pnpm install && pnpm build`,
        `dsh plugin --profile ${profile} add .`,
      ].join("\n"),
      profile,
      source: "manifest",
    };
  }

  return {
    kind: "git",
    reason: null,
    cmd: `dsh plugin --profile ${profile} add github:${fullName}`,
    profile,
    source: "manifest",
  };
}
