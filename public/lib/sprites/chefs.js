// Học Vui — V16 "Đầu Bếp Nhí" sprite registry.
// Chibi kid-chef avatar (toque + apron) + a friendly cooking-pot helper mascot.
// Each species is an SVG (viewBox 0 0 100 100) with named <g>: .body, .head, .accent.
// CSS in v16/style.css drives animation per state (idle / happy).
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.HocVuiCharacters) {
    console.warn('[chefs.js] character.js must load first');
    return;
  }

  const OUT = '#5a2410';
  const STROKE = 'stroke="' + OUT + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

  function eye(cx, cy) {
    return '<circle class="eye" cx="' + cx + '" cy="' + cy + '" r="2.4" fill="' + OUT + '"/>';
  }

  // Player avatar — a cheerful chibi kid chef with a white toque and apron.
  const chef =
    '<svg viewBox="0 0 100 100" class="chef" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<ellipse cx="50" cy="24" rx="20" ry="9" fill="#fff"/>' +
        '<circle cx="36" cy="19" r="9" fill="#fff"/>' +
        '<circle cx="50" cy="13" r="10" fill="#fff"/>' +
        '<circle cx="64" cy="19" r="9" fill="#fff"/>' +
        '<rect x="33" y="27" width="34" height="8" rx="3" fill="#fff"/>' +
      '</g>' +
      '<g class="head">' +
        '<circle cx="50" cy="46" r="15" fill="#ffd9a8"/>' +
        eye(44, 45) + eye(56, 45) +
        '<circle cx="40" cy="51" r="2.6" fill="#ff9e80" stroke="none"/>' +
        '<circle cx="60" cy="51" r="2.6" fill="#ff9e80" stroke="none"/>' +
        '<path class="mouth" d="M44 53 Q50 59 56 53" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M32 93 Q29 61 50 61 Q71 61 68 93 Z" fill="#f97316"/>' +
        '<path d="M41 62 L59 62 L62 93 L38 93 Z" fill="#fff"/>' +
        '<path d="M41 64 L35 58 M59 64 L65 58" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
        '<circle cx="33" cy="84" r="4.5" fill="#ffd9a8"/>' +
        '<circle cx="71" cy="80" r="4.5" fill="#ffd9a8"/>' +
        '<g class="spoon"><rect x="72" y="60" width="3.4" height="20" rx="1.7" fill="#b5713a"/>' +
          '<ellipse cx="73.7" cy="59" rx="4.6" ry="5.4" fill="#cd853f"/></g>' +
      '</g>' +
    '</svg>';

  // Helper mascot — a smiling cooking pot that steams while idling.
  const helper =
    '<svg viewBox="0 0 100 100" class="helper" ' + STROKE + ' aria-hidden="true">' +
      '<g class="accent">' +
        '<path class="steam" d="M40 26 Q36 18 42 12 M58 26 Q62 18 56 12" stroke="#fff" stroke-width="3" fill="none" opacity="0.8"/>' +
        '<ellipse cx="50" cy="40" rx="27" ry="8" fill="#e63946"/>' +
        '<rect x="46" y="30" width="8" height="7" rx="3" fill="#e63946"/>' +
      '</g>' +
      '<g class="body">' +
        '<path d="M26 46 Q26 80 50 80 Q74 80 74 46 Z" fill="#d62828"/>' +
        '<ellipse cx="20" cy="54" rx="6" ry="9" fill="none" stroke="' + OUT + '" stroke-width="3"/>' +
        '<ellipse cx="80" cy="54" rx="6" ry="9" fill="none" stroke="' + OUT + '" stroke-width="3"/>' +
      '</g>' +
      '<g class="head">' +
        eye(43, 56) + eye(57, 56) +
        '<path class="mouth" d="M44 63 Q50 69 56 63" stroke="' + OUT + '" stroke-width="2" fill="none"/>' +
      '</g>' +
    '</svg>';

  const C = window.HocVuiCharacters;
  C.registerSpecies('chef', { svg: chef, classPrefix: 'chef' });
  C.registerSpecies('helper', { svg: helper, classPrefix: 'helper' });
})();
