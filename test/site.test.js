import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
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

test('serves the homepage with the original title, greeting, tagline and mobile viewport', async () => {
  for (const path of ['/', '/index.html', '/?welcome=true']) {
    const response = await fetch(`${baseURL}${path}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
    const html = await response.text();
    assert.match(html, /<title>Hello, world!<\/title>/);
    assert.match(html, /<h1>Hello, world!<\/h1>/);
    assert.match(html, /<p>A little hello\. A world of possibilities\.<\/p>/);
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

test('served and built homepages preserve the exact approved footer', async () => {
  const served = await (await fetch(baseURL)).text();
  const built = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  for (const html of [served, built]) {
    const footers = [...html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/g)];
    assert.equal(footers.length, 1, 'homepage must contain one footer');
    assert.equal(footers[0][1], '<p>Autonomous delivery test A</p>');
  }
});

test('the start entry point launches and serves the homepage', { timeout: 10000 }, async (t) => {
  const child = spawn(process.execPath, ['scripts/server.js'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  t.after(async () => {
    child.kill();
    await exited;
  });

  let errors = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { errors += chunk; });
  const address = await new Promise((resolve, reject) => {
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (match) resolve(`http://127.0.0.1:${match[1]}`);
    });
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`Server exited with code ${code}: ${errors}`)));
  });

  const response = await fetch(address, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<h1>Hello, world!<\/h1>/);
  assert.equal(errors, '');
});

test('homepage removes questionnaire markup and scripts', async () => {
  const html = await (await fetch(baseURL)).text();
  assert.doesNotMatch(html, /<form|<fieldset|<input|quiz|questionnaire/i);
  assert.match(html, /class="ball-background" role="group" aria-label="Interactive background"/);
});
