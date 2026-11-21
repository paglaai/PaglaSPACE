<p align="center">
  <a href="https://github.com/paglaai/PaglaSPACE">
    <img src="https://raw.githubusercontent.com/paglaai/PaglaSPACE/main/brand/paglaspace-wordmark.svg" alt="PaglaSPACE Wordmark" width="460">
  </a>
</p>

<p align="center">
  <strong>The Sovereign Web Gateway, Edge-Routed Portal, and Product Showcase for the PaglaAI Ecosystem.</strong>
</p>

<p align="center">
  <a href="https://www.paglaai.space"><img src="https://img.shields.io/badge/Production-paglaai.space-6B7EFF?style=flat-square&logo=cloudflare" alt="Production Site"></a>
  <a href="https://github.com/paglaai/PaglaSPACE/actions/workflows/ci.yml"><img src="https://github.com/paglaai/PaglaSPACE/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
  <a href="https://github.com/paglaai/PaglaSPACE/releases"><img src="https://img.shields.io/badge/version-2.2.1-0A0A0B?style=flat-square" alt="Version 2.2.1"></a>
  <a href="https://github.com/paglaai/PaglaDESIGN"><img src="https://img.shields.io/badge/DesignDNA-Locked_(D--024)-0A0A0B?style=flat-square" alt="DesignDNA Locked"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-0A0A0B?style=flat-square" alt="License MIT"></a>
</p>

---

## Overview

**PaglaSPACE** is the public gateway, canonical web presence, and interactive product directory for the PaglaAI sovereign ecosystem. Deployed on Cloudflare's global edge network, PaglaSPACE provides an ultra-low latency, fail-closed interface that showcases the entire suite of PaglaAI runtimes, models, and development authorities.

