import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { PLUGIN_DETAIL_SQL, GROWTH_SNAPSHOTS_SQL, RECENT_SNAPSHOTS_SQL, snapshotRange } from '../lib/plugin-queries.mjs';

test('real D1: public reads stay bounded as catalog and history grow', async (t) => {
  const catalog = Array.from({ length: 50 }, (_, i) => ({ full_name: `fixture/plugin-${i+1}`,
    name: `plugin-${i+1}`, owner: 'fixture', url: `https://example.com/${i+1}`, stars: 4000,
    contributors: 100, score: 42 }));
  const ndjson = catalog.map(p => JSON.stringify(p)).join('\n')+'\n';
  const assets = { 'catalog-full.ndjson': ndjson, 'catalog-desktop.ndjson': ndjson,
    'meta.json': JSON.stringify({ data_version: 'fixture-v1', as_of: '2026-09-08T00:00:00Z' }),
    'detail-index.json': JSON.stringify(Object.fromEntries(catalog.map((p,i) => [p.full_name,i]))) };
  const workerModule = path => ({ type: 'ESModule', path });
  const apiModules = ['workers/api-edge/worker.mjs',
    ...readdirSync('workers/api-edge').filter(n => n.endsWith('.mjs') && n !== 'worker.mjs').map(n => `workers/api-edge/${n}`),
    'scripts/lib/plugin-queries.mjs', 'scripts/lib/d1-observer.mjs', 'scripts/lib/entry-check.mjs'];
  const mf = new Miniflare(convertV4MiniflareOptions({ workers: [
    { name: 'queries', modules: ['scripts/e2e/read-budget-worker.mjs', 'scripts/lib/plugin-queries.mjs'].map(workerModule),
      compatibilityDate: '2025-09-01', d1Databases: { DB: 'catalog' } },
    { name: 'api', modules: apiModules.map(workerModule), compatibilityDate: '2026-08-01',
      d1Databases: { DB: 'catalog' }, bindings: { D1_READ_DIAGNOSTICS: '1' },
      serviceBindings: { ASSETS: request => {
        const body = assets[new URL(request.url).pathname.slice(1)];
        return new Response(body ?? 'missing', { status: body === undefined ? 404 : 200 });
      } } },
  ] }));
  t.after(() => mf.dispose());
  const db = await mf.getD1Database('DB', 'queries');
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
  // Real migrations, applied in filename order: the lookup index and then the
  // additive ENTRY table. No fixture schema copy for the new table.
  const migrationFiles = readdirSync('migrations').filter(f => f.endsWith('.sql')).sort();
  assert.ok(migrationFiles.includes('0002_plugin_entry_checks.sql'));
  for (const file of migrationFiles) {
    for (const sql of readFileSync(`migrations/${file}`, 'utf8').replace(/^--.*$/gm, '').split(';').filter(s => s.trim())) {
      await db.prepare(sql).run();
    }
  }
  const migrated = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='plugin_entry_checks'").all();
  assert.equal(migrated.results.length, 1);
  const CHECKED_AT = '2026-11-07T00:00:00.000Z';
  const ANCHOR = 'ce7073d51254c26cd63b22a60835b8f948deb447';
  await db.prepare(`INSERT INTO plugin_entry_checks (
      full_name, state, checked_at, checker_version, anchor_commit, source,
      pkg_name, pkg_version, subject_name, subject_version, subject_kind, subject_dir,
      conclusion_status, exit_code, blocking_pass, blocking_checked,
      blocking_not_checked, not_checked)
    VALUES ('fixture/plugin-1','checked',?,'1.6.8',?,'npm',
      'plugin-1','1.0.0','plugin-1','1.0.0','plugin','packages/plugin-1',
      'warn',0,0,'["C-1.1"]','["C-3.1"]','[{"id":"DSC-14","reason":"entry static claim: no runtime evidence"}]')`)
    .bind(CHECKED_AT, ANCHOR).run();
  await db.prepare("UPDATE plugins SET score=42 WHERE full_name='fixture/plugin-1'").run();
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

  // Sparse histories seek the last snapshot on/before latest-7d, not exactly 7d.
  await db.prepare(`INSERT INTO plugin_snapshots VALUES
    ('fixture/plugin-101',date('now','-30 days'),10,1,null),
    ('fixture/plugin-101',date('now','-8 days'),20,2,null),
    ('fixture/plugin-101',date('now'),30,3,null),
    ('fixture/plugin-102',date('now','-2 days'),40,4,null),
    ('fixture/plugin-102',date('now'),50,5,null)`).run();
  assert.deepEqual((await request('growth','fixture/plugin-101')).results.map(r => r.stars), [20,30]);
  assert.deepEqual((await request('growth','fixture/plugin-102')).results.map(r => r.stars), [40,50]);

  const api = await mf.getWorker('api');
  async function apiRequest(path, init, budget) {
    const response = await api.fetch('https://example.com'+path, init);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-dshfind-d1-errors'), '0');
    assert.equal(response.headers.get('x-dshfind-d1-missing-meta'), '0');
    const reads = Number(response.headers.get('x-dshfind-d1-rows-read'));
    assert.ok(reads <= budget, `${path}: ${reads} > ${budget}`);
    const data = await response.json();
    assert.equal(data.errors, undefined, JSON.stringify(data.errors));
    return data;
  }
  const rest = await apiRequest('/v1/plugins/fixture/plugin-1?snapshot_days=90', {}, 200);
  assert.equal(rest.snapshots.length, 91);
  assert.equal(rest.growth.stars, 7);
  // Additive ENTRY block: one row from the migration table, no score/grade fields.
  assert.deepEqual(rest.entry, {
    state: 'checked',
    checked_at: CHECKED_AT,
    checker_version: '1.6.8',
    commit: ANCHOR,
    source: 'npm',
    subject: { name: 'plugin-1', version: '1.0.0', kind: 'plugin', dir: 'packages/plugin-1' },
    raw: { status: 'warn', exit_code: 0 },
    entry_blocking: { pass: false, checked: ['C-1.1'], not_checked: ['C-3.1'] },
    not_checked: [{ id: 'DSC-14', reason: 'entry static claim: no runtime evidence' }],
    flow: 'not-run',
    boost: 'not-measured',
  });
  assert.equal('conclusion' in rest.entry, false);
  assert.equal(rest.score, 42, 'ENTRY must not change the catalog score');
  for (const key of Object.keys(rest.entry)) assert.doesNotMatch(key, /score|grade/i);
  const scoreRow = await db.prepare("SELECT score FROM plugins WHERE full_name='fixture/plugin-1'").all();
  assert.equal(scoreRow.results[0].score, 42, 'ENTRY write must not touch the plugins table');

  // The list and catalog contracts stay byte-for-byte unchanged: no entry key.
  const list = await apiRequest('/v1/plugins?per_page=5', {}, 10);
  assert.equal(list.data.length, 5);
  assert.ok(list.data.every(plugin => !('entry' in plugin)), 'list must not expose entry');
  const catalogBody = await apiRequest('/v1/catalog', {}, 10);
  assert.ok(catalogBody.data.every(plugin => !('entry' in plugin)), 'catalog must not expose entry');

  // A failed attempt is stored as not_run and still renders the stable shape.
  await db.prepare(`INSERT INTO plugin_entry_checks (
      full_name, state, checked_at, checker_version, anchor_commit, source,
      pkg_name, pkg_version, subject_name, subject_version, subject_kind, subject_dir,
      conclusion_status, exit_code, blocking_pass, blocking_checked,
      blocking_not_checked, not_checked)
    VALUES ('fixture/plugin-3','not_run',?,'1.6.8',NULL,'npm',
      'plugin-3','1.0.0','plugin-3','1.0.0','unknown',NULL,
      'not_run',NULL,0,'[]','[]','[]')`).bind(CHECKED_AT).run();
  const notRun = await apiRequest('/v1/plugins/fixture/plugin-3', {}, 200);
  assert.equal(notRun.entry.state, 'not_run');
  assert.deepEqual(notRun.entry.raw, { status: 'not_run', exit_code: null });

  // state=checked with a raw fail keeps entry_blocking byte-for-byte.
  await db.prepare(`INSERT INTO plugin_entry_checks (
      full_name, state, checked_at, checker_version, anchor_commit, source,
      pkg_name, pkg_version, subject_name, subject_version, subject_kind, subject_dir,
      conclusion_status, exit_code, blocking_pass, blocking_checked,
      blocking_not_checked, not_checked)
    VALUES ('fixture/plugin-4','checked',?,'1.6.8',?,'npm',
      'plugin-4','2.0.0','plugin-4','2.0.0','plugin','packages/plugin-4',
      'fail',1,0,'["C-1.1","C-1.2"]','["C-3.1"]','[]')`).bind(CHECKED_AT, ANCHOR).run();
  const failed = await apiRequest('/v1/plugins/fixture/plugin-4', {}, 200);
  assert.equal(failed.entry.state, 'checked');
  assert.deepEqual(failed.entry.raw, { status: 'fail', exit_code: 1 });
  assert.deepEqual(failed.entry.entry_blocking, {
    pass: false,
    checked: ['C-1.1', 'C-1.2'],
    not_checked: ['C-3.1'],
  });

  // Table exists but this plugin has no row: stable not_checked shape, null time/version.
  const noRow = await apiRequest('/v1/plugins/fixture/plugin-2', {}, 200);
  assert.deepEqual(noRow.entry, {
    state: 'not_checked',
    checked_at: null,
    checker_version: null,
    source: null,
    subject: null,
    raw: null,
    entry_blocking: null,
    not_checked: [],
    flow: 'not-run',
    boost: 'not-measured',
  });

  // No public response may bring back the old "passed/failed" state words.
  const assertNoOldState = (body, label) => {
    const text = JSON.stringify(body);
    assert.ok(!text.includes('"state":"recognized"'), label);
    assert.ok(!text.includes('"state":"failed"'), label);
  };
  for (const [body, label] of [[rest, 'detail'], [notRun, 'not_run detail'], [failed, 'fail detail'],
    [noRow, 'no-row detail'], [list, 'list'], [catalogBody, 'catalog']]) {
    assertNoOldState(body, label);
  }
  for (const entry of [rest.entry, notRun.entry, failed.entry, noRow.entry]) {
    assert.ok(['checked', 'not_run', 'not_checked'].includes(entry.state), entry.state);
  }

  const missing = await api.fetch('https://example.com/v1/plugins/nobody/missing');
  assert.equal(missing.status, 404);
  const graph = async (query, variables, budget) => apiRequest('/graphql', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }),
  }, budget);
  const growthOnly = await graph('{ plugins(first:50) { nodes { fullName growth { stars } } } }', {}, 600);
  assert.equal(growthOnly.data.plugins.nodes.length, 50);
  const alias = await graph('query($days:Int!){ plugin(fullName:"fixture/plugin-1") { short:snapshots(days:1){date} long:snapshots(days:$days){date} growth{stars} } }', { days: 90 }, 200);
  assert.equal(alias.data.plugin.short.length, 2);
  assert.equal(alias.data.plugin.long.length, 91);
  assert.equal(alias.data.plugin.growth.stars, 7);
  await graph('{ plugins(first:50) { nodes { snapshots(days:90) { date } growth { stars } } } }', {}, 10000);
  // Old histories must still produce growth even when the visible window is empty.
  await db.prepare("UPDATE plugin_snapshots SET snapshot_date=date(snapshot_date,'-20 years') WHERE full_name='fixture/plugin-1'").run();
  const stale = await graph('{plugin(fullName:"fixture/plugin-1"){snapshots(days:90){date} growth{stars}}}', {}, 20);
  assert.deepEqual(stale.data.plugin.snapshots, []);
  assert.equal(stale.data.plugin.growth.stars, 7);

  // A missing additive table (or a transient D1 error) must fail open, not 5xx:
  // the detail response keeps the stable entry shape with state=not_checked.
  await db.prepare('DROP TABLE plugin_entry_checks').run();
  const failOpen = await api.fetch('https://example.com/v1/plugins/fixture/plugin-1');
  assert.equal(failOpen.status, 200);
  assert.equal(failOpen.headers.get('x-dshfind-d1-errors'), '1');
  const failOpenData = await failOpen.json();
  assert.equal(failOpenData.entry.state, 'not_checked');
  assert.equal(failOpenData.entry.checked_at, null);
  assert.equal(failOpenData.entry.checker_version, null);
  assert.equal(failOpenData.entry.raw, null);
  assert.deepEqual(failOpenData.entry.not_checked, []);
  assertNoOldState(failOpenData, 'fail-open detail');
});
