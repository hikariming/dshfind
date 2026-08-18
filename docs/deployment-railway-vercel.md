# Vercel + Railway Production Deployment Guide

简体中文：[Vercel + Railway 生产部署手册](./deployment-railway-vercel.zh-CN.md)

This guide describes dshfind's intended production topology, first-time setup order, configuration, acceptance checks, release gate, and recovery procedure. It is specific to this repository and its [`railway.json`](../railway.json), [`server/Dockerfile`](../server/Dockerfile), and GitHub Actions workflows; it is not a general Railway or Vercel tutorial.

## 1. Target topology and responsibilities

```text
Visitor
  ├─ https://dshfind.com      → Vercel / Next.js 16 (pages, static content, UI)
  └─ https://api.dshfind.com  → Railway / Go API (public directory, GraphQL, OAuth, audit)
                                      │
                                      └→ Turso / libSQL (plugin data, i18n, snapshots, API keys, audit)

GitHub Actions
  ├─ Daily GitHub-topic sync → Turso
  ├─ CI (frontend, Go, Docker, workflows)
  └─ Production Gate (observes both Git deployments, validates, recovers on failure)
```

| Component | Responsible for | Must not be responsible for |
| --- | --- | --- |
| Vercel | `dshfind.com`, Next.js runtime, static content, UI, and verification of API-issued session JWTs | GitHub OAuth client secret, Turso access, public-API auditing or rate limiting |
| Railway | `api.dshfind.com`, Go HTTP API, GitHub OAuth, request audit, in-process rate limiting | Frontend HTML or a cross-replica persistent token balance |
| Turso | Plugin directory, translations, historical snapshots, API-key policy, audit records | High-frequency token-bucket counters; per-request writes reduce availability |
| GitHub Actions | Sync, validation, and release observation/recovery | Replacing Vercel or Railway Git-native deployment |

The browser may query the public HTTPS API directly. Vercel's server-side search uses a dedicated `BACKEND_API_KEY`, avoiding a shared Vercel egress IP being treated as one anonymous caller. GitHub sign-in is completed only by the Go API; Vercel verifies the API-issued session with the same `AUTH_SECRET`.

## 2. Prerequisites

### 2.1 Accounts, projects, and domain

Prepare:

1. A Vercel Project connected to this repository, with `main` as its production branch.
2. A Railway Project (recommended name: `dshfind`) with one Go service in its production environment (recommended name: `dshfind-api`).
3. A writable Turso database and a separately rotatable auth token.
4. Control of DNS for `dshfind.com`.
5. A GitHub OAuth App; configure its callback in section 5.
6. The repository's GitHub Actions `production` Environment for the Production Gate.

Store the current Railway project and service identifiers in GitHub Environment Variables, not as fixed IDs in source or documentation. Project creation alone does not make the service usable: configure variables, seed data, deploy, and validate its domain first.

### 2.2 Turso data

The Go service idempotently creates or extends only the minimal schema needed for plugin reads, API keys, and audit. It does **not** generate plugin content. Before the first rollout, run the daily sync workflow once, or run locally with equivalent credentials:

```bash
pnpm install --frozen-lockfile
pnpm sync:db
pnpm probe:install
```

