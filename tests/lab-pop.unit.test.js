/** Unit tests for Lab "Bắn Bong Bóng" (pop) pure logic. */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../public/lab/pop/game-logic.js'), 'utf-8');
const fakeWindow = {};
new Function('window', src)(fakeWindow);
const L = fakeWindow.LabPopLogic;

const q = { question_text: '2+2=?', option_a: '4', option_b: '3', option_c: '5', option_d: '6', correct_answer: 'a' };

describe('LabPopLogic.buildChoices', () => {
  test('includes the correct answer marked correct', () => {
    const ch = L.buildChoices(q);
    const c = ch.find(x => x.correct);
    expect(c).toBeTruthy();
    expect(c.text).toBe('4');
  });
  test('returns all distinct options', () => {
    const ch = L.buildChoices(q);
    expect(ch).toHaveLength(4);
    expect(new Set(ch.map(x => x.text)).size).toBe(4);
  });
  test('exactly one correct choice', () => {
    const ch = L.buildChoices(q);
    expect(ch.filter(x => x.correct)).toHaveLength(1);
  });
  test('dedupes identical option texts', () => {
    const dup = { question_text: 'x', option_a: '4', option_b: '4', option_c: '5', option_d: '6', correct_answer: 'a' };
    const ch = L.buildChoices(dup);
    expect(new Set(ch.map(x => x.text)).size).toBe(ch.length);
  });
});

describe('LabPopLogic.starsFor', () => {
  test('3 stars for >=90%', () => { expect(L.starsFor(10, 9)).toBe(3); });
  test('2 stars for >=60%', () => { expect(L.starsFor(10, 6)).toBe(2); });
  test('1 star for >=30%', () => { expect(L.starsFor(10, 3)).toBe(1); });
  test('0 stars for low', () => { expect(L.starsFor(10, 1)).toBe(0); });
});
