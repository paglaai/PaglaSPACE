# AGENTS.md — PaglaAI.space

Static site + ops pipeline. Repo root **is** the Pages build output (`pages_build_output_dir = "."` in `wrangler.toml`). No build step, no framework. Node ≥ 20.

## Verify (run both)

```sh
npm install
npm test            # node --test tests/*.test.mjs — site + config suite
npm run check       # validate-workflows: registry ↔ workflow wiring
```

Single file / single test:

```sh
node --test tests/site.test.mjs
node --test --test-name-pattern="sitemap" tests/site.test.mjs
```

Worker only: `npm --prefix worker run check` (`node --check index.js`).

## Structure

- `index.html, about/, api/, blog/, brand/, docs/, products/` — the site. `assets/` shared css/js/brand.
- `functions/api/` — Pages Functions on the site domain (`/api/health`, `/api/jobs`, `/api/jobs/[name]/run`).
- `worker/` — separate `ops` Worker (own `package.json`/`wrangler.toml`): `fetch` + `scheduled` handlers, crons `*/15, 0 3, 0 6`. Deploy: `npm --prefix worker run deploy`.
- `ops/jobs.json` — **single source of truth** for all jobs. Workflows, Worker, and Functions read from it.
- `ops/scripts/`, `ops/run-job.mjs`, `ops/list-jobs.mjs` — job implementations and runner (logs to gitignored `ops/logs/`).
- `tests/lib/html.mjs` + `ops/lib/urls.mjs` — shared link/crawl and `cleanUrl` helpers. Tests and `sitemap-gen` both use them.

## Gotchas agents miss

- **Every new page must**: include DOCTYPE, `<html lang="en">`, charset, viewport, non-empty `<title>` + meta description, closing `</html>`; be linked from `sitemap.html` (all pages except `404.html`); be in `sitemap.xml` via `npm run sitemap` (never hand-edit URLs — `cleanUrl`: `index.html`→`/`, `dir/index.html`→`/dir/`, `x.html`→`/x`). Tests enforce all of this.
- **Internal refs must resolve**: tests crawl `a/link/img/script` hrefs + `#fragments`. No broken relative links, missing assets, or dangling anchors. Required assets: `assets/css/{tokens,base,utilities,site}.css`, `assets/js/main.js`, both `pagla-face` brand PNGs.
- **No `TODO|FIXME|lorem ipsum|placeholder text`** in shipped HTML/CSS/JS — test fails.
- **`robots.txt` must point at `https://www.paglaai.space/sitemap.xml`**; `llms.txt` must keep `site_url`, `ai_training: yes`, `ai_use: reference`.
- **Adding a job = registry entry + script, nothing else**: kebab-case `name`, `category` (`on_demand|scheduled|nightly`), `command` starting with `node ` or `bash ` pointing at a real file in `ops/scripts/`, integer `timeout`, 5-field `schedule` (required unless `on_demand`). `npm run check` enforces crons are wired into `nightly.yml`/`scheduled.yml` and `ops.yml` exposes the `job` dispatch input.
- **Deploy source of truth is `.github/workflows/deploy.yml`** (push to `main` → test → Pages + Worker). It currently deploys Pages with `--branch main`; ignore stale docs claiming `--branch production`.
- Run jobs locally with `node ops/run-job.mjs <name|category|all> [--verbose]`; list with `node ops/list-jobs.mjs`. `health-check`/`ping-search` hit the live site — avoid in bulk verification.
