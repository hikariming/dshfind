import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/**
 * [locale] 段内的兜底路由：任何没被具体路由接住的路径都在这里 404。
 *
 * 取代原先的根级 app/not-found.tsx——那套方案需要一个独立的根 layout，
 * 而根 layout 里的 getLocale() 走 headers()，会把全站拖成动态渲染。
 * 现在无语言前缀的路径由 middleware 重定向到 /zh/...，再由这里落进
 * [locale]/not-found.tsx（自带站点头尾与多语言文案）。
 */
/**
 * 空数组 = 不预渲染任何路径，但让路由进入 SSG+fallback 模式：
 * 404 结果按 URL 进 ISR 缓存，机器人反复探测同一路径时命中缓存，
 * 不再每次都跑一遍函数渲染。
 */
export function generateStaticParams(): { rest: string[] }[] {
  return [];
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