Every pixel, type token, and interaction in PaglaSPACE strictly implements the **DesignDNA** codified in [PaglaDESIGN](https://github.com/paglaai/PaglaDESIGN).

```
                 ┌────────────────────────────────────────┐
                 │       Cloudflare Edge Network          │
                 │   DNS • TLS 1.3 • HSTS • CSP L2        │
                 └───────────────────┬────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│     Cloudflare Functions     │              │    Fail-Closed Redirection   │
│  _middleware.js • Security   │              │   /product  ──►  /products/  │
└──────────────┬───────────────┘              └──────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                             PaglaSPACE Surface                             │
│     Home (/) • Products (/products/) • Product Details • About & Legal     │
└────────────────────────────────────────────────────────────────────────────┘
```

## Core Capabilities

- **Showcases All 9 Ecosystem Applications**: Centralizes access to PaglaMLX, PaglaGPT, PaglaROUTER, PaglaDESIGN, PaglaDOC, PaglaEXTENSION, B3K4R, and PaglaSHELL.
- **Fail-Closed Edge Routing**: Automatically intercepts legacy singular routes (`/product`) with clean HTTP 301 redirects to canonical directory paths.
- **Strict DesignDNA Compliance**: Pure Obsidian base (`#0A0A0B`), high-contrast typography (`#FFFFFF`), semantic cobalt accents (`#6B7EFF`), and native Pagla Sans font stack.
- **Zero-Dependency Core**: Lightweight static architecture with 100% test coverage across link integrity, asset presence, and typography rules.

## Quick Start

Run the local development server and execute the complete verification suite:

```bash
# Install dependencies
npm install

# Run the full test suite (13 suites, 167 assertions)
npm test

# Launch local development server
npm run dev
```

## Architecture & Tech Stack

| Layer | Technology | Specification |
| :--- | :--- | :--- |
| **Hosting & CDN** | Cloudflare Pages | Global edge delivery, zero origin cold-starts |
| **Edge Functions** | Cloudflare Workers | `functions/_middleware.js` for route sanitation |
| **Design System** | PaglaDESIGN | SSOT tokens, Cascade Layers, responsive wordmarks |
| **Testing** | Node.js Test Runner | Automated link, meta, asset, and redirect verification |

## DesignDNA & Ecosystem Authority

PaglaSPACE inherits its visual architecture directly from [PaglaDESIGN](https://github.com/paglaai/PaglaDESIGN):
- **Primary Background**: Obsidian `#0A0A0B`
- **Surface Elevation**: Dark Glass `rgba(255, 255, 255, 0.03)`
- **Primary Typography**: Pagla Sans Light (300) / Regular (400)
- **Accent Brand**: Electric Blue `#6B7EFF`

## Security & Fail-Closed Policy

PaglaSPACE operates under a strict fail-closed security model:
1. **Content Security Policy (CSP)**: Blocks all unauthorized script execution, inline injections, and untrusted cross-origin assets.
2. **Strict Transport Security (HSTS)**: Hardened with `max-age=63072000; includeSubDomains; preload`.
3. **No External Tracking**: Zero third-party telemetry, ads, or fingerprinting scripts.

## Ecosystem Directory

| Repository | Role | Surface Link |
| :--- | :--- | :--- |
| **[PaglaSPACE](https://github.com/paglaai/PaglaSPACE)** | Sovereign Web Gateway & Showcase | [www.paglaai.space](https://www.paglaai.space) |
| **[PaglaDESIGN](https://github.com/paglaai/PaglaDESIGN)** | Canonical Design Authority & FastMCP | [paglaai.github.io/pagladesign](https://paglaai.github.io/pagladesign) |
| **[PaglaMLX](https://github.com/paglaai/PaglaMLX)** | Apple Silicon Local MLX Inference | [paglaai.space/products/paglamlx.html](https://www.paglaai.space/products/paglamlx.html) |
| **[PaglaGPT](https://github.com/paglaai/PaglaGPT)** | Sovereign AI Architect & Reasoner | [paglaai.space/products/paglagpt.html](https://www.paglaai.space/products/paglagpt.html) |
| **[PaglaROUTER](https://github.com/paglaai/PaglaROUTER)** | Fail-Closed LLM Load Balancer & Proxy | [paglaai.space/products/](https://www.paglaai.space/products/) |
| **[PaglaDOC](https://github.com/paglaai/PaglaDOC)** | Fern Documentation & OpenAPI Engine | [paglaai.docs.buildwithfern.com](https://paglaai.docs.buildwithfern.com) |
| **[PaglaEXTENSION](https://github.com/paglaai/PaglaEXTENSION)** | Ambient Browser Companion & Sidecar | [paglaai.space/products/](https://www.paglaai.space/products/) |
| **[B3K4R](https://github.com/paglaai/B3K4R)** | Autonomous Agent & Workflow Daemon | [paglaai.space/products/](https://www.paglaai.space/products/) |


## Communications & Inquiries

PaglaAI enforces strictly segmented, dedicated communication channels for operational integrity and privacy:

| Channel | Dedicated Address | Scope & Handling |
| :--- | :--- | :--- |
| **Technical & Product** | `info@paglaai.space` | General developer inquiries, runtime integration, and feedback. |
| **Legal & Compliance** | `legal@paglaai.space` | Licensing, terms of service, IP governance, and compliance. |
| **Security & Disclosure** | `security@paglaai.space` | Vulnerability disclosures, cryptographic review, and audit findings. |
| **Systems & Operations** | `ops@paglaai.space` | Edge infrastructure, routing availability, and deployment health. |
| **Parent Entity (AYNAGHOR)** | `PaglaAI@aynaghor.space` | Organizational leadership, ecosystem charter, and core directives. |
| **Executive Office** | `SecondSON@aynaghor.space` | Strategic architecture, sovereign identity, and high-altitude review. |


## License

PaglaSPACE is open-source software licensed under the **[MIT License](./LICENSE)**.

---

<p align="center">
  <sub>© 2026 AYNAGHOR. PaglaSPACE is part of the PaglaAI ecosystem. Every surface inherits from here.</sub>
</p>
