import assert from 'node:assert/strict';
import test from 'node:test';

import { MIGRATED_EXACT_PAGES, rewriteTarget, stripPreviewHeaders } from './rewrite-router.mjs';

test('learn pages in every locale go to the new site', () => {
  for (const path of ['/zh/learn', '/en/learn/cordis', '/ja/learn/cordis/lessons/01-intro', '/ko/learn/core/12-web-ui']) {
    assert.equal(rewriteTarget(path), 'page', path);
  }
});

test('prefix match is segment-aware and locale-bound', () => {
  for (const path of ['/zh/learning', '/zh/learnx/a', '/learn', '/learn/cordis', '/fr/learn', '/plugins', '/zh/pluginsx', '/']) {
    assert.equal(rewriteTarget(path), null, path);
  }
});

test('plugin marketplace, hubs and details go to the new site', () => {
  for (const path of ['/zh/plugins', '/en/plugins', '/zh/plugins/browse', '/zh/plugins/c/tools', '/en/plugins/t/cordis',
    '/ja/plugins/lang/typescript', '/ko/plugins/all/82',
    '/zh/plugins/TellToday/dsh-narrative-voice', '/en/plugins/FUZZ1OG/DSH-OCGO-QUOTA', '/zh/plugins/zzzyaar/dsh--API-message_stop-']) {
    assert.equal(rewriteTarget(path), 'page', path);
  }
});

test('plugin paths that are not pages stay on Next', () => {
  // 三段以上、裸 /plugins/<x> 不是任何页面；无语言段的插件路径走老站自己的重定向
  for (const path of ['/zh/plugins/owner/repo/extra', '/zh/plugins/owner/', '/plugins/owner/repo']) {
    assert.equal(rewriteTarget(path), null, path);
  }
});

test('locale home and search pages go to the new site', () => {
  for (const path of ['/zh', '/en', '/ja', '/ko', '/zh/search', '/en/search']) {
    assert.equal(rewriteTarget(path), 'page', path);
  }
  // 根路径 / 仍由老站按 cookie / Accept-Language 重定向到某个语言首页
  for (const path of ['/', '/zh/searchx', '/zh/search/x', '/fr']) {
    assert.equal(rewriteTarget(path), null, path);
  }
});

test('exact pages match only themselves, never their children', () => {
  assert.ok(MIGRATED_EXACT_PAGES.includes('/plugins'));
  assert.equal(rewriteTarget('/zh/plugins'), 'page');
  assert.equal(rewriteTarget('/zh/plugins/'), null);
});

test('docs go to the new site', () => {
  for (const path of ['/zh/docs', '/en/docs/guide', '/ja/docs/develop/basic/config', '/ko/docs/postmortem/0001-acp']) {
    assert.equal(rewriteTarget(path), 'page', path);
  }
  assert.equal(rewriteTarget('/zh/docsx'), null);
});

test('forum and login go to the new site', () => {
  for (const path of ['/zh/bbs', '/en/bbs/new', '/ja/bbs/t/plugin-foo-bar-0ca3dfbf', '/zh/login']) {
    assert.equal(rewriteTarget(path), 'page', path);
  }
  for (const path of ['/zh/bbsx', '/zh/login/extra', '/zh/loginx']) {
    assert.equal(rewriteTarget(path), null, path);
  }
});

test('share APIs and sitemap go to the new site; secret-bound APIs stay', () => {
  for (const path of ['/sitemap.xml', '/sitemap/plugins-3.xml', '/sitemap/threads.xml', '/api/suggest',
    '/api/plugins-data', '/api/badge/a/b', '/api/card/a/b', '/api/readme-img/a/b']) {
    assert.equal(rewriteTarget(path), 'page', path);
  }
  for (const path of ['/api/auth/me', '/api/internal/db', '/api/suggestx', '/robots.txt', '/favicon.ico']) {
    assert.equal(rewriteTarget(path), null, path);
  }
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
