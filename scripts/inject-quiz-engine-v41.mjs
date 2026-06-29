// Inject the modular quiz engine into the v41–v46 group, which uses
// handleAnswer(selectedKey|selected) reading `currentQuestion`. The engine
// returns a boolean ok; we synthesize a letter key so the game's existing
// answer handler (which highlights via .option-btn and runs game logic) keeps
// working unchanged. Idempotent; verifies parse, reverts on failure.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TARGETS = [41, 42, 43, 44, 45, 46];

// Render block: ['a','b','c','d'].forEach( (key)|k => { ... option_ ... handleAnswer(key) ... appendChild })
const OPT_RE = /\['a',\s*'b',\s*'c',\s*'d'\]\.forEach\(\s*\(?\s*(\w+)\s*\)?\s*=>\s*\{[\s\S]*?option_[\s\S]*?handleAnswer\(\s*\1\s*\)[\s\S]*?appendChild\([^)]*\);\s*\}\s*\);/;

function renderReplacement(optsVar, qVar) {
  return `if (window.HocVuiQuiz && window.HocVuiQuiz.render) {
      window.HocVuiQuiz.render({ questionEl: $('q-text'), optionsEl: ${optsVar}, question: ${qVar}, onResult: (ok) => {
        const ck = String((${qVar}.correct_answer || 'a')).toLowerCase();
        const wrong = ['a','b','c','d'].find(k => k !== ck) || 'b';
        handleAnswer(ok ? ck : wrong);
      } });
    } else {
      ['a','b','c','d'].forEach((key) => { const text = ${qVar}['option_' + key]; if (text == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = key; btn.textContent = text; btn.addEventListener('click', () => handleAnswer(key)); ${optsVar}.appendChild(btn); });
    }`;
}

// The engine renders its own buttons, so the game's handler should NOT clear/skip
// its highlight loop — engine already applied .correct/.wrong. But the handler
// still re-applies highlight by dataset.key, which is harmless since the engine
// buttons carry the same dataset.key. So no handler edit needed.

const HTML_SCRIPTS = `  <script src="/quiz/engine.js"></script>\n  <script src="/quiz/all.js"></script>\n  <script src="game.js"></script>`;
const CSS_LINK = '<link rel="stylesheet" href="/quiz/quiz-modes.css">';

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

  const m = js.match(OPT_RE);
  if (!m) { report.push(`v${v}: MISS render`); continue; }

  // Determine the options variable name from the matched block.
  const block = m[0];
  const optsVarMatch = block.match(/(\w+)\.appendChild\([^)]*\);\s*\}\s*\);$/);
  const optsVar = optsVarMatch ? optsVarMatch[1] : 'optionsEl';
  // Question variable: these games use currentQuestion.
  const qVar = 'currentQuestion';

  js = js.replace(OPT_RE, renderReplacement(optsVar, qVar));

  // HTML: add engine scripts before game.js
  if (!html.includes('/quiz/engine.js')) {
    if (html.includes('  <script src="game.js"></script>')) html = html.replace('  <script src="game.js"></script>', HTML_SCRIPTS);
    else { report.push(`v${v}: html game.js include not found`); continue; }
  }
  // HTML: add quiz-modes.css
  if (!html.includes('/quiz/quiz-modes.css')) {
    const anchor = '<link rel="stylesheet" href="style.css">';
    if (html.includes(anchor)) html = html.replace(anchor, anchor + '\n  ' + CSS_LINK);
  }

  fs.writeFileSync(jsPath, js);
  fs.writeFileSync(htmlPath, html);
  try {
    execSync(`node --check "${jsPath}"`, { stdio: 'pipe' });
    report.push(`v${v}: OK (opts=${optsVar})`);
  } catch (e) {
    fs.writeFileSync(jsPath, jsBackup);
    fs.writeFileSync(htmlPath, htmlBackup);
    report.push(`v${v}: PARSE FAIL — reverted`);
  }
}
console.log(report.join('\n'));
