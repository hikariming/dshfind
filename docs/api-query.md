# dshfind Public Data API and Query Guide

This guide is for developers using dshfind as a plugin-directory data source. It documents the public REST and GraphQL contracts that are available today: field meanings and provenance, caching and dataset consistency, rate limits, error handling, and integration examples.

简体中文：[dshfind 外部数据 API 与查询指南](./api-query.zh-CN.md)

> Base URL: `https://api.dshfind.com`. Before the production domain is cut over, a Railway-issued `*.up.railway.app` domain may be used for pre-production verification. Do not embed that temporary domain in a third-party client.

## 1. Scope, stability, and access

### 1.1 Public and private boundaries

| Area | Public | Purpose |
| --- | --- | --- |
| `GET /v1/suggest`, `GET /v1/plugins*`, `GET /v1/catalog` | Yes | Search suggestions, directory listings, full-catalog snapshots, and details |
| `GET /market/manifest.json`, `GET /market/v1/plugins` | Yes | Standard catalog-source manifest and contract-paginated pages for the DSH desktop community market |
| `GET` / `POST /graphql`, `GET /graphql/schema` | Yes | Read-only, field-selectable directory data |
| `GET /healthz` | Yes | Availability and deployment observation; not a directory-sync API |
| `/auth/*` | No data API | GitHub sign-in and sessions; only the configured web origin may send cookies |
| `/v1/admin/*` | No | API-key management, usage, and IP/UA audit data; requires `ADMIN_TOKEN` |

The public schema and REST representations never expose API keys, request IP addresses, User-Agent, Origin, Referer, audit records, GitHub OAuth tokens, or scoring inputs. External consumers must depend only on the public fields documented here.

### 1.2 HTTP, CORS, and API keys

- Public REST endpoints support `GET` only. GraphQL supports `GET` and `POST`, and supports `query` operations only.
- Public data endpoints return `Access-Control-Allow-Origin: *`, so they may be called directly from a browser. Public data requests do not use cookies.
- An API key is optional. It gives a caller an independent quota and attributable audit trail; either header is equivalent:

  ```http
  Authorization: Bearer dshf_...
  X-Api-Key: dshf_...
  ```

- An invalid or revoked key returns `401 unauthorized`; it never silently falls back to anonymous access. The request is still checked against anonymous, IP, and global protection limits first.
- A key authorizes only public read API quota and attribution. It never grants Admin access, database writes, or unpublished fields.

## 2. Freshness, caching, and incremental synchronization

### 2.1 Sources and refresh cadence

| Data group | Read path | Source of truth | Refresh path |
| --- | --- | --- | --- |
| Base plugin directory | Go in-memory snapshot | Turso `plugins` | GitHub Actions syncs daily; the API refreshes its snapshot every 10 minutes by default |
| Localized content | REST detail / GraphQL on demand | Turso `plugin_i18n` | Operations-maintained write scripts |
| Metric snapshots | REST detail / GraphQL on demand | Turso `plugin_snapshots` | Idempotently written during daily sync |
| Scores and editorial flags | Base snapshot | Turso `plugins` | dshfind scoring and editorial workflows |
| Installation probes | Base snapshot | Turso `plugins` | `probe:install` or a manual override |

Listings and suggestions are safe for high-frequency reads and do not contact Turso per request. A detail request's `i18n` and `snapshots`, and the equivalent selected GraphQL nested fields, are read from Turso. A GraphQL connection prefetches those fields for a page in batches, avoiding one database read per node.

`url` and `repositoryUrl` always mean the **GitHub repository page**, for example `https://github.com/owner/repo`. They are not clone URLs, raw-file URLs, or download URLs. `repositoryUrl` is the unambiguous field for new code; REST keeps `url` with the same value for compatibility.

### 2.2 `data_version` / `dataVersion`

The base directory has a content hash calculated from its public base data:

```text
sha256:<hex>
```

Refreshing unchanged data does not change this version. A synchronizer should:

1. Read `dataset.dataVersion` (GraphQL) or `data_version` from a REST listing.
2. Store that version with its complete fetched result.
3. Check the version before the next synchronization; stop when it has not changed.
4. Start a new full sync only when it has changed.

`as_of` / `asOf` is the latest traceable write time included in the base snapshot (sync, scoring, or installation probing), not the HTTP-response generation time. `generated_at` is a REST compatibility field and currently equals `as_of`.

### 2.3 HTTP cache semantics

Successful public-data responses include a strong content `ETag`. For `GET`, use `If-None-Match` to receive `304 Not Modified`. POST GraphQL responses also carry an ETag, but HTTP conditional `304` applies only to `GET`/`HEAD`.

