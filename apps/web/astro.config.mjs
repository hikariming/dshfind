// @ts-check
import { fileURLToPath } from "node:url";

import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

/** 迁移期与老 Next 站共用 src/（课程 MDX、图示、lib）；迁完后再搬进本目录。 */
const legacySrc = fileURLToPath(new URL("../../src", import.meta.url));
const local = (/** @type {string} */ p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  site: "https://dshfind.com",
  // 老站 URL 无尾斜杠，canonical / sitemap 都按此口径
  trailingSlash: "never",
  build: { format: "file" },
  // 老站 MDX 不做排版替换；开着会把课程里的直引号改成弯引号（标题、代码味的正文都会变）
  markdown: { smartypants: false },
  // 适配器默认启用 Astro sessions 并在部署时自动建 KV 命名空间；登录态沿用 dshfind_session cookie，用不上
  session: false,
  // 与老站 next/font 同款字体与变量名；构建期下载、随站自托管（国内访问不依赖 Google Fonts）
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Geist",
      cssVariable: "--font-geist-sans",
      weights: ["100 900"],
      subsets: ["latin"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      weights: ["100 900"],
      subsets: ["latin"],
    },
  ],
  i18n: {
    locales: ["zh", "en", "ja", "ko"],
    defaultLocale: "zh",
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
  },
  adapter: cloudflare({
    // 默认 cloudflare-binding 会按次计 Cloudflare Images 费用；插图都是现成文件，直接透传
    imageService: "passthrough",
  }),
  integrations: [
    // compat：复用老站的 React 图示组件（纯 SVG，服务端渲染、零 JS）
    preact({ compat: true }),
    // 老站代码块没有语法高亮，先保持一致
    mdx({ syntaxHighlight: false }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // 顺序敏感：具体路径的替身必须排在通配的 @ 之前
      alias: [
        { find: "@/components/quiz", replacement: local("./src/components/quiz.ts") },
        { find: /^@\//, replacement: `${legacySrc}/` },
      ],
    },
  },
});
