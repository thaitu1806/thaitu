/**
 * Inject `<script src="/engagement.js"></script>` before </body> of every HTML
 * file under public/, idempotently. Run after adding new HTML pages:
 *   node scripts/inject-engagement.js
 * engagement.js provides the daily login reward, today's-goal widget, and the
 * lifetime progress counter (window.HocVuiProgress) that drives pet evolution.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const MARKER = 'engagement.js';

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield full;
  }
}

let injected = 0;
for (const file of walk(PUBLIC_DIR)) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(MARKER)) continue;
  // Inject engagement.js BEFORE mascot.js so HocVuiProgress exists when the
  // mascot reads pet stage; if mascot.js isn't present, just before </body>.
  const tag = `<script src="/engagement.js"></script>`;
  if (/<script src="\/mascot\.js"><\/script>/.test(html)) {
    html = html.replace(/(\s*)<script src="\/mascot\.js"><\/script>/, `$1${tag}$1<script src="/mascot.js"></script>`);
  } else if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `  ${tag}\n</body>`);
  } else {
    html = `${html}\n${tag}`;
  }
  fs.writeFileSync(file, html);
  injected++;
  console.log('injected:', path.relative(PUBLIC_DIR, file));
}
console.log(`Done. Injected /engagement.js into ${injected} file(s).`);
