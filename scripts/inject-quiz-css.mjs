// Inject the shared <link rel="stylesheet" href="/quiz/quiz-modes.css"> into every
// game that uses the modular quiz engine. Idempotent. Anchors after the game's
// own style.css link.
import fs from 'node:fs';
import path from 'node:path';

const TARGETS = [2, 6, 7, 8, 9, 10, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
const LINK = '<link rel="stylesheet" href="/quiz/quiz-modes.css">';
const report = [];

for (const v of TARGETS) {
  const htmlPath = path.join('public', 'v' + v, 'index.html');
  if (!fs.existsSync(htmlPath)) { report.push(`v${v}: missing`); continue; }
  let html = fs.readFileSync(htmlPath, 'utf8');
  if (html.includes('/quiz/quiz-modes.css')) { report.push(`v${v}: already`); continue; }
  const anchor = '<link rel="stylesheet" href="style.css">';
  if (!html.includes(anchor)) { report.push(`v${v}: no anchor`); continue; }
  html = html.replace(anchor, anchor + '\n  ' + LINK);
  fs.writeFileSync(htmlPath, html);
  report.push(`v${v}: OK`);
}
console.log(report.join('\n'));
