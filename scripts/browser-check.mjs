import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createSiteServer } from './server.js';
const server = createSiteServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const page = await browser.newPage({viewport: {width: 320, height: 640}});
  const requests = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', request => requests.push(request.url()));
  const response = await page.goto(`http://127.0.0.1:${server.address().port}`);
  assert.equal(response.status(), 200, 'homepage must load successfully');
  assert.equal(await page.title(), 'Hello, world!');
  for (const viewport of [{width: 320, height: 640}, {width: 768, height: 900}, {width: 1440, height: 900}]) {
    await page.setViewportSize(viewport);
    const greeting = page.getByRole('heading', {name: 'Hello, world!', level: 1, exact: true});
    assert.equal(await greeting.count(), 1);
    assert.equal(await greeting.isVisible(), true);
    const bounds = await greeting.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width && bounds.y + bounds.height <= viewport.height,
      `greeting must fit in the initial ${viewport.width}px viewport`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
  await page.setViewportSize({width: 320, height: 640});
  await page.getByRole('button', {name: 'Show my result'}).click();
  assert.equal(await page.locator('#quiz-result').isVisible(), false);
  await page.locator('input').first().focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#result-heading').textContent(), 'The curious explorer');
  assert.equal(await page.locator('#result-heading').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('input:checked').count(), 0);
  assert.equal(await page.locator('#quiz-result').isVisible(), false);
  assert.equal(await page.locator('input').first().evaluate(el => el === document.activeElement), true);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
  assert.equal(requests.length, 1, 'quiz must not make network requests');
  assert.deepEqual(errors, [], 'quiz must not produce browser errors');
  assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie]), [0, 0, '']);
  const noJS = await browser.newPage({javaScriptEnabled: false});
  await noJS.goto(`http://127.0.0.1:${server.address().port}`);
  assert.equal(await noJS.getByRole('heading', {name: 'Hello, world!'}).isVisible(), true);
  assert.equal(await noJS.locator('noscript').isVisible(), true);
  assert.equal(await noJS.locator('#quiz-form').isVisible(), false);
  console.log('PASS: homepage HTTP status, title and greeting in mobile/tablet/desktop viewports, browser keyboard flow, required validation, result focus, restart, 320/768/1440px layout, no runtime/console errors, no answer requests/storage, and no-JavaScript fallback.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
