# Eleanor runbook

Procedures for running Eleanor locally, deploying it, and operating it. Each
procedure lists **preconditions**, **steps**, and **verification**. Commands are
run from the repository root unless stated.

Contents

1. [Environments](#1-environments)
2. [Local development](#2-local-development)
3. [Identity provider setup](#3-identity-provider-setup)
4. [First production deployment](#4-first-production-deployment)
5. [Routine deploy](#5-routine-deploy)
6. [Rollback](#6-rollback)
7. [Database migrations](#7-database-migrations)
8. [Rotating secrets](#8-rotating-secrets)
9. [Incident playbooks](#9-incident-playbooks)
10. [Configuration reference](#10-configuration-reference)

---

## 1. Environments

| | Local | Staging | Production |
|---|---|---|---|
| App origin | `http://localhost:4200` | `https://staging.<domain>` | `https://<domain>` |
| Web host | `ng serve` (proxies `/api` → :3000) | Vercel preview/branch | Vercel production |
| API host | `npm run dev -w @eleanor/api` | Railway `staging` env | Railway `production` env |
| Postgres / Redis | docker compose | Railway plugins | Railway plugins |
| IdP | mock-oauth2-server (compose) | real IdP, staging client | real IdP, prod client |

Each environment has its **own** OIDC client, `CREDENTIAL_ENCRYPTION_KEY`, database
and Redis. Never share encryption keys between environments.

## 2. Local development

**Preconditions:** Node 22.12+ (`nvm use`), Docker running, ports 3000, 4200,
5432, 6379, 8080 free.

1. Install and configure:
   ```bash
   npm install
   cp api/.env.example api/.env
   sed -i.bak "s|^CREDENTIAL_ENCRYPTION_KEY=.*|CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -base64 32)|" api/.env && rm api/.env.bak
   ```
2. Start dependencies and migrate:
   ```bash
   npm run db:up
   npm run migrate        # expect: applied 001…004 on first run, skip … afterwards
   ```
3. Run: `npm run dev`.

**Verify**

```bash
curl -s localhost:3000/api/health/ready   # {"status":"ok","database":"ok","redis":"ok"}
```

Then in a browser: <http://localhost:4200> → *Continue securely* → enter any
username on the mock IdP → create a passkey → paste an OpenAI key → *Activate*.

**Troubleshooting**

| Symptom | Cause / fix |
|---|---|
| API exits with `Invalid configuration:` | Read the listed problems; usually the placeholder encryption key. |
| API logs `oidc.discovery_retry` | Mock IdP not up yet: `docker compose ps oidc`. |
| Passkey fails with origin/RP mismatch | `PUBLIC_ORIGIN` must be exactly `http://localhost:4200`; open the app via `localhost`, not `127.0.0.1`. |
| "Sign in again" when creating the first passkey | Expected after 10 min; click it. |
| `Migration … failed` | `npm run db:reset && npm run migrate` (local data is disposable). |

## 3. Identity provider setup

Any standards-compliant OIDC provider works (Auth0, Okta, Entra ID, Keycloak,
Google). Create a **confidential web application** per environment:

| Setting | Value |
|---|---|
| Grant | Authorization Code with PKCE (S256) |
| Scopes | `openid profile email` |
| Redirect URI | `https://<domain>/api/auth/callback` |
| Post-logout redirect URI | `https://<domain>` |
| Token endpoint auth | client secret (basic or post) |
| Must honour | `prompt=login` and `max_age` (used for re-authentication) |

Record the issuer URL, client id and secret for section 4.

> `users.id` is the IdP's `sub`. Changing IdP (or tenant) changes every user's
> identity; plan a mapping migration before switching.

## 4. First production deployment

**Preconditions:** domain in DNS you control; Vercel and Railway accounts; IdP
client from section 3; PR-01 history purge completed (see SECURITY.md §4).

### 4.1 Railway (API, Postgres, Redis)

1. Create a project with a **PostgreSQL** and a **Redis** service.
2. Add a service from the GitHub repo:
   - Root directory: `/` (npm workspaces need the root lockfile)
   - Build: `npm ci && npm run build -w @eleanor/api`
   - Pre-deploy: `npm run migrate:prod -w @eleanor/api`
   - Start: `npm run start -w @eleanor/api`
   - Health check path: `/api/health/ready`
3. Variables (Railway → service → Variables):
   ```env
   NODE_ENV=production
   LOG_LEVEL=info
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   PUBLIC_ORIGIN=https://<domain>
   OIDC_ISSUER=https://<idp-issuer>/
   OIDC_CLIENT_ID=<id>
   OIDC_CLIENT_SECRET=<secret>
   WEBAUTHN_RP_ID=<domain>
   WEBAUTHN_RP_NAME=Eleanor
   CREDENTIAL_ENCRYPTION_KEY=<openssl rand -base64 32>
   REALTIME_MODEL=gpt-realtime-2.1
   ```
   Store a copy of `CREDENTIAL_ENCRYPTION_KEY` in your password manager. **If it is
   lost, every stored provider key is unrecoverable** (users must re-enter them).
4. Deploy. Note the generated Railway domain.

**Verify:** `curl https://<railway-domain>/api/health/ready` → 200 with all `ok`.
The deploy log shows `applied 001…004` then `server.listening`.

### 4.2 Vercel (web)

1. Import the repo; **Root Directory** `client`; framework preset *Angular*.
2. Edit `client/vercel.json`: replace `REPLACE-WITH-RAILWAY-API-DOMAIN` with the
   Railway domain; commit.
3. Add the custom domain `<domain>`.

**Verify**

```bash
curl -sI https://<domain>/ | grep -i content-security-policy
curl -s  https://<domain>/api/health/ready
```

Then complete the browser flow from section 2. In DevTools → Application →
Cookies, confirm `__Host-eleanor-session` is `HttpOnly`, `Secure`, `SameSite=Lax`.
In the Console, confirm there are **no CSP violations**.

### 4.3 Desktop shell (optional, preview)

```bash
cd client
ELEANOR_APP_URL=https://<domain> npm run electron:package
```

Artifacts land in `client/release/`. Code signing/notarisation is not configured
in 1.0; unsigned builds trigger OS warnings.

## 5. Routine deploy

1. Merge to `main` with a green CI.
2. Railway builds, runs `migrate:prod` (pre-deploy), then swaps traffic when
   `/api/health/ready` passes. Vercel deploys the client in parallel.
3. **Verify** within 10 minutes:
   - Railway logs: no `level":"error"` lines; `realtime.session_created` appears
     when you test a call.
   - Browser smoke test: sign in → settings change shows *Sync: saved* →
     Activate → speak → hear a reply.

Deploy order matters only when an API change is not backwards compatible with the
running client. In that case deploy the API first, wait for health, then promote
the Vercel deployment.

## 6. Rollback

| What broke | Action |
|---|---|
| Client only | Vercel → Deployments → previous → *Promote to Production*. |
| API, no migration in the release | Railway → Deployments → previous → *Redeploy*. |
| API **with** a migration | Migrations are forward-only. Redeploy the previous API image only if the migration was additive (new tables/columns/constraints the old code ignores) — true for every migration up to 004. Otherwise write a corrective migration and roll forward. |

After any rollback: re-run the smoke test from §5 and note the incident (§9.6).

## 7. Database migrations

Rules (enforced in review):

- Files are `api/migrations/NNN_description.sql`, applied in lexical order, each in
  its own transaction, recorded in `schema_migrations`. Never edit an applied file.
- Must be idempotent (`IF NOT EXISTS`, guarded `DO $$` blocks) and forward-only.
- Large-table changes: add columns nullable, backfill in batches, then constrain.
- `CREATE INDEX CONCURRENTLY` cannot run inside a transaction — put it in its own
  migration and tell the migrator (not yet supported; open an issue first).

The migrator takes a Postgres advisory lock, so concurrent pre-deploy runs are safe.

**Adopting a database created by the v0.7 snapshot** (tables exist, no
`schema_migrations`): run `npm run migrate:prod` as normal. 001–003 are
`IF NOT EXISTS` no-ops and 004 backfills `users` and adds constraints. If 004
fails on the metric range check, find offending rows with
`SELECT user_id, profile_metric FROM assistant_profiles WHERE profile_metric NOT BETWEEN 1000000 AND 1155519;`
and reset them to `1131380` before retrying.

## 8. Rotating secrets

### 8.1 `OIDC_CLIENT_SECRET`

1. Create a second secret in the IdP (most support two active secrets).
2. Update the Railway variable; Railway redeploys.
3. Verify a fresh sign-in works; revoke the old secret in the IdP.

### 8.2 `CREDENTIAL_ENCRYPTION_KEY`

1.0 supports a single key. Rotation therefore re-encrypts every row:

1. Put the API in maintenance (Railway → scale to 0) to stop writes.
2. Run the re-encryption one-off with both keys available:
   ```bash
   OLD_KEY=<current> NEW_KEY=$(openssl rand -base64 32) DATABASE_URL=<url> \
     node --input-type=module -e '
       import pg from "pg"; import { CredentialCryptoService as C } from "./api/dist/modules/credentials/crypto/service.js";
       const o = new C(process.env.OLD_KEY), n = new C(process.env.NEW_KEY);
       const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
       const { rows } = await db.query("SELECT user_id, encrypted_api_key FROM user_provider_credentials");
       for (const r of rows) await db.query("UPDATE user_provider_credentials SET encrypted_api_key=$2 WHERE user_id=$1", [r.user_id, n.encrypt(o.decrypt(r.encrypted_api_key))]);
       console.log("re-encrypted", rows.length); await db.end();'
   ```
3. Set `CREDENTIAL_ENCRYPTION_KEY` to the new key; scale back up.
4. Verify: a user can Activate. Destroy the old key copy.

(Dual-key decryption is on the roadmap so this can happen online.)

### 8.3 Session invalidation (force everyone to sign in)

`redis-cli --scan --pattern 'session:*' | xargs -r redis-cli del` (run inside
Railway's Redis shell). Users keep passkeys and stored keys.

## 9. Incident playbooks

Severity: **SEV1** nobody can use Eleanor or a secret is exposed · **SEV2** a core
flow is broken for some users · **SEV3** degraded or cosmetic.

### 9.1 `/api/health/ready` returns 503

The body says which dependency failed (`database` / `redis`). Check the Railway
plugin status; restart it if needed. Sessions live in Redis, so a Redis loss signs
everyone out but loses no durable data.

### 9.2 Nobody can sign in

Check API logs for `oidc.discovery_retry` (IdP unreachable) or
`auth.callback_failed` (redirect URI mismatch, clock skew, rotated secret).
Confirm the IdP client's redirect URI is exactly `https://<domain>/api/auth/callback`.

### 9.3 Activate fails for everyone

Look at `realtime.session_failed` log lines and their `code`:
`PROVIDER_UNAVAILABLE` → check status.openai.com; `PROVIDER_BAD_RESPONSE` → the
Realtime API contract or `REALTIME_MODEL` changed — set `REALTIME_MODEL` to a
currently supported model. For one user only, `PROVIDER_AUTH_FAILED` means their
key was revoked; they replace it under Security.

### 9.4 Passkey ceremonies fail after a domain change

`WEBAUTHN_RP_ID` / `PUBLIC_ORIGIN` must match the browser origin. Passkeys are bound
to the RP ID; moving domains strands existing passkeys — users re-enrol after an
IdP sign-in (first-passkey rule applies once their old ones are deleted).

### 9.5 Secret exposed (key in a commit, log or screenshot)

Follow [SECURITY.md §4](SECURITY.md#4-responding-to-an-exposed-secret). Treat as SEV1.

### 9.6 After every SEV1/SEV2

Write a short blameless postmortem: timeline, impact, root cause, what detected
it, follow-up actions with owners.

## 10. Configuration reference

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | | `development` | `production` enables `__Host-` cookie, https checks |
| `PORT` | | `3000` | |
| `LOG_LEVEL` | | `info` | `debug`·`info`·`warn`·`error` |
| `DATABASE_URL` | ✓ | | |
| `REDIS_URL` | ✓ | | |
| `PUBLIC_ORIGIN` | ✓ | | Browser-visible origin, no path; https in prod |
| `OIDC_ISSUER` | ✓ | | https in prod |
| `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | ✓ | | |
| `WEBAUTHN_RP_ID` | ✓ | | Host of `PUBLIC_ORIGIN` or a parent domain |
| `WEBAUTHN_RP_NAME` | | `Eleanor` | Shown by authenticators |
| `CREDENTIAL_ENCRYPTION_KEY` | ✓ | | base64 of 32 random bytes |
| `REALTIME_MODEL` | | `gpt-realtime-2.1` | |
| `SESSION_TTL_SECONDS` | | `28800` | Expiry resets whenever the session is written (login, step-up) |
| `STEP_UP_TTL_SECONDS` | | `300` | Passkey step-up validity |
| `PASSKEY_ENROLLMENT_MAX_OIDC_AGE_SECONDS` | | `600` | First-passkey window after IdP login |
| `REALTIME_SESSION_RATE_LIMIT_PER_MINUTE` | | `20` | Per user |

The API validates all of these at boot and refuses to start with a full list of
problems.

### Proxies and client IPs

`trust proxy` is set to `1` (one hop). Rate limiting keys on user id, not IP, so
this only affects `req.ip` in logs. If you add another proxy layer, raise it.
