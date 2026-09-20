# Eleanor Backend v2 Backlog

## Goal

Move Eleanor from a local-first frontend MVP to an authenticated,
server-backed assistant platform without changing the frontend's
core Realtime or profile abstractions.

## P0 — Platform foundation

### BE-001 — API configuration and validation

Introduce typed runtime configuration for:

- OpenAI credentials
- environment
- allowed web origins
- API port
- PostgreSQL connection
- Redis connection
- log level

Acceptance criteria:

- Application fails fast on invalid required configuration.
- Secrets never appear in browser bundles or logs.
- Development, staging, and production configuration are distinct.


### BE-002 — Authentication boundary

Add authenticated users and protect assistant APIs.

Acceptance criteria:

- Anonymous callers cannot create production Realtime sessions.
- Every server-side request has a trusted user identity.
- Identity comes from the server's authentication layer rather than
  browser-supplied user IDs.
- Local development retains a documented developer mode.


### BE-003 — PostgreSQL foundation

Introduce PostgreSQL with migrations.

Initial entities:

- users
- assistant_profiles
- assistant_sessions
- assistant_usage_events

Acceptance criteria:

- Schema changes are migration-controlled.
- Migrations execute automatically in CI validation.
- Production deploys do not rely on ORM schema auto-sync.


### BE-004 — Cloud profile persistence API

Implement:

GET    /api/profiles
POST   /api/profiles
PATCH  /api/profiles/:id
DELETE /api/profiles/:id
PUT    /api/profiles/:id/active

Acceptance criteria:

- Users can only access their own profiles.
- Profile payloads are schema validated.
- At least one profile must always remain.
- One profile can be marked active.
- updatedAt supports synchronization/conflict handling.
- Existing localStorage profiles can later be imported.


## P0 — Realtime security and reliability

### BE-005 — Authenticated Realtime session creation

Harden:

POST /api/realtime/session

Acceptance criteria:

- Requires authentication.
- Enforces per-user entitlement.
- Enforces request rate limits.
- Creates only approved models/session options.
- Client cannot override security-sensitive configuration.
- Provider errors are mapped to stable application errors.


### BE-006 — Realtime usage metering

Capture:

- session started
- session ended
- session duration
- connection failure
- model
- user
- profile
- provider request identifiers where appropriate

Acceptance criteria:

- Usage can be aggregated by user and day.
- Failed session creation is observable separately from successful
  sessions.
- Metering failures do not break the live voice path.


### BE-007 — Distributed rate limiting

Use Redis or an equivalent shared limiter.

Initial policies:

- session creation per minute
- concurrent sessions per user
- tool execution per minute
- daily usage entitlement

Acceptance criteria:

- Limits work across multiple API instances.
- 429 responses include stable machine-readable error codes.
- Limits are configurable by environment/tier.


## P1 — Tool architecture

### BE-008 — Tool registry

Introduce a trusted server-side tool abstraction.

Tool definition requires:

- name
- JSON schema
- authorization policy
- confirmation policy
- executor
- timeout
- audit classification

Acceptance criteria:

- Model-requested arguments are validated before execution.
- Unknown tools cannot execute.
- Tools cannot bypass application authorization.


### BE-009 — Tool execution audit trail

Store:

- requesting user
- session
- tool
- sanitized arguments
- decision
- execution result
- duration
- timestamp

Acceptance criteria:

- Sensitive values can be redacted.
- Failed and rejected calls remain auditable.
- Audit writes are not exposed to the model as authority.


### BE-010 — First read-only tool

Implement weather or another low-risk read-only integration.

Acceptance criteria:

- Full path works:
  model request → validation → execution → model result.
- Integration has timeout and failure handling.
- Integration is covered by contract tests.


## P1 — Memory

### BE-011 — Conversation/session metadata

Persist session metadata without requiring raw audio storage.

Store:

- user
- assistant profile
- start/end timestamps
- status
- optional user-approved textual summary

Acceptance criteria:

- Raw microphone audio is not persisted by default.
- Retention policy is explicit.


