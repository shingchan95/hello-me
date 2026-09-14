# hello-me

This repository uses an isolated QA checkout for validation.

A minimal responsive homepage that displays “Hello, world!”. No dependencies are required.

Requires Node.js 22.18 or newer and npm.

- `npm start` starts the site at http://localhost:3000. Set `PORT` to change the port.
- `npm run build` copies the self-contained homepage into `dist/` for static hosting.
- `npm test` builds the site and runs the HTTP and build validation tests.

The page uses system fonts and has no external assets or client-side JavaScript.
