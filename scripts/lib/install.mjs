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
 * 于是「仓库名」这一个信息根本不足以拼出安装命令，四件事都得先查清楚：
 * 有没有 package.json、是不是组合包、包名叫什么、装完能不能真的加载起来。
 */

/** 推导结论。null（未探测）由调用方表示，不在此枚举内。 */
export const INSTALL_KINDS = [
  "npm", // 已发布 npm，用包名装——首选
  "git", // 未发布 npm，但 git 直装能跑起来
  "build-required", // 是组合包，但 git 装拿到的源码缺构建产物，作者也没给 prepare
  "not-installable", // 压根不是可安装的插件包（索引站、文档、独立 App、私有包…）
];

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
 * package.json 里与「能不能装」有关的事实，抽成扁平结构直接入库。
 * 传 null（仓库根没有 package.json）时返回全空事实。
 */
export function manifestFacts(pkg) {
  if (!pkg || typeof pkg !== "object") {
    return {
      pkgName: null,
      pkgPrivate: false,
      hasBundle: false,
      hasPrepare: false,
      entryNeedsBuild: false,
    };
  }
  return {
    pkgName: typeof pkg.name === "string" ? pkg.name : null,
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

/**
 * 推导结论 + 可直接粘贴的命令。
 * facts 为 manifestFacts() 的结果加上 npmPublished（npm registry 上是否真存在）。
 */
export function deriveInstall({ fullName, npmPublished, ...facts }) {
  const { pkgName, pkgPrivate, hasBundle, hasPrepare, entryNeedsBuild } = facts;
  const profile = profileFor({ fullName, pkgName });

  // 不是组合包就没有安装这回事：索引仓库、文档站、独立 App、宿主本体都落这里
  if (!pkgName) return { kind: "not-installable", reason: "no-manifest", cmd: null, profile };
  if (!hasBundle) return { kind: "not-installable", reason: "no-bundle", cmd: null, profile };

  // 发布过就用包名——避开 git 装源码那一整套坑
  if (npmPublished && !pkgPrivate) {
    return {
      kind: "npm",
      reason: null,
      cmd: `dsh plugin --profile ${profile} add ${pkgName}`,
      profile,
    };
  }

  // 没发布 npm：只能 git 装，但入口指向构建产物又没有 prepare 的话，装完必然加载失败
  if (entryNeedsBuild && !hasPrepare) {
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
    };
  }

  return {
    kind: "git",
    reason: null,
    cmd: `dsh plugin --profile ${profile} add github:${fullName}`,
    profile,
  };
}
