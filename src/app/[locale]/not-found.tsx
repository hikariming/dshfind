import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false },
};

/**
 * Segment 级 404：仅在 [locale] 段内显式调用 notFound() 时触发
 * （例如插件详情页找不到对应仓库）。
 *
 * 由 [locale]/layout.tsx 包裹——ThemeProvider / NextIntlClientProvider /
 * 站点头尾都已就位，这里只渲染主体。metadata 需要单独取翻译。
 */
export default async function LocaleNotFound() {
  // 占位取译：保证 NotFound 命名空间在该 segment 被标记为已用，便于后续维护。
  await getTranslations("NotFound");
  return <NotFoundContent />;
}
