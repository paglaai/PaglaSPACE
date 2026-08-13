# PaglaOps — job orchestration for PaglaAI.space

PaglaOps is the system that keeps PaglaAI.space tested, deployed, and healthy.
It is a single registry of jobs (`ops/jobs.json`) driven by two runtimes:

1. **GitHub Actions** — scheduled, nightly, and on-demand jobs that need a
   real shell (link audits, sitemap regeneration, search pings).
2. **Cloudflare Worker** (`worker/`) — always-on, cheap cron-triggered jobs
   (health checks every 15 minutes) plus the public `/api/*` endpoints.

Every job is declared once in `ops/jobs.json`. The workflows, the Worker, and
the Pages Functions all read from that one file, so there is no drift between
"what runs" and "what is documented".

## Job categories

| Category      | Runs from        | Trigger(s)                                         |
| ------------- | ---------------- | -------------------------------------------------- |
| `on_demand`   | `ops.yml`        | `workflow_dispatch`, `POST /api/jobs/:name/run`    |
| `scheduled`   | `scheduled.yml`  | GitHub `schedule` crons (`0 3 * * *`, `0 6 * * *`) |
| `nightly`     | `nightly.yml`    | GitHub `schedule` cron (`30 2 * * *`)              |
| (worker cron) | Cloudflare Worker| Worker `[triggers]` crons (`*/15`, `0 3`, `0 6`)   |

## How it fits together

```
                        ┌─────────────────────────────────────────────┐
                        │                 ops/jobs.json               │
                        │   single source of truth for every job      │
                        └───────────────┬─────────────────────────────┘
                                        │
              ┌─────────────────────────┼──────────────────────────┐
              │                         │                          │
   ┌──────────▼───────────┐  ┌─────────▼──────────┐   ┌───────────▼─────────┐
   │ GitHub Actions       │  │ Cloudflare Worker  │   │ Pages Functions     │
   │ .github/workflows/   │  │ worker/index.js    │   │ functions/api/*     │
   │  ci / deploy /       │  │ scheduled():       │   │ /api/health         │
   │  ops / nightly /     │  │  - */15 health     │   │ /api/jobs           │
   │  scheduled / release │  │  - 0 3 dispatch    │   │ /api/jobs/:name/run │
   └──────────┬───────────┘  │  - 0 6 ping        │   └─────────────────────┘
              │              │ fetch(): /api/*    │
              │              └────────────────────┘
              │
   ┌──────────▼───────────┐
   │ ops/run-job.mjs      │  resolves a job name/category → spawns the
   │ ops/list-jobs.mjs    │  command declared in ops/jobs.json, logs to
   └──────────────────────┘  ops/logs/, exits non-zero on failure
```

- **On-demand**: open *Actions → Ops · On-demand → Run workflow*, enter a job
  name / category / `all`, or `POST` the Pages Functions endpoint
  `/api/jobs/:name/run` (optionally behind `JOBS_API_TOKEN`).
- **Scheduled / cron**: `scheduled.yml` and `nightly.yml` fire on their
  crons and run every job in that category via `ops/run-job.mjs`.
- **Nightly**: the deep link-and-asset audit runs at `30 2 * * *`.
- **Cloudflare cron**: the Worker health-check runs every 15 minutes and
  dispatches GitHub jobs when something is down; heavier work that needs to
  commit (sitemap regeneration) is delegated back to GitHub Actions.

## Running jobs

```sh
# List everything in the registry
node ops/list-jobs.mjs

# Run one job by name, by category, or everything
node ops/run-job.mjs nightly-audit
node ops/run-job.mjs scheduled
node ops/run-job.mjs all --verbose
```

Output and a `last-run.json` summary are written to `ops/logs/` (gitignored).

## Registry schema

```jsonc
{
  "version": "1.0",
  "repo": "paglaai/PaglaAI.space",
  "siteUrl": "https://www.paglaai.space",
  "jobs": [
    {
      "name": "nightly-audit",          // unique, kebab-case
      "description": "...",             // what it does
      "category": "nightly",            // on_demand | scheduled | nightly
      "schedule": "30 2 * * *",         // 5-field cron (required unless on_demand)
      "timeout": 600,                   // seconds
      "command": "node ops/scripts/link-audit.mjs", // "node …" or "bash …"
      "commit": false                   // optional: job may commit generated files
    }
  ]
}
```

Adding a job is a one-file change: add the entry, drop the script in
`ops/scripts/`, and the workflows/Worker pick it up automatically. The CI
`validate-workflows` job enforces that every declared cron is actually wired
into the matching GitHub workflow.

## Job scripts

| Script | Purpose |
| ------ | ------- |
| `scripts/link-audit.mjs` | Crawl the repo, verify every internal link/asset/fragment resolves. |
| `scripts/sitemap-gen.mjs` | Regenerate `sitemap.xml` with clean URLs (matches Cloudflare Pages output). |
| `scripts/health-check.sh` | Curl the live site from `sitemap.xml` and assert `200` (follows redirects). |
| `scripts/ping-search.sh` | Ping Google and Bing with the sitemap URL. |
| `scripts/verify-worker.sh` | Assert the Worker `/api/health` endpoint responds. |

## Required repository secrets / variables

Configure these in the repo (Settings → Secrets and variables):

| Name | Where | Purpose |
| ---- | ----- | ------- |
| `CLOUDFLARE_API_TOKEN` | Actions secret | Deploy Pages + Worker. Needs `Pages:Edit`, `Workers Scripts:Edit`, `Account:Read`. |
| `CLOUDFLARE_ACCOUNT_ID` | Actions secret | Account id (`bd99f086…` per `.wrangler/cache`). |
| `PAGLAAI_GITHUB_TOKEN` | Actions secret | Passed to the Worker so cron jobs can dispatch GitHub workflows. |
| `WORKER_URL` | Actions variable | The Worker's public URL, used by `verify-worker`. |
| `JOBS_API_TOKEN` (optional) | Pages + Worker | Bearer token guarding `POST /api/jobs/:name/run`. |

## CI / test pipeline

`ci.yml` runs `npm test` (78 checks) and `npm run check` (workflow + registry
wiring) on every push and pull request. Deploys only happen after the test
job passes (`deploy.yml`).