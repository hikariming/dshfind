import assert from 'node:assert/strict';
import test from 'node:test';

import { MIGRATED_EXACT_PAGES, rewriteTarget, stripPreviewHeaders } from './rewrite-router.mjs';

test('learn pages in every locale go to the new site', () => {
  for (const path of ['/zh/learn', '/en/learn/cordis', '/ja/learn/cordis/lessons/01-intro', '/ko/learn/core/12-web-ui']) {
    assert.equal(rewriteTarget(path), 'page', path);
  }
});

test('prefix match is segment-aware and locale-bound', () => {
  for (const path of ['/zh/learning', '/zh/learnx/a', '/learn', '/learn/cordis', '/fr/learn', '/plugins', '/zh/pluginsx', '/zh', '/', '/zh/docs/learn']) {
    assert.equal(rewriteTarget(path), null, path);
  }
});

test('plugin marketplace and hubs go to the new site, details stay on Next', () => {
  for (const path of ['/zh/plugins', '/en/plugins', '/zh/plugins/browse', '/zh/plugins/c/tools', '/en/plugins/t/cordis',
    '/ja/plugins/lang/typescript', '/ko/plugins/all/82']) {
    assert.equal(rewriteTarget(path), 'page', path);
  }
  for (const path of ['/zh/plugins/TellToday/dsh-narrative-voice',
    '/zh/plugins/cat/repo', '/zh/plugins/tools/x', '/zh/plugins/allx/y']) {
    assert.equal(rewriteTarget(path), null, path);
  }
});

test('exact pages match only themselves, never their children', () => {
  assert.ok(MIGRATED_EXACT_PAGES.includes('/plugins'));
  assert.equal(rewriteTarget('/zh/plugins'), 'page');
  assert.equal(rewriteTarget('/zh/plugins/TellToday/dsh-narrative-voice'), null);
  assert.equal(rewriteTarget('/zh/plugins/'), null);
});

test('hashed Astro assets are passed through', () => {
  assert.equal(rewriteTarget('/_astro/client.CaVqrzIJ.js'), 'asset');
  assert.equal(rewriteTarget('/_astro/fonts/0976180ba0e36444.woff2'), 'asset');
  assert.equal(rewriteTarget('/_next/static/chunks/x.js'), null);
});

test('preview noindex header is stripped, everything else kept', async () => {
  const upstream = new Response('<html></html>', {
    status: 200,
    headers: { 'x-robots-tag': 'noindex', 'content-type': 'text/html; charset=utf-8', etag: '"abc"' },
  });
  const out = stripPreviewHeaders(upstream);
  assert.equal(out.headers.get('x-robots-tag'), null);
  assert.equal(out.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(out.headers.get('etag'), '"abc"');
  assert.equal(await out.text(), '<html></html>');
});

test('responses without the header are returned untouched', () => {
  const upstream = new Response('x', { status: 404 });
  assert.equal(stripPreviewHeaders(upstream), upstream);
});
