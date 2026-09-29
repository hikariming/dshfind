/**
 * README 图片代理的共享口径：渲染脚本（scripts/lib/readme-render.mjs）按它改写地址，
 * 代理路由（src/app/api/readme-img）按它校验请求。单独成文件，是为了不让路由把
 * unified/rehype 那一整套渲染依赖打进 Worker 包。
 */

/**
 * 走站内代理的图床。
 *
 * 实测头部 236 个 README 共 2,732 张图，这四个域名占约 90%，且在国内都慢甚至打不开
 * （raw.githubusercontent 一张 1MB 截图 12 秒、shields 徽章 13 秒）。其余长尾图床
 * 原样直连——代理它们省不了多少，却会让白名单变成开放代理。
 */
export const PROXY_HOSTS = new Set([
  "raw.githubusercontent.com",
  "img.shields.io",
  "github.com",
  "avatars.githubusercontent.com",
]);

/** 代理地址的路径前缀。 */
export const PROXY_PATH = "/api/readme-img";

/** 上游是否在白名单里（只认 https）。 */
export function isProxyHost(url) {
  return url.protocol === "https:" && PROXY_HOSTS.has(url.hostname);
}

/**
 * 图片地址 → 站内代理地址。仓库名编进路径，代理据此只放行「出现在该仓库已入库
 * README 里」的图片——入库门槛就是 star ≥ 100，所以代理天然只服务头部插件。
 * encodeURIComponent 的产物不含 & 与引号，写进 HTML 属性后字节不变，代理端可以
 * 直接拿同一个函数重新拼出地址，去入库的 HTML 里查找。
 */
export function proxyImageUrl(src, fullName) {
  let url;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  if (!isProxyHost(url)) return src;
  return `${PROXY_PATH}/${fullName}?u=${encodeURIComponent(url.href)}`;
}
