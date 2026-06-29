/** Simulates the catch mode render in a fake DOM and verifies chips get distinct
 * vertical rows and staggered horizontal positions (not all clumped at left). */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '..', 'public', 'quiz', 'mode-catch.js'), 'utf-8');

function makeStyle() {
  const store = {};
  return new Proxy(store, {
    get(t, k) { if (k === 'setProperty') return (n, v) => { t[n] = v; }; return t[k]; },
    set(t, k, v) { t[k] = v; return true; },
  });
}
function makeEl() {
  const children = [];
  const classes = new Set();
  return {
    style: makeStyle(), dataset: {}, children,
    classList: { add: (...c) => c.forEach(x => classes.add(x)), contains: c => classes.has(c), _set: classes },
    addEventListener() {}, appendChild(c) { children.push(c); },
    querySelectorAll() { return children.filter(c => c.__isChip); },
    set className(v) { this._cn = v; }, get className() { return this._cn || ''; },
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
  };
}

function bootstrap() {
  const win = {
    localStorage: { getItem: () => JSON.stringify({ grade: 0 }) },
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  };
  const doc = { createElement: () => makeEl(), body: { classList: { contains: () => false } } };
  win.HocVuiQuiz = {
    registerMode(id, def) { win.__mode = def; },
    helpers: {
      correctKey: () => 'a',
      optionList: () => [{ key: 'a', text: 'A' }, { key: 'b', text: 'B' }, { key: 'c', text: 'C' }, { key: 'd', text: 'D' }],
      shuffle: a => a,
      el: (tag, cls) => { const e = makeEl(); e.className = cls || ''; if ((cls || '').includes('qz-catch-chip')) e.__isChip = true; return e; },
    },
  };
  new Function('window', 'document', src)(win, doc);
  return win;
}

describe('catch mode chip distribution', () => {
  test('4 chips get 4 distinct top rows', () => {
    globalThis.requestAnimationFrame = () => 0;
    globalThis.cancelAnimationFrame = () => {};
    const win = bootstrap();
    const field = makeEl();
    const optionsEl = makeEl();
    // engine appends a field then chips go into it; emulate by capturing the field
    optionsEl.appendChild = (f) => { optionsEl.__field = f; };
    win.__mode.render({
      question: { question_text: 'Q', correct_answer: 'a', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' },
      questionEl: makeEl(), optionsEl, helpers: win.HocVuiQuiz.helpers,
      finish() {}, onReveal() {},
    });
    const chips = optionsEl.__field.children;
    expect(chips.length).toBe(4);
    const tops = chips.map(c => c.style.top);
    // all 4 chips on distinct vertical rows (anti-clump: they don't stack)
    expect(new Set(tops).size).toBe(4);
    // rows are spread across the field (0%..100%), not all at top
    const topNums = tops.map(t => parseFloat(t)).sort((a, b) => a - b);
    expect(topNums[0]).toBeLessThan(30);
    expect(topNums[topNums.length - 1]).toBeGreaterThan(70);
  });
});
