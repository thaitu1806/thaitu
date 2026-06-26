// Học Vui — V46 "Tiệm Cây Cảnh" sprite registry.
// Chibi potted-plant creatures that visibly grow. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body (stem/pot area), .head (the
// bloom/crown carrying the cute face) and .accent (decorative leaves/petals).
// Thin dark-green outline matching the V46 palette. CSS in v46/style.css drives
// animation per state (idle sway/breathe, happy bloom-bounce, scared wilt) and
// scales the whole sprite via the pot's data-stage attribute (0..4).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[plants.js] character.js must load first');
    return;
  }

  const OUT = '#1b4d12';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }
  function smile(cx, cy) {
    return '<path class="mouth" d="M' + (cx - 5) + ' ' + cy + ' Q' + cx + ' ' + (cy + 5) + ' ' + (cx + 5) + ' ' + cy + '" stroke="' + OUT + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function face(cx, cy) {
    return eye(cx - 5, cy) + eye(cx + 5, cy) + smile(cx, cy + 6);
  }
  // Terracotta pot at the base of every sprite.
  function pot() {
    return (
      '<g class="pot-base">' +
        '<path d="M34 74 L66 74 L62 92 L38 92 Z" fill="#c1632c" stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<rect x="31" y="68" width="38" height="9" rx="3" fill="#d9763a" stroke="' + OUT + '" stroke-width="2.5"/>' +
        '<path d="M40 80 L60 80" stroke="#8a3f17" stroke-width="2" opacity="0.5"/>' +
      '</g>'
    );
  }
  // Green stem rising out of the pot.
  function stem() {
    return '<path class="stem" d="M50 68 L50 46" stroke="#2e7d32" stroke-width="5" fill="none" stroke-linecap="round"/>';
  }
  function leaf(side) {
    const x = side < 0 ? 50 : 50;
    const dx = side < 0 ? -12 : 12;
    return '<path class="side-leaf" d="M' + x + ' 60 Q' + (x + dx) + ' 54 ' + (x + dx * 1.3) + ' 62 Q' + (x + dx * 0.6) + ' 64 ' + x + ' 60 Z" fill="#43a047" stroke="' + OUT + '" stroke-width="2"/>';
  }

  // Per-species crown builders. Each returns the .head (bloom + face) markup.
  function crownCactus() {
    return (
      '<g class="body">' + pot() +
        '<path d="M42 70 Q40 48 50 44 Q60 48 58 70 Z" fill="#4caf50" stroke="' + OUT + '" stroke-width="2.5"/>' +
        '<path class="arm arm-l" d="M44 58 Q34 56 34 48 Q34 44 38 44" fill="none" stroke="#4caf50" stroke-width="6" stroke-linecap="round"/>' +
        '<path class="arm arm-r" d="M56 60 Q66 58 66 50 Q66 46 62 46" fill="none" stroke="#4caf50" stroke-width="6" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="head">' + face(50, 58) +
        '<circle class="bloom-dot" cx="50" cy="42" r="4" fill="#ec407a" stroke="' + OUT + '" stroke-width="1.5"/>' +
      '</g>'
    );
  }
  function crownRose() {
    return (
      '<g class="body">' + pot() + stem() + leaf(-1) + leaf(1) + '</g>' +
      '<g class="head">' +
        '<g class="accent"><circle cx="50" cy="38" r="15" fill="#e53935" stroke="' + OUT + '" stroke-width="2.5"/></g>' +
        '<path d="M42 38 Q50 30 58 38 Q50 34 42 38 Z" fill="#ef5350" stroke="' + OUT + '" stroke-width="1.5"/>' +
        '<circle cx="50" cy="40" r="6" fill="#c62828"/>' +
        face(50, 40) +
      '</g>'
    );
  }
  function crownTulip() {
    return (
      '<g class="body">' + pot() + stem() + leaf(-1) + leaf(1) + '</g>' +
      '<g class="head">' +
        '<g class="accent"><path d="M38 42 Q38 24 50 24 Q62 24 62 42 Q56 36 50 36 Q44 36 38 42 Z" fill="#ec407a" stroke="' + OUT + '" stroke-width="2.5"/></g>' +
        '<path d="M50 24 L50 40" stroke="#ad1457" stroke-width="1.5" opacity="0.6"/>' +
        face(50, 40) +
      '</g>'
    );
  }
  function crownLotus() {
    return (
      '<g class="body">' + pot() + '</g>' +
      '<g class="head">' +
        '<g class="accent">' +
          '<path d="M50 50 Q34 44 30 56 Q44 58 50 50 Z" fill="#f48fb1" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M50 50 Q66 44 70 56 Q56 58 50 50 Z" fill="#f48fb1" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M50 48 Q42 30 50 26 Q58 30 50 48 Z" fill="#f06292" stroke="' + OUT + '" stroke-width="2"/>' +
        '</g>' +
        '<path d="M40 52 Q50 44 60 52 Q50 64 40 52 Z" fill="#fce4ec" stroke="' + OUT + '" stroke-width="2"/>' +
        face(50, 52) +
      '</g>'
    );
  }
  function crownSunflower() {
    let petals = '';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = 50 + Math.cos(a) * 15;
      const y = 38 + Math.sin(a) * 15;
      petals += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="5" ry="3" fill="#ffca28" stroke="' + OUT + '" stroke-width="1.5" transform="rotate(' + (a * 180 / Math.PI) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
    }
    return (
      '<g class="body">' + pot() + stem() + leaf(-1) + leaf(1) + '</g>' +
      '<g class="head">' +
        '<g class="accent">' + petals + '</g>' +
        '<circle cx="50" cy="38" r="10" fill="#8d6e63" stroke="' + OUT + '" stroke-width="2"/>' +
        face(50, 38) +
      '</g>'
    );
  }
  function crownBamboo() {
    return (
      '<g class="body">' + pot() +
        '<rect class="cane cane-l" x="42" y="40" width="6" height="32" rx="2" fill="#66bb6a" stroke="' + OUT + '" stroke-width="2"/>' +
        '<rect class="cane cane-r" x="52" y="36" width="6" height="36" rx="2" fill="#81c784" stroke="' + OUT + '" stroke-width="2"/>' +
        '<path d="M42 52 L48 52 M42 60 L48 60 M52 48 L58 48 M52 58 L58 58" stroke="' + OUT + '" stroke-width="1.5" opacity="0.6"/>' +
      '</g>' +
      '<g class="head">' +
        '<g class="accent"><path d="M55 36 Q70 30 72 40 Q60 42 55 36 Z" fill="#43a047" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M45 40 Q30 34 28 44 Q40 46 45 40 Z" fill="#43a047" stroke="' + OUT + '" stroke-width="2"/></g>' +
        face(50, 50) +
      '</g>'
    );
  }
  function crownPine() {
    return (
      '<g class="body">' + pot() + '</g>' +
      '<g class="head">' +
        '<g class="accent">' +
          '<path d="M50 22 L62 44 L38 44 Z" fill="#2e7d32" stroke="' + OUT + '" stroke-width="2"/>' +
          '<path d="M50 34 L66 58 L34 58 Z" fill="#388e3c" stroke="' + OUT + '" stroke-width="2.5"/>' +
          '<path d="M50 46 L68 70 L32 70 Z" fill="#43a047" stroke="' + OUT + '" stroke-width="2.5"/>' +
        '</g>' +
        face(50, 60) +
      '</g>'
    );
  }
  function crownMaple() {
    return (
      '<g class="body">' + pot() + stem() + '</g>' +
      '<g class="head">' +
        '<g class="accent">' +
          '<circle cx="50" cy="40" r="14" fill="#ef6c00" stroke="' + OUT + '" stroke-width="2.5"/>' +
          '<circle cx="38" cy="46" r="8" fill="#f57c00" stroke="' + OUT + '" stroke-width="2"/>' +
          '<circle cx="62" cy="46" r="8" fill="#e65100" stroke="' + OUT + '" stroke-width="2"/>' +
          '<circle cx="50" cy="30" r="9" fill="#fb8c00" stroke="' + OUT + '" stroke-width="2"/>' +
        '</g>' +
        face(50, 44) +
      '</g>'
    );
  }
  function crownCherry() {
    let blossoms = '';
    const spots = [[50, 32], [38, 42], [62, 42], [44, 52], [58, 52]];
    spots.forEach(function (p) {
      blossoms += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="#f8bbd0" stroke="' + OUT + '" stroke-width="2"/>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="#ec407a"/>';
    });
    return (
      '<g class="body">' + pot() + stem() + '</g>' +
      '<g class="head">' +
        '<g class="accent">' + blossoms + '</g>' +
        face(50, 46) +
      '</g>'
    );
  }

  function svg(cls, inner) {
    return '<svg viewBox="0 0 100 100" class="plant ' + cls + '" ' + STROKE + ' aria-hidden="true">' + inner + '</svg>';
  }

  const C = window.HocVuiCharacters;

  // Register one growable chibi plant per PLANT_SPECIES id in game-logic.js.
  C.registerSpecies('cactus',    { svg: svg('pl-cactus',    crownCactus()),    classPrefix: 'pl-cactus' });
  C.registerSpecies('rose',      { svg: svg('pl-rose',      crownRose()),      classPrefix: 'pl-rose' });
  C.registerSpecies('tulip',     { svg: svg('pl-tulip',     crownTulip()),     classPrefix: 'pl-tulip' });
  C.registerSpecies('lotus',     { svg: svg('pl-lotus',     crownLotus()),     classPrefix: 'pl-lotus' });
  C.registerSpecies('sunflower', { svg: svg('pl-sunflower', crownSunflower()), classPrefix: 'pl-sunflower' });
  C.registerSpecies('bamboo',    { svg: svg('pl-bamboo',    crownBamboo()),    classPrefix: 'pl-bamboo' });
  C.registerSpecies('pine',      { svg: svg('pl-pine',      crownPine()),      classPrefix: 'pl-pine' });
  C.registerSpecies('maple',     { svg: svg('pl-maple',     crownMaple()),     classPrefix: 'pl-maple' });
  C.registerSpecies('cherry',    { svg: svg('pl-cherry',    crownCherry()),    classPrefix: 'pl-cherry' });
})();
