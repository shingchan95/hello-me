import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Exercise the shipped script with only the DOM interfaces it needs. No network
// or storage APIs are supplied, so using either fails these interaction tests.
function quiz(answers = {}, valid = true) {
  let focused;
  const elements = Object.fromEntries(['quiz-form', 'quiz-result', 'result-heading', 'result-description', 'quiz-restart', 'first-input'].map((id) => [id, {
    hidden: true,
    textContent: '',
    listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    focus() { focused = id; },
  }]));
  const form = elements['quiz-form'];
  form.reportValidity = () => valid;
  form.reset = () => { answers = {}; };
  form.querySelector = () => elements['first-input'];
  runInNewContext(script, {
    document: { getElementById: (id) => elements[id] },
    FormData: class { get(name) { return answers[name] ?? null; } },
  });
  return {
    elements,
    get focused() { return focused; },
    submit() {
      let prevented = false;
      form.listeners.submit({ preventDefault() { prevented = true; } });
      assert.ok(prevented, 'submission must stay on the page');
    },
    restart() { elements['quiz-restart'].listeners.click(); },
  };
}

test('all 27 answer combinations produce the expected majority or balanced result', () => {
  const titles = { explorer: 'The curious explorer', maker: 'The thoughtful maker', connector: 'The warm connector' };
  for (const a of Object.keys(titles)) {
    for (const b of Object.keys(titles)) {
      for (const c of Object.keys(titles)) {
        const page = quiz({ weekend: a, curiosity: b, project: c });
        assert.equal(page.elements['quiz-form'].hidden, false);
        page.submit();
        const expected = a === b || a === c ? titles[a] : b === c ? titles[b] : 'A little of everything';
        assert.equal(page.elements['result-heading'].textContent, expected);
        assert.match(page.elements['result-description'].textContent, /Let’s start with:/);
        assert.equal(page.elements['quiz-result'].hidden, false);
        assert.equal(page.focused, 'result-heading');
      }
    }
  }
});

test('incomplete or invalid answers cannot produce a result', () => {
  for (const [answers, valid] of [[{}, false], [{ weekend: 'maker' }, true], [{ weekend: 'invalid', curiosity: 'maker', project: 'maker' }, true]]) {
    const page = quiz(answers, valid);
    page.submit();
    assert.equal(page.elements['quiz-result'].hidden, true);
    assert.equal(page.elements['result-heading'].textContent, '');
  }
});

test('restart clears answers and result and returns focus to the first choice', () => {
  const page = quiz({ weekend: 'maker', curiosity: 'maker', project: 'maker' });
  page.submit();
  page.restart();
  assert.equal(page.elements['quiz-result'].hidden, true);
  assert.equal(page.elements['result-heading'].textContent, '');
  assert.equal(page.elements['result-description'].textContent, '');
  assert.equal(page.focused, 'first-input');
  page.submit();
  assert.equal(page.elements['quiz-result'].hidden, true);
});

test('quiz provides native labelled groups, required answers, result announcements and a no-script explanation', () => {
  const groups = [...html.matchAll(/<fieldset>([\s\S]*?)<\/fieldset>/g)];
  assert.equal(groups.length, 3);
  for (const [i, group] of groups.entries()) {
    assert.match(group[1], /<legend>[^<]+<\/legend>/);
    const choices = [...group[1].matchAll(/<label><input type="radio" name="([^"]+)" value="([^"]+)" required \/>[^<]+<\/label>/g)];
    assert.equal(choices.length, 3);
    assert.deepEqual(choices.map((choice) => choice[1]), Array(3).fill(['weekend', 'curiosity', 'project'][i]));
    assert.deepEqual(choices.map((choice) => choice[2]), ['explorer', 'maker', 'connector']);
  }
  assert.match(html, /id="quiz-result" role="status" aria-live="polite" aria-atomic="true" hidden/);
  assert.match(html, /id="result-heading" tabindex="-1"/);
  assert.match(html, /<noscript>[\s\S]*Turn on JavaScript/);
  assert.match(html, /:focus-visible/);
});