The recommended daily [sync workflow](../.github/workflows/sync-plugins.yml) uses GitHub repository secrets `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `GITHUB_TOKEN`. Never commit them.

### 2.3 Use the repository root

The Railway service's Root Directory must be the **repository root**, not `server`:

- Root [`railway.json`](../railway.json) selects `server/Dockerfile`.
- Docker's build context must include `server/go.mod`, `server/go.sum`, and `server/`.
- Watch paths are only `server/**` and `railway.json`.
- `/healthz` is the health check with a 60-second timeout.
- `drainingSeconds: 30` gives the Go process time to flush the audit queue after `SIGTERM`.

Using `server` as Root Directory breaks `dockerfilePath: server/Dockerfile` and the Dockerfile's `COPY server/...` instructions.

## 3. Railway service configuration

### 3.1 Create the service and connect Git

Create an empty Railway service, connect it to this GitHub repository, and set `main` as the production branch. Keep Railway Git auto-deploy enabled; GitHub Actions must not upload a second build artifact from a different source.

Before the first deployment, verify:

| Setting | Required value | Reason |
| --- | --- | --- |
| Build | Dockerfile | Uses repository `railway.json` |
| Dockerfile path | `server/Dockerfile` | Fixed by `railway.json` |
| Root Directory | Empty / repository root | Preserves the Docker build context |
| Healthcheck path | `/healthz` | Returns 200 only after the plugin snapshot loads |
| Healthcheck timeout | 60 seconds | Allows cold start and short Turso outages |
| Draining seconds | 30 seconds | Allows audit draining after shutdown begins |
| Watch paths | `server/**`, `railway.json` | Frontend-only changes do not rebuild the API |

### 3.2 Railway Variables

Set these values on the production Railway service. Values marked required must not rely on defaults.

| Variable | Required | Recommended production value / source | Notes |
| --- | --- | --- | --- |
| `TURSO_DATABASE_URL` | Yes | Turso database URL | `libsql://` is rewritten to HTTPS by the program; the token must permit API migrations and audit writes |
| `TURSO_AUTH_TOKEN` | Yes | Turso token | Never commit or put it on Vercel |
| `WEB_URL` | For OAuth | `https://dshfind.com` | The only frontend return origin |
| `API_PUBLIC_URL` | For OAuth | `https://api.dshfind.com` | Public API base and GitHub callback base |
| `AUTH_COOKIE_DOMAIN` | For production OAuth | `dshfind.com` | Shares the session cookie across web and API subdomains |
| `GITHUB_CLIENT_ID` | For OAuth | GitHub OAuth App | Railway only |
| `GITHUB_CLIENT_SECRET` | For OAuth | GitHub OAuth App secret | Railway only |
| `AUTH_SECRET` | For OAuth | Random value of 32+ characters | Must exactly equal Vercel's value; rotation invalidates current sessions |
| `GITHUB_ORG` | No | `dsh-external` | Organization allowed to sign in; this is the default |
| `ADMIN_TOKEN` | Strongly recommended | Random high-entropy token | When empty, all `/v1/admin/*` endpoints are disabled with 503 |
| `CACHE_REFRESH_MINUTES` | No | `10` | In-memory plugin/API-key snapshot refresh interval |
| `LOG_RETENTION_DAYS` | No | `30` | Raw audit-retention days; daily aggregates remain indefinitely |

Railway injects `PORT` automatically. Git deployments also inject `RAILWAY_GIT_COMMIT_SHA` and `RAILWAY_DEPLOYMENT_ID`; never fake them. The Production Gate uses their `/healthz` representation to confirm the deployment actually serving traffic.

### 3.3 Rate-limit variables

Token balances are deliberately process-local and volatile; a restart resets them. Rules persist in Railway Variables, while per-key policy is in Turso `api_keys.rate_per_min`. Defaults target one replica and roughly 100,000 page views per day:

| Variable | Default | Purpose |
| --- | --- | --- |
| `GLOBAL_RATE_PER_MIN` / `GLOBAL_RATE_BURST` | 6000 / 500 | Whole-process public budget (100 sustained RPS) |
| `IP_RATE_PER_MIN` / `IP_RATE_BURST` | 240 / 60 | Anonymous source-IP protection |
| `ANON_RATE_PER_MIN` / `ANON_RATE_BURST` | 30 / 10 | Extra ordinary-public-query budget |
| `SUGGEST_RATE_PER_MIN` / `SUGGEST_RATE_BURST` | 60 / 20 | Input-suggestion budget |
| `GRAPHQL_RATE_PER_MIN` / `GRAPHQL_RATE_BURST` | 60 / 20 | Additional GraphQL IP budget |
| `GRAPHQL_RATE_COST` | 10 | One GraphQL query's cost in the global bucket |
| `KEY_RATE_PER_MIN` / `KEY_RATE_BURST` | 120 / 30 | Default API-key budget; table data may override rate per minute |
| `AUTH_RATE_PER_MIN` / `AUTH_RATE_BURST` | 60 / 20 | OAuth/session per-IP budget |
| `AUTH_GLOBAL_RATE_PER_MIN` / `AUTH_GLOBAL_RATE_BURST` | 1800 / 100 | Separate OAuth/session global budget |
| `RATE_LIMIT_MAX_BUCKETS` | 65536 | Memory ceiling for active non-global buckets |

Two optional pairs as well: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (must be set together) move rate-limit counters to Upstash Redis fixed windows — consistent across replicas and restarts, with automatic fail-open to in-process buckets during Redis outages; `OTEL_EXPORTER_OTLP_ENDPOINT` (with `OTEL_SERVICE_NAME`) enables OpenTelemetry trace/metric export, and leaving it empty keeps telemetry fully disabled at zero cost.

All values must be positive integers; invalid values prevent the instance from starting. “Global” means one Railway replica today. When scaling to multiple replicas, set the Upstash variables above for cross-replica-consistent limiting (or use an edge WAF); do not persist every token debit to Turso.

### 3.4 First deploy and health checks

Push `main`, wait for Railway to reach terminal `SUCCESS`, then validate with its `*.up.railway.app` domain before assigning the production API domain:

```bash
curl --fail --show-error https://<railway-domain>/healthz
curl --fail --show-error 'https://<railway-domain>/v1/plugins?per_page=1'
curl --fail --show-error --get 'https://<railway-domain>/graphql' \
  --data-urlencode 'query={ dataset { dataVersion asOf } }'
```

`/healthz` must report `status: "ok"`, `plugins_loaded` should match the seeded database, and a Git-integrated deployment must expose non-empty `commit_sha` and `deployment_id`. While Turso is unavailable at startup, the process still listens but `/healthz` returns 503 and retries initialization every five seconds; this prevents an empty-cache instance from receiving health traffic.

## 4. Vercel configuration

Connect the Vercel Project to this repository and use `main` for production. Set production variables, then redeploy:

| Variable | Required | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `https://api.dshfind.com` |
| `BACKEND_API_KEY` | Recommended | A server-only key created through the Go Admin API; never give it a `NEXT_PUBLIC_` prefix |
| `AUTH_SECRET` | For OAuth | The same value as Railway, used to verify API-issued HS256 sessions |
| `AUTH_GATE` | No | `1` enables organization-member gating; without it, sign-in remains available but the gate is not enforced |

Vercel must **not** store `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ORG`, or a Turso write token. The Go API owns OAuth; exposing those values to Vercel broadens runtime secret exposure.

Once Railway has `ADMIN_TOKEN`, create Vercel's server-side key. Its plaintext is returned once:

```bash
curl -X POST https://api.dshfind.com/v1/admin/keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"name":"vercel-production","contact":"ops","rate_per_min":3600}'
```

Store the returned `key` as Vercel `BACKEND_API_KEY`. It authorizes only public read API access, not Admin or database access.

## 5. Domain, DNS, and GitHub OAuth

### 5.1 Move the API domain

1. In Railway service settings, add custom domain `api.dshfind.com`.
2. Use the CNAME target shown by Railway **at that time**; never copy one from an old document.
3. Point DNS for `api.dshfind.com` to that CNAME and remove any old Vercel record or Vercel domain assignment for this subdomain.
4. Wait for both DNS and Railway domain status, then verify:

   ```bash
   curl -i https://api.dshfind.com/healthz
   ```

   The response must be Railway's 200. An `x-vercel-error: DEPLOYMENT_NOT_FOUND` response means DNS/Vercel ownership has not moved; stop before front-end release.
5. Set Vercel `NEXT_PUBLIC_API_BASE_URL` and redeploy. Browser public-data calls use `Access-Control-Allow-Origin: *`; cookie-bearing auth endpoints accept only `WEB_URL`.

### 5.2 GitHub OAuth App

Set the GitHub OAuth App Authorization callback URL to:

```text
https://api.dshfind.com/auth/github/callback
```

It must not point to the removed Vercel `/api/auth/...` paths. The Go API validates PKCE and state, uses the short-lived access token to check GitHub user and `GITHUB_ORG` membership, then issues `dshfind_session`. It does not persist the GitHub access token or place it in a cookie.

The production cookie is `HttpOnly; Secure; SameSite=Lax; Domain=dshfind.com`. Changing `AUTH_SECRET` invalidates all current sessions, so rotate at low traffic and update Railway and Vercel together before release.

## 6. CI and the two-platform Production Gate

### 6.1 Pull-request and branch CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on pushes and pull requests for `dev` and `main`:

- frontend: locked dependency install, `next typegen`, TypeScript, ESLint, Node tests, and `next build`;
- backend: `go test -race ./...`, `go vet ./...`, a static Linux build, and root-context `server/Dockerfile` build;
- deployment assets: Gate Node syntax/tests, GitHub Actions workflow validation, and Railway schema validation.

Protect `main` and require **CI / Frontend checks** and **CI / Go API and Docker checks** before merging.

### 6.2 Production Gate configuration

Create a GitHub `production` Environment and set:

| Type | Name |
| --- | --- |
| Secrets | `VERCEL_TOKEN`, `RAILWAY_TOKEN` |
| Variables | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_SERVICE_ID`, `PROD_WEB_URL=https://dshfind.com`, `PROD_API_URL=https://api.dshfind.com` |

`RAILWAY_TOKEN` must be a project token limited to the production API service. The Gate rejects missing values before attempting an unsafe rollback.

Each push to `main` still lets Vercel and Railway deploy automatically. The Gate does not deploy; it:

1. Captures the prior healthy Vercel production and Railway deployment anchors.
2. Confirms the workflow still represents the current `main` HEAD; stale jobs skip recovery.
3. Re-runs frontend, Go, and Docker validation.
4. Waits for Vercel to make the current SHA `READY`; when `server/**` or `railway.json` changed, also waits for `/healthz` to serve the current Railway SHA.
5. Smoke-tests the web homepage, `/healthz`, suggest, and public GraphQL.
6. On any failed validation, platform deployment, timeout, or smoke test, promotes Vercel's captured deployment, rolls Railway back to the captured rollbackable anchor, then checks health and smoke again.
7. Fails the workflow if recovery or recovery verification fails, while printing the anchor IDs.

This is automatic recovery after failure, not an atomic cross-platform cutover: platforms deploy independently and may briefly serve different application versions. Turso is shared and is not rolled back, so every database change must remain backward-compatible with the preceding application version.

After the first real API rollout, manually run **Production deployment gate** with `mode=preflight`. It only reads current anchors and succeeds only when `/healthz` `commit_sha` and `deployment_id` match the Railway control plane. Enable automatic Gate use only after this check succeeds.

## 7. Release acceptance checklist

Perform these in order to avoid switching the frontend before the API domain is usable:

1. [ ] Turso contains plugin data and the daily sync workflow succeeded.
2. [ ] Required Railway Variables are set, including an `AUTH_SECRET` matching Vercel.
3. [ ] Railway `*.up.railway.app/healthz`, `/v1/plugins`, and `/graphql` pass.
4. [ ] `api.dshfind.com` points only to Railway; `/healthz` no longer returns Vercel 404.
5. [ ] The GitHub OAuth callback uses the API subdomain; `/auth/github` reaches GitHub and returns to the frontend.
6. [ ] Vercel production has API base, server-only key, and the shared session secret, then has been redeployed.
7. [ ] Browser search, Vercel server-side search, REST, GraphQL, and health all pass.
8. [ ] CI passes on `main`; GitHub `production` Environment credentials and variables are complete.
9. [ ] Manual preflight succeeds, then observe one normal `main` release through the Gate.

Recommended minimum smoke set:

```bash
curl --fail --show-error https://dshfind.com/zh
curl --fail --show-error https://api.dshfind.com/healthz
curl --fail --show-error 'https://api.dshfind.com/v1/suggest?q=memory'
curl --fail --show-error --get https://api.dshfind.com/graphql \
  --data-urlencode 'query={ plugins(first: 1) { totalCount nodes { fullName repositoryUrl } } }'
```

## 8. Failure triage and recovery

| Symptom | Check first | Typical cause and response |
| --- | --- | --- |
| `api.dshfind.com` returns Vercel `DEPLOYMENT_NOT_FOUND` | DNS and Vercel Domains | The subdomain is still assigned to Vercel; remove the old assignment and bind Railway's current CNAME |
| Railway build cannot find `server/go.mod` or the Dockerfile | Root Directory and build logs | Root Directory was set to `server`; restore repository root |
| Railway health check returns 503 | `/healthz` and runtime logs | Turso URL/token invalid or first snapshot not loaded; check Variables, connectivity, and sync tables |
| API is 200 but listing is empty | `/v1/plugins?per_page=1` | Only minimal migration tables exist; run/fix the sync workflow |
| Sign-in redirect fails | OAuth callback, `WEB_URL`, `API_PUBLIC_URL`, cookie domain | It still uses the old Vercel callback or secrets/domain disagree |
| Gate has no anchor or refuses to run | GitHub Environment and `/healthz` | Variables/secrets are missing, or the API does not report the serving commit/deployment identity |
| Gate failed and recovered | Gate log anchor IDs | Confirm both platforms' smoke checks after recovery; do not substitute Vercel Instant Rollback for a promote |
| Multiple replicas multiply real quotas | Railway replica count and 429 metrics | In-process buckets are independent per replica; move to Redis/Valkey or an edge global limiter |

Manual recovery should begin with the GitHub **Production deployment gate** logs and their captured anchor IDs, not by rebuilding a service. If a schema change is incompatible with the previous application, an application rollback is not safe: stop release and restore backward compatibility first.

## 9. Related documentation

- [Public Data API and Query Guide](./api-query.md)
- [公开数据接口与查询指南（简体中文）](./api-query.zh-CN.md)
- [`server/README.md`](../server/README.md): local operation, internal Admin API, and implementation details
- [`railway.json`](../railway.json): version-controlled Railway build/deploy configuration
- [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml): executable Production Gate definition
