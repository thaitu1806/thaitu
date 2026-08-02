/**
 * Inject `<script src="/number-sprites.js"></script>` before sprite-icons.js
 * in every HTML file under public/, idempotently.
 *   node scripts/inject-number-sprites.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const MARKER = 'number-sprites.js';
const TAG = '<script src="/number-sprites.js"></script>';

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

  if (html.includes('sprite-icons.js')) {
    html = html.replace(
      /(<script src="[^"]*sprite-icons\.js"><\/script>)/,
      `${TAG}\n  $1`
    );
  } else if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `  ${TAG}\n</body>`);
  } else {
    html = `${html}\n${TAG}`;
  }

  fs.writeFileSync(file, html);
  injected++;
  console.log('injected:', path.relative(PUBLIC_DIR, file));
}
console.log(`Done. Injected /number-sprites.js into ${injected} file(s).`);
