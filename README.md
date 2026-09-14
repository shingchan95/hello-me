# hello-me

This repository uses an isolated QA checkout for validation.

A minimal responsive homepage that displays “Hello, world!”. No dependencies are required.

Requires Node.js 22.18 or newer and npm.

- `npm start` starts the site at http://localhost:3000. Set `PORT` to change the port.
- `npm run build` copies the self-contained homepage into `dist/` for static hosting.
- `npm test` builds the site and runs the HTTP and build validation tests.

The page uses system fonts and has no external assets. Its “Get to Know Me” quiz uses inline JavaScript, native keyboard-accessible radio groups, and an on-page conversation-style result. A majority determines the result; three different choices produce a balanced result. Answers are never transmitted or stored, and restarting clears them. Without JavaScript, the greeting and quiz introduction remain available with an explanatory message.