### BE-012 — User memory model

Create a memory system separate from chat history.

Memory examples:

- preferred name
- timezone
- stable preferences
- projects
- explicitly remembered facts

Acceptance criteria:

- Every memory belongs to one user.
- Memories have source and timestamps.
- Users can inspect/delete memory.
- Sensitive facts are not automatically promoted to durable memory.


### BE-013 — Memory retrieval

Provide relevant memories to the assistant based on the current turn.

Acceptance criteria:

- Retrieval has a bounded token budget.
- Irrelevant memories are excluded.
- Memory retrieval failure does not prevent normal conversation.


## P1 — Observability

### BE-014 — Structured logging

Every request/session log should support:

- requestId
- userId
- sessionId
- environment
- route/event
- duration
- status/error code

Acceptance criteria:

- No API keys.
- No raw audio.
- User utterances are not logged by default.


### BE-015 — Realtime metrics

Track:

- session_creation_ms
- webrtc_connection_success_rate
- session_duration
- session_creation_failure_rate
- tool_call_duration
- tool_failure_rate
- reconnect_count
- usage per user

Acceptance criteria:

- Dashboards expose p50/p95/p99 latency where meaningful.
- Alerts exist for provider/session creation failures.


### BE-016 — Health/readiness endpoints

Implement:

GET /health/live
GET /health/ready

Acceptance criteria:

- Liveness does not depend on external providers.
- Readiness validates critical application dependencies.
- Container/platform health checks can use the endpoints.


## P1 — Backend automation

### BE-017 — API unit tests

Cover:

- configuration
- profile authorization
- validation
- error mapping
- rate-limit policy
- tool authorization


### BE-018 — PostgreSQL integration tests

Run against an isolated real PostgreSQL instance.

Cover:

- migrations
- profile CRUD
- ownership isolation
- concurrent updates
- transaction rollback


### BE-019 — OpenAI contract boundary tests

Mock the external Realtime provider at the HTTP boundary.

Cover:

- successful SDP exchange
- provider 4xx
- provider 429
- provider 5xx
- malformed provider response
- timeout


### BE-020 — Production smoke test

After deployment verify:

- liveness
- readiness
- authentication
- profile API
- one controlled Realtime session creation

Do not make full live AI tests mandatory for every pull request.


## P2 — Production hardening

### BE-021 — Profile synchronization/conflict resolution

Replace local-only persistence with cloud sync while retaining
offline-friendly client behavior.

Use updatedAt/version or an explicit optimistic concurrency token.


### BE-022 — Idempotency

Require idempotency keys for externally consequential tool actions.


### BE-023 — Background jobs

Introduce a queue/workflow system only for operations that do not
belong in the conversational critical path:

- memory extraction
- analytics aggregation
- notifications
- long-running tool operations
- document processing


### BE-024 — Data retention and deletion

Define:

- profile retention
- session metadata retention
- memory retention
- audit retention
- account deletion workflow


## Recommended implementation order

1. BE-001 configuration
2. BE-002 authentication
3. BE-003 PostgreSQL
4. BE-004 profile API
5. BE-005 Realtime hardening
6. BE-006 usage metering
7. BE-007 distributed rate limiting
8. BE-014 structured logging
9. BE-015 metrics
10. BE-016 health/readiness
11. BE-008 tool registry
12. BE-009 tool audit
13. BE-010 first tool
14. BE-011 session metadata
15. BE-012 memory model
16. BE-013 memory retrieval
17. Remaining production-hardening work


===============================================================================
INSTALL + VERIFY + TAG MVP V1
===============================================================================

cd Eleanor

npm install

npx playwright install

npm run build

npm run test:unit -w @Eleanor/web

npm run test:coverage -w @Eleanor/web

npm run test:e2e -w @Eleanor/web


# Only tag once all of the commands above are green.

git add .

git commit -m "release: complete Eleanor MVP v1"

git tag -a v1.0.0 \
  -m "Eleanor MVP v1: realtime voice, profiles, persistence, and frontend tests"

git push origin HEAD

git push origin v1.0.0