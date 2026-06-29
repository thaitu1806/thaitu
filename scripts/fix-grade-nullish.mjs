// Replace `.grade || 2` with `.grade ?? 2` across public JS so grade 0 (5 tuổi,
// mầm non) is honoured instead of falling back to grade 2 (0 is falsy with ||).
import fs from 'node:fs';
import path from 'node:path';

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.isFile() && e.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

const RE = /\.grade \|\| 2\b/g;
const report = [];
for (const f of walk('public')) {
  const src = fs.readFileSync(f, 'utf8');
  if (!RE.test(src)) continue;
  RE.lastIndex = 0;
  const out = src.replace(RE, '.grade ?? 2');
  fs.writeFileSync(f, out);
  report.push(path.relative('public', f));
}
console.log('patched ' + report.length + ' files:\n' + report.join('\n'));
