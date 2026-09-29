import { getDb } from "@/lib/db";
import {
  isProxyHost,
  proxyImageUrl,
} from "../../../../../../scripts/lib/readme-proxy.mjs";

/**
 * GET /api/readme-img/[owner]/[repo]?u=<图片地址>
 * —— 详情页 README 图片的站内代理。
 *
 * 为什么要代理：README 图片九成来自 raw.githubusercontent / shields / github.com，
 * 国内访问动辄十几秒甚至打不开，头图出不来整块 README 就是一片空白。
 *
 * 只代理头部插件（降本）：请求的地址必须原样出现在该仓库已入库的 README HTML 里，
 * 而 README 只给 star ≥ 100 的插件入库（scripts/fetch-readmes.mjs）。随手拼一个
 * 别的地址、或者别的仓库的图，一律 404——不会被当成开放代理用。
 *
 * 成本：响应带 s-maxage，走站点的原生 Workers Cache（scripts/lib/page-cache-policy.mjs），
 * 命中时 Worker 根本不执行；只有每张图每 7 天第一次访问会查一次库、回源一次。
 */

/** 单张图片上限。超过的多半是录屏 GIF，不值得占代理带宽，让浏览器直连原图。 */
const MAX_BYTES = 15 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;
/** 图片更新很少，边缘缓存 7 天；浏览器缓存 1 天。 */
const CACHE_CONTROL = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

/** 跟随重定向后的落点也得是 GitHub / shields 的地盘（user-attachments 会 302 到 CDN）。 */
function trustedFinalHost(url: URL) {
  return (
    url.protocol === "https:" &&
    (url.hostname === "img.shields.io" ||
      url.hostname === "github.com" ||
      url.hostname.endsWith(".githubusercontent.com"))
  );
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "private, no-store" },
  });
}

/** 上游出问题时让浏览器自己去试原图——站内代理坏了不该连累 README 本来能显示的图。 */
function fallback(original: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: original, "Cache-Control": "private, no-store" },
  });
}

async function isListed(fullName: string, needle: string) {
  try {
    const rs = await getDb().execute({
      sql: `SELECT 1 FROM plugin_readmes r
            JOIN plugins p ON p.full_name = r.full_name
            WHERE r.full_name = ? AND r.status = 'ok'
              AND p.stars >= 100 AND p.is_present = 1 AND p.is_risky = 0
              AND instr(r.html, ?) > 0
            LIMIT 1`,
      args: [fullName, needle],
    });
    return rs.rows.length > 0;
  } catch {
    return false;
  }
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/readme-img/[owner]/[repo]">,
) {
  const { owner, repo } = await ctx.params;
  const raw = new URL(request.url).searchParams.get("u");
  if (!raw) return notFound();

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return notFound();
  }
  if (!isProxyHost(target)) return notFound();

  // 用渲染时同一个函数重拼一遍，拿去入库的 HTML 里找——找得到才说明这张图确实属于这份 README
  const fullName = `${owner}/${repo}`;
  if (!(await isListed(fullName, proxyImageUrl(target.href, fullName)))) return notFound();

  let upstream: Response;
  try {
    upstream = await fetch(target.href, {
      headers: { "User-Agent": "dshfind-readme-proxy (+https://dshfind.com)" },
      redirect: "follow",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return fallback(target.href);
  }

  const type = (upstream.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const declared = Number(upstream.headers.get("content-length") ?? 0);
  if (
    !upstream.ok ||
    !type.startsWith("image/") ||
    !trustedFinalHost(new URL(upstream.url || target.href)) ||
    declared > MAX_BYTES
  ) {
    return fallback(target.href);
  }

  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return fallback(target.href);

  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": CACHE_CONTROL,
      // SVG 从本站同源返回：直接在地址栏打开时不许跑脚本、不许再拉外部资源
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
      Vary: "Accept-Encoding",
    },
  });
}
