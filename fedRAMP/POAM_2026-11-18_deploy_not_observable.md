# POA&M — Deployment to production can fail silently, and did

**Item ID:** DVK-ADMIN-2026-001
**Opened:** 2026-11-18
**Status:** Open
**Risk:** Moderate
**Controls:** CM-3, CM-4, SA-10, SI-2, AU-6
**Asset:** `admin.devitrak.net` — React SPA served by IIS on **DEVITRACKAPP**
**Point of contact:** Gustavo Rodriguez (DEVITRACKAPP is reachable only by Remote Desktop)
**Source of discovery:** Verification of a routine deployment, 2026-11-18. Not an audit, not a report — someone checked whether a merge had actually reached production.

---

## 1. The weakness

There are two, and they should be read in this order, because the second is the one that matters.

**1.1 — A published release was not deployed.**
Pull request #106 (an AC-4 fix) merged to `main` as `d789f641`, CI passed, and `release.yml` published `admin-20261118-100828-d789f64` at 10:08 UTC. Thirteen minutes later — at least two passes of a task that runs every five minutes — production was still serving the previous build.

**1.2 — Nothing surfaced it.**
No alert fired. No dashboard turned red. The GitHub Actions run is green, because from GitHub's point of view the job succeeded: it built a package and published a release. **The step that puts code in front of users is the one step with no observer.**

Stated precisely, because the distinction matters to an assessor: this particular failure almost certainly *is* in the log on the VM — it happened after the download, and that path writes an `ERROR:` line. What is missing is not the record. It is that **nothing reads the record, and nothing raises it**, so a line written at 10:2x UTC on a machine nobody is logged into is indistinguishable, from outside, from a deployment that worked. A log that is only read after someone already suspects a problem is evidence after the fact, not a control.

The second weakness is the finding. The first is one instance of it, and the only reason it was caught is that somebody looked.

---

## 2. Why it is silent, precisely

`deploy/iis/Update-AdminSite.ps1` writes a log line when it deploys and when it errors. It deliberately writes **nothing** when there is no new release — the comment in the script says so, and the reasoning is sound on its own terms: a line every five minutes would bury the real entries.

The consequence is that these two states produce **identical evidence**:

| State | What the log shows |
|---|---|
| Healthy, nothing new to deploy | nothing |
| Task disabled, crashed, or unable to reach GitHub | nothing |

A monitoring design where *working* and *not running at all* look the same is not a gap in coverage — it is a control that cannot be evidenced. An assessor asking "how do you know your deployment pipeline is running?" currently has no answer that does not reduce to "someone would probably notice".

This is separate from, and additional to, the fact that even the failures the script **does** log go unread until someone checks by hand. Both have to be closed: M2 removes the ambiguity of silence, M3 removes the dependence on someone looking.

---

## 3. Evidence, 2026-11-18

| Observation | Value |
|---|---|
| Release published | `admin-20261118-100828-d789f64`, 10:08:33 UTC |
| Download count at 10:21 UTC | `admin-dist.zip` **0** |
| Download count at 10:26 UTC | `admin-dist.zip` **1**, `.sha256` **1**, `admin-sbom.cdx.json` **1** |
| `Last-Modified` served by IIS for `/`, at 10:33 UTC | `Tue, 17 Nov 2026 21:09:27 GMT` — unchanged |
| Bundle served at 10:33 UTC | `index-BPsxxJkG.js` — the previous release's |

**The download counts place the failure precisely, and they moved while this entry was being written.** At 10:21 the package had never been requested, which suggested a stopped task. By 10:26 all three assets had been fetched exactly once. So the scheduled task **is** running, it reached the GitHub releases API, and it pulled the complete package — and then production did not change, through 10:33.

The failure is therefore **after the download**: the SHA-256 verification, the `index.html` / `web.config` package check, or the junction swap. Each of those paths writes an `ERROR:` line, so unlike a stopped task, **this failure is recorded on the VM** and the log will name it.

Root cause is still **not determined from outside**: `C:\inetpub\devitrak-admin\logs\update-2026-11.log`, `state.json` and the task's `LastTaskResult` require Remote Desktop.

