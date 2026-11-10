# D3 — Change management for the admin dashboard

**System:** admin.devitrak.net (React SPA served by IIS on DEVITRACKAPP) · **Controls:** CM-3, CM-4, CM-2, SA-10 · **As of:** 2026-11-03, read from the GitHub settings and the workflows on `main` · **Repository:** `grodriguezcontextglobal/testing-admin-dashboard` (public)

Every change to production goes through one path: a pull request into `main`, a green CI run, a release built by GitHub Actions, and a pull from the server that checks the release's SHA-256. Nobody builds on the server, and nothing pushes to it.

## The path of a change

| Step | Where | What enforces it | Evidence left behind |
|---|---|---|---|
| 1. Branch and PR | GitHub | Ruleset "Main" (below): no direct push to `main` | The PR: diff, description, author, timestamps |
| 2. CI on the PR | `.github/workflows/ci.yml` | Required status checks "Lint, tests y build" and, since 2026-11-10, "CSP en modo enforce (E2E)" | The run log, the coverage report and the SBOM (artifacts, 90 days) |
| 3. Static analysis on the PR | `.github/workflows/codeql.yml` (PR #51) | Findings shown on the PR and under Security → Code scanning | CodeQL analyses and alerts |
| 4. Merge | GitHub | Only once step 2 is green; done by a maintainer | The merge commit on `main` |
| 5. Release | `.github/workflows/release.yml` | Runs CI again, then builds with the `production` environment's variables | GitHub Release `admin-<date>-<sha>` with `admin-dist.zip`, its `.sha256` and `admin-sbom.cdx.json` |
| 6. Deploy | DEVITRACKAPP, `deploy/iis/Update-AdminSite.ps1` | Scheduled task every 5 min; refuses a zip whose SHA-256 does not match, or with no `index.html` / `web.config` | `C:\inetpub\devitrak-admin\state.json` and `logs\update-YYYY-MM.log` |

### What the CI checks (step 2)

1. **Secret scan:** gitleaks over the full history; a new finding fails the run (`.gitleaksignore` lists the reviewed old ones).
2. **Dependency audit:** a high or critical advisory in a production dependency fails the run, unless `.github/audit-exceptions.json` accepts it with a reason and an expiry date.
3. **SBOM:** CycloneDX of the production dependencies; a PR that breaks it fails.
4. **Lint:** `npm run lint` with `--max-warnings 0`: any error or warning fails the run, and so does an `eslint-disable` comment that is no longer needed. Zero since 2026-11-05 (plan item C2; it was 280 on 2026-10-26).
5. **Unit tests** with coverage (Vitest).
6. **Production build**, on Linux, so case-sensitive import paths are caught.

All third-party actions are pinned by commit SHA. Dependabot proposes updates to npm packages, actions and the Docker image every week; those updates go through the same PR and CI.

## Who can change what

| Role | People | Can |
|---|---|---|
| Admin | 1 (repository owner) | Merge PRs, change rulesets, environments and variables, re-run a release |
| Write | 1 | Open branches and PRs, merge PRs that pass CI |
| Anyone else | — | Fork and open a PR; a fork's workflows never run on the server |

### Ruleset "Main" (applies to the default branch, active)

- A pull request is required; direct pushes are rejected.
- The status checks "Lint, tests y build" and "CSP en modo enforce (E2E)" (since 2026-11-10) must pass.
- Force pushes and branch deletion are blocked.
- No bypass actors: the rules apply to admins too.
- Approving reviews required: **0** (decision of 2026-10-29, see "Gaps").

### Production configuration

The build reads its configuration (API URL, Stripe publishable key, feature flags, CSP enforcement) from the variables of the `production` environment in GitHub. Only an admin can change them. A change takes effect on the next release: a merge to `main`, or **Actions → Release (IIS) → Run workflow**. A missing required value, or a secret Stripe key, fails the build (`src/config/envValidation.js`), and nothing is published.

## Impact analysis (CM-4)

- The PR diff and the CI run are the impact record for each change.
- Tests are written before the code (test → code → refactor), so a change in behaviour shows up as a new or changed test in the same PR.
- Security-relevant settings live in code with tests: security headers (`src/config/securityHeaders.js`), roles and permissions (`src/config/roles.js`), session teardown (`src/api/sessionHeaders.js`), offline caching (`src/config/offlineCaching.js`).
- Major version upgrades are not proposed automatically; they get their own PR (for example Vite 5 → 6, PR #42).

## Rollback

The server keeps the last 5 releases; GitHub keeps the last 15.

| To | Do |
|---|---|
| Go back one release | In GitHub, on the previous release: **Edit → Set as the latest release**. The server deploys it on its next pass (within 5 min) |
| Go back right away | On the server: `C:\inetpub\devitrak-admin\bin\Update-AdminSite.ps1 -Tag admin-…` |
| Stop all deploys | On the server: `Disable-ScheduledTask "Devitrak Admin - Update from GitHub"` |

A switch between releases is a junction swap, so the site never serves a half-copied build.

## Emergency changes

There is no bypass. A hotfix is a normal PR that waits for the same CI run. If the fix cannot wait for CI, the fallback is a rollback (above), not a manual change on the server.

## Gaps and decisions

| Gap | Status | Effect |
|---|---|---|
| No second-person review on `main` | Decided 2026-10-29: PR + green CI only, given a two-person team | SOC 2 CC8.1 expects independent review. To close it: set "Required approvals" to 1 in the ruleset |
| `production` environment has no required reviewers | Not configured | Every merge to `main` that passes CI reaches production about 5 minutes after the release. To close it: add a required reviewer to the environment |

## Sources

- Ruleset "Main" and environment `production`: GitHub API, read 2026-11-03; the ruleset read again on 2026-11-06, unchanged.
- Lint step: `ci.yml` on `main` at `4442a29a` (2026-11-05).
- `.github/workflows/ci.yml`, `release.yml`, `codeql.yml`, `.github/dependabot.yml`.
- `deploy/iis/README.md`, `deploy/iis/Update-AdminSite.ps1`.
