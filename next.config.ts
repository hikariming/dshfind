import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许 .mdx 文件作为路由页面（App Router 约定：文件夹内的 page.mdx）
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  /* config options here */
};

const withMDX = createMDX({
  options: {
    // Turbopack 模式下插件需用字符串形式指定
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [],
  },
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(withMDX(nextConfig));
