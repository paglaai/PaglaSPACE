# PaglaAI.space

The public home of PaglaAI — a local-first AI ecosystem. Static HTML/CSS/JS,
deployed to Cloudflare Pages, kept healthy by an automated ops pipeline.

## Repository layout

```
├── index.html, about/, api/, blog/, brand/, docs/, products/   # the site
├── assets/                    # shared css/js/brand
├── functions/                 # Cloudflare Pages Functions → /api/* (on the site domain)
├── worker/                    # Cloudflare Worker → cron jobs + jobs API
├── ops/                       # PaglaOps job registry, runner, and scripts
├── tests/                     # Node test suite (node:test, zero test deps)
├── scripts/                   # repo-level tooling (workflow validator)
└── .github/workflows/         # CI / deploy / ops / release
```

## Quick start

```sh
npm install
npm test            # run the full site + config test suite (78 checks)
npm run check       # validate GitHub Actions wiring against ops/jobs.json
npm run jobs:list   # list every registered job
npm run jobs:run nightly-audit
```

Requires Node.js ≥ 20.

## The ops pipeline

`ops/jobs.json` is the single source of truth. Jobs run on-demand
(`ops.yml`, `workflow_dispatch`), on a schedule (`scheduled.yml`,
`nightly.yml`), and on Cloudflare cron triggers (the `worker/`). See
[`ops/README.md`](ops/README.md) for the full system design.

## Deploying

Deploys happen automatically from `main` via `deploy.yml` (Pages + Worker)
after the test job passes. The Pages project is `paglaai` (subdomain
`pagla-ai-hub.pages.dev`) in the AYNAGHOR Cloudflare account; because its
production branch is `production`, `deploy.yml` deploys with
`--branch production`. Secrets are already configured:

- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (Actions)
- `PAGLAAI_GITHUB_TOKEN` (Actions, so the Worker can dispatch jobs)
- `WORKER_URL` (Actions variable: `https://kamla.aynaghor.workers.dev`)

## Releases

Push a `v*` tag and `release.yml` publishes a GitHub Release with generated
notes, after the test suite passes.

```
git tag v1.0.0 && git push origin v1.0.0
```