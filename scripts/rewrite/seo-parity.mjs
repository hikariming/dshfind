#!/usr/bin/env node
// 前端重写 Gate：对比新老站同一路径的 SEO 关键字段。
//   快照老站：node scripts/rewrite/seo-parity.mjs --snapshot [--base=https://dshfind.com] [--per-type=5] [--types=learn]
//   对比新站：node scripts/rewrite/seo-parity.mjs --against=<新站 base> [--types=learn,docs]
//   某段全量：--snapshot --types=learn --per-type=9999 --baseline=output/rewrite/learn-full.json，对比时带同一个 --baseline
// 抽样来自 url-inventory.mjs 的 output/rewrite/urls-by-type.json；基线存 output/rewrite/seo-baseline.json。
// 只读，不需要任何密钥。
import { readFile, writeFile } from 'node:fs/promises';

// 只按第一个 = 切分：参数值本身可能含 =（如 --header='...: dshfind="<id>"'）
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [, k, v] = a.replace(/^--/, '').match(/^([^=]*)(?:=(.*))?$/s);
  return [k, v ?? true];
}));
const DIR = 'output/rewrite';
// --baseline=<file>：另存/另读一份基线，例如某一段路由的全量快照
const BASELINE = args.baseline || `${DIR}/seo-baseline.json`;

const decode = s => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
// 属性名大小写不敏感：React 输出 hrefLang，Astro/手写 HTML 输出 hreflang
const attr = (tag, name) => decode(tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1]);

/** <main> 内的可见文字（去脚本、样式与标签、压缩空白）；没有 <main> 时退回整个 body */
function mainText(body) {
  const main = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? body;
  return decode(
    main
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  ) ?? '';
}

