// Inject the modular quiz engine into v13–v40 games that use standard
// option_a/b/c/d + correct_answer pattern. Tries multiple regex patterns to
// match the option-rendering block, wraps it with HocVuiQuiz.render fallback.
// Idempotent; verifies parse, reverts on failure.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TARGETS = [13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40];

const HTML_SCRIPTS = `  <script src="/quiz/engine.js"></script>\n  <script src="/quiz/all.js"></script>\n  <script src="game.js"></script>`;
const CSS_LINK = '<link rel="stylesheet" href="/quiz/quiz-modes.css">';

// Multiple patterns to match option-rendering blocks across diverse games
const PATTERNS = [
  // Pattern A: ['a','b','c','d'].forEach(key => { ... handleAnswer(key) ... appendChild })
  {
    re: /\['a',\s*'b',\s*'c',\s*'d'\]\.forEach\(\s*\(?\s*(\w+)\s*\)?\s*=>\s*\{[\s\S]*?handleAnswer\(\s*\1\s*\)[\s\S]*?appendChild\([^)]*\);\s*\}\s*\);/,
    handler: 'handleAnswer',
  },
  // Pattern B: ['a','b','c','d'].forEach(key => { ... selectAnswer(key, ...) ... appendChild })
  {
    re: /\['a',\s*'b',\s*'c',\s*'d'\]\.forEach\(\s*\(?\s*(\w+)\s*\)?\s*=>\s*\{[\s\S]*?selectAnswer\(\s*\1[\s\S]*?appendChild\([^)]*\);\s*\}\s*\);/,
    handler: 'selectAnswer',
  },
  // Pattern C: options array forEach with option_a..d, generic handler
  {
    re: /\[\s*\{\s*key:\s*'[Aa]'[\s\S]*?key:\s*'[Dd]'[^;]*\][\s\S]*?\.forEach\(\s*\(?\s*(\w+)\s*\)?\s*=>\s*\{[\s\S]*?appendChild\([^)]*\);\s*\}\s*\);/,
    handler: null, // will try to detect from context
  },
];

function buildReplacement(optsVar, qVar, handler) {
  const onResult = handler === 'selectAnswer'
    ? `(ok, text) => { const ck = String((${qVar}.correct_answer || 'a')).toLowerCase(); ${handler}(ok ? ck : 'x', ${qVar}.correct_answer); }`
    : `(ok) => { const ck = String((${qVar}.correct_answer || 'a')).toLowerCase(); const wrong = ['a','b','c','d'].find(k => k !== ck) || 'b'; ${handler}(ok ? ck : wrong); }`;

  return `if (window.HocVuiQuiz && window.HocVuiQuiz.render) {
      window.HocVuiQuiz.render({ questionEl: null, optionsEl: ${optsVar}, question: ${qVar}, onResult: ${onResult} });
    } else {
      ['a','b','c','d'].forEach((key) => { const text = ${qVar}['option_' + key]; if (text == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = key; btn.textContent = text; btn.addEventListener('click', () => ${handler}(key)); ${optsVar}.appendChild(btn); });
    }`;
}

const report = [];
for (const v of TARGETS) {
  const dir = path.join('public', 'v' + v);
  const jsPath = path.join(dir, 'game.js');
  const htmlPath = path.join(dir, 'index.html');
  if (!fs.existsSync(jsPath) || !fs.existsSync(htmlPath)) { report.push(`v${v}: missing`); continue; }

  let js = fs.readFileSync(jsPath, 'utf8');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const jsBackup = js, htmlBackup = html;

  if (js.includes('HocVuiQuiz.render')) { report.push(`v${v}: already injected`); continue; }

  // Try to inject HTML first (safe — just adds script/css includes)
  let htmlChanged = false;
  if (!html.includes('/quiz/engine.js')) {
    if (html.includes('<script src="game.js"></script>')) {
      html = html.replace('  <script src="game.js"></script>', HTML_SCRIPTS);
      htmlChanged = true;
    } else if (html.includes('<script src="game.js"')) {
      // variant without exact spacing
      html = html.replace(/<script src="game\.js"><\/script>/, '<script src="/quiz/engine.js"></script>\n  <script src="/quiz/all.js"></script>\n  <script src="game.js"></script>');
      htmlChanged = true;
    }
  }
  if (!html.includes('/quiz/quiz-modes.css')) {
    const cssAnchor = html.match(/<link rel="stylesheet" href="style\.css"[^>]*>/);
    if (cssAnchor) {
      html = html.replace(cssAnchor[0], cssAnchor[0] + '\n  ' + CSS_LINK);
    }
  }

  // Save HTML changes (scripts + CSS are safe even without JS injection)
  if (htmlChanged || !htmlBackup.includes('/quiz/engine.js')) {
    fs.writeFileSync(htmlPath, html);
  }

  // Try JS patterns
  let jsChanged = false;
  for (const pat of PATTERNS) {
    const m = js.match(pat.re);
    if (!m) continue;
    const block = m[0];
    // Detect opts variable
    const optsMatch = block.match(/(\w+)\.appendChild\([^)]*\);\s*\}\s*\);$/);
    const optsVar = optsMatch ? optsMatch[1] : 'grid';
    // Detect question variable (common: q, question, currentQuestion, quiz)
    const qVar = js.includes('currentQuestion') ? 'currentQuestion'
      : js.includes('const q =') || js.includes('let q =') ? 'q'
      : 'q';
    const handler = pat.handler || (js.includes('handleAnswer') ? 'handleAnswer' : 'selectAnswer');
    js = js.replace(pat.re, buildReplacement(optsVar, qVar, handler));
    jsChanged = true;
    break;
  }

  if (jsChanged) {
    fs.writeFileSync(jsPath, js);
    try {
      execSync(`node --check "${jsPath}"`, { stdio: 'pipe' });
      report.push(`v${v}: OK (JS injected)`);
    } catch (e) {
      fs.writeFileSync(jsPath, jsBackup);
      report.push(`v${v}: PARSE FAIL — JS reverted (HTML kept)`);
    }
  } else {
    report.push(`v${v}: HTML only (no matching JS pattern — game uses custom render)`);
  }
}
console.log(report.join('\n'));
