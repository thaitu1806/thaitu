/**
 * Inject `<script src="/api-config.js"></script>` into the <head> of every
 * HTML file under public/, idempotently. Run once after adding new HTML files
 * (e.g. `node scripts/inject-api-config.js`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const MARKER = 'api-config.js';

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield full;
  }
}

function relativePath(file) {
  // Compute the URL path the HTML uses to reach /api-config.js
  const rel = path.relative(path.dirname(file), path.join(PUBLIC_DIR, 'api-config.js'));
  return rel.split(path.sep).join('/');
}

let injected = 0;
for (const file of walk(PUBLIC_DIR)) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(MARKER)) continue;
  const src = relativePath(file);
  const tag = `<script src="${src}"></script>`;
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${tag}`);
  } else {
    // No <head>? Prepend to file.
    html = `${tag}\n${html}`;
  }
  fs.writeFileSync(file, html);
  injected++;
  console.log('injected:', path.relative(PUBLIC_DIR, file));
}
console.log(`Done. Injected into ${injected} file(s).`);
