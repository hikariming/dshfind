#!/usr/bin/env node
// Optional operator check: provide a Playwright installation via
// E2E_PLAYWRIGHT_MODULE (or install playwright) and a diagnostic web preview URL.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.E2E_PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.argv[2];
assert.ok(base, 'Pass the diagnostic web preview URL');
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['zh', 'en', 'ja', 'ko']) {
    const context = await browser.newContext();
    await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, url: base }]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const jsonPromise = page.waitForResponse(r => new URL(r.url()).pathname === '/api/plugins-data');
    const response = await page.goto(`${base}/${locale}/plugins`, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    assert.equal(response.headers()['x-dshfind-d1-queries'], '0');
    const json = await jsonPromise;
    assert.equal(json.status(), 200);
    assert.equal(json.headers()['x-dshfind-d1-rows-read'], '0');
    assert.equal((await json.request().allHeaders()).cookie, undefined, 'public JSON fetch must omit cookies');
    assert.ok((await json.json()).plugins.length > 13000);
    const hrefs = await page.locator('main a[href]').evaluateAll(links => links.map(a => a.getAttribute('href')));
    const detail = hrefs.find(h => new RegExp(`^/${locale}/plugins/(?!all/|c/|t/|lang/)[^/]+/[^/]+$`).test(h));
    assert.ok(detail, 'rendered catalog needs a navigable plugin link');
    const rscPromise = page.waitForResponse(r => new URL(r.url()).pathname === detail
      && (r.headers()['content-type'] ?? '').includes('text/x-component')
      // Next may first prefetch a layout-only RSC shell with no detail data.
      && Number(r.headers()['x-dshfind-d1-queries']) >= 3);
    await page.locator(`main a[href="${detail}"]`).first().click();
    const rsc = await rscPromise;
    assert.equal(rsc.status(), 200);
    assert.equal(rsc.headers()['x-dshfind-d1-errors'], '0');
    assert.equal(rsc.headers()['x-dshfind-d1-missing-meta'], '0');
    const reads = Number(rsc.headers()['x-dshfind-d1-rows-read']);
    assert.ok(reads > 0 && reads <= 25, `navigation read budget: ${reads}`);
    await page.waitForURL(`${base}${detail}`);
    await page.locator('main h1').waitFor();
    assert.deepEqual(errors, [], 'browser runtime errors');
    console.log(JSON.stringify({ locale, detail, jsonRows: 0, rscRows: reads, errors }));
    await context.close();
  }
} finally { await browser.close(); }
console.log('PASS: four-language hydration, cookie-free catalog fetch, and real RSC link navigation');
