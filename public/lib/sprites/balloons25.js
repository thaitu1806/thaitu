// Học Vui — V25 "Pháo Đài Bóng Bay" sprite registry.
// Chibi fort-defender / castle-guard avatar + a cheeky balloon-enemy mascot.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v25/style.css drives animation per state (idle / happy / scared).
// NOTE: unique filename — balloons.js is already used by V42.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[balloons25.js] character.js must load first');
    return;
  }

  const OUT = '#23395d';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.6" fill="' + OUT + '"/>';
  }

  // Main avatar — a chibi castle-guard standing before fort battlements.
  const fortGuard =
    '<svg viewBox="0 0 100 100" class="guard" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // stone battlements behind the guard
        '<path d="M14 60 L14 40 L24 40 L24 48 L34 48 L34 40 L44 40 L44 48 L56 48 L56 40 L66 40 L66 48 L76 48 L76 40 L86 40 L86 60 Z" fill="#9bb0c4"/>' +
        '<path d="M14 60 L86 60 L86 52 L14 52 Z" fill="#7d93a8"/>' +
        // flag on a pole
        '<rect x="49" y="14" width="2.5" height="20" rx="1" fill="' + OUT + '"/>' +
        '<path class="flag" d="M51 15 L66 19 L51 24 Z" fill="#f44336"/>' +
      '</g>' +
      '<g class="body">' +
        // shoulders / tunic
        '<path d="M34 90 Q34 64 50 64 Q66 64 66 90 Z" fill="#1976d2"/>' +
        '<path d="M50 64 L50 90" stroke="#0d47a1" stroke-width="2"/>' +
        // belt
        '<rect x="36" y="80" width="28" height="6" rx="2" fill="#ffd700"/>' +
        // raised arm holding shield
        '<circle cx="74" cy="74" r="9" fill="#90a4ae"/>' +
        '<path d="M74 67 L74 81 M68 70 L80 78" stroke="#cfd8dc" stroke-width="2"/>' +
        '<path class="arm" d="M64 70 L74 74" stroke="#1976d2" stroke-width="7" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="head">' +
        // helmet
        '<path d="M37 50 Q37 36 50 36 Q63 36 63 50 Z" fill="#bdc8d4"/>' +
        '<rect x="36" y="48" width="28" height="5" rx="2" fill="#90a4ae"/>' +
        '<rect x="47" y="30" width="6" height="9" rx="2" fill="#ffd700"/>' +
        // face
        '<circle cx="50" cy="55" r="11" fill="#ffe0b2"/>' +
        eye(46, 54) + eye(54, 54) +
        '<path class="mouth" d="M45 60 Q50 64 55 60" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  // Cheeky balloon-enemy mascot — a grinning balloon with a knotted string.
  const balloonFoe =
    '<svg viewBox="0 0 100 100" class="foe" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // knot + wavy string
        '<path d="M50 76 L46 82 L54 82 Z" fill="#c62828"/>' +
        '<path class="string" d="M50 82 Q44 88 50 94 Q56 98 50 100" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M50 14 Q78 14 78 44 Q78 70 50 76 Q22 70 22 44 Q22 14 50 14 Z" fill="#ef5350"/>' +
        '<path d="M40 24 Q34 30 34 42" stroke="#ff8a80" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="head">' +
        eye(43, 42) + eye(57, 42) +
        // cheeky grin with tongue
        '<path class="mouth" d="M40 52 Q50 62 60 52 Z" fill="#7a1c1c"/>' +
        '<path d="M48 56 Q50 61 53 56 Z" fill="#ff5252"/>' +
        // eyebrows for mischief
        '<path d="M39 36 L47 38 M61 36 L53 38" stroke="' + OUT + '" stroke-width="2"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('fortguard', { svg: fortGuard, classPrefix: 'guard' });
  C.registerSpecies('balloonfoe', { svg: balloonFoe, classPrefix: 'foe' });
})();
