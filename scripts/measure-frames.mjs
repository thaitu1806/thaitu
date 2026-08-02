/**
 * Measure frame boundaries in a sprite sheet by scanning for vertical gaps.
 * Reads PNG raw pixel data using Node built-in zlib + buffer parsing.
 * Usage: node scripts/measure-frames.mjs public/img/octopus-swim.png
 */
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';

const file = process.argv[2];
if (!file) { console.error('Usage: node measure-frames.mjs <png-file>'); process.exit(1); }

const buf = readFileSync(file);

// Parse PNG
const sig = buf.slice(0, 8);
let offset = 8;
let width, height, bitDepth, colorType, rawData = [];

while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  const data = buf.slice(offset + 8, offset + 8 + len);
  offset += 12 + len;

  if (type === 'IHDR') {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
  } else if (type === 'IDAT') {
    rawData.push(data);
  } else if (type === 'IEND') break;
}

const compressed = Buffer.concat(rawData);
const decompressed = inflateSync(compressed);

// channels: colorType 6 = RGBA(4), colorType 2 = RGB(3), colorType 3 = palette
const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 4;
const stride = width * channels + 1; // +1 for filter byte per row

console.log(`Image: ${width}x${height}, colorType=${colorType}, channels=${channels}`);

// For each column x, check if it's "empty" (all pixels transparent or white-ish)
function isColumnEmpty(x) {
  let emptyPixels = 0;
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride + 1; // skip filter byte
    const px = rowStart + x * channels;
    if (channels === 4) {
      const a = decompressed[px + 3];
      if (a < 10) { emptyPixels++; continue; } // transparent
      const r = decompressed[px], g = decompressed[px+1], b = decompressed[px+2];
      if (r > 240 && g > 240 && b > 240) { emptyPixels++; continue; } // white
    } else {
      const r = decompressed[px], g = decompressed[px+1], b = decompressed[px+2];
      if (r > 240 && g > 240 && b > 240) { emptyPixels++; continue; }
    }
  }
  return emptyPixels > height * 0.95; // 95% empty = gap column
}

// Scan columns to find frame boundaries
let inFrame = false;
let frameStart = 0;
const frames = [];

for (let x = 0; x < width; x++) {
  const empty = isColumnEmpty(x);
  if (!inFrame && !empty) {
    inFrame = true;
    frameStart = x;
  } else if (inFrame && empty) {
    inFrame = false;
    frames.push({ start: frameStart, end: x - 1, width: x - frameStart });
  }
}
if (inFrame) {
  frames.push({ start: frameStart, end: width - 1, width: width - frameStart });
}

console.log(`Found ${frames.length} frames:`);
frames.forEach((f, i) => {
  console.log(`  Frame ${i+1}: x=${f.start}..${f.end} (width=${f.width}px)`);
});

// For CSS: the simplest approach is use the widest frame as element width
const maxW = Math.max(...frames.map(f => f.width));
console.log(`\nWidest frame: ${maxW}px`);
console.log(`If equal spacing: ${Math.round(width / frames.length)}px per frame`);
