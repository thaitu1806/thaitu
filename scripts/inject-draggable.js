/**
 * Inject `<script src="/draggable-widget.js"></script>` before </body> of every
 * HTML file under public/, idempotently. Run after adding new HTML pages:
 *   node scripts/inject-draggable.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const MARKER = 'draggable-widget.js';

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

let injected = 0;
for (const file of walk(PUBLIC_DIR)) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(MARKER)) continue;
  const tag = `<script src="/draggable-widget.js"></script>`;
  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `  ${tag}\n</body>`);
    fs.writeFileSync(file, html);
    injected++;
  }
  console.log('injected:', path.relative(PUBLIC_DIR, file));
}
console.log(`Done. Injected /draggable-widget.js into ${injected} file(s).`);
