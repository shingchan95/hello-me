# Interactive background and template navigation QA

## Repair validation — 2026-09-15

Validated the preserved implementation from `78da368` and the additional
fictional-copy assertions in this repair. No application changes were needed.

Environment: Node.js v24.21.0, npm 11.19.0, Alpine Chromium 152.0.7977.82.

| Check | Result |
| --- | --- |
| `npm test` | PASS: build and all 7 tests, zero failures or skips. |
| `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser` | PASS: acceptance checks executed against the local HTTP server; served HTML exactly matched this checkout. |
| `git diff --check` | PASS. |

Browser evidence covers:

- Pointer clicks at 320px and 1440px start an extra bounce; sampled animation
  positions move over 20px and return within 1px of the starting position.
  Enter and Space restart the bounce.
- Home, About, Projects, and Contact links update the fragment and bring their
  sections into view at mobile and desktop widths.
- The greeting fits and the page has no horizontal overflow at 320px, 768px,
  and 1440px. All four balls stay within those viewports during the slow bounce.
- Switching to reduced motion removes all animations, including an active click
  bounce; subsequent keyboard activation does not create an animation.
- All five template paragraphs match explicitly reviewed fictional copy, and
  all links are local section placeholders. The page contains no personal
  biography or real contact details. Future copy changes require reviewing and
  updating these expectations.
- No browser errors, extra network requests, cookies, or browser storage;
  greeting, balls, and About navigation also work with JavaScript disabled.

The initial plain `npm run test:browser` could not launch because the bundled
Playwright browser was absent. The documented system Chromium override above
resolved that environment issue and the full suite passed. CI already installs
Playwright Chromium and runs this script. These results establish local browser
validation; they do not claim a hosted CI run, deployment check, or human visual
or screen-reader review.
