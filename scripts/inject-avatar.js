/**
 * Inject `<script src="/avatar.js"></script>` into every HTML file under
 * public/, after engagement.js (so HocVuiProgress exists), idempotently.
 *   node scripts/inject-avatar.js
 * avatar.js lets the child pick/unlock an avatar; applied to #hero-avatar on home.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const MARKER = 'avatar.js';

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
  if (/src="\/avatar\.js"/.test(html)) continue;
  const tag = `<script src="/avatar.js"></script>`;
  if (/<script src="\/engagement\.js"><\/script>/.test(html)) {
    html = html.replace(/(\s*)<script src="\/engagement\.js"><\/script>/, `$1<script src="/engagement.js"></script>$1${tag}`);
  } else if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `  ${tag}\n</body>`);
  } else {
    html = `${html}\n${tag}`;
  }
  fs.writeFileSync(file, html);
  injected++;
  console.log('injected:', path.relative(PUBLIC_DIR, file));
}
console.log(`Done. Injected /avatar.js into ${injected} file(s).`);
