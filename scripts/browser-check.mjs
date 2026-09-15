import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createSiteServer } from './server.js';
const server = process.env.SITE_URL ? null : createSiteServer();
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const siteURL = process.env.SITE_URL || `http://127.0.0.1:${server.address().port}`;
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
  const response = await page.goto(siteURL);
  assert.equal(response.status(), 200, 'homepage must load successfully');
  assert.equal(await response.text(), await readFile(new URL('../index.html', import.meta.url), 'utf8'),
    'served homepage must match this checkout, including when checking deployment');
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
  assert.equal(await page.locator('form, fieldset, input, #quiz-result').count(), 0);
  assert.equal(await page.getByText('Get to Know Me').count(), 0);
  assert.equal(await page.locator('.ball-background').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('.ball-background').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
  const balls = page.locator('.ball');
  assert.equal(await balls.count(), 4, 'four decorative balls must render');
  const colors = await balls.evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundImage));
  assert.equal(new Set(colors).size, 4, 'each ball must have a different color');
  for (const viewport of [{width: 320, height: 640}, {width: 768, height: 900}, {width: 1440, height: 900}]) {
    await page.setViewportSize(viewport);
    for (const ball of await balls.all()) {
      const positions = await ball.evaluate(el => {
        const animation = el.getAnimations()[0];
        animation.pause();
        return [0, 6000, 12000, 18000, 24000].map(time => {
          animation.currentTime = time;
          const rect = el.getBoundingClientRect();
          return {top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right};
        });
      });
      assert.ok(positions[0].top < positions[1].top && positions[1].top < positions[2].top, 'ball descends over twelve seconds');
      assert.ok(positions[2].top > positions[3].top && positions[3].top > positions[4].top, 'ball bounces back up');
      assert.ok(positions.every(p => p.top >= 0 && p.bottom <= viewport.height && p.left >= 0 && p.right <= viewport.width), `ball stays in the ${viewport.width}px viewport`);
    }
  }
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const ball of await balls.all()) {
    assert.equal(await ball.evaluate(el => el.getAnimations().length), 0, 'reduced motion disables every ball animation');
  }
  assert.equal(requests.length, 1, 'page must not make network requests');
  assert.deepEqual(errors, [], 'page must not produce browser errors');
  assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie]), [0, 0, '']);
  const noJS = await browser.newPage({javaScriptEnabled: false});
  await noJS.goto(siteURL);
  assert.equal(await noJS.getByRole('heading', {name: 'Hello, world!'}).isVisible(), true);
  assert.equal(await noJS.locator('.ball').count(), 4);
  for (const ball of await noJS.locator('.ball').all()) {
    assert.equal(await ball.isVisible(), true);
  }
  assert.equal(await noJS.locator('form').count(), 0);
  console.log('PASS: HTTP, responsive greeting, questionnaire removal, four distinct ball colors, slow bounce and reversal for every ball, reduced motion, no browser errors or external requests/storage, and JavaScript-disabled rendering.');
  console.log(`Verified homepage matches this checkout: ${siteURL}`);
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
