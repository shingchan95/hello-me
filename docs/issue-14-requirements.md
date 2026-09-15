# Issue #14: Get to Know Me quiz (historical)

## Superseded scope

The questionnaire was removed by commit `401b8d0`, included in `7653e52`
(PR #22), and replaced with a slow bouncing ball background. This document
preserves the former quiz requirements and implementation map for reference.
References below to quiz markup, `test/quiz.test.js`, and pending quiz approval
are historical; they do not describe the current checkout or its remaining work.
See the [current repository status](../README.md#current-work-status).

## Requirements source

This record maps the planned scope in GitHub Issue #14 to the existing
implementation. It does not establish an approved or assigned work item.
Read-only verification of the Issue on 2026-09-14 confirmed that its body says:

> I can’t confirm an active Issue or assignment yet—the trusted Project state still shows none.

The Issue introduces the list below as “The planned work is”. Earlier wording
in this record calling it the “current assigned work item” was unsupported.
Approval, assignment, and completion remain unverified pending trusted Project
evidence; this implementation map does not resolve that acceptance blocker.

The planned requirements are:

> - Add a responsive, keyboard-accessible “Get to Know Me” quiz
> - Show an on-page personalised result
> - Collect no visitor data and preserve current site content/style
> - Sarah: implementation; Thomas: QA after PR submission

## Implementation and verification map

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Responsive quiz | `index.html` adds the quiz below the greeting in the existing fluid card. Fieldsets can shrink; choices wrap; labels and buttons have a 44px minimum height. | `test/site.test.js` checks the mobile viewport. Inspect narrow and wide layouts during browser QA. |
| Keyboard access | Native labelled radio groups with legends and required answers, visible focus outlines, and native submit/restart buttons. Submission focuses the result heading; restart focuses the first choice. | `test/quiz.test.js` checks group markup, required choices, focus styles, submission focus, and restart focus. Browser QA must confirm Tab, arrow keys, Space, and Enter behavior. |
| On-page personalised result | Three questions produce explorer, maker, connector, or balanced conversation-style results with a suggested conversation starter. Two or more matching choices win; three different choices produce balanced. Submission stays on-page, and the result is a live region. | Quiz tests exercise all 27 combinations, invalid/incomplete answers, result visibility, announcements markup, and restart. |
| No visitor data collection | Answers exist only in the current page's form and transient JavaScript values. There are no analytics, external assets, requests, cookies, or storage calls in the quiz. Restart clears answers and result. | Quiz interaction tests run without network/storage APIs and assert submission cancellation and clearing. This is a scoped script check, not a full browser network audit. |
| Preserve content/style | The original title, greeting, tagline, system fonts, colors, and rounded card remain. The quiz uses the same palette and sits below a divider. | Homepage tests check the title, greeting, tagline, and viewport; build tests check the complete source is copied unchanged. Visual comparison remains part of browser QA. |
| Preserve workflow safety | No changes to serving, deployment, dependencies, or external workflow state are needed for this update. | Site tests cover GET/HEAD, missing/private paths, rejected methods, build output, and startup. |

Question wording, the three conversation styles, the balanced outcome, restart,
and the no-JavaScript explanation are implementation choices supporting the
supplied scope, not separately supplied requirements. The quiz makes no claims
about the site owner's biography or a visitor's psychological traits.

## Validation and handoff

See [QA evidence and workflow handoff](issue-14-qa.md) for the executed checks
and direct GitHub observations. Local validation does not establish Project
assignment or independent QA approval.

Run `npm test` (which includes `npm run build`) from the repository root.
The committed `npm run test:browser` check additionally exercises native
Chromium keyboard interaction, required fields, result/restart focus, horizontal
overflow at 320/768/1440px, no requests or storage after answering, and the
JavaScript-disabled fallback. See the README for browser installation.
The automated suite covers script behavior and HTML structure; it does not
replace browser checks for layout, native keyboard interaction, or screen-reader
announcements. For browser QA, complete the quiz at narrow and wide widths using
only the keyboard, verify the result and restart focus, and check that submitting
and restarting create no network requests or persistent browser storage.

Sarah and Thomas are the implementation and post-PR QA roles named in the work
item. Their actual assignments, active Issue state, PR submission, QA completion,
and deployment have not been verified in trusted Project state here. This record
does not assert that any of those workflow transitions occurred.
