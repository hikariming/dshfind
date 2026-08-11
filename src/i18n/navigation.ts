import { createNavigation } from "next-intl/navigation";
import { defaultLocale, locales } from "./config";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({
    locales,
    defaultLocale,
    localePrefix: "always",
  });