| Resource | `Cache-Control` | Recommended client behavior |
| --- | --- | --- |
| `/v1/suggest` with a valid `q` | `public, max-age=60, s-maxage=3600, stale-while-revalidate=86400` | Cache at a CDN for one hour; keep a short browser cache |
| `/v1/plugins*`, successful GraphQL | `public, max-age=60, s-maxage=300, stale-while-revalidate=86400` | Five-minute shared cache plus strong ETag revalidation |
| `/graphql/schema` | `public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` | Fetch SDL daily for code generation |
| `/v1/suggest?q=<2 characters` | `no-store` | Do not cache an empty suggestion result |
| Errors and GraphQL execution errors | `no-store` | Do not cache errors |

An API key does not change a public-data representation, so successful keyed responses may safely use the same public cache. Prefer GraphQL `GET` for CDN caching and conditional revalidation.

## 3. Public plugin object

REST uses `snake_case`; GraphQL uses `camelCase`. Unless noted, numeric `0` and boolean `false` are meaningful values, not unknown values. A documented `null` means that the source has no conclusion yet; do not replace it with an empty string or zero.

| Meaning | REST | GraphQL | Type / nullability | Source and interpretation |
| --- | --- | --- | --- | --- |
| Stable ID | `full_name` | `id`, `fullName` | Non-null string | `owner/repo`, the primary key for every plugin; `id === fullName` |
| Display name | `name` | `name` | Non-null string | GitHub repository name |
| Owner | `owner` | `owner` | Non-null string | GitHub owner or organization |
| Repository page | `repository_url` | `repositoryUrl` | Non-null URL | GitHub repository-page URL |
| Legacy repository page | `url` | `url` (deprecated) | Non-null URL | Same repository-page URL; use `repositoryUrl` in new code |
| Description | `description` | `description` | Non-null string; may be `""` | GitHub repository description; empty when absent |
| Tags | `tags` | `tags` | Non-null string array | Synced topics/classification tags; `[]` when none |
| Primary language | `language` | `language` | Non-null string; may be `""` | GitHub primary language |
| Stars | `stars` | `stars` | Non-null integer | Current synced GitHub stars |
| Contributors | `contributors` | `contributors` | Nullable integer | Synced count; `null` when unknown |
| Last push | `pushed_at` | `pushedAt` | Nullable RFC 3339 `DateTime` | Latest GitHub push time; `null` when unknown |
| Archived | `archived` | `archived` | Non-null boolean | GitHub archived status |
| Directory category | `category` | `category` | Non-null string; may be `""` | dshfind classification, not a GitHub-native field |
| First seen | `first_seen_at` | `firstSeenAt` | Nullable `DateTime` | When dshfind first recorded the plugin |
| Last synced | `last_synced_at` | `lastSyncedAt` | Nullable `DateTime` | Latest base GitHub-data sync |
| Featured | `is_featured` | `isFeatured` | Non-null boolean | dshfind editorial flag |
| Official | `is_official` | `isOfficial` | Non-null boolean | dshfind editorial flag, not GitHub verification |
| Insider | `is_insider` | `isInsider` | Non-null boolean | dshfind editorial flag |
| Plugin classification | `is_plugin` | `isPlugin` | Nullable boolean (tri-state) | `true` = confirmed DSH plugin (package.json declares `dsh.bundle`); `false` = confirmed non-plugin (probed not-installable or editorially marked); `null` = not yet probed/unknown. Filtering in 4.2 |

### 3.1 dshfind scoring (not a GitHub score)

`score`, `grade`, and `rating` are **dshfind's own composite score**. They are not GitHub stars, GitHub topics, a third-party marketplace rating, or a replacement for a GitHub evaluation. The `score_detail` inputs are deliberately not public so that internal policy is not mistaken for a stable external contract.

| REST field | GraphQL field | Meaning |
| --- | --- | --- |
| `score` | `score` | dshfind score from 0–100; `null` when not scored |
| `grade` | `grade` | `S` / `A` / `B` / `C` mapped from the current score; `null` when not scored |
| `scored_at` | `rating.calculatedAt` | Time at which this score was written; historic records may be `null` |
| `score_version` | `rating.version` | Version of the scoring algorithm and input policy; historic records may be `null` |
| — | `rating { score grade calculatedAt version }` | Aggregate object; `null` when not scored |

Current cutoffs are S ≥ 85, A ≥ 70, B ≥ 55, and C for all other scored plugins. Consumers storing scores should store `score_version` and `scored_at` too; scores from different versions are not necessarily comparable.

### 3.2 Installation data

