/** Unit tests for Lab "Vuốt Đúng Sai" (swipe) pure logic. */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../public/lab/swipe/game-logic.js'), 'utf-8');
const fakeWindow = {};
new Function('window', src)(fakeWindow);
const L = fakeWindow.LabSwipeLogic;

const q = { question_text: '5 + 3 = ?', option_a: '8', option_b: '7', option_c: '9', option_d: '6', correct_answer: 'a' };

describe('LabSwipeLogic.buildCard', () => {
  test('true card shows the correct answer in the statement', () => {
    const card = L.buildCard(q, { wantTrue: true });
    expect(card.isTrue).toBe(true);
    expect(card.statement).toBe('5 + 3 = 8');
    expect(card.shown).toBe('8');
  });
  test('false card shows a wrong answer', () => {
    const card = L.buildCard(q, { wantTrue: false, rng: () => 0 });
    expect(card.isTrue).toBe(false);
    expect(card.shown).not.toBe('8');
    expect(card.statement).not.toContain('= 8');
  });
  test('falls back to true when no distractors exist', () => {
    const single = { question_text: 'x = ?', option_a: '5', correct_answer: 'a' };
    const card = L.buildCard(single, { wantTrue: false });
    expect(card.isTrue).toBe(true);
  });
  test('non "= ?" questions use arrow form', () => {
    const vq = { question_text: 'Thủ đô Việt Nam?', option_a: 'Hà Nội', option_b: 'Huế', correct_answer: 'a' };
    const card = L.buildCard(vq, { wantTrue: true });
    expect(card.statement).toContain('→');
    expect(card.statement).toContain('Hà Nội');
  });
});

describe('LabSwipeLogic.judge', () => {
  test('correct when answer matches truth', () => {
    expect(L.judge({ isTrue: true }, true)).toBe(true);
    expect(L.judge({ isTrue: false }, false)).toBe(true);
    expect(L.judge({ isTrue: true }, false)).toBe(false);
    expect(L.judge({ isTrue: false }, true)).toBe(false);
  });
});

describe('LabSwipeLogic.starsFor', () => {
  test('tiers', () => {
    expect(L.starsFor(12, 12)).toBe(3);
    expect(L.starsFor(12, 9)).toBe(2);
    expect(L.starsFor(12, 6)).toBe(1);
    expect(L.starsFor(12, 2)).toBe(0);
  });
});
