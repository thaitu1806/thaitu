/** Unit tests for the modular quiz engine + helpers + mode registration. */
import { describe, test, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'public', 'quiz');
function read(f) { return readFileSync(join(root, f), 'utf-8'); }

// Build a minimal fake window/document and load engine + modes into it.
function bootstrap() {
  const win = {};
  // minimal document stub: only what mode canUse/helpers touch at registration time
  const doc = { createElement: () => ({ classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, appendChild() {}, style: { setProperty() {} } }) };
  const load = (src) => new Function('window', 'document', src)(win, doc);
  load(read('engine.js'));
  load(read('mode-choice.js'));
  load(read('mode-truefalse.js'));
  load(read('mode-type.js'));
  load(read('mode-tap.js'));
  load(read('mode-mystery.js'));
  load(read('mode-slider.js'));
  load(read('mode-eliminate.js'));
  load(read('mode-catch.js'));
  load(read('mode-balloon.js'));
  load(read('mode-whack.js'));
  load(read('mode-scratch.js'));
  return win.HocVuiQuiz;
}

let Q;
beforeEach(() => { Q = bootstrap(); });

const numQ = { question_text: '2+2=?', option_a: '4', option_b: '5', option_c: '3', option_d: '6', correct_answer: 'a' };
const wordQ = { question_text: 'Con gì kêu meo?', option_a: 'Mèo', option_b: 'Chó', option_c: 'Gà', option_d: 'Vịt', correct_answer: 'a' };
const longQ = { question_text: 'Thủ đô VN?', option_a: 'Thành phố Hà Nội', option_b: 'Huế', option_c: 'Đà Nẵng', option_d: 'Cần Thơ', correct_answer: 'a' };

describe('engine helpers', () => {
  test('correctText reads correct option (any case)', () => {
    expect(Q.helpers.correctText(numQ)).toBe('4');
    expect(Q.helpers.correctText({ option_a: 'x', option_b: 'y', correct_answer: 'B' })).toBe('y');
  });
  test('isShortAnswer detects numbers and short words', () => {
    expect(Q.helpers.isShortAnswer(numQ)).toBe(true);
    expect(Q.helpers.isShortAnswer(wordQ)).toBe(true);
    expect(Q.helpers.isShortAnswer(longQ)).toBe(false); // has spaces / long
  });
});

describe('mode registration', () => {
  test('all eleven modes register', () => {
    const ids = Q.listModes();
    ['choice', 'truefalse', 'type', 'tap', 'mystery', 'slider', 'eliminate', 'catch', 'balloon', 'whack', 'scratch'].forEach(id => {
      expect(ids).toContain(id);
    });
  });
});

describe('engine: modes queued before engine still register', () => {
  test('pending queue flushes', () => {
    const win = {};
    const doc = { createElement: () => ({ classList: { add() {} }, addEventListener() {}, appendChild() {}, setAttribute() {}, style: { setProperty() {} } }) };
    const load = (src) => new Function('window', 'document', src)(win, doc);
    // load a mode BEFORE the engine
    load(read('mode-choice.js'));
    expect(Array.isArray(win.__hvQuizPending)).toBe(true);
    load(read('engine.js'));
    expect(win.HocVuiQuiz.hasMode('choice')).toBe(true);
  });
});
