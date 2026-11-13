/**
 * 子进程环境构造：只保留运行所需变量。
 *
 * D1_ 与 CLOUDFLARE_ 前缀的变量是主库写权限，绝不能传给 checker 或 npm
 * 子进程。单独成文件（而不是放进 entry-check.mjs 的纯映射层），因为 Worker
 * 会 import 那个纯模块，不能带上 process 依赖。
 */
export function childEnv(extra = {}, env = process.env) {
  const out = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("D1_") || key.startsWith("CLOUDFLARE_")) continue;
    out[key] = value;
  }
  return { ...out, ...extra };
}
