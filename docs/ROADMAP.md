# Roadmap

Status of the backend v2 backlog (formerly `client/docs/BACKEND_V2_BACKLOG.md`)
after 1.0, then what's next. Items are ordered by priority within each horizon.

## Delivered in 1.0

| Item | Notes |
|---|---|
| BE-001 configuration & validation | All-problems-at-once boot validation |
| BE-002 authentication boundary | OIDC + PKCE, opaque sessions, CSRF |
| BE-003 PostgreSQL foundation | Forward-only migrations, advisory lock, users + cascades |
| BE-004 profile persistence | Single profile per user (profile metric v1) |
| BE-005 authenticated realtime bootstrap | Auth, CSRF, rate limit, typed provider errors |
| BE-007 distributed rate limiting | Realtime session creation only |
| BE-014 structured logging | JSON lines with request ids |
| BE-016 health endpoints | `/api/health/live`, `/api/health/ready` |
| BE-017 / BE-019 API tests | Unit, HTTP (supertest), provider error mapping |
| BE-018 Postgres integration tests | Migrations, cascades, constraints (CI) |

## 1.1 (next)

- **Account self-service:** `DELETE /api/account` (cascade is ready), passkey list
  and removal in Security.
- **Dual-key credential decryption** so `CREDENTIAL_ENCRYPTION_KEY` rotates online
  (key id in the envelope's version byte).
- **BE-006 usage metering:** `assistant_sessions` table (start, end, status, model),
  written by the realtime route and a client "ended" beacon.
- **BE-015 metrics:** session creation latency p50/p95/p99, failure rate by code.
- **Rate limits** on `/api/auth/*` by IP and concurrent-session cap per user.
- **Ephemeral client secrets** for the Realtime session so the server, not the
  browser, owns session policy.

## 1.2+

- Multiple named profiles per user (profile metric stays the per-profile value).
- BE-008–010 tool registry with audited, server-executed, read-only first tool.
- BE-011–013 memory: session summaries the user approves, retrievable per turn.
- Reconnection strategy for dropped WebRTC sessions.
- Signed and notarised desktop builds; desktop passkey support audit.
- PWA / mobile shell; wake word.
