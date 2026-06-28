/** Unit tests for the shared quiz answer engine's pure helpers. */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../public/quiz-modes.js'), 'utf-8');
// The engine guards on `window.HocVuiQuiz`; give it a fresh fake window each load.
const fakeWindow = {};
new Function('window', 'document', src)(fakeWindow, undefined);
const Q = fakeWindow.HocVuiQuiz;

describe('HocVuiQuiz.correctText', () => {
  test('reads the correct option', () => {
    expect(Q.correctText({ option_a: '4', option_b: '5', correct_answer: 'a' })).toBe('4');
    expect(Q.correctText({ option_a: '4', option_b: '5', correct_answer: 'B' })).toBe('5');
  });
});

describe('HocVuiQuiz.typeable', () => {
  test('numbers up to 4 digits are typeable', () => {
    expect(Q.typeable({ option_a: '7', correct_answer: 'a' })).toBe(true);
    expect(Q.typeable({ option_a: '1234', correct_answer: 'a' })).toBe(true);
    expect(Q.typeable({ option_a: '12345', correct_answer: 'a' })).toBe(false);
  });
  test('short single words are typeable', () => {
    expect(Q.typeable({ option_a: 'mèo', correct_answer: 'a' })).toBe(true);
    expect(Q.typeable({ option_a: 'Hà Nội', correct_answer: 'a' })).toBe(false); // has space
  });
  test('empty answer not typeable', () => {
    expect(Q.typeable({ option_a: '', correct_answer: 'a' })).toBe(false);
  });
});
