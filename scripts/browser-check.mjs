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
  // Keep the reviewed fictional copy explicit so personal details cannot be
  // introduced silently, even when the served HTML matches the checkout.
  assert.deepEqual(await page.locator('main p').allTextContents(), [
    'A little hello. A world of possibilities.',
    'Explore this fictional template, or click a background ball to give it a bounce.',
    'A placeholder for an imaginary creator with a love of playful ideas. This is a fictional template, with no personal biography.',
    'Imagine a moon garden, a cloud library, or a tiny city of paper. These sample projects are fictional placeholders.',
    'A space for future contact options. This template does not include real contact details or collect messages.',
  ], 'template copy must match the reviewed fictional placeholders');
  assert.deepEqual(await page.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))),
    ['#home', '#about', '#projects', '#contact'], 'template links must remain local placeholders');
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
  assert.equal(await page.getByRole('group', {name: 'Interactive background'}).count(), 1);
  assert.equal(await page.locator('.ball-background').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
  const balls = page.locator('.ball');
  assert.equal(await balls.count(), 4, 'four interactive balls must render');
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
  for (const viewport of [{width: 320, height: 640}, {width: 1440, height: 900}]) {
    await page.setViewportSize(viewport);
    for (const name of ['About', 'Projects', 'Contact', 'Home']) {
      await page.getByRole('link', {name, exact: true}).click();
      assert.equal(new URL(page.url()).hash, '#' + name.toLowerCase());
      const bounds = await page.locator('#' + name.toLowerCase()).boundingBox();
      assert.ok(bounds.y < viewport.height && bounds.y + bounds.height > 0, 'navigation reaches section');
    }
    await page.evaluate(() => scrollTo(0, 0));
    const ball = balls.first();
    await ball.evaluate(el => { el.getAnimations()[0].currentTime = 0; });
    const bounds = await ball.boundingBox();
    await page.mouse.click(bounds.x + bounds.width / 2, 8);
    assert.equal(await ball.evaluate(el => el.getAnimations().length), 2, 'pointer click starts extra bounce');
    const offsets = await ball.evaluate(el => {
      const animation = el.getAnimations()[1];
      animation.pause();
      return [0, 115, 700].map(time => {
        animation.currentTime = time;
        return el.getBoundingClientRect().top;
      });
    });
    assert.ok(offsets[1] > offsets[0] + 20, 'click visibly moves ball');
    assert.ok(Math.abs(offsets[2] - offsets[0]) < 1, 'click bounce returns to start');
    await ball.focus();
    for (const key of ['Enter', 'Space']) {
      await page.keyboard.press(key);
      assert.equal(await ball.evaluate(el => el.getAnimations().length), 2, 'keyboard activation restarts bounce');
    }
  }
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const ball of await balls.all()) {
    assert.equal(await ball.evaluate(el => el.getAnimations().length), 0, 'reduced motion disables every ball animation');
  }
  await balls.first().focus();
  await page.keyboard.press('Enter');
  assert.equal(await balls.first().evaluate(el => el.getAnimations().length), 0);
  assert.equal(requests.length, 1, 'page must not make network requests');
  assert.deepEqual(errors, [], 'page must not produce browser errors');
  assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie]), [0, 0, '']);
  // Exercise touch input as well as a narrow desktop viewport. Use a fresh
  // context to test reduced motion both at page load and after a preference change.
  const mobile = await browser.newPage({
    viewport: {width: 320, height: 640}, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce',
  });
  await mobile.goto(siteURL);
  assert.equal(await mobile.locator('.ball').evaluateAll(elements =>
    elements.every(el => el.getAnimations().length === 0)), true,
  'initial reduced-motion preference disables every animation');
  const amber = mobile.getByRole('button', {name: 'Bounce amber ball', exact: true});
  const amberBounds = await amber.boundingBox();
  // The card covers the center; tap the exposed right edge of the circle.
  await amber.tap({position: {x: amberBounds.width - 4, y: amberBounds.height / 2}});
  assert.equal(await mobile.locator('.ball').evaluateAll(elements =>
    elements.every(el => el.getAnimations().length === 0)), true,
  'touch activation respects reduced motion');
  for (const name of ['About', 'Projects', 'Contact', 'Home']) {
    await mobile.getByRole('link', {name, exact: true}).tap();
    assert.equal(new URL(mobile.url()).hash, '#' + name.toLowerCase());
    const bounds = await mobile.locator('#' + name.toLowerCase()).boundingBox();
    assert.ok(bounds.y < 640 && bounds.y + bounds.height > 0,
      `touch navigation brings ${name} into view`);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
  await mobile.emulateMedia({reducedMotion: 'no-preference'});
  await mobile.evaluate(() => scrollTo(0, 0));
  const touchBall = mobile.locator('.ball').first();
  await touchBall.evaluate(el => {
    const animation = el.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
  });
  const touchBounds = await touchBall.boundingBox();
  await mobile.touchscreen.tap(touchBounds.x + touchBounds.width / 2, 8);
  const touchPositions = await touchBall.evaluate(el => {
    const animation = el.getAnimations().find(animation => animation.animationName !== 'bounce');
    if (!animation) return [];
    animation.pause();
    return [0, 115, 700].map(time => {
      animation.currentTime = time;
      return el.getBoundingClientRect().top;
    });
  });
  assert.equal(touchPositions.length, 3, 'touch starts an extra bounce');
  assert.ok(touchPositions[1] > touchPositions[0] + 20, 'touch visibly moves the ball');
  assert.ok(Math.abs(touchPositions[2] - touchPositions[0]) < 1, 'touch bounce returns to start');
  await mobile.close();
  console.log('PASS: 320px mobile touch bounce and all four navigation links; reduced motion on initial load and touch activation.');
  const noJS = await browser.newPage({javaScriptEnabled: false});
  await noJS.goto(siteURL);
  assert.equal(await noJS.getByRole('heading', {name: 'Hello, world!'}).isVisible(), true);
  assert.equal(await noJS.locator('.ball').count(), 4);
  for (const ball of await noJS.locator('.ball').all()) {
    assert.equal(await ball.isVisible(), true);
  }
  await noJS.getByRole('link', {name: 'About', exact: true}).click();
  assert.equal(new URL(noJS.url()).hash, '#about');
  assert.equal(await noJS.locator('form').count(), 0);
  console.log('PASS: fictional placeholder copy and links, click and keyboard bounce, responsive section navigation, HTTP, responsive greeting, questionnaire removal, four distinct ball colors, slow bounce and reversal for every ball, reduced motion, no browser errors or external requests/storage, and JavaScript-disabled rendering.');
  console.log(`Verified homepage matches this checkout: ${siteURL}`);
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
