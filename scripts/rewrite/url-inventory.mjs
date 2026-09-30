#!/usr/bin/env node
// 前端重写第 0 阶段：从线上 sitemap 拉全量 URL，按路由类型分桶，作为新站 parity 的验收清单。
// 用法：node scripts/rewrite/url-inventory.mjs [base=https://dshfind.com] [out=output/rewrite]
// 只读，不需要任何密钥。
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.argv[2] || 'https://dshfind.com';
const outDir = process.argv[3] || 'output/rewrite';

// sitemap 之外、但新站同样要接管的路由
const EXTRA_PATHS = [
  '/', '/zh/search', '/zh/login', '/zh/bbs/new', '/zh/plugins/browse',
  '/robots.txt', '/sitemap.xml',
  '/api/plugins-data', '/api/suggest?q=memory',
  '/api/badge/fuzz1og/dsh-ocgo-quota', '/api/card/fuzz1og/dsh-ocgo-quota',
];

export function routeType(pathname) {
  const m = pathname.match(/^\/(zh|en|ja|ko)(\/.*)?$/);
  if (!m) return pathname.startsWith('/api/') ? 'api' : pathname.startsWith('/sitemap') ? 'sitemap' : 'root';
  const p = m[2] || '';
  if (p === '') return 'home';
  if (p.startsWith('/learn')) return 'learn';
  if (p.startsWith('/docs')) return 'docs';
  if (/^\/plugins\/(c|t|lang)\//.test(p)) return `plugins-${p.split('/')[2]}`;
  if (p.startsWith('/plugins/all/')) return 'plugins-all';
  if (/^\/plugins\/[^/]+\/[^/]+$/.test(p)) return 'plugin-detail';
  if (p.startsWith('/plugins')) return 'plugins-index';
  if (p.startsWith('/bbs')) return 'bbs';
  if (p === '/search' || p === '/login') return p.slice(1);
  return 'other';
}

async function text(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

const locs = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());

async function main() {
  const shards = locs(await text(new URL('/sitemap.xml', base)));
  const urls = new Set();
  for (const shard of shards) {
    // sitemap 里写的是生产域名；换到被测 base 上抓取
    const u = new URL(shard);
    for (const loc of locs(await text(new URL(u.pathname, base)))) urls.add(new URL(loc).pathname);
    process.stderr.write(`${u.pathname}: ${urls.size}\n`);
  }
  const sitemapCount = urls.size;
  for (const p of EXTRA_PATHS) urls.add(p);

  const buckets = {};
  for (const p of urls) (buckets[routeType(p.split('?')[0])] ??= []).push(p);
  const summary = Object.fromEntries(Object.entries(buckets).sort().map(([k, v]) => [k, v.length]));

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'urls.txt'), [...urls].sort().join('\n') + '\n');
  await writeFile(path.join(outDir, 'urls-by-type.json'), JSON.stringify(buckets, null, 2));
  console.log(JSON.stringify({ base, shards: shards.length, sitemapCount, total: urls.size, summary }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
