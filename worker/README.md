# Kamla — PaglaAI jobs Worker

A Cloudflare Worker that executes the always-on half of the PaglaOps pipeline.
It runs on Cloudflare cron triggers (no GitHub involvement needed for cheap,
frequent checks) and exposes the public jobs API.

## What it does

- **`*/15 * * * *`** — health-check the site (`/`, `/sitemap.xml`,
  `/robots.txt`, `/llms.txt`, `/sitemap`). On failure it dispatches the
  `health-check` job back to GitHub Actions for a deeper run.
- **`0 3 * * *`** — dispatch the `sitemap-generate` job to GitHub Actions
  (GitHub regenerates and commits `sitemap.xml`).
- **`0 6 * * *`** — ping Google and Bing with the sitemap URL directly from
  the Worker.

### HTTP API

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/` or `/api/health` | GET | Run the health check inline, return JSON. |
| `/api/jobs` | GET | List the job registry (from `ops/jobs.json`). |
| `/api/jobs/:name/run` | POST | Dispatch a GitHub Actions job. Auth via `JOBS_API_TOKEN` when set. |
| `/api/uptime` | GET | Colo / timestamp liveness. |

## Config

`wrangler.toml` declares the crons, plus two vars:

- `SITE_URL` — the site being monitored.
- `GITHUB_REPO` — repository that receives dispatched jobs.

Secrets (not in the repo):

- `GITHUB_TOKEN` — PAT / fine-grained token with `workflow` scope so the
  Worker can dispatch `ops.yml`. Set via the dashboard, or automatically by
  `deploy.yml` when `PAGLAAI_GITHUB_TOKEN` is set in the repo.
- `JOBS_API_TOKEN` — optional; if set, `POST /api/jobs/:name/run` requires
  `Authorization: Bearer <token>`.

## Local development

```sh
npm install
npm run dev            # wrangler dev --test-scheduled
# trigger the scheduled handler:
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
# exercise the HTTP API:
curl http://localhost:8787/api/jobs
```

## Deploy

```sh
npm run deploy         # wrangler deploy
```

In CI, `deploy.yml` runs the tests first, deploys Pages and Kamla, then
pushes the `GITHUB_TOKEN` secret when the repository secret is present.