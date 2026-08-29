import { matchesGlob, posix } from "node:path";

const SAFE_DIRECTORY = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;
const SAFE_PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

function workspacePatterns(pkg) {
  return Array.isArray(pkg?.workspaces)
    ? pkg.workspaces
    : Array.isArray(pkg?.workspaces?.packages)
      ? pkg.workspaces.packages
      : [];
}

function safePattern(value) {
  if (typeof value !== "string") return null;
  const negated = value.startsWith("!");
  const pattern = (negated ? value.slice(1) : value)
    .trim()
    .replace(/^\.\//, "")
    .replace(/\/$/, "");
  if (
    !pattern ||
    pattern.startsWith("/") ||
    pattern.includes("\\") ||
    pattern.split("/").includes("..")
  ) {
    return null;
  }
  return { negated, pattern };
}

/** Apply package.json workspace globs to repository package.json paths. */
export function workspaceDirectories(pkg, manifestPaths) {
  const directories = [...new Set(
    manifestPaths
      .filter((path) => path.endsWith("/package.json"))
      .map((path) => posix.dirname(path))
      .filter((path) => SAFE_DIRECTORY.test(path)),
  )];
  const selected = new Set();
  let complete = true;
  for (const raw of workspacePatterns(pkg)) {
    const parsed = safePattern(raw);
    if (!parsed) {
      complete = false;
      continue;
    }
    for (const directory of directories) {
      if (!matchesGlob(directory, parsed.pattern)) continue;
      if (parsed.negated) selected.delete(directory);
      else selected.add(directory);
    }
  }
  return { directories: [...selected].sort(), complete };
}

/** Internal owner/repo route key; the public catalog identity remains the package name. */
export function workspaceItemFullName(repositoryFullName, packageName) {
  if (!/^[^/]+\/[^/]+$/.test(repositoryFullName) || !SAFE_PACKAGE_NAME.test(packageName)) {
    return null;
  }
  const suffix = packageName.startsWith("@")
    ? packageName.slice(1).replace("/", "~")
    : packageName;
  return `${repositoryFullName}~${suffix}`;
}

/** Resolve one catalog row to its real repository and optional package directory. */
export function pluginSource(row) {
  return {
    fullName: String(row.full_name),
    repositoryFullName: row.repository_full_name == null
      ? String(row.full_name)
      : String(row.repository_full_name),
    packagePath: row.package_path == null ? null : String(row.package_path),
  };
}

/** Public catalog identity: package name for workspace children, route key otherwise. */
export function catalogIdentity(row) {
  return row.repository_full_name == null || row.pkg_name == null
    ? String(row.full_name)
    : String(row.pkg_name);
}

export function repositoryPath(packagePath, file) {
  return packagePath ? `${packagePath}/${file}` : file;
}
