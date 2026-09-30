// Worker 运行时模块。只声明本项目用到的部分；binding 的具体形状在使用处（~/detail/data.ts）按需收窄。
declare module "cloudflare:workers" {
  export const env: Record<string, unknown>;
}
