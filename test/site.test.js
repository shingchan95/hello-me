import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { createSiteServer } from '../scripts/server.js';

let server;
let baseURL;

before(async () => {
  server = createSiteServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('serves the homepage with the greeting and mobile viewport', async () => {
  for (const path of ['/', '/index.html', '/?welcome=true']) {
    const response = await fetch(`${baseURL}${path}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
    const html = await response.text();
    assert.match(html, /<h1>Hello, world!<\/h1>/);
    assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  }
});

test('supports HEAD requests without a response body', async () => {
  const response = await fetch(baseURL, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
});

test('returns 404 for missing pages and does not expose repository files', async () => {
  for (const path of ['/missing', '/package.json', '/.git/config']) {
    assert.equal((await fetch(`${baseURL}${path}`)).status, 404);
  }
});

test('rejects unsupported methods', async () => {
  const response = await fetch(baseURL, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});

test('build produces the complete homepage for static hosting', async () => {
  const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const built = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.equal(built, source);
});
