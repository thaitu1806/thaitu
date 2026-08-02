// === Học Vui — Shared Sprite Icon Utility ===
// Renders AI-style icons from stickers-N-clean.png sprite sheets.
// All 5 sheets are 473×527px, 10 cols × 11 rows = 110 icons each (550 total).
//
// Usage:
//   HocVuiSprite.html(sheet, row, col, size)        → HTML string
//   HocVuiSprite.style(sheet, row, col, size)       → inline style string
//   HocVuiSprite.el(sheet, row, col, size, cls)     → HTML with extra class
//   HocVuiSprite.random(size)                       → random icon HTML
//   HocVuiSprite.randomFrom(sheet, size)            → random icon from specific sheet
//
// Sheet contents (approximate themes):
//   1: Animals (pets, farm, wild, sea, dinosaurs)
//   2: Nature (space, weather, flowers, trees, insects, birds)
//   3: Food (fruits, vegetables, drinks, sweets, meals)
//   4: Objects (vehicles, sports, music, toys, tools)
//   5: Fantasy (magic, buildings, emotions, hands, stationery)
//
(function () {
  'use strict';

  const SPRITE_W = 473, SPRITE_H = 527;
  const COLS = 10, ROWS = 11;
  const CELL_W = SPRITE_W / COLS; // ~47.3
  const CELL_H = SPRITE_H / ROWS; // ~47.9

  function url(sheet) {
    return `/img/stickers-${sheet}-clean.png`;
  }

  // Returns inline CSS style string for a sprite icon
  function style(sheet, row, col, size) {
    size = size || 24;
    const scale = size / CELL_W;
    const bgW = (SPRITE_W * scale).toFixed(1);
    const bgH = (SPRITE_H * scale).toFixed(1);
    const x = -(col * CELL_W * scale).toFixed(1);
    const y = -(row * CELL_H * scale).toFixed(1);
    return `display:inline-block;width:${size}px;height:${size}px;background:url(${url(sheet)}) ${x}px ${y}px/${bgW}px ${bgH}px no-repeat;vertical-align:middle;flex-shrink:0;`;
  }

  // Returns an HTML string for a sprite icon span
  function html(sheet, row, col, size) {
    return `<span class="hv-sprite" style="${style(sheet, row, col, size)}"></span>`;
  }

  // Returns HTML with an extra CSS class
  function el(sheet, row, col, size, cls) {
    const c = cls ? ` ${cls}` : '';
    return `<span class="hv-sprite${c}" style="${style(sheet, row, col, size)}"></span>`;
  }

  // Random icon from any sheet
  function random(size) {
    const sheet = Math.floor(Math.random() * 5) + 1;
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    return html(sheet, row, col, size || 24);
  }

  // Random icon from a specific sheet
  function randomFrom(sheet, size) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    return html(sheet, row, col, size || 24);
  }

  // Random from curated kid-friendly list (avoids abstract/hard-to-recognize icons)
  // Returns { sheet, row, col } object
  const KID_FRIENDLY = [
    // Sheet 1: Animals
    {s:1,r:0,c:0},{s:1,r:0,c:1},{s:1,r:0,c:2},{s:1,r:0,c:3},{s:1,r:0,c:4},
    {s:1,r:0,c:5},{s:1,r:0,c:6},{s:1,r:0,c:7},{s:1,r:0,c:8},{s:1,r:0,c:9},
    {s:1,r:1,c:0},{s:1,r:1,c:1},{s:1,r:1,c:2},{s:1,r:1,c:3},{s:1,r:1,c:4},
    {s:1,r:1,c:5},{s:1,r:1,c:6},{s:1,r:1,c:7},{s:1,r:1,c:8},{s:1,r:1,c:9},
    {s:1,r:2,c:0},{s:1,r:2,c:1},{s:1,r:2,c:2},{s:1,r:2,c:3},{s:1,r:2,c:4},
    // Sheet 2: Nature
    {s:2,r:0,c:0},{s:2,r:0,c:1},{s:2,r:0,c:5},{s:2,r:0,c:6},{s:2,r:0,c:7},
    {s:2,r:4,c:0},{s:2,r:4,c:1},{s:2,r:4,c:2},{s:2,r:4,c:3},{s:2,r:4,c:4},
    {s:2,r:4,c:6},{s:2,r:4,c:7},{s:2,r:5,c:0},{s:2,r:5,c:7},
    {s:2,r:7,c:0},{s:2,r:7,c:1},{s:2,r:7,c:2},{s:2,r:7,c:4},{s:2,r:7,c:9},
    {s:2,r:9,c:0},{s:2,r:9,c:2},{s:2,r:9,c:3},{s:2,r:9,c:4},
    // Sheet 3: Food
    {s:3,r:0,c:0},{s:3,r:0,c:1},{s:3,r:0,c:2},{s:3,r:0,c:3},{s:3,r:0,c:4},
    {s:3,r:0,c:5},{s:3,r:0,c:6},{s:3,r:0,c:7},{s:3,r:0,c:8},{s:3,r:0,c:9},
    {s:3,r:1,c:0},{s:3,r:1,c:1},{s:3,r:1,c:2},{s:3,r:1,c:3},{s:3,r:1,c:4},
    {s:3,r:5,c:0},{s:3,r:5,c:1},{s:3,r:5,c:2},{s:3,r:5,c:3},{s:3,r:5,c:4},
    // Sheet 4: Objects
    {s:4,r:0,c:0},{s:4,r:0,c:1},{s:4,r:0,c:2},{s:4,r:0,c:3},{s:4,r:0,c:4},
    {s:4,r:3,c:0},{s:4,r:3,c:1},{s:4,r:3,c:2},{s:4,r:3,c:3},{s:4,r:3,c:4},
    {s:4,r:5,c:0},{s:4,r:5,c:1},{s:4,r:5,c:2},{s:4,r:5,c:3},{s:4,r:5,c:4},
    // Sheet 5: Fantasy/misc
    {s:5,r:0,c:0},{s:5,r:0,c:1},{s:5,r:0,c:2},{s:5,r:0,c:3},{s:5,r:0,c:4},
    {s:5,r:3,c:0},{s:5,r:3,c:1},{s:5,r:3,c:2},{s:5,r:3,c:3},{s:5,r:3,c:4},
  ];

  function randomKidFriendly(size) {
    const item = KID_FRIENDLY[Math.floor(Math.random() * KID_FRIENDLY.length)];
    return html(item.s, item.r, item.c, size || 24);
  }

  function randomKidFriendlyData() {
    return KID_FRIENDLY[Math.floor(Math.random() * KID_FRIENDLY.length)];
  }

  // Named icon shortcuts for common UI elements
  const NAMED = {
    star:      { s: 2, r: 0, c: 0 },  // gold star
    sun:       { s: 2, r: 0, c: 7 },  // sun
    earth:     { s: 2, r: 0, c: 6 },  // earth
    heart:     { s: 5, r: 10, c: 0 }, // heart (approx)
    trophy:    { s: 4, r: 9, c: 9 },  // trophy (approx)
    fire:      { s: 2, r: 3, c: 5 },  // fire
    leaf:      { s: 2, r: 5, c: 7 },  // leaf/sprout
    flower:    { s: 2, r: 4, c: 2 },  // sunflower
    butterfly: { s: 2, r: 7, c: 0 },  // butterfly
    bird:      { s: 2, r: 9, c: 2 },  // bird
    fish:      { s: 1, r: 3, c: 0 },  // fish (approx)
    dog:       { s: 1, r: 0, c: 0 },  // dog
    cat:       { s: 1, r: 0, c: 1 },  // cat
    rabbit:    { s: 1, r: 0, c: 3 },  // rabbit
    apple:     { s: 3, r: 5, c: 0 },  // apple/fruit (approx)
    cake:      { s: 3, r: 0, c: 0 },  // cake/sweet (approx)
    rocket:    { s: 2, r: 1, c: 0 },  // rocket
    rainbow:   { s: 2, r: 3, c: 0 },  // rainbow
    mushroom:  { s: 2, r: 6, c: 7 },  // mushroom
    clover:    { s: 2, r: 5, c: 0 },  // clover
  };

  function named(name, size) {
    const n = NAMED[name];
    if (!n) return '';
    return html(n.s, n.r, n.c, size || 24);
  }

  // Expose globally
  window.HocVuiSprite = {
    style,
    html,
    el,
    random,
    randomFrom,
    randomKidFriendly,
    randomKidFriendlyData,
    named,
    NAMED,
    KID_FRIENDLY,
    // Constants
    SPRITE_W, SPRITE_H, COLS, ROWS, CELL_W, CELL_H,
    url,
  };
})();