| REST | GraphQL | Type / nullability | Meaning |
| --- | --- | --- | --- |
| `install.cmd` | `install.cmd` | Nullable string | Current usable installation command. A confirmed manual `install_cmd` takes precedence over inferred `install_cmd_auto`. |
| `install.source` | `install.source` | Non-null string | `manual`, `auto`, or `""` when no command is available |
| `install.kind` | `install.kind` | Nullable string | `release`, `npm`, `git`, `build-required`, `not-installable`; `null` means not yet probed |
| `install.pkg_name` | `install.pkgName` | Nullable string | Detected npm package name |
| `install.pkg_version` | — | Nullable string, may be omitted | Exact version from the repository HEAD package.json |
| `install.npm_published` | `install.npmPublished` | Non-null boolean | Whether it is published to npm |
| `install.methods` | — | Array, may be omitted | Executable install-method evidence shaped after the desktop `installMethods[]` contract: exactly one `{kind:"npm", verification:"verified", code:"repository_backlink", requiresBuildAllowance:false, spec, revision}` entry, emitted only when the package is npm-published, its repository backlink checks out, and an exact stable version exists on npm |
| `install.release_tgz_url` | `install.releaseTgzUrl` | REST may omit; GraphQL nullable | Release tarball URL, not a repository page |
| `install.release_tag` | `install.releaseTag` | REST may omit; GraphQL nullable | Corresponding GitHub Release tag |
| `install.probed_at` | `install.probedAt` | Nullable `DateTime` | Last successful write of the installation conclusion |

Installation conclusions come from dshfind probes and editorial maintenance; they are not a guarantee that every command works on every operating system or local environment. Display `kind` and `probedAt`, and treat `cmd: null` as “no usable command currently known”—do not invent a command from a Git URL.

### 3.3 Localizations, snapshots, and growth

| REST detail | GraphQL | Meaning |
| --- | --- | --- |
| `i18n` object keyed by locale | `i18n(locale: String)` array | `description`, `intro`, `highlights`, `updatedAt`; individual text fields may be `null`, while no highlights is `[]` |
| `snapshots` | `snapshots(days: Int = 30)` | Daily GitHub metrics: `date` (`YYYY-MM-DD`), `stars`, nullable `contributors`, nullable `pushedAt` |
| `growth` | `growth` | Fixed seven-day deltas for `stars` and nullable `contributors`. With fewer than two snapshots, stars is `0` and contributors is `null`. |

REST detail uses `snapshot_days` (default 30, maximum 90); GraphQL uses `snapshots(days:)` (default 30, maximum 90). Growth uses all available snapshots to find the nearest baseline at least seven days before the latest snapshot, so it is not limited by the response's selected day count.

## 4. REST API

### 4.1 Search suggestions: `GET /v1/suggest`

```bash
curl --get 'https://api.dshfind.com/v1/suggest' \
  --data-urlencode 'q=memory'
```

| Parameter | Required | Rules |
| --- | --- | --- |
| `q` | No | Trimmed, limited to 64 Unicode characters, and lowercased. Fewer than two characters returns empty items immediately. |

The query performs a substring match over `full_name + description + tags`, not `language`. It returns at most ten results, ordered by featured status first, then descending stars, then stable name order.

```json
{
  "items": [
    {
      "type": "plugin",
      "id": "owner/repo",
      "label": "repo",
      "sub": "plugin description or @owner",
      "href": "/plugins/owner/repo",
      "stars": 321,
      "featured": true
    }
  ]
}
```

`href` is a dshfind-relative path. An external site must prepend `https://dshfind.com` before navigating. No matches still return `200 {"items":[]}`, not `404`.

### 4.2 Plugin listing: `GET /v1/plugins`

```bash
curl --get 'https://api.dshfind.com/v1/plugins' \
  --data-urlencode 'q=memory' \
  --data-urlencode 'language=TypeScript' \
  --data-urlencode 'min_score=70' \
  --data-urlencode 'sort=stars' \
  --data-urlencode 'order=desc' \
  --data-urlencode 'page=1' \
  --data-urlencode 'per_page=20'
```

#### Parameters

| Parameter | Default / range | Meaning |
| --- | --- | --- |
| `page` | 1; minimum 1 | Page number. Very large values return empty `data`, not an error. |
| `per_page` | 20; 1–100 | Page size. Out-of-range values are clamped. |
| `category` | — | Exact dshfind category, for example `memory` or `tools` |
| `language` | — | Case-insensitive exact match, for example `TypeScript` |
| `grade` | — | `S` / `A` / `B` / `C`; unscored plugins match no grade |
| `q` | — | Up to 64 characters; matches `full_name + description + tags + language` |
| `owner` | — | Case-insensitive owner match |
| `tag` | — | Case-insensitive tag match |
| `min_score` | 0–100 | Includes scored plugins equal to or above the threshold; unscored plugins do not match |
| `featured` / `official` / `archived` / `insider` / `has_install` | `true`/`false`/`1`/`0` | Filters only when supplied as a recognized boolean; any other value is treated as absent |
| `is_plugin` | `true`/`false`/`1`/`0` | Tri-state filter: `1` keeps only confirmed plugins, `0` keeps only confirmed non-plugins; unknown (`null`) matches neither, and omitting the parameter disables the filter |
| `sort` | Omitted preserves editorial order | `stars`, `updated`, `score`, or `name` |
| `order` | `desc` for numeric/time/score; `asc` for `name` | `asc` or `desc`; used only when `sort` is active |
| `data_version` | — | Repeat the version from page one on later pages to prevent a silent cross-dataset listing |

