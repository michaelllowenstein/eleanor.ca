## What

<!-- One paragraph: what changes and why. Link the issue. -->

## Risk & rollout

- [ ] Database migration included (forward-only, idempotent, reviewed for locks)
- [ ] New or changed environment variables documented in `api/.env.example` and `docs/RUNBOOK.md`
- [ ] Security-relevant change (auth, sessions, credentials, CSP) — reviewed against `docs/SECURITY.md`

## Verification

- [ ] `npm test` and `npm run test:e2e` pass locally
- [ ] Manually exercised: <!-- flows you clicked through -->
