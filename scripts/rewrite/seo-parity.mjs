#!/usr/bin/env node
// 前端重写 Gate：对比新老站同一路径的 SEO 关键字段。
//   快照老站：node scripts/rewrite/seo-parity.mjs --snapshot [--base=https://dshfind.com] [--per-type=5]
//   对比新站：node scripts/rewrite/seo-parity.mjs --against=<新站 base> [--types=learn,docs]
// 抽样来自 url-inventory.mjs 的 output/rewrite/urls-by-type.json；基线存 output/rewrite/seo-baseline.json。
// 只读，不需要任何密钥。
import { readFile, writeFile } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const DIR = 'output/rewrite';
const BASELINE = `${DIR}/seo-baseline.json`;

const decode = s => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const attr = (tag, name) => decode(tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]);

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
  };
}

async function fetchSeo(base, path) {
  const res = await fetch(new URL(path, base), {
    redirect: 'manual', signal: AbortSignal.timeout(60000),
    headers: { 'user-agent': 'dshfind-seo-parity/1' },
  });
  return extractSeo(await res.text(), res.status);
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

function diff(a, b) {
  const out = [];
  for (const k of Object.keys(a)) {
    if (k === 'internalLinks') {
      if (b[k] < a[k] * 0.9) out.push(`${k}: ${a[k]} → ${b[k]}（减少超过 10%）`);
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
    const paths = Object.entries(byType)
      .filter(([t]) => !['api', 'sitemap', 'root'].includes(t))
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
  await pool(pages, 6, async p => {
    const now = normalize(await fetchSeo(args.against, p.path), args.against);
    const problems = diff(p.seo, now);
    if (problems.length) { failed++; console.log(`✗ ${p.path}\n  ${problems.join('\n  ')}`); }
  });
  console.log(`${pages.length - failed}/${pages.length} parity OK`);
  process.exitCode = failed ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
