#!/usr/bin/env node
// Run against the two dedicated diagnostic preview Workers after cf:build/deploy.
// Never accept missing counters, silent DB fallback, or a cached response as a
// successful cold-read budget check. Requires no secrets and performs no writes.
import assert from 'node:assert/strict';

const [web, api] = process.argv.slice(2);
assert.ok(web && api, 'Usage: pnpm test:e2e:reads <web-preview-url> <api-preview-url>');
const name = 'fuzz1og/dsh-ocgo-quota';
const nonce = crypto.randomUUID();
const bypass = { Cookie: 'read_budget_probe=1' };
const reports = [];
async function check(base, path, budget, init = {}, status = 200) {
  const response = await fetch(new URL(path, base), { ...init, signal: AbortSignal.timeout(60000) });
  const body = await response.text();
  assert.equal(response.status, status, `${path}: ${body.slice(0, 200)}`);
  for (const header of ['queries', 'rows-read', 'errors', 'missing-meta']) {
    assert.match(response.headers.get('x-dshfind-d1-'+header) ?? '', /^\d+$/, `${path}: missing ${header}`);
  }
  assert.equal(response.headers.get('x-dshfind-d1-errors'), '0', `${path}: DB fallback/errors`);
  assert.equal(response.headers.get('x-dshfind-d1-missing-meta'), '0');
  const rows = Number(response.headers.get('x-dshfind-d1-rows-read'));
  const queries = Number(response.headers.get('x-dshfind-d1-queries'));
  assert.ok(rows <= budget, `${path}: ${rows} rows > ${budget}`);
  if (budget === 0) assert.equal(queries, 0, `${path}: unexpected SQL`);
  reports.push({ path, status, queries, rows, cache: response.headers.get('cf-cache-status') });
  console.log(JSON.stringify(reports.at(-1)));
  return { response, body, queries, rows };
}

for (const locale of ['zh', 'en', 'ja', 'ko']) {
  const listing = await check(web, `/${locale}/plugins`, 0, { headers: bypass });
  assert.ok(new RegExp(`href="/${locale}/plugins/[^/\"]+/[^/\"]+"`).test(listing.body), 'listing must contain plugin links');
  assert.equal(listing.response.headers.get('x-dshfind-cache-policy'), 'bypass');
  const detail = await check(web, `/${locale}/plugins/${name}`, 25, { headers: bypass });
  assert.ok(detail.queries >= 3 && detail.rows > 0, 'known detail must execute real D1, not static fallback');
}
for (const headers of [{}, { Cookie: 'NEXT_LOCALE=zh' }, bypass, { Authorization: 'Bearer read-budget-probe' }]) {
  const result = await check(web, '/api/plugins-data', 0, { headers });
  assert.equal(result.response.headers.get('x-dshfind-data-source'), 'build-snapshot');
  const json = JSON.parse(result.body);
  assert.ok(json.plugins.length > 13000);
  assert.ok(json.plugins.every(p => typeof p.starGrowth === 'number' && 'contributorGrowth' in p && 'contributors' in p));
  assert.ok(Object.keys(json.i18nDescriptions).length > 0);
  assert.equal(result.response.headers.get('x-dshfind-cache-policy'),
    headers.Authorization || headers.Cookie === bypass.Cookie ? 'bypass' : 'public-1800');
}
const uppercase = await check(web, '/en/plugins/'+name.toUpperCase(), 25, { headers: bypass });
assert.ok(uppercase.queries >= 3);
await check(web, '/en/plugins/read-budget-missing/'+nonce, 3, { headers: bypass }, 404);
for (const kind of ['badge', 'card']) {
  const result = await check(web, `/api/${kind}/${name}`, 25, { headers: bypass });
  assert.match(result.response.headers.get('content-type'), /image\/svg\+xml/);
  assert.ok(result.queries >= 3);
}
// RSC and HTML use distinct cache variants even for the same URL.
const cachePath = `/en/plugins/${name}?read-budget=${nonce}`;
const html = await check(web, cachePath, 25);
const htmlHit = await check(web, cachePath, 25);
assert.equal(htmlHit.response.headers.get('cf-cache-status'), 'HIT');
assert.equal(htmlHit.response.headers.get('x-dshfind-render-id'), html.response.headers.get('x-dshfind-render-id'));
const rsc = await check(web, cachePath, 25, { headers: { RSC: '1' } });
assert.match(rsc.response.headers.get('content-type'), /text\/x-component/);
assert.notEqual(rsc.response.headers.get('x-dshfind-render-id'), html.response.headers.get('x-dshfind-render-id'));
const rscHit = await check(web, cachePath, 25, { headers: { RSC: '1' } });
assert.equal(rscHit.response.headers.get('cf-cache-status'), 'HIT');
assert.equal(rscHit.response.headers.get('x-dshfind-render-id'), rsc.response.headers.get('x-dshfind-render-id'));

await check(api, '/v1/plugins?limit=50', 0);
for (const days of [1, 30, 90]) {
  const result = await check(api, `/v1/plugins/${name}?snapshot_days=${days}`, 2 * (days + 1) + 20);
  const detail = JSON.parse(result.body);
  assert.ok(detail.snapshots.length <= days + 1);
  assert.ok(result.queries >= 3);
}
async function graph(query, variables, budget) {
  const result = await check(api, '/graphql', budget, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const data = JSON.parse(result.body);
  assert.equal(data.errors, undefined, JSON.stringify(data.errors));
  return data.data;
}
const growth = await graph('{plugins(first:50){nodes{fullName growth{stars contributors}}}}', {}, 600);
assert.equal(growth.plugins.nodes.length, 50);
const windows = await graph('{plugins(first:50){nodes{snapshots(days:90){date} growth{stars}}}}', {}, 10000);
assert.ok(windows.plugins.nodes.every(p => p.snapshots.length <= 91));
await graph(`query($days:Int!){plugin(fullName:"${name}"){short:snapshots(days:1){date} long:snapshots(days:$days){date} growth{stars}}}`, { days: 90 }, 200);
assert.equal((await graph(`{plugin(fullName:"read-budget-missing/${nonce}"){fullName}}`, {}, 0)).plugin, null);
console.log(`PASS: ${reports.length} HTTP checks; cached counter headers refer to the original render (same render-id).`);
