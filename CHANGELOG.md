# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-XX

First stable release. 1.0 is a breaking release relative to the v0.7 snapshot:
routes, database schema and deployment layout changed.

### Security
- Removed TLS private keys that had been committed under `client/cert/`; they must
  be considered compromised and purged from history (docs/SECURITY.md §4).
- Fail-fast configuration validation; https enforced in production.
- Forced IdP re-authentication path (`/api/auth/login?reauth=1`).
- Step-up window now honours `STEP_UP_TTL_SECONDS` consistently.
- Web app ships CSP, HSTS and Permissions-Policy headers.
- Electron shell: working sandboxed preload, audio-only permission, no file:// app.

### Added
- First-run onboarding: passkey enrolment and provider key dialogs gate Activate.
- Assistant profile is saved to the account (debounced) and restored on sign-in.
- `users` table with ownership foreign keys and cascading deletes.
- `/api/health/live` and `/api/health/ready`; structured JSON logs with request ids.
- `REALTIME_MODEL` and `LOG_LEVEL` settings.
- Test suites: API unit/HTTP/integration, client unit, mocked Playwright E2E; CI.
- Local stack with a mock OIDC provider (`npm run db:up`).
- Documentation: architecture, runbook, security, releasing, roadmap.

### Fixed
- Migration 001 referenced non-existent columns, so a database could never be
  created.
- API build emitted to `dist/src/**`, breaking `start` and `migrate:prod`; SQL files
  were not shipped.
- Post-logout redirect was empty.
- Invalid profile metric header returned 502 instead of 400.
- Speech-speed and humor values that could not be encoded crashed the settings page.
- Component styles (`eleanor-*` classes, `space-975`) were undefined.
- Duplicate/incorrect component selectors; dead placeholder components removed.
- Client unit tests ran under Karma while written for Vitest.

### Changed
- Canonical app route is `/assistant` (`/home` redirects).
- Local development uses `http://localhost:4200` (no TLS certificates).
- `docker-compose.yml` moved to the repository root.
- Provider errors map to stable codes (`PROVIDER_AUTH_FAILED`, …).

### Removed
- Multi-profile local storage (single account profile in 1.0).
- Unused dependencies (recharts, react-is, nodemon, karma, jasmine).
- `docs/SOURCE_APPENDIX.md` (stale v0.7 source snapshot).
