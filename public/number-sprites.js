// === Học Vui — Number Sprites Module ===
// Renders AI-style number icons (0-100) from numbers-1.png and numbers-2.png
// numbers-1.png: 711×351, 10 cols × 5 rows (numbers 0-49)
// numbers-2.png: 644×388, 10 cols × 6 rows (numbers 50-100)
//
// Usage:
//   HocVuiNumbers.html(n, size)     → HTML string for number n at given px size
//   HocVuiNumbers.style(n, size)    → inline CSS style string
//
(function () {
  'use strict';

  const SHEET1 = { url: '/img/numbers-1.png', w: 711, h: 351, cols: 10, rows: 5, start: 0 };
  const SHEET2 = { url: '/img/numbers-2.png', w: 644, h: 388, cols: 10, rows: 6, start: 50 };

  function getSheet(n) {
    return n < 50 ? SHEET1 : SHEET2;
  }

  function style(n, size) {
    n = Math.max(0, Math.min(100, Math.round(n)));
    size = size || 32;
    const sheet = getSheet(n);
    const local = n - sheet.start;
    const col = local % sheet.cols;
    const row = Math.floor(local / sheet.cols);
    const cellW = sheet.w / sheet.cols;
    const cellH = sheet.h / sheet.rows;
    const scale = size / cellW;
    const bgW = (sheet.w * scale).toFixed(1);
    const bgH = (sheet.h * scale).toFixed(1);
    const x = -(col * cellW * scale).toFixed(1);
    const y = -(row * cellH * scale).toFixed(1);
    return `display:inline-block;width:${size}px;height:${Math.round(cellH * scale)}px;background:url(${sheet.url}) ${x}px ${y}px/${bgW}px ${bgH}px no-repeat;vertical-align:middle;`;
  }

  function html(n, size) {
    return `<span class="hv-num" style="${style(n, size)}"></span>`;
  }

  window.HocVuiNumbers = { html, style };
})();
