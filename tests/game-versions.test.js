/**
 * Comprehensive smoke tests for all game versions (V2-V40)
 * Validates:
 * - HTML structure: required scripts, meta tags, language
 * - Game.js: case-insensitive answer comparison, no 2020+ emojis,
 *   session save, checkAndShowPrompt, subject options
 * - Cross-version consistency
 */

import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// All game versions that should exist
const VERSIONS = [];
for (let v = 2; v <= 40; v++) VERSIONS.push(v);

// Required scripts that must be present in every game HTML
const REQUIRED_SCRIPTS_ALL = [
  '/tts.js',
  '/link-gate.js',
];

// Scripts required from V5+ (reward system introduced later)
const V5_PLUS_SCRIPTS = [
  '/quest-widget.js',
  '/diamond-animation.js',
];

// Scripts only required from V12+
const V12_PLUS_SCRIPTS = ['/help-rules.js'];

// Required CSS
const REQUIRED_CSS = ['/tts.css'];

// Emojis introduced in 2020+ that cause rendering issues (show as squares)
// These should never appear in game files
const BANNED_EMOJI_PATTERNS = [
  '\u{1FA99}', // 🪙 coin (2020)
  '\u{1FABC}', // 🪼 jellyfish (2022)
  '\u{1FAB8}', // 🪸 coral (2022)
  '\u{1FAB4}', // 🪴 potted plant (2020)
  '\u{1FAA8}', // 🪨 rock (2020)
  '\u{1F9CA}', // 🧊 ice (2020)
  '\u{1FAB5}', // 🪵 wood (2020)
  '\u{1FA9F}', // 🪟 window (2020)
  '\u{1FAA2}', // 🪢 knot (2021)
  '\u{1FAE7}', // 🫧 bubbles (2022)
  '\u{1FA9A}', // 🪚 saw (2020)
  '\u{1FA9C}', // 🪜 ladder (2020)
  '\u{1FAD7}', // 🫗 pouring liquid (2022)
  '\u{1FAB7}', // 🪷 lotus (2022)
  '\u{1FAB9}', // 🪹 empty nest (2022)
  '\u{1FABA}', // 🪺 nest with eggs (2022)
  '\u{1FAA3}', // 🪣 bucket (2021)
  '\u{1FAA4}', // 🪤 mousetrap (2020)
  '\u{1FAA5}', // 🪥 toothbrush (2020)
  '\u{1FAA7}', // 🪧 placard (2020)
  '\u{1FA86}', // 🪆 nesting dolls (2020)
  '\u{1FAD0}', // 🫐 blueberries (2020)
  '\u{1FAD1}', // 🫑 bell pepper (2020)
  '\u{1FAD2}', // 🫒 olive (2020)
];

