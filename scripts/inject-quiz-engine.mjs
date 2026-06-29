// Controlled transform: inject the modular quiz engine into v48-template games.
// Uses tolerant regexes (whitespace/line-ending agnostic) and verifies each file
// still parses; reverts that file if not. Idempotent (skips already-injected).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TARGETS = [2, 6, 7, 8, 9, 10, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];

// Match the option-render forEach block:  ['a','b','c','d'].forEach(k => { ... handleAns(k) ... });
// Non-greedy up to the closing "});" that follows opts.appendChild(btn).
const OPT_RE = /\['a',\s*'b',\s*'c',\s*'d'\]\.forEach\(\s*k\s*=>\s*\{[\s\S]*?handleAns\(k\)[\s\S]*?opts\.appendChild\(btn\);\s*\}\s*\);/;

const RENDER_REPLACEMENT =
`if (window.HocVuiQuiz && window.HocVuiQuiz.render) {
      window.HocVuiQuiz.render({ questionEl: $('q-text'), optionsEl: opts, question: curQ, onResult: (ok) => handleAns(ok) });
    } else {
      ['a','b','c','d'].forEach(k => { const t = curQ[\`option_\${k}\`]; if (t == null) return; const btn = document.createElement('button'); btn.className = 'option-btn'; btn.dataset.key = k; btn.textContent = t; btn.addEventListener('click', () => handleAns(k)); opts.appendChild(btn); });
    }`;

// Match the "const ok = sel ... === ck;" line then the option-btn highlight loop.
// Group 1 = the ok-assignment line content (sel === ck OR sel.toLowerCase() === ck).
const ANS_RE = /const ok = sel(?:\.toLowerCase\(\))? === ck;\s*([\s\S]*?\.option-btn'\)\.forEach\(b => \{[\s\S]*?\}\);)/;

function buildAnsReplacement(highlightBlock) {
  return `const ok = (typeof sel === 'boolean') ? sel : (String(sel).toLowerCase() === ck);
    if (typeof sel !== 'boolean') {
      ${highlightBlock}
    }`;
}

const SCRIPTS = `  <script src="/quiz/engine.js"></script>\n  <script src="/quiz/all.js"></script>\n  <script src="game.js"></script>`;

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

  const optChanged = OPT_RE.test(js);
  if (optChanged) js = js.replace(OPT_RE, RENDER_REPLACEMENT);

  let ansChanged = false;
  const m = js.match(ANS_RE);
  if (m) { js = js.replace(ANS_RE, buildAnsReplacement(m[1])); ansChanged = true; }

  if (!optChanged || !ansChanged) { report.push(`v${v}: MISS opt:${optChanged} ans:${ansChanged}`); continue; }

  if (html.includes('/quiz/engine.js')) { /* keep */ }
  else if (html.includes('  <script src="game.js"></script>')) html = html.replace('  <script src="game.js"></script>', SCRIPTS);
  else { report.push(`v${v}: html game.js include not found`); continue; }

  fs.writeFileSync(jsPath, js);
  fs.writeFileSync(htmlPath, html);
  try {
    execSync(`node --check "${jsPath}"`, { stdio: 'pipe' });
    report.push(`v${v}: OK`);
  } catch (e) {
    fs.writeFileSync(jsPath, jsBackup);
    fs.writeFileSync(htmlPath, htmlBackup);
    report.push(`v${v}: PARSE FAIL — reverted`);
  }
}
console.log(report.join('\n'));