// 抽取 head 关键字段 + h1 + 内链数。字段口径即 parity 口径，改这里等于改验收标准。
export function extractSeo(html, status) {
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
  const meta = key => metas.map(t => (attr(t, 'name') === key || attr(t, 'property') === key) ? attr(t, 'content') : null)
    .find(Boolean) ?? null;
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]);
  const jsonLdTypes = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap(m => {
      try { return [].concat(JSON.parse(m[1])).flatMap(x => x['@graph'] ?? [x]).map(x => x['@type']); }
      catch { return ['<invalid>']; }
    })
    .flat().sort();
  const body = html.slice(html.indexOf('</head>'));
  return {
    status,
    title: decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]) ?? null,
    description: meta('description'),
    robots: meta('robots'),
    canonical: links.map(t => attr(t, 'rel') === 'canonical' ? attr(t, 'href') : null).find(Boolean) ?? null,
    hreflang: links.filter(t => attr(t, 'rel') === 'alternate' && attr(t, 'hreflang'))
      .map(t => `${attr(t, 'hreflang')}=${attr(t, 'href')}`).sort(),
    og: ['og:title', 'og:description', 'og:image', 'og:type', 'twitter:card'].map(k => `${k}=${meta(k)}`),
    jsonLdTypes,
    h1: decode(body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '')) ?? null,
    internalLinks: new Set([...body.matchAll(/href="(\/(?:zh|en|ja|ko)\/[^"#?]*)"/g)].map(m => m[1])).size,
    // <main> 里可见文字的量：head 与 h1 全对、正文却是空的（渲染失败）时，只有这一项能抓到
    mainTextLength: mainText(body).length,
  };
}

// 全量快照动辄上千请求，单次网络抖动不该让整轮作废：失败重试 3 次
async function fetchWithRetry(url, init, attempts = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
    } catch (e) {
      if (i >= attempts) throw new Error(`${url}: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
}

async function fetchSeo(base, path, withHtml = false) {
  const res = await fetchWithRetry(new URL(path, base), {
    redirect: 'manual',
    // --header="Name: value"：例如 Cloudflare-Workers-Version-Overrides，在正式域名上验证未放量的版本
    headers: {
      'user-agent': 'dshfind-seo-parity/1',
      // 按浏览器导航的样子请求：Workers 静态资源层对 Sec-Fetch-Mode: navigate 有专门分支
      // （not_found_handling 会绕过 Worker），不带这组头就测不到真实用户的路径
      'sec-fetch-mode': 'navigate',
      'sec-fetch-dest': 'document',
      accept: 'text/html,application/xhtml+xml',
      ...(args.header ? Object.fromEntries([String(args.header).split(/:\s*(.*)/s).slice(0, 2)]) : {}),
    },
  });
  const html = await res.text();
  const seo = extractSeo(html, res.status);
  return withHtml ? { seo, html } : seo;
}

// 确定性抽样：每类取首、尾与均匀间隔，保证每次跑同一批，便于对比
function sample(list, n) {
  if (list.length <= n) return list;
  const step = (list.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => list[Math.round(i * step)]);
}

// 新站 base 不同：比较时把绝对 URL 中的 base 归一回生产域名
const normalize = (v, base) =>
  JSON.parse(JSON.stringify(v).replaceAll(base.replace(/\/$/, ''), 'https://dshfind.com'));

// 有意的改进（不算回退）：老站很多页面没声明 openGraph，继承了全站 og:title/description。
// 新站一律用页面自己的标题与描述——只要 og 其余字段不变，且 title/description 与本页 head 一致即放行。
function ogImproved(a, b) {
  const og = seo => Object.fromEntries(seo.og.map(s => s.split(/=(.*)/s).slice(0, 2)));
  const [oa, ob] = [og(a), og(b)];
  const others = Object.keys(oa).filter(k => !['og:title', 'og:description'].includes(k));
  // og:type 是 OG 协议必填项：老站页面自带 openGraph 时 Next 整体替换掉了 layout 的 type，新站补上不算回退
  return others.every(k => oa[k] === ob[k] || (k === 'og:type' && oa[k] === 'null' && ob[k] !== 'null')) &&
    ob['og:title'] === b.title?.replace(/ · dshfind$/, '') &&
    ob['og:description'] === b.description;
}

/**
 * 其余逐字段的有意改进，每条写明理由。只放行「老站明确有缺陷、新站补上」的方向，反向一律报回退。
 * og 字段的全局规则见上面的 ogImproved；首页 og:title 本身就等于站点标题，也走那条。
 */
const INTENTIONAL = [
  // 老站首页打字机首帧是空串，服务端 h1 为空；新站直接输出第一句
  { field: 'h1', when: (a, b) => !a.h1 && Boolean(b.h1) },
  // 搜索结果页（?q= 的无数组合）是重复薄页，老站既没 noindex 也没 canonical
  { field: 'robots', when: (a, b, path) => /\/search$/.test(path) && a.robots == null && /noindex/.test(b.robots ?? '') },
];

function diff(a, b, path) {
  const out = [];
  for (const k of Object.keys(a)) {
    if (k === 'og' && ogImproved(a, b)) continue;
    if (INTENTIONAL.some(r => r.field === k && r.when(a, b, path))) continue;
    if (k === 'internalLinks') {
      if (b[k] < a[k] * 0.9) out.push(`${k}: ${a[k]} → ${b[k]}（减少超过 10%）`);
    } else if (k === 'mainTextLength') {
      // 允许排版差异带来的出入，但正文少掉三成以上就是内容丢了
      if (b[k] < a[k] * 0.7) out.push(`${k}: ${a[k]} → ${b[k]}（正文减少超过 30%）`);
    } else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
      out.push(`${k}: ${JSON.stringify(a[k])} → ${JSON.stringify(b[k])}`);
    }
  }
  return out;
}

async function pool(items, size, fn) {
  const results = [];
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const idx = i++; results[idx] = await fn(items[idx]); }
  }));
  return results;
}

async function main() {
  if (args.snapshot) {
    const base = args.base || 'https://dshfind.com';
    const perType = Number(args['per-type'] || 5);
    const byType = JSON.parse(await readFile(`${DIR}/urls-by-type.json`, 'utf8'));
    const only = args.types ? new Set(String(args.types).split(',')) : null;
    const paths = Object.entries(byType)
      .filter(([t]) => !['api', 'sitemap', 'root'].includes(t) && (!only || only.has(t)))
      .flatMap(([type, list]) => sample(list.sort(), perType).map(path => ({ type, path })));
    const pages = await pool(paths, 6, async p => ({ ...p, seo: await fetchSeo(base, p.path) }));
    await writeFile(BASELINE, JSON.stringify({ base, takenAt: new Date().toISOString(), pages }, null, 2));
    console.log(`baseline: ${pages.length} pages → ${BASELINE}`);
    for (const p of pages.filter(p => p.seo.status !== 200 || !p.seo.title || !p.seo.canonical)) {
      console.log(`  ⚠ ${p.path}: status=${p.seo.status} title=${!!p.seo.title} canonical=${!!p.seo.canonical}`);
    }
    return;
  }
  if (!args.against) throw new Error('需要 --snapshot 或 --against=<新站 base>');
  const baseline = JSON.parse(await readFile(BASELINE, 'utf8'));
  const types = args.types ? new Set(String(args.types).split(',')) : null;
  const pages = baseline.pages.filter(p => !types || types.has(p.type));
  let failed = 0;
  const servedBy = { astro: 0, next: 0, other: 0 };
  await pool(pages, 6, async p => {
    const { seo, html } = await fetchSeo(args.against, p.path, true);
    servedBy[html.includes('/_astro/') ? 'astro' : html.includes('/_next/') ? 'next' : 'other']++;
    const now = normalize(seo, args.against);
    const problems = diff(p.seo, now, p.path);
    if (problems.length) { failed++; console.log(`✗ ${p.path}\n  ${problems.join('\n  ')}`); }
  });
  // 实际由谁提供：防止请求没打到被测版本（覆盖头无效、路由没生效）时拿老站比老站、假阳性全过
  console.log(`served by: ${JSON.stringify(servedBy)}`);
  console.log(`${pages.length - failed}/${pages.length} parity OK`);
  process.exitCode = failed ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
