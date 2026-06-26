/**
 * Answer Comparison Deep Scan Tests
 * 
 * The API returns correct_answer as lowercase ('a', 'b', 'c', 'd').
 * All games MUST use .toLowerCase() when comparing user selection to correct answer.
 * This test scans game.js files for unsafe comparison patterns.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Dangerous patterns: direct comparison without toLowerCase
// These regex patterns catch common bugs
const UNSAFE_PATTERNS = [
  // selected === correct_answer without toLowerCase
  /selected\s*===?\s*(?:q\.)?correct_answer(?!\s*\.toLowerCase)/,
  /(?:q\.)?correct_answer\s*===?\s*selected(?!\s*\.toLowerCase)/,
  // data-opt comparison without toLowerCase (only if no toLowerCase nearby)
  /dataset\.opt\s*===?\s*(?:q\.)?correct(?!.*toLowerCase)/,
];

// Safe patterns that indicate the comparison is properly handled
const SAFE_PATTERNS = [
  /\.toLowerCase\(\)\s*===?\s*.*\.toLowerCase\(\)/,
  /\.toLowerCase\(\)/,
];

function readGameJs(version) {
  const path = join('public', `v${version}`, 'game.js');
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

// Extract all answer comparison code blocks from game.js
function findComparisonBlocks(code) {
  const blocks = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only match lines that specifically compare to correct_answer (not just any "correct" variable)
    if (line.includes('correct_answer') &&
        (line.includes('===') || line.includes('=='))) {
      // Get context: 2 lines before and after
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length - 1, i + 2);
      const block = lines.slice(start, end + 1).join('\n');
      blocks.push({ line: i + 1, block, raw: line });
    }
  }
  return blocks;
}

describe('Answer Comparison Safety - All Versions', () => {
  for (let v = 2; v <= 60; v++) {
    const js = readGameJs(v);
    if (!js) continue;

    test(`V${v}: answer comparison uses .toLowerCase()`, () => {
      // If the file has answer comparison logic, it must use toLowerCase
      const hasComparison = js.includes('correct_answer') && 
        (js.includes('===') || js.includes('=='));
      
      if (!hasComparison) return; // No comparison found, skip

      // Check that toLowerCase is used somewhere in comparison context
      const hasToLowerCase = js.includes('.toLowerCase()');
      
      if (!hasToLowerCase) {
        // Find the dangerous lines for better error message
        const blocks = findComparisonBlocks(js);
        const dangerousBlocks = blocks.filter(b => 
          !b.block.includes('toLowerCase')
        );
        
        if (dangerousBlocks.length > 0) {
          const msg = dangerousBlocks.map(b => 
            `  Line ${b.line}: ${b.raw.trim()}`
          ).join('\n');
          expect.fail(
            `V${v}/game.js has answer comparison without .toLowerCase():\n${msg}`
          );
        }
      }
    });

    test(`V${v}: no direct uppercase comparison (A/B/C/D === correct)`, () => {
      // Check for patterns like: selected === 'A' or === 'B' compared to API response
      // The API returns lowercase, so comparing uppercase chars is a bug
      const dangerousPattern = /===?\s*['"]([A-D])['"].*correct|correct.*===?\s*['"]([A-D])['"](?!.*option)/g;
      const matches = [...js.matchAll(dangerousPattern)];
      
      // Filter out false positives (like label display "A. answer")
      const realIssues = matches.filter(m => {
        const context = js.substring(Math.max(0, m.index - 50), m.index + 50);
        return !context.includes('textContent') && !context.includes('innerHTML') && !context.includes('label');
      });
      
      expect(realIssues.length).toBe(0);
    });
  }
});

// ===== SPECIFIC KNOWN PATTERNS =====
describe('Known Answer Comparison Patterns', () => {
  test('V22 racing game uses toLowerCase in answer check', () => {
    const js = readGameJs(22);
    if (!js) return;
    // V22 had a known bug with case comparison
    expect(js).toContain('.toLowerCase()');
  });

  test('V28 fairy tales uses toLowerCase in answer check', () => {
    const js = readGameJs(28);
    if (!js) return;
    // V28 had a known bug
    expect(js).toContain('.toLowerCase()');
  });

  test('V30 puzzle party uses toLowerCase in handleFourChoice', () => {
    const js = readGameJs(30);
    if (!js) return;
    expect(js).toContain('.toLowerCase()');
  });

  test('V26 lucky wheel uses toLowerCase', () => {
    const js = readGameJs(26);
    if (!js) return;
    expect(js).toContain('.toLowerCase()');
  });

  test('V27 magic school uses toLowerCase', () => {
    const js = readGameJs(27);
    if (!js) return;
    expect(js).toContain('.toLowerCase()');
  });
});
