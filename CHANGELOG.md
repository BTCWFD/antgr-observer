# Changelog

All notable changes to **Antigravity Observer** are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-12

### Added
- **Advisory Board · Multi-Agent Council** — a full C-level/specialist council
  (CEO, BDM, Legal Senior, DevOps/SRE, Mobile, QA, Data) on top of the existing
  CTO and UX agents. Roles are data-driven via `BOARD_ROLES`; each deliberates
  every mission cycle with Local+Remote consensus.
- **Board Report export** — one-click Markdown report (metrics + findings grouped
  by role) downloaded via Blob+anchor; no new manifest permission.
- **Board Memory** — findings persist across sessions in `chrome.storage`
  (`boardHistory`, capped at 10), with a `MEM:` badge.
- **Board Memory · Session History** view — browse past sessions and re-export
  any of them.
- **Consensus Score** — heuristic cross-role agreement metric, updated live as
  findings arrive.
- **First-run onboarding banner** — guides token + privacy setup.
- **GENERATE STRONG TOKEN** button — `crypto.getRandomValues`-based token.
- **CI** — GitHub Actions workflow (`node --check` sweep + conditional bridge
  tests) and a `node:test` regression suite for the privacy gate.
- **`bridge/.env.example`** — committable, secret-free env template.

### Changed
- Responsive Advisory Board: collapses to a single column on narrow popups
  (`@media max-width: 380px`) with ≥44px touch targets (`@media pointer: coarse`).
- Privacy gate extracted to `bridge/lib/privacy.js` (single source of truth).
- `Bridge.sendAIRequest` forwards an explicit `includesCodebase` flag instead of
  relying on server-side content sniffing.

### Security
- **Removed the hardcoded default Bridge `AUTH_TOKEN`** (`antgr_secret_v1_99`);
  the client ships no usable default secret and warns when the token is empty or
  the legacy default. The Bridge warns (non-fatal) on the legacy token.
- **Privacy opt-in** (default off) before any source code may fail over to the
  remote (Gemini) brain; re-synced on every reconnect so the setting survives.
- **XSS hardening** — all LLM/AI output is rendered via `textContent`; the
  `data-id` sink and LLM-`id` override were closed.
- Helper scripts (`live-simulation.js`, `test-brain.js`, `verify-hybrid.js`) now
  source `AUTH_TOKEN` from `.env` instead of embedding the known token.

### Fixed
- Board resilience: panels no longer hang on "Awaiting review" when the Bridge is
  offline or drops mid-sync — a watchdog surfaces a clear fallback state.

[1.1.0]: https://github.com/BTCWFD/antgr-observer/releases/tag/v1.1.0
