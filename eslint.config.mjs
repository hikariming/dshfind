import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// 根目录只剩数据管线脚本（scripts/）与新站复用的 src/；Astro 站有自己的工具链（astro check）
export default defineConfig([
  globalIgnores([
    ".wrangler/**",
    ".pnpm-store/**",
    "workers/api-edge/assets/**",
    "workers/api-edge/.wrangler/**",
    "**/.cloudflare/**",
    "apps/**",
    // gen:data 的生成物（plugins-real.ts 十几 MB，lint 它只会吃光内存）
    "src/lib/plugins-real.ts",
    "src/lib/plugin-i18n.ts",
    "src/lib/home-picks.ts",
    "src/lib/docs-manifest.ts",
    "src/lib/lessons-manifest.ts",
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // 尽力而为的 localStorage / cookie 读写，失败就当没有
      "no-empty": ["error", { allowEmptyCatch: true }],
      // 清洗用户输入时有意匹配 \x00-\x1f
      "no-control-regex": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
]);
