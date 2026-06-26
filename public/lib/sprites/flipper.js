// Học Vui — V12 "Lật Hình Trí Tuệ" sprite registry.
// Cheerful owl-professor mascot + a couple of decorative card-creature icons.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v12/style.css drives animation per state (idle / happy).
// NOTE: purely decorative — the matching cards keep using their own emoji/text.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[flipper.js] character.js must load first');
    return;
  }

  const OUT = '#4a2c6a';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy, r) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="' + (r || 2.6) + '" fill="' + OUT + '"/>';
  }

  // Main mascot — a wise, cheerful purple owl professor.
  const owl =
    '<svg viewBox="0 0 100 100" class="owl" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        // little graduation cap
        '<path d="M34 22 L66 22 L50 14 Z" fill="#3498db"/>' +
        '<rect x="44" y="20" width="12" height="5" rx="2" fill="#2c81ba"/>' +
        '<path class="tassel" d="M66 22 L70 34" stroke="#f39c12" stroke-width="2.5" fill="none"/>' +
        '<circle cx="70" cy="36" r="2.5" fill="#f39c12"/>' +
      '</g>' +
      '<g class="body">' +
        // feet
        '<path d="M40 84 L36 92 M44 84 L44 92 M48 84 L52 92" stroke="#f39c12" stroke-width="3"/>' +
        '<path d="M52 84 L48 92 M56 84 L56 92 M60 84 L64 92" stroke="#f39c12" stroke-width="3"/>' +
        // wings
        '<path class="wing wing-l" d="M28 50 Q18 58 26 76 Q34 70 34 56 Z" fill="#8e44ad"/>' +
        '<path class="wing wing-r" d="M72 50 Q82 58 74 76 Q66 70 66 56 Z" fill="#8e44ad"/>' +
        // belly
        '<ellipse cx="50" cy="58" rx="24" ry="28" fill="#9b59b6"/>' +
        '<ellipse cx="50" cy="64" rx="15" ry="18" fill="#d2b4de"/>' +
      '</g>' +
      '<g class="head">' +
        // ear tufts
        '<path d="M34 34 L30 24 L40 30 Z" fill="#8e44ad"/>' +
        '<path d="M66 34 L70 24 L60 30 Z" fill="#8e44ad"/>' +
        '<circle cx="50" cy="44" r="22" fill="#9b59b6"/>' +
        // eye discs
        '<circle cx="42" cy="44" r="9" fill="#fff"/>' +
        '<circle cx="58" cy="44" r="9" fill="#fff"/>' +
        eye(42, 44, 3.4) + eye(58, 44, 3.4) +
        '<circle cx="43.2" cy="42.8" r="1" fill="#fff"/>' +
        '<circle cx="59.2" cy="42.8" r="1" fill="#fff"/>' +
        // beak
        '<path d="M50 50 L46 56 L54 56 Z" fill="#f39c12"/>' +
      '</g>' +
    '</svg>';

  // Decorative card-creature: a friendly star sprite.
  const starpal =
    '<svg viewBox="0 0 100 100" class="pal" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<path d="M50 16 L60 40 L86 42 L66 60 L72 86 L50 72 L28 86 L34 60 L14 42 L40 40 Z" fill="#f1c40f"/>' +
      '</g>' +
      '<g class="head">' + eye(43, 50) + eye(57, 50) +
        '<path class="mouth" d="M44 60 Q50 66 56 60" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  // Decorative card-creature: a cheerful puzzle-piece buddy.
  const puzzlepal =
    '<svg viewBox="0 0 100 100" class="pal" ' + STROKE + ' aria-hidden="true">' +
      '<g class="body">' +
        '<path d="M30 32 L44 32 Q44 24 50 24 Q56 24 56 32 L70 32 L70 46 Q78 46 78 52 Q78 58 70 58 L70 72 L30 72 L30 58 Q22 58 22 52 Q22 46 30 46 Z" fill="#3498db"/>' +
      '</g>' +
      '<g class="head">' + eye(43, 50) + eye(57, 50) +
        '<path class="mouth" d="M44 60 Q50 65 56 60" stroke="' + OUT + '" stroke-width="2" fill="none"/></g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('owl', { svg: owl, classPrefix: 'owl' });
  C.registerSpecies('starpal', { svg: starpal, classPrefix: 'pal' });
  C.registerSpecies('puzzlepal', { svg: puzzlepal, classPrefix: 'pal' });
})();
