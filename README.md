# hello-me

This repository uses an isolated QA checkout for validation.

A minimal responsive homepage that displays “Hello, world!”. No runtime dependencies are required.

Requires Node.js 22.18 or newer and npm.

- `npm start` starts the site at http://localhost:3000. Set `PORT` to change the port.
- `npm run build` copies the self-contained homepage into `dist/` for static hosting.
- `npm test` builds the site and runs the HTTP and build validation tests.
- `npm ci --include=dev` and `npx playwright install --with-deps chromium` install browser QA tooling. `npm run test:browser` checks the background bounce, reduced motion, questionnaire removal, responsive overflow, requests/storage, and JavaScript-disabled rendering in Chromium. CI runs both test commands.

On Alpine Linux, install the system `chromium` package and run
`CHROMIUM_PATH=/usr/bin/chromium npm run test:browser` instead of downloading
Playwright's browser. Screen-reader announcements and visual appearance still
need human QA.

The page uses system fonts and has no external assets or runtime JavaScript. A decorative ball bounces slowly behind the greeting, taking 12 seconds in each direction. The animation is disabled when the visitor prefers reduced motion. The questionnaire has been removed.

## Current work status

The greeting, slow bouncing ball, reduced-motion support, and questionnaire
removal are implemented in this checkout. `npm test` and `npm run test:browser`
validate this scope. There is no remaining quiz implementation or quiz QA task
in the current site scope.

The former [Issue #14 requirements](docs/issue-14-requirements.md) and
[QA handoff](docs/issue-14-qa.md) are historical. Their previous quiz-related
“needs attention” finding is superseded by the questionnaire removal.
This site does not store worker activity or task status. A dashboard still
showing “working” or “needs attention” must be reconciled in the external task
system; editing these documents does not close an external issue or stop a worker.
Deployment verification is a separate check described below.

## Deployment verification

GitHub Pages publishes the repository root from `main` at
https://shingchan95.github.io/hello-me/. After deployment, run the same browser
checks against the live site, including an exact comparison with this checkout:

```sh
SITE_URL=https://shingchan95.github.io/hello-me/ npm run test:browser
```

On Alpine, also set `CHROMIUM_PATH=/usr/bin/chromium`. A stale deployment fails
the content comparison even if the page still loads successfully.
