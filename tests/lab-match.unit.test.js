/**
 * Unit tests for the Lab "Nối Cặp" (match) pure logic.
 */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// The logic file is a browser IIFE that attaches to window.LabMatchLogic.
// The project is ESM ("type":"module"), so load + eval it with a fake window.
const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../public/lab/match/game-logic.js'), 'utf-8');
const fakeWindow = {};
// eslint-disable-next-line no-new-func
new Function('window', src)(fakeWindow);
const L = fakeWindow.LabMatchLogic;

function q(id, text, a, b, c, d, correct) {
  return { id, question_text: text, option_a: a, option_b: b, option_c: c, option_d: d, correct_answer: correct };
}

describe('LabMatchLogic.correctText', () => {
  test('returns the correct option text', () => {
    expect(L.correctText(q(1, '2+2=?', '3', '4', '5', '6', 'b'))).toBe('4');
    expect(L.correctText(q(2, 'x', 'A', 'B', 'C', 'D', 'd'))).toBe('D');
  });
  test('handles uppercase correct_answer', () => {
    expect(L.correctText({ question_text: 'q', option_a: 'yes', correct_answer: 'A' })).toBe('yes');
  });
});

describe('LabMatchLogic.buildRound', () => {
  const pool = [
    q(1, '1+1=?', '2', '0', '0', '0', 'a'),
    q(2, '2+2=?', '4', '0', '0', '0', 'a'),
    q(3, '3+3=?', '6', '0', '0', '0', 'a'),
    q(4, '4+4=?', '8', '0', '0', '0', 'a'),
    q(5, '5+5=?', '10', '0', '0', '0', 'a'),
  ];

  test('builds the requested number of pairs', () => {
    const { pairs } = L.buildRound(pool, 3, 0);
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toHaveProperty('left');
    expect(pairs[0]).toHaveProperty('right');
  });

  test('nextOffset advances past consumed questions', () => {
    const { nextOffset } = L.buildRound(pool, 2, 0);
    expect(nextOffset).toBe(2);
  });

  test('skips duplicate right answers within a round', () => {
    const dupPool = [
      q(1, 'a=?', '5', '0', '0', '0', 'a'),
      q(2, 'b=?', '5', '0', '0', '0', 'a'), // same right text "5"
      q(3, 'c=?', '7', '0', '0', '0', 'a'),
    ];
    const { pairs } = L.buildRound(dupPool, 3, 0);
    const rights = pairs.map(p => p.right);
    expect(new Set(rights).size).toBe(rights.length);
  });

  test('skips questions with empty correct answer', () => {
    const badPool = [
      { id: 1, question_text: 'x', option_a: '', correct_answer: 'a' },
      q(2, 'ok=?', '3', '0', '0', '0', 'a'),
    ];
    const { pairs } = L.buildRound(badPool, 2, 0);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].right).toBe('3');
  });
});

describe('LabMatchLogic.makeColumns', () => {
  test('left preserves order, both columns same length', () => {
    const pairs = [
      { id: 'a', left: 'L1', right: 'R1' },
      { id: 'b', left: 'L2', right: 'R2' },
      { id: 'c', left: 'L3', right: 'R3' },
    ];
    const seq = [0.9, 0.1, 0.5, 0.2];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const { left, right } = L.makeColumns(pairs, rng);
    expect(left.map(x => x.text)).toEqual(['L1', 'L2', 'L3']);
    expect(right).toHaveLength(3);
    expect(new Set(right.map(x => x.pairId))).toEqual(new Set(['a', 'b', 'c']));
  });
});

describe('LabMatchLogic.isMatch', () => {
  test('true only when pair ids equal', () => {
    expect(L.isMatch('a', 'a')).toBe(true);
    expect(L.isMatch('a', 'b')).toBe(false);
    expect(L.isMatch(null, null)).toBe(false);
  });
});

describe('LabMatchLogic.starsFor', () => {
  test('3 stars for near-perfect', () => {
    expect(L.starsFor(20, 0)).toBe(3);
    expect(L.starsFor(20, 2)).toBe(3);
  });
  test('2 stars for moderate mistakes', () => {
    expect(L.starsFor(20, 5)).toBe(2);
  });
  test('1 star for many mistakes', () => {
    expect(L.starsFor(20, 15)).toBe(1);
  });
  test('0 for no pairs', () => {
    expect(L.starsFor(0, 0)).toBe(0);
  });
});
