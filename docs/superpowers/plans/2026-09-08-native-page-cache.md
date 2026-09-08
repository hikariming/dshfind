# Native page cache migration implementation plan

**Goal:** Validate a small Cloudflare Workers Cache pilot, migrate only after it passes, and preserve the R2 bucket and data for the user's 48-hour observation.

**Architecture:** Keep Next.js/OpenNext. Compile snapshot-only routes into the read-only Static Assets incremental store. Render database-backed pages on native cache misses. An explicit Worker response policy selects public routes and differentiates HTML/RSC, language, host and cookie variants. Private routes, credentials, Set-Cookie, errors and mutations never enter shared response cache. Production deployment cache remains version-isolated.

**Execution:** Apply writing-plans and test-driven-development; independently implement/review cache policy under subagent-driven-development. No deletion commands or lifecycle changes are part of this plan.

- [x] Fetch production source and create `codex/native-page-cache`, carrying only this task's earlier audit/comment edits.
- [x] Verify baseline with `node --test scripts/lib/*.test.mjs` and record existing failures separately.
- [x] Implement `scripts/lib/page-cache-policy.mjs` using failing node:test cases first. Preserve existing Vary and include Cookie, Host, RSC and router negotiation headers. Use browser max-age=0 and edge TTL 3600 for public content, 60 for forum, 1800 for catalogue API; bypass all unknown/private paths and unsuccessful responses.
- [x] Add a custom Worker using the generated OpenNext fetch handler and the policy. Canary phase permits caching only three explicit plugin-detail URLs. Preserve DO exports during pilot for rollback compatibility.
- [x] Make the detail route request-rendered in the isolated Worker, exposing only three selected URLs. Conditional `connection()` caused DYNAMIC_SERVER_USAGE and was replaced by route-wide revalidate=0 before validation. Build and deploy the isolated canary without populating or deleting the production R2 cache. Verify content/canonicals, language, HTML and RSC navigation, cache hit, credentials bypass and response sizes.
- [x] Measure repeated requests and Cloudflare CPU observations. Require correct pages and no failures, warmed HIT without rendering, p95 HIT TTFB <1s from this test location, warmed uncached render p95 <2s and CPU p95 <100ms. Report sample size/location and do not equate TTFB with CPU. If CPU cannot be observed or limits fail, investigate before production expansion.
- [x] After pilot passes, remove timed revalidation: snapshot category/language/index/browse/docs-index pages become build-only, database details/catalogue/forum/document pages request-rendered. Remove fetch persistence in forum helpers. Stop unbounded catch-all ISR. Ensure non-prebuilt tag pages remain renderable.
- [x] Replace R2 incremental adapter with read-only Static Assets; remove active R2 binding and queue use while retaining existing DO class exports/migrations for rollback. Enable version-isolated Workers Cache. Do not delete the R2 bucket or DO data.
- [ ] Run typecheck, lint, tests, OpenNext build, preview smoke and browser client-navigation verification. Confirm artifact file count within platform limits and cache manifests have no timed regeneration.
- [ ] Deploy production, record previous version, smoke public/private/static/unknown routes and observe CPU/cache status. Roll back immediately if functional checks fail.
- [ ] Record before/after samples, deployment IDs, 48-hour observation checklist and rollback command. Keep all existing R2 data until user separately decides on deletion.

## Pilot evidence

- Working pilot version: `0426a95b-e220-4d04-ac25-c75b437e0ba0`.
- 55 low-rate requests: all selected HTML pages correct; repeated anonymous/locale-cookie responses HIT with identical render IDs; session and Authorization bypass. Bare RSC requests correctly redirect to a hashed URL, so navigation was additionally validated using a real browser-generated RSC request (200 text/x-component, MISS then HIT with same ID/body).
- Reused-connection HIT samples: n=11, TTFB p50=205ms / p95=254ms. Same-location existing production comparison: n=11, p50=360ms / p95=2181ms. Network exits were European Cloudflare locations; not a worldwide latency guarantee.
- Controlled warm uncached series: n=24, actual Wrangler tail CPU p50=33ms / p95=64ms / max=94ms; wall-time p95=613ms. Warm CPU and latency gates passed.
- Cold/mixed-isolate misses were significantly higher (up to 1639ms CPU); local CPU profiling identified module initialization as the primary cold overhead. They are recorded separately and are NOT represented by warm numbers. Native HIT skips rendering; observe cold fraction and bots over 48 hours.
- Browser language-switch navigation from English to Chinese passed.
