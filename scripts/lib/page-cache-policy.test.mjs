import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from './page-cache-policy.mjs';

const page = '/en/plugins/TellToday/dsh-narrative-voice';
const requiredVary = ['cookie', 'host', 'x-forwarded-proto', 'authorization', 'next-action', 'rsc', 'next-router-state-tree', 'next-router-prefetch', 'next-router-segment-prefetch', 'next-url'];
function apply(path = page, requestInit = {}, responseInit = {}, env = {}) {
  return policy.applyPageCachePolicy(new Request(`https://dshfind.com${path}`, requestInit), new Response('payload', {
    ...responseInit,
    headers: { 'content-type': 'text/html; charset=utf-8', ...responseInit.headers },
  }), env);
}
function bypass(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('cdn-cache-control'), null);
  assert.equal(response.headers.get('cloudflare-cdn-cache-control'), null);
  assert.equal(response.headers.get('x-dshfind-cache-policy'), 'bypass');
}

test('exports the route and response policies', () => {
  assert.equal(typeof policy.cacheTtl, 'function');
  assert.equal(typeof policy.applyPageCachePolicy, 'function');
});

test('all phase explicitly allows public routes with their TTLs', () => {
  for (const locale of ['en', 'zh', 'ja', 'ko']) {
    for (const suffix of ['', '/plugins', '/plugins/browse', '/plugins/all/1', '/plugins/all/123', '/plugins/c/tools', '/plugins/t/test', '/plugins/lang/rust', '/plugins/owner/repo', '/docs', '/docs/start/install', '/learn', '/learn/guide']) {
      assert.equal(policy.cacheTtl(`/${locale}${suffix}`), 3600, suffix);
    }
    for (const suffix of ['/bbs', '/bbs/t/some-thread']) assert.equal(policy.cacheTtl(`/${locale}${suffix}`), 60);
  }
  assert.equal(policy.cacheTtl('/api/plugins-data'), 1800);
  assert.equal(policy.cacheTtl('/sitemap.xml'), 3600);
  assert.equal(policy.cacheTtl('/sitemap/0.xml'), 3600);
});

test('unknown and private paths are denied including malformed reserved plugin paths', () => {
  for (const path of ['/', '/en/login', '/en/search', '/en/bbs/new', '/en/bbs/t', '/en/bbs/t/a/b', '/api/auth', '/api/internal/jobs', '/api/other', '/fr/plugins', '/en/unknown', '/en/plugins/all/foo', '/en/plugins/all/0', '/en/plugins/all/-1', '/en/plugins/all/1.2', '/en/plugins/c', '/en/plugins/t', '/en/plugins/lang', '/en/plugins/c/a/b', '/en/plugins/a/b/c', '/sitemap/a/b', '/sitemap/']) {
    assert.equal(policy.cacheTtl(path), 0, path);
    bypass(apply(path));
  }
});

test('canary caches exactly the three selected pages and unknown phases fail closed', () => {
  for (const path of [page, '/en/plugins/fuzz1og/dsh-ocgo-quota', '/zh/plugins/fuzz1og/dsh-ocgo-quota']) assert.equal(policy.cacheTtl(path, 'canary'), 3600);
  for (const path of ['/ja/plugins/fuzz1og/dsh-ocgo-quota', '/en/plugins', '/api/plugins-data', '/sitemap.xml', `${page}/`]) {
    assert.equal(policy.cacheTtl(path, 'canary'), 0);
    bypass(apply(path, {}, {}, { NATIVE_PAGE_CACHE_PHASE: 'canary' }));
  }
  bypass(apply(page, {}, {}, { NATIVE_PAGE_CACHE_PHASE: 'disabled' }));
});

test('public responses preserve body, status and existing Vary while adding request segregation', async () => {
  const response = apply(page, {}, { headers: { vary: 'Accept-Encoding, rSc', 'cf-cache-status': 'MISS' } });
  assert.equal(response.headers.get('cache-control'), 'public, max-age=0, s-maxage=3600, stale-while-revalidate=60');
  assert.equal(response.headers.get('x-dshfind-cache-policy'), 'public-3600');
  assert.equal(response.headers.get('cf-cache-status'), 'MISS');
  const vary = response.headers.get('vary').toLowerCase().split(',').map(value => value.trim());
  for (const field of ['accept-encoding', ...requiredVary]) assert.ok(vary.includes(field), field);
  assert.equal(vary.filter(value => value === 'rsc').length, 1);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'payload');
});

test('RSC and HEAD responses may cache with Vary segregation', () => {
  for (const requestInit of [{ method: 'HEAD' }, { headers: { RSC: '1', 'Next-Router-State-Tree': 'tree' } }]) {
    const response = apply(page, requestInit, { headers: { 'content-type': 'text/x-component' } });
    assert.equal(response.headers.get('x-dshfind-cache-policy'), 'public-3600');
    for (const field of requiredVary) assert.ok(response.headers.get('vary').toLowerCase().includes(field));
  }
});

test('sensitive requests, auth gate and response cookies bypass and clear CDN overrides', () => {
  const headers = { 'cdn-cache-control': 'public, max-age=9999', 'cloudflare-cdn-cache-control': 'public, max-age=9999' };
  for (const name of ['Cookie', 'Authorization', 'Next-Action']) {
    for (const value of ['', 'present']) bypass(apply(page, { headers: { [name]: value } }, { headers }));
  }
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']) bypass(apply(page, { method }, { headers }));
  bypass(apply(page, {}, { headers: { ...headers, 'set-cookie': 'session=abc' } }));
  bypass(apply(page, {}, { headers }, { AUTH_GATE: '1' }));
  bypass(apply(page, {}, { headers: { ...headers, vary: 'Accept-Encoding, *' } }));
});

