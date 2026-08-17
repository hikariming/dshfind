import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /search 带 ?q= 是全站仅存的按请求动态渲染页面，放开会被爬虫刷函数调用
      disallow: ["/api/", "/*/login", "/*/unauthorized", "/*/search"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
