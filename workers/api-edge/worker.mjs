/**
 * 主模块薄壳。workerd 会把主模块的每个具名导出都当成 entrypoint 校验
 * （字符串常量导出会让 worker 直接起不来），所以这里只允许有 default 导出，
 * 全部实现住在 shared.mjs。
 */
import { handleRequest } from "./shared.mjs";

// DO class 必须由主模块导出（workerd 按 durable_objects.class_name 在这里找）。
export { RateLimiter } from "./ratelimiter-do.mjs";

const worker = { fetch: handleRequest };
export default worker;