Two things worth keeping in the record:

- The pipeline worked the day before — the 2026-11-17 14:26 release reached production at 21:09 UTC the same day — so this is a regression within roughly the last 13 hours, not a configuration that never worked.
- **The first diagnosis from outside was wrong**, and it was wrong in the direction of blaming the wrong component: a single observation of `downloadCount = 0` was read as a stopped task. Five minutes of further observation reversed it. That is worth recording because it is an argument for M3: a check that samples once can be confidently wrong, and the remediation has to tolerate a deployment that is merely slow without reporting it as a failure.

---

## 4. Impact

**This contradicts a statement already written into our change-management evidence.** `fedRAMP/FRONTEND_D3_change_management_2026-11-03.md` describes step 6 as a scheduled task every 5 minutes, and records that "every merge to `main` that passes CI reaches production about 5 minutes after the release." That sentence feeds CM-3 and SA-10 in the SSP and **is not currently true**. It has to be corrected whatever the root cause turns out to be.

The operational risk is not that a feature is late:

- **SI-2, flaw remediation.** Remediation timelines are measured to deployment, not to merge. A security fix can be merged, released, reported as done, and not be running — and today's incident is exactly that shape: the undeployed change *is* a security fix (AC-4 cross-company reads).
- **CM-3/CM-4.** What is running in production is not reliably what change control approved. The gap is unbounded in time, because nothing closes it.
- **AU-6.** The log cannot be reviewed for this, because its silence is ambiguous.

Rated **Moderate** rather than High: the failure mode is a stale production, not an insecure one — the previous build is intact, served correctly, and no partial or corrupted state is possible, since the script switches a junction only after verifying the package. Nothing is exposed by this that was not exposed yesterday. What it removes is the assurance that a fix we believe is deployed actually is.

---

## 5. Remediation

### M1 — Determine the root cause · owner Gustavo · due 2026-11-18

By Remote Desktop on DEVITRACKAPP, in this order:

1. `C:\inetpub\devitrak-admin\logs\update-2026-11.log`. Given §3, **expect an `ERROR:` line dated 2026-11-18 around 10:2x UTC.** It names the cause directly — SHA-256 mismatch, a package check that refused the zip, or the junction swap.
2. If the error is the junction swap: check free disk space, and whether a file under `current` is held open by an IIS worker process. That is the one failure here that can leave the deploy half-done, and it is the reason to look before retrying.
3. `state.json` — whether the tag was recorded as deployed. If it says the new tag while IIS serves the old build, the swap is the problem and not the download.
4. The scheduled task `Devitrak Admin - Update from GitHub` — `LastRunTime`, `LastTaskResult`, for completeness.

Once the cause is known, re-run the deploy by hand — **with the most recent release tag, not the one that stalled**:

```powershell
gh release list --limit 1          # or read the latest tag from the Releases page
C:\inetpub\devitrak-admin\bin\Update-AdminSite.ps1 -Tag <latest>
```

Releases are cumulative, so the newest one contains the AC-4 fix along with everything merged after it. `admin-20261118-100828-d789f64` is the release that failed to deploy, and naming it here is how this entry recorded the incident — it is **not** the tag to deploy. Three further releases were published while this item was open, and more will be by the time anyone reads it.

That a written-down tag goes stale within hours is itself the argument for **M4**: the deploy instruction should not have to name a version that a human then has to check is still current.

Record the finding here; it decides whether M2 needs anything beyond what is written below.

#### Finding, recorded 2026-11-19 — closed

**The updater had never been installed.** Not a failed download, not a hash mismatch, not a
junction held open: there was no scheduled task, no `state.json`, and no `C:\inetpub\devitrak-admin`
deploy tree at all. `Install-AdminSiteUpdater.ps1` was run on DEVITRACKAPP on 2026-11-19 and
reported `actual: ninguno` — "current: none" — and logged the first deployment as a first
deployment. Both sites had been served, by hand, from a `dist` folder built on the machine
(`C:\Users\CGAdmin\Documents\GitHub\admin-dashboard-vite\dist`).

**This changes what the remediation is for, and it is worth being exact about it.**

