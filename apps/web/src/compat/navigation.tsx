/**
 * "@/i18n/navigation"（next-intl 的带语言前缀导航）与 "next/navigation" 的最小替身，
 * 供复用的老站客户端组件使用。站内绝对路径自动补当前语言前缀；跳转就是整页导航（新站是多页站点）。
 */
import type { JSX } from "preact";

import { useLocale } from "./next-intl";

const LOCALE_PREFIX = /^\/(zh|en|ja|ko)(\/|$)/;

function localize(href: string, locale: string): string {
  return href.startsWith("/") && !href.startsWith("//") && !LOCALE_PREFIX.test(href) ? `/${locale}${href === "/" ? "" : href}` : href;
}

type LinkProps = Omit<JSX.HTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; locale?: string; prefetch?: boolean };

export function Link({ href, locale, prefetch: _prefetch, ...rest }: LinkProps) {
  const current = useLocale();
  return <a href={localize(href, locale ?? current)} {...rest} />;
}

export function useRouter() {
  const locale = useLocale();
  return {
    push: (href: string) => window.location.assign(localize(href, locale)),
    replace: (href: string) => window.location.replace(localize(href, locale)),
    refresh: () => window.location.reload(),
    back: () => window.history.back(),
  };
}

export function usePathname(): string {
  return typeof window === "undefined" ? "/" : window.location.pathname.replace(LOCALE_PREFIX, "/");
}

/** 服务端渲染时没有查询串；浏览器水合后按真实 URL 重新渲染 */
export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
}
