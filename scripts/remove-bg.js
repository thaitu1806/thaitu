// Remove background from sprite sheet images (even if saved as JPEG with .png extension)
// Usage: node scripts/remove-bg.js <file1> [file2] ...
// Detects background color from corners, removes similar pixels

import sharp from 'sharp';

const files = process.argv.slice(2);
if (!files.length) {
  console.log('Usage: node scripts/remove-bg.js <file1.png> [file2.png] ...');
  process.exit(1);
}

const TOLERANCE = 40; // color distance tolerance for background removal

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

async function removeBg(filePath) {
  const img = sharp(filePath);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  
  // Sample corner pixels to detect background color
  const corners = [
    0, // top-left
    (w - 1) * 4, // top-right
    (h - 1) * w * 4, // bottom-left
    ((h - 1) * w + (w - 1)) * 4 // bottom-right
  ];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const idx of corners) {
    bgR += data[idx]; bgG += data[idx+1]; bgB += data[idx+2];
  }
  bgR = Math.round(bgR / 4); bgG = Math.round(bgG / 4); bgB = Math.round(bgB / 4);
  console.log(`${filePath}: detected bg color rgb(${bgR},${bgG},${bgB})`);
  
  let removed = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (colorDist(r, g, b, bgR, bgG, bgB) < TOLERANCE) {
      data[i+3] = 0;
      removed++;
    }
  }
  
  const outPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.png');
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(outPath === filePath ? filePath.replace('.png', '-clean.png') : outPath);
  
  const total = w * h;
  console.log(`  removed ${removed}/${total} pixels (${(removed/total*100).toFixed(1)}%) -> ${outPath}`);
}

for (const f of files) {
  await removeBg(f);
}
