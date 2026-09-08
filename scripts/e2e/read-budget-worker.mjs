import { PLUGIN_DETAIL_SQL, GROWTH_SNAPSHOTS_SQL, RECENT_SNAPSHOTS_SQL, snapshotRange } from '../lib/plugin-queries.mjs';

// Local workerd test entry, never deployed. Uses the actual runtime query module.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') ?? 'fixture/plugin-1';
    const query = url.searchParams.get('query') ?? 'detail';
    const sql = { detail: PLUGIN_DETAIL_SQL, growth: GROWTH_SNAPSHOTS_SQL,
      recent: RECENT_SNAPSHOTS_SQL }[query];
    const args = query === 'recent' ? [name, ...snapshotRange(Number(url.searchParams.get('days') ?? 30))] : [name];
    const result = await env.DB.prepare(sql).bind(...args).all();
    return Response.json(result);
  },
};
