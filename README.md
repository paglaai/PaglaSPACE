# PaglaSPACE

> The official web home, operations control plane, and distribution portal for the entire PaglaAI ecosystem.

---

## What is PaglaSPACE?

PaglaSPACE is the primary web portal and distribution platform for the **PaglaAI** ecosystem, hosted at [paglaai.space](https://www.paglaai.space).

It is not simply a static landing page.

It is the operational anchor and live showcase for all PaglaAI products, combining an editorial DesignDNA-compliant web surface with automated operational pipelines, scheduled telemetry, health auditing, and edge functions running on Cloudflare Pages and Workers.

Everything the world sees of PaglaAI originates here.

---

## Purpose

The purpose of this repository is to represent and maintain the public web surface of PaglaAI with zero runtime compromises.

This repository governs:

- Public Ecosystem Web Presence (`https://www.paglaai.space`)
- Product Showcase & Distribution (`/products/`)
- BrandKit and Identity Showcase (`/brand/`)
- Unified Documentation Portal (`/docs/`)
- API Reference & Interactive Explorer (`/api/`)
- Pagla Sans Type Specimen (`/pagla-sans/`)
- PaglaOps Automated Operations Pipeline (`ops/jobs.json`)
- Continuous Health Auditing & Search Engine Ping (`worker/index.js`)
- Edge Operations API (`functions/api/`)
- Zero-Dependency Verification Suite (`tests/`)

---

## Ecosystem

PaglaSPACE serves as the web distribution anchor for all PaglaAI projects:

- **PaglaSPACE** — This portal and operations plane.
- **PaglaDESIGN** — The canonical design authority whose tokens and styles are implemented here.
- **PaglaMLX** — Apple Silicon local inference orchestrator showcased at `/products/paglamlx.html`.
- **PaglaROUTER** — Edge gateway routing requests across providers, referenced in `/api/reference.html`.
- **PaglaSHELL** — The CLI multi-agent core environment.
- **PaglaEXTENSION** — Chrome extension for private AI chat export and knowledge capture.
- **B3K4R** — Career Intelligence Agent (CIA) assisted job hunting application.
- **PaglaGPT** — Ecosystem AI Architect and reasoning system.
- **PaglaDOC** — Fern-powered multi-surface documentation platform.

---

## Design Philosophy

PaglaSPACE strictly adheres to the **DesignDNA** doctrine defined by `PaglaDESIGN`:

- **Editorial over decorative:** Generous whitespace, zero unnecessary ornamentation.
- **Monochrome foundation:** `#0A0A0B` (dark) and `#FFFFFF` (light) with hairline borders.
- **Strict accent discipline:** Accent `#6B7EFF` is reserved exclusively for semantic meaning, focus rings, and link interactions—never as a container fill.
- **Pagla Sans typography:** Modular, ratio-based type scale powered by the custom Pagla Sans font family.
- **Performance by default:** Zero frontend runtime frameworks. Pure semantic HTML, modern CSS tokens, and lightweight vanilla JavaScript.
- **Fail-closed security:** Secure edge functions with constant-time token verification.

---

## Repository Structure

```
PaglaSPACE/

README.md                  — repository purpose, ecosystem role, and operations guide
LICENSE                    — MIT license
_headers                   — Cloudflare Pages security and caching headers
robots.txt                 — search engine crawling and sitemap declaration
llms.txt                   — AI agent and crawler indexing reference
sitemap.xml                — canonical clean-URL sitemap
sitemap.html               — human-facing sitemap page
404.html                   — custom branded 404 error page
index.html                 — ecosystem homepage

products/                  — product showcase pages
  index.html               — full ecosystem products index
  paglamlx.html            — PaglaMLX product overview and downloads

docs/                      — documentation hub
  index.html               — getting started and ecosystem guides

brand/                     — BrandKit portal
  index.html               — brand identity, marks, color systems, and downloads

blog/                      — engineering, architectural, and design updates
  index.html               — blog index with interactive chip filtering
  *.html                   — individual articles and technical releases

about/                     — organizational background
  index.html               — mission, principles, timeline, and contacts

api/                       — API documentation
  reference.html           — OpenAI/Claude compatible gateway reference

pagla-sans/                — typography specimen
  specimen.html            — interactive Pagla Sans type tester

assets/                    — shared static assets
  brand/                   — Pagla face wordmarks and favicons
  css/                     — DesignDNA stylesheets (tokens, base, utilities, site)
  js/                      — lightweight vanilla JS (theme, search dialog, tabs)
  fonts/                   — Pagla Sans WOFF2 web fonts

functions/                 — Cloudflare Pages Functions
  _middleware.js           — edge security headers and routing
  _utils.mjs               — fail-closed authentication and GitHub Actions dispatcher
  api/health.js            — live edge health check
  api/jobs.js              — job registry status endpoint
  api/jobs/[name]/run.js   — secure on-demand job runner

worker/                    — Cloudflare Worker (PaglaOps)
  index.js                 — cron-driven health monitoring and search engine pings
  wrangler.toml            — worker deployment configuration

ops/                       — PaglaOps automation engine
  jobs.json                — canonical job registry and schedules
  run-job.mjs              — job executor CLI
  scripts/                 — link auditors, sitemap generators, health checkers

tests/                     — zero-dependency Node.js test suite
  site.test.mjs            — HTML validation, link integrity, and asset checks
  config.test.mjs          — wrangler, ops, and worker validation
  lib/html.mjs             — test utilities

.github/workflows/         — automated CI/CD pipelines
  ci.yml                   — PR and push verification
  deploy.yml               — Cloudflare Pages + Worker production deployment
  ops.yml                  — on-demand ops job dispatch
  nightly.yml              — automated nightly health and link integrity audits
  scheduled.yml            — scheduled cron job runner
  release.yml              — automated GitHub Release publisher
```

---

## Workflow

Every release and content addition follows the standard PaglaAI lifecycle:

```
Vision
    ↓
Research
    ↓
Documentation
    ↓
Design
    ↓
Review
    ↓
Prototype
    ↓
Implementation
```

Implementation is verified locally before any code reaches production.

---

## Quickstart

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Installation & Verification

```bash
# Clone the repository
git clone https://github.com/paglaai/PaglaSPACE.git
cd PaglaSPACE

# Install dependencies (test and ops tooling)
npm install

# Run the complete test suite (84 automated checks)
npm test

# Regenerate sitemap if pages are added or modified
npm run sitemap

# List all registered ops jobs
npm run jobs:list

# Run an ops job locally
npm run jobs:run nightly-audit
```

---

## Governance & License

PaglaSPACE is developed and maintained by **AYNAGHOR** (The House of Mirror) for the PaglaAI ecosystem.

Released under the **MIT License**.
