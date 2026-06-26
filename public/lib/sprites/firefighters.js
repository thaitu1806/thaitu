// Học Vui — V21 "Siêu Nhân Cứu Hỏa" sprite registry.
// Chibi firefighter hero (helmet + hose) + a flame mascot to extinguish.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v21/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[firefighters.js] character.js must load first');
    return;
  }

  const OUT = '#3a2415';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Main player avatar — a cheerful chibi firefighter with red helmet + hose.
  const firefighter =
    '<svg viewBox="0 0 100 100" class="ff" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // hose snaking down + metal nozzle (top-left)
        '<path d="M34 70 Q14 68 14 52" fill="none" stroke="#f4a300" stroke-width="5"/>' +
        '<rect x="8" y="40" width="12" height="11" rx="3" fill="#cfd8dc"/>' +
        // water burst (hidden in idle, animates on happy)
        '<g class="water">' +
          '<circle cx="9" cy="35" r="3" fill="#4fc3f7"/>' +
          '<circle cx="4" cy="29" r="2.2" fill="#81d4fa"/>' +
          '<circle cx="13" cy="27" r="1.8" fill="#b3e5fc"/>' +
        '</g>' +
      '</g>' +
      '<g class="body">' +
        // jacket
        '<path d="M33 64 Q33 57 42 57 L58 57 Q67 57 67 64 L67 88 Q67 92 62 92 L38 92 Q33 92 33 88 Z" fill="#1f3a5f"/>' +
        // reflective stripe
        '<rect x="33" y="74" width="34" height="5" fill="#ffd23f"/>' +
        // jacket seam
        '<rect x="47" y="57" width="6" height="35" fill="#16304f"/>' +
        // arm gripping the hose
        '<path d="M37 66 Q27 68 30 74" fill="none" stroke="#1f3a5f" stroke-width="7"/>' +
      '</g>' +
      '<g class="head">' +
        // face
        '<circle cx="50" cy="40" r="14" fill="#ffd9b3"/>' +
        // helmet dome + brim
        '<path d="M34 39 Q34 19 50 19 Q66 19 66 39 Z" fill="#e53935"/>' +
        '<path d="M30 39 L70 39 Q72 39 72 42 L28 42 Q28 39 30 39 Z" fill="#c62828"/>' +
        '<rect x="46" y="22" width="8" height="9" rx="2" fill="#ffd23f"/>' +
        eye(45, 42) + eye(55, 42) +
        '<path class="mouth" d="M45 47 Q50 51 55 47" fill="none" stroke="' + OUT + '" stroke-width="2"/>' +
      '</g>' +
    '</svg>';

  // Flame mascot — the fire to extinguish, with a cheeky little face.
  const flame =
    '<svg viewBox="0 0 100 100" class="flame" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<path d="M50 10 Q70 32 66 56 Q66 84 50 88 Q34 84 34 56 Q30 32 50 10 Z" fill="#ff6b35"/>' +
      '</g>' +
      '<g class="accent">' +
        '<path d="M50 32 Q60 48 57 64 Q57 80 50 83 Q43 80 43 64 Q40 48 50 32 Z" fill="#ffd23f"/>' +
      '</g>' +
      '<g class="head">' +
        eye(45, 60) + eye(55, 60) +
        '<path class="mouth" d="M45 68 Q50 72 55 68" fill="none" stroke="' + OUT + '" stroke-width="2"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('firefighter', { svg: firefighter, classPrefix: 'ff' });
  C.registerSpecies('flame', { svg: flame, classPrefix: 'flame' });
})();
