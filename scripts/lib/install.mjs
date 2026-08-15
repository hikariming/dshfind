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