With no `sort`, the base snapshot uses editorial order: `is_featured DESC, stars DESC, full_name ASC`. `updated` sorts on `pushed_at`, with missing values participating as an empty string. `score` treats unscored plugins as lower than scored plugins.

Response shape:

```json
{
  "data": [
    {
      "full_name": "owner/repo",
      "name": "repo",
      "owner": "owner",
      "url": "https://github.com/owner/repo",
      "repository_url": "https://github.com/owner/repo",
      "description": "...",
      "tags": ["memory"],
      "language": "TypeScript",
      "stars": 321,
      "contributors": 4,
      "pushed_at": "2026-08-10T02:00:00Z",
      "archived": false,
      "category": "memory",
      "score": 87,
      "grade": "S",
      "scored_at": "2026-08-17T00:00:00Z",
      "score_version": "2026-08-17.1",
      "is_featured": true,
      "is_official": false,
      "is_insider": false,
      "is_plugin": true,
      "install": {
        "cmd": "...",
        "source": "auto",
        "kind": "npm",
        "pkg_name": "...",
        "npm_published": true,
        "probed_at": "2026-08-17T00:00:00Z"
      },
      "first_seen_at": "2026-07-01T00:00:00Z",
      "last_synced_at": "2026-08-17T00:00:00Z"
    }
  ],
  "page": 1,
  "per_page": 20,
  "total": 4093,
  "total_pages": 205,
  "data_version": "sha256:...",
  "as_of": "2026-08-17T00:00:00Z",
  "generated_at": "2026-08-17T00:00:00Z"
}
```

Numbers are illustrative only and must not be used to assert a production dataset size.

#### Consistent REST pagination

For a sync spanning more than one page, pin `data_version`:

```text
GET /v1/plugins?per_page=100&page=1
  → save data_version = sha256:abc
GET /v1/plugins?per_page=100&page=2&data_version=sha256:abc
```

If the base dataset changes between requests, a later page returns `409` with `stale_data`. Discard the entire collected run and restart from page one; never mix pages from two versions.

#### Special response for the desktop community market

When the request header `User-Agent` is exactly `dsh-community-market/0.1`, the list endpoint returns only a first-wave subset: confirmed non-plugins (`is_plugin=false`) are dropped first, then the catalog is truncated to the first 200 entries in the editorial default order, and finally paginated with the client's `page`/`per_page`. This lets that client finish its first screen in two requests instead of paging through the whole catalog. The response carries `Vary: User-Agent`, so shared caches bucket by UA and other clients are unaffected. Desktop versions that need the full catalog should use `GET /v1/catalog` (see 4.3).

### 4.3 Full catalog: `GET /v1/catalog`

Returns the entire public catalog in one JSON response (thousands of entries, several MB), for bulk consumers that prefer a single download over paging `/v1/plugins`:

```bash
curl 'https://api.dshfind.com/v1/catalog'
```

Response shape:

```json
{
  "data": [ /* full plugin objects, fields per section 3 */ ],
  "total": 6662,
  "data_version": "sha256:...",
  "as_of": "2026-08-17T00:00:00Z",
  "generated_at": "2026-08-17T00:00:00Z"
}
```

Data is immutable per `data_version`. Recommended usage: request `/v1/plugins?per_page=1` first to learn the current `data_version`, then pin it on the catalog request:

```text
GET /v1/catalog?data_version=sha256:abc
  → Cache-Control: public, max-age=60, s-maxage=86400, immutable
```

With a matching version the response is content-addressed and edge caches may hold it long-term; without a version, or with a stale one, it falls back to the same short caching as the list (`s-maxage=300`). A version mismatch does not return 409 — the current snapshot is served and the caller compares the embedded `data_version` itself. ETag/`If-None-Match` conditional requests are supported.

### 4.4 Plugin detail: `GET /v1/plugins/{owner}/{repo}`

```bash
curl --get 'https://api.dshfind.com/v1/plugins/owner/repo' \
  --data-urlencode 'snapshot_days=60'
```

The path's owner and repository are case-insensitive. The response contains the complete REST plugin object from section 3 plus:

