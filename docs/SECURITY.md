# Security

## 1. Reporting

Email security reports to the maintainer rather than opening a public issue.
Include reproduction steps and impact. Expect an acknowledgement within 72 hours.

## 2. What Eleanor protects

| Asset | Where it lives | Protection |
|---|---|---|
| User's provider API key | Postgres `user_provider_credentials` | AES-256-GCM under `CREDENTIAL_ENCRYPTION_KEY`; never returned to the browser; view/replace/delete require passkey step-up |
| Session | Redis `session:<id>` | 256-bit random opaque id in `__Host-` HttpOnly Secure SameSite=Lax cookie; rotated on login |
| Account identity | External IdP | OIDC Authorization Code + PKCE (S256), state and nonce checked |
| Passkey public keys | Postgres `user_passkeys` | Public material only; signature counter checked |
| Voice audio | Browser ↔ OpenAI (WebRTC, DTLS-SRTP) | Never touches Eleanor's servers; not stored |

## 3. Controls

- **CSRF:** synchroniser token (`X-CSRF-Token`, constant-time compare) on every
  state-changing route, plus `SameSite=Lax` cookies.
- **Step-up:** passkey with user verification required, valid for
  `STEP_UP_TTL_SECONDS`. First passkey only within a fresh IdP login window;
  additional passkeys require an existing passkey.
- **Rate limiting:** realtime session creation per user (Redis, fixed window).
- **Headers:** Helmet on the API; CSP, HSTS, `Permissions-Policy: microphone=(self)`,
  `frame-ancestors 'none'` on the web app (`client/vercel.json`). Angular's
  critical-CSS inlining is disabled so `script-src 'self'` holds.
- **Config validation:** the API refuses to start with http origins in
  production, mismatched RP ID, or a malformed encryption key.
- **Logging:** structured, with request ids. Never logs API keys, SDP bodies,
  tokens, or utterances.
- **Supply chain:** lockfile-only installs in CI (`npm ci`); gitleaks on every PR.
- **Desktop shell:** context isolation, sandbox, no Node in the renderer, audio-only
  permission for the app origin, no webviews or in-app popups.

### Known limitations (1.0)

- The data channel is browser ↔ OpenAI using the user's *own* key; a user can send
  any `session.update` to their own session. This is by design for BYO keys and is
  not a cross-user risk. Server-enforced session policy would require ephemeral
  tokens (roadmap).
- Single encryption key; rotation requires brief maintenance (RUNBOOK §8.2).
- No account self-deletion endpoint yet (the schema cascades; endpoint on roadmap).
- The Electron shell is unsigned and WebAuthn support inside Electron varies by OS;
  enrol passkeys in a browser if the desktop prompt does not appear.

## 4. Responding to an exposed secret

Pre-1.0 the repository contained TLS private keys under `client/cert/` (a decrypted
localhost key, an encrypted localhost key, and a "staging" key whose certificate
named a real email address). **Treat them as compromised.** Removing them in a new
commit (PR-01) does not remove them from history.

1. **Contain.** Revoke/rotate the secret at its source first (IdP secret, OpenAI
   key, encryption key per RUNBOOK §8, TLS cert). Anything that trusted the
   `client/cert` certificates (OS keychains, browsers) should have them removed:
   macOS Keychain Access → search "localhost" / "NCAL"; Windows `certmgr.msc`;
   Linux `/usr/local/share/ca-certificates` then `update-ca-certificates`.
2. **Purge history** (coordinate: everyone must re-clone afterwards):
   ```bash
   pip install git-filter-repo
   git clone --mirror git@github.com:<owner>/eleanor.ca.git eleanor-purge
   cd eleanor-purge
   git filter-repo --invert-paths --path client/cert --path-glob '*.key' --path-glob '*.pem'
   git push --force --mirror
   ```
   Then ask GitHub Support to purge cached views and any PR refs, and delete stale
   forks you control.
3. **Verify:**
   `git log --all --oneline -- client/cert` returns nothing on a fresh clone, and
   `gitleaks detect` is clean.
4. **Record** the incident (RUNBOOK §9.6).