// Helper to read file content
function readGameFile(version, filename) {
  const path = join('public', `v${version}`, filename);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

// ===== HTML STRUCTURE TESTS =====
describe('HTML Structure - All Versions', () => {
  VERSIONS.forEach(v => {
    describe(`V${v}`, () => {
      const html = readGameFile(v, 'index.html');

      test(`V${v}/index.html exists`, () => {
        expect(html).not.toBeNull();
      });

      if (!html) return;

      test('has Vietnamese lang attribute', () => {
        expect(html).toMatch(/lang=["']vi["']/);
      });

      test('has UTF-8 charset', () => {
        expect(html.toLowerCase()).toMatch(/charset=["']?utf-8["']?/);
      });

      test('has mobile viewport meta', () => {
        expect(html).toContain('viewport');
        expect(html).toContain('width=device-width');
      });

      test('includes local game.js', () => {
        expect(html).toMatch(/src=["']game\.js["']/);
      });

      test('includes local style.css', () => {
        expect(html).toMatch(/href=["']style\.css["']/);
      });

      REQUIRED_SCRIPTS_ALL.forEach(script => {
        test(`includes required script: ${script}`, () => {
          expect(html).toContain(script);
        });
      });

      if (v >= 5) {
        V5_PLUS_SCRIPTS.forEach(script => {
          test(`includes required script (V5+): ${script}`, () => {
            expect(html).toContain(script);
          });
        });
      }

      if (v >= 12) {
        V12_PLUS_SCRIPTS.forEach(script => {
          test(`includes required script (V12+): ${script}`, () => {
            expect(html).toContain(script);
          });
        });
      }

      REQUIRED_CSS.forEach(css => {
        test(`includes required CSS: ${css}`, () => {
          expect(html).toContain(css);
        });
      });

      test('has home link back to / or /home.html', () => {
        const hasHomeLink = html.match(/href=["']\/["']/) || html.includes('/home.html') || html.includes('href="/"');
        expect(hasHomeLink).toBeTruthy();
      });

      test('has a title element', () => {
        expect(html).toMatch(/<title>.+<\/title>/s);
      });
    });
  });
});

// ===== GAME.JS CODE QUALITY TESTS =====
describe('Game.js Code Quality - All Versions', () => {
  VERSIONS.forEach(v => {
    describe(`V${v}`, () => {
      const js = readGameFile(v, 'game.js');

      test(`V${v}/game.js exists`, () => {
        expect(js).not.toBeNull();
      });

      if (!js) return;

      // V13+ have simpler patterns; older games use complex template literals
      // that make static brace counting unreliable
      if (v >= 13) {
        test('has no syntax errors (basic check: balanced braces)', () => {
        let braces = 0;
        let parens = 0;
        let brackets = 0;
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inTemplate = false;
        let templateDepth = 0;
        let inLineComment = false;
        let inBlockComment = false;
        let escaped = false;

        for (let i = 0; i < js.length; i++) {
          const ch = js[i];
          const next = js[i + 1];

          if (escaped) { escaped = false; continue; }
          if (ch === '\\') { escaped = true; continue; }

          // Comments
          if (inLineComment) { if (ch === '\n') inLineComment = false; continue; }
          if (inBlockComment) { if (ch === '*' && next === '/') { inBlockComment = false; i++; } continue; }
          if (!inSingleQuote && !inDoubleQuote && !inTemplate) {
            if (ch === '/' && next === '/') { inLineComment = true; continue; }
            if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
          }

          // String literals
          if (ch === "'" && !inDoubleQuote && !inTemplate) { inSingleQuote = !inSingleQuote; continue; }
          if (ch === '"' && !inSingleQuote && !inTemplate) { inDoubleQuote = !inDoubleQuote; continue; }
          if (inSingleQuote || inDoubleQuote) continue;

          // Template literals (simplified: skip content between backticks)
          if (ch === '`') { inTemplate = !inTemplate; continue; }
          if (inTemplate) continue;

          // Count
          if (ch === '{') braces++;
          else if (ch === '}') braces--;
          else if (ch === '(') parens++;
          else if (ch === ')') parens--;
          else if (ch === '[') brackets++;
          else if (ch === ']') brackets--;
        }
        expect(braces).toBe(0);
        expect(parens).toBe(0);
        expect(brackets).toBe(0);
      });
      }

      test('uses .toLowerCase() for answer comparison (if applicable)', () => {
        // Only check V13+ (older versions tested separately in answer-comparison.test.js)
        if (v < 13) return;
        // If the file compares to correct_answer directly, it should use toLowerCase
        const hasDirectCompare = js.includes('=== q.correct_answer') || js.includes('== q.correct_answer');
        if (hasDirectCompare) {
          expect(js).toContain('.toLowerCase()');
        }
      });

      test('has no banned 2020+ emojis', () => {
        const found = [];
        for (const emoji of BANNED_EMOJI_PATTERNS) {
          if (js.includes(emoji)) {
            found.push(emoji);
          }
        }
        expect(found).toEqual([]);
      });

      test('fetches questions from /api/questions', () => {
        expect(js).toContain('/api/questions');
      });

      // V13+ should save sessions (V26=lucky wheel, V28=fairy tales are special modes)
      if (v >= 13 && v !== 26 && v !== 28) {
        test('saves session to /api/sessions', () => {
          expect(js).toContain('/api/sessions');
        });
      }

      // V13+ should call checkAndShowPrompt (older versions have varied patterns)
      if (v >= 13) {
        test('calls checkAndShowPrompt after game ends', () => {
          expect(js).toContain('checkAndShowPrompt');
        });
      }

      // V13+ use strict mode or IIFE for scope isolation (older versions use varied patterns)
      if (v >= 13) {
        test('uses strict mode or IIFE for scope isolation', () => {
          const hasStrict = js.includes("'use strict'") || js.includes('"use strict"');
          const hasIIFE = js.includes('(function()') || js.includes('(function ()') || js.includes('(() =>');
          const hasModule = js.includes('import ') || js.includes('export ');
          expect(hasStrict || hasIIFE || hasModule).toBe(true);
        });
      }
    });
  });
});

// ===== STYLE.CSS EXISTS =====
describe('Style.css - All Versions', () => {
  VERSIONS.forEach(v => {
    test(`V${v}/style.css exists`, () => {
      const css = readGameFile(v, 'style.css');
      expect(css).not.toBeNull();
    });
  });
});

// ===== EMOJI COMPATIBILITY IN HTML =====
describe('Emoji Compatibility - HTML Files', () => {
  VERSIONS.forEach(v => {
    test(`V${v}/index.html has no banned 2020+ emojis`, () => {
      const html = readGameFile(v, 'index.html');
      if (!html) return;
      const found = [];
      for (const emoji of BANNED_EMOJI_PATTERNS) {
        if (html.includes(emoji)) {
          found.push(emoji);
        }
      }
      expect(found).toEqual([]);
    });
  });
});

// ===== EMOJI COMPATIBILITY IN CSS =====
describe('Emoji Compatibility - CSS Files', () => {
  VERSIONS.forEach(v => {
    test(`V${v}/style.css has no banned 2020+ emojis`, () => {
      const css = readGameFile(v, 'style.css');
      if (!css) return;
      const found = [];
      for (const emoji of BANNED_EMOJI_PATTERNS) {
        if (css.includes(emoji)) {
          found.push(emoji);
        }
      }
      expect(found).toEqual([]);
    });
  });
});

// ===== SUBJECT OPTIONS =====
describe('Subject Options - All Versions (V13+)', () => {
  // V13+ should support math at minimum, and ideally all 3 subjects
  for (let v = 13; v <= 40; v++) {
    describe(`V${v}`, () => {
      const html = readGameFile(v, 'index.html');
      const js = readGameFile(v, 'game.js');

      if (!html || !js) return;

      test('supports math subject', () => {
        const hasMathInHTML = html.includes('math') || html.includes('Toán');
        const hasMathInJS = js.includes("'math'") || js.includes('"math"');
        expect(hasMathInHTML || hasMathInJS).toBe(true);
      });

      // Games with subject selectors in HTML must support all 3
      const hasSubjectSelector = html.includes('data-subject') || html.includes('subj-btn') || html.includes('subject-btn');
      if (hasSubjectSelector) {
        test('subject selector includes English', () => {
          const has = html.includes('english') || html.includes('English');
          expect(has).toBe(true);
        });

        test('subject selector includes Vietnamese', () => {
          const has = html.includes('vietnamese') || html.includes('Tiếng Việt');
          expect(has).toBe(true);
        });
      } else {
        // Games without selector should at least reference multiple subjects in JS
        test('JS includes multiple subjects (or is a single-subject game)', () => {
          const hasMath = js.includes("'math'") || js.includes('"math"');
          const hasViet = js.includes("'vietnamese'") || js.includes('"vietnamese"');
          const hasEnglish = js.includes("'english'") || js.includes('"english"');
          // Either supports all 3, or is a specialized single-subject game (acceptable)
          const multiSubject = hasMath && hasViet && hasEnglish;
          const singleSubjectOk = hasMath; // At minimum must have math
          expect(multiSubject || singleSubjectOk).toBe(true);
        });
      }
    });
  }
});
