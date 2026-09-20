# Eleanor v0.7

Realtime voice-first AI assistant with an Angular/React frontend and a thin Node BFF.

Security architecture:

- OpenID Connect Authorization Code + PKCE for account identity
- Redis-backed opaque HttpOnly session cookies
- synchronizer CSRF tokens
- WebAuthn/passkey user verification for sensitive step-up
- AES-256-GCM encryption for user-supplied provider API keys
- PostgreSQL for profiles, provider credentials, and passkeys
- Redis for sessions and distributed rate limiting
- OpenAI Realtime WebRTC bootstrap from the BFF

The browser never persists OAuth tokens or stored provider API keys.

## Run

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run migrate -w @eleanor/api
npm run dev

Test

npm test
npx playwright install chromium
npm run test:e2e
npm run benchmark

See RUNBOOK.md and BENCHMARK.md.


## `RUNBOOK.md`

```md
# Eleanor v0.7 runbook

## Identity provider

Create a confidential OIDC web application using Authorization Code + PKCE.

Scopes:

```text
openid profile email

Callback:

https://YOUR_APP_DOMAIN/api/auth/callback

Post logout:

https://YOUR_APP_DOMAIN/

Passkeys

Use:

PUBLIC_ORIGIN=https://YOUR_APP_DOMAIN
WEBAUTHN_RP_ID=YOUR_APP_DOMAIN
WEBAUTHN_RP_NAME=Eleanor

WEBAUTHN_RP_ID is a domain, not a URL.

The first passkey may be enrolled only within a fresh OIDC session. Additional passkeys
require an existing recent passkey step-up. Passkey ceremonies require user verification.

Provider credential encryption

Generate:

openssl rand -base64 32

Set the output as CREDENTIAL_ENCRYPTION_KEY on Railway only.

Railway

Railway now prefers Infrastructure as Code. For a new project:

railway login
railway init
railway config init

Provision one API service plus PostgreSQL and Redis.

API build:

npm ci && npm run build -w @eleanor/api

Pre-deploy:

npm run migrate:prod -w @eleanor/api

Start:

npm run start -w @eleanor/api

Health path:

/api/health

Variables:

NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
PUBLIC_ORIGIN=https://YOUR_APP_DOMAIN
OIDC_ISSUER=https://YOUR_IDP/
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
WEBAUTHN_RP_ID=YOUR_APP_DOMAIN
WEBAUTHN_RP_NAME=Eleanor
CREDENTIAL_ENCRYPTION_KEY=...
SESSION_TTL_SECONDS=28800
STEP_UP_TTL_SECONDS=300
PASSKEY_ENROLLMENT_MAX_OIDC_AGE_SECONDS=600
REALTIME_SESSION_RATE_LIMIT_PER_MINUTE=20

Vercel

Deploy the Angular frontend and rewrite /api/* to Railway. Keeping /api same-origin
allows the production __Host-eleanor-session cookie to remain first-party.

First sign-in

/assistant redirects to /login.

OIDC Authorization Code + PKCE completes.

Eleanor auto-opens passkey enrollment when no passkey exists.

Registration requires authenticator user verification.

Successful registration establishes a short step-up window.

Eleanor auto-opens provider setup.

The provider key is submitted once and encrypted server-side.

Activation becomes available.

Sensitive credential operations

Viewing credential metadata, replacing the key, or deleting it requires a passkey
verification within STEP_UP_TTL_SECONDS.

The raw stored API key is never returned to the browser.

Recovery

OIDC remains the recoverable account identity. A lost passkey does not replace the
identity provider's account recovery process.


## `apps/api/.env.example`

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eleanor
REDIS_URL=redis://localhost:6379
PUBLIC_ORIGIN=http://localhost:4200
OIDC_ISSUER=https://YOUR-IDP.example.com/
OIDC_CLIENT_ID=eleanor
OIDC_CLIENT_SECRET=replace-me
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Eleanor
CREDENTIAL_ENCRYPTION_KEY=REPLACE_WITH_32_BYTE_BASE64_VALUE
SESSION_TTL_SECONDS=28800
STEP_UP_TTL_SECONDS=300
PASSKEY_ENROLLMENT_MAX_OIDC_AGE_SECONDS=600
REALTIME_SESSION_RATE_LIMIT_PER_MINUTE=20