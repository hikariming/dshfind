import assert from 'node:assert/strict';
import test from 'node:test';

import { localeRedirectTarget, needsLocalePrefix, negotiateLocale } from './locale-redirect.mjs';

test('pages without a locale prefix need one; prefixed pages, APIs and files do not', () => {
  for (const p of ['/', '/plugins', '/learn/cordis', '/fr/learn', '/zhx']) assert.equal(needsLocalePrefix(p), true, p);
  for (const p of ['/zh', '/en/plugins', '/ko/learn/cordis', '/api/badge/a/b', '/api/auth/me', '/_astro/x.js',
    '/sitemap.xml', '/sitemap/plugins-1.xml', '/robots.txt', '/favicon.ico', '/icon.png', '/sidecar/docs.json']) {
    assert.equal(needsLocalePrefix(p), false, p);
  }
});

test('NEXT_LOCALE cookie wins over Accept-Language', () => {
  assert.equal(negotiateLocale('a=1; NEXT_LOCALE=ja; b=2', 'en-US,en;q=0.9'), 'ja');
  assert.equal(negotiateLocale('NEXT_LOCALE=fr', 'ko-KR'), 'ko'); // 不认识的 cookie 值忽略
});

test('Accept-Language is ranked by q, then order; unknown languages fall back to zh', () => {
  assert.equal(negotiateLocale('', 'en-US,en;q=0.9,zh-CN;q=0.8'), 'en');
  assert.equal(negotiateLocale('', 'fr-FR,ja;q=0.5,en;q=0.7'), 'en');
  assert.equal(negotiateLocale('', 'zh-TW'), 'zh');
  assert.equal(negotiateLocale('', 'fr,de'), 'zh');
  assert.equal(negotiateLocale(null, null), 'zh');
  assert.equal(negotiateLocale('', 'en;q=0,ko'), 'ko');
});

test('redirect target keeps the path and query string', () => {
  assert.equal(localeRedirectTarget(new URL('https://dshfind.com/'), '', ''), '/zh');
  assert.equal(localeRedirectTarget(new URL('https://dshfind.com/plugins?category=tools'), 'NEXT_LOCALE=en', ''), '/en/plugins?category=tools');
});
