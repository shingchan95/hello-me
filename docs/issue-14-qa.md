# Issue #14 / PR #15 verification

## Repair validation — 2026-09-14

This section supersedes the pending automated browser and hosted-check statements
in the historical record below. The repair preserves the implementation at
`76bb3adf30763019580e99652c349e387f14dcd7` and adds a reproducible Chromium
check, a pinned development-only Playwright dependency and lockfile, and CI
execution of that check. Repository permissions remain read-only in CI.

Executed on Node.js v24.21.0 / npm 11.19.0:

- `npm ci --include=dev`: passed, audit reported no vulnerabilities.
- `npm test`: build and all 10 tests passed, zero failures or skips, including
  actual HTTP server startup and all 27 result combinations.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser`: passed using Alpine
  Chromium 152.0.7977.82. Verified native required-field blocking, ArrowRight,
  Tab, Space and Enter interaction, result and restart focus, cleared answers,
  no horizontal overflow at 320/768/1440px, no additional requests or local/session
  storage or cookies, no page errors, and the JavaScript-disabled fallback.
- `git diff --check`: passed.

The initial bundled Chromium launch failed because this checkout runs Alpine;
installing system Chromium and using the documented `CHROMIUM_PATH` resolved it.
CI installs Playwright Chromium on Ubuntu. Its newly added browser step has not
yet run on GitHub. Visual review and screen-reader announcements remain human
QA checks; overflow assertions do not establish visual approval.

Fresh read-only GitHub queries confirmed Issue #14 is OPEN with no assignees or
Project items. PR #15 is OPEN, targets main, closes #14, and its remote head
matched `76bb3adf30763019580e99652c349e387f14dcd7`. Reviews are empty. The existing
[Build and runtime tests check](https://github.com/shingchan95/hello-me/actions/runs/34875800069/job/104082541679)
completed successfully at 17:36:52 UTC for that commit; this is not a hosted
result for the new repair commit.

`gh api repos/shingchan95/hello-me/deployments` and the returned deployment's
`statuses` endpoint show a successful GitHub Pages deployment at 16:52:19 UTC,
but only for `afb7c229ca810e2f1a5fc9cfcfcffe5e8a18cc82` on main, before the quiz.
This does not verify deployment of Issue #14. No trusted Project interface is
available here to verify the active work item, Sarah/Thomas assignments, or QA
status. Overall Issue completion remains unconfirmed. No assignment, approval,
Issue closure, PR merge, or deployment was performed by this repair.

## Local validation — 2026-09-14

Validated the existing implementation at commit
`872ae61f496165bfff2640d694d83c529625dc3d` with Node.js v24.21.0 and npm 11.19.0.

`npm test` passed: 10 tests, 0 failures, 0 skipped. This command ran the build
successfully and verified that `dist/index.html` exactly matches the source.
The suite exercised all 27 quiz answer combinations, invalid answers, restart,
focus calls, and accessibility markup. It also started real HTTP servers and
verified homepage responses, HEAD, private/missing path rejection, unsupported
methods, and the application startup entry point.

`git diff --check` passed. Browser layout, native keyboard navigation, and
screen-reader behavior remain manual QA checks; the script tests use a minimal
DOM harness and do not establish those browser results.

The added `.github/workflows/qa.yml` runs `npm test` on pull requests and pushes
to main using the minimum supported Node version, 22.18.0. It uses read-only
repository permissions, does not persist checkout credentials, and performs no
deployment or workflow-state transitions. Its hosted result remains pending
until GitHub runs it after this change is pushed.

## Read-only workflow verification — 2026-09-14

Queried GitHub directly using:

```sh
gh issue view 14 --repo shingchan95/hello-me --json number,title,body,state,assignees,projectItems
gh pr view 15 --repo shingchan95/hello-me --json number,title,body,state,headRefName,headRefOid,baseRefName,statusCheckRollup,closingIssuesReferences
```

Observed:

- Issue #14 is OPEN and its body contains the quiz requirements recorded in
  `issue-14-requirements.md`. Its `assignees` and `projectItems` are empty.
- PR #15 is OPEN, targets `main`, and links Issue #14 as its closing issue.
  Its head branch is `ai-company/2mkmv4ot68`, and its head SHA matched the
  implementation commit above when queried.
- The PR's `statusCheckRollup` is empty; no hosted check result was available.

These GitHub observations verify the Issue and PR exist, but do not establish
an active Issue, assignment, or QA transition in trusted Project state. No
trusted Project interface was available in this session. Sarah and Thomas are
named roles in the Issue body, not verified account assignments. Do not infer
their identities or mark assignment, independent QA, deployment, or overall
work-item completion from this local test run.

The remaining workflow handoff requires the Project owner to verify the active
Issue and implementation assignment, route PR #15 to the intended QA reviewer,
and record the QA outcome in trusted Project state. Existing state is preserved;
this repair does not close the Issue, merge the PR, or manufacture an approval.