- The original diagnosis from outside — that a scheduled task had stalled — was wrong, and
  wrong in a way that would have sent the fix to the wrong place. It is recorded in §4 for
  that reason, and this is the second time in this item that an inference from one
  observation turned out to be confident and incorrect.
- **M2 would not have caught this.** A heartbeat in `Update-AdminSite.ps1` writes nothing
  when nothing runs the script. M2 is still worth doing — it is what makes an absent line
  mean something from now on — but it would not have shortened this incident by a day.
- **M3 is the milestone that was actually needed**, and the root cause raises its priority
  rather than lowering it. A check outside the VM comparing the published release with what
  the site serves does not care *why* the deploy did not happen. It is the only one of the
  four that reports an updater that was never installed.
- **M4 likewise.** The verification that found the stall had to fingerprint a hashed bundle
  filename, which is also what made the first diagnosis so easy to get wrong.

The gap between the release pipeline and the machine was therefore total rather than
intermittent: **every release published before 2026-11-19 reached production only if
somebody built and copied it by hand.** Release artifacts from before that date are
evidence of what was built, not of what was served.

### M2 — Make silence mean failure · owner dashboard · due 2026-11-25

Change `Update-AdminSite.ps1` to write a heartbeat line on **every** run, including the no-op, and to keep `state.json` stamped with the time of the last successful check as well as the last deploy. The log volume objection is answered by rotation, not by silence. **After this, an absent line is unambiguous evidence of a stopped task** — which is what makes the control assessable.

### M3 — Check deployment from outside the VM · owner dashboard · due 2026-11-25

A scheduled GitHub Actions workflow that compares the tag of the latest release with what `admin.devitrak.net` actually serves, and fails — visibly — when they differ for more than 20 minutes.

This is deliberately **outside** DEVITRACKAPP. A monitor that lives on the machine it monitors shares its failure modes, and the failure mode here is "the thing on that machine stopped running."

Two requirements learned from building the manual version of this check today, both of which would otherwise be rediscovered the hard way:

- **Compare commit SHAs, not statuses.** While verifying this very item, `gh pr checks --watch` exited 0 and reported five passing checks — for the *previous* commit, because the pull request had been merged from the web minutes earlier and the branch had moved on. A tool answering successfully about a state other than the one being asked about is the same class of error as a log whose silence is ambiguous. The monitor must assert *which* commit it is talking about and refuse to conclude anything when that does not match.
- **Tolerate slow, alert on stuck.** A single sample can be confidently wrong in both directions — see §3. The check needs two consecutive disagreeing samples over the threshold before it reports, not one.

### M4 — Make the deployed version readable · owner dashboard · due 2026-11-25

Production does not state which release it is serving. Today's verification had to fingerprint a hashed bundle filename and compare `Last-Modified`, which worked but is indirect and breaks the moment a build is byte-identical.

Publish the release tag in the artifact — a `version.json` written at package time, served by IIS and uncached. M3 then compares two tags rather than inferring from a hash, and anybody can answer "what is in production?" with one request.

### M5 — Correct the change-management evidence · owner dashboard · due 2026-11-25

Amend `FRONTEND_D3_change_management_2026-11-03.md` so the deployment step describes what is verified rather than what is intended, and reference this item. **Do not quietly edit the claim** — it was written in good faith from the configuration, and the correction is itself evidence that the review process works.

---

## 6. Interim position, until M1 closes

- **Production is healthy**, serving the 2026-11-17 build. No partial or corrupted state is possible.
- **Treat no deployment as unconfirmed**, not as done. Until M3 exists, every deployment that matters is verified by hand against the live site — the check used today is in §3 and takes one request.
- **PR #106 is merged and released but not running.** It stays on the list of things not in production until the live bundle changes.

---

## 7. Completion criteria

This item closes when all of the following are true:

1. The root cause of the 2026-11-18 stall is recorded here and fixed.
2. A stopped updater produces a visible signal within 20 minutes, from outside the VM.
3. Production states its own version, and the external check reads it.
4. The change-management document describes the pipeline as it is.

**Target completion: 2026-11-25.**
