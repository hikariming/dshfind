import { createNavigation } from "next-intl/navigation";
import { defaultLocale, locales } from "./config";

export const {
  Link,
  redirect,
  // 仓库改名后旧详情页 URL 靠它 308 到新地址（src/lib/plugin-renames.ts）
  permanentRedirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation({
    locales,
    defaultLocale,
    localePrefix: "always",
  });
