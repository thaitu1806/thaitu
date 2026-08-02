// scripts/replace-emoji.mjs
// Bulk-replace common UI emojis with img tags in all public/v*/game.js files.
// Run: node scripts/replace-emoji.mjs
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC = path.resolve('public');

// Mapping: emoji → img tag (inline, 1em height to match text flow)
const REPLACEMENTS = [
  // Icons that appear in UI strings (innerHTML, template literals, etc.)
  ['💎', '<img src="/img/diamond.png" class="em-icon">'],
  ['⭐', '<img src="/img/star.png" class="em-icon">'],
  ['🏆', '<img src="/img/trophy.png" class="em-icon">'],
  ['🎁', '<img src="/img/gift.png" class="em-icon">'],
  ['🔥', '<img src="/img/fire.png" class="em-icon">'],
  ['🎉', '<img src="/img/party.png" class="em-icon">'],
  ['❤️', '<img src="/img/heart.png" class="em-icon">'],
  ['💛', '<img src="/img/heart.png" class="em-icon">'],
  ['🥇', '<img src="/img/medal.png" class="em-icon">'],
  ['🏅', '<img src="/img/medal.png" class="em-icon">'],
  ['⚡', '<img src="/img/bolt.png" class="em-icon">'],
  ['🪙', '<img src="/img/coin.png" class="em-icon">'],
];

// Files to process
function getGameFiles() {
  const files = [];
  const dirs = fs.readdirSync(PUBLIC).filter(d => /^v\d+$/.test(d));
  for (const dir of dirs) {
    const gjs = path.join(PUBLIC, dir, 'game.js');
    if (fs.existsSync(gjs)) files.push(gjs);
  }
  return files;
}

let totalChanges = 0;
const files = getGameFiles();
console.log(`Processing ${files.length} game.js files...`);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const [emoji, img] of REPLACEMENTS) {
    if (content.includes(emoji)) {
      content = content.replaceAll(emoji, img);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
    console.log(`  ✓ ${path.relative(PUBLIC, file)}`);
  }
}

console.log(`\nDone! Modified ${totalChanges}/${files.length} files.`);
console.log(`\nNote: Add this CSS to your pages for proper sizing:`);
console.log(`.em-icon { width:1em; height:1em; vertical-align:-0.1em; display:inline-block; }`);
