<div align="center">

# dshfind

**The learning & sharing community for DeepSeek Harness (DSH)**

Learn the principles · Discover plugins · Share best practices

🌐 **[dshfind.com](https://dshfind.com)**

English | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

</div>

---

## What is dshfind?

dshfind is a community site built around DeepSeek Harness (DSH):

- **📖 Learn DSH principles** — structured lessons from the basics up to a chapter-by-chapter deep dive of the Cordis paper: monads, coeffects, revertible effects, effect composition, spatiotemporal composability, and more.
- **🧩 Plugin marketplace** — a live index of DSH plugins, automatically aggregated from the GitHub topic [`dsh-plugin`](https://github.com/topics/dsh-plugin).
- **🏆 Best practices** — plugin development guides, a glossary, and community rankings of authors and projects.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [next-intl](https://next-intl.dev) for site i18n (English & Chinese UI)
- MDX for lesson content ([`src/content/lessons`](./src/content/lessons))
- Tailwind CSS · deployed on Vercel

## Documentation

- [Vercel + Railway production deployment](./docs/deployment-railway-vercel.md)
- [Public API and query guide (English)](./docs/api-query.en.md)
- [公开 API 与查询指南（简体中文）](./docs/api-query.md)

## Getting started

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

### Regenerating plugin & ranking data

Plugin and ranking data are generated from the GitHub topic `dsh-plugin` (requires the [GitHub CLI](https://cli.github.com)):

```bash
pnpm gen:data
```

## Submit your plugin

Add the `dsh-plugin` topic to your **public** GitHub repository — it will show up in the marketplace on the next data refresh.

## Contributing

Issues and PRs are welcome:

- Lessons live in [`src/content/lessons`](./src/content/lessons) as MDX.
- UI strings live in [`messages/`](./messages).

## CI and production recovery

`dev` and `main` run GitHub Actions checks for TypeScript, ESLint, Node tests,
Next production build, Go race tests, vet, a static Go build, and the root-context
Railway Docker build. Configure `main` branch protection to require **CI /
Frontend checks** and **CI / Go API and Docker checks** before merging.

Production keeps Vercel and Railway's Git integrations on `main`. The
**Production deployment gate** observes those automatic deployments, records the
previous healthy Vercel/Railway releases, verifies `dshfind.com` and the public
API, then rolls both applications back if a verification, deployment, or smoke
check fails. Vercel returns to its recorded deployment; when Go source changed,
Railway uses its recorded healthy deployment ID as the exact rollback target and
the Gate requires Railway to report it as `canRollback: true` before a backend
release or recovery changes either platform. Vercel recovery promotes the
recorded deployment rather than using Instant Rollback, so later `main` pushes
keep their normal automatic production-domain assignment.
The API's public `/healthz` ties that deployment ID to the Git SHA actually
serving traffic, so a queued or already-fast deployment cannot be mistaken for
the rollback anchor. It deliberately does not roll back shared Turso data, so
database changes must be backwards compatible with the previous application
version.

Before enabling the gate, create the GitHub `production` Environment with:

| Kind | Names |
| --- | --- |
| Secrets | `VERCEL_TOKEN`, `RAILWAY_TOKEN` |
| Variables | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_SERVICE_ID`, `PROD_WEB_URL=https://dshfind.com`, `PROD_API_URL=https://api.dshfind.com` |

The Railway token must be a project token with access to the production API
service. After configuration, run the workflow manually with `mode=preflight`:
it only reads and prints the two **currently live** anchors. The complete Gate
starts automatically on each `main` push; `mode=release` is only for a
controlled retry while its predecessor can still be captured, and it refuses an
unsafe retroactive rollback anchor. Because the two platforms deploy
independently, this provides automatic recovery after a failure rather than a
strictly atomic cross-platform cutover.

The first production rollout containing this API must complete before the Gate
can be enabled: its `/healthz` must expose the Railway-provided `commit_sha`
and `deployment_id`. The Gate deliberately refuses to capture an anchor without
both values or where the control-plane deployment does not match live traffic;
run a `mode=preflight` manually after that rollout to verify the anchor.

## GitHub OAuth ownership

GitHub login is owned by the Go API, not by Vercel Route Handlers. Configure
the Railway service with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, a random
32+-character `AUTH_SECRET`, `WEB_URL=https://dshfind.com`,
`API_PUBLIC_URL=https://api.dshfind.com`, and
`AUTH_COOKIE_DOMAIN=dshfind.com`. Set the OAuth App callback URL to
`https://api.dshfind.com/auth/github/callback`.

Vercel receives `NEXT_PUBLIC_API_BASE_URL=https://api.dshfind.com`, the same
`AUTH_SECRET` (plus optional `AUTH_GATE=1`), and a server-only `BACKEND_API_KEY`.
Create the latter through the Go admin API with a production service quota
(recommend `rate_per_min=3600`) and store it only in Vercel, never with a
`NEXT_PUBLIC_` prefix. This key authorizes only the public read API; it keeps
Vercel's server-side search requests on a dedicated quota instead of its shared
egress IP's anonymous bucket. Remove GitHub OAuth client credentials from
Vercel. The shared HttpOnly session cookie lets Next verify the API-issued login
state without owning the OAuth flow.

## Friend links

- [DSH Desktop](https://dshdesktop.cn) — a modern desktop app for the DeepSeek Harness (DSH) plugin ecosystem ([GitHub](https://github.com/anywhere-labs/deepseek-harness-desktop))
- [MZYAI GEO (妙智云)](https://www.mzyai.com) — an open-source GEO platform that gets your site accurately cited and recommended in AI answers from DeepSeek, Kimi, Doubao, GLM, Hunyuan and more ([GitHub](https://github.com/045mzyai/dsh-geo))
