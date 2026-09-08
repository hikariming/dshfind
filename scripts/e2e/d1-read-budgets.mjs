import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { PLUGIN_DETAIL_SQL, GROWTH_SNAPSHOTS_SQL, RECENT_SNAPSHOTS_SQL, snapshotRange } from '../lib/plugin-queries.mjs';

test('real D1: public reads stay bounded as catalog and history grow', async (t) => {
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: ['scripts/e2e/read-budget-worker.mjs', 'scripts/lib/plugin-queries.mjs'].map(path => ({ type: 'ESModule', path })),
    compatibilityDate: '2025-09-01', d1Databases: ['DB'] }));
  t.after(() => mf.dispose());
  const db = await mf.getD1Database('DB');
  for (const sql of readFileSync('scripts/e2e/fixtures/plugin-schema.sql', 'utf8').replace(/^--.*$/gm, '').split(';').filter(s => s.trim())) {
    await db.prepare(sql).run();
  }
  await db.prepare(`WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i < 15000)
    INSERT INTO plugins(full_name,name,owner,url,first_seen_at,last_synced_at,stars,contributors)
    SELECT 'fixture/plugin-'||i,'plugin-'||i,'fixture','https://example.com/'||i,'2020-01-01','2026-09-08',4000,100 FROM n`).run();
  const old = PLUGIN_DETAIL_SQL.replace(' INDEXED BY idx_plugins_full_name_lower', '').replace('\nLIMIT 1', '');
  const before = await db.prepare(old).bind('FIXTURE/PLUGIN-1').all();
  assert.ok(before.meta.rows_read >= 15000, 'fixture must reproduce the original full-table scan');
  // Missing migration must fail closed instead of silently using the old access path.
  await assert.rejects(() => db.prepare(PLUGIN_DETAIL_SQL).bind('fixture/plugin-1').all(), /index/i);
  for (const sql of readFileSync('migrations/0001_plugin_lookup_index.sql', 'utf8').replace(/^--.*$/gm, '').split(';').filter(s => s.trim())) {
    await db.prepare(sql).run();
  }
  async function request(query, name = 'fixture/plugin-1', days = 30) {
    const response = await mf.dispatchFetch(`http://localhost/?${new URLSearchParams({ query, name, days: String(days) })}`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(typeof data.meta.rows_read, 'number', 'must use real D1 counters');
    return data;
  }
  const detail = await request('detail', 'FIXTURE/PLUGIN-1');
  assert.equal(detail.results[0].full_name, 'fixture/plugin-1');
  assert.ok(detail.meta.rows_read <= 3);
  assert.ok((await request('detail', 'missing/repo')).meta.rows_read <= 3);
  await db.prepare("UPDATE plugins SET is_offtopic=1 WHERE full_name='fixture/plugin-2'").run();
  assert.deepEqual((await request('detail', 'fixture/plugin-2')).results, []);
  assert.deepEqual((await request('growth')).results, []);
  await db.prepare("INSERT INTO plugin_snapshots VALUES ('fixture/plugin-1', date('now'),3999,99,null)").run();
  assert.equal((await request('growth')).results.length, 1);
  await db.prepare(`WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i<3650),
    repos(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM repos WHERE i<100)
    INSERT INTO plugin_snapshots SELECT 'fixture/plugin-'||repos.i,date('now','-'||n.i||' days'),4000-n.i,90,null FROM n CROSS JOIN repos`).run();
  const growth = await request('growth');
  assert.equal(growth.results.length, 2);
  assert.equal(growth.results[0].stars, 3993, 'baseline is latest snapshot minus 7 days');
  assert.ok(growth.meta.rows_read <= 12, JSON.stringify(growth.meta));
  const fullHistory = await db.prepare('SELECT * FROM plugin_snapshots WHERE full_name=? ORDER BY snapshot_date').bind('fixture/plugin-1').all();
  assert.ok(fullHistory.meta.rows_read > 3650, 'negative control must expose lifetime scans');
  for (const days of [1,30,90]) {
    const recent = await request('recent', 'fixture/plugin-1', days);
    assert.equal(recent.results.length, days + 1);
    assert.ok(recent.meta.rows_read <= 2 * (days + 1) + 2, JSON.stringify(recent.meta));
  }
  for (const [sql,args] of [[PLUGIN_DETAIL_SQL,['fixture/plugin-1']],
    [GROWTH_SNAPSHOTS_SQL,['fixture/plugin-1']], [RECENT_SNAPSHOTS_SQL,['fixture/plugin-1',...snapshotRange(90)]]]) {
    const plan = await db.prepare('EXPLAIN QUERY PLAN '+sql).bind(...args).all();
    assert.ok(plan.results.every(r => !/\bSCAN (?:plugins|plugin_snapshots)\b/i.test(r.detail)), JSON.stringify(plan.results));
  }
  console.log(JSON.stringify({ beforeDetailRows: before.meta.rows_read, afterDetailRows: detail.meta.rows_read,
    lifetimeRows: fullHistory.meta.rows_read, growthRows: growth.meta.rows_read, fixtureHistory: 365001 }));
});
