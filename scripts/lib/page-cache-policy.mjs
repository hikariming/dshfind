const CANARY_PATHS = new Set([
  '/en/plugins/TellToday/dsh-narrative-voice',
  '/en/plugins/fuzz1og/dsh-ocgo-quota',
  '/zh/plugins/fuzz1og/dsh-ocgo-quota',
]);

// Workers Cache looks up responses before the Worker executes. These fields
// must segregate anonymous HTML, RSC and authenticated requests at that layer.
const VARY_FIELDS = [
  'Cookie', 'Host', 'X-Forwarded-Proto', 'Authorization', 'Next-Action', 'RSC',
  'Next-Router-State-Tree', 'Next-Router-Prefetch',
  'Next-Router-Segment-Prefetch', 'Next-Url',
];

export function cacheTtl(pathname, phase = 'all') {
  if (phase === 'canary') return CANARY_PATHS.has(pathname) ? 3600 : 0;
  if (phase !== 'all') return 0;
  if (pathname === '/api/plugins-data') return 1800;
  if (pathname === '/sitemap.xml' || /^\/sitemap\/[^/]+$/.test(pathname)) return 3600;

  const locale = pathname.match(/^\/(?:zh|en|ja|ko)(\/.*)?$/);
  if (!locale) return 0;
  const path = locale[1] || '';
  if (path === '/bbs' || /^\/bbs\/t\/[^/]+$/.test(path)) return 60;
  if (path === '' || path === '/plugins' || path === '/plugins/browse') return 3600;
  if (/^\/(?:docs|learn)(?:\/[^/]+)*$/.test(path)) return 3600;
  if (/^\/plugins\/all\/[1-9]\d*$/.test(path)) return 3600;
  if (/^\/plugins\/(?:c|t|lang)\/[^/]+$/.test(path)) return 3600;
  // Reserved route prefixes must not fall through as owner/repo pairs.
  if (/^\/plugins\/(?!all\/|c\/|t\/|lang\/)[^/]+\/[^/]+$/.test(path)) return 3600;
  return 0;
}

function appropriateContentType(pathname, headers) {
  const type = (headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (pathname === '/api/plugins-data' || pathname === '/api/suggest') return type === 'application/json';
  if (/^\/api\/(?:badge|card)\/[^/]+\/[^/]+$/.test(pathname)) return type === 'image/svg+xml';
  if (pathname === '/sitemap.xml' || pathname.startsWith('/sitemap/')) {
    return type === 'application/xml' || type === 'text/xml';
  }
  return type === 'text/html' || type === 'text/x-component';
}

export function applyPageCachePolicy(request, response, env = {}) {
  const pathname = new URL(request.url).pathname;
  const headers = new Headers(response.headers);
  const vary = (headers.get('vary') || '').split(',').map(value => value.trim()).filter(Boolean);
  const ttl = cacheTtl(pathname, env.NATIVE_PAGE_CACHE_PHASE ?? 'all');
  const knownPublicApi = (env.NATIVE_PAGE_CACHE_PHASE ?? 'all') === 'all'
    && (pathname === '/api/suggest' || /^\/api\/(?:badge|card)\/[^/]+\/[^/]+$/.test(pathname));
  const upstreamControl = headers.get('cache-control') || '';
  const upstreamDirectives = upstreamControl.toLowerCase().split(',').map(value => value.trim());
  const preservePublicApi = knownPublicApi && upstreamDirectives.includes('public')
    && !upstreamDirectives.some(value => /^(?:private|no-store|no-cache)(?:=|$)/.test(value));
  // Explicit locale URLs determine page language. Permit only this single
  // preference cookie; unknown, duplicate and session cookies stay private.
  const cookie = request.headers.get('cookie');
  const safeLocaleCookie = /^\/(?:zh|en|ja|ko)(?:\/|$)/.test(pathname)
    && /^[\t ]*NEXT_LOCALE=(?:zh|en|ja|ko)[\t ]*$/.test(cookie ?? '');
  const unsafe = env.AUTH_GATE === '1'
    || !['GET', 'HEAD'].includes(request.method)
    || (cookie !== null && !safeLocaleCookie)
    || ['Authorization', 'Next-Action'].some(field => request.headers.has(field))
    || response.status !== 200
    || headers.has('set-cookie')
    || vary.includes('*')
    || !appropriateContentType(pathname, headers);

  // Remove stale upstream CDN overrides so this single policy owns the TTL.
  // Standard s-maxage is sufficient for native Workers Cache.
  headers.delete('cdn-cache-control');
  headers.delete('cloudflare-cdn-cache-control');
  if ((!ttl && !preservePublicApi) || unsafe) {
    const preserveSuggestNoStore = !unsafe && knownPublicApi && pathname === '/api/suggest'
      && upstreamControl.trim().toLowerCase() === 'no-store';
    headers.set('cache-control', preserveSuggestNoStore ? upstreamControl : 'private, no-store');
    headers.set('x-dshfind-cache-policy', 'bypass');
  } else {
    const existing = new Set(vary.map(field => field.toLowerCase()));
    for (const field of VARY_FIELDS) {
      if (!existing.has(field.toLowerCase())) vary.push(field);
    }
    headers.set('vary', vary.join(', '));
    headers.set('cache-control', preservePublicApi ? upstreamControl : `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=60`);
    const publicTtl = preservePublicApi
      ? upstreamControl.match(/(?:^|,)\s*s-maxage=(\d+)(?:\s*,|\s*$)/i)?.[1] ?? 'api'
      : ttl;
    headers.set('x-dshfind-cache-policy', `public-${publicTtl}`);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