```json
{
  "i18n": {
    "zh": {
      "description": "...",
      "intro": "...",
      "highlights": ["..."],
      "updated_at": "2026-08-17T00:00:00Z"
    }
  },
  "snapshots": [
    { "date": "2026-08-16", "stars": 321, "contributors": 4, "pushed_at": "..." }
  ],
  "growth": { "window_days": 7, "stars": 12, "contributors": 1 },
  "data_version": "sha256:...",
  "as_of": "..."
}
```

`snapshot_days` defaults to 30 and is clamped to 1–90. A missing plugin returns `404 not_found`. The base object still comes from the same in-memory snapshot, while i18n and snapshots are current detail data read from Turso for this request. Therefore its ETag covers complete response bytes, not only `data_version`.

### 4.5 Standard catalog source: `GET /market/manifest.json`

A static catalog-source manifest for the DSH desktop community market, conforming to the `catalog-source` schema (`manifestVersion: "1.0.0"`). It declares this directory's identity, attribution, transport, and query capabilities so that the desktop client can consume dshfind as a standard source without a reviewed adapter:

```bash
curl 'https://api.dshfind.com/market/manifest.json'
```

```json
{
  "manifestVersion": "1.0.0",
  "providerId": "com.dshfind.catalog",
  "name": "dshfind Plugin Catalog",
  "description": "Community catalog of DeepSeek Harness plugins indexed by dshfind.",
  "homepage": "https://dshfind.com",
  "attribution": { "name": "dshfind", "url": "https://dshfind.com" },
  "transport": {
    "kind": "https-json",
    "endpoint": "https://api.dshfind.com/market/v1/plugins",
    "method": "GET"
  },
  "query": {
    "supported": ["q", "category", "cursor", "limit"],
    "defaultLimit": 50,
    "maxLimit": 100,
    "sorts": []
  }
}
```

To register dshfind in the desktop app, open the community market's source management, choose “add standard source”, and register the manifest URL `https://api.dshfind.com/market/manifest.json`. The Host validates the manifest, stores it as a local user-owned source, and only fetches catalog pages from `transport.endpoint` after the user selects the source.

### 4.6 Standard catalog pages: `GET /market/v1/plugins`

The contract-paginated catalog endpoint advertised by the manifest, conforming to the `catalog-provider-page` schema (`schemaVersion: "1.0.0"`).

| Parameter | Default / range | Meaning |
| --- | --- | --- |
| `q` | — | Keyword match over the catalog |
| `category` | — | Category filter |
| `limit` | 50; 1–100 | Page size |
| `cursor` | — | Opaque cursor from the previous page's `page.nextCursor`; omit for the first page |

Response shape:

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-08-17T00:00:00Z",
  "revision": "...",
  "items": [
    {
      "id": "owner/repo",
      "name": "repo",
      "displayName": "Repo",
      "summary": "...",
      "homepage": "https://...",
      "latestVersion": "1.2.3",
      "license": "MIT",
      "categories": ["memory"],
      "keywords": ["..."],
      "repository": { "url": "https://github.com/owner/repo" },
      "package": { "registry": "npm", "name": "..." },
      "publisher": { "name": "..." },
      "updatedAt": "2026-08-17T00:00:00Z"
    }
  ],
  "page": { "nextCursor": "...", "total": 123 }
}
```

Item fields are a fixed whitelist (`additionalProperties: false`): `id`, `name`, `displayName`, `summary`, `homepage`, `latestVersion`, `license`, `categories`, `keywords`, `repository`, `package`, `publisher`, `media`, `capabilities`, `compatibility`, `updatedAt`. `id`, `name`, `displayName`, and `summary` are always present and non-empty; at least one of `repository` or `package` is present. `package` appears only together with an exact stable semver `latestVersion` (`x.y.z`) and an `https` `repository.url`, and its `registry` is `npm`. To paginate, repeat the request with the returned `page.nextCursor` until it is absent; the accumulated item count then equals `page.total`.

### 4.7 Health: `GET /healthz`

```json
{
  "status": "ok",
  "plugins_loaded": 4093,
  "commit_sha": "<Git SHA>",
  "deployment_id": "<Railway deployment ID>",
  "cache_loaded_at": "2026-08-17T00:00:00Z",
  "audit_queue": 0,
  "audit_dropped": 0,
  "rate_limit_backend": "memory",
  "rate_limit_redis_fallbacks": 0
}
```

This endpoint returns 200 only after the initial plugin snapshot loads; before then it returns 503. `commit_sha` and `deployment_id` allow the production gate to verify the instance serving traffic, and may be absent for local or non-Git deployments. `audit_dropped > 0` means the audit queue was once full; alert on it and assess traffic/database capacity, but it does not alter directory-response correctness. `rate_limit_backend` is `redis` (when `UPSTASH_REDIS_REST_URL/TOKEN` are configured) or `memory`; `rate_limit_redis_fallbacks > 0` means the limiter fell back to in-process buckets during a Redis outage.

## 5. GraphQL API

### 5.1 Endpoints and request formats

- `GET /graphql?query=<URL encoded>&variables=<JSON encoded>&operationName=<optional>` is suitable for CDN caching, ETags, and bookmarkable queries.
- `POST /graphql` accepts `Content-Type: application/json` and a body of `{ "query", "variables", "operationName" }`.
- `GET /graphql/schema` returns the current SDL as `application/graphql; charset=utf-8`. Introspection is intentionally unavailable; download SDL for client code generation instead of querying `__schema`.

POST example:

```bash
curl https://api.dshfind.com/graphql \
  -H 'Content-Type: application/json' \
  --data '{
    "query": "query Plugin($name: ID!) { plugin(fullName: $name) { fullName repositoryUrl stars rating { score grade version } } }",
    "variables": { "name": "owner/repo" }
  }'
