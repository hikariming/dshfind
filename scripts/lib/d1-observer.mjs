import { PLUGIN_DETAIL_SQL, GROWTH_SNAPSHOTS_SQL, RECENT_SNAPSHOTS_SQL } from './plugin-queries.mjs';

const queryNames = new Map([[PLUGIN_DETAIL_SQL, 'plugin-detail'],
  [GROWTH_SNAPSHOTS_SQL, 'plugin-growth'], [RECENT_SNAPSHOTS_SQL, 'plugin-history-window']]);

/** Request-scoped observer. Parameters and raw SQL never enter logs or headers. */
export function observeD1(db, metrics) {
  const statements = new WeakMap();
  const record = (sql, result) => {
    metrics.queries++;
    if (typeof result?.meta?.rows_read !== 'number') metrics.missingMeta++;
    const rowsRead = result?.meta?.rows_read ?? 0;
    metrics.rowsRead += rowsRead;
    metrics.rowsWritten += result?.meta?.rows_written ?? 0;
    if (rowsRead > 1000) console.warn(JSON.stringify({ event: 'd1-expensive-read',
      query: queryNames.get(sql) ?? 'other', rowsRead, rowsReturned: result.results?.length ?? null }));
  };
  const wrap = (stmt, sql) => {
    const proxy = new Proxy(stmt, { get(target, key) {
      if (key === 'bind') return (...args) => wrap(target.bind(...args), sql);
      if (key === 'all' || key === 'run') return async (...args) => {
        try {
          const result = await target[key](...args);
          record(sql, result);
          return result;
        } catch (err) { metrics.errors++; throw err; }
      };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    } });
    statements.set(proxy, { stmt, sql });
    return proxy;
  };
  return new Proxy(db, { get(target, key) {
    if (key === 'prepare') return (sql) => wrap(target.prepare(sql), sql);
    if (key === 'batch') return async (items) => {
      try {
        const results = await target.batch(items.map(item => statements.get(item)?.stmt ?? item));
        results.forEach((result, i) => record(statements.get(items[i])?.sql, result));
        return results;
      } catch (err) { metrics.errors++; throw err; }
    };
    const value = Reflect.get(target, key);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}

export async function withD1Metrics(request, env, handler) {
  if (env.D1_READ_DIAGNOSTICS === '1') {
    const path = new URL(request.url).pathname;
    const read = ['GET', 'HEAD'].includes(request.method);
    const allowed = read && (/^\/(?:zh|en|ja|ko)\/plugins(?:\/|$)/.test(path)
      || /^\/api\/(?:plugins-data$|badge\/|card\/)/.test(path)
      || /^\/v1\/(?:plugins(?:\/|$)|catalog$|suggest$)/.test(path)
      || path.startsWith('/_next/') || path === '/healthz' || path === '/graphql/schema')
      || path === '/graphql' && (read || request.method === 'POST');
    if (!allowed) return new Response('Read verification only', { status: 404,
      headers: { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } });
  }
  const metrics = { queries: 0, rowsRead: 0, rowsWritten: 0, errors: 0, missingMeta: 0 };
  const observedEnv = env.DB ? { ...env, DB: observeD1(env.DB, metrics) } : env;
  const response = await handler(observedEnv);
  // Enabled only on the dedicated read-only verification deployment. Completing
  // the stream is necessary: Next may issue SQL after returning response headers.
  if (env.D1_READ_DIAGNOSTICS !== '1') return response;
  const out = new Response(response.body === null ? null : await response.arrayBuffer(), response);
  out.headers.set('x-dshfind-d1-queries', String(metrics.queries));
  out.headers.set('x-dshfind-d1-rows-read', String(metrics.rowsRead));
  out.headers.set('x-dshfind-d1-errors', String(metrics.errors));
  out.headers.set('x-dshfind-d1-missing-meta', String(metrics.missingMeta));
  out.headers.set('x-dshfind-render-id', crypto.randomUUID());
  out.headers.set('x-robots-tag', 'noindex');
  console.log(JSON.stringify({ event: 'd1-read-verification', path: new URL(request.url).pathname, ...metrics }));
  return out;
}
