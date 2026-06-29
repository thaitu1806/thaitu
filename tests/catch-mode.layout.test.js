/** Verifies catch mode lays chips out across the full width (one row each) and
 * that the young-learner CSS does NOT force chips to width:100% (the bug that
 * made them clump on the left edge). */
import { describe, test, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'public', 'quiz');
function read(f) { return readFileSync(join(root, f), 'utf-8'); }

describe('catch mode layout', () => {
  test('CSS does not force .qz-catch-chip / .qz-tap-chip to width:100% under qz-young', () => {
    const css = read('quiz-modes.css');
    // The blanket young option-btn rule must NOT include width:100%
    const block = css.match(/\.qz-young \.option-btn \{[^}]*\}/);
    expect(block, 'young option-btn block should exist').toBeTruthy();
    expect(block[0]).not.toMatch(/width:\s*100%/);
    // width:100% should only be scoped to the choice grid
    expect(css).toMatch(/\.qz-young \.qz-mode-choice \.option-btn \{[^}]*width:\s*100%/);
    // chips explicitly reset to auto
    expect(css).toMatch(/\.qz-young \.qz-catch-chip \{[^}]*width:\s*auto/);
  });

  test('each chip gets its own row (top set) and travels full width via the animation loop', () => {
    const js = read('mode-catch.js');
    // chip vertical placement uses per-index row
    expect(js).toMatch(/chip\.style\.top\s*=\s*\(\(\(i \+ 0\.5\)\s*\/\s*n\)/);
    // horizontal travel bounds near both edges
    expect(js).toMatch(/c\.x\s*>\s*92/);
    expect(js).toMatch(/c\.x\s*<\s*8/);
    // left is set as a percentage each frame
    expect(js).toMatch(/c\.el\.style\.left\s*=\s*c\.x\s*\+\s*'%'/);
  });
});