test('only successful responses and route-appropriate content types cache', () => {
  for (const status of [201, 206, 301, 302, 307, 400, 404, 500]) bypass(apply(page, {}, { status }));
  for (const type of ['application/json', 'image/png', 'text/css', 'application/javascript', '']) bypass(apply(page, {}, { headers: { 'content-type': type } }));
  for (const [path, type, ttl] of [['/api/plugins-data', 'application/json; charset=utf-8', 1800], ['/sitemap.xml', 'application/xml', 3600], ['/sitemap/0.xml', 'text/xml; charset=utf-8', 3600]]) {
    const response = apply(path, {}, { headers: { 'content-type': type } });
    assert.equal(response.headers.get('x-dshfind-cache-policy'), `public-${ttl}`);
    for (const field of requiredVary) assert.ok(response.headers.get('vary').toLowerCase().includes(field));
    bypass(apply(path));
  }
});

test('one valid locale preference cookie can cache explicit locale pages with Cookie variation', () => {
  for (const locale of ['zh', 'en', 'ja', 'ko']) {
    for (const cookie of [`NEXT_LOCALE=${locale}`, ` \tNEXT_LOCALE=${locale}\t `]) {
      const response = apply(page, { headers: { cookie } });
      assert.equal(response.headers.get('x-dshfind-cache-policy'), 'public-3600', cookie);
      assert.ok(response.headers.get('vary').toLowerCase().split(',').map(value => value.trim()).includes('cookie'));
    }
  }
});

test('other, malformed and duplicate cookies remain private', () => {
  for (const cookie of ['NEXT_LOCALE=fr', 'NEXT_LOCALE=EN', 'next_locale=en', 'NEXT_LOCALE="en"', 'NEXT_LOCALE=%65n', 'NEXT_LOCALE =en', 'NEXT_LOCALE= en', 'NEXT_LOCALE=en;', ';NEXT_LOCALE=en', 'NEXT_LOCALE=en; NEXT_LOCALE=en', 'NEXT_LOCALE=en, NEXT_LOCALE=en', 'NEXT_LOCALE=en; dshfind_session=secret', 'dshfind_session=secret; NEXT_LOCALE=en', 'NEXT_LOCALE=en; analytics=1']) {
    bypass(apply(page, { headers: { cookie } }));
  }
  const headers = { cookie: 'NEXT_LOCALE=en' };
  bypass(apply(page, { headers }, {}, { AUTH_GATE: '1' }));
  bypass(apply(page, { headers: { ...headers, Authorization: 'token' } }));
  bypass(apply(page, { headers }, { headers: { 'set-cookie': 'NEXT_LOCALE=en' } }));
  for (const [path, type] of [['/api/plugins-data', 'application/json'], ['/sitemap.xml', 'application/xml']]) {
    bypass(apply(path, { headers }, { headers: { 'content-type': type } }));
  }
});

test('known public SVG and suggestion APIs preserve their own cache lifetimes', () => {
  for (const path of ['/api/badge/owner/repo', '/api/card/owner/repo', '/api/suggest']) {
    const type = path === '/api/suggest' ? 'application/json' : 'image/svg+xml; charset=utf-8';
    for (const control of ['public, max-age=60, s-maxage=300', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400']) {
      for (const method of ['GET', 'HEAD']) {
        const response = apply(path, { method }, { headers: { 'content-type': type, 'cache-control': control, vary: 'Accept-Encoding' } });
        assert.equal(response.headers.get('cache-control'), control);
        for (const field of requiredVary) assert.ok(response.headers.get('vary').toLowerCase().includes(field));
      }
    }
  }
  const response = apply('/api/suggest', {}, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-dshfind-cache-policy'), 'bypass');
});

test('API passthrough never caches sensitive, malformed, unknown or canary responses', () => {
  for (const path of ['/api/badge/owner/repo', '/api/card/owner/repo', '/api/suggest']) {
    const headers = { 'content-type': path === '/api/suggest' ? 'application/json' : 'image/svg+xml', 'cache-control': 'public, s-maxage=3600' };
    for (const requestHeaders of [{ cookie: 'NEXT_LOCALE=en' }, { cookie: 'dshfind_session=secret' }, { Authorization: 'token' }, { 'Next-Action': 'action' }]) bypass(apply(path, { headers: requestHeaders }, { headers }));
    bypass(apply(path, { method: 'POST' }, { headers }));
    bypass(apply(path, {}, { status: 404, headers }));
    bypass(apply(path, {}, { headers: { ...headers, 'set-cookie': 'session=1' } }));
    bypass(apply(path, {}, { headers: { ...headers, vary: '*' } }));
    bypass(apply(path, {}, { headers: { ...headers, 'content-type': 'text/html' } }));
    bypass(apply(path, {}, { headers: { ...headers, 'cache-control': 'private, max-age=60' } }));
    bypass(apply(path, {}, { headers }, { AUTH_GATE: '1' }));
    bypass(apply(path, {}, { headers }, { NATIVE_PAGE_CACHE_PHASE: 'canary' }));
  }
  for (const path of ['/api/unknown', '/api/suggest/extra', '/api/badge/a', '/api/card/a/b/c']) {
    bypass(apply(path, {}, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, s-maxage=3600' } }));
  }
});
