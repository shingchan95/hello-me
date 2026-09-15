# Interactive background and template navigation QA

## Follow-up acceptance validation — 2026-09-15

Preserved the implementation and prior QA work in `981d6a7`. Re-ran the
acceptance-specific Chromium checks and extended them with a 320 × 640 mobile
context using touch input. No application changes were necessary.

- `npm test`: PASS, all 7 build/HTTP tests, zero failures or skips.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser`: PASS, including the
  existing desktop/mobile click displacement, keyboard activation, all four
  section links, 320/768/1440px overflow checks, and exact fictional-copy checks.
- New touch checks: PASS, a tap moves the ball over 20px and returns it within
  1px of its start; all four navigation links bring their sections into view.
- New initial reduced-motion checks: PASS, all four balls start without
  animation and a touch activation leaves them still. Restoring normal motion
  enables touch bounce. Existing live preference-change checks also pass.
- `git diff --check`: PASS.

Environment: Node.js v24.21.0, npm 11.19.0, system Chromium 152.0.7977.82.
The first new reduced-motion tap targeted a ball center covered by the nav and
timed out; the test now taps its exposed edge using normal browser hit testing.
The completed suite passed against the local HTTP server with an exact HTML
comparison to this checkout. This is automated Chromium mobile emulation,
not physical-device, hosted CI, deployment, or human visual review.

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