```

GET example:

```bash
curl --get https://api.dshfind.com/graphql \
  --data-urlencode 'query={ dataset { dataVersion asOf } pluginFacets { categories { value count } } }'
```

The parser supports variables, operation names, aliases, named fragments, and inline fragments. It does not support mutations, subscriptions, directives, introspection, or block strings. This is not an arbitrary GraphQL gateway: only fields in the published SDL may be selected.

### 5.2 Root queries

| Query | Arguments | Returns | Use case |
| --- | --- | --- | --- |
| `dataset` | None | `Dataset!` | Lightweight base-directory version/time check |
| `plugin` | `fullName: ID!` | `Plugin` | Exact single-plugin read; `null` if absent |
| `plugins` | `first`, `after`, `filter`, `sort`, `order` | `PluginConnection!` | Cursor-paginated listing or full mirror |
| `pluginFacets` | None | `PluginFacets!` | Build filters with each possible value's current count |

An operation may select at most eight root fields, but all `plugin` and `plugins` plugin-data root resolvers combined may be selected only once, including aliases. For example, one request may select `dataset`, `pluginFacets`, and a single `plugins` connection; it may not select multiple plugin connections or select both `plugin` and `plugins`. This prevents aliases from multiplying Turso reads in one request.

### 5.3 `PluginFilter`

GraphQL filtering uses the same matching rules as the REST listing, with camelCase names:

```graphql
input PluginFilter {
  category: String
  language: String
  grade: PluginGrade
  q: String
  owner: String
  tag: String
  minScore: Int
  featured: Boolean
  official: Boolean
  archived: Boolean
  insider: Boolean
  risky: Boolean
  hasInstall: Boolean
  "Tri-state plugin classification: true keeps only confirmed plugins, false only confirmed non-plugins; omitted disables the filter"
  isPlugin: Boolean
}
```

- `minScore` must be an integer from 0 through 100; an out-of-range value is a GraphQL execution error.
- `q` is trimmed, lowercased, and truncated to 64 Unicode characters.
- `grade` is `S` / `A` / `B` / `C`; a plugin without `rating` does not match one.
- `sort` is `DEFAULT`, `STARS`, `UPDATED`, `SCORE`, or `NAME`; `order` is `ASC` or `DESC`. `DEFAULT` preserves editorial order and is not reordered by `order`.

### 5.4 Connections and cursor pagination

`plugins` uses a cursor connection rather than REST `page`/`per_page` pagination:

```graphql
query ListPlugins($after: String, $filter: PluginFilter) {
  plugins(first: 50, after: $after, filter: $filter, sort: STARS, order: DESC) {
    totalCount
    dataVersion
    asOf
    nodes {
      fullName
      repositoryUrl
      stars
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Rules for correct use:

- `first` defaults to 20 and ranges from 1–50; outside that range is an execution error.
- Omit `after` or pass `after: null` for the first page. For the next page, pass only the preceding response's `endCursor`.
- A cursor is opaque and bound to `dataVersion`, the full filter, sort, and order. Do not decode, modify, reuse across queries, or replace it with a REST page number.
- If the base directory, filter, or ordering changes, a subsequent cursor produces a GraphQL error. Discard the current run and start over.
- `endCursor` is `null` for an empty page. Do not make another request when `hasNextPage` is `false`.

Variables example:

```json
{
  "query": "query List($after: String, $filter: PluginFilter) { plugins(first: 50, after: $after, filter: $filter, sort: SCORE) { dataVersion nodes { fullName rating { score grade calculatedAt version } } pageInfo { hasNextPage endCursor } } }",
  "variables": {
    "after": null,
    "filter": { "category": "memory", "minScore": 70, "hasInstall": true }
  }
}
```

### 5.5 GraphQL field reference

#### `Dataset`, `PluginConnection`, and facets

| Type | Field | Type | Meaning |
| --- | --- | --- | --- |
| `Dataset` | `dataVersion` | `ID!` | Content version of the base snapshot |
| `Dataset` | `asOf` | `DateTime!` | Latest traceable write included in the base snapshot |
| `PluginConnection` | `nodes` | `[Plugin!]!` | The current cursor page |
| `PluginConnection` | `pageInfo` | `PageInfo!` | `hasNextPage` and nullable `endCursor` |
| `PluginConnection` | `totalCount` | `Int!` | Count after filtering |
| `PluginConnection` | `dataVersion` / `asOf` | Non-null | Same meaning as `dataset`, allowing one-request sync metadata |
| `PluginFacets` | `categories` / `languages` / `tags` / `grades` | `[PluginFacet!]!` | `{ value, count }`, ordered by descending count then ascending value; always based on the full base directory, not a particular `plugins.filter` |

#### `Plugin`

The base `Plugin` fields correspond directly to section 3's REST table, with camelCase names. Fetch the complete SDL from `/graphql/schema`. Frequently selected fields are grouped below:

```graphql
type Plugin {
  id: ID!
  fullName: String!
  name: String!
  owner: String!
  repositoryUrl: String!
  url: String! # deprecated: use repositoryUrl

  description: String!
  tags: [String!]!
  language: String!
  stars: Int!
  contributors: Int
  pushedAt: DateTime
  archived: Boolean!
  category: String!

  score: Int
  grade: PluginGrade
  rating: PluginRating
  isFeatured: Boolean!
  isOfficial: Boolean!
  isInsider: Boolean!
  isRisky: Boolean!
  riskNote: String
  isPlugin: Boolean

  install: Install!
  firstSeenAt: DateTime
  lastSyncedAt: DateTime
  i18n(locale: String): [PluginI18n!]!
  snapshots(days: Int = 30): [PluginSnapshot!]!
  growth: PluginGrowth!
}
```

`Install`, `PluginI18n`, `PluginSnapshot`, and `PluginGrowth` use the semantics and null rules in sections 3.2–3.3. `Date` is a day-granularity `YYYY-MM-DD` string; `DateTime` is an RFC 3339 timestamp. Parse them as distinct domain types—do not treat a daily snapshot date as an instantaneous UTC time.

On-demand single-plugin field example:

```graphql
query Detail($fullName: ID!, $locale: String!) {
  plugin(fullName: $fullName) {
    fullName
    repositoryUrl
    description
    rating { score grade calculatedAt version }
    install { cmd source kind npmPublished releaseTag probedAt }
    i18n(locale: $locale) { locale description intro highlights updatedAt }
    snapshots(days: 30) { date stars contributors pushedAt }
    growth { windowDays stars contributors }
  }
}
```

### 5.6 Query-resource limits

| Limit | Current value | Effect |
| --- | --- | --- |
| POST body | 16 KiB | Larger bodies return HTTP 400 |
| Query text | 8 KiB | Larger queries return HTTP 400 |
| Selection depth | 8 | Deeper selections return a GraphQL error |
| Root fields | 8 | More root fields return a GraphQL error |
| Plugin-data root resolvers | 1 | At most one combined `plugin` / `plugins` resolver, including aliases |
| `plugins.first` | 50 | Continue with a cursor for later pages |
| `snapshots.days` | 90 | Request a smaller window or retain history client-side |

Selecting `i18n`, `snapshots`, or `growth` while reading the base snapshot adds at most two batched Turso reads. Database reads do not grow linearly by node count, but clients should still select only fields they need.

## 6. Errors, retries, and rate limits

### 6.1 REST error shape

```json
{
  "error": {
    "code": "rate_limited",
    "message": "too many requests",
    "retry_after": 12
  }
}
```

| HTTP | `error.code` | Typical cause | Client action |
| --- | --- | --- | --- |
| 400 | `bad_request` | `min_score` is not an integer in 0–100; invalid Admin body | Correct the request; do not blindly retry |
| 401 | `unauthorized` | Invalid or revoked API key | Remove the bad key or rotate to a valid key |
| 403 | `forbidden` | Auth endpoint origin is not allowed | Send cookie-bearing auth requests only from the configured web origin |
| 404 | `not_found` | Missing plugin, Admin key missing/revoked | Check the identifier; do not retry |
| 409 | `stale_data` | A multi-page REST listing crossed `data_version` | Restart synchronization from page one |
| 429 | `rate_limited` | A token bucket is exhausted | Read `Retry-After`; retry with jitter |
| 500 | `internal` | Turso detail read or encoding failure | Exponential backoff; do not cache |
| 503 | `internal` | Initial plugin cache not loaded, or Admin disabled | Retry public reads later; check Admin configuration |

### 6.2 GraphQL errors

GraphQL distinguishes HTTP transport errors from query-execution errors:

| Category | HTTP | Response |
| --- | --- | --- |
| Invalid JSON, non-object GET `variables`, empty query, oversized body/query | 400 | `{ "errors": [{ "message": "..." }] }` |
| Syntax, unknown field, invalid argument, mutation, depth/root/cursor limit, Turso resolver failure | 200 | `{ "errors": [{ "message": "..." }] }`, with no `data` |
| Success | 200 | `{ "data": { ... } }` |
| Cache not loaded | 503 | Shared REST `error` shape |
| Rate limit / API key | 401/429 | Shared REST `error` shape |

A GraphQL client must check both the HTTP status and top-level `errors`; HTTP 200 alone does not mean a query succeeded.

### 6.3 Default limits and scaling note

The current production design assumes **one Railway replica**. A valid API key defaults to 120/minute with a burst of 30 (an administrator can set a different `rate_per_min` for that key). Anonymous ordinary queries have 30/minute with a burst of 10; suggest is 60/minute with a burst of 20; GraphQL is 60/minute with a burst of 20.

All public requests also share a process-wide 6000/minute, 500-burst bucket. Each GraphQL request costs 10 tokens from that bucket, which allows about 10 sustained GraphQL RPS and a burst of 50 by default. OAuth/session traffic uses a separate 60/minute per-IP and 1800/minute global budget.

Token balances are not persisted to Turso. Scaling Railway above one replica multiplies effective capacity by the replica count; introduce Redis/Valkey or an edge WAF for shared rate limiting before scaling.

## 7. Integration guidance

### 7.1 Directory mirror

Prefer GraphQL `dataset` plus a cursor connection:

1. Run `query { dataset { dataVersion asOf } }`; stop if the version is unchanged.
2. Fetch the first `plugins(first: 50)` page and retain its `dataVersion`.
3. Continue using only the preceding page's `endCursor`.
4. On any `errors` response—especially an invalid cursor—discard this run and restart at step 1.
5. Select `i18n` and `snapshots` only when needed; otherwise mirror base fields first and fill details later.

REST can also mirror the directory, but every later page must include `data_version`. Do not compare `generated_at` to detect changes; compare the content version.

### 7.2 Browser search

Debounce browser input for 150–250 ms and request suggestions only after at least two characters:

```ts
const response = await fetch(
  `https://api.dshfind.com/v1/suggest?q=${encodeURIComponent(query)}`,
  { signal: AbortSignal.timeout(1500) },
);
if (!response.ok) throw new Error(`suggest failed: ${response.status}`);
const { items } = await response.json();
```

Never ship an Admin key or Vercel's `BACKEND_API_KEY` to a browser. The anonymous quota exists specifically for direct browser requests.

### 7.3 Conditional requests

```bash
etag=$(curl -sD - -o /dev/null 'https://api.dshfind.com/v1/plugins?per_page=1' \
  | awk 'tolower($1) == "etag:" {print $2}' | tr -d '\r')

curl -i 'https://api.dshfind.com/v1/plugins?per_page=1' \
  -H "If-None-Match: $etag"
```

When receiving `304`, reuse the previously verified local response body; a 304 has no replacement JSON body. Cache keys must include the complete URL (especially filters, pagination, GraphQL query, and variables); do not share ETags based only on `dataVersion` across different representations.

## 8. Version-evolution rules

- `fullName` is the external primary key. Use it for storage and deduplication; do not rely on a display name or split a GitHub URL string.
- Deprecated fields—currently GraphQL `Plugin.url`—exist only for migration compatibility. New implementations must use the documented replacement.
- New fields may appear. JSON consumers should ignore unknown fields; GraphQL clients should generate code against a versioned SDL.
- A nullable field becoming populated is ordinary data completion, not an error. Do not turn `null` into an empty string.
- dshfind scores, editorial flags, categories, and installation conclusions are service-derived/editorial data. They may change as rules and reviews evolve; retain their timestamps and version fields.
- Admin, audit, and OAuth endpoints are not part of the public data schema. Do not build an integration by probing undocumented paths.

## 9. Quick checks

```bash
# Base version
curl --fail --show-error --get https://api.dshfind.com/graphql \
  --data-urlencode 'query={ dataset { dataVersion asOf } }'

# REST listing
curl --fail --show-error 'https://api.dshfind.com/v1/plugins?category=memory&per_page=5'

# One plugin through GraphQL
curl --fail --show-error https://api.dshfind.com/graphql \
  -H 'Content-Type: application/json' \
  --data '{"query":"query($n: ID!){plugin(fullName:$n){fullName repositoryUrl install{cmd kind}}}","variables":{"n":"owner/repo"}}'

# Current SDL for code generation
curl --fail --show-error https://api.dshfind.com/graphql/schema
```

For implementation and deployment validation, see the [Vercel + Railway production deployment guide](./deployment-railway-vercel.md).
