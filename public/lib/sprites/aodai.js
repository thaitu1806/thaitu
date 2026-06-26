// Học Vui — V57 "Tiệm May Áo Dài" sprite registry.
// Chibi áo-dài-dress characters, one per garment color. Each species is an SVG
// (viewBox 0 0 100 100) with named <g>: .body (gown + sleeves), .head (face),
// .accent (collar / sash / flower). CSS in v57/style.css drives animation per
// state (idle = gentle fabric sway, happy = twirl/bounce, scared = optional).
// ids MUST match AO_DAI_COLORS in game-logic.js: red, pink, gold, blue, white.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[aodai.js] character.js must load first');
    return;
  }

  const OUT = '#5d1010';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  const SKIN = '#ffcc80';
  const HAIR = '#2b1810';

  // Reusable bits ────────────────────────────────────────────────────────
  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }
  function smile() {
    return '<path class="mouth" d="M46 31 Q50 35 54 31" stroke="' + OUT + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
  }
  function cheeks() {
    return (
      '<circle cx="42" cy="31" r="2.4" fill="#ff8a80" opacity="0.6" stroke="none"/>' +
      '<circle cx="58" cy="31" r="2.4" fill="#ff8a80" opacity="0.6" stroke="none"/>'
    );
  }
  function flower(cx, cy, c) {
    return (
      '<circle cx="' + cx + '" cy="' + (cy - 3) + '" r="2.2" fill="' + c + '"/>' +
      '<circle cx="' + (cx - 3) + '" cy="' + cy + '" r="2.2" fill="' + c + '"/>' +
      '<circle cx="' + (cx + 3) + '" cy="' + cy + '" r="2.2" fill="' + c + '"/>' +
      '<circle cx="' + cx + '" cy="' + (cy + 3) + '" r="2.2" fill="' + c + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="2" fill="#fff8e1"/>'
    );
  }

  // Main áo-dài factory ────────────────────────────────────────────────────
  // opts: { dress, panel, accent }
  function makeAoDai(o) {
    return (
      '<svg viewBox="0 0 100 100" class="aodai" ' + STROKE + ' aria-hidden="true">' +
        '<g class="body">' +
          // left + right long flowing sleeves
          '<path class="sleeve sleeve-l" d="M38 44 Q24 52 22 76 Q28 78 33 71 Q35 56 43 50 Z" fill="' + o.dress + '"/>' +
          '<path class="sleeve sleeve-r" d="M62 44 Q76 52 78 76 Q72 78 67 71 Q65 56 57 50 Z" fill="' + o.dress + '"/>' +
          // main flowing gown
          '<path class="gown" d="M37 42 Q32 64 30 91 L70 91 Q68 64 63 42 Q50 37 37 42 Z" fill="' + o.dress + '"/>' +
          // front center panel (the áo dài tà áo)
          '<path class="panel" d="M44 44 L42 91 L58 91 L56 44 Q50 42 44 44 Z" fill="' + o.panel + '"/>' +
          // center split seam
          '<path d="M50 58 L50 91" stroke="' + OUT + '" stroke-width="1.4" fill="none"/>' +
        '</g>' +
        '<g class="accent">' +
          // mandarin stand collar
          '<path class="collar" d="M44 43 Q50 47 56 43 L55 39 Q50 42 45 39 Z" fill="' + o.accent + '"/>' +
          // waist sash
          '<rect class="sash" x="40" y="55" width="20" height="5" rx="2.5" fill="' + o.accent + '"/>' +
          // chest flower brooch
          '<g class="flower">' + flower(50, 49, o.accent) + '</g>' +
        '</g>' +
        '<g class="head">' +
          '<circle cx="50" cy="26" r="14" fill="' + SKIN + '"/>' +
          // hair frame + bun
          '<path d="M36 24 Q36 10 50 10 Q64 10 64 24 Q60 17 50 16 Q40 17 36 24 Z" fill="' + HAIR + '"/>' +
          '<circle cx="50" cy="9" r="5" fill="' + HAIR + '"/>' +
          eye(45, 27) + eye(55, 27) + smile() + cheeks() +
        '</g>' +
      '</svg>'
    );
  }

  const C = window.HocVuiCharacters;

  // One species per AO_DAI_COLORS id ────────────────────────────────────────
  C.registerSpecies('red',   { svg: makeAoDai({ dress: '#d32f2f', panel: '#b71c1c', accent: '#ffd54f' }), classPrefix: 'aodai-red' });
  C.registerSpecies('pink',  { svg: makeAoDai({ dress: '#ec407a', panel: '#c2185b', accent: '#fff1f6' }), classPrefix: 'aodai-pink' });
  C.registerSpecies('gold',  { svg: makeAoDai({ dress: '#ffca28', panel: '#f9a825', accent: '#fff8e1' }), classPrefix: 'aodai-gold' });
  C.registerSpecies('blue',  { svg: makeAoDai({ dress: '#29b6f6', panel: '#0288d1', accent: '#e1f5fe' }), classPrefix: 'aodai-blue' });
  C.registerSpecies('white', { svg: makeAoDai({ dress: '#fafafa', panel: '#e0e0e0', accent: '#ffd54f' }), classPrefix: 'aodai-white' });
})();
