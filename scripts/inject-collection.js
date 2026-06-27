/**
 * Inject `<script src="/collection.js"></script>` before </body> of every HTML
 * file under public/, idempotently. Run after adding new HTML pages:
 *   node scripts/inject-collection.js
 * The sticker collection (public/collection.js) exposes window.HocVuiCollection;
 * games call reward(stars) on finish, and home.html opens the album.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const MARKER = 'collection.js';

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
  const tag = `<script src="/collection.js"></script>`;
  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `  ${tag}\n</body>`);
  } else {
    html = `${html}\n${tag}`;
  }
  fs.writeFileSync(file, html);
  injected++;
  console.log('injected:', path.relative(PUBLIC_DIR, file));
}
console.log(`Done. Injected /collection.js into ${injected} file(s).`);
