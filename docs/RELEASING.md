# Releasing

Eleanor follows [Semantic Versioning](https://semver.org). The root, `api` and
`client` packages always share one version.

- **Major:** breaking API contract, breaking profile-metric schema, or a
  migration that is not backwards compatible with the previous release.
- **Minor:** new features, additive migrations.
- **Patch:** fixes only.

## Release checklist

**Preconditions:** `main` is green in CI; staging is running the commit you intend
to release.

1. Create `release/vX.Y.Z` from `main`.
2. Bump versions in one step:
   ```bash
   npm version X.Y.Z --no-git-tag-version --workspaces --include-workspace-root
   ```
3. Move the `## [Unreleased]` entries in `CHANGELOG.md` under `## [X.Y.Z] - YYYY-MM-DD`.
4. Open a PR titled `release: vX.Y.Z`; merge when CI passes.
5. Staging sign-off (record results in the PR):
   - [ ] Fresh sign-in through the real IdP
   - [ ] New account: passkey enrolment → provider key → Activate → two-way voice
   - [ ] Settings change persists across a reload and a second browser
   - [ ] Security page: view metadata (passkey prompt), replace key, remove key
   - [ ] Sign out, sign back in
   - [ ] No CSP errors in the browser console; no `error` lines in API logs
6. Tag and publish:
   ```bash
   git checkout main && git pull
   git tag -a vX.Y.Z -m "Eleanor vX.Y.Z"
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title "Eleanor vX.Y.Z" --notes-from-tag
   ```
7. Production deploy per RUNBOOK §5 and verify. Keep the previous Vercel and
   Railway deployments available for rollback (RUNBOOK §6) for at least 24 hours.
