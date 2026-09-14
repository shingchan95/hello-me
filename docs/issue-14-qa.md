# Issue #14 / PR #15 verification

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
