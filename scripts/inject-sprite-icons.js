/**
 * Inject `<script src="/sprite-icons.js"></script>` before </body> of every
 * HTML file under public/, idempotently. Run after adding new HTML pages:
 *   node scripts/inject-sprite-icons.js
 *
 * The shared sprite icon module (public/sprite-icons.js) exposes
 * window.HocVuiSprite for rendering AI-style icons from the
 * stickers-N-clean.png sprite sheets across the entire app.
 *
 * The script is injected BEFORE sounds.js so it's available early.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const MARKER = 'sprite-icons.js';
const TAG = '<script src="/sprite-icons.js"></script>';

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

  // Insert before sounds.js if present, otherwise before </body>
  if (html.includes('sounds.js')) {
    html = html.replace(
      /(<script src="[^"]*sounds\.js"><\/script>)/,
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
console.log(`Done. Injected /sprite-icons.js into ${injected} file(s).`);
